-- Migration: 032_v5_nexa_overhaul.sql
-- Description: Alters ai_characters to support avatars, banners, ratings, and creator notes, and updates the create_ai_character RPC helper.

-- 1. Add new columns to public.ai_characters
ALTER TABLE public.ai_characters 
  ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS content_rating text DEFAULT 'SFW' CHECK (content_rating IN ('SFW', 'Mature', 'NSFW')),
  ADD COLUMN IF NOT EXISTS creator_notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS example_conversations text DEFAULT '';

-- 2. Drop the old create_ai_character function
DROP FUNCTION IF EXISTS public.create_ai_character(text, text, text, text, text, text, text, text, text, text, text, text[], text, text);

-- 3. Create updated create_ai_character function supporting optional username and custom avatar_url / content_rating
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
  p_visibility text,
  p_avatar_url text DEFAULT '',
  p_banner_url text DEFAULT '',
  p_content_rating text DEFAULT 'SFW',
  p_creator_notes text DEFAULT '',
  p_example_conversations text DEFAULT ''
) RETURNS uuid SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_bot_id uuid := gen_random_uuid();
  v_creator_id uuid := auth.uid();
  v_clean_name text := lower(regexp_replace(p_name, '[^a-zA-Z0-9]', '', 'g'));
  v_username text;
BEGIN
  -- Check authentication
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Generate username if none provided
  IF p_username IS NULL OR p_username = '' THEN
    v_username := 'bot_' || v_clean_name || '_' || substring(gen_random_uuid()::text from 1 for 6);
  ELSE
    v_username := lower(p_username);
  END IF;

  -- Ensure username uniqueness
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
    v_username := v_username || '_' || substring(gen_random_uuid()::text from 1 for 4);
  END IF;

  -- 1. Insert virtual user into auth.users
  INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, aud, role, email_confirmed_at)
  VALUES (
    v_bot_id,
    'bot-' || v_username || '-' || v_bot_id || '@whisprr.ai',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', p_name),
    'authenticated',
    'authenticated',
    now()
  );

  -- 2. Update the auto-created profile with AI Character details
  UPDATE public.profiles
  SET 
    display_name = p_name,
    username = v_username,
    role = 'ai_character',
    avatar_emoji = COALESCE(p_avatar_emoji, '🤖'),
    photo_url = CASE WHEN p_avatar_url <> '' THEN p_avatar_url ELSE NULL END,
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
    visibility,
    avatar_url,
    banner_url,
    content_rating,
    creator_notes,
    example_conversations
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
    p_visibility,
    p_avatar_url,
    p_banner_url,
    p_content_rating,
    p_creator_notes,
    p_example_conversations
  );

  RETURN v_bot_id;
END;
$$ LANGUAGE plpgsql;
