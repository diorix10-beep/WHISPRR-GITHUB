-- ============================================================
-- One WHISPRR Account + CHIMERA creative-mode onboarding
-- ============================================================

-- Accounts are identities for the whole ecosystem. A user may choose one
-- product as their home without being locked out of the other product.
ALTER TABLE public.profiles
  ALTER COLUMN access_level SET DEFAULT 'ecosystem';

UPDATE public.profiles
SET access_level = 'ecosystem'
WHERE access_level IS DISTINCT FROM 'ecosystem';

-- Do not derive product access from user-editable signup metadata. Every new
-- account is an ecosystem account; each product keeps its own private state.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, onboarding_complete, access_level)
  VALUES (NEW.id, '', false, 'ecosystem');
  RETURN NEW;
END;
$$;

ALTER TABLE public.chimera_user_preferences
  ADD COLUMN IF NOT EXISTS creative_preference text,
  ADD COLUMN IF NOT EXISTS default_creative_mode text NOT NULL DEFAULT 'roleplay',
  ADD COLUMN IF NOT EXISTS last_creative_mode text NOT NULL DEFAULT 'roleplay',
  ADD COLUMN IF NOT EXISTS chimera_onboarding_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS both_mode_welcome_seen boolean NOT NULL DEFAULT false;

ALTER TABLE public.chimera_user_preferences
  DROP CONSTRAINT IF EXISTS chimera_user_preferences_creative_preference_check,
  DROP CONSTRAINT IF EXISTS chimera_user_preferences_default_creative_mode_check,
  DROP CONSTRAINT IF EXISTS chimera_user_preferences_last_creative_mode_check;

ALTER TABLE public.chimera_user_preferences
  ADD CONSTRAINT chimera_user_preferences_creative_preference_check
    CHECK (creative_preference IS NULL OR creative_preference IN ('roleplay', 'storytelling', 'both')),
  ADD CONSTRAINT chimera_user_preferences_default_creative_mode_check
    CHECK (default_creative_mode IN ('roleplay', 'storytelling')),
  ADD CONSTRAINT chimera_user_preferences_last_creative_mode_check
    CHECK (last_creative_mode IN ('roleplay', 'storytelling'));

-- Existing people keep uninterrupted access. New accounts get the new
-- CHIMERA-specific onboarding without changing WHISPRR's social onboarding.
UPDATE public.chimera_user_preferences preferences
SET
  creative_preference = COALESCE(preferences.creative_preference, 'roleplay'),
  chimera_onboarding_complete = true,
  both_mode_welcome_seen = true
FROM public.profiles profiles
WHERE profiles.user_id = preferences.user_id
  AND profiles.onboarding_complete = true;
