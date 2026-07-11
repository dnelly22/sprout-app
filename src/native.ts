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

/** Public site that hosts the legal pages (also the web app origin). */
export const SITE_ORIGIN = 'https://sprout-app-bice.vercel.app';

/**
 * Open a URL the right way per platform: in the native app use an in-app
 * Safari view (Apple-approved, keeps the user in the app); on the web open a
 * new tab. `path` may be absolute or a site-relative path like "/terms.html".
 */
export async function openUrl(path: string): Promise<void> {
  const url = path.startsWith('http') ? path : `${SITE_ORIGIN}${path}`;
  if (isNativeApp()) {
    try { const { Browser } = await import('@capacitor/browser'); await Browser.open({ url }); return; } catch { /* fall through */ }
  }
  window.open(url, '_blank', 'noopener');
}
