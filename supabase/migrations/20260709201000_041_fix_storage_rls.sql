/*
# Fix storage policy for profile photos

1. Changes
- Drops old storage policies that used array indexing which can cause RLS errors
- Replaces with a more robust policy using LIKE operator
*/

-- Drop the old problematic policies
DROP POLICY IF EXISTS "profile_photos_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_owner_delete" ON storage.objects;

-- Allow authenticated users to upload their own profile photo
CREATE POLICY "profile_photos_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND name LIKE auth.uid()::text || '/%'
  );

-- Allow authenticated users to update their own profile photo
CREATE POLICY "profile_photos_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND name LIKE auth.uid()::text || '/%'
  )
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND name LIKE auth.uid()::text || '/%'
  );

-- Allow authenticated users to delete their own profile photo
CREATE POLICY "profile_photos_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND name LIKE auth.uid()::text || '/%'
  );
