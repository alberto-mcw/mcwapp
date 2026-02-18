import { useEffect } from 'react';

export const useSystemTheme = () => {
  useEffect(() => {
    const html = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      html.classList.toggle('dark', e.matches);
    };

    html.classList.toggle('dark', mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
      html.classList.remove('dark');
    };
  }, []);
};
