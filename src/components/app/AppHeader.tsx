import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
import { Zap, ChefHat } from 'lucide-react';
import logoLight from '@/assets/logo-light.png';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  rightAction?: ReactNode;
  className?: string;
}

const EMOJI_AVATARS = ['🍕', '🍷', '🥐', '🍣', '☕', '🍞', '🍾', '🍜', '🦪', '🍰', '🔪', '🍏', '🌯', '🍫', '🍔', '🧋', '🍝', '🍦', '🥘', '🍪'];

export const AppHeader = ({ title, subtitle, rightAction, className }: AppHeaderProps) => {
  const { profile } = useProfile();

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
        "sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border px-4",
        className
      )}
      style={{ paddingTop: 'calc(8px + env(safe-area-inset-top, 0px))' }}
    >
      {/* Top bar: logo + energy + avatar */}
      <div className="flex items-center justify-between py-2">
        <img
          src={logoLight}
          alt="El Reto"
          className="h-7 w-auto object-contain"
        />
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
            <Zap className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-sm font-bold text-primary tabular-nums">
              {profile?.total_energy?.toLocaleString() || 0}
            </span>
          </div>
          {renderAvatar()}
        </div>
      </div>

      {/* Page title + optional action */}
      {(title || rightAction) && (
        <div className="flex items-center justify-between pb-3">
          <div>
            {title && (
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          {rightAction && <div>{rightAction}</div>}
        </div>
      )}
    </header>
  );
};
