-- CHIMERA Lorebook runtime: persistent creator links, secure mutations, and
-- entries that can be deliberately held in every relevant roleplay turn.

ALTER TABLE public.lorebook_entries
  ADD COLUMN IF NOT EXISTS is_constant boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS case_sensitive boolean NOT NULL DEFAULT false;

-- The original phase-two policies allowed an UPDATE/INSERT to pass through an
-- ALL policy without a WITH CHECK predicate. Recreate every mutable policy so
-- ownership is enforced for both the old and new row.
DROP POLICY IF EXISTS "update_lorebooks" ON public.lorebooks;
CREATE POLICY "update_lorebooks" ON public.lorebooks
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "manage_lorebook_entries" ON public.lorebook_entries;
CREATE POLICY "manage_lorebook_entries" ON public.lorebook_entries
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lorebooks
    WHERE lorebooks.id = lorebook_entries.lorebook_id
      AND lorebooks.user_id = (select auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lorebooks
    WHERE lorebooks.id = lorebook_entries.lorebook_id
      AND lorebooks.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "select_lorebook_worlds" ON public.lorebook_worlds;
CREATE POLICY "select_lorebook_worlds" ON public.lorebook_worlds
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lorebooks
    WHERE lorebooks.id = lorebook_worlds.lorebook_id
      AND (lorebooks.visibility IN ('public', 'unlisted') OR lorebooks.user_id = (select auth.uid()))
  ));

DROP POLICY IF EXISTS "manage_lorebook_worlds" ON public.lorebook_worlds;
CREATE POLICY "manage_lorebook_worlds" ON public.lorebook_worlds
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lorebooks
    WHERE lorebooks.id = lorebook_worlds.lorebook_id
      AND lorebooks.user_id = (select auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lorebooks
    WHERE lorebooks.id = lorebook_worlds.lorebook_id
      AND lorebooks.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "select_lorebook_characters" ON public.lorebook_characters;
CREATE POLICY "select_lorebook_characters" ON public.lorebook_characters
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lorebooks
    WHERE lorebooks.id = lorebook_characters.lorebook_id
      AND (lorebooks.visibility IN ('public', 'unlisted') OR lorebooks.user_id = (select auth.uid()))
  ));

DROP POLICY IF EXISTS "manage_lorebook_characters" ON public.lorebook_characters;
CREATE POLICY "manage_lorebook_characters" ON public.lorebook_characters
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.lorebooks
    WHERE lorebooks.id = lorebook_characters.lorebook_id
      AND lorebooks.user_id = (select auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.lorebooks
    WHERE lorebooks.id = lorebook_characters.lorebook_id
      AND lorebooks.user_id = (select auth.uid())
  ));

REVOKE ALL ON public.lorebooks, public.lorebook_entries, public.lorebook_worlds, public.lorebook_characters FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lorebooks, public.lorebook_entries, public.lorebook_worlds, public.lorebook_characters TO authenticated;

CREATE INDEX IF NOT EXISTS idx_lorebook_entries_runtime
  ON public.lorebook_entries (lorebook_id, enabled, priority DESC, insertion_order);
CREATE INDEX IF NOT EXISTS idx_lorebook_characters_character
  ON public.lorebook_characters (character_id, lorebook_id);
CREATE INDEX IF NOT EXISTS idx_lorebook_worlds_world
  ON public.lorebook_worlds (world_id, lorebook_id);
