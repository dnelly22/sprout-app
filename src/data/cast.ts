import type { JourneyBeat } from '../types/journey';

/**
 * Maps scenario speakers to the two animated kid characters (boy/girl art) and
 * picks the mood clip that matches the beat. Clips play once and freeze on
 * their last frame (encoded loop=1); remount per beat to replay.
 */
export type CastGender = 'boy' | 'girl';

const GIRLS = new Set([
  'ana', 'ava', 'bree', 'brooke', 'liv', 'maya', 'mia', 'priya', 'sasha', 'zoe',
  'riley', 'quinn', 'mila',
]);

export function castGender(name?: string): CastGender {
  if (!name) return 'boy';
  return GIRLS.has(name.toLowerCase().trim()) ? 'girl' : 'boy';
}

/** Moods with a clip per gender (the "new" edited set — snarky is girl-only). */
const MOODS: Record<CastGender, string[]> = {
  boy: ['idle', 'laughing', 'thinking', 'mean'],
  girl: ['idle', 'laughing', 'thinking', 'mean', 'snarky'],
};

/** Pick the clip that best matches what's happening in the beat. */
export function castMood(gender: CastGender, beat: Pick<JourneyBeat, 'line' | 'narration' | 'round'>): string {
  const text = `${beat.line ?? ''} ${beat.narration ?? ''}`.toLowerCase();
  const pick = (m: string) => (MOODS[gender].includes(m) ? m : 'idle');

  if (/laugh|giggl|snicker|crack.*up|howl|hilarious|\bha[- ]?ha/.test(text)) return pick('laughing');
  if (/scoff|smirk|sneer|mock|teas|roll.*eyes|raises an eyebrow|snide|whatever|babyish|don.t be a baby/.test(text))
    return gender === 'girl' ? 'snarky' : pick('mean');
  if (/angry|mad\b|crosses (his|her) arms|arms crossed|frown|snaps|yell|grabs|storms|glare|scowl|jaw tight/.test(text))
    return pick('mean');
  if (/\?\s*["”]?\s*$|hmm|wonder|not sure|thinking|um…|maybe\b|hesitat|unsure|shrug/.test(text)) return pick('thinking');
  return 'idle';
}

export function castClipUrl(gender: CastGender, mood: string): string {
  return `/assets/journey/characters/${gender}-${mood}.webp`;
}
