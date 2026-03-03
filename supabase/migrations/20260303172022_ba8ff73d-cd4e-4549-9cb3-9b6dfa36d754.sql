
-- Create table for El Reto enrollment data
CREATE TABLE public.reto_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  postal_address TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  accepted_legal_bases BOOLEAN NOT NULL DEFAULT false,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reto_enrollments ENABLE ROW LEVEL SECURITY;

-- Users can view their own enrollment
CREATE POLICY "Users can view own enrollment"
ON public.reto_enrollments
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own enrollment
CREATE POLICY "Users can enroll themselves"
ON public.reto_enrollments
FOR INSERT
WITH CHECK (auth.uid() = user_id AND accepted_legal_bases = true);

-- Users can update their own enrollment
CREATE POLICY "Users can update own enrollment"
ON public.reto_enrollments
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage all enrollments
CREATE POLICY "Admins can manage enrollments"
ON public.reto_enrollments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add accepted_terms and accepted_privacy to profiles if not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accepted_privacy BOOLEAN DEFAULT false;

-- Trigger for updated_at
CREATE TRIGGER update_reto_enrollments_updated_at
BEFORE UPDATE ON public.reto_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
