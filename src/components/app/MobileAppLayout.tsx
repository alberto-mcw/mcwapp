import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from './BottomNav';
import { useSystemTheme } from '@/hooks/useSystemTheme';
import { Loader2 } from 'lucide-react';

interface MobileAppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  requireAuth?: boolean;
}

export const MobileAppLayout = ({ children, showNav = true, requireAuth = false }: MobileAppLayoutProps) => {
  const { loading } = useAuth();
  useSystemTheme();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col app-typography">
      <main
        className="flex-1"
        style={{
          paddingBottom: showNav ? 'calc(4rem + var(--sab) + 12px)' : undefined
        }}
      >
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
};
