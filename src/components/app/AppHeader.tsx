import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
import { useAdmin } from '@/hooks/useAdmin';
import { Zap, ChefHat, Shield } from 'lucide-react';
import logoLight from '@/assets/logo-light.png';
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
        <Link to="/app/perfil" className="w-8 h-8 rounded-full bg-[hsl(0_0%_12%)] border border-[hsl(0_0%_25%)] flex items-center justify-center">
          <span className="text-lg">{avatarUrl}</span>
        </Link>
      );
    }
    if (avatarUrl?.startsWith('http')) {
      return (
        <Link to="/app/perfil" className="w-8 h-8 rounded-full overflow-hidden bg-[hsl(0_0%_12%)] border border-[hsl(0_0%_25%)]">
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        </Link>
      );
    }
    return (
      <Link to="/app/perfil" className="w-8 h-8 rounded-full bg-[hsl(0_0%_12%)] border border-[hsl(0_0%_25%)] flex items-center justify-center">
        <ChefHat className="w-4 h-4 text-primary" />
      </Link>
    );
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-[hsl(0_0%_0%)] border-b border-[hsl(0_0%_18%)] px-4",
        className
      )}
      style={{ paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}
    >
      {/* Top bar: logo + energy + avatar */}
      <div className="flex items-center justify-between py-2">
        <img
          src={logoLight}
          alt="El Reto"
          className="h-7 w-auto object-contain"
        />
        <div className="flex items-center gap-2">
          <LanguageSelector variant="minimal" />
          {isAdmin && (
            <Link
              to="/admin/usuarios"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[hsl(0_0%_12%)] border border-[hsl(0_0%_25%)]"
            >
              <Shield className="w-3.5 h-3.5 text-primary" />
            </Link>
          )}
          <div className="flex items-center gap-1 bg-[hsl(0_0%_12%)] border border-[hsl(0_0%_25%)] rounded-full px-2.5 py-1">
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
        <div className="flex items-center justify-end pb-2">
          {rightAction}
        </div>
      )}
    </header>
  );
};
