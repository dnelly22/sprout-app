/**
 * Sound-effects gate around `sprout-sounds.ts` (Tone.js, synthesized — no audio
 * files). Tone is heavy (~120KB gzip), so the sound module is **lazy-loaded** on
 * the first user gesture: it never bloats the initial bundle, and by the time the
 * child reaches a game the chunk is already warm. Honors the `sfx` setting.
 */
import type { SoundId, Mood } from './sprout-sounds';

type SoundModule = typeof import('./sprout-sounds');

let enabled = true;
let armed = false;
let mod: SoundModule | null = null;
let loading: Promise<SoundModule> | null = null;

function load(): Promise<SoundModule> {
  if (mod) return Promise.resolve(mod);
  if (!loading) loading = import('./sprout-sounds').then((m) => { mod = m; return m; });
  return loading;
}

export function setSfxEnabled(on: boolean) {
  enabled = on;
}

/** Warm the Tone module + audio context on the first interaction anywhere. */
export function armSfx() {
  if (armed || typeof window === 'undefined') return;
  armed = true;
  const unlock = () => {
    void load().then((m) => m.initSound());
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true });
}

/** Play a UI / feedback / reward sound (no-op when sound effects are muted). */
export function sfx(id: SoundId) {
  if (!enabled) return;
  void load().then((m) => m.playSound(id));
}

/** The mascot's non-verbal voice (no-op when muted). */
export function sproutSay(mood: Mood) {
  if (!enabled) return;
  void load().then((m) => m.sproutVoice(mood));
}
