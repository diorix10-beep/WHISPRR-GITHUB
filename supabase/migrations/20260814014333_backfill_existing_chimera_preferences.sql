-- Preserve uninterrupted CHIMERA access for profiles created before
-- chimera_user_preferences was introduced or before creative-mode onboarding.
INSERT INTO public.chimera_user_preferences (
  user_id,
  creative_preference,
  default_creative_mode,
  last_creative_mode,
  chimera_onboarding_complete,
  both_mode_welcome_seen
)
SELECT
  profiles.user_id,
  'roleplay',
  'roleplay',
  'roleplay',
  true,
  true
FROM public.profiles profiles
ON CONFLICT (user_id) DO UPDATE
SET
  creative_preference = COALESCE(public.chimera_user_preferences.creative_preference, 'roleplay'),
  chimera_onboarding_complete = true,
  both_mode_welcome_seen = true;
