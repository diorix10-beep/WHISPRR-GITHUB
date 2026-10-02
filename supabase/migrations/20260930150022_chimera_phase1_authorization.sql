-- Review-only Phase 1 patch. No data rewrites, credential values, or economy changes.
-- Shared profiles/messages are CHIMERA's security boundary. Review shared consumers
-- before applying; these invariants necessarily protect the underlying shared rows.
BEGIN;
CREATE SCHEMA IF NOT EXISTS chimera_private;
REVOKE ALL ON SCHEMA chimera_private FROM PUBLIC;
GRANT USAGE ON SCHEMA chimera_private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION chimera_private.is_conversation_member(p_conversation_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION chimera_private.is_conversation_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION chimera_private.is_conversation_member(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION chimera_private.is_conversation_owner(p_conversation_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.conversations WHERE id = p_conversation_id AND created_by = auth.uid());
$$;
REVOKE ALL ON FUNCTION chimera_private.is_conversation_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION chimera_private.is_conversation_owner(uuid) TO authenticated;

-- INVOKER is intentional: trusted existing character-save functions execute as
-- their owner; a browser table mutation executes as authenticated/anon.
CREATE OR REPLACE FUNCTION chimera_private.guard_profile_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.user_id IS DISTINCT FROM auth.uid() OR NEW.role IS DISTINCT FROM 'user' OR NEW.access_level IS DISTINCT FROM 'ecosystem' THEN
        RAISE EXCEPTION 'Profile identity is managed by the server' USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.role IS DISTINCT FROM OLD.role
       OR NEW.access_level IS DISTINCT FROM OLD.access_level THEN
      RAISE EXCEPTION 'Profile permissions are managed by the server' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS chimera_guard_profile_identity ON public.profiles;
CREATE TRIGGER chimera_guard_profile_identity BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_profile_identity();

CREATE OR REPLACE FUNCTION chimera_private.guard_character_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' OR NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.creator_id IS DISTINCT FROM OLD.creator_id THEN
      RAISE EXCEPTION 'Character identities must be created through the character save operation' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS chimera_guard_character_identity ON public.ai_characters;
CREATE TRIGGER chimera_guard_character_identity BEFORE INSERT OR UPDATE ON public.ai_characters
FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_character_identity();

CREATE OR REPLACE FUNCTION chimera_private.guard_conversation_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF current_user IN ('anon','authenticated') AND (
    (TG_OP = 'INSERT' AND NEW.created_by IS DISTINCT FROM auth.uid()) OR
    (TG_OP = 'UPDATE' AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.created_by IS DISTINCT FROM OLD.created_by))) THEN
    RAISE EXCEPTION 'Conversation ownership cannot be changed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS chimera_guard_conversation_identity ON public.conversations;
CREATE TRIGGER chimera_guard_conversation_identity BEFORE INSERT OR UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_conversation_identity();

DROP POLICY IF EXISTS select_conversation_participants ON public.conversation_participants;
CREATE POLICY select_conversation_participants ON public.conversation_participants FOR SELECT TO authenticated
USING (user_id = auth.uid() OR chimera_private.is_conversation_member(conversation_id)
  OR chimera_private.is_conversation_owner(conversation_id));
DROP POLICY IF EXISTS insert_conversation_participants ON public.conversation_participants;
CREATE POLICY insert_conversation_participants ON public.conversation_participants FOR INSERT TO authenticated
WITH CHECK (chimera_private.is_conversation_owner(conversation_id));

CREATE OR REPLACE FUNCTION chimera_private.guard_participant_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'UPDATE' AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id) THEN
      RAISE EXCEPTION 'Participant identity cannot be moved' USING ERRCODE = '42501';
    END IF;
    IF NEW.persona_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.personas WHERE id = NEW.persona_id AND user_id = NEW.user_id
    ) THEN RAISE EXCEPTION 'Persona must belong to the participant' USING ERRCODE = '42501'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS chimera_guard_participant_identity ON public.conversation_participants;
CREATE TRIGGER chimera_guard_participant_identity BEFORE INSERT OR UPDATE ON public.conversation_participants
FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_participant_identity();

CREATE OR REPLACE FUNCTION chimera_private.guard_message_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
      OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id THEN
      RAISE EXCEPTION 'Message identity cannot be changed' USING ERRCODE = '42501';
    END IF;
    -- Recipients may acknowledge reads, but not rewrite someone else's words.
    -- The scene creator retains existing edit/swipe controls for actual AI posts.
    IF OLD.sender_id IS DISTINCT FROM auth.uid() AND NOT EXISTS (
      SELECT 1 FROM public.conversations c JOIN public.profiles p ON p.user_id = OLD.sender_id
      WHERE c.id = OLD.conversation_id AND c.created_by = auth.uid() AND p.role = 'ai_character'
    ) AND (to_jsonb(NEW) - ARRAY['read','updated_at']) IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['read','updated_at']) THEN
      RAISE EXCEPTION 'Only the author can edit this message' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS chimera_guard_message_identity ON public.messages;
CREATE TRIGGER chimera_guard_message_identity BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_message_identity();

-- Browser authority is narrowed to the exact creator-authored opening, once.
-- Generated replies use a separate service-only, idempotent completion function.
CREATE OR REPLACE FUNCTION public.respond_as_ai_character(p_conversation_id uuid, p_bot_id uuid, p_content text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_greeting text;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.conversation_participants WHERE conversation_id = p_conversation_id AND user_id = auth.uid()
  ) THEN RAISE EXCEPTION 'Roleplay access required' USING ERRCODE = '42501'; END IF;
  PERFORM 1 FROM public.conversations WHERE id = p_conversation_id FOR UPDATE;
  SELECT a.greeting INTO v_greeting FROM public.ai_characters a
  JOIN public.profiles p ON p.user_id = a.user_id AND p.role = 'ai_character'
  JOIN public.conversation_participants cp ON cp.user_id = a.user_id AND cp.conversation_id = p_conversation_id
  WHERE a.user_id = p_bot_id AND (a.visibility IN ('public','unlisted') OR a.creator_id = auth.uid());
  IF v_greeting IS NULL OR p_content IS DISTINCT FROM v_greeting THEN
    RAISE EXCEPTION 'Only the authored character opening may be posted here' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.messages WHERE conversation_id = p_conversation_id) THEN
    IF EXISTS (SELECT 1 FROM public.messages WHERE conversation_id = p_conversation_id AND sender_id = p_bot_id AND content = v_greeting) THEN RETURN; END IF;
    RAISE EXCEPTION 'This scene has already begun';
  END IF;
  INSERT INTO public.messages(conversation_id,sender_id,content,read) VALUES(p_conversation_id,p_bot_id,v_greeting,false);
  UPDATE public.conversations SET last_message = v_greeting, last_message_at = now() WHERE id = p_conversation_id;
END;
$$;
REVOKE ALL ON FUNCTION public.respond_as_ai_character(uuid,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_as_ai_character(uuid,uuid,text) TO authenticated;

DROP POLICY IF EXISTS manage_lorebook_characters ON public.lorebook_characters;
CREATE POLICY manage_lorebook_characters ON public.lorebook_characters FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.lorebooks WHERE id = lorebook_id AND user_id = auth.uid()))
WITH CHECK (
  EXISTS (SELECT 1 FROM public.lorebooks WHERE id = lorebook_id AND user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.ai_characters WHERE id = character_id AND creator_id = auth.uid())
);
DROP POLICY IF EXISTS manage_lorebook_worlds ON public.lorebook_worlds;
CREATE POLICY manage_lorebook_worlds ON public.lorebook_worlds FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.lorebooks WHERE id = lorebook_id AND user_id = auth.uid()))
WITH CHECK (
  EXISTS (SELECT 1 FROM public.lorebooks WHERE id = lorebook_id AND user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.worlds WHERE id = world_id AND user_id = auth.uid())
);
-- Delete remains available for owners to unlink older invalid associations.

CREATE OR REPLACE FUNCTION chimera_private.guard_human_roleplay_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_TABLE_NAME = 'human_roleplay_participants' THEN
      IF (to_jsonb(NEW) - ARRAY['status','last_seen_at']) IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['status','last_seen_at'])
        OR (NEW.status IS DISTINCT FROM OLD.status AND NOT (OLD.status = 'accepted' AND NEW.status = 'left')) THEN
        RAISE EXCEPTION 'Membership changes require an authorized session operation' USING ERRCODE = '42501';
      END IF;
    ELSIF TG_TABLE_NAME = 'human_roleplay_characters' THEN
      IF NEW.id IS DISTINCT FROM OLD.id OR NEW.session_id IS DISTINCT FROM OLD.session_id OR NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
        RAISE EXCEPTION 'Character session identity cannot be changed' USING ERRCODE = '42501';
      END IF;
    ELSE
      IF NEW.id IS DISTINCT FROM OLD.id OR NEW.session_id IS DISTINCT FROM OLD.session_id OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
        OR NEW.character_id IS DISTINCT FROM OLD.character_id OR NEW.sequence_number IS DISTINCT FROM OLD.sequence_number
        OR NEW.message_type IS DISTINCT FROM OLD.message_type OR NOT public.human_roleplay_member(OLD.session_id) THEN
        RAISE EXCEPTION 'Message identity and sequence cannot be changed' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS chimera_guard_human_participant ON public.human_roleplay_participants;
CREATE TRIGGER chimera_guard_human_participant BEFORE UPDATE ON public.human_roleplay_participants FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_human_roleplay_mutation();
DROP TRIGGER IF EXISTS chimera_guard_human_character ON public.human_roleplay_characters;
CREATE TRIGGER chimera_guard_human_character BEFORE UPDATE ON public.human_roleplay_characters FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_human_roleplay_mutation();
DROP TRIGGER IF EXISTS chimera_guard_human_message ON public.human_roleplay_messages;
CREATE TRIGGER chimera_guard_human_message BEFORE UPDATE ON public.human_roleplay_messages FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_human_roleplay_mutation();
REVOKE INSERT ON public.human_roleplay_messages FROM anon, authenticated;
DROP POLICY IF EXISTS "human roleplay send messages" ON public.human_roleplay_messages;
-- Existing send_human_roleplay_message remains the ordered, owner-validated writer.
REVOKE ALL ON FUNCTION chimera_private.guard_profile_identity(), chimera_private.guard_character_identity(),
  chimera_private.guard_conversation_identity(), chimera_private.guard_participant_identity(), chimera_private.guard_message_identity(), chimera_private.guard_human_roleplay_mutation() FROM PUBLIC;
COMMIT;
