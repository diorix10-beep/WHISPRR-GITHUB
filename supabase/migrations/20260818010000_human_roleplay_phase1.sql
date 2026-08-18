-- CHIMERA Human Roleplay Phase 1
-- Separate shared sessions for real people. No SHARDS/VELLUM transactions live here.

CREATE TABLE IF NOT EXISTS public.human_roleplay_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  setting text NOT NULL DEFAULT '' CHECK (char_length(setting) <= 4000),
  lore text NOT NULL DEFAULT '' CHECK (char_length(lore) <= 8000),
  rules text NOT NULL DEFAULT '' CHECK (char_length(rules) <= 4000),
  objectives text NOT NULL DEFAULT '' CHECK (char_length(objectives) <= 4000),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'invite_only', 'public')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'active', 'paused', 'completed', 'archived')),
  max_participants integer NOT NULL DEFAULT 2 CHECK (max_participants BETWEEN 2 AND 50),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.human_roleplay_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.human_roleplay_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'participant' CHECK (role IN ('creator', 'participant', 'moderator')),
  status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('invited', 'pending', 'accepted', 'declined', 'removed', 'left')),
  is_creator boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  UNIQUE (session_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.human_roleplay_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.human_roleplay_sessions(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  personality text NOT NULL DEFAULT '' CHECK (char_length(personality) <= 4000),
  background text NOT NULL DEFAULT '' CHECK (char_length(background) <= 6000),
  goals text NOT NULL DEFAULT '' CHECK (char_length(goals) <= 2000),
  relationships text NOT NULL DEFAULT '' CHECK (char_length(relationships) <= 4000),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.human_roleplay_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.human_roleplay_sessions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  character_id uuid REFERENCES public.human_roleplay_characters(id) ON DELETE SET NULL,
  message_type text NOT NULL DEFAULT 'dialogue' CHECK (message_type IN ('dialogue', 'narration', 'action', 'system')),
  content text NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 10000),
  sequence_number bigint NOT NULL,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, sequence_number)
);

CREATE TABLE IF NOT EXISTS public.human_roleplay_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.human_roleplay_sessions(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  invited_user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  invite_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.human_roleplay_economies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.human_roleplay_sessions(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 60),
  currency_code text NOT NULL CHECK (currency_code ~ '^[A-Z0-9_]{2,16}$'),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1000),
  starting_balance bigint NOT NULL DEFAULT 0 CHECK (starting_balance >= 0),
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS human_roleplay_sessions_creator_idx ON public.human_roleplay_sessions (creator_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS human_roleplay_participants_user_idx ON public.human_roleplay_participants (user_id, joined_at DESC);
CREATE INDEX IF NOT EXISTS human_roleplay_messages_session_idx ON public.human_roleplay_messages (session_id, sequence_number);
CREATE INDEX IF NOT EXISTS human_roleplay_invites_user_idx ON public.human_roleplay_invites (invited_user_id, created_at DESC);

ALTER TABLE public.human_roleplay_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_roleplay_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_roleplay_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_roleplay_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_roleplay_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_roleplay_economies ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.human_roleplay_member(p_session_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.human_roleplay_participants
    WHERE session_id = p_session_id AND user_id = p_user_id AND status = 'accepted'
  );
$$;

CREATE OR REPLACE FUNCTION public.invite_human_roleplay_user(p_session_id uuid, p_invited_user_id uuid)
RETURNS public.human_roleplay_invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_invite public.human_roleplay_invites; v_creator uuid;
BEGIN
  SELECT creator_id INTO v_creator FROM public.human_roleplay_sessions WHERE id = p_session_id;
  IF v_creator IS NULL OR v_creator <> auth.uid() THEN RAISE EXCEPTION 'Only the session creator can invite participants.'; END IF;
  IF p_invited_user_id = auth.uid() THEN RAISE EXCEPTION 'You are already the creator of this session.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = p_invited_user_id) THEN RAISE EXCEPTION 'That participant does not exist.'; END IF;
  IF EXISTS (SELECT 1 FROM public.human_roleplay_participants WHERE session_id = p_session_id AND status IN ('accepted', 'pending', 'invited') AND user_id = p_invited_user_id) THEN RAISE EXCEPTION 'That participant already has access or an invitation.'; END IF;
  IF (SELECT count(*) FROM public.human_roleplay_participants WHERE session_id = p_session_id AND status IN ('accepted', 'pending', 'invited')) >= (SELECT max_participants FROM public.human_roleplay_sessions WHERE id = p_session_id) THEN RAISE EXCEPTION 'This session is at its participant limit.'; END IF;
  INSERT INTO public.human_roleplay_invites (session_id, invited_by, invited_user_id) VALUES (p_session_id, auth.uid(), p_invited_user_id) RETURNING * INTO v_invite;
  RETURN v_invite;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_human_roleplay_invite(p_invite_id uuid)
RETURNS public.human_roleplay_participants
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_invite public.human_roleplay_invites; v_participant public.human_roleplay_participants; v_limit integer;
BEGIN
  SELECT * INTO v_invite FROM public.human_roleplay_invites WHERE id = p_invite_id AND invited_user_id = auth.uid() AND status = 'pending' AND expires_at > now() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This invitation is unavailable or expired.'; END IF;
  SELECT max_participants INTO v_limit FROM public.human_roleplay_sessions WHERE id = v_invite.session_id FOR UPDATE;
  IF (SELECT count(*) FROM public.human_roleplay_participants WHERE session_id = v_invite.session_id AND status = 'accepted') >= v_limit THEN RAISE EXCEPTION 'This session is already full.'; END IF;
  INSERT INTO public.human_roleplay_participants (session_id, user_id, role, status) VALUES (v_invite.session_id, auth.uid(), 'participant', 'accepted')
  ON CONFLICT (session_id, user_id) DO UPDATE SET status = 'accepted', joined_at = now() RETURNING * INTO v_participant;
  UPDATE public.human_roleplay_invites SET status = 'accepted' WHERE id = v_invite.id;
  RETURN v_participant;
END;
$$;

CREATE POLICY "human roleplay members read sessions" ON public.human_roleplay_sessions FOR SELECT TO authenticated
  USING (creator_id = auth.uid() OR public.human_roleplay_member(id));
CREATE POLICY "human roleplay creators update sessions" ON public.human_roleplay_sessions FOR UPDATE TO authenticated
  USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "human roleplay creators delete sessions" ON public.human_roleplay_sessions FOR DELETE TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "human roleplay members read participants" ON public.human_roleplay_participants FOR SELECT TO authenticated
  USING (public.human_roleplay_member(session_id) OR user_id = auth.uid());
CREATE POLICY "human roleplay users leave sessions" ON public.human_roleplay_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "human roleplay members read characters" ON public.human_roleplay_characters FOR SELECT TO authenticated
  USING (public.human_roleplay_member(session_id));
CREATE POLICY "human roleplay owners update characters" ON public.human_roleplay_characters FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND public.human_roleplay_member(session_id))
  WITH CHECK (owner_id = auth.uid() AND public.human_roleplay_member(session_id));
CREATE POLICY "human roleplay owners delete characters" ON public.human_roleplay_characters FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "human roleplay members read messages" ON public.human_roleplay_messages FOR SELECT TO authenticated
  USING (public.human_roleplay_member(session_id));
CREATE POLICY "human roleplay send messages" ON public.human_roleplay_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.human_roleplay_member(session_id));
CREATE POLICY "human roleplay own messages update" ON public.human_roleplay_messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());

CREATE POLICY "human roleplay invite recipients read invites" ON public.human_roleplay_invites FOR SELECT TO authenticated
  USING (invited_by = auth.uid() OR invited_user_id = auth.uid());

CREATE POLICY "human roleplay members read economies" ON public.human_roleplay_economies FOR SELECT TO authenticated
  USING (public.human_roleplay_member(session_id));
CREATE POLICY "human roleplay creators update economies" ON public.human_roleplay_economies FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE OR REPLACE FUNCTION public.create_human_roleplay_session(
  p_title text, p_description text DEFAULT '', p_setting text DEFAULT '', p_lore text DEFAULT '',
  p_rules text DEFAULT '', p_objectives text DEFAULT '', p_visibility text DEFAULT 'private', p_max_participants integer DEFAULT 2
) RETURNS public.human_roleplay_sessions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_session public.human_roleplay_sessions;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication is required.'; END IF;
  IF p_visibility NOT IN ('private', 'invite_only', 'public') THEN RAISE EXCEPTION 'Invalid session visibility.'; END IF;
  INSERT INTO public.human_roleplay_sessions (creator_id, title, description, setting, lore, rules, objectives, visibility, max_participants)
  VALUES (auth.uid(), trim(p_title), coalesce(p_description, ''), coalesce(p_setting, ''), coalesce(p_lore, ''), coalesce(p_rules, ''), coalesce(p_objectives, ''), p_visibility, p_max_participants)
  RETURNING * INTO v_session;
  INSERT INTO public.human_roleplay_participants (session_id, user_id, role, is_creator)
  VALUES (v_session.id, auth.uid(), 'creator', true);
  RETURN v_session;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_human_roleplay_character(
  p_session_id uuid, p_name text, p_description text DEFAULT '', p_personality text DEFAULT '',
  p_background text DEFAULT '', p_goals text DEFAULT '', p_relationships text DEFAULT '', p_avatar_url text DEFAULT NULL
) RETURNS public.human_roleplay_characters
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_character public.human_roleplay_characters;
BEGIN
  IF NOT public.human_roleplay_member(p_session_id) THEN RAISE EXCEPTION 'You are not an accepted participant in this session.'; END IF;
  INSERT INTO public.human_roleplay_characters (session_id, owner_id, name, description, personality, background, goals, relationships, avatar_url)
  VALUES (p_session_id, auth.uid(), trim(p_name), coalesce(p_description, ''), coalesce(p_personality, ''), coalesce(p_background, ''), coalesce(p_goals, ''), coalesce(p_relationships, ''), p_avatar_url)
  RETURNING * INTO v_character;
  RETURN v_character;
END;
$$;

REVOKE ALL ON FUNCTION public.human_roleplay_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.human_roleplay_member(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.invite_human_roleplay_user(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invite_human_roleplay_user(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.accept_human_roleplay_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_human_roleplay_invite(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.create_human_roleplay_session(text, text, text, text, text, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_human_roleplay_session(text, text, text, text, text, text, text, integer) TO authenticated;
REVOKE ALL ON FUNCTION public.create_human_roleplay_character(uuid, text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_human_roleplay_character(uuid, text, text, text, text, text, text, text) TO authenticated;

DROP TRIGGER IF EXISTS set_human_roleplay_sessions_updated_at ON public.human_roleplay_sessions;
CREATE TRIGGER set_human_roleplay_sessions_updated_at BEFORE UPDATE ON public.human_roleplay_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_human_roleplay_economies_updated_at ON public.human_roleplay_economies;
CREATE TRIGGER set_human_roleplay_economies_updated_at BEFORE UPDATE ON public.human_roleplay_economies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
