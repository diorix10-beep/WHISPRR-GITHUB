-- Migration: 022_v6_beta_access_control.sql
-- Description: Create tables for private beta whitelisting and invite codes.

-- 1. Create beta_whitelist table
CREATE TABLE IF NOT EXISTS public.beta_whitelist (
  email text PRIMARY KEY,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on beta_whitelist
ALTER TABLE public.beta_whitelist ENABLE ROW LEVEL SECURITY;

-- Policies for beta_whitelist
DROP POLICY IF EXISTS "select_own_whitelist" ON public.beta_whitelist;
CREATE POLICY "select_own_whitelist" ON public.beta_whitelist FOR SELECT TO authenticated
USING (LOWER(email) = LOWER(auth.jwt()->>'email'));

DROP POLICY IF EXISTS "manage_beta_whitelist" ON public.beta_whitelist;
CREATE POLICY "manage_beta_whitelist" ON public.beta_whitelist FOR ALL TO authenticated
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

-- 2. Create beta_invites table
CREATE TABLE IF NOT EXISTS public.beta_invites (
  code text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid()
);

-- Enable RLS on beta_invites
ALTER TABLE public.beta_invites ENABLE ROW LEVEL SECURITY;

-- Policies for beta_invites
DROP POLICY IF EXISTS "select_invite_code" ON public.beta_invites;
CREATE POLICY "select_invite_code" ON public.beta_invites FOR SELECT TO authenticated
USING (used_at IS NULL OR used_by = auth.uid());

DROP POLICY IF EXISTS "claim_invite_code" ON public.beta_invites;
CREATE POLICY "claim_invite_code" ON public.beta_invites FOR UPDATE TO authenticated
USING (used_at IS NULL)
WITH CHECK (used_by = auth.uid() AND used_at IS NOT NULL);

DROP POLICY IF EXISTS "manage_beta_invites" ON public.beta_invites;
CREATE POLICY "manage_beta_invites" ON public.beta_invites FOR ALL TO authenticated
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
