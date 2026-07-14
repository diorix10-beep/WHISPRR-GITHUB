-- 1. Update existing profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pronouns text,
ADD COLUMN IF NOT EXISTS banner_url text;

-- 2. Create Personas table
CREATE TABLE IF NOT EXISTS public.personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  avatar_url text,
  name text NOT NULL,
  description text DEFAULT '',
  gender text,
  age text,
  pronouns text,
  personality text DEFAULT '',
  appearance text DEFAULT '',
  occupation text,
  backstory text DEFAULT '',
  greeting text DEFAULT '',
  relationships text DEFAULT '',
  tags text[] DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Personas
-- Users can see their own personas, plus any public personas
DROP POLICY IF EXISTS "select_personas" ON public.personas;
CREATE POLICY "select_personas" ON public.personas 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR is_public = true);

-- Users can only insert their own personas
DROP POLICY IF EXISTS "insert_personas" ON public.personas;
CREATE POLICY "insert_personas" ON public.personas 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- Users can update their own personas
DROP POLICY IF EXISTS "update_personas" ON public.personas;
CREATE POLICY "update_personas" ON public.personas 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own personas
DROP POLICY IF EXISTS "delete_personas" ON public.personas;
CREATE POLICY "delete_personas" ON public.personas 
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid());

-- 5. Trigger to ensure only one default persona per user
CREATE OR REPLACE FUNCTION public.handle_default_persona()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If this persona is being set to default, unset all others for this user
  IF NEW.is_default = true THEN
    UPDATE public.personas
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_single_default_persona ON public.personas;
CREATE TRIGGER ensure_single_default_persona
  BEFORE INSERT OR UPDATE OF is_default
  ON public.personas
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.handle_default_persona();
