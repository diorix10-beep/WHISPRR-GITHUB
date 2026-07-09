-- Add access_level to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS access_level VARCHAR DEFAULT 'ecosystem';

-- Update the handle_new_user function to extract access_level
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  access_lvl VARCHAR;
BEGIN
  -- Extract access_level from raw_user_meta_data if it exists, otherwise default to 'ecosystem'
  access_lvl := COALESCE(NEW.raw_user_meta_data->>'access_level', 'ecosystem');

  INSERT INTO public.profiles (user_id, display_name, onboarding_complete, access_level)
  VALUES (NEW.id, '', false, access_lvl);
  
  RETURN NEW;
END;
$$;
