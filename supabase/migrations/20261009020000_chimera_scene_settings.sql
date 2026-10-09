-- Per-player settings for one roleplay scene: how long the character's replies are,
-- words the player does not want to see, and messages pinned so the character never
-- forgets them. One row per (scene, player), only that player can read or change it.
--
-- Additive only: a new table, nothing existing is altered.
CREATE TABLE public.chimera_scene_settings (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  response_length text NOT NULL DEFAULT 'medium' CHECK (response_length IN ('short', 'medium', 'long')),
  banned_words text NOT NULL DEFAULT '' CHECK (char_length(banned_words) <= 500),
  pinned_message_ids uuid[] NOT NULL DEFAULT '{}' CHECK (cardinality(pinned_message_ids) <= 8),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE public.chimera_scene_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY chimera_scene_settings_select ON public.chimera_scene_settings
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) AND chimera_private.is_conversation_member(conversation_id));
CREATE POLICY chimera_scene_settings_insert ON public.chimera_scene_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND chimera_private.is_conversation_member(conversation_id));
CREATE POLICY chimera_scene_settings_update ON public.chimera_scene_settings
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND chimera_private.is_conversation_member(conversation_id))
  WITH CHECK (user_id = (SELECT auth.uid()) AND chimera_private.is_conversation_member(conversation_id));
CREATE POLICY chimera_scene_settings_delete ON public.chimera_scene_settings
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON public.chimera_scene_settings FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chimera_scene_settings TO authenticated;
GRANT ALL ON public.chimera_scene_settings TO service_role;

CREATE TRIGGER set_chimera_scene_settings_updated_at
  BEFORE UPDATE ON public.chimera_scene_settings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Deleting a scene goes through this function instead of a plain DELETE: CHIMERA's chat list also
-- shows ordinary two-person conversations from the rest of WHISPRR, and the existing participant
-- DELETE policy would let either person remove them. Here only the player who created a scene that
-- contains an AI character can delete it. All child rows cascade.
CREATE OR REPLACE FUNCTION public.delete_chimera_scene(p_conversation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in required' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = p_conversation_id
      AND c.created_by = auth.uid()
      AND EXISTS (SELECT 1 FROM public.conversation_participants me WHERE me.conversation_id = c.id AND me.user_id = auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.conversation_participants bot
        JOIN public.profiles p ON p.user_id = bot.user_id AND p.role = 'ai_character'
        JOIN public.ai_characters a ON a.user_id = bot.user_id
        WHERE bot.conversation_id = c.id
      )
  ) THEN
    RAISE EXCEPTION 'Only a scene you started with a character can be deleted' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.conversations WHERE id = p_conversation_id;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_chimera_scene(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_chimera_scene(uuid) TO authenticated;
