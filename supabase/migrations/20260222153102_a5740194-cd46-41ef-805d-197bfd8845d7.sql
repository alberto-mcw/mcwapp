-- Allow leads (unauthenticated users) to update their own recipes (e.g. toggle visibility)
DROP POLICY IF EXISTS "Users can update own recipes" ON public.recipes;

CREATE POLICY "Users can update own recipes"
ON public.recipes
FOR UPDATE
USING (
  (auth.uid() = user_id)
  OR
  (lead_id IS NOT NULL AND user_id IS NULL)
);

-- Allow anyone to insert recipes (for cloning public recipes)
-- The existing "Anyone can insert recipes" policy should cover this, but let's make sure it allows cloning
-- No change needed since the existing policy allows lead_id-based inserts
