/*
 * Funnel lead capture. The /start funnel POSTs {name, email, quiz answers}
 * here when the parent submits the "where should we send your plan?" step.
 *
 * Two jobs, both best-effort (always returns 200 so the funnel never stalls):
 *   1. Append a row to a Google Sheet via a Google Apps Script Web App URL
 *      (env LEAD_SHEET_URL). Server-to-server, so no browser CORS issues.
 *   2. Fire a server-side Meta CAPI `Lead` with the hashed email/name for high
 *      match quality. Shares the browser pixel's event_id so Meta dedupes them.
 *
 * Env (all optional — each half no-ops if unset):
 *   LEAD_SHEET_URL     Apps Script Web App /exec URL that appends the row
 *   META_PIXEL_ID      pixel id (also public in index.html)
 *   META_CAPI_TOKEN    Conversions API token (SECRET)
 *   META_TEST_EVENT_CODE  optional, while testing in Events Manager
 */
import { createHash } from 'crypto';

interface Req { method?: string; body?: unknown; headers: Record<string, string | string[] | undefined> }
interface Res { status: (code: number) => Res; json: (body: unknown) => void; end: () => void }

const GRAPH = 'https://graph.facebook.com/v21.0';
const sha256 = (v: string) => createHash('sha256').update(v.trim().toLowerCase()).digest('hex');
const one = (h: string | string[] | undefined) => (Array.isArray(h) ? h[0] : h) || '';
function readCookie(cookieHeader: string, name: string): string | undefined {
  const m = cookieHeader.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : undefined;
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }

  let p: Record<string, unknown> = {};
  try { p = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as Record<string, unknown>) || {}; } catch { p = {}; }

  const name = String(p.name || '').trim();
  const email = String(p.email || '').trim().toLowerCase();
  const kidWorld = String(p.kidWorld || '');
  const parentTrack = String(p.parentTrack || '');
  const angle = String(p.angle || '');
  const event_id = String(p.event_id || '');
  const event_source_url = String(p.event_source_url || '');
  const asStr = (v: unknown) => (Array.isArray(v) ? v.join(', ') : String(v ?? ''));
  const q1 = asStr(p.q1), q2 = asStr(p.q2), q3 = asStr(p.q3), q4 = asStr(p.q4);

  if (!email || !name) { res.status(400).json({ error: 'missing_name_or_email' }); return; }

  const cookieHeader = one(req.headers.cookie);
  const fbc = readCookie(cookieHeader, '_fbc');
  const fbp = readCookie(cookieHeader, '_fbp');
  const xff = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(xff) ? xff[0] : xff || '').split(',')[0].trim() || undefined;
  const ua = one(req.headers['user-agent']) || undefined;

  const results: Record<string, unknown> = {};

  // 1) Google Sheet append (via Apps Script webhook)
  const SHEET = process.env.LEAD_SHEET_URL;
  if (SHEET) {
    try {
      const r = await fetch(SHEET, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ts: new Date().toISOString(), name, email, kidWorld, parentTrack, q1, q2, q3, q4, angle }),
      });
      results.sheet = r.ok ? 'ok' : `http_${r.status}`;
    } catch (e) { results.sheet = 'error:' + String(e); }
  } else { results.sheet = 'skipped_no_url'; }

  // 2) Meta CAPI Lead (hashed PII, shares the browser event_id → deduped)
  const PIXEL_ID = process.env.META_PIXEL_ID;
  const TOKEN = process.env.META_CAPI_TOKEN;
  if (PIXEL_ID && TOKEN) {
    const parts = name.split(/\s+/).filter(Boolean);
    const user_data: Record<string, unknown> = { em: sha256(email) };
    if (parts[0]) user_data.fn = sha256(parts[0]);
    if (parts.length > 1) user_data.ln = sha256(parts.slice(1).join(' '));
    if (ip) user_data.client_ip_address = ip;
    if (ua) user_data.client_user_agent = ua;
    if (fbc) user_data.fbc = fbc;
    if (fbp) user_data.fbp = fbp;
    const body = {
      data: [{
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_id,
        action_source: 'website',
        event_source_url,
        user_data,
        custom_data: { content_name: 'funnel_complete', kidWorld, parentTrack },
      }],
      ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
    };
    try {
      const r = await fetch(`${GRAPH}/${PIXEL_ID}/events?access_token=${encodeURIComponent(TOKEN)}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      });
      results.capi = r.ok ? 'ok' : `http_${r.status}`;
    } catch (e) { results.capi = 'error:' + String(e); }
  } else { results.capi = 'skipped_not_configured'; }

  res.status(200).json({ ok: true, ...results });
}
