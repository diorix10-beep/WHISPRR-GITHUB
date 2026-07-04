-- Migration: 027_v4_agent_tables_and_drafts.sql
-- Description: Creates public tables for AI Agent objectives, insights, recommendations, campaigns, and drafts.

-- 1. Create agent_objectives table
CREATE TABLE IF NOT EXISTS public.agent_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL, -- 'oracle', 'iris', etc.
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  target_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create agent_insights table
CREATE TABLE IF NOT EXISTS public.agent_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('faq', 'feature_request', 'positive_feedback', 'negative_feedback', 'trend')),
  title text NOT NULL,
  description text NOT NULL,
  sentiment_score numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create agent_recommendations table
CREATE TABLE IF NOT EXISTS public.agent_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  recommendation text NOT NULL,
  rationale text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create agent_campaigns table
CREATE TABLE IF NOT EXISTS public.agent_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  description text NOT NULL,
  goals text NOT NULL,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Create agent_drafts table
CREATE TABLE IF NOT EXISTS public.agent_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  platform text NOT NULL DEFAULT 'x',
  content text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected', 'published')),
  campaign_id uuid REFERENCES public.agent_campaigns(id) ON DELETE SET NULL,
  ref_id uuid,
  ref_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Enable Row-Level Security
ALTER TABLE public.agent_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_drafts ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies
DROP POLICY IF EXISTS "select_objectives" ON public.agent_objectives;
CREATE POLICY "select_objectives" ON public.agent_objectives FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "insert_objectives" ON public.agent_objectives;
CREATE POLICY "insert_objectives" ON public.agent_objectives FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "update_objectives" ON public.agent_objectives;
CREATE POLICY "update_objectives" ON public.agent_objectives FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "select_insights" ON public.agent_insights;
CREATE POLICY "select_insights" ON public.agent_insights FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "insert_insights" ON public.agent_insights;
CREATE POLICY "insert_insights" ON public.agent_insights FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "select_recommendations" ON public.agent_recommendations;
CREATE POLICY "select_recommendations" ON public.agent_recommendations FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "insert_recommendations" ON public.agent_recommendations;
CREATE POLICY "insert_recommendations" ON public.agent_recommendations FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "update_recommendations" ON public.agent_recommendations;
CREATE POLICY "update_recommendations" ON public.agent_recommendations FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "select_campaigns" ON public.agent_campaigns;
CREATE POLICY "select_campaigns" ON public.agent_campaigns FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "insert_campaigns" ON public.agent_campaigns;
CREATE POLICY "insert_campaigns" ON public.agent_campaigns FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "update_campaigns" ON public.agent_campaigns;
CREATE POLICY "update_campaigns" ON public.agent_campaigns FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "select_drafts" ON public.agent_drafts;
CREATE POLICY "select_drafts" ON public.agent_drafts FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "insert_drafts" ON public.agent_drafts;
CREATE POLICY "insert_drafts" ON public.agent_drafts FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "update_drafts" ON public.agent_drafts;
CREATE POLICY "update_drafts" ON public.agent_drafts FOR UPDATE TO public USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_drafts" ON public.agent_drafts;
CREATE POLICY "delete_drafts" ON public.agent_drafts FOR DELETE TO public USING (true);
