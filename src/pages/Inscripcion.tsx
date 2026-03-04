import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEnrollment } from '@/hooks/useEnrollment';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MasterChefLogo } from '@/components/MasterChefLogo';
import { LegalCheckboxes } from '@/components/LegalCheckboxes';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Mail, Lock, User, Eye, EyeOff, Loader2,
  CheckCircle2, Smartphone, Trophy, Video, BookOpen,
  Phone, MapPin, Calendar, FileText, ChevronRight
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

const enrollSchema = z.object({
  postalAddress: z.string().min(5, 'Introduce tu dirección completa'),
  phone: z.string().min(9, 'Introduce un teléfono válido'),
  dateOfBirth: z.string().refine(val => {
    const dob = new Date(val);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    return age >= 18;
  }, 'Debes ser mayor de 18 años'),
  acceptBases: z.literal(true, { errorMap: () => ({ message: 'Obligatorio' }) }),
});

const Inscripcion = () => {
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const { isEnrolled, loading: enrollLoading, enroll } = useEnrollment();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Determine current step
  const getStep = () => {
    if (!user) return 1;
    if (!isEnrolled) return 2;
    return 3;
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
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

  // Step 2 fields
  const [postalAddress, setPostalAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [acceptBases, setAcceptBases] = useState(false);

  useEffect(() => {
    if (!authLoading && !enrollLoading) {
      setCurrentStep(getStep());
    }
  }, [user, isEnrolled, authLoading, enrollLoading]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

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
          toast({ title: 'Error', description: error.message.includes('already registered') ? 'Este email ya está registrado' : error.message, variant: 'destructive' });
        } else {
          toast({ title: '¡Cuenta creada!', description: 'Verifica tu email para continuar' });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      enrollSchema.parse({ postalAddress, phone, dateOfBirth, acceptBases });
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
      const { error } = await enroll({
        postal_address: postalAddress,
        phone,
        date_of_birth: dateOfBirth,
        accepted_legal_bases: true,
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: '¡Inscripción completada!', description: 'Ya estás dentro de El Reto 2026' });
      }
    } finally {
      setIsSubmitting(false);
    }
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
                  currentStep >= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div className={cn(
                    "w-12 h-0.5 rounded-full transition-all",
                    currentStep > step ? "bg-primary" : "bg-muted"
                  )} />
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
                  <h1 className="font-unbounded text-2xl font-bold mb-2">Paso 1: Crea tu cuenta</h1>
                  <p className="text-muted-foreground text-sm">Regístrate o inicia sesión para continuar</p>
                </div>

                {/* Auth mode tabs */}
                <div className="flex bg-muted rounded-xl p-1 mb-6">
                  <button
                    onClick={() => { setAuthMode('signup'); setErrors({}); }}
                    className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                      authMode === 'signup' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                    )}
                  >
                    Crear cuenta
                  </button>
                  <button
                    onClick={() => { setAuthMode('login'); setErrors({}); }}
                    className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                      authMode === 'login' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                    )}
                  >
                    Iniciar sesión
                  </button>
                </div>

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

                  {authMode === 'signup' && (
                    <LegalCheckboxes
                      acceptTerms={acceptTerms}
                      acceptPrivacy={acceptPrivacy}
                      onTermsChange={setAcceptTerms}
                      onPrivacyChange={setAcceptPrivacy}
                      errors={errors}
                    />
                  )}

                  <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                    {authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* STEP 2: Enrollment */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="font-unbounded text-2xl font-bold mb-2">Paso 2: Inscríbete a El Reto</h1>
                  <p className="text-muted-foreground text-sm">Completa tus datos para participar en la competición</p>
                </div>

                <form onSubmit={handleEnroll} className="bg-card border border-border rounded-2xl p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Dirección postal completa</Label>
                    <Input value={postalAddress} onChange={e => setPostalAddress(e.target.value)} placeholder="Calle, número, piso, CP, ciudad, provincia" className="bg-background" />
                    {errors.postalAddress && <p className="text-xs text-destructive">{errors.postalAddress}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />Teléfono</Label>
                    <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+34 600 000 000" className="bg-background" />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />Fecha de nacimiento</Label>
                    <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="bg-background" />
                    {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth}</p>}
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-2">
                      <Checkbox checked={acceptBases} onCheckedChange={v => setAcceptBases(v === true)} id="bases" />
                      <label htmlFor="bases" className="text-xs text-muted-foreground leading-tight">
                        He leído y acepto las <a href="/bases" target="_blank" className="text-primary hover:underline">Bases Legales de El Reto 2026</a>
                      </label>
                    </div>
                    {errors.acceptBases && <p className="text-xs text-destructive">{errors.acceptBases}</p>}
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                    Completar inscripción
                  </Button>
                </form>
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
                      <Link to="/descarga">
                        <Smartphone className="w-5 h-5" />
                        Descargar App
                      </Link>
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
