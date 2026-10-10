-- CHIMERA moderation: reports on a message, a moderator review queue, and an audit log.
--
-- FOR REVIEW. Not applied to any database yet.
--
-- What already exists and is reused: public.reports (WHISPRR's table: reporter, reported user, content type and id, reason,
-- details, status, created_at; row-level security lets a member file and read their own). It has no reader for staff and
-- no CHIMERA use today (0 rows when this was written). It is extended, not replaced: the new columns are nullable or
-- defaulted, and WHISPRR's own reports (content types user / whisper / comment) keep working as they do.
--
-- How it works
--   * A member reports a message through submit_chimera_message_report. The database itself reads the message and copies
--     it, with a few messages before and after it, into the report (a snapshot). Nothing the browser says about the
--     message is trusted, and the snapshot survives the message being edited or deleted afterwards.
--   * Moderators (profiles.role = 'founder' today) read and manage reports through functions that check the role inside
--     the database. Everyone else gets "access required". Moderators see only the snapshot, never the whole scene.
--   * Every moderator action is written to chimera_report_audit, which nobody can edit or delete from the app.
--   * Nothing here punishes anyone by itself. A report only creates a row. Hiding a character is a separate, explicit,
--     audited moderator action.
--   * Limits: one report per member per message, 10 per hour and 30 per day per member.

-- ── 1. Who may moderate ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION chimera_private.is_moderator()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'founder');
$$;
REVOKE ALL ON FUNCTION chimera_private.is_moderator() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION chimera_private.is_moderator() TO authenticated;

CREATE OR REPLACE FUNCTION chimera_private.report_reasons()
RETURNS text[] LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT ARRAY['child_safety', 'non_consensual', 'harassment_or_hate', 'self_harm', 'violence', 'illegal', 'privacy', 'rating_mismatch', 'spam', 'other'];
$$;
REVOKE ALL ON FUNCTION chimera_private.report_reasons() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION chimera_private.report_reasons() TO authenticated;

-- ── 2. The reports table, extended ──────────────────────────────────────────────────────────────

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS character_id uuid REFERENCES public.ai_characters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS snapshot jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS first_viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS alert_sent_at timestamptz;

-- The two lists this table allowed were WHISPRR's. Both are widened (nothing is removed, so existing rows stay valid):
-- the content type gains 'chimera_message', and the status gains the moderation steps. 'reviewed' stays allowed for WHISPRR;
-- CHIMERA's functions only ever write pending / under_review / resolved / dismissed / escalated.
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_content_type_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_content_type_check CHECK (content_type IN ('whisper', 'comment', 'user', 'chimera_message'));
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_status_check CHECK (status IN ('pending', 'reviewed', 'resolved', 'under_review', 'dismissed', 'escalated'));
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_details_length;
-- Only CHIMERA's reports are limited: WHISPRR's own report form has no limit and its rows must stay valid.
ALTER TABLE public.reports ADD CONSTRAINT reports_details_length CHECK (content_type <> 'chimera_message' OR char_length(coalesce(details, '')) <= 2000);

-- One report per member per message.
CREATE UNIQUE INDEX IF NOT EXISTS reports_one_per_reporter_message ON public.reports (reporter_id, content_id) WHERE content_type = 'chimera_message';
CREATE INDEX IF NOT EXISTS reports_chimera_queue ON public.reports (status, created_at DESC) WHERE content_type = 'chimera_message';

-- Moderators may read reports (the app reads them through the functions below, which also limit what is shown).
DROP POLICY IF EXISTS chimera_moderators_select_reports ON public.reports;
CREATE POLICY chimera_moderators_select_reports ON public.reports FOR SELECT TO authenticated USING (chimera_private.is_moderator());

-- A member can only add a report, never change or remove one, and a CHIMERA message report can only come from the
-- function below (so its snapshot cannot be forged). The member's own reports always start as pending.
CREATE OR REPLACE FUNCTION chimera_private.guard_report_write()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.content_type = 'chimera_message' THEN
        RAISE EXCEPTION 'A message report is filed through submit_chimera_message_report' USING ERRCODE = '42501';
      END IF;
      NEW.status := 'pending';
      NEW.snapshot := NULL; NEW.first_viewed_at := NULL; NEW.alert_sent_at := NULL; NEW.conversation_id := NULL; NEW.character_id := NULL;
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'A report cannot be changed or removed by the member who filed it' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  IF TG_OP = 'UPDATE' THEN NEW.updated_at := now(); END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION chimera_private.guard_report_write() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS chimera_guard_report_write ON public.reports;
CREATE TRIGGER chimera_guard_report_write BEFORE INSERT OR UPDATE OR DELETE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_report_write();

-- ── 3. The audit log ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.chimera_report_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('submitted', 'viewed', 'status_changed', 'note_added', 'character_made_private', 'alert_sent')),
  from_status text,
  to_status text,
  note text CHECK (note IS NULL OR char_length(note) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chimera_report_audit_report ON public.chimera_report_audit (report_id, created_at);

ALTER TABLE public.chimera_report_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chimera_report_audit_moderators_select ON public.chimera_report_audit;
CREATE POLICY chimera_report_audit_moderators_select ON public.chimera_report_audit FOR SELECT TO authenticated USING (chimera_private.is_moderator());
REVOKE ALL ON TABLE public.chimera_report_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.chimera_report_audit TO authenticated;

CREATE OR REPLACE FUNCTION chimera_private.guard_report_audit()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'The audit log cannot be changed' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION chimera_private.guard_report_audit() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS chimera_guard_report_audit ON public.chimera_report_audit;
CREATE TRIGGER chimera_guard_report_audit BEFORE INSERT OR UPDATE OR DELETE ON public.chimera_report_audit
  FOR EACH ROW EXECUTE FUNCTION chimera_private.guard_report_audit();

-- ── 4. Filing a report ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.submit_chimera_message_report(p_message_id uuid, p_reason text, p_details text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_message public.messages;
  v_character public.ai_characters;
  v_details text := btrim(coalesce(p_details, ''));
  v_hour integer; v_day integer; v_id uuid; v_snapshot jsonb; v_context jsonb; v_title text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Sign in to report a message' USING ERRCODE = '42501'; END IF;
  IF p_reason IS NULL OR NOT (p_reason = ANY (chimera_private.report_reasons())) THEN
    RAISE EXCEPTION 'Choose a reason' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_details) > 1000 THEN RAISE EXCEPTION 'The explanation is too long' USING ERRCODE = '22023'; END IF;

  SELECT * INTO v_message FROM public.messages WHERE id = p_message_id AND deleted_at IS NULL;
  -- Only someone who can see the message may report it: a member of its scene.
  -- CHIMERA scenes only: a scene is a conversation with an AI character in it. Other conversations (WHISPRR's) are not reported here.
  IF NOT FOUND OR NOT chimera_private.is_conversation_member(v_message.conversation_id) OR NOT EXISTS (
    SELECT 1 FROM public.conversation_participants cp JOIN public.profiles pp ON pp.user_id = cp.user_id AND pp.role = 'ai_character'
     WHERE cp.conversation_id = v_message.conversation_id
  ) THEN
    RAISE EXCEPTION 'Message unavailable' USING ERRCODE = '42501';
  END IF;
  IF v_message.sender_id = v_uid THEN RAISE EXCEPTION 'You cannot report your own message' USING ERRCODE = '22023'; END IF;

  -- One request at a time per member, so the limits below cannot be raced.
  PERFORM pg_advisory_xact_lock(hashtextextended('chimera:report:' || v_uid::text, 0));

  SELECT id INTO v_id FROM public.reports WHERE reporter_id = v_uid AND content_type = 'chimera_message' AND content_id = p_message_id;
  IF FOUND THEN RETURN jsonb_build_object('id', v_id, 'duplicate', true); END IF;

  SELECT count(*) FILTER (WHERE created_at > now() - interval '1 hour'), count(*) FILTER (WHERE created_at > now() - interval '1 day')
    INTO v_hour, v_day FROM public.reports WHERE reporter_id = v_uid AND content_type = 'chimera_message';
  IF v_hour >= 10 OR v_day >= 30 THEN
    RAISE EXCEPTION 'You have sent many reports recently. Please try again later.' USING ERRCODE = '54000', HINT = 'rate_limited';
  END IF;

  SELECT a.* INTO v_character FROM public.ai_characters a
    JOIN public.profiles p ON p.user_id = a.user_id AND p.role = 'ai_character' WHERE a.user_id = v_message.sender_id;
  SELECT name INTO v_title FROM public.conversations WHERE id = v_message.conversation_id;

  -- The reported message with up to 6 before and 2 after it, and nothing else of the scene.
  SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'sender', CASE WHEN ai.user_id IS NULL THEN 'player' ELSE 'character' END,
      'content', left(c.content, 1500), 'created_at', c.created_at) ORDER BY c.created_at, c.id), '[]'::jsonb)
    INTO v_context
    FROM (
      (SELECT id, sender_id, content, created_at FROM public.messages
         WHERE conversation_id = v_message.conversation_id AND deleted_at IS NULL AND (created_at, id) < (v_message.created_at, v_message.id)
         ORDER BY created_at DESC, id DESC LIMIT 6)
      UNION ALL
      (SELECT id, sender_id, content, created_at FROM public.messages
         WHERE conversation_id = v_message.conversation_id AND deleted_at IS NULL AND (created_at, id) > (v_message.created_at, v_message.id)
         ORDER BY created_at, id LIMIT 2)
    ) c LEFT JOIN public.profiles ai ON ai.user_id = c.sender_id AND ai.role = 'ai_character';

  v_snapshot := jsonb_build_object(
    'message', jsonb_build_object(
      'id', v_message.id, 'sender', CASE WHEN v_character.id IS NULL THEN 'player' ELSE 'character' END,
      'content', left(v_message.content, 8000), 'created_at', v_message.created_at),
    'character', CASE WHEN v_character.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', v_character.id, 'name', v_character.chat_name, 'content_rating', v_character.content_rating, 'visibility', v_character.visibility) END,
    'scene', jsonb_build_object('id', v_message.conversation_id, 'title', v_title),
    'context', v_context);

  BEGIN
    INSERT INTO public.reports (reporter_id, reported_user_id, content_type, content_id, reason, details, conversation_id, character_id, snapshot)
    VALUES (v_uid, CASE WHEN v_character.id IS NULL THEN v_message.sender_id ELSE v_character.creator_id END,
            'chimera_message', p_message_id, p_reason, v_details, v_message.conversation_id, v_character.id, v_snapshot)
    RETURNING id INTO v_id;
  EXCEPTION WHEN unique_violation THEN
    SELECT id INTO v_id FROM public.reports WHERE reporter_id = v_uid AND content_type = 'chimera_message' AND content_id = p_message_id;
    RETURN jsonb_build_object('id', v_id, 'duplicate', true);
  END;
  INSERT INTO public.chimera_report_audit (report_id, actor_id, action) VALUES (v_id, v_uid, 'submitted');
  RETURN jsonb_build_object('id', v_id, 'duplicate', false);
END;
$$;
REVOKE ALL ON FUNCTION public.submit_chimera_message_report(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_chimera_message_report(uuid, text, text) TO authenticated;

-- ── 5. What moderators do ───────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.count_unread_chimera_reports()
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT chimera_private.is_moderator() THEN RETURN 0; END IF;
  RETURN (SELECT count(*)::integer FROM public.reports WHERE content_type = 'chimera_message' AND first_viewed_at IS NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_chimera_reports(p_status text DEFAULT NULL, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100); v_offset integer := greatest(coalesce(p_offset, 0), 0);
BEGIN
  IF NOT chimera_private.is_moderator() THEN RAISE EXCEPTION 'Moderator access required' USING ERRCODE = '42501'; END IF;
  IF p_status IS NOT NULL AND p_status NOT IN ('pending', 'under_review', 'resolved', 'dismissed', 'escalated') THEN
    RAISE EXCEPTION 'Unknown status' USING ERRCODE = '22023';
  END IF;
  RETURN jsonb_build_object(
    'total', (SELECT count(*) FROM public.reports r WHERE r.content_type = 'chimera_message' AND (p_status IS NULL OR r.status = p_status)),
    'unread', (SELECT count(*) FROM public.reports r WHERE r.content_type = 'chimera_message' AND r.first_viewed_at IS NULL),
    'items', coalesce((SELECT jsonb_agg(row_to_json(x)::jsonb ORDER BY x.created_at DESC) FROM (
      SELECT r.id, r.status, r.reason, r.created_at, r.updated_at, (r.first_viewed_at IS NULL) AS unread,
             left(r.snapshot -> 'message' ->> 'content', 200) AS excerpt, r.snapshot -> 'character' ->> 'name' AS character_name
        FROM public.reports r WHERE r.content_type = 'chimera_message' AND (p_status IS NULL OR r.status = p_status)
        ORDER BY r.created_at DESC, r.id LIMIT v_limit OFFSET v_offset) x), '[]'::jsonb));
END;
$$;

CREATE OR REPLACE FUNCTION public.get_chimera_report(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_report public.reports; v_reporter text;
BEGIN
  IF NOT chimera_private.is_moderator() THEN RAISE EXCEPTION 'Moderator access required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_report FROM public.reports WHERE id = p_id AND content_type = 'chimera_message' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Report not found' USING ERRCODE = 'P0002'; END IF;
  IF v_report.first_viewed_at IS NULL THEN
    UPDATE public.reports SET first_viewed_at = now() WHERE id = p_id RETURNING * INTO v_report;
    INSERT INTO public.chimera_report_audit (report_id, actor_id, action) VALUES (p_id, auth.uid(), 'viewed');
  END IF;
  SELECT coalesce(display_name, username) INTO v_reporter FROM public.profiles WHERE user_id = v_report.reporter_id;
  RETURN jsonb_build_object(
    'id', v_report.id, 'status', v_report.status, 'reason', v_report.reason, 'details', v_report.details,
    'created_at', v_report.created_at, 'updated_at', v_report.updated_at, 'first_viewed_at', v_report.first_viewed_at,
    'reporter', jsonb_build_object('id', v_report.reporter_id, 'name', v_reporter),
    'snapshot', v_report.snapshot,
    'character_visibility', (SELECT a.visibility FROM public.ai_characters a WHERE a.id = v_report.character_id),
    'audit', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', l.id, 'action', l.action, 'from_status', l.from_status, 'to_status', l.to_status, 'note', l.note, 'created_at', l.created_at,
        'actor', (SELECT coalesce(p.display_name, p.username) FROM public.profiles p WHERE p.user_id = l.actor_id)) ORDER BY l.created_at, l.id)
      FROM public.chimera_report_audit l WHERE l.report_id = p_id), '[]'::jsonb));
END;
$$;

CREATE OR REPLACE FUNCTION public.update_chimera_report(p_id uuid, p_status text, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_report public.reports; v_note text := nullif(btrim(coalesce(p_note, '')), '');
BEGIN
  IF NOT chimera_private.is_moderator() THEN RAISE EXCEPTION 'Moderator access required' USING ERRCODE = '42501'; END IF;
  IF p_status IS NULL OR p_status NOT IN ('pending', 'under_review', 'resolved', 'dismissed', 'escalated') THEN
    RAISE EXCEPTION 'Unknown status' USING ERRCODE = '22023';
  END IF;
  IF v_note IS NOT NULL AND char_length(v_note) > 2000 THEN RAISE EXCEPTION 'The note is too long' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_report FROM public.reports WHERE id = p_id AND content_type = 'chimera_message' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Report not found' USING ERRCODE = 'P0002'; END IF;
  IF v_report.status = p_status AND v_note IS NULL THEN RETURN jsonb_build_object('id', p_id, 'status', v_report.status, 'changed', false); END IF;
  IF v_report.status <> p_status THEN
    UPDATE public.reports SET status = p_status WHERE id = p_id;
    INSERT INTO public.chimera_report_audit (report_id, actor_id, action, from_status, to_status, note)
      VALUES (p_id, auth.uid(), 'status_changed', v_report.status, p_status, v_note);
  ELSE
    UPDATE public.reports SET updated_at = now() WHERE id = p_id;
    INSERT INTO public.chimera_report_audit (report_id, actor_id, action, note) VALUES (p_id, auth.uid(), 'note_added', v_note);
  END IF;
  RETURN jsonb_build_object('id', p_id, 'status', p_status, 'changed', true);
END;
$$;

-- The one action that touches content: hide a character's page by making it private. Explicit, with a written reason, audited.
CREATE OR REPLACE FUNCTION public.moderator_make_chimera_character_private(p_report_id uuid, p_note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_report public.reports; v_note text := btrim(coalesce(p_note, '')); v_before text;
BEGIN
  IF NOT chimera_private.is_moderator() THEN RAISE EXCEPTION 'Moderator access required' USING ERRCODE = '42501'; END IF;
  IF char_length(v_note) < 3 OR char_length(v_note) > 2000 THEN RAISE EXCEPTION 'Write the reason for this action' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_report FROM public.reports WHERE id = p_report_id AND content_type = 'chimera_message' FOR UPDATE;
  IF NOT FOUND OR v_report.character_id IS NULL THEN RAISE EXCEPTION 'This report has no character to hide' USING ERRCODE = 'P0002'; END IF;
  SELECT visibility INTO v_before FROM public.ai_characters WHERE id = v_report.character_id FOR UPDATE;
  IF v_before IS NULL THEN RAISE EXCEPTION 'The character no longer exists' USING ERRCODE = 'P0002'; END IF;
  IF v_before <> 'private' THEN UPDATE public.ai_characters SET visibility = 'private' WHERE id = v_report.character_id; END IF;
  INSERT INTO public.chimera_report_audit (report_id, actor_id, action, from_status, to_status, note)
    VALUES (p_report_id, auth.uid(), 'character_made_private', v_before, 'private', v_note);
  RETURN jsonb_build_object('character_id', v_report.character_id, 'visibility', 'private', 'was', v_before);
END;
$$;

REVOKE ALL ON FUNCTION public.count_unread_chimera_reports(), public.list_chimera_reports(text, integer, integer), public.get_chimera_report(uuid),
  public.update_chimera_report(uuid, text, text), public.moderator_make_chimera_character_private(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.count_unread_chimera_reports(), public.list_chimera_reports(text, integer, integer), public.get_chimera_report(uuid),
  public.update_chimera_report(uuid, text, text), public.moderator_make_chimera_character_private(uuid, text) TO authenticated;
