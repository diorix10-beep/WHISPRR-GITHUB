-- Add new columns to communities for richer community features
ALTER TABLE communities ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS rules text[] DEFAULT '{}';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'General';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now();
ALTER TABLE communities ADD COLUMN IF NOT EXISTS post_count integer NOT NULL DEFAULT 0;

-- Index for featured/trending queries
CREATE INDEX IF NOT EXISTS idx_communities_featured ON communities(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_communities_last_activity ON communities(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_communities_category ON communities(category);

-- Create storage bucket for community banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-banners', 'community-banners', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "community_banners_upload" ON storage.objects;
CREATE POLICY "community_banners_upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-banners');

DROP POLICY IF EXISTS "community_banners_read" ON storage.objects;
CREATE POLICY "community_banners_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'community-banners');

DROP POLICY IF EXISTS "community_banners_delete" ON storage.objects;
CREATE POLICY "community_banners_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'community-banners');

-- Function: get recommended communities based on user interests
CREATE OR REPLACE FUNCTION get_recommended_communities(
  p_user_id uuid,
  p_limit integer DEFAULT 10
) RETURNS TABLE (
  community_id uuid,
  match_score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id as community_id,
    COALESCE(
      (SELECT SUM(uis.score)
       FROM user_interest_scores uis
       WHERE uis.user_id = p_user_id
         AND LOWER(uis.interest) = LOWER(c.interest)
      ), 0
    ) +
    CASE WHEN c.is_featured THEN 5.0 ELSE 0 END +
    COALESCE(c.post_count, 0) * 0.1 +
    (SELECT COUNT(*)::numeric FROM community_members cm
     WHERE cm.community_id = c.id
       AND cm.user_id IN (SELECT following_id FROM follows WHERE follower_id = p_user_id)
    ) * 3.0
    as match_score
  FROM communities c
  WHERE NOT EXISTS (
    SELECT 1 FROM community_members cm2
    WHERE cm2.community_id = c.id AND cm2.user_id = p_user_id
  )
  ORDER BY match_score DESC, c.last_activity_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
