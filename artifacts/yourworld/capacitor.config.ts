import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourworld.app',
  appName: 'YourWorld',
  webDir: '.output/capacitor',
  backgroundColor: '#000000',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT'
    },
    Keyboard: {
      resize: 'none',
      resizeOnFullScreen: false
    }
  }
};

export default config;
