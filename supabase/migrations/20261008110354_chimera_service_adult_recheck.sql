-- Recheck the reservation's identity, not the service-role JWT. Lock the
-- preference row before saving/returning a reply to serialize with revocation.
BEGIN;
CREATE OR REPLACE FUNCTION chimera_private.can_read_character_for_user(p_character uuid,p_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p_user IS NOT NULL AND EXISTS (
 SELECT 1 FROM public.ai_characters a WHERE a.id=p_character
 AND (a.visibility IN('public','unlisted') OR a.creator_id=p_user)
 AND (upper(trim(coalesce(nullif(a.content_rating,''),'SFW')))='SFW'
 OR EXISTS(SELECT 1 FROM public.chimera_user_preferences pref WHERE pref.user_id=p_user
 AND pref.age_verification_status='verified_adult' AND pref.adult_content_enabled IS TRUE)));
$$;
REVOKE ALL ON FUNCTION chimera_private.can_read_character_for_user(uuid,uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION chimera_private.require_character_request_access(p_user uuid,p_resource text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_scene uuid; v_bot uuid;
BEGIN
 IF p_user IS NULL THEN RAISE EXCEPTION 'Roleplay permission changed' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.chimera_user_preferences WHERE user_id=p_user FOR SHARE;
 IF split_part(p_resource,':',1)='room' THEN
   IF NOT chimera_private.room_ai_allowed(split_part(p_resource,':',2)::uuid,p_user,split_part(p_resource,':',3)::uuid)
   THEN RAISE EXCEPTION 'Room permission changed' USING ERRCODE='42501'; END IF;
 ELSE
   v_scene:=split_part(p_resource,':',1)::uuid; v_bot:=split_part(p_resource,':',2)::uuid;
   IF NOT EXISTS(SELECT 1 FROM public.conversation_participants cp JOIN public.ai_characters a ON a.user_id=cp.user_id
      WHERE cp.conversation_id=v_scene AND cp.user_id=v_bot AND chimera_private.can_read_character_for_user(a.id,p_user))
      OR NOT EXISTS(SELECT 1 FROM public.conversation_participants WHERE conversation_id=v_scene AND user_id=p_user)
      OR EXISTS(SELECT 1 FROM public.conversations c WHERE c.id=v_scene AND c.character_id IS NOT NULL
        AND NOT chimera_private.can_read_character_for_user(c.character_id,p_user))
      OR EXISTS(SELECT 1 FROM public.conversation_participants cp JOIN public.ai_characters a ON a.user_id=cp.user_id
        WHERE cp.conversation_id=v_scene AND NOT chimera_private.can_read_character_for_user(a.id,p_user))
   THEN RAISE EXCEPTION 'Roleplay permission changed' USING ERRCODE='42501'; END IF;
 END IF;
END;
$$;
REVOKE ALL ON FUNCTION chimera_private.require_character_request_access(uuid,text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION chimera_private.room_ai_allowed(p_session uuid,p_user uuid,p_character uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.human_roleplay_sessions s JOIN public.human_roleplay_participants cp ON cp.session_id=s.id AND cp.user_id=p_user AND cp.status='accepted' AND cp.ai_opt_in JOIN public.human_roleplay_characters rc ON rc.session_id=s.id AND rc.id=p_character JOIN public.ai_characters a ON a.id=rc.ai_character_id JOIN public.profiles p ON p.user_id=a.user_id AND p.role='ai_character' WHERE s.id=p_session AND s.ai_enabled AND s.status IN('open','active') AND (s.ai_policy='participants' OR s.creator_id=p_user) AND (s.turn_user_id IS NULL OR s.turn_user_id=p_user) AND chimera_private.can_read_character_for_user(a.id,p_user) AND NOT EXISTS (SELECT 1 FROM public.human_roleplay_participants member WHERE member.session_id=s.id AND member.status='accepted' AND NOT chimera_private.can_read_character_for_user(a.id,member.user_id)) AND (a.visibility IN('public','unlisted') OR a.creator_id=s.creator_id) AND NOT EXISTS(SELECT 1 FROM public.human_roleplay_participants other WHERE other.session_id=s.id AND other.status='accepted' AND NOT other.ai_opt_in));
$$;

CREATE OR REPLACE FUNCTION public.complete_chimera_chat_request(
  p_request_id uuid,p_lease uuid,p_conversation_id uuid,p_bot_id uuid,p_content text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_request chimera_private.ai_requests;
BEGIN
  SELECT * INTO v_request FROM chimera_private.ai_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR v_request.lease <> p_lease OR v_request.operation <> 'chat'
    OR v_request.resource <> p_conversation_id::text || ':' || p_bot_id::text THEN RAISE EXCEPTION 'Invalid chat reservation'; END IF;
  PERFORM chimera_private.require_character_request_access(v_request.user_id,v_request.resource);
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

CREATE OR REPLACE FUNCTION public.complete_chimera_regeneration(p_request_id uuid,p_lease uuid,p_conversation_id uuid,p_bot_id uuid,p_message_id uuid,p_expected_content text,p_content text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_job chimera_private.ai_requests; v_message public.messages;
BEGIN
 SELECT * INTO v_job FROM chimera_private.ai_requests WHERE id=p_request_id FOR UPDATE;
 IF NOT FOUND OR v_job.lease<>p_lease OR v_job.operation<>'chat' OR v_job.resource<>p_conversation_id::text||':'||p_bot_id::text THEN RAISE EXCEPTION 'Invalid regeneration reservation'; END IF;
 PERFORM chimera_private.require_character_request_access(v_job.user_id,v_job.resource);
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

CREATE OR REPLACE FUNCTION public.complete_chimera_room_ai(p_request_id uuid,p_lease uuid,p_session_id uuid,p_character_id uuid,p_source_id uuid,p_content text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_job chimera_private.ai_requests; v_message public.human_roleplay_messages; v_sender uuid; v_sequence bigint;
BEGIN
 -- Admission locks the room before request state; keep the same lock order.
 PERFORM 1 FROM public.human_roleplay_sessions WHERE id=p_session_id FOR UPDATE;
 SELECT * INTO v_job FROM chimera_private.ai_requests WHERE id=p_request_id FOR UPDATE;
 IF NOT FOUND OR v_job.lease<>p_lease OR v_job.operation<>'chat' OR v_job.resource<>'room:'||p_session_id::text||':'||p_character_id::text OR v_job.request_key<>'turn:'||p_source_id::text THEN RAISE EXCEPTION 'Invalid room request'; END IF;
 PERFORM chimera_private.require_character_request_access(v_job.user_id,v_job.resource);
  IF v_job.state='completed' THEN RETURN v_job.result; END IF;
 IF v_job.state<>'running' OR v_job.expires_at<=now() OR NOT chimera_private.room_ai_allowed(p_session_id,v_job.user_id,p_character_id) THEN RAISE EXCEPTION 'Room permission changed'; END IF;
 IF p_content IS NULL OR char_length(p_content) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Invalid reply'; END IF;
 SELECT a.user_id INTO v_sender FROM public.human_roleplay_characters rc JOIN public.ai_characters a ON a.id=rc.ai_character_id WHERE rc.id=p_character_id AND rc.session_id=p_session_id;
 SELECT coalesce(max(sequence_number),0)+1 INTO v_sequence FROM public.human_roleplay_messages WHERE session_id=p_session_id;
 INSERT INTO public.human_roleplay_messages(session_id,sender_id,character_id,message_type,content,sequence_number,author_kind,reply_to_id) VALUES(p_session_id,v_sender,p_character_id,'dialogue',p_content,v_sequence,'ai',p_source_id) RETURNING * INTO v_message;
 UPDATE chimera_private.ai_requests SET state='completed',result=jsonb_build_object('reply',p_content,'message_id',v_message.id) WHERE id=p_request_id;
 RETURN jsonb_build_object('reply',p_content,'message_id',v_message.id);
END; $$;

CREATE OR REPLACE FUNCTION public.reserve_chimera_ai_request(
  p_user_id uuid, p_operation text, p_resource text, p_request_key text, p_fingerprint text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_request chimera_private.ai_requests; v_count integer; v_minute_limit integer; v_hour_limit integer;
BEGIN
  IF p_user_id IS NULL OR p_operation NOT IN ('chat','turning_point','voice','illustration')
    OR char_length(p_request_key) NOT BETWEEN 1 AND 200 OR char_length(p_resource) NOT BETWEEN 1 AND 200
    OR p_fingerprint !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Invalid request reservation'; END IF;
  IF p_operation='chat' THEN PERFORM chimera_private.require_character_request_access(p_user_id,p_resource); END IF;
  -- Serialize all admissions so the global cap and per-user caps cannot race.
  PERFORM pg_advisory_xact_lock(hashtextextended('chimera:ai:admission',0));
  SELECT * INTO v_request FROM chimera_private.ai_requests
    WHERE user_id = p_user_id AND operation = p_operation AND resource = p_resource AND request_key = p_request_key FOR UPDATE;
  IF FOUND THEN
    IF v_request.fingerprint <> p_fingerprint THEN RETURN jsonb_build_object('state','conflict'); END IF;
    IF v_request.state = 'completed' THEN RETURN jsonb_build_object('state','completed','id',v_request.id,'result',v_request.result); END IF;
    IF v_request.state = 'running' AND (v_request.expires_at > now() OR (p_operation = 'illustration' AND v_request.result IS NOT NULL)) THEN
      -- An interrupted, charged illustration requires reconciliation, not another
      -- automatic charge when the lease expires.
      RETURN jsonb_build_object('state','busy');
    END IF;
  END IF;
  SELECT count(*) INTO v_count FROM chimera_private.ai_requests
    WHERE user_id = p_user_id AND state = 'running' AND expires_at > now();
  IF v_count >= 2 OR EXISTS (SELECT 1 FROM chimera_private.ai_requests
    WHERE user_id = p_user_id AND resource = p_resource AND state = 'running' AND expires_at > now()) THEN
    RETURN jsonb_build_object('state','busy');
  END IF;
  SELECT count(*) INTO v_count FROM chimera_private.ai_attempts WHERE user_id = p_user_id AND started_at > now() - interval '1 minute';
  IF v_count >= 60 THEN RETURN jsonb_build_object('state','limited'); END IF;
  SELECT count(*) INTO v_count FROM chimera_private.ai_attempts WHERE user_id = p_user_id AND started_at > now() - interval '1 hour';
  IF v_count >= 240 THEN RETURN jsonb_build_object('state','limited'); END IF;
  v_minute_limit := CASE p_operation WHEN 'voice' THEN 12 WHEN 'illustration' THEN 4 ELSE 60 END;
  v_hour_limit := CASE p_operation WHEN 'voice' THEN 30 WHEN 'illustration' THEN 12 ELSE 240 END;
  SELECT count(*) INTO v_count FROM chimera_private.ai_attempts WHERE user_id = p_user_id AND operation = p_operation AND started_at > now() - interval '1 minute';
  IF v_count >= v_minute_limit THEN RETURN jsonb_build_object('state','limited'); END IF;
  SELECT count(*) INTO v_count FROM chimera_private.ai_attempts WHERE user_id = p_user_id AND operation = p_operation AND started_at > now() - interval '1 hour';
  IF v_count >= v_hour_limit THEN RETURN jsonb_build_object('state','limited'); END IF;
  SELECT count(*) INTO v_count FROM chimera_private.ai_attempts WHERE started_at > now() - interval '1 hour';
  IF v_count >= 3000 THEN RETURN jsonb_build_object('state','limited'); END IF;
  INSERT INTO chimera_private.ai_attempts(user_id,operation) VALUES(p_user_id,p_operation);
  INSERT INTO chimera_private.ai_requests(user_id,operation,resource,request_key,fingerprint,state,expires_at)
    VALUES(p_user_id,p_operation,p_resource,p_request_key,p_fingerprint,'running',now()+interval '2 minutes')
  ON CONFLICT (user_id,operation,resource,request_key) DO UPDATE SET state = 'running', lease = gen_random_uuid(), expires_at = now()+interval '2 minutes', result = NULL
  RETURNING * INTO v_request;
  RETURN jsonb_build_object('state','reserved','id',v_request.id,'lease',v_request.lease);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_chimera_ai_request(p_request_id uuid,p_lease uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_job chimera_private.ai_requests;
BEGIN
 SELECT * INTO v_job FROM chimera_private.ai_requests WHERE id=p_request_id AND lease=p_lease FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF v_job.operation='chat' THEN PERFORM chimera_private.require_character_request_access(v_job.user_id,v_job.resource); END IF;
 RETURN jsonb_build_object('state',v_job.state,'result',v_job.result);
END;
$$;
REVOKE ALL ON FUNCTION chimera_private.room_ai_allowed(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.complete_chimera_chat_request(uuid,uuid,uuid,uuid,text),
 public.complete_chimera_regeneration(uuid,uuid,uuid,uuid,uuid,text,text),
 public.complete_chimera_room_ai(uuid,uuid,uuid,uuid,uuid,text),
 public.reserve_chimera_ai_request(uuid,text,text,text,text),public.get_chimera_ai_request(uuid,uuid)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.complete_chimera_chat_request(uuid,uuid,uuid,uuid,text),
 public.complete_chimera_regeneration(uuid,uuid,uuid,uuid,uuid,text,text),
 public.complete_chimera_room_ai(uuid,uuid,uuid,uuid,uuid,text),
 public.reserve_chimera_ai_request(uuid,text,text,text,text),public.get_chimera_ai_request(uuid,uuid) TO service_role;

-- Legacy published snapshots are independent copies of character dialogue.
-- Protect them as well as the live source transcript.
CREATE POLICY chimera_adult_public_scene_read ON public.roleplay_public_scenes
 AS RESTRICTIVE FOR SELECT TO anon,authenticated
 USING (chimera_private.can_read_character_scene(conversation_id)
   AND (content_rating='limited' OR EXISTS(SELECT 1 FROM public.chimera_user_preferences pref WHERE pref.user_id=auth.uid() AND pref.age_verification_status='verified_adult' AND pref.adult_content_enabled IS TRUE)));
CREATE POLICY chimera_adult_public_snapshot_read ON public.roleplay_public_scene_messages
 AS RESTRICTIVE FOR SELECT TO anon,authenticated
 USING (EXISTS(SELECT 1 FROM public.roleplay_public_scenes s WHERE s.id=scene_id));
COMMIT;
