import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MOBILE_BREAKPOINT = 768;

export const useMobileRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if already on /app routes
    if (location.pathname.startsWith('/app')) {
      return;
    }

    // Check if user agent is mobile OR viewport is mobile-sized
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    const isMobileViewport = window.innerWidth < MOBILE_BREAKPOINT;

    if (isMobileDevice || isMobileViewport) {
      // Map desktop routes to mobile routes
      const routeMap: Record<string, string> = {
        '/': '/app',
        '/dashboard': '/app',
        '/calendario': '/app/calendario',
        '/videos': '/app/galeria',
        '/profile': '/app/perfil',
        '/auth': '/app/auth',
      };

      const mobileRoute = routeMap[location.pathname];
      if (mobileRoute) {
        navigate(mobileRoute, { replace: true });
      }
    }
  }, [location.pathname, navigate]);
};

// HOC to wrap pages that should redirect to mobile
export const withMobileRedirect = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return function WithMobileRedirect(props: P) {
    useMobileRedirect();
    return <Component {...props} />;
  };
};
