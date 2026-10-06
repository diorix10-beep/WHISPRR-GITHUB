-- Age-verification gate for Mature / NSFW content.
--
-- Until now `adult_content_enabled` was a self-declared toggle that nothing on
-- the server enforced. From this migration on:
--   * every account starts as 'unverified';
--   * only a trusted server flow (service_role / postgres) can mark an account
--     'verified_adult' — members can never write the verification columns;
--   * adult content can be switched on only for a verified adult, and the
--     database enforces that for every writer.
-- The verification provider itself is not connected yet. Until it is, no one is
-- 'verified_adult', so Mature / NSFW stays off for everyone (SFW only).

ALTER TABLE public.chimera_user_preferences
  ADD COLUMN IF NOT EXISTS age_verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS age_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS age_verification_provider text,
  ADD COLUMN IF NOT EXISTS age_verification_reference text;

ALTER TABLE public.chimera_user_preferences
  DROP CONSTRAINT IF EXISTS chimera_user_preferences_age_verification_status_check;
ALTER TABLE public.chimera_user_preferences
  ADD CONSTRAINT chimera_user_preferences_age_verification_status_check
  CHECK (age_verification_status IN ('unverified', 'verified_adult'));

-- Guard trigger. It runs as the caller (SECURITY INVOKER) so `current_user`
-- tells us whether the write came through the API as a member.
CREATE OR REPLACE FUNCTION public.guard_chimera_adult_content()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_member_write boolean := current_user IN ('authenticated', 'anon');
  v_verified boolean;
BEGIN
  IF v_member_write THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.age_verification_status IS DISTINCT FROM 'unverified'
         OR NEW.age_verified_at IS NOT NULL
         OR NEW.age_verification_provider IS NOT NULL
         OR NEW.age_verification_reference IS NOT NULL THEN
        RAISE EXCEPTION 'Age verification can only be recorded by CHIMERA.' USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.age_verification_status IS DISTINCT FROM OLD.age_verification_status
       OR NEW.age_verified_at IS DISTINCT FROM OLD.age_verified_at
       OR NEW.age_verification_provider IS DISTINCT FROM OLD.age_verification_provider
       OR NEW.age_verification_reference IS DISTINCT FROM OLD.age_verification_reference THEN
      RAISE EXCEPTION 'Age verification can only be recorded by CHIMERA.' USING ERRCODE = '42501';
    END IF;
  END IF;

  v_verified := NEW.age_verification_status = 'verified_adult';
  -- An upsert evaluates the INSERT trigger before it detects the existing row,
  -- so for member INSERTs look at the stored verification state as well.
  IF TG_OP = 'INSERT' AND NOT v_verified THEN
    v_verified := EXISTS (
      SELECT 1 FROM public.chimera_user_preferences existing
      WHERE existing.user_id = NEW.user_id
        AND existing.age_verification_status = 'verified_adult'
    );
  END IF;

  IF NEW.adult_content_enabled IS TRUE AND NOT v_verified THEN
    IF v_member_write THEN
      RAISE EXCEPTION 'Verify your age before enabling adult content.' USING ERRCODE = '42501';
    END IF;
    -- Trusted writers (for example a verification being revoked) normalise.
    NEW.adult_content_enabled := false;
    NEW.adult_eligibility_confirmed_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_chimera_adult_content() FROM PUBLIC;

DROP TRIGGER IF EXISTS guard_chimera_adult_content ON public.chimera_user_preferences;
CREATE TRIGGER guard_chimera_adult_content
  BEFORE INSERT OR UPDATE ON public.chimera_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_chimera_adult_content();

-- One-time reset: the old self-declared toggle no longer counts. Everyone is
-- SFW-only until they are verified.
UPDATE public.chimera_user_preferences
SET adult_content_enabled = false,
    adult_eligibility_confirmed_at = NULL
WHERE adult_content_enabled IS TRUE
   OR adult_eligibility_confirmed_at IS NOT NULL;

-- What the API and the app ask: may THIS member see and play Mature / NSFW?
CREATE OR REPLACE FUNCTION public.get_my_adult_content_access()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT preferences.age_verification_status = 'verified_adult'
            AND preferences.adult_content_enabled
     FROM public.chimera_user_preferences AS preferences
     WHERE preferences.user_id = (SELECT auth.uid())),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.get_my_adult_content_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_adult_content_access() TO authenticated;

-- The one entry point for a verification provider (webhook / server route) to
-- record a result. Not callable by members.
CREATE OR REPLACE FUNCTION public.set_age_verification(
  p_user_id uuid,
  p_status text,
  p_provider text DEFAULT NULL,
  p_reference text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('unverified', 'verified_adult') THEN
    RAISE EXCEPTION 'Unknown age verification status.';
  END IF;

  INSERT INTO public.chimera_user_preferences (
    user_id, age_verification_status, age_verified_at, age_verification_provider, age_verification_reference
  ) VALUES (
    p_user_id, p_status,
    CASE WHEN p_status = 'verified_adult' THEN now() END,
    p_provider, p_reference
  )
  ON CONFLICT (user_id) DO UPDATE SET
    age_verification_status = EXCLUDED.age_verification_status,
    age_verified_at = EXCLUDED.age_verified_at,
    age_verification_provider = EXCLUDED.age_verification_provider,
    age_verification_reference = EXCLUDED.age_verification_reference,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.set_age_verification(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_age_verification(uuid, text, text, text) TO service_role;
