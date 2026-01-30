import { useState, useEffect } from 'react';

export type DeviceOS = 'ios' | 'android' | 'other';

export const useDeviceOS = (): DeviceOS => {
  const [os, setOS] = useState<DeviceOS>('other');

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // iOS detection
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setOS('ios');
      return;
    }
    
    // Android detection
    if (/android/i.test(userAgent)) {
      setOS('android');
      return;
    }
    
    setOS('other');
  }, []);

  return os;
};
