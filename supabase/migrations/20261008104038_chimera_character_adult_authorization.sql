-- PR #9: enforce age authorization beneath every client-side character query.
-- Restrictive SELECT policies compose with (rather than replace) existing
-- visibility/ownership policies. Service-only generation still requires its
-- existing explicit authorization; these policies do not constrain service_role.
BEGIN;
CREATE SCHEMA IF NOT EXISTS chimera_private;
REVOKE ALL ON SCHEMA chimera_private FROM PUBLIC;
GRANT USAGE ON SCHEMA chimera_private TO anon, authenticated, service_role;

-- Private lookup intentionally bypasses RLS only to return a boolean. The
-- identity always comes from auth.uid(), never a caller-supplied user ID.
CREATE OR REPLACE FUNCTION chimera_private.can_read_character(p_character uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
   SELECT 1 FROM public.ai_characters a
   WHERE a.id = p_character
     AND (a.visibility IN ('public', 'unlisted') OR a.creator_id = auth.uid())
     AND (upper(trim(coalesce(nullif(a.content_rating, ''), 'SFW'))) = 'SFW'
       OR EXISTS (SELECT 1 FROM public.chimera_user_preferences pref
         WHERE pref.user_id = auth.uid()
           AND pref.age_verification_status = 'verified_adult'
           AND pref.adult_content_enabled IS TRUE))
 );
$$;
REVOKE ALL ON FUNCTION chimera_private.can_read_character(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION chimera_private.can_read_character(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION chimera_private.can_read_character_scene(p_scene uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT auth.uid() IS NOT NULL
 AND NOT EXISTS (SELECT 1 FROM public.conversations c
   WHERE c.id = p_scene AND c.character_id IS NOT NULL
     AND NOT chimera_private.can_read_character(c.character_id))
 AND NOT EXISTS (SELECT 1 FROM public.conversation_participants cp
   JOIN public.ai_characters a ON a.user_id = cp.user_id
   WHERE cp.conversation_id = p_scene AND NOT chimera_private.can_read_character(a.id));
$$;
CREATE OR REPLACE FUNCTION chimera_private.can_read_character_room(p_room uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT auth.uid() IS NOT NULL AND NOT EXISTS (
   SELECT 1 FROM public.human_roleplay_characters rc
   WHERE rc.session_id = p_room AND rc.ai_character_id IS NOT NULL
     AND NOT chimera_private.can_read_character(rc.ai_character_id));
$$;
REVOKE ALL ON FUNCTION chimera_private.can_read_character_scene(uuid),
 chimera_private.can_read_character_room(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION chimera_private.can_read_character_scene(uuid),
 chimera_private.can_read_character_room(uuid) TO anon, authenticated;

ALTER TABLE public.ai_characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chimera_character_adult_read ON public.ai_characters;
CREATE POLICY chimera_character_adult_read ON public.ai_characters
 AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (chimera_private.can_read_character(id));

ALTER TABLE public.character_memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chimera_character_adult_read ON public.character_memories;
CREATE POLICY chimera_character_adult_read ON public.character_memories
 AS RESTRICTIVE FOR SELECT TO anon, authenticated USING ((character_id IS NULL OR chimera_private.can_read_character(character_id)) AND (conversation_id IS NULL OR chimera_private.can_read_character_scene(conversation_id)) AND (session_id IS NULL OR chimera_private.can_read_character_room(session_id)));

ALTER TABLE public.character_relationships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chimera_character_adult_read ON public.character_relationships;
CREATE POLICY chimera_character_adult_read ON public.character_relationships
 AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (chimera_private.can_read_character(source_character_id) AND chimera_private.can_read_character(target_character_id));

ALTER TABLE public.world_characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chimera_character_adult_read ON public.world_characters;
CREATE POLICY chimera_character_adult_read ON public.world_characters
 AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (chimera_private.can_read_character(character_id));

ALTER TABLE public.lorebook_characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chimera_character_adult_read ON public.lorebook_characters;
CREATE POLICY chimera_character_adult_read ON public.lorebook_characters
 AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (chimera_private.can_read_character(character_id));

ALTER TABLE public.ai_character_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chimera_character_adult_read ON public.ai_character_likes;
CREATE POLICY chimera_character_adult_read ON public.ai_character_likes
 AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (chimera_private.can_read_character(character_id));

ALTER TABLE public.ai_character_followers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chimera_character_adult_read ON public.ai_character_followers;
CREATE POLICY chimera_character_adult_read ON public.ai_character_followers
 AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (chimera_private.can_read_character(character_id));

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chimera_character_adult_read ON public.conversations;
CREATE POLICY chimera_character_adult_read ON public.conversations
 AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (chimera_private.can_read_character_scene(id));

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chimera_character_adult_read ON public.messages;
CREATE POLICY chimera_character_adult_read ON public.messages
 AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (chimera_private.can_read_character_scene(conversation_id));

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chimera_character_adult_read ON public.conversation_participants;
CREATE POLICY chimera_character_adult_read ON public.conversation_participants
 AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (chimera_private.can_read_character_scene(conversation_id));

ALTER TABLE public.human_roleplay_characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chimera_character_adult_read ON public.human_roleplay_characters;
CREATE POLICY chimera_character_adult_read ON public.human_roleplay_characters
 AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (chimera_private.can_read_character_room(session_id));

ALTER TABLE public.human_roleplay_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chimera_character_adult_read ON public.human_roleplay_messages;
CREATE POLICY chimera_character_adult_read ON public.human_roleplay_messages
 AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (chimera_private.can_read_character_room(session_id));

ALTER TABLE public.human_roleplay_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chimera_character_adult_read ON public.human_roleplay_sessions;
CREATE POLICY chimera_character_adult_read ON public.human_roleplay_sessions
 AS RESTRICTIVE FOR SELECT TO anon, authenticated USING (chimera_private.can_read_character_room(id));

-- Bot profiles can contain copied descriptions/avatars from the character.
DROP POLICY IF EXISTS chimera_character_profile_read ON public.profiles;
CREATE POLICY chimera_character_profile_read ON public.profiles
 AS RESTRICTIVE FOR SELECT TO anon, authenticated
 USING (role IS DISTINCT FROM 'ai_character' OR EXISTS (
   SELECT 1 FROM public.ai_characters a WHERE a.user_id = profiles.user_id));

-- Definer RPCs bypass table RLS. Existing scene/room authorization helpers
-- must also refuse restricted character context before returning any excerpts.
CREATE OR REPLACE FUNCTION chimera_private.is_conversation_member(p_conversation_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT auth.uid() IS NOT NULL
 AND chimera_private.can_read_character_scene(p_conversation_id)
 AND EXISTS (SELECT 1 FROM public.conversation_participants
   WHERE conversation_id = p_conversation_id AND user_id = auth.uid());
$$;
CREATE OR REPLACE FUNCTION chimera_private.is_conversation_owner(p_conversation_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT auth.uid() IS NOT NULL
 AND chimera_private.can_read_character_scene(p_conversation_id)
 AND EXISTS (SELECT 1 FROM public.conversations
   WHERE id = p_conversation_id AND created_by = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.respond_as_ai_character(p_conversation_id uuid, p_bot_id uuid, p_content text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_greeting text;
BEGIN
  IF auth.uid() IS NULL OR NOT chimera_private.can_read_character_scene(p_conversation_id) OR NOT EXISTS (
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

CREATE OR REPLACE FUNCTION public.create_chimera_scene(p_bot_ids uuid[],p_name text DEFAULT NULL,p_canon text DEFAULT '')
RETURNS public.conversations LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_scene public.conversations; v_bot uuid;
BEGIN
 IF auth.uid() IS NULL OR coalesce(array_length(p_bot_ids,1),0)>12 OR char_length(coalesce(p_canon,''))>20000 THEN RAISE EXCEPTION 'Invalid scene'; END IF;
 FOREACH v_bot IN ARRAY coalesce(p_bot_ids,'{}'::uuid[]) LOOP
  IF NOT EXISTS(SELECT 1 FROM public.ai_characters a JOIN public.profiles p ON p.user_id=a.user_id AND p.role='ai_character' WHERE a.user_id=v_bot AND chimera_private.can_read_character(a.id) AND (a.visibility IN('public','unlisted') OR a.creator_id=auth.uid())) THEN RAISE EXCEPTION 'Character unavailable' USING ERRCODE='42501'; END IF;
 END LOOP;
 INSERT INTO public.conversations(type,name,created_by,memory_summary) VALUES(CASE WHEN array_length(p_bot_ids,1)>1 THEN 'group' ELSE 'dm' END,p_name,auth.uid(),coalesce(p_canon,'')) RETURNING * INTO v_scene;
 INSERT INTO public.conversation_participants(conversation_id,user_id) VALUES(v_scene.id,auth.uid());
 INSERT INTO public.conversation_participants(conversation_id,user_id) SELECT v_scene.id,b FROM (SELECT DISTINCT unnest(p_bot_ids) b) bots;
 RETURN v_scene;
END; $$;

CREATE OR REPLACE FUNCTION public.attach_human_room_character(p_session_id uuid,p_persona_id uuid DEFAULT NULL,p_ai_character_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid; v_name text; v_description text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.human_roleplay_member(p_session_id) OR (p_persona_id IS NULL)=(p_ai_character_id IS NULL) THEN RAISE EXCEPTION 'Choose an existing persona or AI character'; END IF;
 IF p_persona_id IS NOT NULL THEN
  SELECT name,description INTO v_name,v_description FROM public.personas WHERE id=p_persona_id AND user_id=auth.uid();
 ELSE
  IF NOT EXISTS(SELECT 1 FROM public.human_roleplay_sessions WHERE id=p_session_id AND creator_id=auth.uid()) THEN RAISE EXCEPTION 'Only the host adds AI characters'; END IF;
  SELECT p.display_name,a.short_description INTO v_name,v_description FROM public.ai_characters a JOIN public.profiles p ON p.user_id=a.user_id AND p.role='ai_character' WHERE a.id=p_ai_character_id AND chimera_private.can_read_character(a.id) AND (a.visibility IN('public','unlisted') OR a.creator_id=auth.uid());
 END IF;
 IF v_name IS NULL THEN RAISE EXCEPTION 'Identity unavailable'; END IF;
 INSERT INTO public.human_roleplay_characters(session_id,owner_id,name,description,persona_id,ai_character_id) VALUES(p_session_id,auth.uid(),v_name,coalesce(v_description,''),p_persona_id,p_ai_character_id) RETURNING id INTO v_id;
 RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.get_human_room_continuity(p_session_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_sources jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT chimera_private.can_read_character_room(p_session_id) OR NOT public.human_roleplay_member(p_session_id) THEN RAISE EXCEPTION 'Room membership required'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'sender_id',sender_id,'excerpt',left(content,360),'digest',md5(content),'created_at',created_at) ORDER BY sequence_number),'[]') INTO v_sources FROM(SELECT * FROM public.human_roleplay_messages WHERE session_id=p_session_id AND deleted_at IS NULL ORDER BY sequence_number DESC OFFSET 32 LIMIT 1000) archive;
 RETURN v_sources;
END; $$;

-- Explicit ACLs also cover databases with older PUBLIC execute grants.
REVOKE ALL ON FUNCTION chimera_private.is_conversation_member(uuid),
 chimera_private.is_conversation_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION chimera_private.is_conversation_member(uuid),
 chimera_private.is_conversation_owner(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.respond_as_ai_character(uuid,uuid,text),
 public.create_chimera_scene(uuid[],text,text),
 public.attach_human_room_character(uuid,uuid,uuid),
 public.get_human_room_continuity(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_as_ai_character(uuid,uuid,text),
 public.create_chimera_scene(uuid[],text,text),
 public.attach_human_room_character(uuid,uuid,uuid),
 public.get_human_room_continuity(uuid) TO authenticated;
COMMIT;
