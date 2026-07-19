-- Migration: 20260716000000_v1_community_avatars.sql
-- Description: Create a storage bucket for community avatars and configure security policies.

-- Create storage bucket for community avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-avatars',
  'community-avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for community-avatars
DROP POLICY IF EXISTS "community_avatars_public_select" ON storage.objects;
CREATE POLICY "community_avatars_public_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'community-avatars');

DROP POLICY IF EXISTS "community_avatars_owner_insert" ON storage.objects;
CREATE POLICY "community_avatars_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "community_avatars_owner_update" ON storage.objects;
CREATE POLICY "community_avatars_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'community-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'community-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "community_avatars_owner_delete" ON storage.objects;
CREATE POLICY "community_avatars_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
