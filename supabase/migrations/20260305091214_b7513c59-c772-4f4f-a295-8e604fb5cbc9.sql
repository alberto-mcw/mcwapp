
-- Function to check if an email should be admin
CREATE OR REPLACE FUNCTION public.is_admin_email(email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    email LIKE '%@masterchefworld.app'
    OR email = 'javier.flores@gmail.com'
  )
$$;

-- Function to auto-assign admin role on user creation
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin_email(NEW.email) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for new signups
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();

-- Add banned_at column to profiles for banning users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at timestamp with time zone DEFAULT NULL;

-- Backfill: assign admin role to existing users with admin emails
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'::app_role
FROM auth.users au
WHERE public.is_admin_email(au.email)
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = au.id AND ur.role = 'admin'
  );
