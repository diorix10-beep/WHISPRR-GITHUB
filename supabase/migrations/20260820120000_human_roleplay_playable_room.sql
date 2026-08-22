-- Human Roleplay Phase 2: safe, ordered message writes for the first playable room.
-- Human Roleplay remains separate from AI Roleplay and Storytelling runtimes.

CREATE OR REPLACE FUNCTION public.send_human_roleplay_message(
  p_session_id uuid,
  p_content text,
  p_message_type text DEFAULT 'dialogue',
  p_character_id uuid DEFAULT NULL
) RETURNS public.human_roleplay_messages
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_message public.human_roleplay_messages;
  v_sequence bigint;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required.';
  END IF;

  IF NOT public.human_roleplay_member(p_session_id) THEN
    RAISE EXCEPTION 'You are not an accepted participant in this session.';
  END IF;

  IF p_message_type NOT IN ('dialogue', 'narration', 'action', 'system') THEN
    RAISE EXCEPTION 'Invalid Human Roleplay message type.';
  END IF;

  IF char_length(trim(coalesce(p_content, ''))) < 1 OR char_length(p_content) > 10000 THEN
    RAISE EXCEPTION 'Human Roleplay messages must contain between 1 and 10,000 characters.';
  END IF;

  IF p_character_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.human_roleplay_characters
    WHERE id = p_character_id
      AND session_id = p_session_id
      AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You can only send as your own character in this session.';
  END IF;

  -- Serialize the sequence allocation per session so concurrent writers cannot
  -- create duplicate or reordered sequence numbers.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_session_id::text, 0));
  SELECT coalesce(max(sequence_number), 0) + 1 INTO v_sequence
  FROM public.human_roleplay_messages
  WHERE session_id = p_session_id;

  INSERT INTO public.human_roleplay_messages (
    session_id, sender_id, character_id, message_type, content, sequence_number
  )
  VALUES (
    p_session_id, auth.uid(), p_character_id, p_message_type, trim(p_content), v_sequence
  )
  RETURNING * INTO v_message;

  UPDATE public.human_roleplay_sessions
  SET status = CASE WHEN status = 'open' THEN 'active' ELSE status END,
      updated_at = now()
  WHERE id = p_session_id;

  UPDATE public.human_roleplay_participants
  SET last_seen_at = now()
  WHERE session_id = p_session_id AND user_id = auth.uid();

  RETURN v_message;
END;
$$;

REVOKE ALL ON FUNCTION public.send_human_roleplay_message(uuid, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_human_roleplay_message(uuid, text, text, uuid) TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication p
       JOIN pg_publication_rel pr ON pr.prpubid = p.oid
       JOIN pg_class c ON c.oid = pr.prrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE p.pubname = 'supabase_realtime'
         AND n.nspname = 'public'
         AND c.relname = 'human_roleplay_messages'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.human_roleplay_messages;
  END IF;
END;
$$;
