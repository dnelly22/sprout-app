import { useApp, type Settings } from '../store/AppStore';

/*
 * Sprouts Premium subscription model (one plan, per spec):
 *  - free: preview access (1 parent lesson, 1 Journey sample, 1 Quick Fire,
 *    1 Say It Out Loud, limited previews). Locked cards show PREMIUM.
 *  - trial: 7 days, same access as premium. Expires into free.
 *  - premium: full access, up to 3 child profiles.
 * Admin (unlock code) behaves as premium and reveals admin tools.
 */

export const TRIAL_DAYS = 7;
export const PRICE = { monthly: '$14.99', annual: '$99', annualPerMonth: '$8.25', save: '45%' } as const;

/**
 * Live Stripe Payment Links (card upfront; Stripe runs the 7-day trial).
 * On success Stripe should redirect back to the app with ?upgraded=1&plan=…
 * so it unlocks Premium (see App.tsx).
 */
export const STRIPE_LINKS = {
  monthly: 'https://buy.stripe.com/eVq5kCeuS2A2gR5gQvcV201',
  annual: 'https://buy.stripe.com/eVqdR8biGfmO6cr7fVcV202',
} as const;
/** Send the parent to Stripe checkout for the chosen plan. */
export function goToCheckout(plan: 'annual' | 'monthly') {
  const url = plan === 'annual' ? STRIPE_LINKS.annual : STRIPE_LINKS.monthly;
  if (!url) return;
  // Brief delay so the InitiateCheckout pixel beacon fires before we navigate
  // away to Stripe (an instant redirect can cut the browser event off).
  setTimeout(() => { window.location.href = url; }, 350);
}
export const MAX_CHILDREN_PREMIUM = 3;
export const MAX_CHILDREN_FREE = 1;

/** Free-plan preview content. */
export const FREE_SCENARIO_ID = 'friends-01';
export const FREE_LESSON_INDEX = 0; // first lesson in the library list

export type PlanTier = 'free' | 'trial' | 'premium';

export interface PlanState {
  tier: PlanTier;
  isPremium: boolean;       // trial or premium (or admin)
  trialDaysLeft: number;    // 0 when not on trial
  trialExpired: boolean;    // was on trial, ran out
  renewalText: string;      // for plan management UI
  admin: boolean;
}

export function planState(settings: Settings): PlanState {
  const admin = !!settings.admin;
  const plan = settings.plan === 'plus' ? 'premium' : (settings.plan ?? 'free');
  // an EXPLICIT free plan wins even for admins (lets admins preview the locked
  // experience via Settings → Admin tools → "Switch to free plan")
  if (settings.plan === 'free') {
    return { tier: 'free', isPremium: false, trialDaysLeft: 0, trialExpired: false, renewalText: 'Free preview', admin };
  }
  if (admin || plan === 'premium') {
    return { tier: 'premium', isPremium: true, trialDaysLeft: 0, trialExpired: false, renewalText: 'Sprouts Premium · active', admin };
  }
  if (plan === 'trial' && settings.trialStart) {
    const left = TRIAL_DAYS - Math.floor((Date.now() - settings.trialStart) / 86400000);
    if (left > 0) {
      const ends = new Date(settings.trialStart + TRIAL_DAYS * 86400000);
      return { tier: 'trial', isPremium: true, trialDaysLeft: left, trialExpired: false, renewalText: `Free trial · ends ${ends.toLocaleDateString()}`, admin };
    }
    return { tier: 'free', isPremium: false, trialDaysLeft: 0, trialExpired: true, renewalText: 'Free trial ended', admin };
  }
  return { tier: 'free', isPremium: false, trialDaysLeft: 0, trialExpired: false, renewalText: 'Free preview', admin };
}

export function usePlan(): PlanState {
  const { state } = useApp();
  return planState(state.settings);
}
