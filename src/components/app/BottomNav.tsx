import { Link, useLocation } from 'react-router-dom';
import { Tv, BookOpen, Flame, Grid2x2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: Tv,        label: 'Directos', path: '/app/sigue-al-chef' },
  { icon: BookOpen,  label: 'Recetas',  path: '/app/recetas' },
  { icon: Flame,     label: 'El Reto',  path: '/app', isCenter: true },
  { icon: Grid2x2,   label: 'Galería',  path: '/app/galeria' },
  { icon: User,      label: 'Perfil',   path: '/app/perfil' },
];

export const BottomNav = () => {
  const navItems = NAV_ITEMS;
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/8"
      style={{ paddingBottom: 'var(--sab)' }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors"
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-colors",
                  active ? "text-primary" : "text-white/35"
                )}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span className={cn(
                "text-[10px] leading-none font-medium",
                active ? "text-primary" : "text-white/35"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
