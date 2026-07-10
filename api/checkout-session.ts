/*
 * Returns the real amount/currency/plan for a completed Stripe Checkout Session,
 * so the /success page can fire a browser StartTrial with correct values.
 * Reads STRIPE_SECRET_KEY from Vercel env. Never exposes the secret to the client.
 */
import Stripe from 'stripe';

interface Req { method?: string; url?: string; headers: Record<string, string | string[] | undefined> }
interface Res { status: (code: number) => Res; json: (body: unknown) => void; end: () => void }

const KEY = process.env.STRIPE_SECRET_KEY || '';
const stripe = KEY ? new Stripe(KEY) : null;
const FALLBACK = { amount: 0, currency: 'USD', planName: 'Sprout Subscription' };

export default async function handler(req: Req, res: Res) {
  const sessionId = new URL(req.url || '/', 'http://localhost').searchParams.get('session_id');
  if (!sessionId) { res.status(400).json({ error: 'missing session_id' }); return; }
  if (!stripe) { res.status(200).json(FALLBACK); return; }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });
    res.status(200).json({
      amount: (session.amount_total || 0) / 100,
      currency: (session.currency || 'usd').toUpperCase(),
      planName: session.line_items?.data?.[0]?.description || 'Sprout Subscription',
    });
  } catch {
    res.status(200).json(FALLBACK);
  }
}
