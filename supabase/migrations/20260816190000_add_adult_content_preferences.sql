-- The Guardian's Library: account-level mature-content preferences.
-- Both values are opt-in and default to the safest state for every existing member.
ALTER TABLE public.chimera_user_preferences
  ADD COLUMN IF NOT EXISTS adult_content_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS adult_eligibility_confirmed_at timestamptz;
