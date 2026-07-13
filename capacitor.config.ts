import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Change this bundle id before you submit (reverse-DNS you control in App Store Connect).
  appId: 'com.alenlor.sprout',
  appName: 'Sprout',
  webDir: 'dist',
  ios: {
    // We handle safe areas ourselves in CSS (env(safe-area-inset-*) + viewport-fit=cover),
    // so tell the WebView NOT to auto-adjust content insets — otherwise it double-insets
    // and the bottom bar gets clipped. 'never' = content is edge-to-edge, CSS does the rest.
    contentInset: 'never',
  },
};

export default config;
