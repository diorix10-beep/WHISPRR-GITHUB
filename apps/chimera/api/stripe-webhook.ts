import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

type NodeRequest = AsyncIterable<Uint8Array> & {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type NodeResponse = {
  status: (statusCode: number) => NodeResponse;
  json: (body: unknown) => void;
  send: (body?: unknown) => void;
};

async function rawBody(req: NodeRequest) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export const config = { api: { bodyParser: false } };

export default async function handler(req: NodeRequest, res: NodeResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const stripeSignature = req.headers['stripe-signature'];
  const signature = Array.isArray(stripeSignature) ? stripeSignature[0] : stripeSignature;
  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) return res.status(503).json({ error: 'Webhook is not configured.' });
  if (!signature) return res.status(400).json({ error: 'Missing Stripe signature.' });

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeSecretKey, { typescript: true });
    event = stripe.webhooks.constructEvent(await rawBody(req), signature, webhookSecret);
  } catch (error) {
    console.error('Invalid Stripe webhook signature', error);
    return res.status(400).json({ error: 'Invalid Stripe signature.' });
  }

  if (event.type !== 'checkout.session.completed') return res.status(200).json({ received: true });

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.chimera_order_id;
    const expectedUserId = session.metadata?.chimera_user_id;
    if (!orderId || !expectedUserId || session.payment_status !== 'paid') {
      console.error('Rejected incomplete SHARDS checkout event', { eventId: event.id, sessionId: session.id });
      return res.status(400).json({ error: 'This checkout cannot be fulfilled.' });
    }
    if (session.client_reference_id !== expectedUserId) return res.status(400).json({ error: 'Checkout owner mismatch.' });

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null;
    const { error: fulfillError } = await adminSupabase.rpc('fulfill_shards_purchase', {
      p_order_id: orderId,
      p_stripe_checkout_session_id: session.id,
      p_stripe_payment_intent_id: paymentIntentId,
    });
    if (fulfillError) throw fulfillError;
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Could not fulfil SHARDS purchase', error);
    // Stripe retries non-2xx responses, which is exactly what we want for a transient database failure.
    return res.status(500).json({ error: 'CHIMERA could not fulfil this purchase yet.' });
  }
}
