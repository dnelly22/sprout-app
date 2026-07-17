import { SproutMeta } from 'sprout-meta';
import { AppTrackingTransparency } from 'capacitor-plugin-app-tracking-transparency';
import { isNativeApp } from './native';

/*
 * Meta (Facebook) app events — ad attribution for App Store install campaigns.
 *
 * Two independent signals reach Meta:
 *   1. SKAdNetwork — Apple's privacy-preserving attribution. Works with NO ATT
 *      consent, so installs/conversions still measure for everyone. Configured
 *      declaratively in Info.plist; nothing to call here.
 *   2. App events (this file) — richer, per-event signal. Only carries the
 *      advertiser id when the user granted ATT.
 *
 * Native only: every function no-ops on the web build.
 *
 * Privacy: the SDK is configured with auto-init and advertiser-id collection
 * OFF in Info.plist. We call setAdvertiserTrackingEnabled(true) *only* after
 * the user explicitly grants ATT, so a decline means no advertiser tracking.
 */

/** Meta's standard event names (fb_mobile_* are their reserved events). */
const EVENT = {
  startTrial: 'StartTrial',
  subscribe: 'Subscribe',
  completeRegistration: 'fb_mobile_complete_registration',
} as const;

let started = false;

/**
 * Boot the Meta SDK with the stored ATT decision and report the install/app-open.
 * Never prompts. Safe to call on every launch — the native side initialises once.
 */
export async function syncAdvertiserTracking(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { status } = await AppTrackingTransparency.getStatus();
    const allowed = status === 'authorized';
    if (!started) {
      await SproutMeta.initialize({ advertiserTracking: allowed });
      started = true;
    } else {
      await SproutMeta.setAdvertiserTrackingEnabled({ enabled: allowed });
    }
    return allowed;
  } catch {
    return false;
  }
}

/**
 * Show the ATT prompt once (iOS shows it a single time per install; afterwards
 * getStatus just returns the stored answer). Call AFTER first-run setup — never
 * on launch — so the parent has seen the product before the ask.
 */
export async function requestTrackingPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { status } = await AppTrackingTransparency.getStatus();
    // 'notDetermined' is the only state where iOS will actually show the sheet.
    if (status === 'notDetermined') await AppTrackingTransparency.requestPermission();
  } catch { /* ignore — fall through to sync the resulting status */ }
  return syncAdvertiserTracking();
}

/** Fire-and-forget event log; never throws into the UI. */
async function log(event: string, params?: Record<string, unknown>) {
  if (!isNativeApp()) return;
  try { await SproutMeta.logEvent({ event, params: params ?? {} }); } catch { /* ignore */ }
}

/** The parent finished onboarding (account + child created). */
export function metaCompleteRegistration() {
  void log(EVENT.completeRegistration);
}

/** A 7-day free trial started. `value` = the plan's price (revenue signal). */
export function metaStartTrial(plan: 'annual' | 'monthly', value: number) {
  void log(EVENT.startTrial, {
    fb_currency: 'USD',
    _valueToSum: value,
    fb_content_id: plan === 'annual' ? 'sprout_premium_annual' : 'sprout_premium_monthly',
    fb_content_type: 'subscription',
  });
}

/** A paid subscription began (trial converted, or a direct purchase). */
export function metaSubscribe(plan: 'annual' | 'monthly', value: number) {
  void log(EVENT.subscribe, {
    fb_currency: 'USD',
    _valueToSum: value,
    fb_content_id: plan === 'annual' ? 'sprout_premium_annual' : 'sprout_premium_monthly',
    fb_content_type: 'subscription',
  });
}
