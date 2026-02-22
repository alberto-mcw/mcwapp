
-- Drop both restrictive INSERT policies
DROP POLICY IF EXISTS "Leads can insert recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can insert recipes" ON public.recipes;

-- Create a single permissive INSERT policy
CREATE POLICY "Anyone can insert recipes" ON public.recipes
  FOR INSERT WITH CHECK (
    (lead_id IS NOT NULL AND user_id IS NULL)
    OR (auth.uid() = user_id)
  );
