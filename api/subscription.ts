/*
 * "Is this parent subscribed?" — looks up Stripe by email and reports whether
 * there's an active or trialing subscription. This is how the installed
 * home-screen app unlocks after a checkout that completed in Safari (separate
 * storage): the app asks Stripe directly instead of relying on the browser it
 * paid in. Reads STRIPE_SECRET_KEY from Vercel env.
 */
import Stripe from 'stripe';

interface Req { method?: string; url?: string; headers: Record<string, string | string[] | undefined> }
interface Res { status: (code: number) => Res; json: (body: unknown) => void; end: () => void }

const KEY = process.env.STRIPE_SECRET_KEY || '';
const stripe = KEY ? new Stripe(KEY) : null;

export default async function handler(req: Req, res: Res) {
  const email = new URL(req.url || '/', 'http://localhost').searchParams.get('email');
  if (!email) { res.status(400).json({ error: 'missing email' }); return; }
  if (!stripe) { res.status(200).json({ premium: false, configured: false }); return; }
  try {
    const customers = await stripe.customers.list({ email: email.trim().toLowerCase(), limit: 5 });
    for (const c of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: c.id, status: 'all', limit: 10 });
      if (subs.data.some((s) => s.status === 'active' || s.status === 'trialing')) {
        res.status(200).json({ premium: true });
        return;
      }
    }
    res.status(200).json({ premium: false });
  } catch (e) {
    res.status(200).json({ premium: false, error: String(e) });
  }
}
