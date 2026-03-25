
-- Fix 1: Restrict recetario_leads SELECT to own email only
DROP POLICY IF EXISTS "Leads can view own by email" ON public.recetario_leads;
CREATE POLICY "Leads can view own by email" ON public.recetario_leads
  FOR SELECT USING (email = public.get_auth_email());

-- Fix 2: Remove overly permissive trivia_completions SELECT policy
DROP POLICY IF EXISTS "Anyone can view trivia completion stats" ON public.trivia_completions;
