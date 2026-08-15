-- Durable, user-controlled memory for an individual CHIMERA character bond.
-- Scene-specific continuity remains on conversations.memory_summary, so a
-- memory written for one roleplay cannot silently become canon in another.
CREATE TABLE IF NOT EXISTS public.character_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES public.ai_characters(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type text NOT NULL CHECK (memory_type IN ('long_term', 'short_term', 'personality', 'relationship', 'lore')),
  content text NOT NULL,
  importance integer DEFAULT 5,
  last_accessed_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.character_memories ENABLE ROW LEVEL SECURITY;

-- New public-schema tables may not be Data API exposed automatically. Explicit
-- grants keep the authenticated CHIMERA client usable; RLS below decides which
-- individual rows it may access.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.character_memories TO authenticated;

DROP POLICY IF EXISTS "Users can view their own character memories" ON public.character_memories;
CREATE POLICY "Users can view their own character memories"
  ON public.character_memories FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own character memories" ON public.character_memories;
CREATE POLICY "Users can insert their own character memories"
  ON public.character_memories FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own character memories" ON public.character_memories;
CREATE POLICY "Users can update their own character memories"
  ON public.character_memories FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own character memories" ON public.character_memories;
CREATE POLICY "Users can delete their own character memories"
  ON public.character_memories FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_character_memories_owner_character_importance
  ON public.character_memories (user_id, character_id, importance DESC, updated_at DESC);
