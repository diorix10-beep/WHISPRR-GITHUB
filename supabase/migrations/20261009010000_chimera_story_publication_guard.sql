-- During the beta only the founder can publish a story publicly, as for characters.
-- Members can keep a story private or share it by link ("unlisted").
--
-- Stories have no content rating yet, so a public story cannot be filtered for minors.
-- Until a rating and reporting exist, public publishing stays founder-only. Enforced in
-- the database so it holds for every write path, not only the new Writer's Desk.
--
-- The check only runs when a row becomes public, so existing rows are untouched.
-- The WHISPRR app only reads stories, so it is not affected.
CREATE OR REPLACE FUNCTION chimera_private.guard_story_publication()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.visibility = 'public' AND (TG_OP = 'INSERT' OR OLD.visibility IS DISTINCT FROM 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.user_id AND role = 'founder') THEN
      RAISE EXCEPTION 'Public publishing is limited to the CHIMERA founder during the beta. Choose private or unlisted.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION chimera_private.guard_story_publication() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER chimera_guard_story_publication
  BEFORE INSERT OR UPDATE OF visibility ON public.stories
  FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_story_publication();
