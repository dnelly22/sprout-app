/*
 * One analytics entry point for the whole app + funnel.
 *
 * Fires the Meta Pixel (window.fbq) when it's configured — see index.html, where
 * you paste your Pixel ID into SPROUT_PIXEL_ID. If no pixel is configured it just
 * logs in dev and no-ops in production, so it's safe to ship before you have an ID.
 *
 * Attribution note: funnel events (in the ad's browser session) attribute well;
 * post-install events (StartTrial/Subscribe, fired inside the standalone PWA)
 * are best-effort — a browser pixel can't reliably tie them back to the ad click
 * without a backend + Meta Conversions API. Treat Stripe as the source of truth
 * for actual subscription counts.
 */

type Params = Record<string, unknown>;

function fbq(): ((...a: unknown[]) => void) | undefined {
  return (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
}

/** Standard Meta events: Lead, StartTrial, Subscribe, InitiateCheckout, ViewContent… */
export function track(event: string, params?: Params) {
  const f = fbq();
  if (f) { try { f('track', event, params || {}); } catch { /* ignore */ } }
  if (import.meta.env.DEV) console.log('%c[pixel] ' + event, 'color:#7A5AD9;font-weight:bold', params || '');
}

/** Custom (non-standard) Meta events, e.g. AddToHomeScreen. */
export function trackCustom(event: string, params?: Params) {
  const f = fbq();
  if (f) { try { f('trackCustom', event, params || {}); } catch { /* ignore */ } }
  if (import.meta.env.DEV) console.log('%c[pixel:custom] ' + event, 'color:#1F8A5B;font-weight:bold', params || '');
}

/** Fire an event at most once per device (dedupes install / trial / subscribe on relaunch). */
export function trackOnce(key: string, event: string, params?: Params, custom = false) {
  const flag = 'evt_' + key;
  try {
    if (localStorage.getItem(flag)) return;
    localStorage.setItem(flag, String(Date.now()));
  } catch { /* ignore */ }
  (custom ? trackCustom : track)(event, params);
}

/** Is the app running as an installed PWA (opened from the home screen)? */
export function isStandalone(): boolean {
  try {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  } catch { return false; }
}

/**
 * The truest "an install happened" signal we can get on the web: the first time
 * the app boots in standalone mode. Call once at startup.
 */
export function trackInstallIfStandalone() {
  if (isStandalone()) trackOnce('a2hs', 'AddToHomeScreen', { via: 'standalone_launch' }, true);
}
