ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS memory_summary text NOT NULL DEFAULT '';
