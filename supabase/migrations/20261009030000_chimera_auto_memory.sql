-- Automatic long-term memory, step 1 of 2: the bookkeeping the server needs.
--
-- The character proposes memories (public.propose_chimera_memory, already in production) from what
-- happened in a scene, and the player approves, edits or dismisses them. Nothing becomes a memory
-- the character uses until the player approves it.
--
-- Two small additions to the per-player scene settings:
--   auto_memory       the player can switch suggestions off for a scene (on by default)
--   memory_cursor_at  everything up to this moment has already been looked at
-- and two functions that let the server take a "window" of new messages exactly once, even if two
-- requests arrive together. Additive only: nothing existing is altered besides two new columns.
ALTER TABLE public.chimera_scene_settings
  ADD COLUMN auto_memory boolean NOT NULL DEFAULT true,
  ADD COLUMN memory_cursor_at timestamptz;

-- Returns NULL when there is nothing to do (suggestions off, too few new messages, or the player
-- still has 10 suggestions waiting). Otherwise it moves the cursor to the newest message and returns
-- the window to read: messages after "from" up to and including "to", for the player's current persona.
CREATE OR REPLACE FUNCTION public.claim_chimera_memory_window(p_conversation_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_persona uuid;
  v_settings public.chimera_scene_settings;
  v_pending integer;
  v_new integer;
  v_to timestamptz;
BEGIN
  IF v_uid IS NULL OR NOT chimera_private.is_conversation_member(p_conversation_id) THEN
    RAISE EXCEPTION 'Scene access required' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.chimera_scene_settings (conversation_id, user_id) VALUES (p_conversation_id, v_uid)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  SELECT * INTO v_settings FROM public.chimera_scene_settings
    WHERE conversation_id = p_conversation_id AND user_id = v_uid FOR UPDATE;
  IF NOT v_settings.auto_memory THEN RETURN NULL; END IF;

  SELECT count(*) INTO v_pending FROM public.character_memories
    WHERE user_id = v_uid AND conversation_id = p_conversation_id AND approval_status = 'proposed';
  IF v_pending >= 10 THEN RETURN NULL; END IF;

  v_persona := chimera_private.scene_persona(p_conversation_id, v_uid);
  SELECT count(*) INTO v_new FROM public.messages m
    WHERE m.conversation_id = p_conversation_id AND m.sender_id = v_uid AND m.deleted_at IS NULL
      AND m.persona_id IS NOT DISTINCT FROM v_persona
      AND (v_settings.memory_cursor_at IS NULL OR m.created_at > v_settings.memory_cursor_at);
  IF v_new < 8 THEN RETURN NULL; END IF;

  SELECT max(m.created_at) INTO v_to FROM public.messages m
    WHERE m.conversation_id = p_conversation_id AND m.deleted_at IS NULL AND m.persona_id IS NOT DISTINCT FROM v_persona;
  UPDATE public.chimera_scene_settings SET memory_cursor_at = v_to
    WHERE conversation_id = p_conversation_id AND user_id = v_uid;
  RETURN jsonb_build_object('from', v_settings.memory_cursor_at, 'to', v_to, 'persona_id', v_persona);
END;
$$;

-- Puts the cursor back when reading the window failed, so those messages are looked at next time.
-- Only works while the cursor is still where this request put it.
CREATE OR REPLACE FUNCTION public.release_chimera_memory_window(p_conversation_id uuid, p_claimed timestamptz, p_previous timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT chimera_private.is_conversation_member(p_conversation_id) THEN
    RAISE EXCEPTION 'Scene access required' USING ERRCODE = '42501';
  END IF;
  UPDATE public.chimera_scene_settings SET memory_cursor_at = p_previous
    WHERE conversation_id = p_conversation_id AND user_id = auth.uid() AND memory_cursor_at IS NOT DISTINCT FROM p_claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_chimera_memory_window(uuid), public.release_chimera_memory_window(uuid, timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_chimera_memory_window(uuid), public.release_chimera_memory_window(uuid, timestamptz, timestamptz) TO authenticated;
