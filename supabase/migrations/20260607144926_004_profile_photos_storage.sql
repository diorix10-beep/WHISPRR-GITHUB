/*
# Add storage policy for profile photos

1. Changes
- Creates a storage bucket called 'profile-photos' for user profile picture uploads
- Adds storage policies for authenticated users to upload, read, and delete their own photos
- Photos are stored under path: {user_id}/{timestamp}.{ext}

2. Security
- Anyone can read profile photos (needed for display in feed, discover, etc.)
- Only the owner can upload/update/delete their own photos
- File size and type validation happens client-side
*/

-- Insert the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read profile photos (public bucket, but explicit policy)
CREATE POLICY "profile_photos_public_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'profile-photos');

-- Allow authenticated users to upload their own profile photo
CREATE POLICY "profile_photos_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own profile photo
CREATE POLICY "profile_photos_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own profile photo
CREATE POLICY "profile_photos_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
