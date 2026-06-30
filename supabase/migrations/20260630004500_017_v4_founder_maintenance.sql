-- Migration: 017_v4_founder_maintenance.sql
-- Description: Adds profile role, system_settings table, and bootstrap rules for Maintenance Mode.

-- 1. Add role column to profiles table with strict check
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user' CHECK (role IN ('founder', 'admin', 'moderator', 'user'));

-- 2. Bootstrap founder role for existing user 'nyny59'
UPDATE public.profiles
SET role = 'founder'
WHERE username = 'nyny59';

-- 3. Create initial assign trigger to ensure the first profile created receives the 'founder' role automatically
CREATE OR REPLACE FUNCTION public.assign_initial_profile_role()
RETURNS trigger AS $$
BEGIN
  IF (SELECT count(*) FROM public.profiles) = 0 THEN
    NEW.role := 'founder';
  ELSE
    NEW.role := 'user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER assign_initial_role_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_initial_profile_role();

-- 4. Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 5. Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for system_settings
-- Anyone can view settings (needed for public maintenance check)
DROP POLICY IF EXISTS "select_system_settings" ON public.system_settings;
CREATE POLICY "select_system_settings" ON public.system_settings FOR SELECT TO public
USING (true);

-- Only founders and admins can modify settings
DROP POLICY IF EXISTS "modify_system_settings" ON public.system_settings;
CREATE POLICY "modify_system_settings" ON public.system_settings FOR ALL TO authenticated
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

-- 7. Insert default row for maintenance_mode settings
INSERT INTO public.system_settings (key, value)
VALUES (
  'maintenance_mode',
  '{"enabled": true, "message": "We''re currently improving WHISPRR to bring you a better experience. Thank you for your patience. ❤️", "reopen_at": null, "bypass_founder": true, "bypass_admin": true}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 8. Force enable maintenance mode in case settings already exist
UPDATE public.system_settings
SET value = jsonb_set(value, '{enabled}', 'true')
WHERE key = 'maintenance_mode';
