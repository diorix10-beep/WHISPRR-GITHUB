-- ============================================================
-- SHARDS — verified Stripe purchase fulfilment
-- Orders are created only by CHIMERA's authenticated server route.
-- A signed Stripe webhook is the sole path that can credit a purchase.
-- ============================================================

CREATE TABLE public.shards_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE RESTRICT,
  package_id text NOT NULL CHECK (package_id IN ('spark', 'constellation', 'odyssey', 'legend')),
  shards_amount integer NOT NULL CHECK (shards_amount > 0),
  bonus_shards integer NOT NULL DEFAULT 0 CHECK (bonus_shards >= 0),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'usd' CHECK (currency = 'usd'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text UNIQUE,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX shards_purchase_orders_user_created_idx
  ON public.shards_purchase_orders (user_id, created_at DESC);

CREATE INDEX shards_purchase_orders_pending_idx
  ON public.shards_purchase_orders (status, created_at)
  WHERE status = 'pending';

ALTER TABLE public.shards_purchase_orders ENABLE ROW LEVEL SECURITY;

-- No browser policies: an order contains payment information and is created /
-- fulfilled exclusively by trusted server-side routes.

CREATE UNIQUE INDEX shards_one_purchase_credit_per_order
  ON public.shards_ledger (wallet_user_id, reference_type, reference_id)
  WHERE entry_type = 'purchase_credit' AND status = 'posted';

CREATE OR REPLACE FUNCTION public.fulfill_shards_purchase(
  p_order_id uuid,
  p_stripe_checkout_session_id text,
  p_stripe_payment_intent_id text DEFAULT NULL
)
RETURNS TABLE (
  available_balance bigint,
  credited_shards integer,
  already_fulfilled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.shards_purchase_orders;
  v_balance bigint;
  v_credit integer;
BEGIN
  SELECT * INTO v_order
  FROM public.shards_purchase_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SHARDS order was not found.';
  END IF;

  IF v_order.stripe_checkout_session_id IS DISTINCT FROM p_stripe_checkout_session_id THEN
    RAISE EXCEPTION 'Checkout session does not belong to this SHARDS order.';
  END IF;

  v_credit := v_order.shards_amount + v_order.bonus_shards;

  IF v_order.status = 'paid' THEN
    SELECT available_balance INTO v_balance
    FROM public.shards_wallets
    WHERE user_id = v_order.user_id;
    RETURN QUERY SELECT COALESCE(v_balance, 0), v_credit, true;
    RETURN;
  END IF;

  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'This SHARDS order cannot be fulfilled.';
  END IF;

  UPDATE public.shards_wallets
  SET available_balance = available_balance + v_credit,
      lifetime_earned = lifetime_earned + v_credit,
      updated_at = now()
  WHERE user_id = v_order.user_id
  RETURNING available_balance INTO v_balance;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'The SHARDS wallet is not ready for this account.';
  END IF;

  INSERT INTO public.shards_ledger (
    wallet_user_id, amount, entry_type, description, reference_type, reference_id
  ) VALUES (
    v_order.user_id,
    v_credit,
    'purchase_credit',
    format('SHARDS purchase — %s%s', v_order.package_id, CASE WHEN v_order.bonus_shards > 0 THEN format(' + %s bonus', v_order.bonus_shards) ELSE '' END),
    'stripe_checkout',
    v_order.id
  );

  UPDATE public.shards_purchase_orders
  SET status = 'paid',
      stripe_payment_intent_id = COALESCE(p_stripe_payment_intent_id, stripe_payment_intent_id),
      paid_at = now(),
      updated_at = now()
  WHERE id = v_order.id;

  RETURN QUERY SELECT v_balance, v_credit, false;
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_shards_purchase(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fulfill_shards_purchase(uuid, text, text) TO service_role;
