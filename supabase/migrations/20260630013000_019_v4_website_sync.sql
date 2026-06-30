-- 1. Create public_roadmap table
CREATE TABLE IF NOT EXISTS public.public_roadmap (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN (
    'released', 'in_progress', 'planned', 'future_vision',
    'recently_completed', 'under_development', 'testing', 'under_consideration'
  )),
  category text NOT NULL,
  is_community_requested boolean NOT NULL DEFAULT false,
  requested_by_count integer NOT NULL DEFAULT 0,
  pinned_milestone boolean NOT NULL DEFAULT false,
  milestone_icon text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create public_changelog table
CREATE TABLE IF NOT EXISTS public.public_changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  title text NOT NULL,
  summary text NOT NULL,
  new_features text[] NOT NULL DEFAULT '{}',
  improvements text[] NOT NULL DEFAULT '{}',
  bug_fixes text[] NOT NULL DEFAULT '{}',
  performance text[] NOT NULL DEFAULT '{}',
  published_at timestamptz DEFAULT now()
);

-- 3. Create founder_journal table
CREATE TABLE IF NOT EXISTS public.founder_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  category text NOT NULL CHECK (category IN ('Founder Journal', 'Product Update', 'Technical Article', 'Privacy Update')),
  author text NOT NULL DEFAULT 'nyny59 (Founder)',
  read_time text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.public_roadmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_journal ENABLE ROW LEVEL SECURITY;

-- 5. RLS Read Policies (Public select)
DROP POLICY IF EXISTS "select_public_roadmap" ON public.public_roadmap;
CREATE POLICY "select_public_roadmap" ON public.public_roadmap FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "select_public_changelog" ON public.public_changelog;
CREATE POLICY "select_public_changelog" ON public.public_changelog FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "select_founder_journal" ON public.founder_journal;
CREATE POLICY "select_founder_journal" ON public.founder_journal FOR SELECT TO public USING (true);

-- 6. RLS Admin Write Policies (Restrict to founder/admin roles)
DROP POLICY IF EXISTS "manage_public_roadmap" ON public.public_roadmap;
CREATE POLICY "manage_public_roadmap" ON public.public_roadmap FOR ALL TO authenticated
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

DROP POLICY IF EXISTS "manage_public_changelog" ON public.public_changelog;
CREATE POLICY "manage_public_changelog" ON public.public_changelog FOR ALL TO authenticated
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

DROP POLICY IF EXISTS "manage_founder_journal" ON public.founder_journal;
CREATE POLICY "manage_founder_journal" ON public.founder_journal FOR ALL TO authenticated
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

-- 7. Seed initial roadmap data
INSERT INTO public.public_roadmap (title, description, status, category, is_community_requested, requested_by_count, pinned_milestone, milestone_icon)
VALUES
  ('User Profiles', 'Rich profiles with custom interests, bios, and location metrics.', 'released', 'Core', false, 0, true, '🌱'),
  ('Cozy Communities', 'Interest groups owned by creators with private custom settings.', 'released', 'Social', false, 0, true, '🧩'),
  ('Direct Messages & Groups', 'Real-time messaging for close friends and groups.', 'released', 'Social', true, 189, true, '💬'),
  ('Search & Explore', 'Personalized filters for topics, tags, and profiles.', 'released', 'Discovery', false, 0, false, null),
  ('Badge & Identity System', 'Verification tracks showing user responsibility timeline.', 'in_progress', 'Trust', true, 142, true, '🏅'),
  ('Founder Dashboard', 'Controls for system maintenance bypass and feedback logs.', 'in_progress', 'Security', false, 0, true, '👑'),
  ('Discovery Algorithms', 'Interest-graph indexing prioritizing conversation quality.', 'in_progress', 'Discovery', false, 0, false, null),
  ('Mobile Settings Accessibility', 'Permanent settings accessibility links and profiles menus.', 'released', 'UX', true, 204, false, null),
  ('AI Companion Characters', 'Customizable virtual friends with specific personality keys.', 'planned', 'AI', false, 0, true, '🎭'),
  ('Roleplay Worlds', 'Collaborative rooms for creative writing and setup.', 'planned', 'Social', false, 0, false, null),
  ('Character Memory Models', 'Allowing AI companions to build interaction history.', 'planned', 'AI', false, 0, false, null),
  ('Audio & Voice Rooms', 'Drop-in channels for active voice conversations.', 'planned', 'Audio', false, 0, false, null),
  ('Creator Monetization', 'Tips, premium community subscriptions, and lock boxes.', 'future_vision', 'Economy', false, 0, false, null),
  ('Decentralized Server Sync', 'Self-hosted backend options syncing to the main cloud.', 'future_vision', 'Infrastructure', false, 0, false, null),
  ('Collaborative Storytelling', 'Integrated markdown story trees for roleplayers.', 'future_vision', 'Social', false, 0, false, null)
ON CONFLICT DO NOTHING;

-- 8. Seed initial changelog data
INSERT INTO public.public_changelog (version, status, title, summary, new_features, improvements, bug_fixes, performance)
VALUES
  (
    'v4.0.0',
    'published',
    'Founder Mode & Badges Update',
    'Introduced a robust role-based badge system, dynamic Maintenance Mode bypass controls, and the new Public Website project homepage.',
    ARRAY['Implemented dynamic Badge & Identity System showing chronological earned dates.', 'Created Founder Panel for system-wide controls, analytics, and user moderations.', 'Created public Building page showing product updates and community feedback logs.'],
    ARRAY['Completed Discovery & Recommendation interest-graph personalization engine.', 'Updated mobile UX header introducing top-right Profile Dropdown access.'],
    ARRAY['Resolved Supabase RLS policies blocking conversation creation for new users.', 'Fixed closing div tags causing layout compilation issues in main layout.'],
    ARRAY['Reduced initial bundle chunk size by lazy loading dashboard views.', 'Decreased user badges database query latency via profile array caching.']
  ),
  (
    'v3.5.0',
    'published',
    'Group Messaging Release',
    'We released Group Messaging to support up to 50 users in collaborative chats, alongside layout improvements.',
    ARRAY['Released Group Messaging enabling chats of up to 50 members.', 'Integrated real-time push notification indicators on tabs.'],
    ARRAY['Added backdrop-blur filter to desktop navigation and feed headers.'],
    ARRAY['Resolved profile photo loading glitches for Google logins.', 'Fixed timezone discrepancies in chat message timestamps.'],
    ARRAY['Improved feed listing rendering performance by 35%.']
  )
ON CONFLICT (version) DO NOTHING;

-- 9. Seed initial journal data
INSERT INTO public.founder_journal (title, excerpt, content, category, read_time, status)
VALUES
  (
    'Founder Log #1: The Genesis of WHISPRR',
    'Reflecting on why social networks got bloated, and why returning to simple, asynchronous interest graphs is the only way forward.',
    'Social networks have transitioned from tools of connection to machines of extraction. We started WHISPRR because we wanted a place to share ideas, join interest circles, and read thoughts without feeling manipulated. This journal documents that progress.',
    'Founder Journal',
    '5 min read',
    'published'
  ),
  (
    'Designing Social Software for Mental Well-being',
    'How we engineered a platform that doesn’t use infinite scroll, red dots, or notification triggers to hijack your dopaminergic pathways.',
    'We reject metrics tracking designed to extract screen time. Our goal is centered on user agency, finite feeds, and intentional discovery.',
    'Privacy Update',
    '8 min read',
    'published'
  ),
  (
    'Founder Log #2: Introducing Trust & Roles',
    'A behind-the-scenes look at the dynamic badge system. Why badges represent contribution, history, and responsibility rather than clout.',
    'Badges should never represent popularity. Instead, they help users understand who someone is, what they contribute to the platform, and the role they play within the WHISPRR ecosystem.',
    'Founder Journal',
    '6 min read',
    'published'
  )
ON CONFLICT DO NOTHING;
