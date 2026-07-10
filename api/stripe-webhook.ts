/*
 * Stripe webhook → Meta Conversions API.
 *   checkout.session.completed → StartTrial  (card-gated trial signup; primary
 *     optimization event). event_id = the Checkout Session id, so it dedupes
 *     against the browser StartTrial fired on /success.
 *   invoice.paid (amount > 0, subscription_cycle) → Purchase (true revenue).
 *
 * Env (Vercel, never in the repo):
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, META_CAPI_TOKEN, META_PIXEL_ID,
 *   META_TEST_EVENT_CODE (optional, while testing in Events Manager).
 *
 * Needs the RAW request body for signature verification, so body parsing is off.
 */
import Stripe from 'stripe';
import crypto from 'crypto';

export const config = { api: { bodyParser: false } };

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  [Symbol.asyncIterator]?: () => AsyncIterator<Buffer | string>;
}
interface Res { status: (code: number) => Res; json: (body: unknown) => void; end: () => void }

const KEY = process.env.STRIPE_SECRET_KEY || '';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const PIXEL_ID = process.env.META_PIXEL_ID || '923048483890783';
const CAPI_TOKEN = process.env.META_CAPI_TOKEN || '';
const TEST_CODE = process.env.META_TEST_EVENT_CODE;
const GRAPH = 'https://graph.facebook.com/v21.0';
const SOURCE_URL = 'https://sprout-app-bice.vercel.app/success';

const stripe = KEY ? new Stripe(KEY) : null;
const sha256 = (v: string) => crypto.createHash('sha256').update(v.trim().toLowerCase()).digest('hex');

async function readRawBody(req: Req): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as unknown as AsyncIterable<Buffer | string>) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function sendToMeta(eventName: string, eventId: string, email: string | undefined, value: number | undefined, currency: string | undefined) {
  if (!CAPI_TOKEN || !PIXEL_ID) return;
  const user_data: Record<string, unknown> = {};
  if (email) user_data.em = [sha256(email)];
  const body = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: SOURCE_URL,
      user_data,
      custom_data: value != null ? { value, currency: (currency || 'usd').toUpperCase() } : {},
    }],
    ...(TEST_CODE ? { test_event_code: TEST_CODE } : {}),
  };
  await fetch(`${GRAPH}/${PIXEL_ID}/events?access_token=${encodeURIComponent(CAPI_TOKEN)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => { /* ignore */ });
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return; }
  if (!stripe || !WEBHOOK_SECRET) { res.status(200).json({ ok: true, skipped: 'not_configured' }); return; }

  let event: Stripe.Event;
  try {
    const raw = await readRawBody(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(raw, (Array.isArray(sig) ? sig[0] : sig) || '', WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).json({ error: 'signature_verification_failed', detail: String(err) });
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object as Stripe.Checkout.Session;
      await sendToMeta('StartTrial', s.id, s.customer_details?.email || undefined, (s.amount_total || 0) / 100, s.currency || 'usd');
    } else if (event.type === 'invoice.paid') {
      const inv = event.data.object as Stripe.Invoice;
      if ((inv.amount_paid || 0) > 0 && inv.billing_reason === 'subscription_cycle') {
        await sendToMeta('Purchase', inv.id || `inv_${Date.now()}`, inv.customer_email || undefined, inv.amount_paid / 100, inv.currency || 'usd');
      }
    }
  } catch { /* don't fail the webhook over a tracking hiccup */ }

  res.status(200).json({ received: true });
}
