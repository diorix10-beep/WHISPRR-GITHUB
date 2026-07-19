-- Migration: 20260716000100_v1_fix_feed_rpc.sql
-- Description: Drop all overloaded versions of get_personalized_feed and define a single clean one.

-- Drop existing functions to resolve overloading conflict
DROP FUNCTION IF EXISTS public.get_personalized_feed(uuid, integer);
DROP FUNCTION IF EXISTS public.get_personalized_feed(uuid, integer, text);

-- Recreate clean get_personalized_feed function
CREATE OR REPLACE FUNCTION public.get_personalized_feed(
  p_user_id uuid,
  p_limit integer DEFAULT 50
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
    FROM public.user_interest_scores
    WHERE user_id = p_user_id
    ORDER BY score * GREATEST(0.5, 1.0 - EXTRACT(EPOCH FROM (now() - last_interaction_at)) / (7 * 86400)) DESC
    LIMIT 15
  ) top;

  -- Get followed user IDs
  SELECT array_agg(following_id)
  INTO v_followed_ids
  FROM public.follows
  WHERE follower_id = p_user_id;

  -- Get joined community IDs
  SELECT array_agg(community_id)
  INTO v_community_ids
  FROM public.community_members
  WHERE user_id = p_user_id;

  RETURN QUERY
  SELECT sub.id as whisper_id, sub.relevance_score, sub.feed_source
  FROM (
    -- Interest-matched community/content (40% of feed)
    SELECT w.id, 4.0::numeric as relevance_score, 'interest'::text as feed_source
    FROM public.whispers w
    WHERE w.parent_id IS NULL
      AND w.user_id != p_user_id
      AND EXISTS (
        SELECT 1 FROM public.communities c
        WHERE c.id = w.community_id
        AND c.interest = ANY(COALESCE(v_top_interests, ARRAY[]::text[]))
      )
      AND w.created_at > now() - interval '30 days'

    UNION ALL

    -- Followed users content (25% of feed)
    SELECT w.id, 3.0::numeric as relevance_score, 'following'::text as feed_source
    FROM public.whispers w
    WHERE w.parent_id IS NULL
      AND v_followed_ids IS NOT NULL
      AND w.user_id = ANY(v_followed_ids)
      AND w.created_at > now() - interval '30 days'

    UNION ALL

    -- Community content (20% of feed)
    SELECT w.id, 2.5::numeric as relevance_score, 'community'::text as feed_source
    FROM public.whispers w
    WHERE w.parent_id IS NULL
      AND v_community_ids IS NOT NULL
      AND w.community_id = ANY(v_community_ids)
      AND w.user_id != p_user_id
      AND w.created_at > now() - interval '30 days'

    UNION ALL

    -- Discovery content (15% - from outside user's bubble)
    SELECT w.id, 1.0::numeric as relevance_score, 'discovery'::text as feed_source
    FROM public.whispers w
    WHERE w.parent_id IS NULL
      AND w.user_id != p_user_id
      AND (v_followed_ids IS NULL OR w.user_id != ALL(v_followed_ids))
      AND w.created_at > now() - interval '30 days'
  ) sub
  ORDER BY sub.relevance_score DESC, sub.id
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
