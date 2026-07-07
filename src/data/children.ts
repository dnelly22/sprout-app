import type { Child } from '../types';

/**
 * Seed children (demo). Mirrors the prototype's Mia & Theo so first run lands
 * on the same visuals. Real onboarding creates a fresh child on top of this.
 */
export const SEED_CHILDREN: Child[] = [
  {
    id: 'mia',
    name: 'Mia',
    age: 9,
    color: 'var(--grape-400)',
    pronoun: { subj: 'she', obj: 'her', poss: 'her' },
    level: 3,
    levelName: 'Confident Kid',
    nextLevelName: 'Confidence Champion',
    stars: 64,
    starsToNext: 100,
    streak: 6,
    areaScores: { speakup: 78, listen: 54, feelings: 62, conflict: 40, connect: 71 },
    growing: { area: 'conflict', note: 'Reading the room with friends is really clicking' },
    weeks: [38, 45, 52, 49, 61, 68, 74],
    missionsDone: 11,
    scenariosMastered: 7,
    questProgress: 7,
    currentGoalId: 'goal-mia',
    wins: [
      { id: 'w-mia-1', childId: 'mia', source: 'kid',    area: 'speakup', note: 'Asked the teacher for help out loud', date: 'Mia logged this · Tuesday' },
      { id: 'w-mia-2', childId: 'mia', source: 'parent', area: 'listen',  note: 'Stayed calm when the game got loud',  date: 'You noted this · Sunday' },
    ],
    badges: [
      { key: 'first',  label: 'First Steps',      icon: 'footprints', earned: true },
      { key: 'real',   label: 'Real-World Brave', icon: 'globe',      earned: true },
      { key: 'streak', label: '3-Week Streak',    icon: 'flame',      earned: false },
      { key: 'champ',  label: 'Champion',         icon: 'crown',      earned: false },
    ],
  },
  {
    id: 'theo',
    name: 'Theo',
    age: 6,
    color: 'var(--coral-400)',
    pronoun: { subj: 'he', obj: 'him', poss: 'his' },
    level: 2,
    levelName: 'Getting Bolder',
    nextLevelName: 'Confident Kid',
    stars: 30,
    starsToNext: 80,
    streak: 2,
    areaScores: { speakup: 45, listen: 38, feelings: 58, conflict: 33, connect: 64 },
    growing: { area: 'listen', note: 'Staying calm before he reacts is growing' },
    weeks: [22, 28, 31, 40, 44, 48, 55],
    missionsDone: 4,
    scenariosMastered: 4,
    questProgress: 4,
    currentGoalId: 'goal-theo',
    wins: [
      { id: 'w-theo-1', childId: 'theo', source: 'kid',    area: 'feelings', note: 'Said “I don’t like that” to a friend',     date: 'Theo logged this · Monday' },
      { id: 'w-theo-2', childId: 'theo', source: 'parent', area: 'listen',   note: 'Took a deep breath instead of yelling', date: 'You noted this · Friday' },
    ],
    badges: [
      { key: 'first',  label: 'First Steps',      icon: 'footprints', earned: true },
      { key: 'real',   label: 'Real-World Brave', icon: 'globe',      earned: false },
      { key: 'streak', label: '3-Week Streak',    icon: 'flame',      earned: false },
      { key: 'champ',  label: 'Champion',         icon: 'crown',      earned: false },
    ],
  },
];
