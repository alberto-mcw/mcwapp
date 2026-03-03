
-- 1. Paginated ranking with optional search and stable ordering (energy DESC, created_at ASC, user_id ASC)
CREATE OR REPLACE FUNCTION public.get_ranking_page(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 50,
  p_search text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  total_energy integer,
  city text,
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
      p.bio,
      p.instagram_handle,
      p.tiktok_handle,
      ROW_NUMBER() OVER (ORDER BY p.total_energy DESC, p.created_at ASC, p.user_id ASC) AS rank_position,
      COUNT(*) OVER () AS total_count
    FROM public.profiles p
    WHERE p_search IS NULL 
       OR p.display_name ILIKE '%' || p_search || '%'
  )
  SELECT * FROM ranked
  ORDER BY rank_position
  LIMIT p_page_size
  OFFSET (p_page - 1) * p_page_size;
$$;

-- 2. Get a specific user's rank position (stable ordering)
CREATE OR REPLACE FUNCTION public.get_my_rank_position(p_user_id uuid)
RETURNS TABLE(
  rank_position bigint,
  total_energy integer,
  total_count bigint
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
      ROW_NUMBER() OVER (ORDER BY p.total_energy DESC, p.created_at ASC, p.user_id ASC) AS rank_position,
      COUNT(*) OVER () AS total_count
    FROM public.profiles p
  )
  SELECT rank_position, total_energy, total_count
  FROM ranked
  WHERE user_id = p_user_id;
$$;

-- 3. Get ranking stats (top energy, total energy, total participants)
CREATE OR REPLACE FUNCTION public.get_ranking_stats()
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
  FROM public.profiles p;
$$;
