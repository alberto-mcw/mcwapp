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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute -top-[1px] w-8 h-[2px] rounded-full bg-primary"
                />
              )}
              <item.icon
                className="w-5 h-5"
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span className={cn(
                "text-[10px] leading-none",
                active ? "text-primary font-semibold" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* iOS home indicator safe area */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} className="bg-background" />
    </nav>
  );
};
