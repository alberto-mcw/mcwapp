import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAdmin } from '@/hooks/useAdmin';
import { Zap, ChefHat, Shield } from 'lucide-react';
import logoCompact from '@/assets/logo-m-masterchef.svg';

interface AppHeaderProps {
  rightAction?: ReactNode;
  className?: string;
}

const EMOJI_AVATARS = ['🍕', '🍷', '🥐', '🍣', '☕', '🍞', '🍾', '🍜', '🦪', '🍰', '🔪', '🍏', '🌯', '🍫', '🍔', '🧋', '🍝', '🍦', '🥘', '🍪'];

export const AppHeader = ({ rightAction, className }: AppHeaderProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isAdmin } = useAdmin();

  const avatarUrl = profile?.avatar_url;
  const isEmoji = avatarUrl && EMOJI_AVATARS.includes(avatarUrl);

  const renderAvatar = () => {
    if (isEmoji) {
      return (
        <Link to="/app/perfil" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="text-lg">{avatarUrl}</span>
        </Link>
      );
    }
    if (avatarUrl?.startsWith('http')) {
      return (
        <Link to="/app/perfil" className="w-8 h-8 rounded-full overflow-hidden bg-white/5 border border-white/10">
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        </Link>
      );
    }
    return (
      <Link to="/app/perfil" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
        <ChefHat className="w-4 h-4 text-primary" />
      </Link>
    );
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        className
      )}
    >
      {/* iOS safe area spacer */}
      <div className="bg-black" style={{ height: 'var(--sat)' }} />
      {/* Glass backdrop */}
      <div className="relative bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between py-3 px-4">
          <img
            src={logoCompact}
            alt="MasterChef"
            className="h-6 w-auto object-contain"
          />
          <div className="flex items-center gap-2">
            {user && isAdmin && (
              <Link
                to="/admin/usuarios"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10"
              >
                <Shield className="w-3.5 h-3.5 text-primary" />
              </Link>
            )}
            {user && (
              <>
                {/* Energy pill */}
                <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
                  <Zap className="w-3.5 h-3.5 text-primary fill-primary" />
                  <span className="text-sm font-bold text-primary tabular-nums">
                    {profile?.total_energy?.toLocaleString() || 0}
                  </span>
                </div>
                {renderAvatar()}
              </>
            )}
          </div>
        </div>

        {rightAction && (
          <div className="flex items-center justify-end pb-2 px-4">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
};
