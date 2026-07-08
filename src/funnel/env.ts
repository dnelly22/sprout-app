/* Landing-funnel install-environment detection + analytics stub. */

export type Env = 'installed' | 'inapp' | 'ios' | 'android' | 'other';

/** Detect whether we're in a PWA, an in-app browser (Meta/IG/TikTok…), iOS, or Android. */
export function detectEnv(): Env {
  try {
    const standalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return 'installed';
    const ua = navigator.userAgent || '';
    // in-app browsers that CANNOT add to the home screen (the core launch problem)
    if (/FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|Pinterest|TikTok|musical_ly|WeChat|MicroMessenger|GSA/i.test(ua)) return 'inapp';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
  } catch { /* ignore */ }
  return 'other';
}

/** Desktop falls back to the Android one-tap path (has beforeinstallprompt). */
export function resolveEnv(detected: Env): Exclude<Env, 'other'> {
  return detected === 'other' ? 'android' : detected;
}

// Funnel events route through the shared analytics entry point (src/analytics.ts).
export { track, trackCustom, trackOnce } from '../analytics';

/* ---- answer → plan mapping (drives the Recommendation beat + app pass-through) ---- */
export const KID_MAP: Record<string, string> = {
  freeze: 'Talking', givein: 'Boundaries', meltdown: 'Big Feelings', friends: 'Friends', teasing: 'Teasing', pushy: 'People',
};
export const KID_DESC: Record<string, string> = {
  freeze: 'Finding the words to speak up',
  givein: 'Standing their ground — kindly',
  meltdown: 'Handling it when it’s a lot',
  friends: 'Making and keeping friends',
  teasing: 'Shrugging it off',
  pushy: 'Getting heard without the volume',
};
export const PARENT_MAP: Record<string, string> = {
  notime: '5-Minute Check-ins',
  whattosay: 'When They Won’t Open Up',
  myself: 'Connecting & Hard Conversations',
  nothing: 'Practice That Sticks',
};

export const STATE_KEY = 'sprout_funnel_v2_state';
export const INTAKE_KEY = 'sprout_intake';
