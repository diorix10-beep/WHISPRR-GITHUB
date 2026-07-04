-- Migration: 030_v4_ai_characters.sql
-- Description: Creates public tables for AI Characters, character likes, character followers, RLS policies, triggers, and RPC creator helper.

-- 1. Create public.ai_characters table
CREATE TABLE IF NOT EXISTS public.ai_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE,
  creator_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  greeting text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  long_description text NOT NULL DEFAULT '',
  personality text NOT NULL DEFAULT '',
  scenario text NOT NULL DEFAULT '',
  example_dialogues text NOT NULL DEFAULT '',
  conversation_style text NOT NULL DEFAULT '',
  knowledge text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'General',
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  chats_count integer NOT NULL DEFAULT 0,
  likes_count integer NOT NULL DEFAULT 0,
  followers_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create public.ai_character_likes table
CREATE TABLE IF NOT EXISTS public.ai_character_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.ai_characters(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, user_id)
);

-- 3. Create public.ai_character_followers table
CREATE TABLE IF NOT EXISTS public.ai_character_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.ai_characters(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, user_id)
);

-- 4. Enable Row-Level Security
ALTER TABLE public.ai_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_character_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_character_followers ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for ai_characters
DROP POLICY IF EXISTS "select_ai_characters" ON public.ai_characters;
CREATE POLICY "select_ai_characters" ON public.ai_characters 
  FOR SELECT TO authenticated 
  USING (visibility = 'public' OR visibility = 'unlisted' OR creator_id = auth.uid());

DROP POLICY IF EXISTS "insert_ai_characters" ON public.ai_characters;
CREATE POLICY "insert_ai_characters" ON public.ai_characters 
  FOR INSERT TO authenticated 
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "update_ai_characters" ON public.ai_characters;
CREATE POLICY "update_ai_characters" ON public.ai_characters 
  FOR UPDATE TO authenticated 
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "delete_ai_characters" ON public.ai_characters;
CREATE POLICY "delete_ai_characters" ON public.ai_characters 
  FOR DELETE TO authenticated 
  USING (creator_id = auth.uid());

-- 6. RLS Policies for ai_character_likes
DROP POLICY IF EXISTS "select_likes" ON public.ai_character_likes;
CREATE POLICY "select_likes" ON public.ai_character_likes 
  FOR SELECT TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "insert_likes" ON public.ai_character_likes;
CREATE POLICY "insert_likes" ON public.ai_character_likes 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_likes" ON public.ai_character_likes;
CREATE POLICY "delete_likes" ON public.ai_character_likes 
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid());

-- 7. RLS Policies for ai_character_followers
DROP POLICY IF EXISTS "select_followers" ON public.ai_character_followers;
CREATE POLICY "select_followers" ON public.ai_character_followers 
  FOR SELECT TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "insert_followers" ON public.ai_character_followers;
CREATE POLICY "insert_followers" ON public.ai_character_followers 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_followers" ON public.ai_character_followers;
CREATE POLICY "delete_followers" ON public.ai_character_followers 
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid());

-- 8. Counting Triggers
-- Likes Trigger
CREATE OR REPLACE FUNCTION public.handle_ai_character_like_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ai_characters
    SET likes_count = likes_count + 1
    WHERE id = NEW.character_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ai_characters
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.character_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_ai_character_like ON public.ai_character_likes;
CREATE TRIGGER on_ai_character_like
  AFTER INSERT OR DELETE ON public.ai_character_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_ai_character_like_change();

-- Followers Trigger
CREATE OR REPLACE FUNCTION public.handle_ai_character_follower_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ai_characters
    SET followers_count = followers_count + 1
    WHERE id = NEW.character_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.ai_characters
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = OLD.character_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_ai_character_follower ON public.ai_character_followers;
CREATE TRIGGER on_ai_character_follower
  AFTER INSERT OR DELETE ON public.ai_character_followers
  FOR EACH ROW EXECUTE FUNCTION public.handle_ai_character_follower_change();

-- Chats Trigger
CREATE OR REPLACE FUNCTION public.handle_new_conversation_participant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.ai_characters
  SET chats_count = chats_count + 1
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_conversation_participant_added ON public.conversation_participants;
CREATE TRIGGER on_conversation_participant_added
  AFTER INSERT ON public.conversation_participants
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_conversation_participant();

-- 9. Security Definer RPC function to create the Bot User & Profile & Character record safely
CREATE OR REPLACE FUNCTION public.create_ai_character(
  p_name text,
  p_username text,
  p_avatar_emoji text,
  p_greeting text,
  p_short_description text,
  p_long_description text,
  p_personality text,
  p_scenario text,
  p_example_dialogues text,
  p_conversation_style text,
  p_knowledge text,
  p_tags text[],
  p_category text,
  p_visibility text
) RETURNS uuid SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_bot_id uuid := gen_random_uuid();
  v_creator_id uuid := auth.uid();
BEGIN
  -- Check authentication
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify username uniqueness in profiles
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = p_username) THEN
    RAISE EXCEPTION 'Username already taken';
  END IF;

  -- 1. Insert virtual user into auth.users (to satisfy foreign keys)
  INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, aud, role, email_confirmed_at)
  VALUES (
    v_bot_id,
    'bot-' || p_username || '-' || v_bot_id || '@whisprr.ai',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', p_name),
    'authenticated',
    'authenticated',
    now()
  );

  -- The trigger public.handle_new_user() will automatically insert a profile row.
  -- 2. Update the auto-created profile to match our AI Character details
  UPDATE public.profiles
  SET 
    display_name = p_name,
    username = p_username,
    role = 'ai_character',
    avatar_emoji = p_avatar_emoji,
    bio = p_short_description,
    onboarding_complete = true
  WHERE user_id = v_bot_id;

  -- 3. Insert character details into ai_characters
  INSERT INTO public.ai_characters (
    user_id,
    creator_id,
    greeting,
    short_description,
    long_description,
    personality,
    scenario,
    example_dialogues,
    conversation_style,
    knowledge,
    tags,
    category,
    visibility
  ) VALUES (
    v_bot_id,
    v_creator_id,
    p_greeting,
    p_short_description,
    p_long_description,
    p_personality,
    p_scenario,
    p_example_dialogues,
    p_conversation_style,
    p_knowledge,
    p_tags,
    p_category,
    p_visibility
  );

  RETURN v_bot_id;
END;
$$ LANGUAGE plpgsql;
