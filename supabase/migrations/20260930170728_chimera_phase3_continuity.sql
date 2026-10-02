-- Extend the existing private memory cabinet, scene canon and participant state.
BEGIN;
ALTER TABLE chimera_private.ai_requests ADD COLUMN IF NOT EXISTS context jsonb;
ALTER TABLE public.character_memories ADD COLUMN IF NOT EXISTS persona_id uuid REFERENCES public.personas(id) ON DELETE SET NULL,
 ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
 ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.human_roleplay_sessions(id) ON DELETE CASCADE,
 ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved' CHECK(approval_status IN('proposed','approved'));
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS continuity_summaries jsonb NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS chimera_scoped_memories ON public.character_memories(user_id,character_id,persona_id,conversation_id,approval_status);

CREATE OR REPLACE FUNCTION chimera_private.scene_persona(p_scene uuid,p_user uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT CASE WHEN cp.persona_selected THEN cp.persona_id ELSE coalesce(cp.persona_id,(SELECT id FROM public.personas WHERE user_id=p_user AND is_default LIMIT 1)) END FROM public.conversation_participants cp WHERE cp.conversation_id=p_scene AND cp.user_id=p_user;
$$;
REVOKE ALL ON FUNCTION chimera_private.scene_persona(uuid,uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION chimera_private.capture_message_persona() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF TG_OP='UPDATE' AND current_user IN('anon','authenticated') AND (NEW.persona_id IS DISTINCT FROM OLD.persona_id OR NEW.source_message_id IS DISTINCT FROM OLD.source_message_id OR NEW.response_versions IS DISTINCT FROM OLD.response_versions) THEN RAISE EXCEPTION 'Message context is immutable' USING ERRCODE='42501'; END IF;
 IF TG_OP='INSERT' AND current_user IN('anon','authenticated') THEN
  SELECT CASE WHEN persona_selected THEN cp.persona_id ELSE coalesce(cp.persona_id,(SELECT id FROM public.personas WHERE user_id=NEW.sender_id AND is_default LIMIT 1)) END INTO NEW.persona_id FROM public.conversation_participants cp WHERE cp.conversation_id=NEW.conversation_id AND cp.user_id=NEW.sender_id;
  NEW.source_message_id:=NULL; NEW.response_versions:='[]';
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS chimera_capture_persona ON public.messages;
CREATE TRIGGER chimera_capture_persona BEFORE INSERT OR UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION chimera_private.capture_message_persona();
REVOKE ALL ON FUNCTION chimera_private.capture_message_persona() FROM PUBLIC;

CREATE OR REPLACE FUNCTION chimera_private.validate_memory_scope() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user IN('anon','authenticated') THEN
  IF NEW.user_id IS DISTINCT FROM auth.uid() OR (TG_OP='UPDATE' AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.character_id IS DISTINCT FROM OLD.character_id)) THEN RAISE EXCEPTION 'Private memory ownership required' USING ERRCODE='42501'; END IF;
  IF NEW.persona_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.personas WHERE id=NEW.persona_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Persona ownership required'; END IF;
  IF NEW.conversation_id IS NOT NULL AND NOT chimera_private.is_conversation_member(NEW.conversation_id) THEN RAISE EXCEPTION 'Scene access required'; END IF;
  IF NEW.session_id IS NOT NULL AND NOT public.human_roleplay_member(NEW.session_id) THEN RAISE EXCEPTION 'Room access required'; END IF;
  IF NEW.conversation_id IS NOT NULL AND NEW.session_id IS NOT NULL THEN RAISE EXCEPTION 'Choose one memory scope'; END IF;
 END IF;
 NEW.updated_at:=clock_timestamp(); RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS chimera_memory_scope ON public.character_memories;
CREATE TRIGGER chimera_memory_scope BEFORE INSERT OR UPDATE ON public.character_memories FOR EACH ROW EXECUTE FUNCTION chimera_private.validate_memory_scope();
REVOKE ALL ON FUNCTION chimera_private.validate_memory_scope() FROM PUBLIC;

-- Summaries are attributed excerpts, never invented facts or permanent canon.
-- Rebuilding from current sources also invalidates edited/deleted-source text.
CREATE OR REPLACE FUNCTION public.refresh_chimera_continuity(p_conversation_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_persona uuid; v_summary jsonb; v_key text;
BEGIN
 IF auth.uid() IS NULL OR NOT chimera_private.is_conversation_member(p_conversation_id) THEN RAISE EXCEPTION 'Scene access required' USING ERRCODE='42501'; END IF;
 v_persona:=chimera_private.scene_persona(p_conversation_id,auth.uid()); v_key:=coalesce(v_persona::text,'self');
 SELECT jsonb_build_object('persona_id',v_persona,'built_at',now(),'sources',coalesce(jsonb_agg(jsonb_build_object('id',id,'sender_id',sender_id,'excerpt',left(content,360),'digest',md5(content),'created_at',created_at) ORDER BY created_at,id),'[]'::jsonb)) INTO v_summary
 FROM (SELECT id,sender_id,content,created_at FROM public.messages WHERE conversation_id=p_conversation_id AND deleted_at IS NULL AND persona_id IS NOT DISTINCT FROM v_persona ORDER BY created_at DESC,id DESC OFFSET 32 LIMIT 1000) archived;
 UPDATE public.conversation_participants SET continuity_summaries=jsonb_set(continuity_summaries,ARRAY[v_key],v_summary,true) WHERE conversation_id=p_conversation_id AND user_id=auth.uid();
 RETURN v_summary;
END; $$;
-- Participant rows are shared; summaries are transcript-derived and contain no
-- private cabinet facts. Direct edits cannot manufacture accepted summary text.
CREATE OR REPLACE FUNCTION chimera_private.guard_continuity() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user IN('anon','authenticated') AND NEW.continuity_summaries IS DISTINCT FROM OLD.continuity_summaries THEN RAISE EXCEPTION 'Continuity is source-derived'; END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS chimera_guard_continuity ON public.conversation_participants;
CREATE TRIGGER chimera_guard_continuity BEFORE UPDATE ON public.conversation_participants FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_continuity();
REVOKE ALL ON FUNCTION chimera_private.guard_continuity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_chimera_continuity(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.refresh_chimera_continuity(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.propose_chimera_memory(p_conversation_id uuid,p_character_id uuid,p_content text,p_source_ids uuid[],p_memory_type text DEFAULT 'long_term')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid; v_sources jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT chimera_private.is_conversation_member(p_conversation_id) THEN RAISE EXCEPTION 'Scene access required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.ai_characters a JOIN public.conversation_participants cp ON cp.user_id=a.user_id WHERE a.id=p_character_id AND cp.conversation_id=p_conversation_id) OR char_length(trim(p_content)) NOT BETWEEN 1 AND 4000 OR coalesce(array_length(p_source_ids,1),0) NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Choose a character, fact and sources'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(p_source_ids) s WHERE NOT EXISTS(SELECT 1 FROM public.messages m WHERE m.id=s AND m.conversation_id=p_conversation_id AND m.deleted_at IS NULL AND m.persona_id IS NOT DISTINCT FROM chimera_private.scene_persona(p_conversation_id,auth.uid()))) THEN RAISE EXCEPTION 'Source not in this persona scene'; END IF;
 SELECT jsonb_agg(jsonb_build_object('id',id,'digest',md5(content))) INTO v_sources FROM public.messages WHERE id=ANY(p_source_ids);
 INSERT INTO public.character_memories(user_id,character_id,persona_id,conversation_id,content,memory_type,approval_status,metadata)
 VALUES(auth.uid(),p_character_id,chimera_private.scene_persona(p_conversation_id,auth.uid()),p_conversation_id,trim(p_content),p_memory_type,'proposed',jsonb_build_object('sources',v_sources,'origin','source_proposal')) RETURNING id INTO v_id;
 RETURN v_id;
END; $$;
CREATE OR REPLACE FUNCTION public.approve_chimera_memory(p_memory_id uuid,p_expected_updated_at timestamptz,p_across_scenes boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_memory public.character_memories;
BEGIN
 SELECT * INTO v_memory FROM public.character_memories WHERE id=p_memory_id AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND OR v_memory.updated_at IS DISTINCT FROM p_expected_updated_at THEN RAISE EXCEPTION 'Memory changed; refresh before approving'; END IF;
 IF v_memory.conversation_id IS NOT NULL AND NOT chimera_private.is_conversation_member(v_memory.conversation_id) THEN RAISE EXCEPTION 'Scene access required'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(v_memory.metadata->'sources','[]')) s WHERE NOT EXISTS(SELECT 1 FROM public.messages m WHERE m.id=(s->>'id')::uuid AND m.conversation_id=v_memory.conversation_id AND m.deleted_at IS NULL AND md5(m.content)=s->>'digest')) THEN RAISE EXCEPTION 'Source changed; inspect before approving'; END IF;
 UPDATE public.character_memories SET approval_status='approved',conversation_id=CASE WHEN p_across_scenes THEN NULL ELSE conversation_id END,metadata=metadata||jsonb_build_object('approved_at',now(),'source_conversation_id',v_memory.conversation_id) WHERE id=p_memory_id;
END; $$;
REVOKE ALL ON FUNCTION public.propose_chimera_memory(uuid,uuid,text,uuid[],text),public.approve_chimera_memory(uuid,timestamptz,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.propose_chimera_memory(uuid,uuid,text,uuid[],text),public.approve_chimera_memory(uuid,timestamptz,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.bind_chimera_persona_request(p_request_id uuid,p_lease uuid,p_persona_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_job chimera_private.ai_requests; v_scene uuid;
BEGIN
 SELECT * INTO v_job FROM chimera_private.ai_requests WHERE id=p_request_id FOR UPDATE;
 IF NOT FOUND OR v_job.lease<>p_lease OR v_job.state<>'running' OR v_job.operation<>'chat' THEN RAISE EXCEPTION 'Invalid request'; END IF;
 v_scene:=split_part(v_job.resource,':',1)::uuid;
 IF chimera_private.scene_persona(v_scene,v_job.user_id) IS DISTINCT FROM p_persona_id THEN RAISE EXCEPTION 'Persona changed'; END IF;
 UPDATE chimera_private.ai_requests SET context=jsonb_build_object('persona_id',p_persona_id) WHERE id=p_request_id;
END; $$;
REVOKE ALL ON FUNCTION public.bind_chimera_persona_request(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bind_chimera_persona_request(uuid,uuid,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.complete_chimera_chat_request(
  p_request_id uuid,p_lease uuid,p_conversation_id uuid,p_bot_id uuid,p_content text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_request chimera_private.ai_requests;
BEGIN
  SELECT * INTO v_request FROM chimera_private.ai_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR v_request.lease <> p_lease OR v_request.operation <> 'chat'
    OR v_request.resource <> p_conversation_id::text || ':' || p_bot_id::text THEN RAISE EXCEPTION 'Invalid chat reservation'; END IF;
  IF v_request.state = 'completed' THEN RETURN; END IF;
  IF v_request.state <> 'running' OR v_request.expires_at <= now() THEN RAISE EXCEPTION 'Chat reservation expired'; END IF;
  PERFORM 1 FROM public.conversations WHERE id=p_conversation_id FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = p_conversation_id AND user_id = v_request.user_id)
    OR NOT EXISTS (SELECT 1 FROM public.conversation_participants cp JOIN public.ai_characters a ON a.user_id = cp.user_id
      JOIN public.profiles p ON p.user_id = a.user_id AND p.role = 'ai_character'
      WHERE cp.conversation_id = p_conversation_id AND cp.user_id = p_bot_id AND (a.visibility IN ('public','unlisted') OR a.creator_id = v_request.user_id)) THEN
    RAISE EXCEPTION 'Roleplay permission changed' USING ERRCODE = '42501';
  END IF;
  IF v_request.context IS NOT NULL AND chimera_private.scene_persona(p_conversation_id,v_request.user_id) IS DISTINCT FROM (v_request.context->>'persona_id')::uuid THEN RAISE EXCEPTION 'Persona changed during generation'; END IF;
  IF p_content IS NULL OR char_length(p_content) NOT BETWEEN 1 AND 32000 THEN RAISE EXCEPTION 'Invalid reply'; END IF;
  INSERT INTO public.messages(conversation_id,sender_id,content,read,persona_id) VALUES(p_conversation_id,p_bot_id,p_content,false,CASE WHEN v_request.context IS NOT NULL THEN (v_request.context->>'persona_id')::uuid ELSE chimera_private.scene_persona(p_conversation_id,v_request.user_id) END);
  UPDATE public.conversations SET last_message = p_content,last_message_at = now() WHERE id = p_conversation_id;
  UPDATE chimera_private.ai_requests SET state = 'completed',result = jsonb_build_object('reply',p_content) WHERE id = p_request_id;
END;
$$;


COMMIT;
