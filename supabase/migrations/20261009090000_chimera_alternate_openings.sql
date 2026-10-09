-- CHIMERA: a scene can open with any of the character's openings, not only the main one.
--
-- respond_as_ai_character posts a character's opening message as the first message of a scene. It exists so that a player
-- can never post arbitrary text as the character: it only accepts text the creator wrote as an opening. Until now that
-- meant the main greeting only. Characters can now have other openings (ai_characters.alternate_greetings) that the player
-- picks from, so those are accepted too. Anything else is still refused.
--
-- Same function, same signature, same access rules and grants (CREATE OR REPLACE keeps them). What changes:
--   * the text must match the main greeting or one of the alternate greetings (compared without the spaces around them,
--     because the app sends them trimmed); an empty text is refused;
--   * what is stored is the creator's own text of the opening that matched, never the text the caller sent;
--   * a repeated call with the opening already posted is still a quiet no-op; a different opening on a scene that has
--     begun is still refused.

CREATE OR REPLACE FUNCTION public.respond_as_ai_character(p_conversation_id uuid, p_bot_id uuid, p_content text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_greeting text; v_alternates text[]; v_opening text;
BEGIN
  IF auth.uid() IS NULL OR NOT chimera_private.can_read_character_scene(p_conversation_id) OR NOT EXISTS (
    SELECT 1 FROM public.conversation_participants WHERE conversation_id = p_conversation_id AND user_id = auth.uid()
  ) THEN RAISE EXCEPTION 'Roleplay access required' USING ERRCODE = '42501'; END IF;
  PERFORM 1 FROM public.conversations WHERE id = p_conversation_id FOR UPDATE;
  SELECT a.greeting, a.alternate_greetings INTO v_greeting, v_alternates FROM public.ai_characters a
  JOIN public.profiles p ON p.user_id = a.user_id AND p.role = 'ai_character'
  JOIN public.conversation_participants cp ON cp.user_id = a.user_id AND cp.conversation_id = p_conversation_id
  WHERE a.user_id = p_bot_id AND (a.visibility IN ('public','unlisted') OR a.creator_id = auth.uid());
  IF v_greeting IS NOT NULL AND btrim(coalesce(p_content, '')) <> '' THEN
    IF btrim(v_greeting) = btrim(p_content) THEN
      v_opening := v_greeting;
    ELSE
      SELECT alt INTO v_opening FROM unnest(coalesce(v_alternates, '{}'::text[])) AS alt WHERE btrim(alt) = btrim(p_content) LIMIT 1;
    END IF;
  END IF;
  IF v_opening IS NULL THEN
    RAISE EXCEPTION 'Only the authored character opening may be posted here' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.messages WHERE conversation_id = p_conversation_id) THEN
    IF EXISTS (SELECT 1 FROM public.messages WHERE conversation_id = p_conversation_id AND sender_id = p_bot_id AND content = v_opening) THEN RETURN; END IF;
    RAISE EXCEPTION 'This scene has already begun';
  END IF;
  INSERT INTO public.messages(conversation_id,sender_id,content,read) VALUES(p_conversation_id,p_bot_id,v_opening,false);
  UPDATE public.conversations SET last_message = v_opening, last_message_at = now() WHERE id = p_conversation_id;
END;
$$;
