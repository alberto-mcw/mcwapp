-- Create daily_trivias table for scheduled trivia questions
CREATE TABLE public.daily_trivias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_date DATE NOT NULL UNIQUE,
  trivia_type TEXT NOT NULL DEFAULT 'trivia',
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  fun_fact TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medio',
  energy_reward INTEGER NOT NULL DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID
);

-- Enable RLS
ALTER TABLE public.daily_trivias ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved trivias for today or past dates
CREATE POLICY "Anyone can view approved trivias"
ON public.daily_trivias
FOR SELECT
USING (status = 'approved' AND scheduled_date <= CURRENT_DATE);

-- Admins can manage all trivias
CREATE POLICY "Admins can manage trivias"
ON public.daily_trivias
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster lookups by date
CREATE INDEX idx_daily_trivias_scheduled_date ON public.daily_trivias(scheduled_date);
CREATE INDEX idx_daily_trivias_status ON public.daily_trivias(status);