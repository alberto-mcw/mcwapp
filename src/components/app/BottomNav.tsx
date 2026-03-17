import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, BookOpen, ChefHat, UtensilsCrossed, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const useNavItems = () => {
  const { t } = useTranslation();
  return [
    { icon: Home, label: t('appNav.elReto', 'Inicio'), path: '/app' },
    { icon: BookOpen, label: t('appNav.gallery', 'Recetas'), path: '/app/galeria' },
    { icon: ChefHat, label: 'MasterChef', path: '/app/sigue-al-chef', isCenter: true },
    { icon: UtensilsCrossed, label: t('appNav.calendar', 'Kitchen'), path: '/app/calendario' },
    { icon: Flame, label: 'El Reto', path: '/app/perfil', isAccent: true },
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
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Top border line */}
      <div className="bg-[hsl(0_0%_0%)] border-t border-[hsl(0_0%_18%)]">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors",
                  active ? "text-primary" : "text-[hsl(0_0%_50%)]"
                )}
              >
                {/* Active indicator dot */}
                {active && (
                  <span
                    aria-hidden
                    className="absolute -top-[1px] w-8 h-[2px] rounded-full bg-primary"
                  />
                )}
                <item.icon
                  className={cn(
                    "w-5 h-5",
                    item.isAccent && active && "text-primary"
                  )}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <span className={cn(
                  "text-[10px] leading-none font-medium",
                  active && "text-primary font-semibold"
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
