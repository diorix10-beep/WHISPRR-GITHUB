-- CHIMERA Character Soul Contract
-- Keeps creator-authored character identity structured, durable, and available
-- to the runtime without relying on browser-only form state.

ALTER TABLE public.ai_characters
  ADD COLUMN IF NOT EXISTS chat_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS alternate_greetings text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS banned_words text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS suggested_persona_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS voice_id text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS architecture_data jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.save_ai_character_soul(
  p_character_id uuid DEFAULT NULL,
  p_name text DEFAULT '',
  p_chat_name text DEFAULT '',
  p_greeting text DEFAULT '',
  p_short_description text DEFAULT '',
  p_long_description text DEFAULT '',
  p_personality text DEFAULT '',
  p_scenario text DEFAULT '',
  p_example_dialogues text DEFAULT '',
  p_conversation_style text DEFAULT '',
  p_knowledge text DEFAULT '',
  p_tags text[] DEFAULT '{}',
  p_category text DEFAULT 'General',
  p_visibility text DEFAULT 'private',
  p_avatar_url text DEFAULT '',
  p_banner_url text DEFAULT '',
  p_content_rating text DEFAULT 'SFW',
  p_creator_notes text DEFAULT '',
  p_example_conversations text DEFAULT '',
  p_rp_definition text DEFAULT '',
  p_system_definition text DEFAULT '',
  p_system_character_definition text DEFAULT '',
  p_alternate_greetings text[] DEFAULT '{}',
  p_banned_words text DEFAULT '',
  p_suggested_persona_name text DEFAULT '',
  p_voice_id text DEFAULT '',
  p_architecture_data jsonb DEFAULT '{}'::jsonb,
  p_status text DEFAULT 'published'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_creator_id uuid := auth.uid();
  v_bot_user_id uuid;
  v_character_id uuid;
  v_username text;
  v_clean_name text := coalesce(nullif(btrim(p_name), ''), 'Untitled Character');
BEGIN
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_visibility NOT IN ('public', 'private', 'unlisted') THEN
    RAISE EXCEPTION 'Invalid character visibility';
  END IF;

  IF p_content_rating NOT IN ('SFW', 'Mature', 'NSFW') THEN
    RAISE EXCEPTION 'Invalid content rating';
  END IF;

  IF p_status NOT IN ('draft', 'published', 'archived') THEN
    RAISE EXCEPTION 'Invalid character status';
  END IF;

  IF p_character_id IS NOT NULL THEN
    SELECT id, user_id
      INTO v_character_id, v_bot_user_id
      FROM public.ai_characters
      WHERE id = p_character_id
        AND creator_id = v_creator_id;

    IF v_character_id IS NULL THEN
      RAISE EXCEPTION 'Character not found or not owned by this creator';
    END IF;

    UPDATE public.profiles
      SET display_name = v_clean_name,
          photo_url = nullif(btrim(p_avatar_url), ''),
          bio = coalesce(p_short_description, ''),
          updated_at = now()
      WHERE user_id = v_bot_user_id;
  ELSE
    v_bot_user_id := gen_random_uuid();
    v_username := 'bot_' || lower(regexp_replace(v_clean_name, '[^a-zA-Z0-9]', '', 'g')) || '_' || substring(gen_random_uuid()::text from 1 for 6);

    INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, aud, role, email_confirmed_at)
    VALUES (
      v_bot_user_id,
      'bot-' || v_username || '-' || v_bot_user_id || '@chimera.invalid',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('display_name', v_clean_name),
      'authenticated',
      'authenticated',
      now()
    );

    UPDATE public.profiles
      SET display_name = v_clean_name,
          username = v_username,
          role = 'ai_character',
          photo_url = nullif(btrim(p_avatar_url), ''),
          bio = coalesce(p_short_description, ''),
          onboarding_complete = true,
          updated_at = now()
      WHERE user_id = v_bot_user_id;
  END IF;

  INSERT INTO public.ai_characters (
    id, user_id, creator_id, greeting, short_description, long_description,
    personality, scenario, example_dialogues, conversation_style, knowledge,
    tags, category, visibility, avatar_url, banner_url, content_rating,
    creator_notes, example_conversations, rp_definition, system_definition,
    system_character_definition, chat_name, alternate_greetings, banned_words,
    suggested_persona_name, voice_id, architecture_data, status, updated_at
  ) VALUES (
    coalesce(v_character_id, gen_random_uuid()), v_bot_user_id, v_creator_id,
    coalesce(p_greeting, ''), coalesce(p_short_description, ''), coalesce(p_long_description, ''),
    coalesce(p_personality, ''), coalesce(p_scenario, ''), coalesce(p_example_dialogues, ''),
    coalesce(p_conversation_style, ''), coalesce(p_knowledge, ''), coalesce(p_tags, '{}'),
    coalesce(p_category, 'General'), p_visibility, coalesce(p_avatar_url, ''), coalesce(p_banner_url, ''),
    p_content_rating, coalesce(p_creator_notes, ''), coalesce(p_example_conversations, ''),
    coalesce(p_rp_definition, ''), coalesce(p_system_definition, ''),
    coalesce(p_system_character_definition, ''), coalesce(p_chat_name, ''),
    coalesce(p_alternate_greetings, '{}'), coalesce(p_banned_words, ''),
    coalesce(p_suggested_persona_name, ''), coalesce(p_voice_id, ''),
    coalesce(p_architecture_data, '{}'::jsonb), p_status, now()
  )
  ON CONFLICT (id) DO UPDATE SET
    greeting = EXCLUDED.greeting,
    short_description = EXCLUDED.short_description,
    long_description = EXCLUDED.long_description,
    personality = EXCLUDED.personality,
    scenario = EXCLUDED.scenario,
    example_dialogues = EXCLUDED.example_dialogues,
    conversation_style = EXCLUDED.conversation_style,
    knowledge = EXCLUDED.knowledge,
    tags = EXCLUDED.tags,
    category = EXCLUDED.category,
    visibility = EXCLUDED.visibility,
    avatar_url = EXCLUDED.avatar_url,
    banner_url = EXCLUDED.banner_url,
    content_rating = EXCLUDED.content_rating,
    creator_notes = EXCLUDED.creator_notes,
    example_conversations = EXCLUDED.example_conversations,
    rp_definition = EXCLUDED.rp_definition,
    system_definition = EXCLUDED.system_definition,
    system_character_definition = EXCLUDED.system_character_definition,
    chat_name = EXCLUDED.chat_name,
    alternate_greetings = EXCLUDED.alternate_greetings,
    banned_words = EXCLUDED.banned_words,
    suggested_persona_name = EXCLUDED.suggested_persona_name,
    voice_id = EXCLUDED.voice_id,
    architecture_data = EXCLUDED.architecture_data,
    status = EXCLUDED.status,
    updated_at = now()
  RETURNING id INTO v_character_id;

  RETURN v_character_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_ai_character_soul(uuid, text, text, text, text, text, text, text, text, text, text, text[], text, text, text, text, text, text, text, text, text, text, text[], text, text, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_ai_character_soul(uuid, text, text, text, text, text, text, text, text, text, text, text[], text, text, text, text, text, text, text, text, text, text, text[], text, text, text, jsonb, text) TO authenticated;
