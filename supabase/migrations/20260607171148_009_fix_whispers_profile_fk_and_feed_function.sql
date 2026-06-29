-- Add a foreign key from whispers.user_id to profiles.user_id
-- so PostgREST can resolve the profiles:user_id(...) join syntax
ALTER TABLE whispers
  ADD CONSTRAINT whispers_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Also add FK for comments.user_id -> profiles.user_id
ALTER TABLE comments
  ADD CONSTRAINT comments_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Fix get_personalized_feed: wrap UNION in a subquery to avoid ORDER BY issues
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

  -- Return mixed feed wrapped in subquery for valid ORDER BY
  RETURN QUERY
  SELECT sub.id, sub.relevance_score, sub.feed_source
  FROM (
    -- Interest-matched content (40% of feed)
    SELECT w.id, 4.0::numeric as relevance_score, 'interest'::text as feed_source
    FROM whispers w
    WHERE w.parent_id IS NULL
      AND w.user_id != p_user_id
      AND (p_mood_filter IS NULL OR w.mood = p_mood_filter)
      AND (
        w.mood = ANY(COALESCE(v_top_interests, ARRAY[]::text[]))
        OR EXISTS (
          SELECT 1 FROM communities c
          WHERE c.id = w.community_id
          AND c.interest = ANY(COALESCE(v_top_interests, ARRAY[]::text[]))
        )
      )
      AND w.created_at > now() - interval '30 days'

    UNION ALL

    -- Followed users content (25% of feed)
    SELECT w.id, 3.0::numeric as relevance_score, 'following'::text as feed_source
    FROM whispers w
    WHERE w.parent_id IS NULL
      AND v_followed_ids IS NOT NULL
      AND w.user_id = ANY(v_followed_ids)
      AND (p_mood_filter IS NULL OR w.mood = p_mood_filter)
      AND w.created_at > now() - interval '30 days'

    UNION ALL

    -- Community content (20% of feed)
    SELECT w.id, 2.5::numeric as relevance_score, 'community'::text as feed_source
    FROM whispers w
    WHERE w.parent_id IS NULL
      AND v_community_ids IS NOT NULL
      AND w.community_id = ANY(v_community_ids)
      AND w.user_id != p_user_id
      AND (p_mood_filter IS NULL OR w.mood = p_mood_filter)
      AND w.created_at > now() - interval '30 days'

    UNION ALL

    -- Discovery content (15% - from outside user's bubble)
    SELECT w.id, 1.0::numeric as relevance_score, 'discovery'::text as feed_source
    FROM whispers w
    WHERE w.parent_id IS NULL
      AND w.user_id != p_user_id
      AND (v_followed_ids IS NULL OR w.user_id != ALL(v_followed_ids))
      AND (p_mood_filter IS NULL OR w.mood = p_mood_filter)
      AND NOT (
        w.mood = ANY(COALESCE(v_top_interests, ARRAY[]::text[]))
      )
      AND w.created_at > now() - interval '30 days'
  ) sub
  ORDER BY sub.relevance_score DESC, sub.id
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
