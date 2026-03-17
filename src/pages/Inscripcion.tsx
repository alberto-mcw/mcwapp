import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEnrollment } from '@/hooks/useEnrollment';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MasterChefLogo } from '@/components/MasterChefLogo';
import { LegalCheckboxes } from '@/components/LegalCheckboxes';
import { EnrollmentForm } from '@/components/enrollment/EnrollmentForm';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import {
  Flame, Mail, Lock, User, Eye, EyeOff, Loader2,
  CheckCircle2, Smartphone, Trophy, Video, BookOpen, ArrowLeft
} from 'lucide-react';
import { z } from 'zod';

const CHEF_AVATARS = [
  '🍕','🍷','🥐','🍣','☕','🍞','🍾','🍜','🦪','🍰',
  '🔪','🍏','🌯','🍫','🍔','🧋','🍝','🍦','🥘','🍪',
];

const signupSchema = z.object({
  displayName: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  avatar: z.string().min(1, 'Selecciona un avatar'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Obligatorio' }) }),
  acceptPrivacy: z.literal(true, { errorMap: () => ({ message: 'Obligatorio' }) }),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const Inscripcion = () => {
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const { isEnrolled, loading: enrollLoading, enroll } = useEnrollment();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getStep = () => {
    if (!user) return 1;
    if (!isEnrolled) return 2;
    return 3;
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [authMode, setAuthMode] = useState<'signup' | 'login' | 'forgot'>('signup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Step 1 fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  useEffect(() => {
    if (!authLoading && !enrollLoading) {
      setCurrentStep(getStep());
    }
  }, [user, isEnrolled, authLoading, enrollLoading]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (authMode === 'forgot') {
      return handleForgotPassword();
    }

    try {
      if (authMode === 'signup') {
        signupSchema.parse({ displayName, email, password, avatar: selectedAvatar, acceptTerms, acceptPrivacy });
      } else {
        loginSchema.parse({ email, password });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const key = err.path[0] as string;
          if (key) newErrors[key] = err.message;
        });
        setErrors(newErrors);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: 'Error', description: error.message.includes('Invalid login') ? 'Email o contraseña incorrectos' : error.message, variant: 'destructive' });
        }
      } else {
        const { error } = await signUp(email, password, displayName, selectedAvatar);
        if (error) {
          toast({ title: 'Error', description: error.message.includes('already registered') ? 'Este email ya está registrado. Prueba a iniciar sesión.' : error.message, variant: 'destructive' });
        } else {
          toast({ title: '¡Cuenta creada!', description: 'Verifica tu email para continuar' });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      z.string().email('Email inválido').parse(email);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors({ email: error.errors[0]?.message || 'Email inválido' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Email enviado', description: 'Revisa tu bandeja de entrada para restablecer tu contraseña' });
        setAuthMode('login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnroll = async (data: Parameters<typeof enroll>[0]) => {
    setIsSubmitting(true);
    const result = await enroll(data);
    setIsSubmitting(false);
    if (result.error) {
      toast({ title: 'Error', description: result.error.message, variant: 'destructive' });
    } else {
      toast({ title: '¡Inscripción completada!', description: 'Ya estás dentro de El Reto 2026' });
    }
    return result;
  };

  if (authLoading || enrollLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-unbounded font-bold text-sm transition-all",
                  currentStep >= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div className={cn("w-12 h-0.5 rounded-full transition-all", currentStep > step ? "bg-primary" : "bg-muted")} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: Registration / Login */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="text-center mb-6">
                  <MasterChefLogo className="w-14 h-14 mx-auto mb-4" />
                  {authMode === 'forgot' ? (
                    <>
                      <h1 className="font-unbounded text-2xl font-bold mb-2">Recuperar contraseña</h1>
                      <p className="text-muted-foreground text-sm">Te enviaremos un email para restablecer tu contraseña</p>
                    </>
                  ) : (
                    <>
                      <h1 className="font-unbounded text-2xl font-bold mb-2">
                        Paso 1: {authMode === 'signup' ? 'Crea tu cuenta' : 'Inicia sesión'}
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        {authMode === 'signup'
                          ? 'Necesitas una cuenta para inscribirte a El Reto'
                          : '¿Ya tienes cuenta? Inicia sesión para continuar'}
                      </p>
                    </>
                  )}
                </div>

                {authMode !== 'forgot' && (
                  <div className="flex bg-muted rounded-xl p-1 mb-6">
                    <button onClick={() => { setAuthMode('signup'); setErrors({}); }}
                      className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                        authMode === 'signup' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                      )}>Crear cuenta</button>
                    <button onClick={() => { setAuthMode('login'); setErrors({}); }}
                      className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                        authMode === 'login' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                      )}>Ya tengo cuenta</button>
                  </div>
                )}

                <form onSubmit={handleAuth} className="bg-card border border-border rounded-2xl p-6 space-y-4">
                  {authMode === 'signup' && (
                    <>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><User className="w-4 h-4 text-primary" />Alias / Nombre de Chef</Label>
                        <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Tu nombre de chef" className="bg-background" />
                        {errors.displayName && <p className="text-xs text-destructive">{errors.displayName}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label>Elige tu avatar</Label>
                        <div className="grid grid-cols-10 gap-1">
                          {CHEF_AVATARS.map(emoji => (
                            <button key={emoji} type="button" onClick={() => setSelectedAvatar(emoji)}
                              className={cn("aspect-square rounded-lg text-xl flex items-center justify-center border transition-all",
                                selectedAvatar === emoji ? "border-primary bg-primary/10 scale-110" : "border-border bg-background"
                              )}>{emoji}</button>
                          ))}
                        </div>
                        {errors.avatar && <p className="text-xs text-destructive">{errors.avatar}</p>}
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" />Email</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className="bg-background" />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  {authMode !== 'forgot' && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Contraseña</Label>
                      <div className="relative">
                        <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="bg-background pr-10" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>
                  )}

                  {authMode === 'login' && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('forgot'); setErrors({}); }}
                        className="text-sm text-primary hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  )}

                  {authMode === 'signup' && (
                    <LegalCheckboxes
                      acceptTerms={acceptTerms} acceptPrivacy={acceptPrivacy}
                      onTermsChange={setAcceptTerms} onPrivacyChange={setAcceptPrivacy} errors={errors}
                    />
                  )}

                  <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                    {authMode === 'login' ? 'Iniciar sesión' : authMode === 'forgot' ? 'Enviar email de recuperación' : 'Crear cuenta'}
                  </Button>
                </form>

                {authMode === 'forgot' && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => { setAuthMode('login'); setErrors({}); }}
                      className="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Volver a iniciar sesión
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: Enrollment */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Flame className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="font-unbounded text-2xl font-bold mb-2">Paso 2: Inscríbete a El Reto</h1>
                  <p className="text-muted-foreground text-sm">Completa tus datos para participar en la competición</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <EnrollmentForm
                    userCountry={profile?.country}
                    onSubmit={handleEnroll}
                    isSubmitting={isSubmitting}
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 3: Confirmation */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                  </div>
                  <h1 className="font-unbounded text-2xl font-bold mb-3">¡Registro e inscripción completados!</h1>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Ya estás dentro de El Reto 2026. El siguiente paso es completar la <strong>Fase 0 (vídeo casting)</strong> desde la App móvil.
                  </p>

                  <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Smartphone className="w-6 h-6 text-primary" />
                      <p className="font-medium text-sm text-left">La Fase 0 solo puede completarse desde la App móvil (cámara y micrófono necesarios).</p>
                    </div>
                    <Button asChild size="lg" className="w-full gap-2">
                      <Link to="/descarga"><Smartphone className="w-5 h-5" />Descargar App</Link>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button asChild variant="outline" className="gap-2">
                      <Link to="/ranking"><Trophy className="w-4 h-4" />Ver Ranking</Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                      <Link to="/videos"><Video className="w-4 h-4" />Ver vídeos</Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                      <Link to="/recetario"><BookOpen className="w-4 h-4" />Ir al Recetario</Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Inscripcion;
