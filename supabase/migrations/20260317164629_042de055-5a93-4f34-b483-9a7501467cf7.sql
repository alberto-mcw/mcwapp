
-- =============================================
-- SIGUE AL CHEF - Database Schema
-- =============================================

-- 1. Chef Events (the main "reto" entity)
CREATE TABLE public.chef_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  chef_name text NOT NULL,
  chef_avatar_url text,
  twitch_url text NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'draft',
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  utensils jsonb NOT NULL DEFAULT '[]'::jsonb,
  rules text,
  evaluation_criteria text,
  cover_image_url text,
  final_dish_image_url text,
  energy_reward integer NOT NULL DEFAULT 50,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Chef Event Steps
CREATE TABLE public.chef_event_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.chef_events(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  title text NOT NULL,
  description text,
  duration_seconds integer NOT NULL DEFAULT 300,
  photo_required boolean NOT NULL DEFAULT false,
  reference_image_url text,
  tips text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, step_number)
);

-- 3. User participation in an event
CREATE TABLE public.chef_event_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.chef_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  finished_at timestamp with time zone,
  current_step integer NOT NULL DEFAULT 0,
  total_score integer,
  status text NOT NULL DEFAULT 'active',
  UNIQUE(event_id, user_id)
);

-- 4. Step submissions (photos + progress per step)
CREATE TABLE public.chef_step_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id uuid NOT NULL REFERENCES public.chef_event_participants(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES public.chef_event_steps(id) ON DELETE CASCADE,
  photo_url text,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  time_taken_seconds integer,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. AI Evaluations
CREATE TABLE public.chef_ai_evaluations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.chef_step_submissions(id) ON DELETE CASCADE,
  visual_fidelity_score integer,
  presentation_score integer,
  completeness_score integer,
  timing_score integer,
  confidence_score numeric(3,2),
  reasoning text,
  needs_manual_review boolean NOT NULL DEFAULT false,
  manual_review_by uuid,
  manual_review_at timestamp with time zone,
  manual_override_score integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 6. Final scores
CREATE TABLE public.chef_event_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id uuid NOT NULL REFERENCES public.chef_event_participants(id) ON DELETE CASCADE UNIQUE,
  visual_fidelity integer NOT NULL DEFAULT 0,
  timing integer NOT NULL DEFAULT 0,
  presentation integer NOT NULL DEFAULT 0,
  completeness integer NOT NULL DEFAULT 0,
  total_score integer NOT NULL DEFAULT 0,
  badge text,
  energy_awarded integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chef_event_steps_event ON public.chef_event_steps(event_id);
CREATE INDEX idx_chef_participants_event ON public.chef_event_participants(event_id);
CREATE INDEX idx_chef_participants_user ON public.chef_event_participants(user_id);
CREATE INDEX idx_chef_step_submissions_participant ON public.chef_step_submissions(participant_id);
CREATE INDEX idx_chef_ai_evaluations_submission ON public.chef_ai_evaluations(submission_id);

-- Enable RLS
ALTER TABLE public.chef_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chef_event_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chef_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chef_step_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chef_ai_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chef_event_scores ENABLE ROW LEVEL SECURITY;

-- RLS: chef_events
CREATE POLICY "Anyone can view published events" ON public.chef_events
  FOR SELECT USING (status IN ('published', 'live', 'finished'));
CREATE POLICY "Admins can manage events" ON public.chef_events
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS: chef_event_steps
CREATE POLICY "Anyone can view steps of visible events" ON public.chef_event_steps
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.chef_events WHERE id = event_id AND status IN ('published', 'live', 'finished')
  ));
CREATE POLICY "Admins can manage steps" ON public.chef_event_steps
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS: chef_event_participants
CREATE POLICY "Users can view own participation" ON public.chef_event_participants
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join events" ON public.chef_event_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON public.chef_event_participants
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage participants" ON public.chef_event_participants
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS: chef_step_submissions
CREATE POLICY "Users can manage own submissions" ON public.chef_step_submissions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.chef_event_participants WHERE id = participant_id AND user_id = auth.uid()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.chef_event_participants WHERE id = participant_id AND user_id = auth.uid()
  ));
CREATE POLICY "Admins can manage all submissions" ON public.chef_step_submissions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS: chef_ai_evaluations
CREATE POLICY "Users can view own evaluations" ON public.chef_ai_evaluations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.chef_step_submissions ss
    JOIN public.chef_event_participants p ON ss.participant_id = p.id
    WHERE ss.id = submission_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "Admins can manage evaluations" ON public.chef_ai_evaluations
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS: chef_event_scores
CREATE POLICY "Users can view own scores" ON public.chef_event_scores
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.chef_event_participants WHERE id = participant_id AND user_id = auth.uid()
  ));
CREATE POLICY "Admins can manage scores" ON public.chef_event_scores
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on chef_events
CREATE TRIGGER update_chef_events_updated_at
  BEFORE UPDATE ON public.chef_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for chef event photos
INSERT INTO storage.buckets (id, name, public) VALUES ('chef-events', 'chef-events', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view chef event files" ON storage.objects
  FOR SELECT USING (bucket_id = 'chef-events');
CREATE POLICY "Authenticated users can upload chef event files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chef-events' AND auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage chef event files" ON storage.objects
  FOR ALL USING (bucket_id = 'chef-events' AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'chef-events' AND public.has_role(auth.uid(), 'admin'::app_role));
