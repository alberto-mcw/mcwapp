
-- Fix overly permissive INSERT on recipe_shares
DROP POLICY "Users can create shares" ON public.recipe_shares;
CREATE POLICY "Authenticated users can create shares" ON public.recipe_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE id = recipe_id AND user_id = auth.uid()
    )
  );

-- Update clicks on shares
CREATE POLICY "Anyone can update share clicks" ON public.recipe_shares
  FOR UPDATE USING (true)
  WITH CHECK (true);
