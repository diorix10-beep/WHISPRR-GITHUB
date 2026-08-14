-- VELLUM is earned only by entering CHIMERA Storytelling (or choosing Both)
-- and completing the CHIMERA creative-space onboarding. Existing VELLUM
-- wallets are deliberately preserved: this migration only changes future
-- eligibility and backfills an eligible account that somehow lacks a wallet.

DROP TRIGGER IF EXISTS on_new_vellum_wallet ON public.profiles;

CREATE OR REPLACE FUNCTION public.provision_vellum_wallet(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  did_create boolean := false;
BEGIN
  -- This function is not callable by clients. Keep eligibility in the
  -- database as a second line of defense beyond the onboarding UI.
  IF NOT EXISTS (
    SELECT 1
    FROM public.chimera_user_preferences preferences
    WHERE preferences.user_id = p_user_id
      AND preferences.chimera_onboarding_complete = true
      AND preferences.creative_preference IN ('storytelling', 'both')
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.vellum_wallets (user_id, available_balance, lifetime_earned)
  VALUES (p_user_id, 10000, 10000)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING true INTO did_create;

  IF did_create THEN
    INSERT INTO public.vellum_ledger (wallet_user_id, amount, entry_type, description)
    VALUES (
      p_user_id,
      10000,
      'welcome_credit',
      'Welcome to VELLUM — your permanent Storytelling welcome reserve.'
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.provision_vellum_wallet(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.handle_storytelling_vellum_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.chimera_onboarding_complete = true
     AND NEW.creative_preference IN ('storytelling', 'both') THEN
    PERFORM public.provision_vellum_wallet(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_storytelling_vellum_eligibility() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_storytelling_vellum_eligibility ON public.chimera_user_preferences;
CREATE TRIGGER on_storytelling_vellum_eligibility
  AFTER INSERT OR UPDATE OF creative_preference, chimera_onboarding_complete
  ON public.chimera_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_storytelling_vellum_eligibility();

-- Safety backfill for any eligible account that does not already have a
-- VELLUM wallet. The unique wallet primary key and welcome-credit index keep
-- this one-time grant idempotent.
SELECT public.provision_vellum_wallet(preferences.user_id)
FROM public.chimera_user_preferences preferences
WHERE preferences.chimera_onboarding_complete = true
  AND preferences.creative_preference IN ('storytelling', 'both');
