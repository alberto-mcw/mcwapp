
-- Table for presentation videos (one per user, admin-approved, awards 100 energy)
CREATE TABLE public.presentation_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  video_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  energy_awarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

-- Enable RLS
ALTER TABLE public.presentation_videos ENABLE ROW LEVEL SECURITY;

-- Users can view their own video
CREATE POLICY "Users can view own presentation video"
  ON public.presentation_videos FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own video (once, enforced by UNIQUE)
CREATE POLICY "Users can upload own presentation video"
  ON public.presentation_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can manage presentation videos"
  ON public.presentation_videos FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to award 100 energy on approval
CREATE OR REPLACE FUNCTION public.award_presentation_video_energy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') AND NOT NEW.energy_awarded THEN
    UPDATE public.profiles
    SET total_energy = total_energy + 100, updated_at = now()
    WHERE user_id = NEW.user_id;
    
    NEW.energy_awarded := true;
  END IF;
  
  -- Revoke energy if un-approving
  IF OLD.status = 'approved' AND NEW.status != 'approved' AND OLD.energy_awarded THEN
    UPDATE public.profiles
    SET total_energy = total_energy - 100, updated_at = now()
    WHERE user_id = NEW.user_id;
    
    NEW.energy_awarded := false;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_presentation_video_status_change
  BEFORE UPDATE ON public.presentation_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.award_presentation_video_energy();
