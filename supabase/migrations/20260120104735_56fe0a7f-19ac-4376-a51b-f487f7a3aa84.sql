-- Remove FK constraint from challenge_submissions to allow test data
ALTER TABLE public.challenge_submissions DROP CONSTRAINT IF EXISTS challenge_submissions_user_id_fkey;