import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MasterChefLogo } from '@/components/MasterChefLogo';
import { Flame, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useSystemTheme } from '@/hooks/useSystemTheme';

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
  avatar: z.string().min(1, 'Selecciona un avatar')
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
        signupSchema.parse({ email, password, displayName, avatar: selectedAvatar });
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

  return (
    <div className="min-h-screen bg-background flex flex-col px-4 py-8">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="relative">
            <MasterChefLogo className="w-14 h-14" />
            <div className="absolute -top-1 -right-1">
              <Flame className="w-5 h-5 text-primary animate-pulse" />
            </div>
          </div>
        </div>
        <h1 className="font-unbounded text-xl font-bold mb-1">
          {mode === 'login' ? 'Accede a tu cuenta' : 
           mode === 'signup' ? 'Únete al Reto' :
           mode === 'forgot' ? 'Recuperar contraseña' : 'Nueva contraseña'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === 'login' ? 'Entra en tu zona de entrenamiento' :
           mode === 'signup' ? 'Crea tu perfil y empieza' :
           mode === 'forgot' ? 'Te enviaremos un email' : 'Introduce tu nueva contraseña'}
        </p>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-2xl p-5 flex-1">
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="text-sm flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Nombre de Chef
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Tu nombre de chef"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-background h-10"
                />
                {errors.displayName && (
                  <p className="text-xs text-destructive">{errors.displayName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Elige tu avatar</Label>
                <div className="grid grid-cols-10 gap-1">
                  {CHEF_AVATARS.map((avatar) => (
                    <button
                      key={avatar.emoji}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.emoji)}
                      className={cn(
                        "aspect-square rounded-lg text-lg flex items-center justify-center transition-all border",
                        selectedAvatar === avatar.emoji
                          ? "border-primary bg-primary/10 scale-105"
                          : "border-border bg-background"
                      )}
                    >
                      {avatar.emoji}
                    </button>
                  ))}
                </div>
                {errors.avatar && (
                  <p className="text-xs text-destructive">{errors.avatar}</p>
                )}
              </div>
            </>
          )}

          {mode !== 'reset' && (
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background h-10"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  Nueva contraseña
                </Label>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background h-10"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setMode('forgot'); setErrors({}); }}
                className="text-xs text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full btn-primary h-11">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Flame className="w-4 h-4 mr-2" />
            )}
            {mode === 'login' ? 'Entrar' : 
             mode === 'signup' ? 'Crear cuenta' : 
             mode === 'reset' ? 'Guardar' : 'Enviar email'}
          </Button>
        </form>

        <div className="mt-5 text-center">
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
                {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppAuth;
