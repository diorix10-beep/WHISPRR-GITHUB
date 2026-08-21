ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS character_id uuid
  REFERENCES public.ai_characters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conversations_character_id_idx
  ON public.conversations (character_id)
  WHERE character_id IS NOT NULL;
