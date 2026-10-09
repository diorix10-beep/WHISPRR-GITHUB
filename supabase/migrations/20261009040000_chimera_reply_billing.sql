-- CHIMERA: charging SHARDS for a reply written by a paid model (Model House).
--
-- One charge belongs to one AI request (chimera_private.ai_requests), so a retry of the same request can
-- never be charged twice, and a request that fails is refunded. All three functions are for the server
-- only (service role): members cannot spend, refund or move SHARDS themselves. The wallet and ledger
-- tables are unchanged and stay read-only for members through the existing row-level security.

CREATE TABLE IF NOT EXISTS chimera_private.shards_charges (
  request_id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  model_id text NOT NULL,
  state text NOT NULL CHECK (state IN ('charged', 'refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE chimera_private.shards_charges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON chimera_private.shards_charges FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS shards_charges_user_open_idx ON chimera_private.shards_charges (user_id) WHERE state = 'charged';

-- Gives the SHARDS of one charge back, once. Nothing is returned for a reply that was delivered.
CREATE OR REPLACE FUNCTION chimera_private.refund_charge(p_request_id uuid, p_lease uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_charge chimera_private.shards_charges;
  v_request chimera_private.ai_requests;
  v_found_request boolean;
BEGIN
  -- Same lock order as charge_chimera_reply: request, then charge, then wallet.
  SELECT * INTO v_request FROM chimera_private.ai_requests WHERE id = p_request_id FOR UPDATE;
  v_found_request := FOUND;
  SELECT * INTO v_charge FROM chimera_private.shards_charges WHERE request_id = p_request_id FOR UPDATE;
  IF NOT FOUND OR v_charge.state <> 'charged' THEN RETURN false; END IF;

  IF v_found_request THEN
    -- The reply was saved: the member got what they paid for.
    IF v_request.state = 'completed' THEN RETURN false; END IF;
    -- Another attempt has taken the request over and owns its charge now.
    IF p_lease IS NOT NULL AND v_request.lease <> p_lease THEN RETURN false; END IF;
  END IF;

  UPDATE public.shards_wallets
  SET available_balance = available_balance + v_charge.amount,
      lifetime_spent = GREATEST(lifetime_spent - v_charge.amount, 0),
      updated_at = now()
  WHERE user_id = v_charge.user_id;

  INSERT INTO public.shards_ledger (wallet_user_id, amount, entry_type, description, reference_type, reference_id)
  VALUES (v_charge.user_id, v_charge.amount, 'refund', 'Reply refund: the reply was not delivered.', 'chat_reply', p_request_id);

  UPDATE chimera_private.shards_charges SET state = 'refunded', updated_at = now() WHERE request_id = p_request_id;
  RETURN true;
END;
$$;

-- Charges whose request ended without a reply (the server stopped before it could refund) are given back.
CREATE OR REPLACE FUNCTION chimera_private.refund_stale_charges(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.request_id FROM chimera_private.shards_charges c
    WHERE c.user_id = p_user_id AND c.state = 'charged'
      AND NOT EXISTS (
        SELECT 1 FROM chimera_private.ai_requests q
        WHERE q.id = c.request_id AND (q.state = 'completed' OR (q.state = 'running' AND q.expires_at > now()))
      )
  LOOP
    PERFORM chimera_private.refund_charge(r.request_id, NULL);
  END LOOP;
END;
$$;

-- Takes the price of one reply from the member's wallet, atomically. Safe to call again for the same
-- request: the second call finds the open charge and takes nothing more.
CREATE OR REPLACE FUNCTION public.charge_chimera_reply(p_request_id uuid, p_lease uuid, p_amount integer, p_model text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_request chimera_private.ai_requests;
  v_charge chimera_private.shards_charges;
  v_balance bigint;
BEGIN
  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 10000 OR p_model IS NULL OR char_length(p_model) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Invalid reply price';
  END IF;

  SELECT * INTO v_request FROM chimera_private.ai_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR v_request.lease <> p_lease OR v_request.operation <> 'chat' OR v_request.state <> 'running' OR v_request.expires_at <= now() THEN
    RAISE EXCEPTION 'Invalid chat reservation';
  END IF;

  PERFORM chimera_private.refund_stale_charges(v_request.user_id);

  SELECT * INTO v_charge FROM chimera_private.shards_charges WHERE request_id = p_request_id FOR UPDATE;
  IF FOUND AND v_charge.state = 'charged' THEN
    SELECT available_balance INTO v_balance FROM public.shards_wallets WHERE user_id = v_request.user_id;
    RETURN COALESCE(v_balance, 0);
  END IF;

  SELECT available_balance INTO v_balance FROM public.shards_wallets WHERE user_id = v_request.user_id FOR UPDATE;
  IF v_balance IS NULL THEN RAISE EXCEPTION 'The SHARDS wallet is not ready for this account.'; END IF;
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_shards' USING ERRCODE = 'CH402';
  END IF;

  UPDATE public.shards_wallets
  SET available_balance = available_balance - p_amount,
      lifetime_spent = lifetime_spent + p_amount,
      updated_at = now()
  WHERE user_id = v_request.user_id
  RETURNING available_balance INTO v_balance;

  INSERT INTO public.shards_ledger (wallet_user_id, amount, entry_type, description, reference_type, reference_id)
  VALUES (v_request.user_id, -p_amount, 'creative_spend', 'Reply written by ' || p_model, 'chat_reply', p_request_id);

  INSERT INTO chimera_private.shards_charges (request_id, user_id, amount, model_id, state)
  VALUES (p_request_id, v_request.user_id, p_amount, p_model, 'charged')
  ON CONFLICT (request_id) DO UPDATE
    SET amount = EXCLUDED.amount, model_id = EXCLUDED.model_id, state = 'charged', updated_at = now();

  RETURN v_balance;
END;
$$;

-- Gives the SHARDS back when a reply could not be delivered. Does nothing if there is nothing to give back.
CREATE OR REPLACE FUNCTION public.refund_chimera_reply(p_request_id uuid, p_lease uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT chimera_private.refund_charge(p_request_id, p_lease);
$$;

REVOKE ALL ON FUNCTION chimera_private.refund_charge(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION chimera_private.refund_stale_charges(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.charge_chimera_reply(uuid, uuid, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_chimera_reply(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.charge_chimera_reply(uuid, uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_chimera_reply(uuid, uuid) TO service_role;
