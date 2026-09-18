import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vpsesportshub.app',
  appName: 'VPS EsportsHub',
  webDir: 'public',
  server: {
    url: 'https://vps-esportshub.vercel.app',
    cleartext: true
  }
};

export default config;
