import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { MasterChefLogo } from '@/components/MasterChefLogo';
import { Eye, EyeOff, Loader2, ArrowLeft, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useSystemTheme } from '@/hooks/useSystemTheme';
import { LegalCheckboxes } from '@/components/LegalCheckboxes';
import logoVerticalLight from '@/assets/logo-vertical-light.png';

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
  password: z.string().min(6, 'Mínimo 6 caracteres')
});

const signupSchema = loginSchema.extend({
  displayName: z.string().min(2, 'Mínimo 2 caracteres'),
  avatar: z.string().min(1, 'Selecciona un avatar'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar los Términos y Condiciones' }) }),
  acceptPrivacy: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar la Política de Privacidad' }) }),
});

const AppAuth = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  useSystemTheme();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'reset') {
      setMode('reset');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
        setIsRecoverySession(true);
      } else if (event === 'SIGNED_IN' && !isRecoverySession && session) {
        navigate('/app');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isRecoverySession]);

  useEffect(() => {
    if (user && mode !== 'reset') {
      navigate('/app');
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
      setErrors({ password: 'Mínimo 6 caracteres' });
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
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: '¡Contraseña actualizada!', description: 'Tu contraseña ha sido cambiada' });
        setIsRecoverySession(false);
        navigate('/app');
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
        redirectTo: `${window.location.origin}/app/auth?mode=reset`
      });
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Email enviado', description: 'Revisa tu bandeja de entrada' });
        setMode('login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'reset') return handleResetPassword();
    if (mode === 'forgot') return handleForgotPassword();
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Error de acceso',
            description: error.message.includes('Invalid login credentials') 
              ? 'Email o contraseña incorrectos' 
              : error.message,
            variant: 'destructive'
          });
        } else {
          toast({ title: '¡Bienvenido!', description: 'Has iniciado sesión correctamente' });
        }
      } else {
        const { error } = await signUp(email, password, displayName, selectedAvatar);
        if (error) {
          toast({
            title: 'Error',
            description: error.message.includes('already registered') 
              ? 'Este email ya está registrado' 
              : error.message,
            variant: 'destructive'
          });
        } else {
          toast({ title: '¡Cuenta creada!', description: 'Tu cuenta ha sido creada correctamente' });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const modeConfig = {
    login: { heading: 'Accede a tu cuenta', sub: 'Entra en tu zona de entrenamiento' },
    signup: { heading: 'Únete al Reto', sub: 'Crea tu perfil y empieza' },
    forgot: { heading: 'Recuperar contraseña', sub: 'Te enviaremos un email de recuperación' },
    reset: { heading: 'Nueva contraseña', sub: 'Introduce tu nueva contraseña' },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero with concentric circles */}
      <div className="concentric-circles-bg flex flex-col items-center pt-12 pb-6 px-4"
        style={{ paddingTop: 'calc(48px + env(safe-area-inset-top, 0px))' }}
      >
        {/* Back button */}
        {(mode === 'forgot' || mode === 'signup') && (
          <button
            onClick={() => { setMode('login'); setErrors({}); }}
            className="absolute left-4 top-4 w-10 h-10 rounded-full border border-border bg-card/50 backdrop-blur-sm flex items-center justify-center z-20"
            style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))' }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}

        <img
          src={logoVerticalLight}
          alt="El Reto - MasterChef World App"
          className="relative z-10 h-28 w-auto object-contain mb-4"
        />
        <h1 className="relative z-10 font-display text-2xl font-black text-gradient-primary text-center leading-tight">
          {modeConfig[mode].heading}
        </h1>
        <p className="relative z-10 text-sm text-muted-foreground text-center mt-1.5 max-w-xs">
          {modeConfig[mode].sub}
        </p>
      </div>

      {/* Form area */}
      <div className="flex-1 px-5 pb-8 pt-4">
        <form onSubmit={handleSubmit} className="space-y-0">
          {mode === 'signup' && (
            <>
              {/* Chef Name */}
              <div className="py-3">
                <label className="app-input-label">Nombre de Chef</label>
                <input
                  type="text"
                  placeholder="Tu nombre de chef"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="app-input"
                />
                {errors.displayName && (
                  <p className="app-input-error"><X className="w-3 h-3" />{errors.displayName}</p>
                )}
              </div>

              {/* Avatar selection */}
              <div className="py-3">
                <label className="app-input-label">Elige tu avatar</label>
                <div className="grid grid-cols-10 gap-1.5 mt-2">
                  {CHEF_AVATARS.map((avatar) => (
                    <button
                      key={avatar.emoji}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.emoji)}
                      className={cn(
                        "aspect-square rounded-xl text-lg flex items-center justify-center transition-all",
                        selectedAvatar === avatar.emoji
                          ? "bg-primary/15 ring-2 ring-primary scale-110"
                          : "bg-card hover:bg-muted"
                      )}
                    >
                      {avatar.emoji}
                    </button>
                  ))}
                </div>
                {errors.avatar && (
                  <p className="app-input-error"><X className="w-3 h-3" />{errors.avatar}</p>
                )}
              </div>
            </>
          )}

          {mode !== 'reset' && (
            <div className="py-3">
              <label className="app-input-label">Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="app-input"
              />
              {errors.email && (
                <p className="app-input-error"><X className="w-3 h-3" />{errors.email}</p>
              )}
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div className="py-3">
              <label className="app-input-label">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="app-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="app-input-error"><X className="w-3 h-3" />{errors.password}</p>
              )}
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div className="py-3">
                <label className="app-input-label">Nueva contraseña</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="app-input"
                />
              </div>
              <div className="py-3">
                <label className="app-input-label">Confirmar contraseña</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="app-input"
                />
                {errors.confirmPassword && (
                  <p className="app-input-error"><X className="w-3 h-3" />{errors.confirmPassword}</p>
                )}
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div className="pt-4">
              <LegalCheckboxes
                acceptTerms={acceptTerms}
                acceptPrivacy={acceptPrivacy}
                onTermsChange={setAcceptTerms}
                onPrivacyChange={setAcceptPrivacy}
                errors={errors}
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right pt-2 pb-2">
              <button
                type="button"
                onClick={() => { setMode('forgot'); setErrors({}); }}
                className="text-xs text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {/* Submit button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 transition-all",
                isLoading && "opacity-70"
              )}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Entrar' : 
               mode === 'signup' ? 'Crear cuenta' : 
               mode === 'reset' ? 'Guardar' : 'Enviar email'}
            </button>
          </div>
        </form>

        {/* Mode switch */}
        <div className="mt-6 text-center">
          {mode === 'forgot' ? (
            <button
              onClick={() => { setMode('login'); setErrors({}); }}
              className="text-primary hover:underline text-sm flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          ) : mode !== 'reset' && (
            <p className="text-muted-foreground text-sm">
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErrors({}); }}
                className="text-primary font-medium ml-1 hover:underline"
              >
                {mode === 'login' ? 'Crear cuenta' : 'Inicia sesión'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppAuth;
