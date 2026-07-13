-- COMMUNITY COLLABORATIONS TABLE
CREATE TABLE IF NOT EXISTS public.community_collaborations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role_needed text NOT NULL CHECK (role_needed IN ('writer', 'editor', 'prompt_engineer', 'voice_actor', 'collaborator')),
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_collaborations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_collaborations" ON public.community_collaborations;
CREATE POLICY "select_collaborations" ON public.community_collaborations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_collaborations" ON public.community_collaborations;
CREATE POLICY "insert_collaborations" ON public.community_collaborations
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM public.community_members 
      WHERE community_id = community_collaborations.community_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_collaboration" ON public.community_collaborations;
CREATE POLICY "delete_own_collaboration" ON public.community_collaborations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- COMMUNITY FEATURED CREATIONS TABLE
CREATE TABLE IF NOT EXISTS public.community_featured (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  asset_type text NOT NULL CHECK (asset_type IN ('character', 'story', 'world', 'lorebook')),
  asset_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_featured ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_featured" ON public.community_featured;
CREATE POLICY "select_featured" ON public.community_featured
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_featured" ON public.community_featured;
CREATE POLICY "insert_featured" ON public.community_featured
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM public.community_members 
      WHERE community_id = community_featured.community_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_featured" ON public.community_featured;
CREATE POLICY "delete_own_featured" ON public.community_featured
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- COMMUNITY EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('writing_challenge', 'creator_event', 'contest', 'collaboration_week')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_events" ON public.community_events;
CREATE POLICY "select_events" ON public.community_events
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "manage_moderator_events" ON public.community_events;
CREATE POLICY "manage_moderator_events" ON public.community_events
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.community_members 
      WHERE community_id = community_events.community_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'moderator')
    )
  );
