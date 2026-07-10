import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { trackBrowser } from '../analytics';
import { popBg, PopButton, INK } from '../components/pop';
import { Mascot } from './kidzone/Mascot';

/**
 * Stripe checkout success landing (redirect target:
 *   /success?session_id={CHECKOUT_SESSION_ID}).
 * Fires the browser StartTrial (deduped with the server webhook via
 * event_id = session id) and unlocks the app locally.
 */
export function Success() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Stripe is running the card-gated trial → unlock the full app locally.
    dispatch({ type: 'updateSettings', patch: { plan: 'premium', trialStart: undefined } });
    if (!sessionId) { setReady(true); return; }
    fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d: { amount?: number; currency?: string; planName?: string }) => {
        trackBrowser(
          'StartTrial',
          { value: d.amount ?? 0, currency: d.currency || 'USD', content_name: d.planName || 'Sprout Subscription' },
          sessionId, // must equal the webhook's event_id (the Stripe session id)
        );
      })
      .catch(() => { /* pixel is best-effort; the webhook is the source of truth */ })
      .finally(() => setReady(true));
  }, [sessionId, dispatch]);

  return (
    <div style={{ minHeight: '100dvh', ...popBg, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ maxWidth: 360 }}>
        <div style={{ width: 96, height: 96, margin: '0 auto 18px', borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #EAF6E2, #BFE3CB)', border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
          <Mascot mood="jump1" size={80} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: INK, margin: '0 0 8px' }}>Welcome to Sprout! 🌱</h1>
        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink-600)', margin: '0 0 22px', lineHeight: 1.5 }}>
          Your 7-day free trial is active — the whole app is unlocked for your family.
        </p>
        <PopButton fullWidth disabled={!ready} onClick={() => navigate('/today', { replace: true })}>
          Enter Sprout
        </PopButton>
      </div>
    </div>
  );
}
