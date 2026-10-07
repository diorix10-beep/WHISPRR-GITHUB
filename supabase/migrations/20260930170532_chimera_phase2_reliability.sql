-- CHIMERA Phase 2: additive contracts, immutable branch copies and atomic regeneration.
BEGIN;
ALTER TABLE public.story_chapters ADD COLUMN IF NOT EXISTS choices jsonb NOT NULL DEFAULT '[]', ADD COLUMN IF NOT EXISTS is_cyoa boolean NOT NULL DEFAULT false;
ALTER TABLE public.ai_characters ADD COLUMN IF NOT EXISTS ai_provider text NOT NULL DEFAULT 'gemini', ADD COLUMN IF NOT EXISTS ai_model text NOT NULL DEFAULT 'gemini-2.5-flash';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS parent_conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
 ADD COLUMN IF NOT EXISTS branch_point_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
 ADD COLUMN IF NOT EXISTS branch_request_id uuid, ADD COLUMN IF NOT EXISTS canon_revision bigint NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS chimera_branch_retry ON public.conversations(created_by,branch_request_id) WHERE branch_request_id IS NOT NULL;
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS persona_selected boolean NOT NULL DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS source_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
 ADD COLUMN IF NOT EXISTS persona_id uuid REFERENCES public.personas(id) ON DELETE SET NULL,
 ADD COLUMN IF NOT EXISTS response_versions jsonb NOT NULL DEFAULT '[]';

CREATE OR REPLACE FUNCTION public.set_chimera_scene_persona(p_conversation_id uuid,p_persona_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT chimera_private.is_conversation_member(p_conversation_id) THEN RAISE EXCEPTION 'Scene access required' USING ERRCODE='42501'; END IF;
 IF p_persona_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.personas WHERE id=p_persona_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Choose your own persona' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.conversations WHERE id=p_conversation_id FOR UPDATE;
 UPDATE public.conversation_participants SET persona_id=p_persona_id,persona_selected=true WHERE conversation_id=p_conversation_id AND user_id=auth.uid();
END; $$;

CREATE OR REPLACE FUNCTION public.branch_chimera_conversation(p_conversation_id uuid,p_message_id uuid,p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_scene public.conversations; v_point public.messages; v_id uuid; v_target uuid; v_last public.messages;
BEGIN
 IF auth.uid() IS NULL OR p_request_id IS NULL OR NOT chimera_private.is_conversation_member(p_conversation_id) THEN RAISE EXCEPTION 'Scene access required' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('chimera:branch:'||auth.uid()::text||p_request_id::text,0));
 SELECT id INTO v_id FROM public.conversations WHERE created_by=auth.uid() AND branch_request_id=p_request_id;
 IF FOUND THEN
   IF NOT EXISTS(SELECT 1 FROM public.conversations WHERE id=v_id AND parent_conversation_id=p_conversation_id AND branch_point_id=p_message_id) THEN RAISE EXCEPTION 'Branch retry mismatch'; END IF;
   SELECT id INTO v_target FROM public.messages WHERE conversation_id=v_id AND source_message_id=p_message_id;
   RETURN jsonb_build_object('conversation_id',v_id,'message_id',v_target);
 END IF;
 SELECT * INTO v_scene FROM public.conversations WHERE id=p_conversation_id FOR SHARE;
 SELECT * INTO v_point FROM public.messages WHERE id=p_message_id AND conversation_id=p_conversation_id AND deleted_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Branch point unavailable'; END IF;
 INSERT INTO public.conversations(type,name,created_by,memory_summary,parent_conversation_id,branch_point_id,branch_request_id)
 VALUES(v_scene.type,coalesce(v_scene.name,'Scene')||' · branch',auth.uid(),coalesce(v_scene.memory_summary,''),p_conversation_id,p_message_id,p_request_id) RETURNING id INTO v_id;
 -- A branch is a private copy for its creator and participating AI identities.
 -- Other humans are not silently added to a new private scene.
 INSERT INTO public.conversation_participants(conversation_id,user_id,persona_id,persona_selected)
 SELECT v_id,cp.user_id,cp.persona_id,cp.persona_selected FROM public.conversation_participants cp
 JOIN public.profiles p ON p.user_id=cp.user_id WHERE cp.conversation_id=p_conversation_id AND (cp.user_id=auth.uid() OR p.role='ai_character');
 INSERT INTO public.messages(conversation_id,sender_id,content,image_url,read,created_at,source_message_id,persona_id,response_versions)
 SELECT v_id,m.sender_id,m.content,m.image_url,true,m.created_at,m.id,m.persona_id,m.response_versions FROM public.messages m
 WHERE m.conversation_id=p_conversation_id AND m.deleted_at IS NULL AND (m.created_at,m.id)<=(v_point.created_at,v_point.id) ORDER BY m.created_at,m.id;
 SELECT id INTO v_target FROM public.messages WHERE conversation_id=v_id AND source_message_id=p_message_id;
 SELECT * INTO v_last FROM public.messages WHERE conversation_id=v_id ORDER BY created_at DESC,id DESC LIMIT 1;
 UPDATE public.conversations SET last_message=v_last.content,last_message_at=v_last.created_at WHERE id=v_id;
 RETURN jsonb_build_object('conversation_id',v_id,'message_id',v_target);
END; $$;

CREATE OR REPLACE FUNCTION public.complete_chimera_regeneration(p_request_id uuid,p_lease uuid,p_conversation_id uuid,p_bot_id uuid,p_message_id uuid,p_expected_content text,p_content text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_job chimera_private.ai_requests; v_message public.messages;
BEGIN
 SELECT * INTO v_job FROM chimera_private.ai_requests WHERE id=p_request_id FOR UPDATE;
 IF NOT FOUND OR v_job.lease<>p_lease OR v_job.operation<>'chat' OR v_job.resource<>p_conversation_id::text||':'||p_bot_id::text THEN RAISE EXCEPTION 'Invalid regeneration reservation'; END IF;
 IF v_job.state='completed' THEN RETURN; END IF;
 IF v_job.state<>'running' OR v_job.expires_at<=now() THEN RAISE EXCEPTION 'Regeneration expired'; END IF;
 PERFORM 1 FROM public.conversations WHERE id=p_conversation_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.conversation_participants WHERE conversation_id=p_conversation_id AND user_id=v_job.user_id) OR
 NOT EXISTS(SELECT 1 FROM public.conversations WHERE id=p_conversation_id AND created_by=v_job.user_id) OR
 NOT EXISTS(SELECT 1 FROM public.ai_characters a JOIN public.profiles p ON p.user_id=a.user_id AND p.role='ai_character' JOIN public.conversation_participants cp ON cp.user_id=a.user_id WHERE cp.conversation_id=p_conversation_id AND a.user_id=p_bot_id AND (a.visibility IN('public','unlisted') OR a.creator_id=v_job.user_id)) THEN RAISE EXCEPTION 'Regeneration permission required' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_message FROM public.messages WHERE id=p_message_id AND conversation_id=p_conversation_id AND sender_id=p_bot_id AND deleted_at IS NULL FOR UPDATE;
 IF NOT FOUND OR v_message.content IS DISTINCT FROM p_expected_content THEN RAISE EXCEPTION 'Response changed; refresh before regenerating'; END IF;
 IF EXISTS(SELECT 1 FROM public.messages WHERE conversation_id=p_conversation_id AND deleted_at IS NULL AND (created_at,id)>(v_message.created_at,v_message.id)) THEN RAISE EXCEPTION 'Branch before regenerating an earlier response'; END IF;
 IF v_message.persona_id IS DISTINCT FROM (SELECT CASE WHEN cp.persona_selected THEN cp.persona_id ELSE coalesce(cp.persona_id,(SELECT id FROM public.personas WHERE user_id=v_job.user_id AND is_default LIMIT 1)) END FROM public.conversation_participants cp WHERE cp.conversation_id=p_conversation_id AND cp.user_id=v_job.user_id) THEN RAISE EXCEPTION 'Persona changed; regenerate in the original persona'; END IF;
 IF p_content IS NULL OR char_length(p_content) NOT BETWEEN 1 AND 32000 THEN RAISE EXCEPTION 'Invalid response'; END IF;
 UPDATE public.messages SET content=p_content,response_versions=response_versions||jsonb_build_array(jsonb_build_object('content',v_message.content,'replaced_at',now())) WHERE id=p_message_id;
 UPDATE public.conversations SET last_message=p_content,last_message_at=now() WHERE id=p_conversation_id;
 UPDATE chimera_private.ai_requests SET state='completed',result=jsonb_build_object('reply',p_content,'message_id',p_message_id) WHERE id=p_request_id;
END; $$;

CREATE OR REPLACE FUNCTION public.save_chimera_scene_canon(p_conversation_id uuid,p_expected_revision bigint,p_content text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_revision bigint;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.conversations WHERE id=p_conversation_id AND created_by=auth.uid()) THEN RAISE EXCEPTION 'Only the scene creator controls canon' USING ERRCODE='42501'; END IF;
 IF p_content IS NULL OR char_length(p_content)>20000 THEN RAISE EXCEPTION 'Canon is too large'; END IF;
 UPDATE public.conversations SET memory_summary=p_content,canon_revision=canon_revision+1 WHERE id=p_conversation_id AND canon_revision=p_expected_revision RETURNING canon_revision INTO v_revision;
 IF NOT FOUND THEN RAISE EXCEPTION 'Canon changed elsewhere; refresh to compare'; END IF;
 RETURN v_revision;
END; $$;
REVOKE ALL ON FUNCTION public.set_chimera_scene_persona(uuid,uuid),public.branch_chimera_conversation(uuid,uuid,uuid),public.save_chimera_scene_canon(uuid,bigint,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_chimera_scene_persona(uuid,uuid),public.branch_chimera_conversation(uuid,uuid,uuid),public.save_chimera_scene_canon(uuid,bigint,text) TO authenticated;
REVOKE ALL ON FUNCTION public.complete_chimera_regeneration(uuid,uuid,uuid,uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.complete_chimera_regeneration(uuid,uuid,uuid,uuid,uuid,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.create_chimera_scene(p_bot_ids uuid[],p_name text DEFAULT NULL,p_canon text DEFAULT '')
RETURNS public.conversations LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_scene public.conversations; v_bot uuid;
BEGIN
 IF auth.uid() IS NULL OR coalesce(array_length(p_bot_ids,1),0)>12 OR char_length(coalesce(p_canon,''))>20000 THEN RAISE EXCEPTION 'Invalid scene'; END IF;
 FOREACH v_bot IN ARRAY coalesce(p_bot_ids,'{}'::uuid[]) LOOP
  IF NOT EXISTS(SELECT 1 FROM public.ai_characters a JOIN public.profiles p ON p.user_id=a.user_id AND p.role='ai_character' WHERE a.user_id=v_bot AND (a.visibility IN('public','unlisted') OR a.creator_id=auth.uid())) THEN RAISE EXCEPTION 'Character unavailable' USING ERRCODE='42501'; END IF;
 END LOOP;
 INSERT INTO public.conversations(type,name,created_by,memory_summary) VALUES(CASE WHEN array_length(p_bot_ids,1)>1 THEN 'group' ELSE 'dm' END,p_name,auth.uid(),coalesce(p_canon,'')) RETURNING * INTO v_scene;
 INSERT INTO public.conversation_participants(conversation_id,user_id) VALUES(v_scene.id,auth.uid());
 INSERT INTO public.conversation_participants(conversation_id,user_id) SELECT v_scene.id,b FROM (SELECT DISTINCT unnest(p_bot_ids) b) bots;
 RETURN v_scene;
END; $$;
REVOKE ALL ON FUNCTION public.create_chimera_scene(uuid[],text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_chimera_scene(uuid[],text,text) TO authenticated;

CREATE OR REPLACE FUNCTION chimera_private.guard_scene_canon() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user IN('anon','authenticated') AND (NEW.memory_summary IS DISTINCT FROM OLD.memory_summary OR NEW.canon_revision IS DISTINCT FROM OLD.canon_revision OR NEW.parent_conversation_id IS DISTINCT FROM OLD.parent_conversation_id OR NEW.branch_point_id IS DISTINCT FROM OLD.branch_point_id OR NEW.branch_request_id IS DISTINCT FROM OLD.branch_request_id) THEN RAISE EXCEPTION 'Use the authorized scene operation' USING ERRCODE='42501'; END IF;
 IF NEW.memory_summary IS DISTINCT FROM OLD.memory_summary AND NEW.canon_revision=OLD.canon_revision THEN NEW.canon_revision:=OLD.canon_revision+1; END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS chimera_guard_scene_canon ON public.conversations;
CREATE TRIGGER chimera_guard_scene_canon BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_scene_canon();
REVOKE ALL ON FUNCTION chimera_private.guard_scene_canon() FROM PUBLIC;
-- Restore a persisted response variation without rewriting later history.
CREATE OR REPLACE FUNCTION public.restore_chimera_response_variant(p_conversation_id uuid,p_message_id uuid,p_expected_content text,p_content text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_message public.messages;
BEGIN
 PERFORM 1 FROM public.conversations WHERE id=p_conversation_id AND created_by=auth.uid() FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.conversation_participants WHERE conversation_id=p_conversation_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Scene creator access required' USING ERRCODE='42501'; END IF;
 SELECT m.* INTO v_message FROM public.messages m JOIN public.profiles p ON p.user_id=m.sender_id AND p.role='ai_character' WHERE m.id=p_message_id AND m.conversation_id=p_conversation_id AND m.deleted_at IS NULL FOR UPDATE OF m;
 IF NOT FOUND OR v_message.content IS DISTINCT FROM p_expected_content THEN RAISE EXCEPTION 'Response changed; refresh before selecting a variation'; END IF;
 IF EXISTS(SELECT 1 FROM public.messages WHERE conversation_id=p_conversation_id AND deleted_at IS NULL AND (created_at,id)>(v_message.created_at,v_message.id)) THEN RAISE EXCEPTION 'Branch before changing an earlier response'; END IF;
 IF v_message.persona_id IS DISTINCT FROM (SELECT CASE WHEN cp.persona_selected THEN cp.persona_id ELSE coalesce(cp.persona_id,(SELECT id FROM public.personas WHERE user_id=auth.uid() AND is_default LIMIT 1)) END FROM public.conversation_participants cp WHERE cp.conversation_id=p_conversation_id AND cp.user_id=auth.uid()) THEN RAISE EXCEPTION 'Select the original persona before restoring a variation'; END IF;
 IF p_content IS DISTINCT FROM v_message.content AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(v_message.response_versions) version WHERE version->>'content'=p_content) THEN RAISE EXCEPTION 'Choose a saved response variation'; END IF;
 IF p_content IS DISTINCT FROM v_message.content THEN
  UPDATE public.messages SET content=p_content,response_versions=response_versions||jsonb_build_array(jsonb_build_object('content',v_message.content,'replaced_at',now())) WHERE id=p_message_id;
  UPDATE public.conversations SET last_message=p_content,last_message_at=now() WHERE id=p_conversation_id;
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.restore_chimera_response_variant(uuid,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.restore_chimera_response_variant(uuid,uuid,text,text) TO authenticated;
COMMIT;
