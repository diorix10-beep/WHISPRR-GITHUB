-- Migration: 014_v4_profile_experience.sql
-- Description: Adds new fields for Profile Experience 2.0 (Expanded Vision) and configures the profile-banners storage bucket.

-- 1. Add new columns to public.profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banner_url text,
ADD COLUMN IF NOT EXISTS pronouns text,
ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS personality_badges text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS pinned_whisper_id uuid REFERENCES public.whispers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS featured_communities uuid[] DEFAULT '{}'::uuid[],
ADD COLUMN IF NOT EXISTS favorites jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS personal_values text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS looking_for text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS field_privacy jsonb DEFAULT '{}'::jsonb;

-- 2. Create the profile-banners storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-banners', 'profile-banners', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Setup RLS policies for the profile-banners bucket
-- Drop existing policies if any to avoid errors on retry
DROP POLICY IF EXISTS "Public profiles banners are viewable by everyone." ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile banner." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile banner." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile banner." ON storage.objects;

-- Allow public viewing of profile banners
CREATE POLICY "Public profiles banners are viewable by everyone."
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-banners');

-- Allow authenticated users to upload their own banner
CREATE POLICY "Users can upload their own profile banner."
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-banners' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own banner
CREATE POLICY "Users can update their own profile banner."
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile-banners' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own banner
CREATE POLICY "Users can delete their own profile banner."
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile-banners' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
