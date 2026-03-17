import { useState } from 'react';
import { lovable } from '@/integrations/lovable/index';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialAuthButtonsProps {
  className?: string;
  variant?: 'web' | 'app';
}

export const SocialAuthButtons = ({ className, variant = 'web' }: SocialAuthButtonsProps) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setLoadingProvider(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result?.error) {
        toast({
          title: 'Error',
          description: `No se pudo iniciar sesión con ${provider === 'google' ? 'Google' : 'Apple'}`,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Error al conectar con el proveedor',
        variant: 'destructive',
      });
    } finally {
      setLoadingProvider(null);
    }
  };

  const isApp = variant === 'app';

  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">o continúa con</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={!!loadingProvider}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border font-medium text-sm transition-all",
            isApp ? "bg-card hover:bg-muted" : "bg-background hover:bg-muted",
            loadingProvider === 'google' && "opacity-70"
          )}
        >
          {loadingProvider === 'google' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Google
        </button>
        <button
          type="button"
          onClick={() => handleSocialLogin('apple')}
          disabled={!!loadingProvider}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border font-medium text-sm transition-all",
            isApp ? "bg-card hover:bg-muted" : "bg-background hover:bg-muted",
            loadingProvider === 'apple' && "opacity-70"
          )}
        >
          {loadingProvider === 'apple' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          )}
          Apple
        </button>
      </div>
    </div>
  );
};
