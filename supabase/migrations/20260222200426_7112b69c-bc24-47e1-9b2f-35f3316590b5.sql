
-- Add tags column to recipes table
ALTER TABLE public.recipes ADD COLUMN tags text[] DEFAULT '{}';

-- Add index for efficient tag queries
CREATE INDEX idx_recipes_tags ON public.recipes USING GIN(tags);
