import { registerSW } from 'virtual:pwa-register';

/**
 * Register the service worker and keep the installed (home-screen) app fresh.
 *
 * autoUpdate mode skip-waits and activates a new build immediately. The catch
 * on phones is that a home-screen PWA resumes from memory without checking for
 * a new build, and iOS doesn't reliably auto-reload when one activates. So we:
 *   1. force an update check whenever the app is (re)opened / re-focused, and
 *   2. hard-reload the page the moment a NEW service worker takes control
 *      (guarded so we never reload on the first install or loop).
 */
export function initPWA() {
  if ('serviceWorker' in navigator) {
    const hadController = !!navigator.serviceWorker.controller; // false on first-ever load
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Only reload for a real update (there was already a controller), once.
      if (reloading || !hadController) return;
      reloading = true;
      window.location.reload();
    });
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, r) {
      if (!r) return;
      const check = () => { if (navigator.onLine) r.update().catch(() => {}); };
      // The key case: a home-screen app coming back to the foreground.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      window.addEventListener('focus', check);
      setInterval(check, 15 * 60 * 1000); // safety net for long-lived sessions
    },
  });
}
