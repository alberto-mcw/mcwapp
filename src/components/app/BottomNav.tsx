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
        "fixed bottom-0 left-0 right-0 z-50 border-t border-border",
        // iOS style - taller with safe area padding and blur
        os === 'ios' && "bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60",
        // Android style with solid bg
        os === 'android' && "bg-card shadow-[0_-4px_16px_rgba(0,0,0,0.1)]",
        // Default fallback
        os === 'other' && "bg-card"
      )}
      style={{
        // iOS safe area - use env() for home indicator
        paddingBottom: os === 'ios' ? 'max(env(safe-area-inset-bottom, 34px), 24px)' : '8px'
      }}
    >
      <div className={cn(
        "flex items-center justify-around",
        // iOS: taller navigation area
        os === 'ios' ? "h-[60px] pt-2" : "h-16 pt-1"
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
                  : "text-muted-foreground"
              )}
            >
              {/* iOS style with subtle highlight */}
              {os === 'ios' ? (
                <>
                  <div className={cn(
                    "relative flex items-center justify-center w-14 h-8 rounded-full transition-colors",
                    active && "bg-primary/12"
                  )}>
                    <item.icon 
                      className={cn(
                        "w-6 h-6 transition-transform",
                        active && "scale-105"
                      )} 
                      strokeWidth={active ? 2.5 : 1.5}
                    />
                  </div>
                  <span className={cn(
                    "text-[10px] mt-1",
                    active ? "font-bold" : "font-medium"
                  )}>
                    {item.label}
                  </span>
                </>
              ) : (
                /* Android Material Design style with pill indicator */
                <>
                  <div className={cn(
                    "relative flex flex-col items-center"
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
