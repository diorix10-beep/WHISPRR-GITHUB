-- During the beta only the founder can publish a character publicly. Everyone else can
-- keep a character private or share it by link ("unlisted"). Enforced in the database,
-- so it holds for every write path: the save function, direct updates and service code.
--
-- Existing public characters are untouched: the check only runs when a row becomes public.
CREATE OR REPLACE FUNCTION chimera_private.guard_character_publication()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.visibility = 'public' AND (TG_OP = 'INSERT' OR OLD.visibility IS DISTINCT FROM 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.creator_id AND role = 'founder') THEN
      RAISE EXCEPTION 'Public publishing is limited to the CHIMERA founder during the beta. Choose private or unlisted.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION chimera_private.guard_character_publication() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER chimera_guard_character_publication
  BEFORE INSERT OR UPDATE OF visibility ON public.ai_characters
  FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_character_publication();
