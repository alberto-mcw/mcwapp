import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5e05c00f02e64c3c98e8142a7190b0ac',
  appName: 'mcwapp',
  webDir: 'dist',
  server: {
    url: 'https://5e05c00f-02e6-4c3c-98e8-142a7190b0ac.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
