-- CHIMERA: like / dislike on a character's message.
--
-- FOR REVIEW. Additive only: one new table and one function. Nothing existing is changed.
--
-- A member can mark a character's reply with a thumbs up or down, and take it back. It is stored for the member (and later
-- for improving characters); it is never sent to the AI and never changes the story. Only the member can read their own
-- feedback. Writes go through set_chimera_message_feedback, which checks that the message is a character's reply in a
-- scene the member belongs to.

CREATE TABLE IF NOT EXISTS public.chimera_message_feedback (
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

ALTER TABLE public.chimera_message_feedback ENABLE ROW LEVEL SECURITY;

-- Reading: your own rows only. No policy for INSERT / UPDATE / DELETE: the function below is the only way in.
DROP POLICY IF EXISTS chimera_message_feedback_select_own ON public.chimera_message_feedback;
CREATE POLICY chimera_message_feedback_select_own ON public.chimera_message_feedback
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON TABLE public.chimera_message_feedback FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.chimera_message_feedback TO authenticated;

-- 1 = like, -1 = dislike, 0 = take it back. Returns the rating that is now stored (0 when none).
CREATE OR REPLACE FUNCTION public.set_chimera_message_feedback(p_message_id uuid, p_rating smallint)
RETURNS smallint LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_conversation uuid; v_sender uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first' USING ERRCODE = '42501'; END IF;
  IF p_rating IS NULL OR p_rating NOT IN (-1, 0, 1) THEN RAISE EXCEPTION 'Invalid feedback' USING ERRCODE = '22023'; END IF;
  SELECT m.conversation_id, m.sender_id INTO v_conversation, v_sender
    FROM public.messages m WHERE m.id = p_message_id AND m.deleted_at IS NULL;
  IF NOT FOUND OR NOT chimera_private.is_conversation_member(v_conversation) THEN
    RAISE EXCEPTION 'Message unavailable' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_sender AND role = 'ai_character') THEN
    RAISE EXCEPTION 'Feedback is only for a character''s replies' USING ERRCODE = '22023';
  END IF;
  IF p_rating = 0 THEN
    DELETE FROM public.chimera_message_feedback WHERE message_id = p_message_id AND user_id = auth.uid();
    RETURN 0;
  END IF;
  INSERT INTO public.chimera_message_feedback (message_id, user_id, rating)
    VALUES (p_message_id, auth.uid(), p_rating)
    ON CONFLICT (message_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, updated_at = now();
  RETURN p_rating;
END;
$$;

REVOKE ALL ON FUNCTION public.set_chimera_message_feedback(uuid, smallint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_chimera_message_feedback(uuid, smallint) TO authenticated;
