-- VELLUM is the separate, Storytelling-only creative reserve.
-- It is intentionally not a cash balance, a transferable currency, or a requirement to write.

CREATE TABLE IF NOT EXISTS public.vellum_wallets (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  available_balance bigint NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  lifetime_earned bigint NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
  lifetime_spent bigint NOT NULL DEFAULT 0 CHECK (lifetime_spent >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vellum_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_user_id uuid NOT NULL REFERENCES public.vellum_wallets(user_id) ON DELETE CASCADE,
  amount bigint NOT NULL CHECK (amount <> 0),
  entry_type text NOT NULL CHECK (entry_type IN ('welcome_credit', 'creative_spend', 'refund', 'manual_adjustment')),
  status text NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'reversed')),
  description text NOT NULL,
  reference_type text,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vellum_ledger_wallet_created_at_idx
  ON public.vellum_ledger (wallet_user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS vellum_one_welcome_credit_per_wallet_idx
  ON public.vellum_ledger (wallet_user_id)
  WHERE entry_type = 'welcome_credit' AND status = 'posted';

ALTER TABLE public.vellum_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vellum_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_vellum_wallet" ON public.vellum_wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "select_own_vellum_ledger" ON public.vellum_ledger
  FOR SELECT TO authenticated USING (wallet_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.provision_vellum_wallet(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  did_create boolean := false;
BEGIN
  INSERT INTO public.vellum_wallets (user_id, available_balance, lifetime_earned)
  VALUES (p_user_id, 10000, 10000)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING true INTO did_create;

  IF did_create THEN
    INSERT INTO public.vellum_ledger (wallet_user_id, amount, entry_type, description)
    VALUES (p_user_id, 10000, 'welcome_credit', 'Welcome to VELLUM — your Storytelling reserve.');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.provision_vellum_wallet(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.handle_new_vellum_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.role, 'user') <> 'ai_character' THEN
    PERFORM public.provision_vellum_wallet(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_vellum_wallet() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_new_vellum_wallet ON public.profiles;
CREATE TRIGGER on_new_vellum_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_vellum_wallet();

-- Backfill all human accounts exactly once.
SELECT public.provision_vellum_wallet(user_id)
FROM public.profiles
WHERE COALESCE(role, 'user') <> 'ai_character';

CREATE OR REPLACE FUNCTION public.get_my_vellum_wallet()
RETURNS TABLE (
  available_balance bigint,
  lifetime_earned bigint,
  lifetime_spent bigint,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT w.available_balance, w.lifetime_earned, w.lifetime_spent, w.created_at
  FROM public.vellum_wallets w
  WHERE w.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_vellum_ledger(p_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  amount bigint,
  entry_type text,
  status text,
  description text,
  reference_type text,
  reference_id uuid,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT l.id, l.amount, l.entry_type, l.status, l.description, l.reference_type, l.reference_id, l.created_at
  FROM public.vellum_ledger l
  WHERE l.wallet_user_id = auth.uid()
  ORDER BY l.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.get_my_vellum_wallet() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_vellum_ledger(integer) TO authenticated;
