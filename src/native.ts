import { Capacitor } from '@capacitor/core';

/**
 * Runtime shell detection. The exact same web bundle runs in three places:
 *  - the browser / installed PWA        → isNativeApp() === false
 *  - the Capacitor iOS app (App Store)   → isNativeApp() === true, platform 'ios'
 *  - the Capacitor Android app           → isNativeApp() === true, platform 'android'
 *
 * Use this to branch the few things that must differ natively — e.g. skip the
 * service worker, hide "add to home screen" prompts, and (later) route the
 * paywall through Apple In-App Purchase instead of Stripe.
 */
export function isNativeApp(): boolean {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

export function nativePlatform(): 'ios' | 'android' | 'web' {
  try { return Capacitor.getPlatform() as 'ios' | 'android' | 'web'; } catch { return 'web'; }
}

export const isIOSApp = () => nativePlatform() === 'ios';
