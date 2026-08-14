import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

type ShardsPackageId = 'spark' | 'constellation' | 'odyssey' | 'legend';

const SHARDS_PACKAGES: Record<ShardsPackageId, { label: string; shards: number; bonus: number; amountCents: number }> = {
  spark: { label: 'Spark Pack', shards: 500, bonus: 0, amountCents: 499 },
  constellation: { label: 'Constellation Pack', shards: 1200, bonus: 120, amountCents: 999 },
  odyssey: { label: 'Odyssey Pack', shards: 3000, bonus: 450, amountCents: 1999 },
  legend: { label: 'Legend Pack', shards: 8000, bonus: 1600, amountCents: 3999 },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const authHeader = req.headers.get('Authorization');
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
  if (!authHeader || !supabaseUrl || !supabaseAnonKey) return jsonResponse({ error: 'Authentication is required.' }, 401);
  if (!serviceRoleKey || !stripeSecretKey) return jsonResponse({ error: 'SHARDS checkout is being configured. No payment has been started.' }, 503);

  const userSupabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await userSupabase.auth.getUser();
  if (userError || !user) return jsonResponse({ error: 'Authentication is required.' }, 401);

  try {
    const { package_id } = await req.json() as { package_id?: string };
    if (!package_id || !(package_id in SHARDS_PACKAGES)) return jsonResponse({ error: 'Choose a valid SHARDS package.' }, 400);

    const pack = SHARDS_PACKAGES[package_id as ShardsPackageId];
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: order, error: orderError } = await adminSupabase
      .from('shards_purchase_orders')
      .insert({ user_id: user.id, package_id, shards_amount: pack.shards, bonus_shards: pack.bonus, amount_cents: pack.amountCents })
      .select('id')
      .single();
    if (orderError || !order) throw new Error('CHIMERA could not prepare this SHARDS order.');

    const stripe = new Stripe(stripeSecretKey, { typescript: true });
    const appUrl = (process.env.CHIMERA_APP_URL || new URL(req.url).origin).replace(/\/$/, '');
    const totalShards = pack.shards + pack.bonus;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: { chimera_order_id: order.id, chimera_user_id: user.id, package_id },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: pack.amountCents,
          product_data: {
            name: `CHIMERA SHARDS — ${pack.label}`,
            description: `${pack.shards.toLocaleString()} SHARDS${pack.bonus ? ` + ${pack.bonus.toLocaleString()} bonus` : ''}`,
          },
        },
      }],
      success_url: `${appUrl}/shards?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/shards?checkout=cancelled`,
    });

    if (!session.url) throw new Error('Stripe did not return a checkout URL.');
    const { error: sessionError } = await adminSupabase
      .from('shards_purchase_orders')
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq('id', order.id);
    if (sessionError) throw new Error('CHIMERA could not secure this checkout session.');

    return jsonResponse({ checkout_url: session.url, package: { id: package_id, shards: totalShards } });
  } catch (error) {
    console.error('Could not create SHARDS checkout', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'CHIMERA could not start checkout.' }, 500);
  }
}
