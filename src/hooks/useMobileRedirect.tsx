import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useMobileRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if already on /app routes
    if (location.pathname.startsWith('/app')) {
      return;
    }

    // ONLY check for actual mobile devices via user agent
    // This does NOT affect desktop responsive behavior
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobileDevice) {
      // Map desktop routes to mobile routes
      const routeMap: Record<string, string> = {
        '/': '/app',
        '/dashboard': '/app',
        '/calendario': '/app/calendario',
        '/videos': '/app/galeria',
        '/profile': '/app/perfil',
        '/auth': '/app/auth',
        '/ranking': '/app/ranking',
      };

      const mobileRoute = routeMap[location.pathname];
      if (mobileRoute) {
        navigate(mobileRoute, { replace: true });
      }
    }
  }, [location.pathname, navigate]);
};

