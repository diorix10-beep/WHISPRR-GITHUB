-- CHIMERA: a temporary, honest way for adults to open Mature content until a real age check (Yoti) exists.
--
-- What this is: a member confirms "I am 18 years old or older". That is a DECLARATION, not a verification,
-- so it is stored as its own status, 'self_attested_adult', and never as 'verified_adult'. The columns that
-- belong to a verification provider (age_verified_at, age_verification_provider, age_verification_reference)
-- are not touched by it and stay empty.
--
-- What does not change:
--   * General (SFW) content stays open to everyone; Mature / NSFW stays closed unless the member is eligible
--     AND has switched adult content on (same opt-in as before).
--   * Members still cannot write the age columns themselves: the status is set only by the two functions
--     below (which act as the signed-in member) or by set_age_verification (service role, for Yoti).
--   * Existing characters, ratings and rows are not modified. Nobody becomes eligible by this migration.
--
-- When Yoti goes live, change chimera_private.adult_status_allows to accept only 'verified_adult' and, if
-- wanted, run: UPDATE public.chimera_user_preferences SET age_verification_status = 'unverified' WHERE
-- age_verification_status = 'self_attested_adult'; (the guard trigger then switches their adult content off).

BEGIN;

ALTER TABLE public.chimera_user_preferences
  ADD COLUMN IF NOT EXISTS adult_attested_at timestamptz,
  ADD COLUMN IF NOT EXISTS adult_attestation_version text;

ALTER TABLE public.chimera_user_preferences
  DROP CONSTRAINT IF EXISTS chimera_user_preferences_age_verification_status_check;
ALTER TABLE public.chimera_user_preferences
  ADD CONSTRAINT chimera_user_preferences_age_verification_status_check
  CHECK (age_verification_status IN ('unverified', 'self_attested_adult', 'verified_adult'));

-- The one place that says which statuses may open adult content.
CREATE OR REPLACE FUNCTION chimera_private.adult_status_allows(p_status text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT p_status IN ('verified_adult', 'self_attested_adult');
$$;
REVOKE ALL ON FUNCTION chimera_private.adult_status_allows(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION chimera_private.adult_status_allows(text) TO anon, authenticated, service_role;

-- Reading: the same rule as before, with the shared status check.
CREATE OR REPLACE FUNCTION chimera_private.can_read_character(p_character uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
   SELECT 1 FROM public.ai_characters a
   WHERE a.id = p_character
     AND (a.visibility IN ('public', 'unlisted') OR a.creator_id = auth.uid())
     AND (upper(trim(coalesce(nullif(a.content_rating, ''), 'SFW'))) = 'SFW'
       OR EXISTS (SELECT 1 FROM public.chimera_user_preferences pref
         WHERE pref.user_id = auth.uid()
           AND chimera_private.adult_status_allows(pref.age_verification_status)
           AND pref.adult_content_enabled IS TRUE))
 );
$$;

CREATE OR REPLACE FUNCTION chimera_private.can_read_character_for_user(p_character uuid, p_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT p_user IS NOT NULL AND EXISTS (
 SELECT 1 FROM public.ai_characters a WHERE a.id = p_character
 AND (a.visibility IN ('public', 'unlisted') OR a.creator_id = p_user)
 AND (upper(trim(coalesce(nullif(a.content_rating, ''), 'SFW'))) = 'SFW'
 OR EXISTS (SELECT 1 FROM public.chimera_user_preferences pref WHERE pref.user_id = p_user
 AND chimera_private.adult_status_allows(pref.age_verification_status) AND pref.adult_content_enabled IS TRUE)));
$$;
REVOKE ALL ON FUNCTION chimera_private.can_read_character_for_user(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_adult_content_access()
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT chimera_private.adult_status_allows(preferences.age_verification_status)
            AND preferences.adult_content_enabled
     FROM public.chimera_user_preferences AS preferences
     WHERE preferences.user_id = (SELECT auth.uid())),
    false
  );
$$;
REVOKE ALL ON FUNCTION public.get_my_adult_content_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_adult_content_access() TO authenticated;

DROP POLICY IF EXISTS chimera_adult_public_scene_read ON public.roleplay_public_scenes;
CREATE POLICY chimera_adult_public_scene_read ON public.roleplay_public_scenes
 AS RESTRICTIVE FOR SELECT TO anon, authenticated
 USING (chimera_private.can_read_character_scene(conversation_id)
   AND (content_rating = 'limited' OR EXISTS (SELECT 1 FROM public.chimera_user_preferences pref
     WHERE pref.user_id = auth.uid() AND chimera_private.adult_status_allows(pref.age_verification_status)
       AND pref.adult_content_enabled IS TRUE)));

-- Writing: members still cannot touch any age column, the new ones included.
CREATE OR REPLACE FUNCTION public.guard_chimera_adult_content()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_member_write boolean := current_user IN ('authenticated', 'anon');
  v_eligible boolean;
BEGIN
  IF v_member_write THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.age_verification_status IS DISTINCT FROM 'unverified'
         OR NEW.age_verified_at IS NOT NULL
         OR NEW.age_verification_provider IS NOT NULL
         OR NEW.age_verification_reference IS NOT NULL
         OR NEW.adult_attested_at IS NOT NULL
         OR NEW.adult_attestation_version IS NOT NULL THEN
        RAISE EXCEPTION 'Age verification can only be recorded by CHIMERA.' USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.age_verification_status IS DISTINCT FROM OLD.age_verification_status
       OR NEW.age_verified_at IS DISTINCT FROM OLD.age_verified_at
       OR NEW.age_verification_provider IS DISTINCT FROM OLD.age_verification_provider
       OR NEW.age_verification_reference IS DISTINCT FROM OLD.age_verification_reference
       OR NEW.adult_attested_at IS DISTINCT FROM OLD.adult_attested_at
       OR NEW.adult_attestation_version IS DISTINCT FROM OLD.adult_attestation_version THEN
      RAISE EXCEPTION 'Age verification can only be recorded by CHIMERA.' USING ERRCODE = '42501';
    END IF;
  END IF;

  v_eligible := chimera_private.adult_status_allows(NEW.age_verification_status);
  -- An upsert evaluates the INSERT trigger before it detects the existing row,
  -- so for member INSERTs look at the stored status as well.
  IF TG_OP = 'INSERT' AND NOT v_eligible THEN
    v_eligible := EXISTS (
      SELECT 1 FROM public.chimera_user_preferences existing
      WHERE existing.user_id = NEW.user_id
        AND chimera_private.adult_status_allows(existing.age_verification_status)
    );
  END IF;

  IF NEW.adult_content_enabled IS TRUE AND NOT v_eligible THEN
    IF v_member_write THEN
      RAISE EXCEPTION 'Confirm that you are 18 or older before enabling adult content.' USING ERRCODE = '42501';
    END IF;
    -- Trusted writers (for example an attestation being withdrawn) normalise.
    NEW.adult_content_enabled := false;
    NEW.adult_eligibility_confirmed_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_chimera_adult_content() FROM PUBLIC;

-- "I am 18 years old or older." Records the declaration for the signed-in member, once. Does nothing for
-- an account that already has a status (a verified account is never downgraded). Returns the status.
CREATE OR REPLACE FUNCTION public.attest_my_adult_status(p_version text DEFAULT 'adult-attestation-1')
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_status text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = '42501'; END IF;
  IF p_version IS NULL OR char_length(btrim(p_version)) NOT BETWEEN 1 AND 64 THEN
    RAISE EXCEPTION 'Invalid confirmation.';
  END IF;

  INSERT INTO public.chimera_user_preferences AS pref (user_id, age_verification_status, adult_attested_at, adult_attestation_version)
  VALUES (v_user, 'self_attested_adult', now(), btrim(p_version))
  ON CONFLICT (user_id) DO UPDATE SET
    age_verification_status = CASE WHEN pref.age_verification_status = 'unverified' THEN 'self_attested_adult' ELSE pref.age_verification_status END,
    adult_attested_at = CASE WHEN pref.age_verification_status = 'unverified' THEN now() ELSE pref.adult_attested_at END,
    adult_attestation_version = CASE WHEN pref.age_verification_status = 'unverified' THEN btrim(p_version) ELSE pref.adult_attestation_version END,
    updated_at = now()
  RETURNING pref.age_verification_status INTO v_status;

  RETURN v_status;
END;
$$;

-- Takes the declaration back and switches adult content off. A verified account is left alone.
CREATE OR REPLACE FUNCTION public.withdraw_my_adult_attestation()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Sign in to continue.' USING ERRCODE = '42501'; END IF;
  UPDATE public.chimera_user_preferences
  SET age_verification_status = 'unverified',
      adult_attested_at = NULL,
      adult_attestation_version = NULL,
      adult_content_enabled = false,
      adult_eligibility_confirmed_at = NULL,
      updated_at = now()
  WHERE user_id = v_user AND age_verification_status = 'self_attested_adult';
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.attest_my_adult_status(text), public.withdraw_my_adult_attestation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.attest_my_adult_status(text), public.withdraw_my_adult_attestation() TO authenticated;

-- Giving a character an adult rating needs an eligible member who has adult content on. Keeping a rating a
-- character already has, and moving to General, are always allowed, so existing characters are untouched.
CREATE OR REPLACE FUNCTION chimera_private.guard_character_adult_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_new text := upper(trim(coalesce(nullif(NEW.content_rating, ''), 'SFW')));
  v_old text;
BEGIN
  IF v_new = 'SFW' THEN RETURN NEW; END IF;

  SELECT upper(trim(coalesce(nullif(a.content_rating, ''), 'SFW'))) INTO v_old FROM public.ai_characters a WHERE a.id = NEW.id;
  IF v_old IS NOT NULL AND v_old = v_new THEN RETURN NEW; END IF;

  IF auth.uid() IS NULL THEN
    -- No member behind this write: only the service role / database owner may do that, never a request that
    -- came in as anon or as a signed-in role without an identity.
    IF coalesce(current_setting('role', true), '') IN ('anon', 'authenticated') THEN
      RAISE EXCEPTION 'Mature characters need a member who has confirmed they are 18 or older.' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.chimera_user_preferences pref
    WHERE pref.user_id = auth.uid()
      AND chimera_private.adult_status_allows(pref.age_verification_status)
      AND pref.adult_content_enabled IS TRUE
  ) THEN
    RAISE EXCEPTION 'Mature characters need a member who has confirmed they are 18 or older and turned adult content on.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION chimera_private.guard_character_adult_rating() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_character_adult_rating ON public.ai_characters;
CREATE TRIGGER guard_character_adult_rating
  BEFORE INSERT OR UPDATE OF content_rating ON public.ai_characters
  FOR EACH ROW
  EXECUTE FUNCTION chimera_private.guard_character_adult_rating();

COMMIT;
