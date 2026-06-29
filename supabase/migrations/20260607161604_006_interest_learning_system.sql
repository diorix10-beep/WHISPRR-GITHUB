-- User interactions: captures all behavioral signals
CREATE TABLE IF NOT EXISTS user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'search', 'profile_visit', 'community_visit', 'follow',
    'reaction', 'comment', 'post', 'view_content'
  )),
  target_type text NOT NULL CHECK (target_type IN (
    'whisper', 'profile', 'community', 'search_term'
  )),
  target_id text,
  interests text[] DEFAULT '{}',
  mood text,
  community_id uuid REFERENCES communities(id) ON DELETE SET NULL,
  duration_ms integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_own_interactions" ON user_interactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "select_own_interactions" ON user_interactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_interactions_created_at ON user_interactions(created_at DESC);
CREATE INDEX idx_interactions_user_event ON user_interactions(user_id, event_type);

-- User interest scores: computed and cached scores per interest/topic
CREATE TABLE IF NOT EXISTS user_interest_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest text NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  interaction_count integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'organic' CHECK (source IN ('organic', 'community', 'follow', 'search')),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_interaction_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, interest, source)
);

ALTER TABLE user_interest_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_scores" ON user_interest_scores FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "insert_own_scores" ON user_interest_scores FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_scores" ON user_interest_scores FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_interest_scores_user ON user_interest_scores(user_id);
CREATE INDEX idx_interest_scores_user_score ON user_interest_scores(user_id, score DESC);

-- Function to upsert interest scores with recency-weighted updates
CREATE OR REPLACE FUNCTION upsert_interest_score(
  p_user_id uuid,
  p_interest text,
  p_source text DEFAULT 'organic',
  p_weight numeric DEFAULT 1.0
) RETURNS void AS $$
BEGIN
  INSERT INTO user_interest_scores (user_id, interest, score, interaction_count, source, last_interaction_at)
  VALUES (p_user_id, p_interest, p_weight, 1, p_source, now())
  ON CONFLICT (user_id, interest, source)
  DO UPDATE SET
    score = LEAST(user_interest_scores.score * 0.95 + p_weight, 100),
    interaction_count = user_interest_scores.interaction_count + 1,
    last_interaction_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get personalized feed with diversity mixing
-- Returns whisper IDs ranked by relevance to user's interests
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

  -- Return mixed feed: interests (40%) + followed (25%) + communities (20%) + discovery (15%)
  RETURN QUERY

  -- Interest-matched content (40% of feed)
  (SELECT w.id, 4.0 as relevance_score, 'interest'::text as feed_source
   FROM whispers w
   WHERE w.parent_id IS NULL
     AND w.user_id != p_user_id
     AND (p_mood_filter IS NULL OR w.mood = p_mood_filter)
     AND (
       w.mood = ANY(v_top_interests)
       OR EXISTS (
         SELECT 1 FROM communities c
         WHERE c.id = w.community_id
         AND c.interest = ANY(v_top_interests)
       )
     )
   ORDER BY w.created_at DESC
   LIMIT GREATEST(1, (p_limit * 40 / 100)))

  UNION ALL

  -- Followed users content (25% of feed)
  (SELECT w.id, 3.0 as relevance_score, 'following'::text as feed_source
   FROM whispers w
   WHERE w.parent_id IS NULL
     AND w.user_id = ANY(v_followed_ids)
     AND (p_mood_filter IS NULL OR w.mood = p_mood_filter)
   ORDER BY w.created_at DESC
   LIMIT GREATEST(1, (p_limit * 25 / 100)))

  UNION ALL

  -- Community content (20% of feed)
  (SELECT w.id, 2.5 as relevance_score, 'community'::text as feed_source
   FROM whispers w
   WHERE w.parent_id IS NULL
     AND w.community_id = ANY(v_community_ids)
     AND w.user_id != p_user_id
     AND (p_mood_filter IS NULL OR w.mood = p_mood_filter)
   ORDER BY w.created_at DESC
   LIMIT GREATEST(1, (p_limit * 20 / 100)))

  UNION ALL

  -- Discovery content (15% - from outside user's bubble)
  (SELECT w.id, 1.0 as relevance_score, 'discovery'::text as feed_source
   FROM whispers w
   WHERE w.parent_id IS NULL
     AND w.user_id != p_user_id
     AND (v_followed_ids IS NULL OR w.user_id != ALL(v_followed_ids))
     AND (p_mood_filter IS NULL OR w.mood = p_mood_filter)
     AND NOT (
       w.mood = ANY(COALESCE(v_top_interests, ARRAY[]::text[]))
     )
   ORDER BY w.created_at DESC
   LIMIT GREATEST(1, (p_limit * 15 / 100)))

  ORDER BY relevance_score DESC, whisper_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
