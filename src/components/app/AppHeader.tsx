import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
import { useAdmin } from '@/hooks/useAdmin';
import { Zap, ChefHat, Shield } from 'lucide-react';
import logoLight from '@/assets/logo-light.png';

interface AppHeaderProps {
  rightAction?: ReactNode;
  className?: string;
}

const EMOJI_AVATARS = ['🍕', '🍷', '🥐', '🍣', '☕', '🍞', '🍾', '🍜', '🦪', '🍰', '🔪', '🍏', '🌯', '🍫', '🍔', '🧋', '🍝', '🍦', '🥘', '🍪'];

export const AppHeader = ({ rightAction, className }: AppHeaderProps) => {
  const { profile } = useProfile();
  const { isAdmin } = useAdmin();

  const avatarUrl = profile?.avatar_url;
  const isEmoji = avatarUrl && EMOJI_AVATARS.includes(avatarUrl);

  const renderAvatar = () => {
    if (isEmoji) {
      return (
        <Link to="/app/perfil" className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
          <span className="text-lg">{avatarUrl}</span>
        </Link>
      );
    }
    if (avatarUrl?.startsWith('http')) {
      return (
        <Link to="/app/perfil" className="w-8 h-8 rounded-full overflow-hidden bg-card border border-border">
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        </Link>
      );
    }
    return (
      <Link to="/app/perfil" className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
        <ChefHat className="w-4 h-4 text-primary" />
      </Link>
    );
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-background border-b border-border",
        className
      )}
    >
      {/* iOS safe area spacer — fills the notch/dynamic island area */}
      <div className="bg-background" style={{ height: 'env(safe-area-inset-top, 0px)' }} />
      <div className="flex items-center justify-between py-3 px-4">
        <img
          src={logoLight}
          alt="El Reto"
          className="h-7 w-auto object-contain"
        />
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin/usuarios"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border"
            >
              <Shield className="w-3.5 h-3.5 text-primary" />
            </Link>
          )}
          <div className="flex items-center gap-1 bg-card border border-border rounded-full px-2.5 py-1">
            <Zap className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-sm font-bold text-primary tabular-nums">
              {profile?.total_energy?.toLocaleString() || 0}
            </span>
          </div>
          {renderAvatar()}
        </div>
      </div>

      {rightAction && (
        <div className="flex items-center justify-end pb-2 px-4">
          {rightAction}
        </div>
      )}
    </header>
  );
};
