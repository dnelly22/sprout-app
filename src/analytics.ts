/*
 * One analytics entry point for the whole app + funnel.
 *
 * Every event is sent TWICE with a shared `event_id`:
 *   1. the browser Meta Pixel (window.fbq) — see index.html, SPROUT_PIXEL_ID
 *   2. the Conversions API via /api/capi (server-side) — better match quality,
 *      recovers events the pixel misses (ad blockers, ITP, in-app browsers)
 * Meta dedupes the two by (event_name, event_id).
 *
 * Attribution note: funnel events (in the ad's browser session, with the _fbc
 * cookie) attribute well. Post-install events inside the standalone PWA lack the
 * ad-click cookie, so even server-side they're weakly attributed — Stripe is the
 * source of truth for real subscription counts.
 */

type Params = Record<string, unknown>;

function fbq(): ((...a: unknown[]) => void) | undefined {
  return (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
}

function newEventId(): string {
  try { return crypto.randomUUID(); } catch { return 'e-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9); }
}

function cookie(name: string): string | undefined {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : undefined;
}

/**
 * Capture the ad click id on landing and store Meta's `_fbc` cookie if the pixel
 * hasn't already. Call once on funnel entry so click attribution survives.
 */
export function captureClickId() {
  try {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid');
    if (fbclid && !cookie('_fbc')) {
      const val = `fb.1.${Date.now()}.${fbclid}`;
      document.cookie = `_fbc=${val}; max-age=${90 * 86400}; path=/; SameSite=Lax`;
    }
  } catch { /* ignore */ }
}

/** Send the event to the Conversions API (fire-and-forget; skipped in dev). */
function sendCapi(event_name: string, event_id: string, params?: Params) {
  if (import.meta.env.DEV) return; // no serverless function under vite dev
  try {
    fetch('/api/capi', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        event_name,
        event_id,
        event_source_url: window.location.href,
        custom_data: params || {},
        fbc: cookie('_fbc'),
        fbp: cookie('_fbp'),
      }),
    }).catch(() => { /* ignore */ });
  } catch { /* ignore */ }
}

function fire(method: 'track' | 'trackCustom', event: string, params?: Params) {
  const event_id = newEventId();
  const f = fbq();
  if (f) { try { f(method, event, params || {}, { eventID: event_id }); } catch { /* ignore */ } }
  sendCapi(event, event_id, params);
  if (import.meta.env.DEV) console.log(`%c[pixel:${method}] ` + event, 'color:#7A5AD9;font-weight:bold', params || '');
}

/** Standard Meta events: Lead, StartTrial, Subscribe, InitiateCheckout, ViewContent… */
export function track(event: string, params?: Params) { fire('track', event, params); }

/** Custom (non-standard) Meta events, e.g. AddToHomeScreen. */
export function trackCustom(event: string, params?: Params) { fire('trackCustom', event, params); }

/** Fire an event at most once per device (dedupes install / trial / subscribe on relaunch). */
export function trackOnce(key: string, event: string, params?: Params, custom = false) {
  const flag = 'evt_' + key;
  try {
    if (localStorage.getItem(flag)) return;
    localStorage.setItem(flag, String(Date.now()));
  } catch { /* ignore */ }
  fire(custom ? 'trackCustom' : 'track', event, params);
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
