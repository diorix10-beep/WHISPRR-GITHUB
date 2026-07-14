-- 1. Extend stories table with fields for genre, tags, status, and WHISPRR sharing info
ALTER TABLE public.stories 
  ADD COLUMN IF NOT EXISTS genre text DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'hiatus')),
  ADD COLUMN IF NOT EXISTS shared_to_whisprr boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS whisprr_whisper_id uuid;

-- 2. Create story_chapters table
CREATE TABLE IF NOT EXISTS public.story_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  chapter_number integer NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create story_library table
CREATE TABLE IF NOT EXISTS public.story_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  current_chapter_id uuid REFERENCES public.story_chapters(id) ON DELETE SET NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, story_id)
);

-- 4. Create story_votes table
CREATE TABLE IF NOT EXISTS public.story_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, story_id)
);

-- 5. Create story_comments table
CREATE TABLE IF NOT EXISTS public.story_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES public.story_chapters(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_id uuid REFERENCES public.story_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.story_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Chapters
DROP POLICY IF EXISTS "select_chapters" ON public.story_chapters;
CREATE POLICY "select_chapters" ON public.story_chapters
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_chapters.story_id 
        AND (
          (stories.visibility = 'public' AND story_chapters.status = 'published') 
          OR (stories.visibility = 'unlisted' AND story_chapters.status = 'published') 
          OR stories.user_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "insert_chapters" ON public.story_chapters;
CREATE POLICY "insert_chapters" ON public.story_chapters
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_chapters.story_id 
        AND stories.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_chapters" ON public.story_chapters;
CREATE POLICY "update_chapters" ON public.story_chapters
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_chapters.story_id 
        AND stories.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_chapters" ON public.story_chapters;
CREATE POLICY "delete_chapters" ON public.story_chapters
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stories 
      WHERE stories.id = story_chapters.story_id 
        AND stories.user_id = auth.uid()
    )
  );

-- Library
DROP POLICY IF EXISTS "select_library" ON public.story_library;
CREATE POLICY "select_library" ON public.story_library FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "insert_library" ON public.story_library;
CREATE POLICY "insert_library" ON public.story_library FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_library" ON public.story_library;
CREATE POLICY "update_library" ON public.story_library FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_library" ON public.story_library;
CREATE POLICY "delete_library" ON public.story_library FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Votes
DROP POLICY IF EXISTS "select_votes" ON public.story_votes;
CREATE POLICY "select_votes" ON public.story_votes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_votes" ON public.story_votes;
CREATE POLICY "insert_votes" ON public.story_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_votes" ON public.story_votes;
CREATE POLICY "delete_votes" ON public.story_votes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Comments
DROP POLICY IF EXISTS "select_comments" ON public.story_comments;
CREATE POLICY "select_comments" ON public.story_comments FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_comments.story_id 
      AND (stories.visibility = 'public' OR stories.visibility = 'unlisted' OR stories.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "insert_comments" ON public.story_comments;
CREATE POLICY "insert_comments" ON public.story_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_comments" ON public.story_comments;
CREATE POLICY "update_comments" ON public.story_comments FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_comments" ON public.story_comments;
CREATE POLICY "delete_comments" ON public.story_comments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Triggers for updated_at on chapters
DROP TRIGGER IF EXISTS set_story_chapters_updated_at ON public.story_chapters;
CREATE TRIGGER set_story_chapters_updated_at BEFORE UPDATE ON public.story_chapters FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
