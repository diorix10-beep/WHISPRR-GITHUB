/*
# Update community update policy to use community_members

1. Changes
- Replace the communities UPDATE policy from owner-only to owner/admin via community_members
- This allows community admins to also update community settings
*/

DROP POLICY IF EXISTS "update_community_owner" ON communities;
CREATE POLICY "update_community_owner" ON communities FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM community_members WHERE community_id = communities.id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);
