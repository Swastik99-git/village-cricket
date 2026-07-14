/*
# Storage Bucket for Profile Photos

## Overview
Creates a public storage bucket `profile-photos` for player profile pictures.

## Notes
1. Bucket is public so photos can be read without authentication.
2. Storage policies allow authenticated users to upload to their own folder.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read
DROP POLICY IF EXISTS "Public read profile photos" ON storage.objects;
CREATE POLICY "Public read profile photos" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'profile-photos');

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "Authenticated upload profile photos" ON storage.objects;
CREATE POLICY "Authenticated upload profile photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-photos');

-- Allow users to update/delete their own files
DROP POLICY IF EXISTS "Users update own profile photos" ON storage.objects;
CREATE POLICY "Users update own profile photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Users delete own profile photos" ON storage.objects;
CREATE POLICY "Users delete own profile photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'profile-photos');
