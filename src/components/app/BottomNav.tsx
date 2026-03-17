import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flame, CalendarDays, Images, UserRound, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';

const useNavItems = () => {
  const { t } = useTranslation();
  return [
    { icon: Flame, label: t('appNav.elReto'), path: '/app' },
    { icon: ChefHat, label: t('appNav.chef'), path: '/app/sigue-al-chef' },
    { icon: CalendarDays, label: t('appNav.calendar'), path: '/app/calendario' },
    { icon: Images, label: t('appNav.gallery'), path: '/app/galeria' },
    { icon: UserRound, label: t('appNav.profile'), path: '/app/perfil' },
  ];
};

export const BottomNav = () => {
  const navItems = useNavItems();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 px-4"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className="bg-card/90 backdrop-blur-xl border border-border/40 rounded-2xl shadow-lg">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {/* Active glow behind the icon */}
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-1 w-8 h-8 rounded-full bg-primary/25 blur-lg"
                  />
                )}
                <item.icon
                  className="relative z-10 w-5 h-5"
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <span className={cn(
                  "relative z-10 text-[10px] leading-none",
                  active ? "font-bold" : "font-medium"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
