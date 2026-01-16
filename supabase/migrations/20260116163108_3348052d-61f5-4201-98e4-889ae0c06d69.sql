-- Drop existing policy
DROP POLICY IF EXISTS "Anyone can view approved trivias" ON public.daily_trivias;

-- Create new policy based only on date (status no longer required)
CREATE POLICY "Anyone can view scheduled trivias"
ON public.daily_trivias
FOR SELECT
USING (scheduled_date <= CURRENT_DATE);

-- Update the view to not filter by status
DROP VIEW IF EXISTS public.daily_trivias_public;

CREATE VIEW public.daily_trivias_public AS
SELECT 
  id,
  scheduled_date,
  trivia_type,
  title,
  question,
  options,
  explanation,
  fun_fact,
  difficulty,
  energy_reward,
  status,
  created_at
FROM public.daily_trivias
WHERE scheduled_date <= CURRENT_DATE;