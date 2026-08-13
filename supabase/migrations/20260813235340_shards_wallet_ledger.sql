-- ============================================================
-- SHARDS — persistent wallet and append-only transaction ledger
-- Welcome credit: 1,000 SHARDS once per human account.
-- No cash payout, purchases, referral, or daily-reward mechanic is enabled
-- by this migration. Those require their own approved server-side flows.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shards_wallets (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  available_balance bigint NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  lifetime_earned bigint NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
  lifetime_spent bigint NOT NULL DEFAULT 0 CHECK (lifetime_spent >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shards_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_user_id uuid NOT NULL REFERENCES public.shards_wallets(user_id) ON DELETE RESTRICT,
  amount bigint NOT NULL CHECK (amount <> 0),
  entry_type text NOT NULL CHECK (entry_type IN (
    'welcome_credit', 'purchase_credit', 'creative_spend', 'creator_tip_sent',
    'creator_tip_received', 'refund', 'manual_adjustment'
  )),
  status text NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'reversed')),
  description text NOT NULL,
  reference_type text,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS shards_one_welcome_credit_per_wallet
  ON public.shards_ledger (wallet_user_id, entry_type)
  WHERE entry_type = 'welcome_credit' AND status = 'posted';
CREATE INDEX IF NOT EXISTS shards_ledger_wallet_created_at_idx
  ON public.shards_ledger (wallet_user_id, created_at DESC);

ALTER TABLE public.shards_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shards_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_shards_wallet" ON public.shards_wallets
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "read_own_shards_ledger" ON public.shards_ledger
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = wallet_user_id);

-- There are deliberately no browser-side INSERT, UPDATE, or DELETE policies.
-- Balances only change inside approved SECURITY DEFINER transaction functions.

CREATE OR REPLACE FUNCTION public.provision_shards_wallet(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH created_wallet AS (
    INSERT INTO public.shards_wallets (user_id, available_balance, lifetime_earned)
    VALUES (p_user_id, 1000, 1000)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING user_id
  )
  INSERT INTO public.shards_ledger (wallet_user_id, amount, entry_type, description)
  SELECT user_id, 1000, 'welcome_credit', 'Welcome to CHIMERA — 1,000 SHARDS'
  FROM created_wallet;
END;
$$;

REVOKE ALL ON FUNCTION public.provision_shards_wallet(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.handle_new_shards_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.provision_shards_wallet(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_shards_wallet ON public.profiles;
CREATE TRIGGER on_new_shards_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_shards_wallet();

-- Give the same one-time welcome credit to existing human accounts. AI bot
-- profiles are excluded: SHARDS belong to product users, not characters.
DO $$
DECLARE
  profile_row record;
BEGIN
  FOR profile_row IN
    SELECT user_id FROM public.profiles WHERE COALESCE(role, '') <> 'ai_character'
  LOOP
    PERFORM public.provision_shards_wallet(profile_row.user_id);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_shards_wallet()
RETURNS TABLE (
  available_balance bigint,
  lifetime_earned bigint,
  lifetime_spent bigint
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT available_balance, lifetime_earned, lifetime_spent
  FROM public.shards_wallets
  WHERE user_id = (select auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.get_my_shards_wallet() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_shards_ledger(p_limit integer DEFAULT 50)
RETURNS SETOF public.shards_ledger
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT *
  FROM public.shards_ledger
  WHERE wallet_user_id = (select auth.uid())
  ORDER BY created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.get_my_shards_ledger(integer) TO authenticated;
