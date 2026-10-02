-- Complete the existing human timeline and opt-in AI participation. No wallet changes.
BEGIN;
ALTER TABLE public.human_roleplay_sessions ADD COLUMN IF NOT EXISTS ai_enabled boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS ai_policy text NOT NULL DEFAULT 'host' CHECK(ai_policy IN('host','participants')),
 ADD COLUMN IF NOT EXISTS turn_user_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL;
ALTER TABLE public.human_roleplay_participants ADD COLUMN IF NOT EXISTS persona_id uuid REFERENCES public.personas(id) ON DELETE SET NULL,
 ADD COLUMN IF NOT EXISTS ai_opt_in boolean NOT NULL DEFAULT false;
ALTER TABLE public.human_roleplay_characters ADD COLUMN IF NOT EXISTS persona_id uuid REFERENCES public.personas(id) ON DELETE SET NULL,
 ADD COLUMN IF NOT EXISTS ai_character_id uuid REFERENCES public.ai_characters(id) ON DELETE SET NULL;
ALTER TABLE public.human_roleplay_messages ADD COLUMN IF NOT EXISTS author_kind text NOT NULL DEFAULT 'human' CHECK(author_kind IN('human','ai')),
 ADD COLUMN IF NOT EXISTS client_request_id uuid, ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.human_roleplay_messages(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS chimera_room_send_retry ON public.human_roleplay_messages(session_id,sender_id,client_request_id) WHERE client_request_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS chimera_room_ai_turn ON public.human_roleplay_messages(session_id,character_id,reply_to_id) WHERE author_kind='ai' AND reply_to_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_my_human_room_preferences(p_session_id uuid,p_persona_id uuid,p_ai_opt_in boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.human_roleplay_member(p_session_id) THEN RAISE EXCEPTION 'Room membership required'; END IF;
 IF p_persona_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.personas WHERE id=p_persona_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Choose your own persona'; END IF;
 PERFORM 1 FROM public.human_roleplay_sessions WHERE id=p_session_id FOR UPDATE;
 UPDATE public.human_roleplay_participants SET persona_id=p_persona_id,ai_opt_in=p_ai_opt_in WHERE session_id=p_session_id AND user_id=auth.uid();
END; $$;
CREATE OR REPLACE FUNCTION public.configure_human_room(p_session_id uuid,p_ai_enabled boolean,p_ai_policy text,p_turn_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.human_roleplay_sessions WHERE id=p_session_id AND creator_id=auth.uid()) THEN RAISE EXCEPTION 'Host permission required'; END IF;
 IF p_ai_policy NOT IN('host','participants') OR (p_turn_user_id IS NOT NULL AND NOT public.human_roleplay_member(p_session_id,p_turn_user_id)) THEN RAISE EXCEPTION 'Invalid room policy or turn'; END IF;
 PERFORM 1 FROM public.human_roleplay_sessions WHERE id=p_session_id FOR UPDATE;
 IF p_ai_enabled AND EXISTS(SELECT 1 FROM public.human_roleplay_participants WHERE session_id=p_session_id AND status='accepted' AND NOT ai_opt_in) THEN RAISE EXCEPTION 'Every accepted participant must opt in'; END IF;
 UPDATE public.human_roleplay_sessions SET ai_enabled=p_ai_enabled,ai_policy=p_ai_policy,turn_user_id=p_turn_user_id,updated_at=now() WHERE id=p_session_id;
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
  SELECT p.display_name,a.short_description INTO v_name,v_description FROM public.ai_characters a JOIN public.profiles p ON p.user_id=a.user_id AND p.role='ai_character' WHERE a.id=p_ai_character_id AND (a.visibility IN('public','unlisted') OR a.creator_id=auth.uid());
 END IF;
 IF v_name IS NULL THEN RAISE EXCEPTION 'Identity unavailable'; END IF;
 INSERT INTO public.human_roleplay_characters(session_id,owner_id,name,description,persona_id,ai_character_id) VALUES(p_session_id,auth.uid(),v_name,coalesce(v_description,''),p_persona_id,p_ai_character_id) RETURNING id INTO v_id;
 RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION chimera_private.guard_human_room_identity() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user IN('anon','authenticated') THEN
  IF TG_TABLE_NAME='human_roleplay_sessions' THEN
   IF NEW.id IS DISTINCT FROM OLD.id OR NEW.creator_id IS DISTINCT FROM OLD.creator_id OR NEW.ai_enabled IS DISTINCT FROM OLD.ai_enabled OR NEW.ai_policy IS DISTINCT FROM OLD.ai_policy OR NEW.turn_user_id IS DISTINCT FROM OLD.turn_user_id THEN RAISE EXCEPTION 'Use the authorized room operation'; END IF;
  ELSIF TG_TABLE_NAME='human_roleplay_characters' THEN
   IF TG_OP='INSERT' THEN
    IF NEW.ai_character_id IS NOT NULL OR NEW.persona_id IS NOT NULL THEN RAISE EXCEPTION 'Use the authorized identity attachment'; END IF;
   ELSIF NEW.ai_character_id IS DISTINCT FROM OLD.ai_character_id OR NEW.persona_id IS DISTINCT FROM OLD.persona_id THEN RAISE EXCEPTION 'Room character identity is immutable'; END IF;
  ELSIF TG_TABLE_NAME='human_roleplay_participants' THEN
   IF NEW.persona_id IS DISTINCT FROM OLD.persona_id OR NEW.ai_opt_in IS DISTINCT FROM OLD.ai_opt_in THEN RAISE EXCEPTION 'Use the authorized consent and persona operation'; END IF;
  ELSIF TG_TABLE_NAME='human_roleplay_messages' THEN
   IF NEW.author_kind IS DISTINCT FROM OLD.author_kind OR NEW.client_request_id IS DISTINCT FROM OLD.client_request_id OR NEW.reply_to_id IS DISTINCT FROM OLD.reply_to_id OR OLD.author_kind='ai' THEN RAISE EXCEPTION 'Room message identity is immutable'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS chimera_room_identity ON public.human_roleplay_sessions;
CREATE TRIGGER chimera_room_identity BEFORE UPDATE ON public.human_roleplay_sessions FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_human_room_identity();
DROP TRIGGER IF EXISTS chimera_room_character_identity ON public.human_roleplay_characters;
CREATE TRIGGER chimera_room_character_identity BEFORE INSERT OR UPDATE ON public.human_roleplay_characters FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_human_room_identity();
DROP TRIGGER IF EXISTS chimera_room_message_identity ON public.human_roleplay_messages;
CREATE TRIGGER chimera_room_message_identity BEFORE UPDATE ON public.human_roleplay_messages FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_human_room_identity();
DROP TRIGGER IF EXISTS chimera_room_preference_identity ON public.human_roleplay_participants;
CREATE TRIGGER chimera_room_preference_identity BEFORE UPDATE ON public.human_roleplay_participants FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_human_room_identity();
REVOKE ALL ON FUNCTION chimera_private.guard_human_room_identity() FROM PUBLIC;

-- Add request identity around the existing ordered, owner-validated send RPC.
CREATE OR REPLACE FUNCTION public.send_human_roleplay_message(p_session_id uuid,p_content text,p_message_type text,p_character_id uuid,p_request_id uuid)
RETURNS public.human_roleplay_messages LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_message public.human_roleplay_messages; v_session public.human_roleplay_sessions;
BEGIN
 IF auth.uid() IS NULL OR p_request_id IS NULL OR NOT public.human_roleplay_member(p_session_id) THEN RAISE EXCEPTION 'Room membership and retry identifier required'; END IF;
 SELECT * INTO v_session FROM public.human_roleplay_sessions WHERE id=p_session_id FOR UPDATE;
 SELECT * INTO v_message FROM public.human_roleplay_messages WHERE session_id=p_session_id AND sender_id=auth.uid() AND client_request_id=p_request_id;
 IF FOUND THEN
  IF v_message.content IS DISTINCT FROM trim(p_content) OR v_message.character_id IS DISTINCT FROM p_character_id OR v_message.message_type IS DISTINCT FROM p_message_type THEN RAISE EXCEPTION 'Retry payload changed'; END IF;
  RETURN v_message;
 END IF;
 IF v_session.status NOT IN('open','active') OR (v_session.turn_user_id IS NOT NULL AND v_session.turn_user_id<>auth.uid() AND p_message_type<>'system') THEN RAISE EXCEPTION 'The room is paused or it is another participant''s turn'; END IF;
 IF p_message_type='system' AND v_session.creator_id<>auth.uid() THEN RAISE EXCEPTION 'Only the host can post system events'; END IF;
 IF p_character_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.human_roleplay_characters WHERE id=p_character_id AND ai_character_id IS NOT NULL) THEN RAISE EXCEPTION 'AI messages use the protected AI writer'; END IF;
 SELECT * INTO v_message FROM public.send_human_roleplay_message(p_session_id,p_content,p_message_type,p_character_id);
 UPDATE public.human_roleplay_messages SET client_request_id=p_request_id WHERE id=v_message.id RETURNING * INTO v_message;
 RETURN v_message;
END; $$;
-- Retain the old writer internally; clients use the retry-safe overload.
REVOKE ALL ON FUNCTION public.send_human_roleplay_message(uuid,text,text,uuid) FROM authenticated,anon,PUBLIC;

CREATE OR REPLACE FUNCTION chimera_private.room_ai_allowed(p_session uuid,p_user uuid,p_character uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.human_roleplay_sessions s JOIN public.human_roleplay_participants cp ON cp.session_id=s.id AND cp.user_id=p_user AND cp.status='accepted' AND cp.ai_opt_in JOIN public.human_roleplay_characters rc ON rc.session_id=s.id AND rc.id=p_character JOIN public.ai_characters a ON a.id=rc.ai_character_id JOIN public.profiles p ON p.user_id=a.user_id AND p.role='ai_character' WHERE s.id=p_session AND s.ai_enabled AND s.status IN('open','active') AND (s.ai_policy='participants' OR s.creator_id=p_user) AND (s.turn_user_id IS NULL OR s.turn_user_id=p_user) AND (a.visibility IN('public','unlisted') OR a.creator_id=s.creator_id) AND NOT EXISTS(SELECT 1 FROM public.human_roleplay_participants other WHERE other.session_id=s.id AND other.status='accepted' AND NOT other.ai_opt_in));
$$;
REVOKE ALL ON FUNCTION chimera_private.room_ai_allowed(uuid,uuid,uuid) FROM PUBLIC;
CREATE OR REPLACE FUNCTION public.reserve_chimera_room_ai(p_user_id uuid,p_session_id uuid,p_character_id uuid,p_source_id uuid,p_fingerprint text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_resource text; v_message public.human_roleplay_messages;
BEGIN
 PERFORM 1 FROM public.human_roleplay_sessions WHERE id=p_session_id FOR UPDATE;
 IF NOT chimera_private.room_ai_allowed(p_session_id,p_user_id,p_character_id) THEN RAISE EXCEPTION 'Explicit room consent and turn permission required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.human_roleplay_messages WHERE id=p_source_id AND session_id=p_session_id AND author_kind='human' AND deleted_at IS NULL) THEN RAISE EXCEPTION 'Choose a human turn'; END IF;
 SELECT * INTO v_message FROM public.human_roleplay_messages WHERE session_id=p_session_id AND character_id=p_character_id AND reply_to_id=p_source_id AND author_kind='ai';
 IF FOUND THEN RETURN jsonb_build_object('state','completed','result',jsonb_build_object('reply',v_message.content,'message_id',v_message.id)); END IF;
 v_resource:='room:'||p_session_id::text||':'||p_character_id::text;
 IF EXISTS(SELECT 1 FROM chimera_private.ai_requests WHERE resource=v_resource AND state='running' AND expires_at>now()) THEN RETURN jsonb_build_object('state','busy'); END IF;
 RETURN public.reserve_chimera_ai_request(p_user_id,'chat',v_resource,'turn:'||p_source_id::text,p_fingerprint);
END; $$;
CREATE OR REPLACE FUNCTION public.complete_chimera_room_ai(p_request_id uuid,p_lease uuid,p_session_id uuid,p_character_id uuid,p_source_id uuid,p_content text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_job chimera_private.ai_requests; v_message public.human_roleplay_messages; v_sender uuid; v_sequence bigint;
BEGIN
 -- Admission locks the room before request state; keep the same lock order.
 PERFORM 1 FROM public.human_roleplay_sessions WHERE id=p_session_id FOR UPDATE;
 SELECT * INTO v_job FROM chimera_private.ai_requests WHERE id=p_request_id FOR UPDATE;
 IF NOT FOUND OR v_job.lease<>p_lease OR v_job.operation<>'chat' OR v_job.resource<>'room:'||p_session_id::text||':'||p_character_id::text OR v_job.request_key<>'turn:'||p_source_id::text THEN RAISE EXCEPTION 'Invalid room request'; END IF;
 IF v_job.state='completed' THEN RETURN v_job.result; END IF;
 IF v_job.state<>'running' OR v_job.expires_at<=now() OR NOT chimera_private.room_ai_allowed(p_session_id,v_job.user_id,p_character_id) THEN RAISE EXCEPTION 'Room permission changed'; END IF;
 IF p_content IS NULL OR char_length(p_content) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Invalid reply'; END IF;
 SELECT a.user_id INTO v_sender FROM public.human_roleplay_characters rc JOIN public.ai_characters a ON a.id=rc.ai_character_id WHERE rc.id=p_character_id AND rc.session_id=p_session_id;
 SELECT coalesce(max(sequence_number),0)+1 INTO v_sequence FROM public.human_roleplay_messages WHERE session_id=p_session_id;
 INSERT INTO public.human_roleplay_messages(session_id,sender_id,character_id,message_type,content,sequence_number,author_kind,reply_to_id) VALUES(p_session_id,v_sender,p_character_id,'dialogue',p_content,v_sequence,'ai',p_source_id) RETURNING * INTO v_message;
 UPDATE chimera_private.ai_requests SET state='completed',result=jsonb_build_object('reply',p_content,'message_id',v_message.id) WHERE id=p_request_id;
 RETURN jsonb_build_object('reply',p_content,'message_id',v_message.id);
END; $$;
REVOKE ALL ON FUNCTION public.set_my_human_room_preferences(uuid,uuid,boolean),public.configure_human_room(uuid,boolean,text,uuid),public.attach_human_room_character(uuid,uuid,uuid),public.send_human_roleplay_message(uuid,text,text,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_my_human_room_preferences(uuid,uuid,boolean),public.configure_human_room(uuid,boolean,text,uuid),public.attach_human_room_character(uuid,uuid,uuid),public.send_human_roleplay_message(uuid,text,text,uuid,uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.reserve_chimera_room_ai(uuid,uuid,uuid,uuid,text),public.complete_chimera_room_ai(uuid,uuid,uuid,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_chimera_room_ai(uuid,uuid,uuid,uuid,text),public.complete_chimera_room_ai(uuid,uuid,uuid,uuid,uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.get_human_room_continuity(p_session_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_sources jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.human_roleplay_member(p_session_id) THEN RAISE EXCEPTION 'Room membership required'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'sender_id',sender_id,'excerpt',left(content,360),'digest',md5(content),'created_at',created_at) ORDER BY sequence_number),'[]') INTO v_sources FROM(SELECT * FROM public.human_roleplay_messages WHERE session_id=p_session_id AND deleted_at IS NULL ORDER BY sequence_number DESC OFFSET 32 LIMIT 1000) archive;
 RETURN v_sources;
END; $$;
REVOKE ALL ON FUNCTION public.get_human_room_continuity(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_human_room_continuity(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_human_room_invites() RETURNS TABLE(id uuid,session_id uuid,title text,expires_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT i.id,i.session_id,s.title,i.expires_at FROM public.human_roleplay_invites i JOIN public.human_roleplay_sessions s ON s.id=i.session_id WHERE i.invited_user_id=auth.uid() AND i.status='pending' AND i.expires_at>now();
$$;
CREATE OR REPLACE FUNCTION public.leave_human_room(p_session_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.human_roleplay_member(p_session_id) THEN RAISE EXCEPTION 'Room membership required'; END IF;
 PERFORM 1 FROM public.human_roleplay_sessions WHERE id=p_session_id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.human_roleplay_sessions WHERE id=p_session_id AND creator_id=auth.uid()) THEN RAISE EXCEPTION 'The host must pause the room instead of leaving'; END IF;
 UPDATE public.human_roleplay_participants SET status='left',ai_opt_in=false WHERE session_id=p_session_id AND user_id=auth.uid();
 UPDATE public.human_roleplay_sessions SET turn_user_id=NULL WHERE id=p_session_id AND turn_user_id=auth.uid();
END; $$;
REVOKE ALL ON FUNCTION public.get_my_human_room_invites(),public.leave_human_room(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_human_room_invites(),public.leave_human_room(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.decline_human_room_invite(p_invite_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE public.human_roleplay_invites SET status='declined' WHERE id=p_invite_id AND invited_user_id=auth.uid() AND status='pending';
 IF NOT FOUND THEN RAISE EXCEPTION 'Invitation unavailable'; END IF;
END; $$;
CREATE OR REPLACE FUNCTION public.remove_human_room_member(p_session_id uuid,p_user_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM 1 FROM public.human_roleplay_sessions WHERE id=p_session_id AND creator_id=auth.uid() FOR UPDATE;
 IF NOT FOUND OR p_user_id=auth.uid() THEN RAISE EXCEPTION 'Host permission required'; END IF;
 UPDATE public.human_roleplay_participants SET status='removed',ai_opt_in=false WHERE session_id=p_session_id AND user_id=p_user_id;
 UPDATE public.human_roleplay_invites SET status='revoked' WHERE session_id=p_session_id AND invited_user_id=p_user_id AND status='pending';
 UPDATE public.human_roleplay_sessions SET turn_user_id=NULL WHERE id=p_session_id AND turn_user_id=p_user_id;
END; $$;
REVOKE ALL ON FUNCTION public.decline_human_room_invite(uuid),public.remove_human_room_member(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.decline_human_room_invite(uuid),public.remove_human_room_member(uuid,uuid) TO authenticated;
COMMIT;
