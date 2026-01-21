-- Create super_likes table for admin-only special likes (max 1 per video)
CREATE TABLE public.super_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.challenge_submissions(id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL,
  energy_awarded integer NOT NULL DEFAULT 50,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (submission_id) -- Only one superlike per video
);

-- Enable RLS
ALTER TABLE public.super_likes ENABLE ROW LEVEL SECURITY;

-- Admins can manage super_likes
CREATE POLICY "Admins can manage super_likes"
ON public.super_likes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view super_likes (to show the badge on videos)
CREATE POLICY "Anyone can view super_likes"
ON public.super_likes
FOR SELECT
USING (true);

-- Function to award energy when superlike is given
CREATE OR REPLACE FUNCTION public.award_superlike_energy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  video_owner_id uuid;
BEGIN
  -- Get the owner of the video
  SELECT user_id INTO video_owner_id
  FROM public.challenge_submissions
  WHERE id = NEW.submission_id;
  
  -- Award 50 energy points to video owner
  IF video_owner_id IS NOT NULL THEN
    UPDATE public.profiles
    SET total_energy = total_energy + NEW.energy_awarded,
        updated_at = now()
    WHERE user_id = video_owner_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to subtract energy when superlike is revoked
CREATE OR REPLACE FUNCTION public.revoke_superlike_energy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  video_owner_id uuid;
BEGIN
  -- Get the owner of the video
  SELECT user_id INTO video_owner_id
  FROM public.challenge_submissions
  WHERE id = OLD.submission_id;
  
  -- Subtract the energy points from video owner
  IF video_owner_id IS NOT NULL THEN
    UPDATE public.profiles
    SET total_energy = total_energy - OLD.energy_awarded,
        updated_at = now()
    WHERE user_id = video_owner_id;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create triggers
CREATE TRIGGER on_superlike_insert
AFTER INSERT ON public.super_likes
FOR EACH ROW
EXECUTE FUNCTION public.award_superlike_energy();

CREATE TRIGGER on_superlike_delete
AFTER DELETE ON public.super_likes
FOR EACH ROW
EXECUTE FUNCTION public.revoke_superlike_energy();