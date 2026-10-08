-- Recheck turning-point access without changing reward or currency functions.
BEGIN;
CREATE OR REPLACE FUNCTION chimera_private.require_turning_point_access(p_user uuid,p_scene uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 -- Serialize consent/verification updates with admission, cache and completion.
 PERFORM 1 FROM public.chimera_user_preferences WHERE user_id=p_user FOR SHARE;
 IF p_user IS NULL OR NOT EXISTS (
   SELECT 1 FROM public.conversations c
   JOIN public.conversation_participants cp ON cp.conversation_id=c.id
   WHERE c.id=p_scene AND c.type='dm' AND cp.user_id=p_user
 ) OR EXISTS (
   SELECT 1 FROM public.conversations c WHERE c.id=p_scene AND c.character_id IS NOT NULL
   AND NOT chimera_private.can_read_character_for_user(c.character_id,p_user)
 ) OR EXISTS (
   SELECT 1 FROM public.conversation_participants cp JOIN public.ai_characters a ON a.user_id=cp.user_id
   WHERE cp.conversation_id=p_scene AND NOT chimera_private.can_read_character_for_user(a.id,p_user)
 ) THEN RAISE EXCEPTION 'Turning point permission changed' USING ERRCODE='42501'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION chimera_private.require_turning_point_access(uuid,uuid) FROM PUBLIC,anon,authenticated;

-- Definer creation and service completion both insert here. Check the stored
-- owner, not the service-role JWT; the preference lock lasts until commit.
CREATE OR REPLACE FUNCTION chimera_private.guard_turning_point_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM chimera_private.require_turning_point_access(NEW.user_id,NEW.conversation_id);
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION chimera_private.guard_turning_point_insert() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS chimera_turning_point_insert_access ON public.roleplay_turning_points;
CREATE TRIGGER chimera_turning_point_insert_access BEFORE INSERT ON public.roleplay_turning_points
 FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_turning_point_insert();

ALTER TABLE public.roleplay_turning_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chimera_turning_point_scene_read ON public.roleplay_turning_points;
CREATE POLICY chimera_turning_point_scene_read ON public.roleplay_turning_points
 AS RESTRICTIVE FOR SELECT TO anon,authenticated
 USING (chimera_private.is_conversation_member(conversation_id));

CREATE OR REPLACE FUNCTION public.reserve_chimera_ai_request(
  p_user_id uuid, p_operation text, p_resource text, p_request_key text, p_fingerprint text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_request chimera_private.ai_requests; v_count integer; v_minute_limit integer; v_hour_limit integer;
BEGIN
  IF p_user_id IS NULL OR p_operation NOT IN ('chat','turning_point','voice','illustration')
    OR char_length(p_request_key) NOT BETWEEN 1 AND 200 OR char_length(p_resource) NOT BETWEEN 1 AND 200
    OR p_fingerprint !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Invalid request reservation'; END IF;
  IF p_operation='turning_point' THEN PERFORM chimera_private.require_turning_point_access(p_user_id,p_resource::uuid); END IF;
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
 IF v_job.operation='turning_point' THEN PERFORM chimera_private.require_turning_point_access(v_job.user_id,v_job.resource::uuid); END IF;
 IF v_job.operation='chat' THEN PERFORM chimera_private.require_character_request_access(v_job.user_id,v_job.resource); END IF;
 RETURN jsonb_build_object('state',v_job.state,'result',v_job.result);
END;
$$;

-- Preserve the existing service-only interface.
REVOKE ALL ON FUNCTION public.reserve_chimera_ai_request(uuid,text,text,text,text),
 public.get_chimera_ai_request(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_chimera_ai_request(uuid,text,text,text,text),
 public.get_chimera_ai_request(uuid,uuid) TO service_role;
COMMIT;
