
-- Add country column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;

-- Create index for country-based ranking queries
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles (country);
CREATE INDEX IF NOT EXISTS idx_profiles_ranking ON public.profiles (total_energy DESC, created_at ASC, user_id ASC);

-- Update get_ranking_page to support country filter
CREATE OR REPLACE FUNCTION public.get_ranking_page(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 50,
  p_search text DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  total_energy integer,
  city text,
  country text,
  bio text,
  instagram_handle text,
  tiktok_handle text,
  rank_position bigint,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      p.id,
      p.user_id,
      p.display_name,
      p.avatar_url,
      p.total_energy,
      p.city,
      p.country,
      p.bio,
      p.instagram_handle,
      p.tiktok_handle,
      ROW_NUMBER() OVER (ORDER BY p.total_energy DESC, p.created_at ASC, p.user_id ASC) AS rank_position,
      COUNT(*) OVER () AS total_count
    FROM public.profiles p
    WHERE (p_search IS NULL OR p.display_name ILIKE '%' || p_search || '%')
      AND (p_country IS NULL OR p.country = p_country)
  )
  SELECT * FROM ranked
  ORDER BY rank_position
  LIMIT p_page_size
  OFFSET (p_page - 1) * p_page_size;
$$;

-- Update get_my_rank_position to support country filter
CREATE OR REPLACE FUNCTION public.get_my_rank_position(
  p_user_id uuid,
  p_country text DEFAULT NULL
)
RETURNS TABLE(
  rank_position bigint,
  total_energy integer,
  total_count bigint,
  country text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      p.user_id,
      p.total_energy,
      p.country,
      ROW_NUMBER() OVER (ORDER BY p.total_energy DESC, p.created_at ASC, p.user_id ASC) AS rank_position,
      COUNT(*) OVER () AS total_count
    FROM public.profiles p
    WHERE (p_country IS NULL OR p.country = p_country)
  )
  SELECT rank_position, total_energy, total_count, country
  FROM ranked
  WHERE user_id = p_user_id;
$$;

-- Update get_ranking_stats to support country filter
CREATE OR REPLACE FUNCTION public.get_ranking_stats(
  p_country text DEFAULT NULL
)
RETURNS TABLE(
  top_energy integer,
  total_energy bigint,
  total_participants bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(MAX(p.total_energy), 0)::integer AS top_energy,
    COALESCE(SUM(p.total_energy), 0) AS total_energy,
    COUNT(*) AS total_participants
  FROM public.profiles p
  WHERE (p_country IS NULL OR p.country = p_country);
$$;

-- Function to get distinct countries for filter dropdown
CREATE OR REPLACE FUNCTION public.get_ranking_countries()
RETURNS TABLE(country text, user_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.country, COUNT(*) AS user_count
  FROM public.profiles p
  WHERE p.country IS NOT NULL
  GROUP BY p.country
  ORDER BY user_count DESC;
$$;
