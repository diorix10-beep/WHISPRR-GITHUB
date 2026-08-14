-- A deliberate private draft is separate from the browser's recovery copy and
-- from a published AI-character identity. It belongs only to its creator.
CREATE TABLE IF NOT EXISTS public.chimera_character_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled character',
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  architecture_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chimera_character_drafts_owner_updated_idx
  ON public.chimera_character_drafts (user_id, updated_at DESC);

ALTER TABLE public.chimera_character_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_chimera_character_drafts"
  ON public.chimera_character_drafts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "insert_own_chimera_character_drafts"
  ON public.chimera_character_drafts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own_chimera_character_drafts"
  ON public.chimera_character_drafts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_own_chimera_character_drafts"
  ON public.chimera_character_drafts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_chimera_character_drafts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_chimera_character_drafts_updated ON public.chimera_character_drafts;
CREATE TRIGGER on_chimera_character_drafts_updated
  BEFORE UPDATE ON public.chimera_character_drafts
  FOR EACH ROW EXECUTE FUNCTION public.set_chimera_character_drafts_updated_at();
