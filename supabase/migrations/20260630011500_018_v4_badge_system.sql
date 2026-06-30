-- Migration: 018_v4_badge_system.sql
-- Description: Establishes the user_badges table, sync triggers, and default badge structures.

-- 1. Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE, -- NULL for global badges
  earned_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(user_id, badge_type, community_id)
);

-- 2. Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Anyone authenticated can view all badges
DROP POLICY IF EXISTS "select_user_badges" ON public.user_badges;
CREATE POLICY "select_user_badges" ON public.user_badges FOR SELECT TO authenticated
USING (true);

-- Only founders and admins can manage badges
DROP POLICY IF EXISTS "manage_user_badges" ON public.user_badges;
CREATE POLICY "manage_user_badges" ON public.user_badges FOR ALL TO authenticated
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

-- 4. Sync profile badges function and trigger
CREATE OR REPLACE FUNCTION public.sync_profile_badges()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.community_id IS NULL THEN
      UPDATE public.profiles
      SET badges = ARRAY(
        SELECT DISTINCT badge_type 
        FROM public.user_badges 
        WHERE user_id = NEW.user_id AND community_id IS NULL
      )
      WHERE user_id = NEW.user_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.community_id IS NULL THEN
      UPDATE public.profiles
      SET badges = ARRAY(
        SELECT DISTINCT badge_type 
        FROM public.user_badges 
        WHERE user_id = OLD.user_id AND community_id IS NULL
      )
      WHERE user_id = OLD.user_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER sync_user_badges_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_badges
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_badges();

-- 5. Auto assign Early Supporter function
CREATE OR REPLACE FUNCTION public.run_early_supporter_assignment(p_cutoff_date timestamptz)
RETURNS integer AS $$
DECLARE
  v_count integer := 0;
  v_rec record;
BEGIN
  FOR v_rec IN 
    SELECT user_id, created_at FROM public.profiles 
    WHERE created_at < p_cutoff_date
  LOOP
    INSERT INTO public.user_badges (user_id, badge_type, earned_at)
    VALUES (v_rec.user_id, 'early_supporter', v_rec.created_at)
    ON CONFLICT (user_id, badge_type, community_id) DO NOTHING;
    
    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Insert founder badge for user 'nyny59'
INSERT INTO public.user_badges (user_id, badge_type, earned_at)
SELECT user_id, 'founder', created_at 
FROM public.profiles 
WHERE username = 'nyny59'
ON CONFLICT DO NOTHING;
