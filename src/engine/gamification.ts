import type { AreaKey, Badge, Child } from '../types';
import { LEVEL_LADDER } from '../data/quest';

/**
 * Pure gamification engine. No React, no storage. Rewards are tied to growth and
 * real-world action — there are no punishing mechanics.
 */

export const STARS = {
  quickfireBest: 3,
  quickfireTry: 1,
  rehearsal: 2,
  realWorldWin: 5,
} as const;

/** How much one play in an area nudges that area's score (clamped 0–100). */
const AREA_GAMEPLAY_DELTA = 4;
/** How much a logged win in an area adds. */
const AREA_WIN_DELTA = 2;

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function levelNameFor(level: number): string {
  return LEVEL_LADDER[Math.min(level, LEVEL_LADDER.length) - 1] ?? LEVEL_LADDER[0];
}
export function nextLevelNameFor(level: number): string {
  return LEVEL_LADDER[Math.min(level, LEVEL_LADDER.length - 1)] ?? LEVEL_LADDER[LEVEL_LADDER.length - 1];
}

export interface AwardResult {
  child: Child;
  leveledUp: boolean;
  newLevelName: string;
}

/** Add stars (and optionally raise an area), recomputing level + badges. */
export function awardStars(child: Child, stars: number, area?: AreaKey): AwardResult {
  let next: Child = { ...child, stars: child.stars + stars };

  if (area) {
    next.areaScores = {
      ...next.areaScores,
      [area]: clamp(next.areaScores[area] + AREA_GAMEPLAY_DELTA),
    };
  }

  let leveledUp = false;
  // Level up while we've passed the threshold and a higher level exists.
  while (next.stars >= next.starsToNext && next.level < LEVEL_LADDER.length) {
    next.level += 1;
    next.starsToNext = next.starsToNext + 40;
    leveledUp = true;
  }
  next.levelName = levelNameFor(next.level);
  next.nextLevelName = nextLevelNameFor(next.level);
  next.badges = recomputeBadges(next);

  return { child: next, leveledUp, newLevelName: next.levelName };
}

/** Record a kid-logged real-world win: bonus stars + small area bump. */
export function applyWinBump(child: Child, area: AreaKey | null): Child {
  const withStars = awardStars(child, STARS.realWorldWin, undefined).child;
  if (!area) return { ...withStars, missionsDone: withStars.missionsDone };
  return {
    ...withStars,
    areaScores: { ...withStars.areaScores, [area]: clamp(withStars.areaScores[area] + AREA_WIN_DELTA) },
  };
}

export function recomputeBadges(child: Child): Badge[] {
  const playedSomething = child.scenariosMastered >= 1 || child.questProgress >= 1;
  const loggedRealWin = child.wins.some((w) => w.source === 'kid');
  return child.badges.map((b) => {
    switch (b.key) {
      case 'first':  return { ...b, earned: playedSomething };
      case 'real':   return { ...b, earned: loggedRealWin };
      case 'streak': return { ...b, earned: child.streak >= 21 };
      case 'champ':  return { ...b, earned: child.level >= LEVEL_LADDER.length };
      default:       return b;
    }
  });
}

/** Progress toward the next level, 0–100, for XP bars. */
export function levelProgressPct(child: Child): number {
  const prevThreshold = child.starsToNext - 40;
  const span = child.starsToNext - prevThreshold;
  if (span <= 0) return 100;
  return clamp(Math.round(((child.stars - prevThreshold) / span) * 100));
}
