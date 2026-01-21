
-- Remove FK constraint on challenge_completions to allow mock users
ALTER TABLE public.challenge_completions 
DROP CONSTRAINT IF EXISTS challenge_completions_user_id_fkey;
