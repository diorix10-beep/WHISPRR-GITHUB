ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS lorebook_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];
