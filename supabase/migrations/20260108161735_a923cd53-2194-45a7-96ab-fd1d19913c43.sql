-- Tabla para almacenar verificaciones sociales de usuarios
CREATE TABLE public.social_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'instagram',
  action_type TEXT NOT NULL DEFAULT 'follow',
  energy_earned INTEGER NOT NULL DEFAULT 50,
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_email, platform, action_type)
);

-- Habilitar RLS
ALTER TABLE public.social_verifications ENABLE ROW LEVEL SECURITY;

-- Política: cualquiera puede insertar una verificación (una sola vez por email/plataforma/acción)
CREATE POLICY "Anyone can insert their verification"
ON public.social_verifications
FOR INSERT
WITH CHECK (true);

-- Política: cualquiera puede ver verificaciones (para mostrar contadores)
CREATE POLICY "Anyone can view verifications"
ON public.social_verifications
FOR SELECT
USING (true);