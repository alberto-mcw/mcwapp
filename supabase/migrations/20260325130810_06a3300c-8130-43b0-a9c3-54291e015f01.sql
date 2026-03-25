
-- Make challenge-videos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'challenge-videos';

-- Drop existing policies to avoid conflicts, then recreate
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own challenge videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own challenge videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own challenge videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all challenge videos" ON storage.objects;
DROP POLICY IF EXISTS "Recipe images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Chef event files are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload chef event files" ON storage.objects;

-- Avatars (public reads, owner uploads)
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Challenge-videos (private bucket - owner + admin access)
CREATE POLICY "Users can upload own challenge videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'challenge-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own challenge videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'challenge-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own challenge videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'challenge-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can read all challenge videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'challenge-videos' AND has_role(auth.uid(), 'admin'::app_role));

-- Recipe-images (public)
CREATE POLICY "Recipe images are publicly readable"
ON storage.objects FOR SELECT USING (bucket_id = 'recipe-images');

CREATE POLICY "Anyone can upload recipe images"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'recipe-images');

-- Chef-events (public reads, admin uploads)
CREATE POLICY "Chef event files are publicly readable"
ON storage.objects FOR SELECT USING (bucket_id = 'chef-events');

CREATE POLICY "Admins can upload chef event files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chef-events' AND has_role(auth.uid(), 'admin'::app_role));
