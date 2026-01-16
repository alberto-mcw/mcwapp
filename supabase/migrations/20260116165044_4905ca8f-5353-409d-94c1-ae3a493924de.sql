-- Add dish_name column to challenge_submissions table
ALTER TABLE public.challenge_submissions 
ADD COLUMN dish_name text;