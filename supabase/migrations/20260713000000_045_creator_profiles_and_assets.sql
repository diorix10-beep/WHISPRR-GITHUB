-- Step 1: Add Creator Profile Fields to public.profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS currently_building text DEFAULT '',
  ADD COLUMN IF NOT EXISTS creator_role_1 text DEFAULT '',
  ADD COLUMN IF NOT EXISTS creator_role_2 text DEFAULT '';

-- Step 2: Create public.stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_url text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 3: Create public.worlds table
CREATE TABLE IF NOT EXISTS public.worlds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  scenario text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 4: Create public.lorebooks table
CREATE TABLE IF NOT EXISTS public.lorebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  entry_count integer NOT NULL DEFAULT 0,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 5: Enable Row-Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lorebooks ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS Policies
-- Stories
DROP POLICY IF EXISTS "select_stories" ON public.stories;
CREATE POLICY "select_stories" ON public.stories 
  FOR SELECT TO authenticated 
  USING (visibility = 'public' OR visibility = 'unlisted' OR user_id = auth.uid());

DROP POLICY IF EXISTS "insert_stories" ON public.stories;
CREATE POLICY "insert_stories" ON public.stories 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_stories" ON public.stories;
CREATE POLICY "update_stories" ON public.stories 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_stories" ON public.stories;
CREATE POLICY "delete_stories" ON public.stories 
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid());

-- Worlds
DROP POLICY IF EXISTS "select_worlds" ON public.worlds;
CREATE POLICY "select_worlds" ON public.worlds 
  FOR SELECT TO authenticated 
  USING (visibility = 'public' OR visibility = 'unlisted' OR user_id = auth.uid());

DROP POLICY IF EXISTS "insert_worlds" ON public.worlds;
CREATE POLICY "insert_worlds" ON public.worlds 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_worlds" ON public.worlds;
CREATE POLICY "update_worlds" ON public.worlds 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_worlds" ON public.worlds;
CREATE POLICY "delete_worlds" ON public.worlds 
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid());

-- Lorebooks
DROP POLICY IF EXISTS "select_lorebooks" ON public.lorebooks;
CREATE POLICY "select_lorebooks" ON public.lorebooks 
  FOR SELECT TO authenticated 
  USING (visibility = 'public' OR visibility = 'unlisted' OR user_id = auth.uid());

DROP POLICY IF EXISTS "insert_lorebooks" ON public.lorebooks;
CREATE POLICY "insert_lorebooks" ON public.lorebooks 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_lorebooks" ON public.lorebooks;
CREATE POLICY "update_lorebooks" ON public.lorebooks 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_lorebooks" ON public.lorebooks;
CREATE POLICY "delete_lorebooks" ON public.lorebooks 
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid());

-- Triggers to auto-update updated_at timestamps
DROP TRIGGER IF EXISTS set_stories_updated_at ON public.stories;
CREATE TRIGGER set_stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_worlds_updated_at ON public.worlds;
CREATE TRIGGER set_worlds_updated_at BEFORE UPDATE ON public.worlds FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_lorebooks_updated_at ON public.lorebooks;
CREATE TRIGGER set_lorebooks_updated_at BEFORE UPDATE ON public.lorebooks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
