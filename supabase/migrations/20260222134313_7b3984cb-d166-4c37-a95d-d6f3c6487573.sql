
-- =============================================
-- EL RECETARIO ETERNO — Schema
-- =============================================

-- 1. Leads table (ManyChat email captures, pre-auth)
CREATE TABLE public.recetario_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text DEFAULT 'manychat',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referred_by uuid REFERENCES public.recetario_leads(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recetario_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert lead" ON public.recetario_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Leads can view own by email" ON public.recetario_leads
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage leads" ON public.recetario_leads
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Recipes table
CREATE TABLE public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  lead_id uuid REFERENCES public.recetario_leads(id),
  title text NOT NULL DEFAULT 'Sin título',
  original_image_url text,
  ocr_text text,
  corrected_text text,
  structured_data jsonb,
  recipe_type text DEFAULT 'salado',
  regional_style text,
  servings integer DEFAULT 4,
  estimated_time text,
  difficulty text DEFAULT 'media',
  healthy_version jsonb,
  healthy_version_active boolean DEFAULT false,
  shopping_list jsonb,
  alternatives jsonb,
  ai_story text,
  share_token text UNIQUE,
  visibility text NOT NULL DEFAULT 'private',
  is_favorite boolean DEFAULT false,
  pdf_url text,
  calories_per_serving integer,
  status text NOT NULL DEFAULT 'processing',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Anyone can view shared recipes
CREATE POLICY "Anyone can view shared recipes" ON public.recipes
  FOR SELECT USING (visibility = 'shared' OR visibility = 'public');

-- Users can manage own recipes (by user_id or lead_id)
CREATE POLICY "Users can view own recipes" ON public.recipes
  FOR SELECT USING (
    auth.uid() = user_id
    OR lead_id IN (SELECT id FROM public.recetario_leads WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "Users can insert recipes" ON public.recipes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR lead_id IS NOT NULL
  );

CREATE POLICY "Users can update own recipes" ON public.recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Leads can insert recipes" ON public.recipes
  FOR INSERT WITH CHECK (lead_id IS NOT NULL AND user_id IS NULL);

CREATE POLICY "Admins can manage recipes" ON public.recipes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Recipe interactions (analytics)
CREATE TABLE public.recipe_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id uuid,
  lead_id uuid REFERENCES public.recetario_leads(id),
  action_type text NOT NULL,
  action_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recipe_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert interactions" ON public.recipe_interactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own interactions" ON public.recipe_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all interactions" ON public.recipe_interactions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Recipe shares tracking
CREATE TABLE public.recipe_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  share_token text NOT NULL UNIQUE,
  clicks integer DEFAULT 0,
  new_users_generated integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recipe_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shares by token" ON public.recipe_shares
  FOR SELECT USING (true);

CREATE POLICY "Users can create shares" ON public.recipe_shares
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage shares" ON public.recipe_shares
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload recipe images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'recipe-images');

CREATE POLICY "Anyone can view recipe images"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe-images');

-- 6. Indexes
CREATE INDEX idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX idx_recipes_lead_id ON public.recipes(lead_id);
CREATE INDEX idx_recipes_share_token ON public.recipes(share_token);
CREATE INDEX idx_recipes_visibility ON public.recipes(visibility);
CREATE INDEX idx_recipe_interactions_recipe ON public.recipe_interactions(recipe_id);
CREATE INDEX idx_recipe_interactions_action ON public.recipe_interactions(action_type);
CREATE INDEX idx_recetario_leads_email ON public.recetario_leads(email);

-- 7. Trigger for updated_at
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
