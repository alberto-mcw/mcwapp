import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { 
  User, ChefHat, LogIn, LogOut, KeyRound, 
  Settings, Flame, BookOpen, ChevronDown, X 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EMOJI_AVATARS = ['🍕', '🍷', '🥐', '🍣', '☕', '🍞', '🍾', '🍜', '🦪', '🍰', '🔪', '🍏', '🌯', '🍫', '🍔', '🧋', '🍝', '🍦', '🥘', '🍪'];

export const RecetarioAccountMenu = () => {
  const [open, setOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  if (loading) return null;

  const handleResetPassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast.error('Error al enviar el email de recuperación');
    } else {
      toast.success('Te hemos enviado un email para restaurar tu contraseña');
    }
    setOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    toast.success('Sesión cerrada');
  };

  // Not logged in → show login button
  if (!user) {
    return (
      <button
        onClick={() => navigate('/auth')}
        className="flex items-center gap-1.5 rounded-full border border-recetario-primary text-recetario-primary hover:bg-recetario-primary/5 text-sm h-9 px-3 font-medium transition-colors"
      >
        <LogIn className="w-4 h-4" />
        Entrar
      </button>
    );
  }

  const avatarUrl = profile?.avatar_url;
  const isEmoji = avatarUrl && EMOJI_AVATARS.includes(avatarUrl);
  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Chef';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-recetario-border bg-recetario-card hover:bg-recetario-bg text-recetario-fg text-sm h-9 px-2.5 transition-colors"
      >
        {/* Avatar */}
        <div className="w-6 h-6 rounded-full bg-recetario-primary/10 border border-recetario-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
          {isEmoji ? (
            <span className="text-sm">{avatarUrl}</span>
          ) : avatarUrl?.startsWith('http') ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <ChefHat className="w-3.5 h-3.5 text-recetario-primary" />
          )}
        </div>
        <span className="font-medium max-w-[100px] truncate hidden sm:inline">{displayName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-recetario-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Overlay to close */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-recetario-card border border-recetario-border rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* User info */}
          <div className="px-4 py-3 border-b border-recetario-border bg-recetario-bg/50">
            <p className="font-display text-sm font-bold text-recetario-fg truncate">{displayName}</p>
            <p className="text-xs text-recetario-muted-light truncate">{user.email}</p>
          </div>

          <div className="py-1.5">
            {/* Navigate options */}
            <MenuItem
              icon={<BookOpen className="w-4 h-4" />}
              label="Mi Recetario"
              onClick={() => { navigate('/recetario/biblioteca'); setOpen(false); }}
            />
            <MenuItem
              icon={<Flame className="w-4 h-4" />}
              label="Ir al Reto"
              onClick={() => { navigate('/dashboard'); setOpen(false); }}
            />

            <div className="my-1.5 border-t border-recetario-border" />

            {/* Profile & settings */}
            <MenuItem
              icon={<Settings className="w-4 h-4" />}
              label="Editar perfil y redes"
              onClick={() => { navigate('/profile'); setOpen(false); }}
            />
            <MenuItem
              icon={<KeyRound className="w-4 h-4" />}
              label="Restaurar contraseña"
              onClick={handleResetPassword}
            />

            <div className="my-1.5 border-t border-recetario-border" />

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuItem = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-recetario-fg hover:bg-recetario-bg transition-colors"
  >
    {icon}
    {label}
  </button>
);
