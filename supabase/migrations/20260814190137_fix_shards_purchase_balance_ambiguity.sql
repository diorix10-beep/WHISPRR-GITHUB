-- The output column `available_balance` from RETURNS TABLE shares its name with
-- the wallet column. Qualify the wallet column so PL/pgSQL never interprets it
-- as the output variable while fulfilling a verified Stripe purchase.
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
    SELECT wallet.available_balance INTO v_balance
    FROM public.shards_wallets AS wallet
    WHERE wallet.user_id = v_order.user_id;
    RETURN QUERY SELECT COALESCE(v_balance, 0), v_credit, true;
    RETURN;
  END IF;

  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'This SHARDS order cannot be fulfilled.';
  END IF;

  UPDATE public.shards_wallets AS wallet
  SET available_balance = wallet.available_balance + v_credit,
      lifetime_earned = wallet.lifetime_earned + v_credit,
      updated_at = now()
  WHERE wallet.user_id = v_order.user_id
  RETURNING wallet.available_balance INTO v_balance;

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
