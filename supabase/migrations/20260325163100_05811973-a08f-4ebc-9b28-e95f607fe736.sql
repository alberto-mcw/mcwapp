
-- Fix 1: Remove public SELECT on daily_trivias to prevent correct_answer exposure
-- Public reads should go through daily_trivias_public view which excludes correct_answer
DROP POLICY IF EXISTS "Anyone can view scheduled trivias" ON public.daily_trivias;

-- Fix 2: Tighten recipe_collections lead-based policies to verify actual lead ownership
-- SELECT: verify lead ownership via email match
DROP POLICY IF EXISTS "Leads can view own collections" ON public.recipe_collections;
CREATE POLICY "Leads can view own collections" ON public.recipe_collections
  FOR SELECT USING (
    (auth.uid() = user_id)
    OR (lead_id IS NOT NULL AND lead_id IN (
      SELECT id FROM public.recetario_leads WHERE email = public.get_auth_email()
    ))
  );

-- UPDATE: verify lead ownership
DROP POLICY IF EXISTS "Owners can update collections" ON public.recipe_collections;
CREATE POLICY "Owners can update collections" ON public.recipe_collections
  FOR UPDATE USING (
    (auth.uid() = user_id)
    OR (lead_id IS NOT NULL AND user_id IS NULL AND lead_id IN (
      SELECT id FROM public.recetario_leads WHERE email = public.get_auth_email()
    ))
  );

-- DELETE: verify lead ownership
DROP POLICY IF EXISTS "Owners can delete collections" ON public.recipe_collections;
CREATE POLICY "Owners can delete collections" ON public.recipe_collections
  FOR DELETE USING (
    (auth.uid() = user_id)
    OR (lead_id IS NOT NULL AND user_id IS NULL AND lead_id IN (
      SELECT id FROM public.recetario_leads WHERE email = public.get_auth_email()
    ))
  );
