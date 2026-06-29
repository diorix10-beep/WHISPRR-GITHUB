-- Migration: 016_v4_recommendation_control.sql
-- Description: Adds user preference columns for recommendations and creates advanced discovery helper functions.

-- 1. Add muted_interests and muted_communities to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS muted_interests text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS muted_communities uuid[] DEFAULT '{}'::uuid[];

-- 2. Function to reset user interest scores
CREATE OR REPLACE FUNCTION reset_user_interests(p_user_id uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_interest_scores
  WHERE user_id = p_user_id;
  
  DELETE FROM public.user_interactions
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to get trending discussions based on conversation quality and engagement
CREATE OR REPLACE FUNCTION get_trending_discussions(p_limit integer DEFAULT 10)
RETURNS TABLE (
  whisper_id uuid,
  comment_count bigint,
  reaction_count bigint,
  score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id as whisper_id,
    COALESCE(c_count.cnt, 0) as comment_count,
    COALESCE(r_count.cnt, 0) as reaction_count,
    -- Rank based on combination of comments (weighted higher for conversation) and reactions, decayed by age
    (COALESCE(c_count.cnt, 0) * 3.0 + COALESCE(r_count.cnt, 0) * 1.0) / 
      POWER(EXTRACT(EPOCH FROM (now() - w.created_at))/3600 + 2, 1.5)::numeric as score
  FROM public.whispers w
  LEFT JOIN (
    SELECT whisper_id, count(*) as cnt 
    FROM public.comments 
    GROUP BY whisper_id
  ) c_count ON c_count.whisper_id = w.id
  LEFT JOIN (
    SELECT whisper_id, count(*) as cnt 
    FROM public.reactions 
    GROUP BY whisper_id
  ) r_count ON r_count.whisper_id = w.id
  WHERE w.parent_id IS NULL
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to get new voices (newly registered creators)
CREATE OR REPLACE FUNCTION get_new_voices(p_limit integer DEFAULT 10)
RETURNS TABLE (
  profile_id uuid,
  user_id uuid,
  display_name text,
  username text,
  avatar_emoji text,
  photo_url text,
  bio text,
  mood text,
  badges text[],
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as profile_id,
    p.user_id,
    p.display_name,
    p.username,
    p.avatar_emoji,
    p.photo_url,
    p.bio,
    p.mood,
    p.badges::text[],
    p.created_at
  FROM public.profiles p
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to get recently active users based on their posting activity
CREATE OR REPLACE FUNCTION get_recently_active_profiles(p_limit integer DEFAULT 10)
RETURNS TABLE (
  profile_id uuid,
  user_id uuid,
  display_name text,
  username text,
  avatar_emoji text,
  photo_url text,
  bio text,
  mood text,
  badges text[],
  last_post_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (p.user_id)
    p.id as profile_id,
    p.user_id,
    p.display_name,
    p.username,
    p.avatar_emoji,
    p.photo_url,
    p.bio,
    p.mood,
    p.badges::text[],
    w.created_at as last_post_at
  FROM public.profiles p
  INNER JOIN public.whispers w ON w.user_id = p.user_id
  WHERE w.parent_id IS NULL
  ORDER BY p.user_id, w.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
