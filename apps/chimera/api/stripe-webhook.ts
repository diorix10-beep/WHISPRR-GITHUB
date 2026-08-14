import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const signature = req.headers.get('stripe-signature');
  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) return jsonResponse({ error: 'Webhook is not configured.' }, 503);
  if (!signature) return jsonResponse({ error: 'Missing Stripe signature.' }, 400);

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeSecretKey, { typescript: true });
    event = stripe.webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch (error) {
    console.error('Invalid Stripe webhook signature', error);
    return jsonResponse({ error: 'Invalid Stripe signature.' }, 400);
  }

  if (event.type !== 'checkout.session.completed') return jsonResponse({ received: true });

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.chimera_order_id;
    const expectedUserId = session.metadata?.chimera_user_id;
    if (!orderId || !expectedUserId || session.payment_status !== 'paid') {
      console.error('Rejected incomplete SHARDS checkout event', { eventId: event.id, sessionId: session.id });
      return jsonResponse({ error: 'This checkout cannot be fulfilled.' }, 400);
    }
    if (session.client_reference_id !== expectedUserId) return jsonResponse({ error: 'Checkout owner mismatch.' }, 400);

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null;
    const { error: fulfillError } = await adminSupabase.rpc('fulfill_shards_purchase', {
      p_order_id: orderId,
      p_stripe_checkout_session_id: session.id,
      p_stripe_payment_intent_id: paymentIntentId,
    });
    if (fulfillError) throw fulfillError;
    return jsonResponse({ received: true });
  } catch (error) {
    console.error('Could not fulfil SHARDS purchase', error);
    // Stripe retries non-2xx responses, which is exactly what we want for a transient database failure.
    return jsonResponse({ error: 'CHIMERA could not fulfil this purchase yet.' }, 500);
  }
}
