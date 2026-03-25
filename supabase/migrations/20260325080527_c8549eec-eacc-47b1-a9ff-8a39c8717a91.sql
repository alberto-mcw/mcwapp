
-- 1. Fix profiles: restrict SELECT to owner + admin only
DROP POLICY IF EXISTS "Users can view public profile data" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

-- RPC for public profile data (excludes email and sensitive fields)
CREATE OR REPLACE FUNCTION public.get_public_profiles(p_user_ids uuid[])
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  total_energy integer,
  city text,
  country text,
  bio text,
  instagram_handle text,
  tiktok_handle text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url, p.total_energy, p.city, p.country, p.bio, p.instagram_handle, p.tiktok_handle
  FROM public.profiles p
  WHERE p.user_id = ANY(p_user_ids);
$$;

-- Top profiles for landing page (no email exposed)
CREATE OR REPLACE FUNCTION public.get_top_profiles(p_limit integer DEFAULT 10)
RETURNS TABLE(
  display_name text,
  avatar_url text,
  total_energy integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.display_name, p.avatar_url, p.total_energy
  FROM public.profiles p
  ORDER BY p.total_energy DESC
  LIMIT p_limit;
$$;

-- 2. Fix recipes: drop overly permissive lead_id policy
DROP POLICY IF EXISTS "Leads can view own recipes by lead_id" ON public.recipes;

-- RPC for lead recipe access (verifies email ownership)
CREATE OR REPLACE FUNCTION public.get_lead_recipes(p_lead_id uuid, p_email text)
RETURNS SETOF public.recipes
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.*
  FROM public.recipes r
  JOIN public.recetario_leads l ON l.id = r.lead_id
  WHERE r.lead_id = p_lead_id
    AND l.email = p_email
    AND r.status = 'completed';
$$;

-- Single recipe access for leads (any status, for processing flow)
CREATE OR REPLACE FUNCTION public.get_lead_recipe_by_id(p_recipe_id uuid, p_lead_id uuid, p_email text)
RETURNS SETOF public.recipes
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.*
  FROM public.recipes r
  JOIN public.recetario_leads l ON l.id = r.lead_id
  WHERE r.id = p_recipe_id
    AND r.lead_id = p_lead_id
    AND l.email = p_email;
$$;
