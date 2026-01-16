-- Fix 1: Protect correct_answer in daily_trivias - create a view
CREATE OR REPLACE VIEW public.daily_trivias_public
WITH (security_invoker = on) AS
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
  -- Excludes: correct_answer, approved_at, approved_by
FROM public.daily_trivias;

-- Grant access to the view
GRANT SELECT ON public.daily_trivias_public TO authenticated;
GRANT SELECT ON public.daily_trivias_public TO anon;

-- Fix 2: Restrict social_verifications INSERT to authenticated users only
DROP POLICY IF EXISTS "Anyone can insert their verification" ON public.social_verifications;

CREATE POLICY "Authenticated users can insert their own verification" 
ON public.social_verifications 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Fix 3: Add admin check to increment_user_energy function
CREATE OR REPLACE FUNCTION public.increment_user_energy(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;
  
  UPDATE public.profiles
  SET total_energy = total_energy + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;