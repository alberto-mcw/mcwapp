-- Add columns for reel metrics tracking
ALTER TABLE public.challenge_submissions 
ADD COLUMN IF NOT EXISTS reel_url TEXT,
ADD COLUMN IF NOT EXISTS metrics_screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_from_metrics INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metrics_energy_earned INTEGER DEFAULT 0;

-- Add comment explaining the energy calculation
COMMENT ON COLUMN public.challenge_submissions.metrics_energy_earned IS 'Energy from metrics: 10 per 1000 views + 1 per like';