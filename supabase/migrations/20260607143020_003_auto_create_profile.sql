/*
# Auto-create profile on user signup

1. Changes
- Create a function `handle_new_user()` that inserts a profile row when a new user signs up
- Create a trigger on `auth.users` that calls this function after insert
- The profile is created with default values: empty display_name, no username, default avatar emoji, onboarding_complete=false
- This ensures every new user has a profile row immediately after signup

2. Security
- The function runs as SECURITY DEFINER (as the database owner) so it can insert into the profiles table
- The trigger runs AFTER INSERT on auth.users
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, onboarding_complete)
  VALUES (NEW.id, '', false);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
