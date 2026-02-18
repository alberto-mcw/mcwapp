import { Link, useLocation } from 'react-router-dom';
import { Flame, CalendarDays, Images, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Flame, label: 'El Reto', path: '/app' },
  { icon: CalendarDays, label: 'Calendario', path: '/app/calendario' },
  { icon: Images, label: 'Galería', path: '/app/galeria' },
  { icon: UserRound, label: 'Perfil', path: '/app/perfil' },
];

export const BottomNav = () => {
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
      <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon
                  className="w-5 h-5"
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <span className={cn(
                  "text-[10px] leading-none",
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
