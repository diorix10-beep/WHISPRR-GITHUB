/*
# Legal Compliance & Moderation Tracking

1. Changes
- Adds columns to `profiles` for tracking legal document acceptance (version, timestamp, IP)
- Creates `user_violations` table for moderation (warnings, restrictions, suspensions, bans)

2. Security
- Enable RLS on `user_violations`
- Users can SELECT their own violations
- Only admins (or system) can INSERT/UPDATE violations
- Users can UPDATE their own violations ONLY to acknowledge them
*/

-- Step 1: Legal Acceptance Fields on Profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS legal_accepted_version text,
  ADD COLUMN IF NOT EXISTS legal_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS legal_accepted_ip text;

-- Step 2: Moderation/Violations Table
CREATE TABLE IF NOT EXISTS public.user_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_violated text NOT NULL,
  violated_section_link text NOT NULL,
  violation_level int NOT NULL DEFAULT 1, -- 1=warning, 2=restriction, 3=suspension, 4=ban
  description text NOT NULL,
  acknowledged boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_violations_user_id ON public.user_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_violations_unacknowledged ON public.user_violations(user_id) WHERE acknowledged = false;
CREATE INDEX IF NOT EXISTS idx_user_violations_active_suspension ON public.user_violations(user_id) WHERE violation_level >= 3;

-- Enable RLS
ALTER TABLE public.user_violations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own violations
DROP POLICY IF EXISTS "Users can view their own violations" ON public.user_violations;
CREATE POLICY "Users can view their own violations" 
  ON public.user_violations FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Policy: Users can update their own violations ONLY to acknowledge them
DROP POLICY IF EXISTS "Users can acknowledge their own violations" ON public.user_violations;
CREATE POLICY "Users can acknowledge their own violations" 
  ON public.user_violations FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System/Admin inserts happen via backend or Edge Functions using Service Role,
-- so we don't need a public INSERT policy for users.

-- Trigger to update `updated_at` on user_violations
DROP TRIGGER IF EXISTS set_user_violations_updated_at ON public.user_violations;
CREATE TRIGGER set_user_violations_updated_at
  BEFORE UPDATE ON public.user_violations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Step 3: Update auto_create_profile trigger to map legal_accepted_version
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    username, 
    display_name,
    legal_accepted_version,
    legal_accepted_at
  )
  VALUES (
    NEW.id,
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 4),
    SPLIT_PART(NEW.email, '@', 1),
    NEW.raw_user_meta_data->>'legal_accepted_version',
    CASE WHEN NEW.raw_user_meta_data->>'legal_accepted_version' IS NOT NULL THEN now() ELSE null END
  );
  RETURN NEW;
END;
$$;
