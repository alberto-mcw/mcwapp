import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MasterChefLogo } from '@/components/MasterChefLogo';
import { Flame, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { LegalCheckboxes } from '@/components/LegalCheckboxes';

const CHEF_AVATARS = [
  { emoji: '🍕', label: 'Pizza' },
  { emoji: '🍷', label: 'Vino' },
  { emoji: '🥐', label: 'Croissant' },
  { emoji: '🍣', label: 'Sushi' },
  { emoji: '☕', label: 'Café' },
  { emoji: '🍞', label: 'Pan' },
  { emoji: '🍾', label: 'Champán' },
  { emoji: '🍜', label: 'Ramen' },
  { emoji: '🦪', label: 'Ostra' },
  { emoji: '🍰', label: 'Tarta' },
  { emoji: '🔪', label: 'Cuchillo' },
  { emoji: '🍏', label: 'Manzana' },
  { emoji: '🌯', label: 'Burrito' },
  { emoji: '🍫', label: 'Chocolate' },
  { emoji: '🍔', label: 'Hamburguesa' },
  { emoji: '🧋', label: 'Bubble tea' },
  { emoji: '🍝', label: 'Pasta' },
  { emoji: '🍦', label: 'Helado' },
  { emoji: '🥘', label: 'Paella' },
  { emoji: '🍪', label: 'Galleta' },
];

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const signupSchema = loginSchema.extend({
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  avatar: z.string().min(1, 'Selecciona un avatar'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar los Términos y Condiciones' }) }),
  acceptPrivacy: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar la Política de Privacidad' }) }),
});

const Auth = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [detectedCountry, setDetectedCountry] = useState<string>('ES');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-detect country from browser locale
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Map common timezones to country codes
      const tzToCountry: Record<string, string> = {
        'Europe/Madrid': 'ES', 'Atlantic/Canary': 'ES', 'Europe/Ceuta': 'ES',
        'America/Mexico_City': 'MX', 'America/Cancun': 'MX', 'America/Monterrey': 'MX', 'America/Tijuana': 'MX',
        'America/Argentina/Buenos_Aires': 'AR', 'America/Cordoba': 'AR',
        'America/Bogota': 'CO', 'America/Santiago': 'CL', 'America/Lima': 'PE',
        'America/Guayaquil': 'EC', 'America/Caracas': 'VE', 'America/Montevideo': 'UY',
        'America/La_Paz': 'BO', 'America/Asuncion': 'PY', 'America/Costa_Rica': 'CR',
        'America/Panama': 'PA', 'America/Santo_Domingo': 'DO', 'America/Guatemala': 'GT',
        'America/Tegucigalpa': 'HN', 'America/El_Salvador': 'SV', 'America/Managua': 'NI',
        'America/Havana': 'CU', 'America/Puerto_Rico': 'PR',
        'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US',
        'America/Sao_Paulo': 'BR', 'Europe/Lisbon': 'PT', 'Europe/Paris': 'FR',
        'Europe/Rome': 'IT', 'Europe/Berlin': 'DE', 'Europe/London': 'GB',
      };
      if (tzToCountry[tz]) setDetectedCountry(tzToCountry[tz]);
    } catch {}
  }, []);

  // Check URL for reset mode and listen for password recovery event
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'reset') {
      setMode('reset');
    }

    // Listen for PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
        setIsRecoverySession(true);
      } else if (event === 'SIGNED_IN' && !isRecoverySession && session) {
        // Only redirect if not in recovery flow
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isRecoverySession]);

  useEffect(() => {
    // Don't redirect if in reset mode
    if (user && mode !== 'reset') {
      navigate('/dashboard');
    }
  }, [user, navigate, mode]);

  const validateForm = () => {
    try {
      if (mode === 'login') {
        loginSchema.parse({ email, password });
      } else if (mode === 'signup') {
        signupSchema.parse({ email, password, displayName, avatar: selectedAvatar, acceptTerms, acceptPrivacy });
      } else {
        z.string().email('Email inválido').parse(email);
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          } else {
            newErrors.email = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleResetPassword = async () => {
    if (password.length < 6) {
      setErrors({ password: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: '¡Contraseña actualizada!',
          description: 'Tu contraseña ha sido cambiada correctamente'
        });
        setIsRecoverySession(false);
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`
      });
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Email enviado',
          description: 'Revisa tu bandeja de entrada para restablecer tu contraseña'
        });
        setMode('login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'reset') {
      return handleResetPassword();
    }
    
    if (mode === 'forgot') {
      return handleForgotPassword();
    }
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Error de acceso',
              description: 'Email o contraseña incorrectos',
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Error',
              description: error.message,
              variant: 'destructive'
            });
          }
        } else {
          toast({
            title: '¡Bienvenido!',
            description: 'Has iniciado sesión correctamente'
          });
        }
      } else {
        const { error } = await signUp(email, password, displayName, selectedAvatar, detectedCountry);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Usuario existente',
              description: 'Este email ya está registrado. Intenta iniciar sesión.',
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Error',
              description: error.message,
              variant: 'destructive'
            });
          }
        } else {
          toast({
            title: '¡Cuenta creada!',
            description: 'Tu cuenta ha sido creada correctamente'
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Iniciar sesión';
      case 'signup': return 'Crear cuenta';
      case 'forgot': return 'Recuperar contraseña';
      case 'reset': return 'Nueva contraseña';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Accede a tu zona de entrenamiento';
      case 'signup': return 'Crea tu perfil para acceder a la plataforma';
      case 'forgot': return 'Te enviaremos un email para restablecer tu contraseña';
      case 'reset': return 'Introduce tu nueva contraseña';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <MasterChefLogo className="w-16 h-16" />
                <div className="absolute -top-1 -right-1">
                  <Flame className="w-6 h-6 text-primary animate-pulse" />
                </div>
              </div>
            </div>
            <h1 className="font-unbounded text-2xl font-bold mb-2">
              {getTitle()}
            </h1>
            <p className="text-muted-foreground">
              {getSubtitle()}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Nombre de Chef
                    </Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Tu nombre de chef"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-background border-border"
                    />
                    {errors.displayName && (
                      <p className="text-sm text-destructive">{errors.displayName}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      Elige tu avatar
                    </Label>
                    <div className="grid grid-cols-10 gap-1">
                      {CHEF_AVATARS.map((avatar) => (
                        <button
                          key={avatar.emoji}
                          type="button"
                          onClick={() => setSelectedAvatar(avatar.emoji)}
                          className={cn(
                            "w-full aspect-square rounded-lg text-xl flex items-center justify-center transition-all border",
                            selectedAvatar === avatar.emoji
                              ? "border-primary bg-primary/10 scale-110 shadow-lg"
                              : "border-border bg-background hover:border-primary/50 hover:bg-muted"
                          )}
                          title={avatar.label}
                        >
                          {avatar.emoji}
                        </button>
                      ))}
                    </div>
                    {errors.avatar && (
                      <p className="text-sm text-destructive">{errors.avatar}</p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background border-border"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {mode === 'reset' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Nueva contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-background border-border pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Confirmar contraseña
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-background border-border"
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>
                </>
              )}

              {mode !== 'forgot' && mode !== 'reset' && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background border-border pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
              )}

              {mode === 'signup' && (
                <LegalCheckboxes
                  acceptTerms={acceptTerms}
                  acceptPrivacy={acceptPrivacy}
                  onTermsChange={setAcceptTerms}
                  onPrivacyChange={setAcceptPrivacy}
                  errors={errors}
                />
              )}

              {mode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrors({});
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-fire font-unbounded"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Flame className="w-4 h-4 mr-2" />
                )}
                {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Crear cuenta' : mode === 'reset' ? 'Guardar contraseña' : 'Enviar email'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              {mode === 'forgot' ? (
                <button
                  onClick={() => {
                    setMode('login');
                    setErrors({});
                  }}
                  className="text-primary hover:underline text-sm font-medium flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio de sesión
                </button>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                  <button
                    onClick={() => {
                      setMode(mode === 'login' ? 'signup' : 'login');
                      setErrors({});
                    }}
                    className="text-primary hover:underline ml-1 font-medium"
                  >
                    {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
