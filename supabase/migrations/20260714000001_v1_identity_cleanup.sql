-- Migration: 20260714000001_v1_identity_cleanup.sql
-- Description: Drop mood columns and indices, redefine feed and discovery functions to remove mood dependencies.

-- Drop functions first to allow changing their return types
DROP FUNCTION IF EXISTS public.get_personalized_feed(uuid, integer, text);
DROP FUNCTION IF EXISTS public.get_new_voices(integer);
DROP FUNCTION IF EXISTS public.get_recently_active_profiles(integer);

-- 1. Redefine get_personalized_feed without mood parameters or checks
CREATE OR REPLACE FUNCTION get_personalized_feed(
  p_user_id uuid,
  p_limit integer DEFAULT 50,
  p_mood_filter text DEFAULT NULL
) RETURNS TABLE (
  whisper_id uuid,
  relevance_score numeric,
  feed_source text
) AS $$
DECLARE
  v_top_interests text[];
  v_followed_ids uuid[];
  v_community_ids uuid[];
BEGIN
  -- Get user's top interests (with recency decay)
  SELECT array_agg(interest ORDER BY adjusted_score DESC)
  INTO v_top_interests
  FROM (
    SELECT interest,
      score * GREATEST(0.5, 1.0 - EXTRACT(EPOCH FROM (now() - last_interaction_at)) / (7 * 86400)) as adjusted_score
    FROM user_interest_scores
    WHERE user_id = p_user_id
    ORDER BY score * GREATEST(0.5, 1.0 - EXTRACT(EPOCH FROM (now() - last_interaction_at)) / (7 * 86400)) DESC
    LIMIT 15
  ) top;

  -- Get followed user IDs
  SELECT array_agg(following_id)
  INTO v_followed_ids
  FROM follows
  WHERE follower_id = p_user_id;

  -- Get joined community IDs
  SELECT array_agg(community_id)
  INTO v_community_ids
  FROM community_members
  WHERE user_id = p_user_id;

  RETURN QUERY
  SELECT sub.id, sub.relevance_score, sub.feed_source
  FROM (
    -- Interest-matched community/content (40% of feed)
    SELECT w.id, 4.0::numeric as relevance_score, 'interest'::text as feed_source
    FROM whispers w
    WHERE w.parent_id IS NULL
      AND w.user_id != p_user_id
      AND EXISTS (
        SELECT 1 FROM communities c
        WHERE c.id = w.community_id
        AND c.interest = ANY(COALESCE(v_top_interests, ARRAY[]::text[]))
      )
      AND w.created_at > now() - interval '30 days'

    UNION ALL

    -- Followed users content (25% of feed)
    SELECT w.id, 3.0::numeric as relevance_score, 'following'::text as feed_source
    FROM whispers w
    WHERE w.parent_id IS NULL
      AND v_followed_ids IS NOT NULL
      AND w.user_id = ANY(v_followed_ids)
      AND w.created_at > now() - interval '30 days'

    UNION ALL

    -- Community content (20% of feed)
    SELECT w.id, 2.5::numeric as relevance_score, 'community'::text as feed_source
    FROM whispers w
    WHERE w.parent_id IS NULL
      AND v_community_ids IS NOT NULL
      AND w.community_id = ANY(v_community_ids)
      AND w.user_id != p_user_id
      AND w.created_at > now() - interval '30 days'

    UNION ALL

    -- Discovery content (15% - from outside user's bubble)
    SELECT w.id, 1.0::numeric as relevance_score, 'discovery'::text as feed_source
    FROM whispers w
    WHERE w.parent_id IS NULL
      AND w.user_id != p_user_id
      AND (v_followed_ids IS NULL OR w.user_id != ALL(v_followed_ids))
      AND w.created_at > now() - interval '30 days'
  ) sub
  ORDER BY sub.relevance_score DESC, sub.id
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Redefine get_new_voices without mood
CREATE OR REPLACE FUNCTION get_new_voices(p_limit integer DEFAULT 10)
RETURNS TABLE (
  profile_id uuid,
  user_id uuid,
  display_name text,
  username text,
  avatar_emoji text,
  photo_url text,
  bio text,
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
    p.badges::text[],
    p.created_at
  FROM public.profiles p
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Redefine get_recently_active_profiles without mood
CREATE OR REPLACE FUNCTION get_recently_active_profiles(p_limit integer DEFAULT 10)
RETURNS TABLE (
  profile_id uuid,
  user_id uuid,
  display_name text,
  username text,
  avatar_emoji text,
  photo_url text,
  bio text,
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
    p.badges::text[],
    w.created_at as last_post_at
  FROM public.profiles p
  INNER JOIN public.whispers w ON w.user_id = p.user_id
  WHERE w.parent_id IS NULL
  ORDER BY p.user_id, w.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Drop mood columns and indices
DROP INDEX IF EXISTS public.idx_whispers_mood;

ALTER TABLE public.whispers
DROP COLUMN IF EXISTS mood;

ALTER TABLE public.profiles
DROP COLUMN IF EXISTS mood;
