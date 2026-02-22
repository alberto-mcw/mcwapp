-- Collections table
CREATE TABLE public.recipe_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.recetario_leads(id),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  cover_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recipe_collections ENABLE ROW LEVEL SECURITY;

-- Junction table for recipes in collections
CREATE TABLE public.recipe_collection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.recipe_collections(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, recipe_id)
);

ALTER TABLE public.recipe_collection_items ENABLE ROW LEVEL SECURITY;

-- RLS for collections
CREATE POLICY "Anyone can insert collections"
ON public.recipe_collections FOR INSERT
WITH CHECK (
  ((lead_id IS NOT NULL) AND (user_id IS NULL))
  OR (auth.uid() = user_id)
);

CREATE POLICY "Leads can view own collections"
ON public.recipe_collections FOR SELECT
USING (lead_id IS NOT NULL OR auth.uid() = user_id);

CREATE POLICY "Owners can update collections"
ON public.recipe_collections FOR UPDATE
USING (
  (auth.uid() = user_id)
  OR (lead_id IS NOT NULL AND user_id IS NULL)
);

CREATE POLICY "Owners can delete collections"
ON public.recipe_collections FOR DELETE
USING (
  (auth.uid() = user_id)
  OR (lead_id IS NOT NULL AND user_id IS NULL)
);

-- RLS for collection items
CREATE POLICY "Anyone can insert collection items"
ON public.recipe_collection_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.recipe_collections
    WHERE id = collection_id
  )
);

CREATE POLICY "Anyone can view collection items"
ON public.recipe_collection_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.recipe_collections
    WHERE id = collection_id
  )
);

CREATE POLICY "Anyone can delete collection items"
ON public.recipe_collection_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.recipe_collections
    WHERE id = collection_id
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_recipe_collections_updated_at
BEFORE UPDATE ON public.recipe_collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
