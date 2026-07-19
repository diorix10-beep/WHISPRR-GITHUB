-- Migration: 023_v7_advanced_beta_invites.sql
-- Description: Add advanced invite code management columns and redemptions table.

ALTER TABLE public.beta_invites 
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS max_uses integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS uses_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revoked boolean NOT NULL DEFAULT false;

-- Create redemptions tracking table
CREATE TABLE IF NOT EXISTS public.beta_invite_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL REFERENCES public.beta_invites(code) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_invite_redemptions ENABLE ROW LEVEL SECURITY;

-- Policies for beta_invite_redemptions
DROP POLICY IF EXISTS "select_own_redemptions" ON public.beta_invite_redemptions;
CREATE POLICY "select_own_redemptions" ON public.beta_invite_redemptions FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_redemption" ON public.beta_invite_redemptions;
CREATE POLICY "insert_own_redemption" ON public.beta_invite_redemptions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "manage_redemptions" ON public.beta_invite_redemptions;
CREATE POLICY "manage_redemptions" ON public.beta_invite_redemptions FOR ALL TO authenticated
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
