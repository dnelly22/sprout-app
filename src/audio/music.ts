/**
 * Background-music controller (singleton, lives outside React).
 *
 * - One ambient track (`app`) plays everywhere; games swap to their own track
 *   and revert to `app` on exit. Crossfades between tracks with two <audio>
 *   elements so switches are smooth.
 * - Browsers block autoplay until a user gesture, so playback is "unlocked" on
 *   the first pointer/key interaction anywhere in the app.
 * - Honors an enabled flag (the parent/kid mute toggle), persisted in settings.
 */
export type MusicTrack = 'app' | 'quickfire' | 'journey';

const SRC: Record<MusicTrack, string> = {
  app: '/assets/audio/app.mp3',
  quickfire: '/assets/audio/quickfire.mp3',
  journey: '/assets/audio/journey.mp3',
};

const BASE_VOLUME = 0.32; // gentle background level
const FADE_MS = 600;

type FadeEl = HTMLAudioElement & { _raf?: number };

class MusicController {
  private a?: FadeEl;
  private b?: FadeEl;
  private active?: FadeEl;
  private idle?: FadeEl;
  private current: MusicTrack | null = null;
  private desired: MusicTrack | null = 'app';
  private enabled = true;
  private unlocked = false;

  init() {
    if (this.a || typeof window === 'undefined') return;
    this.a = new Audio() as FadeEl;
    this.b = new Audio() as FadeEl;
    [this.a, this.b].forEach((el) => {
      el.loop = true;
      el.preload = 'auto';
      el.volume = 0;
    });
    this.active = this.a;
    this.idle = this.b;

    const unlock = () => {
      this.unlocked = true;
      this.apply();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    this.apply();
  }

  setTrack(track: MusicTrack | null) {
    this.desired = track;
    this.apply();
  }

  private apply() {
    this.init();
    if (!this.active || !this.idle) return;

    // Paused/muted: fade the active element down and stop.
    if (!this.enabled || !this.unlocked || this.desired == null) {
      this.fade(this.active, 0, () => this.active && this.active.pause());
      if (this.desired == null) this.current = null;
      return;
    }

    // Already on the right track — just make sure it's audible & playing.
    if (this.current === this.desired) {
      this.active.play().catch(() => {});
      this.fade(this.active, BASE_VOLUME);
      return;
    }

    // Crossfade: bring the desired track up on the idle element, fade old out.
    const next = this.idle;
    const prev = this.active;
    next.src = SRC[this.desired];
    try { next.currentTime = 0; } catch { /* not yet seekable */ }
    next.volume = 0;
    next.play().catch(() => {});
    this.fade(next, BASE_VOLUME);
    this.fade(prev, 0, () => prev.pause());

    this.active = next;
    this.idle = prev;
    this.current = this.desired;
  }

  private fade(el: FadeEl, target: number, done?: () => void) {
    if (el._raf) cancelAnimationFrame(el._raf);
    const start = el.volume;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / FADE_MS);
      el.volume = Math.max(0, Math.min(1, start + (target - start) * k));
      if (k < 1) el._raf = requestAnimationFrame(step);
      else { el._raf = undefined; done?.(); }
    };
    el._raf = requestAnimationFrame(step);
  }
}

export const music = new MusicController();

// Dev-only handle for debugging (e.g. inspect current track / volume in console).
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __music?: unknown }).__music = music;
}
