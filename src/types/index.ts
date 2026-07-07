import type { AreaKey } from '../constants/areas';

export type { AreaKey };

/* ---------------- Core entities (data model from Foundation brief) ---------------- */

export interface Pronoun {
  subj: string; // she / he / they
  obj: string;  // her / him / them
  poss: string; // her / his / their
}

export interface Win {
  id: string;
  childId: string;
  source: 'kid' | 'parent';
  area: AreaKey | null;
  note: string;
  /** Human label shown in the wins feed, e.g. "Mia logged this · Tuesday". */
  date: string;
}

export interface Badge {
  key: string;
  label: string;
  icon: string;
  earned: boolean;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  /** Display label for the age group, e.g. "6–8". */
  ageLabel?: string;
  color: string;
  pronoun: Pronoun;
  level: number;
  levelName: string;
  nextLevelName: string;
  stars: number;
  starsToNext: number;
  streak: number;
  /** Per-area normalized scores (0–100). */
  areaScores: Record<AreaKey, number>;
  /** The area currently clicking, surfaced on Today. */
  growing: { area: AreaKey; note: string };
  /** Confidence-over-time series (one point per check / weekly check-in). */
  weeks: number[];
  missionsDone: number;
  scenariosMastered: number;
  /** # of completed quest stops (current = this index). */
  questProgress: number;
  wins: Win[];
  badges: Badge[];
  currentGoalId: string | null;
}

export type GoalStatus = 'active' | 'archived';

export interface Goal {
  id: string;
  childId: string;
  area: AreaKey;
  statement: string;
  status: GoalStatus;
}

export interface ParentProfile {
  name: string;
  email: string;
  type: string; // e.g. "The Steady Encourager"
  consentGiven: boolean;
  areaScores: Record<AreaKey, number>;
  lessonsCompleted: number;
  checkinsCount: number;
  /** Plain-language insight pointing at the softest area. */
  insight: { area: AreaKey; text: string };
}

/* ---------------- Lessons ---------------- */

/** Two shelves: lessons for talking with your child, and your own situations. */
export type LessonShelf = 'talking' | 'situations';

/** The seven "Talking with your child" library categories. */
export type LessonCategory =
  | 'openup'
  | 'bigfeelings'
  | 'confidence'
  | 'friends'
  | 'boundaries'
  | 'hardconversations'
  | 'connection';

/** The six "Your situations" categories (the parent's own communication). */
export type SituationCategory =
  | 'connecting'
  | 'speakingup'
  | 'relationships'
  | 'understanding'
  | 'boundaries'
  | 'hardconversations';

export type LessonStatus = 'new' | 'in-progress' | 'done';

/** A lesson row in the library list (carries mutable status/progress). */
export interface Lesson {
  id: string;
  shelf: LessonShelf;
  /** Set on the "talking" shelf. */
  parentCategory?: LessonCategory;
  /** Set on the "situations" shelf. */
  situationCategory?: SituationCategory;
  /** Zero or more of the five kid areas; [] when none genuinely maps. */
  areaTags: AreaKey[];
  title: string;
  status: LessonStatus;
  progress?: number;
}

/**
 * The authored body of a lesson — the "Parent Communication Library" format (v2).
 * Section order is fixed: The Moment → What's Really Going On? → What To Say →
 * How To Say It → Skip This → Try It This Week → Goes With → Save The Line.
 *
 * `whatsReallyGoingOn` is required (the non-clinical "why"). The script sections
 * are typed optional for resilience, but the seed library authors all of them.
 */
export interface LessonContent {
  id: string;
  shelf: LessonShelf;
  parentCategory?: LessonCategory;
  situationCategory?: SituationCategory;
  /** Zero or more of the five kid areas; [] when none genuinely maps. */
  areaTags: AreaKey[];
  title: string;
  /** The simple, non-clinical "why" behind the behavior (2–4 sentences). Required. */
  whatsReallyGoingOn: string;
  theMoment?: string;
  whatToSay?: string[];
  /** Parent-scenario lessons: questions to ask. */
  questionsToAsk?: string[];
  howToSayIt?: string;
  /** Single "skip this" line (kid lessons). */
  skipThis?: string;
  /** List of common mistakes (parent-scenario lessons). */
  commonMistakes?: string[];
  tryItThisWeek?: string;
  /** Free text, e.g. "Talking area · FORD tool". */
  goesWith?: string;
  /** The one line to remember — "Save The Line". */
  keyLine?: string;
  /** Optional safety/aside note shown subtly in the deck. */
  note?: string;
  /** Seed-only initial status/progress for the demo. */
  seedStatus?: LessonStatus;
  seedProgress?: number;
}

/* ---------------- Scenarios / games ---------------- */

export type GameType = 'quickfire' | 'journey' | 'rehearsal';

export interface QuickfireOption {
  text: string;
  correct: boolean;
  why: string;
}
export interface QuickfireScenario {
  id: string;
  area: AreaKey;
  scene: string;
  prompt: string;
  options: QuickfireOption[];
}

export interface JourneyChoice {
  label: string;
  delta: number;
  to: string;
}
export interface JourneyNode {
  kind: 'scene' | 'reaction';
  mood: KidMood;
  otherMood: KidMood;
  line: string;
  consequence?: string;
  choices: JourneyChoice[];
}
export interface JourneyEnding {
  mood: KidMood;
  tone?: 'strong' | 'recovered' | 'learned';
  headline: string;
  stars: number;
  why: string;
}
export interface JourneyScenario {
  title: string;
  area: AreaKey;
  other: { name: string; color: string };
  startMeter: number;
  start: string;
  nodes: Record<string, JourneyNode>;
  endings: Record<string, JourneyEnding>;
}

export interface RehearsalItem {
  id: string;
  area: AreaKey;
  setup: string;
  line: string;
  cue: string;
  alts: string[];
}

export type KidMood = 'happy' | 'cheer' | 'think' | 'gentle' | 'oops' | 'talk';

/* ---------------- Quest map / toolkit ---------------- */

export type WorldStatus = 'done' | 'current' | 'locked';

export interface QuestWorld {
  key: AreaKey;
  name: string;   // kid world name
  area: AreaKey;
  icon: string;
  status: WorldStatus;
  lvl: number;
  done?: number;
  total?: number;
}

export interface ToolkitItem {
  id: string;
  label: string;
  hint: string;
  icon: string;
  steps?: string[];
}

/* ---------------- Weekly check-in / mission ---------------- */

export interface WeeklyChallenge {
  title: string;
  detailTemplate: string;
  done: number;
  total: number;
}

export interface WeeklyCheckin {
  childId: string;
  weekOf: string;
  mood: number; // 1–5
  areaRatings: Partial<Record<AreaKey, number>>;
  challengeDone: 'yes' | 'partly' | 'no';
  winNote?: string;
}
