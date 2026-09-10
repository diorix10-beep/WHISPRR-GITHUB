-- Keep immutable snapshots of Storytelling chapters so writers can review and
-- restore earlier drafts without changing the current chapter in place.
CREATE TABLE IF NOT EXISTS public.story_chapter_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.story_chapters(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  status text NOT NULL CHECK (status IN ('draft', 'published')),
  choices jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS story_chapter_revisions_chapter_created_idx
  ON public.story_chapter_revisions (chapter_id, created_at DESC);

ALTER TABLE public.story_chapter_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_story_chapter_revisions" ON public.story_chapter_revisions;
CREATE POLICY "select_own_story_chapter_revisions"
  ON public.story_chapter_revisions
  FOR SELECT TO authenticated
  USING (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "insert_own_story_chapter_revisions" ON public.story_chapter_revisions;
CREATE POLICY "insert_own_story_chapter_revisions"
  ON public.story_chapter_revisions
  FOR INSERT TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

DROP POLICY IF EXISTS "delete_own_story_chapter_revisions" ON public.story_chapter_revisions;
CREATE POLICY "delete_own_story_chapter_revisions"
  ON public.story_chapter_revisions
  FOR DELETE TO authenticated
  USING (author_id = (select auth.uid()));
