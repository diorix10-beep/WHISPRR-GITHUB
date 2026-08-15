-- A scene can only be created by the person who started the roleplay.
-- Keep this in the database as well as the UI: clients are never a trust boundary.
CREATE OR REPLACE FUNCTION public.enforce_roleplay_public_scene_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NEW.owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the signed-in scene owner can publish a roleplay scene';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.conversations conversation
    WHERE conversation.id = NEW.conversation_id
      AND conversation.created_by = NEW.owner_id
  ) THEN
    RAISE EXCEPTION 'Only the creator of a roleplay can publish its snapshot';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_roleplay_public_scene_owner() FROM PUBLIC;

DROP TRIGGER IF EXISTS roleplay_public_scene_owner_guard ON public.roleplay_public_scenes;
CREATE TRIGGER roleplay_public_scene_owner_guard
  BEFORE INSERT OR UPDATE OF conversation_id, owner_id
  ON public.roleplay_public_scenes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_roleplay_public_scene_owner();

-- Snapshot rows may only cite messages from their own source conversation.
CREATE OR REPLACE FUNCTION public.enforce_roleplay_public_scene_message_source()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.source_message_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.messages message
    JOIN public.roleplay_public_scenes scene ON scene.id = NEW.scene_id
    WHERE message.id = NEW.source_message_id
      AND message.conversation_id = scene.conversation_id
  ) THEN
    RAISE EXCEPTION 'A public scene snapshot can only cite messages from its own conversation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_roleplay_public_scene_message_source() FROM PUBLIC;

DROP TRIGGER IF EXISTS roleplay_public_scene_message_source_guard ON public.roleplay_public_scene_messages;
CREATE TRIGGER roleplay_public_scene_message_source_guard
  BEFORE INSERT OR UPDATE OF scene_id, source_message_id
  ON public.roleplay_public_scene_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_roleplay_public_scene_message_source();
