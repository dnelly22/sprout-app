/**
 * Lazy wrapper around `character-voices.ts` (Tone.js gibberish dialogue voices).
 * Shares the Tone chunk with `sfx.ts`; loads on first gesture. `speakCharacter`
 * returns the estimated duration synchronously so a typewriter can pace its text
 * reveal to finish together with the voice. Gated on the `sfx` setting.
 */
import type { Character, TalkEmotion } from './character-voices';

type VoiceModule = typeof import('./character-voices');
let mod: VoiceModule | null = null;
let loading: Promise<VoiceModule> | null = null;
function load(): Promise<VoiceModule> {
  if (mod) return Promise.resolve(mod);
  if (!loading) loading = import('./character-voices').then((m) => { mod = m; return m; });
  return loading;
}

let enabled = true;
let armed = false;

export function setVoiceEnabled(on: boolean) {
  enabled = on;
}

/** Warm the voice module on the first interaction (shares the Tone chunk). */
export function armVoice() {
  if (armed || typeof window === 'undefined') return;
  armed = true;
  const unlock = () => {
    void load();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true });
}

// Mirrors the per-character timing inside character-voices.ts `speak()`.
const PER_CHAR: Record<TalkEmotion, number> = { talking: 58, happy: 50, sad: 82, mad: 48 };

/** Estimate how long the gibberish voice runs for `text` (ms) — paces the typewriter. */
export function estimateTalkMs(text: string, emotion: TalkEmotion = 'talking', rate = 1): number {
  const letters = text.replace(/\s+/g, ' ').replace(/ /g, '').length;
  return Math.round(letters * PER_CHAR[emotion] * rate + 150);
}

export interface VoiceHandle { stop: () => void; durationMs: number; }

/**
 * Start a character's gibberish voice for `text`. Returns the duration immediately
 * (so the typewriter can pace itself) and lazy-loads the synth to actually play it.
 * No-op audio when sound effects are muted, but still returns a duration so the
 * typing animation runs either way.
 */
export function speakCharacter(
  character: Character,
  text: string,
  emotion: TalkEmotion = 'talking',
  opts: { rate?: number } = {},
): VoiceHandle {
  const durationMs = estimateTalkMs(text, emotion, opts.rate ?? 1);
  if (!enabled) return { stop() {}, durationMs };
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const w = window as unknown as { __voiceCalls?: number };
    w.__voiceCalls = (w.__voiceCalls ?? 0) + 1;
  }
  let real: { stop: () => void } | null = null;
  let stopped = false;
  void load().then((m) => { if (!stopped) real = m.speak(character, text, emotion, opts); });
  return { durationMs, stop() { stopped = true; real?.stop(); } };
}

export type { Character, TalkEmotion };
