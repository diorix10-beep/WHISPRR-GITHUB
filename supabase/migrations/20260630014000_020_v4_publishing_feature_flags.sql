-- 1. Modify public_roadmap to support new status lifecycle
ALTER TABLE public.public_roadmap DROP CONSTRAINT IF EXISTS public_roadmap_status_check;
ALTER TABLE public.public_roadmap ADD CONSTRAINT public_roadmap_status_check CHECK (status IN (
  'idea', 'draft', 'in_development', 'internal_testing', 'beta_testing', 'under_review', 'released', 'archived'
));

-- 1.5. Add home_country column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_country text DEFAULT 'Senegal';

-- 2. Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'disabled' CHECK (status IN ('disabled', 'founder_only', 'admin_only', 'beta_only', 'country_specific', 'enabled_all')),
  target_countries text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Enable RLS on feature_flags
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- 4. RLS Read Policies for feature_flags
DROP POLICY IF EXISTS "select_feature_flags" ON public.feature_flags;
CREATE POLICY "select_feature_flags" ON public.feature_flags FOR SELECT TO public USING (true);

-- 5. RLS Write Policies for feature_flags (restricted to founder and admin)
DROP POLICY IF EXISTS "manage_feature_flags" ON public.feature_flags;
CREATE POLICY "manage_feature_flags" ON public.feature_flags FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('founder', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('founder', 'admin')
  )
);

-- 6. Seed initial feature flags
INSERT INTO public.feature_flags (name, description, status, target_countries)
VALUES
  ('direct_messaging', 'Enables real-time one-on-one and group messaging.', 'enabled_all', '{}'),
  ('cozy_communities', 'Enables user-owned interest circles.', 'enabled_all', '{}'),
  ('badge_identity', 'Enables verification badges showing user responsibility dates.', 'beta_only', '{}'),
  ('ai_companions', 'Enables customizing virtual AI companions.', 'founder_only', '{}'),
  ('global_country_spaces', 'Enables country-specific feed priorities and exploration.', 'country_specific', ARRAY['Senegal', 'Canada'])
ON CONFLICT (name) DO NOTHING;

-- 7. Update existing roadmap items statuses to match new lifecycle
UPDATE public.public_roadmap SET status = 'released' WHERE status IN ('released', 'recently_completed');
UPDATE public.public_roadmap SET status = 'in_development' WHERE status IN ('in_progress', 'under_development');
UPDATE public.public_roadmap SET status = 'idea' WHERE status IN ('planned', 'under_consideration');
UPDATE public.public_roadmap SET status = 'beta_testing' WHERE status = 'testing';
UPDATE public.public_roadmap SET status = 'archived' WHERE status = 'future_vision';
