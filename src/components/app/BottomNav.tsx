import { Link, useLocation } from 'react-router-dom';
import { useDeviceOS } from '@/hooks/useDeviceOS';
import { Trophy, Calendar, Images, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Trophy, label: 'Retos', path: '/app' },
  { icon: Calendar, label: 'Calendario', path: '/app/calendario' },
  { icon: Images, label: 'Galería', path: '/app/galeria' },
  { icon: User, label: 'Perfil', path: '/app/perfil' },
];

export const BottomNav = () => {
  const location = useLocation();
  const os = useDeviceOS();
  
  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border",
        // iOS safe area with native blur
        os === 'ios' && "pb-safe backdrop-blur-xl bg-card/95",
        // Android style with solid bg
        os === 'android' && "pb-2 shadow-[0_-4px_16px_rgba(0,0,0,0.1)]",
        // Default fallback
        os === 'other' && "pb-2"
      )}
    >
      <div className={cn(
        "flex items-center justify-around",
        os === 'ios' ? "h-14 pt-2" : "h-16 pt-1"
      )}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* iOS style with filled icon when active */}
              {os === 'ios' ? (
                <>
                  <div className={cn(
                    "relative",
                    active && "after:absolute after:inset-0 after:bg-primary/10 after:rounded-full after:scale-150"
                  )}>
                    <item.icon 
                      className={cn(
                        "w-6 h-6 relative z-10 transition-transform",
                        active && "scale-110"
                      )} 
                      strokeWidth={active ? 2.5 : 1.5}
                    />
                  </div>
                  <span className={cn(
                    "text-[10px] mt-1 font-medium",
                    active && "font-bold"
                  )}>
                    {item.label}
                  </span>
                </>
              ) : (
                /* Android Material Design style with indicator */
                <>
                  <div className={cn(
                    "relative flex flex-col items-center",
                    active && "px-4"
                  )}>
                    {active && (
                      <div className="absolute -top-1 w-16 h-8 bg-primary/15 rounded-full" />
                    )}
                    <item.icon 
                      className={cn(
                        "w-6 h-6 relative z-10",
                        active && "text-primary"
                      )} 
                      strokeWidth={active ? 2.5 : 1.5}
                    />
                  </div>
                  <span className={cn(
                    "text-xs mt-0.5",
                    active ? "font-bold text-primary" : "font-medium"
                  )}>
                    {item.label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
