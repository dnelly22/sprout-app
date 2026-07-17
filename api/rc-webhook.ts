/*
 * RevenueCat webhook → Meta App Events API (server-side conversions).
 *
 * Why this exists: the in-app SDK can only report what happens while the app is
 * open. The event that actually matters — a 7-day trial converting to PAID —
 * happens on Apple's servers days later, with the app closed. RevenueCat sees
 * it and calls us; we forward it to Meta so ad campaigns can optimise on real
 * revenue instead of trial-starts.
 *
 * Wire it up in RevenueCat → Project Settings → Integrations → Webhooks:
 *   URL:            https://<your-domain>/api/rc-webhook
 *   Authorization:  the same value you set in RC_WEBHOOK_SECRET
 *
 * Env vars (Vercel, never in the repo):
 *   META_DATASET_ID       1401455635158138 — the Meta *dataset* (Events Manager),
 *                         NOT the app id. CAPI posts to the dataset.
 *   META_CAPI_TOKEN       Conversions API access token (SECRET)
 *   RC_WEBHOOK_SECRET     shared secret; must match RevenueCat's Authorization header
 *   META_TEST_EVENT_CODE  optional — set while testing in Events Manager
 *
 * No-ops with 200 if unconfigured, so nothing breaks before setup.
 */

import { createHash } from 'crypto';

interface Req {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}
interface Res {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  end: () => void;
}

const GRAPH = 'https://graph.facebook.com/v21.0';

/** RevenueCat event → Meta event name. Anything unmapped is ignored. */
const EVENT_MAP: Record<string, string> = {
  TRIAL_STARTED: 'StartTrial',
  INITIAL_PURCHASE: 'Subscribe',   // direct purchase with no trial
  TRIAL_CONVERTED: 'Subscribe',    // ← the money event
  RENEWAL: 'Subscribe',
  UNCANCELLATION: 'Subscribe',
};

const sha256 = (v: string) => createHash('sha256').update(v.trim().toLowerCase()).digest('hex');

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }

  const APP_ID = process.env.META_DATASET_ID;
  const TOKEN = process.env.META_CAPI_TOKEN;
  const SECRET = process.env.RC_WEBHOOK_SECRET;
  const TEST_CODE = process.env.META_TEST_EVENT_CODE;

  // Reject spoofed calls — anyone can POST to a public URL.
  if (SECRET) {
    const auth = req.headers['authorization'];
    const got = Array.isArray(auth) ? auth[0] : auth;
    if (got !== SECRET) { res.status(401).json({ error: 'unauthorized' }); return; }
  }
  if (!APP_ID || !TOKEN) { res.status(200).json({ ok: true, skipped: 'not_configured' }); return; }

  let payload: Record<string, unknown> = {};
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as Record<string, unknown>) || {};
  } catch { payload = {}; }

  const ev = (payload.event ?? {}) as Record<string, unknown>;
  const type = String(ev.type ?? '');
  const metaEvent = EVENT_MAP[type];
  // Always 200 on unmapped events so RevenueCat doesn't retry them forever.
  if (!metaEvent) { res.status(200).json({ ok: true, ignored: type }); return; }

  // Sandbox purchases must never pollute real ad optimisation.
  if (ev.environment === 'SANDBOX') { res.status(200).json({ ok: true, skipped: 'sandbox' }); return; }

  const price = Number(ev.price_in_purchased_currency ?? ev.price ?? 0);
  const currency = String(ev.currency ?? 'USD');
  const productId = String(ev.product_id ?? '');
  const attrs = (ev.subscriber_attributes ?? {}) as Record<string, { value?: string }>;
  const email = attrs.$email?.value ?? attrs.email?.value;

  // Match quality: hashed email (if we have it) + RevenueCat's anonymous id.
  // Never send raw PII — Meta requires SHA-256 for user identifiers.
  const user_data: Record<string, unknown> = {};
  if (email) user_data.em = [sha256(email)];
  const appUserId = ev.app_user_id ?? ev.original_app_user_id;
  if (appUserId) user_data.external_id = [sha256(String(appUserId))];

  const body = {
    data: [{
      event_name: metaEvent,
      event_time: Math.floor(Number(ev.event_timestamp_ms ?? Date.now()) / 1000),
      event_id: String(ev.id ?? `${type}-${ev.event_timestamp_ms ?? Date.now()}`), // dedupes vs the SDK
      action_source: 'app',
      user_data,
      // App-linked datasets reject action_source:'app' without app_data.extinfo.
      // These events originate server-side (no device), so tracking flags are 0
      // and extinfo carries only the bundle id + a nominal OS version — enough
      // to pass validation. (extinfo[0]='i2' is the iOS format version.)
      app_data: {
        advertiser_tracking_enabled: 0,
        application_tracking_enabled: 0,
        extinfo: ['i2', 'com.alenlor.sproutapp', '', '', '17.0', '', '', '', '', '', '', '', '', '', '', ''],
      },
      custom_data: {
        currency,
        value: price,
        content_type: 'subscription',
        content_ids: [productId],
      },
    }],
    ...(TEST_CODE ? { test_event_code: TEST_CODE } : {}),
  };

  try {
    const r = await fetch(`${GRAPH}/${APP_ID}/events?access_token=${encodeURIComponent(TOKEN)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const out = await r.json().catch(() => ({}));
    // 200 back to RevenueCat regardless: a Meta hiccup shouldn't trigger endless
    // webhook retries. Failures are visible in Events Manager + Vercel logs.
    res.status(200).json({ ok: r.ok, event: metaEvent, meta: out });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e) });
  }
}
