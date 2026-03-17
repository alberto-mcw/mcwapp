import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from './BottomNav';
import { useSystemTheme } from '@/hooks/useSystemTheme';
import { Loader2 } from 'lucide-react';

interface MobileAppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export const MobileAppLayout = ({ children, showNav = true }: MobileAppLayoutProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useSystemTheme();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/app/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && showNav) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col app-typography">
      <main 
        className="flex-1"
        style={{
          paddingBottom: showNav ? 'calc(4rem + env(safe-area-inset-bottom, 0px) + 12px)' : undefined
        }}
      >
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
};
