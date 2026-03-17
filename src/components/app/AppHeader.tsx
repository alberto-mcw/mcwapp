import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
import { useAdmin } from '@/hooks/useAdmin';
import { Zap, ChefHat, Shield } from 'lucide-react';
import logoLight from '@/assets/logo-light.png';
import { AnimatedGlow } from './AnimatedGlow';
import { LanguageSelector } from '@/components/LanguageSelector';

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
        <Link to="/app/perfil" className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="text-lg">{avatarUrl}</span>
        </Link>
      );
    }
    if (avatarUrl?.startsWith('http')) {
      return (
        <Link to="/app/perfil" className="w-8 h-8 rounded-full overflow-hidden bg-muted border border-border">
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        </Link>
      );
    }
    return (
      <Link to="/app/perfil" className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
        <ChefHat className="w-4 h-4 text-primary" />
      </Link>
    );
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 overflow-hidden",
        className
      )}
      style={{ paddingTop: 'calc(8px + env(safe-area-inset-top, 0px))' }}
    >
      <AnimatedGlow />
      {/* Top bar: logo + energy + avatar */}
      <div className="relative z-10 flex items-center justify-between py-2">
        <img
          src={logoLight}
          alt="El Reto"
          className="h-7 w-auto object-contain"
        />
        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <Link
              to="/admin/usuarios"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border border-primary/20"
            >
              <Shield className="w-3.5 h-3.5 text-primary" />
            </Link>
          )}
          <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
            <Zap className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-sm font-bold text-primary tabular-nums">
              {profile?.total_energy?.toLocaleString() || 0}
            </span>
          </div>
          {renderAvatar()}
        </div>
      </div>

      {/* Optional right action */}
      {rightAction && (
        <div className="relative z-10 flex items-center justify-end pb-2">
          {rightAction}
        </div>
      )}
    </header>
  );
};
