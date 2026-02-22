
-- Create security definer function to get current user email
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Drop and recreate the problematic policy
DROP POLICY IF EXISTS "Users can view own recipes" ON public.recipes;
CREATE POLICY "Users can view own recipes" ON public.recipes
  FOR SELECT USING (
    auth.uid() = user_id
    OR lead_id IN (
      SELECT id FROM public.recetario_leads 
      WHERE email = public.get_auth_email()
    )
  );
