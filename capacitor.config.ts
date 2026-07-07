import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Change this bundle id before you submit (reverse-DNS you control in App Store Connect).
  appId: 'com.alenlor.sprout',
  appName: 'Sprout',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
};

export default config;
