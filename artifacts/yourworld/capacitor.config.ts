import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourworld.app',
  appName: 'YourWorld',
  webDir: '.output/public',
  server: {
    url: 'https://your-world-social-app--yourworld2029.replit.app',
    cleartext: true
  }
};

export default config;
