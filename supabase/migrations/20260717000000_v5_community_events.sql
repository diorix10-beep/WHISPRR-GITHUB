-- Migration: 20260717000000_v5_community_events.sql
-- Description: Create community_events table for organization and management of official events

-- 1. Create community_events table
CREATE TABLE IF NOT EXISTS public.community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  scheduled_start_time timestamptz NOT NULL,
  scheduled_end_time timestamptz,
  host_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  location text NOT NULL, -- Target channel name or external link (e.g. "#🔊│voice-lounge")
  discord_event_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow anyone to select community events
DROP POLICY IF EXISTS "select_community_events" ON public.community_events;
CREATE POLICY "select_community_events" ON public.community_events 
  FOR SELECT TO public USING (true);

-- Restrict write permissions (insert/update/delete) to founder and admin roles
DROP POLICY IF EXISTS "manage_community_events" ON public.community_events;
CREATE POLICY "manage_community_events" ON public.community_events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND (profiles.role = 'founder' OR profiles.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND (profiles.role = 'founder' OR profiles.role = 'admin')
    )
  );
