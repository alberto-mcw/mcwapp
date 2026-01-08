-- Function to increment user energy
CREATE OR REPLACE FUNCTION public.increment_user_energy(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET total_energy = total_energy + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;