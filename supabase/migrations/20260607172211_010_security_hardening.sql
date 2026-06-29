-- ============================================================
-- Security Hardening Migration
-- ============================================================

-- 1. Fix search_path on all SECURITY DEFINER functions
ALTER FUNCTION public.upsert_interest_score(uuid, text, text, numeric) SET search_path = '';
ALTER FUNCTION public.get_recommended_communities(uuid, integer) SET search_path = '';
ALTER FUNCTION public.get_personalized_feed(uuid, integer, text) SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- 2. Revoke EXECUTE from anon and public on all SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.upsert_interest_score(uuid, text, text, numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_recommended_communities(uuid, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_personalized_feed(uuid, integer, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;

-- handle_new_user is trigger-only; also revoke from authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- 3. Fix RLS Policy: conversations INSERT - require created_by = auth.uid()
DROP POLICY IF EXISTS "insert_conversations" ON conversations;
CREATE POLICY "insert_conversations" ON conversations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- 4. Fix RLS Policy: notifications INSERT - require actor_id = auth.uid()
DROP POLICY IF EXISTS "insert_notifications" ON notifications;
CREATE POLICY "insert_notifications" ON notifications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = actor_id);

-- 5. Fix storage bucket listing policies - restrict SELECT to owner only
-- (Public bucket URLs are accessible without policies; SELECT only controls listing)

-- profile-photos: drop broad public SELECT, replace with owner-only
DROP POLICY IF EXISTS "profile_photos_public_select" ON storage.objects;
CREATE POLICY "profile_photos_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- message-attachments: restrict to owner-only listing
DROP POLICY IF EXISTS "message_attachments_read" ON storage.objects;
CREATE POLICY "message_attachments_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'message-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- community-banners: restrict to community owners/admins listing
DROP POLICY IF EXISTS "community_banners_read" ON storage.objects;
CREATE POLICY "community_banners_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'community-banners' AND (storage.foldername(name))[1] = auth.uid()::text);
