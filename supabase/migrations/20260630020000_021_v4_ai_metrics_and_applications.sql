-- Migration: 021_v4_ai_metrics_and_applications.sql
-- Description: Adds referral tracking fields to profiles, establishes ai_metrics and applications tables, and bootstraps bot profiles and metrics.

-- 1. Add referral columns to public.profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referrals_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Create ai_metrics table
CREATE TABLE IF NOT EXISTS public.ai_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL CHECK (agent_id IN ('oracle', 'iris', 'aegis', 'atlas', 'athena', 'whisprr')),
  name text NOT NULL,
  value text NOT NULL,
  is_admin_only boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, name)
);

-- Enable RLS on ai_metrics
ALTER TABLE public.ai_metrics ENABLE ROW LEVEL SECURITY;

-- Select policies for ai_metrics (authenticated users can read public stats)
DROP POLICY IF EXISTS "select_public_ai_metrics" ON public.ai_metrics;
CREATE POLICY "select_public_ai_metrics" ON public.ai_metrics FOR SELECT TO authenticated
USING (true);

-- Manage policies for ai_metrics (only founders and admins can modify telemetry)
DROP POLICY IF EXISTS "manage_ai_metrics" ON public.ai_metrics;
CREATE POLICY "manage_ai_metrics" ON public.ai_metrics FOR ALL TO authenticated
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

-- 3. Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  name text,
  email text,
  type text NOT NULL CHECK (type IN ('creator', 'ambassador', 'career')),
  platform text,
  handle text,
  motivation text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Read policies for applications (users can view their own; founders/admins can view all)
DROP POLICY IF EXISTS "select_applications" ON public.applications;
CREATE POLICY "select_applications" ON public.applications FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('founder', 'admin')
  )
);

-- Insert policies for applications (authenticated users can submit applications)
DROP POLICY IF EXISTS "insert_applications" ON public.applications;
CREATE POLICY "insert_applications" ON public.applications FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id OR user_id IS NULL
);

-- Update policies for applications (only founders and admins can approve/reject)
DROP POLICY IF EXISTS "update_applications" ON public.applications;
CREATE POLICY "update_applications" ON public.applications FOR UPDATE TO authenticated
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

-- Delete policies for applications (only founders and admins)
DROP POLICY IF EXISTS "delete_applications" ON public.applications;
CREATE POLICY "delete_applications" ON public.applications FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('founder', 'admin')
  )
);

-- 4. Referral tracking trigger & function
CREATE OR REPLACE FUNCTION public.handle_referral_tracking()
RETURNS trigger AS $$
BEGIN
  -- If it's an update and referred_by changes from NULL to a value
  IF TG_OP = 'UPDATE' THEN
    IF OLD.referred_by IS NULL AND NEW.referred_by IS NOT NULL AND NEW.referred_by <> NEW.user_id THEN
      UPDATE public.profiles
      SET referrals_count = referrals_count + 1
      WHERE user_id = NEW.referred_by;
    END IF;
  -- If it's an insert
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.referred_by IS NOT NULL AND NEW.referred_by <> NEW.user_id THEN
      UPDATE public.profiles
      SET referrals_count = referrals_count + 1
      WHERE user_id = NEW.referred_by;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS track_referral_trigger ON public.profiles;
CREATE TRIGGER track_referral_trigger
  AFTER INSERT OR UPDATE OF referred_by ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_referral_tracking();

-- 5. Bootstrap bot users and profiles
-- Insert into auth.users (using fixed UUIDs and default metadata)
INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, aud, role, email_confirmed_at)
VALUES 
  ('da01a00a-60d7-41ec-b827-8178cd3bf084', 'oracle@whisprr.ai', '{"provider":"email","providers":["email"]}', '{"display_name":"Oracle"}', 'authenticated', 'authenticated', now()),
  ('da01a00b-60d7-41ec-b827-8178cd3bf084', 'iris@whisprr.ai', '{"provider":"email","providers":["email"]}', '{"display_name":"Iris"}', 'authenticated', 'authenticated', now()),
  ('da01a00c-60d7-41ec-b827-8178cd3bf084', 'atlas@whisprr.ai', '{"provider":"email","providers":["email"]}', '{"display_name":"Atlas"}', 'authenticated', 'authenticated', now()),
  ('da01a00d-60d7-41ec-b827-8178cd3bf084', 'athena@whisprr.ai', '{"provider":"email","providers":["email"]}', '{"display_name":"Athena"}', 'authenticated', 'authenticated', now()),
  ('da01a00e-60d7-41ec-b827-8178cd3bf084', 'aegis@whisprr.ai', '{"provider":"email","providers":["email"]}', '{"display_name":"Aegis"}', 'authenticated', 'authenticated', now()),
  ('da01a00f-60d7-41ec-b827-8178cd3bf084', 'whisprr@whisprr.ai', '{"provider":"email","providers":["email"]}', '{"display_name":"Whisprr"}', 'authenticated', 'authenticated', now())
ON CONFLICT (id) DO NOTHING;

-- Insert/Update public.profiles to establish their identities
INSERT INTO public.profiles (user_id, display_name, username, role, avatar_emoji, bio, onboarding_complete, home_country)
VALUES
  ('da01a00a-60d7-41ec-b827-8178cd3bf084', 'Oracle', 'oracle', 'admin', '👩', 'Co-Founder & Central Intelligence of the WHISPRR AI Family.', true, 'Senegal'),
  ('da01a00b-60d7-41ec-b827-8178cd3bf084', 'Iris', 'iris', 'admin', '👩', 'Infrastructure & Systems of the WHISPRR AI Family.', true, 'Senegal'),
  ('da01a00c-60d7-41ec-b827-8178cd3bf084', 'Atlas', 'atlas', 'admin', '🗺️', 'Strategy & Analysis of the WHISPRR AI Family.', true, 'Senegal'),
  ('da01a00d-60d7-41ec-b827-8178cd3bf084', 'Athena', 'athena', 'admin', '📚', 'Research & Knowledge of the WHISPRR AI Family.', true, 'Senegal'),
  ('da01a00e-60d7-41ec-b827-8178cd3bf084', 'Aegis', 'aegis', 'moderator', '🛡️', 'Security & Protection of the WHISPRR AI Family.', true, 'Senegal'),
  ('da01a00f-60d7-41ec-b827-8178cd3bf084', 'Whisprr', 'whisprr', 'user', '💜', 'Community & Human Connection of the WHISPRR AI Family.', true, 'Senegal')
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  avatar_emoji = EXCLUDED.avatar_emoji,
  bio = EXCLUDED.bio,
  onboarding_complete = EXCLUDED.onboarding_complete,
  home_country = EXCLUDED.home_country;

-- Insert bot badges
INSERT INTO public.user_badges (user_id, badge_type, earned_at) VALUES
  ('da01a00a-60d7-41ec-b827-8178cd3bf084', 'admin', now()),
  ('da01a00b-60d7-41ec-b827-8178cd3bf084', 'admin', now()),
  ('da01a00c-60d7-41ec-b827-8178cd3bf084', 'admin', now()),
  ('da01a00d-60d7-41ec-b827-8178cd3bf084', 'admin', now()),
  ('da01a00e-60d7-41ec-b827-8178cd3bf084', 'community_moderator', now()),
  ('da01a00f-60d7-41ec-b827-8178cd3bf084', 'ambassador', now())
ON CONFLICT DO NOTHING;

-- 6. Bootstrap default AI Family metrics
INSERT INTO public.ai_metrics (agent_id, name, value, is_admin_only) VALUES
  -- Oracle
  ('oracle', 'Active Conversations', '8', false),
  ('oracle', 'Users Helped Today', '34', false),
  ('oracle', 'Announcements Prepared', '3', false),
  ('oracle', 'Response Latency', '120ms', true),
  ('oracle', 'Daily Token Usage', '254k', true),
  -- Atlas
  ('atlas', 'Active Deployments', '2', false),
  ('atlas', 'GitHub Commits', '14', false),
  ('atlas', 'Pull Requests Reviewed', '6', false),
  ('atlas', 'Services Online', '99.9%', false),
  ('atlas', 'Vercel Deployment Latency', '95ms', true),
  ('atlas', 'Build System Footprint', '185k', true),
  -- Athena
  ('athena', 'Documents Indexed', '150', false),
  ('athena', 'Feedback Analyzed', '42', false),
  ('athena', 'Research Tasks Completed', '8', false),
  ('athena', 'Search Index Latency', '140ms', true),
  ('athena', 'API Token Footprint', '312k', true),
  -- Aegis
  ('aegis', 'Threats Blocked', '4', false),
  ('aegis', 'Reports Reviewed', '12', false),
  ('aegis', 'Security Checks Cleared', '180', false),
  ('aegis', 'WAF Filter Latency', '80ms', true),
  ('aegis', 'Decryption Token Usage', '98k', true),
  -- Iris
  ('iris', 'Active Instances', '3', false),
  ('iris', 'Database Latency', '4ms', false),
  ('iris', 'Health Score', '100%', false),
  ('iris', 'Gateway Response Latency', '105ms', true),
  ('iris', 'Telemetry Sync Status', 'Ok', true)
ON CONFLICT (agent_id, name) DO UPDATE SET
  value = EXCLUDED.value,
  is_admin_only = EXCLUDED.is_admin_only;
