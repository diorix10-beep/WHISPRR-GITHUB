import {singleRpcRecord} from '../src/lib/rpcRecord.js';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { uuid } from './_lib/requestProtection.js';

type NodeRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type NodeResponse = {
  status: (statusCode: number) => NodeResponse;
  json: (body: unknown) => void;
  send: (body?: unknown) => void;
};

type ShardsPackageId = 'spark' | 'constellation' | 'odyssey' | 'legend';

const SHARDS_PACKAGES: Record<ShardsPackageId, { label: string; shards: number; bonus: number; amountCents: number }> = {
  spark: { label: 'Spark Pack', shards: 500, bonus: 0, amountCents: 499 },
  constellation: { label: 'Constellation Pack', shards: 1200, bonus: 120, amountCents: 999 },
  odyssey: { label: 'Odyssey Pack', shards: 3000, bonus: 450, amountCents: 1999 },
  legend: { label: 'Legend Pack', shards: 8000, bonus: 1600, amountCents: 3999 },
};

export default async function handler(req: NodeRequest, res: NodeResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const authorization = req.headers.authorization;
  const authHeader = Array.isArray(authorization) ? authorization[0] : authorization;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
  if (!authHeader || !supabaseUrl || !supabaseAnonKey) return res.status(401).json({ error: 'Authentication is required.' });
  if (!serviceRoleKey || !stripeSecretKey) return res.status(503).json({ error: 'SHARDS checkout is being configured. No payment has been started.' });

  const userSupabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await userSupabase.auth.getUser();
  if (userError || !user) return res.status(401).json({ error: 'Authentication is required.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { package_id } = (body || {}) as { package_id?: string };
    const retryHeader = req.headers['idempotency-key'];
    const requestId = Array.isArray(retryHeader) ? retryHeader[0] : retryHeader;
    if (!uuid(requestId)) return res.status(400).json({ error: 'A checkout retry identifier is required.' });
    if (!package_id || !Object.prototype.hasOwnProperty.call(SHARDS_PACKAGES,package_id)) return res.status(400).json({ error: 'Choose a valid SHARDS package.' });

    const pack = SHARDS_PACKAGES[package_id as ShardsPackageId];
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const appUrl = process.env.CHIMERA_APP_URL;
    if (!appUrl) return res.status(503).json({ error:'The checkout return address is not configured. No payment has been started.' });
    const destination = new URL(appUrl);
    if (destination.protocol !== 'https:' || destination.username || destination.password || destination.pathname !== '/' || destination.search || destination.hash) return res.status(503).json({error:'The checkout return address is invalid.'});
    const { data: rawOrder, error: orderError } = await adminSupabase.rpc('prepare_chimera_shards_order',{
      p_user_id:user.id,p_request_id:requestId,p_package_id:package_id,p_shards:pack.shards,p_bonus:pack.bonus,p_amount:pack.amountCents,
    });
    const order=singleRpcRecord<{id:string;status:string;stripe_checkout_session_id:string|null;created_at:string}>(rawOrder);
    if (orderError || !order) throw new Error('CHIMERA could not prepare this SHARDS order.');
    if (order.status !== 'pending') return res.status(409).json({resolved:true,error:'This checkout has already been resolved. Review your wallet before starting a new purchase.'});
    const stripe = new Stripe(stripeSecretKey, { typescript: true });
    if(order.stripe_checkout_session_id){
      const existing=await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);
      if(existing.status==='open' && existing.url)return res.status(200).json({checkout_url:existing.url,package:{id:package_id,shards:pack.shards+pack.bonus}});
      if(existing.status==='complete')return res.status(409).json({error:'This payment is awaiting wallet confirmation. Review your wallet before another purchase.'});
      if(existing.status==='expired'){
        const {error}=await adminSupabase.from('shards_purchase_orders').update({status:'failed'}).eq('id',order.id).eq('status','pending');
        if(error)throw error;return res.status(409).json({resolved:true,error:'This checkout expired. No new payment was started. You may start a new purchase.'});
      }
    }
    if(Date.now()-Date.parse(order.created_at)>23*60*60*1000)return res.status(409).json({error:'This unconfirmed order requires support review before retrying. No new checkout was started.'});
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
      success_url: `${destination.origin}/shards?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${destination.origin}/shards?checkout=cancelled`,
    }, { idempotencyKey:`chimera-shards-${order.id}` });

    if (!session.url) throw new Error('Stripe did not return a checkout URL.');
    const { error: sessionError } = await adminSupabase
      .from('shards_purchase_orders')
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq('id', order.id);
    if (sessionError) throw new Error('CHIMERA could not secure this checkout session.');

    return res.status(200).json({ checkout_url: session.url, package: { id: package_id, shards: totalShards } });
  } catch {
    return res.status(500).json({ error: 'CHIMERA could not start checkout. Retry the same purchase; no wallet credit occurs without verified payment.' });
  }
}
