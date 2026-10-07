-- Durable, service-only request coordination. No prompts, voice text, credentials,
-- wallet balances or reward amounts are stored/changed by these controls.
BEGIN;
CREATE TABLE IF NOT EXISTS chimera_private.ai_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation text NOT NULL CHECK (operation IN ('chat','turning_point','voice','illustration')),
  resource text NOT NULL,
  request_key text NOT NULL CHECK (char_length(request_key) BETWEEN 1 AND 200),
  fingerprint text NOT NULL,
  state text NOT NULL CHECK (state IN ('running','completed','failed')),
  lease uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,operation,resource,request_key)
);
CREATE INDEX IF NOT EXISTS chimera_ai_running ON chimera_private.ai_requests(user_id,resource,expires_at) WHERE state = 'running';
CREATE TABLE IF NOT EXISTS chimera_private.ai_attempts (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chimera_ai_attempts_user ON chimera_private.ai_attempts(user_id,started_at);
CREATE INDEX IF NOT EXISTS chimera_ai_attempts_global ON chimera_private.ai_attempts(started_at);
ALTER TABLE chimera_private.ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chimera_private.ai_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON chimera_private.ai_requests, chimera_private.ai_attempts FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reserve_chimera_ai_request(
  p_user_id uuid, p_operation text, p_resource text, p_request_key text, p_fingerprint text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_request chimera_private.ai_requests; v_count integer; v_minute_limit integer; v_hour_limit integer;
BEGIN
  IF p_user_id IS NULL OR p_operation NOT IN ('chat','turning_point','voice','illustration')
    OR char_length(p_request_key) NOT BETWEEN 1 AND 200 OR char_length(p_resource) NOT BETWEEN 1 AND 200
    OR p_fingerprint !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Invalid request reservation'; END IF;
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

CREATE OR REPLACE FUNCTION public.finish_chimera_ai_request(p_request_id uuid,p_lease uuid,p_result jsonb,p_failed boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE chimera_private.ai_requests SET state = CASE WHEN p_failed THEN 'failed' ELSE 'completed' END, result = p_result
    WHERE id = p_request_id AND lease = p_lease AND state = 'running'
      AND (operation <> 'illustration' OR result IS NULL OR (p_failed AND EXISTS (
        SELECT 1 FROM public.story_scene_illustrations i WHERE i.id = (ai_requests.result->>'illustration_id')::uuid AND i.status = 'refunded'
      )));
  IF NOT FOUND THEN RAISE EXCEPTION 'Request lease is no longer active'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_chimera_ai_request(p_request_id uuid,p_lease uuid)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object('state',state,'result',result) FROM chimera_private.ai_requests WHERE id = p_request_id AND lease = p_lease FOR UPDATE;
$$;

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
  IF NOT EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = p_conversation_id AND user_id = v_request.user_id)
    OR NOT EXISTS (SELECT 1 FROM public.conversation_participants cp JOIN public.ai_characters a ON a.user_id = cp.user_id
      JOIN public.profiles p ON p.user_id = a.user_id AND p.role = 'ai_character'
      WHERE cp.conversation_id = p_conversation_id AND cp.user_id = p_bot_id AND (a.visibility IN ('public','unlisted') OR a.creator_id = v_request.user_id)) THEN
    RAISE EXCEPTION 'Roleplay permission changed' USING ERRCODE = '42501';
  END IF;
  IF p_content IS NULL OR char_length(p_content) NOT BETWEEN 1 AND 32000 THEN RAISE EXCEPTION 'Invalid reply'; END IF;
  INSERT INTO public.messages(conversation_id,sender_id,content,read) VALUES(p_conversation_id,p_bot_id,p_content,false);
  UPDATE public.conversations SET last_message = p_content,last_message_at = now() WHERE id = p_conversation_id;
  UPDATE chimera_private.ai_requests SET state = 'completed',result = jsonb_build_object('reply',p_content) WHERE id = p_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.begin_guarded_chimera_illustration(
  p_request_id uuid,p_lease uuid,p_story_id uuid,p_chapter_id uuid,p_prompt text,p_style text,p_aspect_ratio text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_request chimera_private.ai_requests; v_id uuid;
BEGIN
  SELECT * INTO v_request FROM chimera_private.ai_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR v_request.lease <> p_lease OR v_request.state <> 'running' OR v_request.operation <> 'illustration'
    OR v_request.resource <> p_story_id::text OR v_request.expires_at <= now() THEN RAISE EXCEPTION 'Invalid illustration reservation'; END IF;
  IF v_request.result IS NOT NULL THEN RETURN (v_request.result->>'illustration_id')::uuid; END IF;
  -- Use the existing wallet operation and its unchanged 400-credit cost.
  SELECT public.begin_vellum_scene_illustration(v_request.user_id,p_story_id,p_chapter_id,p_prompt,p_style,p_aspect_ratio,400) INTO v_id;
  UPDATE chimera_private.ai_requests SET result = jsonb_build_object('illustration_id',v_id) WHERE id = p_request_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_guarded_chimera_illustration(p_request_id uuid,p_lease uuid,p_storage_path text,p_result jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_request chimera_private.ai_requests;
BEGIN
  SELECT * INTO v_request FROM chimera_private.ai_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR v_request.lease <> p_lease OR v_request.state <> 'running' OR v_request.operation <> 'illustration'
    OR v_request.result->>'illustration_id' IS NULL THEN RAISE EXCEPTION 'Invalid illustration completion'; END IF;
  PERFORM public.complete_vellum_scene_illustration((v_request.result->>'illustration_id')::uuid,p_storage_path);
  UPDATE chimera_private.ai_requests SET state = 'completed',result = p_result WHERE id = p_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_guarded_chimera_turning_point(
  p_request_id uuid,p_lease uuid,p_conversation_id uuid,p_title text,p_scene_prompt text,p_choices jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_request chimera_private.ai_requests; v_result jsonb; v_original_sub text;
BEGIN
  SELECT * INTO v_request FROM chimera_private.ai_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND OR v_request.lease <> p_lease OR v_request.state <> 'running' OR v_request.operation <> 'turning_point'
    OR v_request.resource <> p_conversation_id::text OR v_request.expires_at <= now() THEN RAISE EXCEPTION 'Invalid turning point reservation'; END IF;
  -- The existing operation authorizes auth.uid(). Bind that identity from the
  -- service-only reservation, never an untrusted payload, and restore it after.
  v_original_sub := current_setting('request.jwt.claim.sub',true);
  PERFORM set_config('request.jwt.claim.sub',v_request.user_id::text,true);
  SELECT jsonb_build_object('turning_point',to_jsonb(public.create_my_roleplay_turning_point(p_conversation_id,p_title,p_scene_prompt,p_choices))) INTO v_result;
  PERFORM set_config('request.jwt.claim.sub',coalesce(v_original_sub,''),true);
  UPDATE chimera_private.ai_requests SET state = 'completed',result = v_result WHERE id = p_request_id;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_chimera_ai_request(uuid,text,text,text,text),
  public.get_chimera_ai_request(uuid,uuid), public.finish_chimera_ai_request(uuid,uuid,jsonb,boolean), public.complete_chimera_chat_request(uuid,uuid,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_chimera_ai_request(uuid,text,text,text,text),
  public.get_chimera_ai_request(uuid,uuid), public.finish_chimera_ai_request(uuid,uuid,jsonb,boolean), public.complete_chimera_chat_request(uuid,uuid,uuid,uuid,text) TO service_role;
REVOKE ALL ON FUNCTION public.begin_guarded_chimera_illustration(uuid,uuid,uuid,uuid,text,text,text),
  public.complete_guarded_chimera_illustration(uuid,uuid,text,jsonb), public.complete_guarded_chimera_turning_point(uuid,uuid,uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.begin_guarded_chimera_illustration(uuid,uuid,uuid,uuid,text,text,text),
  public.complete_guarded_chimera_illustration(uuid,uuid,text,jsonb), public.complete_guarded_chimera_turning_point(uuid,uuid,uuid,text,text,jsonb) TO service_role;
COMMIT;
