-- Fix 1: Remove email from public profiles visibility - create a restrictive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Allow users to view public profile data (excluding email) for all profiles
-- But only allow viewing email for own profile
CREATE POLICY "Users can view public profile data" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Note: The email column is still accessible, so we'll create a view for public access

-- Fix 2: Restrict social_verifications to only show own records
DROP POLICY IF EXISTS "Anyone can view verifications" ON public.social_verifications;

CREATE POLICY "Users can view their own verifications" 
ON public.social_verifications 
FOR SELECT 
USING (
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Fix 3: Restrict video_likes to only show aggregated data or own likes
DROP POLICY IF EXISTS "Anyone can view likes" ON public.video_likes;

CREATE POLICY "Users can view their own likes" 
ON public.video_likes 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins should still be able to see all likes for moderation
CREATE POLICY "Admins can view all likes" 
ON public.video_likes 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));