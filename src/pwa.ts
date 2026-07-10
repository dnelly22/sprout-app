import { registerSW } from 'virtual:pwa-register';

/**
 * Register the service worker and keep the installed (home-screen) app fresh.
 *
 * The plugin is in `autoUpdate` mode: when a new build is found, the SW skips
 * waiting and reloads the page into the new version — no prompt. The problem on
 * phones is that a home-screen app resumes from memory without ever *checking*
 * for a new build, so it never notices a deploy. Here we force a check at the
 * natural moments — when the app is (re)opened or brought back to the
 * foreground — plus a slow interval as a safety net. When a check finds a new
 * build, autoUpdate reloads automatically.
 */
export function initPWA() {
  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, r) {
      if (!r) return;
      const check = () => { if (navigator.onLine) r.update().catch(() => {}); };
      // Re-check whenever the app comes back to the foreground (the key case for
      // a home-screen app resuming from memory) and on window focus.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      window.addEventListener('focus', check);
      // Safety net for long-lived sessions.
      setInterval(check, 15 * 60 * 1000);
    },
  });
  return updateSW;
}
