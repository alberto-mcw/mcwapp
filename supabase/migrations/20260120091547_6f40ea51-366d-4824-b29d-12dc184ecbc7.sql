-- Create trivia_completions table to track user trivia answers
CREATE TABLE public.trivia_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trivia_id UUID NOT NULL REFERENCES public.daily_trivias(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  selected_answer INTEGER NOT NULL,
  energy_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, trivia_id)
);

-- Enable Row Level Security
ALTER TABLE public.trivia_completions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own completions
CREATE POLICY "Users can insert their own trivia completions"
  ON public.trivia_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own completions
CREATE POLICY "Users can view their own trivia completions"
  ON public.trivia_completions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow public read for stats (only aggregate data, not individual answers)
CREATE POLICY "Anyone can view trivia completion stats"
  ON public.trivia_completions
  FOR SELECT
  USING (true);

-- Add index for faster queries
CREATE INDEX idx_trivia_completions_user_id ON public.trivia_completions(user_id);
CREATE INDEX idx_trivia_completions_trivia_id ON public.trivia_completions(trivia_id);