-- CHIMERA character publication creates a dedicated profile for each AI
-- character. Keep the profile role constraint aligned with that contract.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('founder', 'admin', 'moderator', 'user', 'ai_character'));
