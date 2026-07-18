-- ============================================================
-- CHIMERA Platform Expansion — Phase 1: Foundation
-- Migration: chimera_foundation.sql
-- Description: Projects system, user preferences, creator stats
-- ============================================================

-- 1. Projects: the top-level container for all creator work
CREATE TABLE IF NOT EXISTS public.chimera_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  cover_url text,
  project_type text NOT NULL CHECK (project_type IN ('character', 'world', 'story', 'collection')),
  is_archived boolean DEFAULT false,
  settings jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Creator dashboard stats
CREATE TABLE IF NOT EXISTS public.chimera_creator_stats (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  total_characters integer DEFAULT 0,
  total_worlds integer DEFAULT 0,
  total_stories integer DEFAULT 0,
  total_conversations integer DEFAULT 0,
  total_published integer DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. User AI preferences
CREATE TABLE IF NOT EXISTS public.chimera_user_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  default_ai_model text DEFAULT 'gemini-2.5-flash',
  ai_writing_assistant_enabled boolean DEFAULT false,
  theme_preference text DEFAULT 'system',
  editor_preferences jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable Row-Level Security
ALTER TABLE public.chimera_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chimera_creator_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chimera_user_preferences ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — Projects
DROP POLICY IF EXISTS "select_chimera_projects" ON public.chimera_projects;
CREATE POLICY "select_chimera_projects" ON public.chimera_projects
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "insert_chimera_projects" ON public.chimera_projects;
CREATE POLICY "insert_chimera_projects" ON public.chimera_projects
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_chimera_projects" ON public.chimera_projects;
CREATE POLICY "update_chimera_projects" ON public.chimera_projects
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_chimera_projects" ON public.chimera_projects;
CREATE POLICY "delete_chimera_projects" ON public.chimera_projects
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 6. RLS Policies — Creator Stats
DROP POLICY IF EXISTS "select_chimera_creator_stats" ON public.chimera_creator_stats;
CREATE POLICY "select_chimera_creator_stats" ON public.chimera_creator_stats
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "upsert_chimera_creator_stats" ON public.chimera_creator_stats;
CREATE POLICY "upsert_chimera_creator_stats" ON public.chimera_creator_stats
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_chimera_creator_stats" ON public.chimera_creator_stats;
CREATE POLICY "update_chimera_creator_stats" ON public.chimera_creator_stats
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- 7. RLS Policies — User Preferences
DROP POLICY IF EXISTS "select_chimera_user_preferences" ON public.chimera_user_preferences;
CREATE POLICY "select_chimera_user_preferences" ON public.chimera_user_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "insert_chimera_user_preferences" ON public.chimera_user_preferences;
CREATE POLICY "insert_chimera_user_preferences" ON public.chimera_user_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_chimera_user_preferences" ON public.chimera_user_preferences;
CREATE POLICY "update_chimera_user_preferences" ON public.chimera_user_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_chimera_projects_user_id ON public.chimera_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_chimera_projects_type ON public.chimera_projects(user_id, project_type);
CREATE INDEX IF NOT EXISTS idx_chimera_projects_created_at ON public.chimera_projects(created_at DESC);

-- 9. Triggers for updated_at
DROP TRIGGER IF EXISTS set_chimera_projects_updated_at ON public.chimera_projects;
CREATE TRIGGER set_chimera_projects_updated_at
  BEFORE UPDATE ON public.chimera_projects
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_chimera_user_preferences_updated_at ON public.chimera_user_preferences;
CREATE TRIGGER set_chimera_user_preferences_updated_at
  BEFORE UPDATE ON public.chimera_user_preferences
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 10. Auto-create creator stats and preferences on profile creation
CREATE OR REPLACE FUNCTION public.handle_chimera_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.chimera_creator_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.chimera_user_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_chimera_new_user ON public.profiles;
CREATE TRIGGER on_chimera_new_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_chimera_new_user();
