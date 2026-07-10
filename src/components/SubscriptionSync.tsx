import { useEffect } from 'react';
import { useApp } from '../store/AppStore';
import { usePlan } from '../engine/plan';

/**
 * Cross-context unlock. If a parent paid on Stripe (which, from an installed PWA,
 * happens in Safari — separate storage), the home-screen app won't know. So while
 * a parent isn't Premium, we ask Stripe by email whether they have an
 * active/trialing subscription — on launch and whenever the app returns to the
 * foreground — and unlock if so. Stops once Premium.
 */
export function SubscriptionSync() {
  const { state, dispatch } = useApp();
  const plan = usePlan();
  const email = state.parent?.email?.trim();

  useEffect(() => {
    if (!email || plan.isPremium || plan.admin) return;
    let cancelled = false;
    let last = 0;
    const check = () => {
      const now = Date.now();
      if (now - last < 20000 || !navigator.onLine) return; // throttle
      last = now;
      fetch(`/api/subscription?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((d: { premium?: boolean }) => {
          if (!cancelled && d?.premium) dispatch({ type: 'updateSettings', patch: { plan: 'premium' } });
        })
        .catch(() => { /* ignore */ });
    };
    check();
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
    };
  }, [email, plan.isPremium, plan.admin, dispatch]);

  return null;
}
