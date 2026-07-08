/*
 * Meta Conversions API (CAPI) endpoint — Vercel serverless function.
 *
 * The browser pixel and this server both send the same event with a shared
 * `event_id`; Meta dedupes them. Server-side events carry the visitor's IP +
 * user-agent + fbc/fbp, which improves match quality and recovers events the
 * browser pixel can't attribute (ad blockers, ITP, in-app browsers).
 *
 * Secrets live in Vercel env vars (never in the repo):
 *   META_PIXEL_ID          your pixel id (also public in index.html)
 *   META_CAPI_TOKEN        Conversions API access token (SECRET)
 *   META_TEST_EVENT_CODE   optional — set while testing in Events Manager
 *
 * If the pixel id or token isn't configured, this no-ops with 200 so nothing
 * breaks before you've set them.
 */

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

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }

  const PIXEL_ID = process.env.META_PIXEL_ID;
  const TOKEN = process.env.META_CAPI_TOKEN;
  const TEST_CODE = process.env.META_TEST_EVENT_CODE;
  if (!PIXEL_ID || !TOKEN) { res.status(200).json({ ok: true, skipped: 'not_configured' }); return; }

  let payload: Record<string, unknown> = {};
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as Record<string, unknown>) || {};
  } catch { payload = {}; }

  const {
    event_name, event_id, event_source_url, custom_data, fbc, fbp, external_id,
  } = payload as {
    event_name?: string; event_id?: string; event_source_url?: string;
    custom_data?: Record<string, unknown>; fbc?: string; fbp?: string; external_id?: string;
  };
  if (!event_name) { res.status(400).json({ error: 'missing_event_name' }); return; }

  const xff = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(xff) ? xff[0] : xff || '').split(',')[0].trim() || undefined;
  const ua = req.headers['user-agent'];

  const user_data: Record<string, unknown> = {};
  if (ip) user_data.client_ip_address = ip;
  if (ua) user_data.client_user_agent = Array.isArray(ua) ? ua[0] : ua;
  if (fbc) user_data.fbc = fbc;
  if (fbp) user_data.fbp = fbp;
  if (external_id) user_data.external_id = external_id;

  const body = {
    data: [{
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id,
      action_source: 'website',
      event_source_url,
      user_data,
      custom_data: custom_data || {},
    }],
    ...(TEST_CODE ? { test_event_code: TEST_CODE } : {}),
  };

  try {
    const r = await fetch(`${GRAPH}/${PIXEL_ID}/events?access_token=${encodeURIComponent(TOKEN)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await r.json().catch(() => ({}));
    res.status(r.ok ? 200 : 502).json({ ok: r.ok, meta: json });
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e) });
  }
}
