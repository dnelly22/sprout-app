import { useCallback, useEffect, useRef, useState } from 'react';

export type MascotMood =
  | 'idle' | 'jump1' | 'jump2' | 'growth' | 'sad' | 'thinking'
  | 'sunglasses' | 'reading' | 'surprised' | 'sleeping';

const SRC: Record<MascotMood, string> = {
  idle: 'sprout-idle',
  jump1: 'sprout-jump1',
  jump2: 'sprout-jump2',
  growth: 'sprout-growth',
  sad: 'sprout-sad',
  thinking: 'sprout-thinking',
  sunglasses: 'sprout-sunglasses',
  reading: 'sprout-reading',
  surprised: 'sprout-surprised',
  sleeping: 'sprout-sleeping',
};

/**
 * How long a celebrate mood plays before settling back to idle (which loops).
 * `null` = persistent: the mood stays (frozen on its last frame) until the next
 * celebrate() — used for `sunglasses` (finishes the game wearing them).
 */
const MOOD_MS: Partial<Record<MascotMood, number | null>> = {
  jump1: 5000,
  jump2: 4050,
  growth: 7200,
  sad: 6000,
  thinking: 9200, // plays once, then idle loops until the kid answers
  sunglasses: null,
  reading: 7000,
  surprised: 6000,
  sleeping: 8000,
};

export type CelebrateMood = Exclude<MascotMood, 'idle'>;

/**
 * Sprout — the kid mascot (the founder's illustrated/animated art).
 * `idle` loops; every other mood plays once and freezes on its last frame
 * (encoded loop=1). `playKey` remounts the image only on a real trigger change,
 * so parent re-renders never interrupt an in-flight animation; each remount
 * fades in (see `.mascot picture` CSS). Transparent — stands on any surface.
 */
export function Mascot({ mood = 'idle', playKey = 0, size = 120, className = '' }: {
  mood?: MascotMood; playKey?: number; size?: number; className?: string;
}) {
  const base = SRC[mood] ?? SRC.idle;
  return (
    <span className={`mascot ${className}`} style={{ display: 'inline-block', width: size, height: size }}>
      <picture key={`${base}-${playKey}`}>
        {/* animated WebP keeps smooth 8-bit alpha edges; GIF is a 1-bit fallback */}
        <source srcSet={`/assets/mascot/${base}.webp`} type="image/webp" />
        <img
          src={`/assets/mascot/${base}.gif`}
          alt="Sprout mascot"
          width={size}
          height={size}
          draggable={false}
          style={{ display: 'block', width: size, height: size, objectFit: 'contain' }}
        />
      </picture>
    </span>
  );
}

/**
 * Owns a mascot's mood lifecycle: `celebrate('growth' | 'sad' | …)` plays the
 * clip (fading in), then returns to idle after its natural length — or stays,
 * for persistent moods (thinking/sunglasses). Calling again restarts/replaces.
 */
export function useMascotCelebrate() {
  const [mood, setMood] = useState<MascotMood>('idle');
  const [playKey, setPlayKey] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  const celebrate = useCallback((kind: CelebrateMood) => {
    setMood(kind);
    setPlayKey((k) => k + 1);
    if (timer.current) window.clearTimeout(timer.current);
    const ms = MOOD_MS[kind];
    if (ms != null) timer.current = window.setTimeout(() => setMood('idle'), ms);
  }, []);

  const settle = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    setMood('idle');
  }, []);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  return { mood, playKey, celebrate, settle };
}

/** Warm the cache for a set of moods so their first play doesn't flicker. */
export function preloadMascots(moods: CelebrateMood[] = ['jump1', 'jump2']) {
  if (typeof window === 'undefined') return;
  for (const m of moods) {
    const img = new Image();
    img.src = `/assets/mascot/${SRC[m]}.webp`;
  }
}
