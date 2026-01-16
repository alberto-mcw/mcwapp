-- Add transcription and recipe columns to challenge_submissions
ALTER TABLE public.challenge_submissions 
ADD COLUMN IF NOT EXISTS transcription TEXT,
ADD COLUMN IF NOT EXISTS recipe_data JSONB,
ADD COLUMN IF NOT EXISTS transcription_status TEXT DEFAULT 'pending';

-- Add comment explaining the recipe_data structure
COMMENT ON COLUMN public.challenge_submissions.recipe_data IS 'JSON structure: { ingredients: string[], steps: string[], utensils: string[] }';