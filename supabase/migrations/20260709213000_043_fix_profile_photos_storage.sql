-- Drop all existing profile photos policies to start fresh
DROP POLICY IF EXISTS "profile_photos_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_public_select" ON storage.objects;

-- 1. SELECT: Profile photos should be publicly viewable by everyone
CREATE POLICY "profile_photos_public_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-photos');

-- 2. INSERT: Users can upload their own photos
-- Using a combination of owner check and path check for maximum compatibility
CREATE POLICY "profile_photos_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (
      owner = auth.uid() 
      OR name LIKE auth.uid()::text || '/%'
    )
  );

-- 3. UPDATE: Users can update their own photos
CREATE POLICY "profile_photos_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (
      owner = auth.uid() 
      OR name LIKE auth.uid()::text || '/%'
    )
  )
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (
      owner = auth.uid() 
      OR name LIKE auth.uid()::text || '/%'
    )
  );

-- 4. DELETE: Users can delete their own photos
CREATE POLICY "profile_photos_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (
      owner = auth.uid() 
      OR name LIKE auth.uid()::text || '/%'
    )
  );
