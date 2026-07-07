import type { AreaKey } from '../constants/areas';

/*
 * Sprouts progression economy — pure functions over an append-only activity log.
 * Implements the gamification spec: Stars are the ONLY currency; levels/titles,
 * learning streak, per-journey levels, badges (+50★ each), toolkit unlocks,
 * daily quest, weekly adventure, real-world challenges, and Next Unlock.
 * Stars measure completed activity only — never confidence/psych metrics.
 */

export type ActivityKind = 'journey' | 'quickfire' | 'sayit' | 'realworld' | 'boss' | 'lesson';

export interface ActivityEvent {
  id: string;
  childId: string;
  ts: number;               // epoch ms
  kind: ActivityKind;
  area?: AreaKey;           // journey category (quest world) it counts toward
  scenarioId?: string;
  stars: number;            // total stars awarded for this event (incl. bonuses)
  perfect?: boolean;
  verified?: boolean;       // realworld: parent verified
}

/* ---------------- Star reward table (per spec) ---------------- */
export const REWARD = {
  journeyBase: 25, journeyPerfect: 5, journeyMin: 20,
  quickfireBase: 10, quickfireFull: 10, quickfirePerfect: 10,
  sayitBase: 15,
  realworldDidIt: 20, realworldVerify: 25,
  dailyQuestBonus: 30,
  firstOfDayBonus: 10,
  bossBase: 75, bossPerfect: 25,
  journeyComplete: 150,
  weeklyAdventure: 150,
  badgeBonus: 50,
} as const;

export function journeyStars(xpRatio: number): number {
  // xpRatio = earned/maxPossible for the run; perfect run gets the bonus.
  if (xpRatio >= 0.999) return REWARD.journeyBase + REWARD.journeyPerfect;
  if (xpRatio < 0.5) return REWARD.journeyMin;
  return REWARD.journeyBase;
}
export function quickfireStars(completedRound: boolean, perfect: boolean): number {
  return REWARD.quickfireBase + (completedRound ? REWARD.quickfireFull : 0) + (perfect ? REWARD.quickfirePerfect : 0);
}

/* ---------------- Level table (per spec §7) ---------------- */
export interface LevelDef { level: number; title: string; stars: number; reward: string; stage: string }
export const LEVELS: LevelDef[] = [
  { level: 1,  title: 'Seed',                 stars: 0,    reward: 'Starting Sprout',            stage: '🌱' },
  { level: 2,  title: 'Tiny Sprout',          stars: 100,  reward: 'Sprout growth animation',    stage: '🌿' },
  { level: 3,  title: 'Young Sprout',         stars: 250,  reward: 'New leaves appear',          stage: '🌿' },
  { level: 4,  title: 'Growing Explorer',     stars: 450,  reward: 'First cosmetic slot',        stage: '🍃' },
  { level: 5,  title: 'Friendly Sprout',      stars: 700,  reward: 'Leaf sparkle animation',     stage: '🍃' },
  { level: 6,  title: 'Conversation Builder', stars: 1000, reward: 'Badge shelf',                stage: '🪴' },
  { level: 7,  title: 'Forest Friend',        stars: 1350, reward: 'Butterfly visitor',          stage: '🌳' },
  { level: 8,  title: 'Helpful Tree',         stars: 1750, reward: 'New background',             stage: '🌳' },
  { level: 9,  title: 'Wise Tree',            stars: 2250, reward: 'Special badge frame',        stage: '🌲' },
  { level: 10, title: 'Forest Guide',         stars: 2800, reward: 'Full evolution celebration', stage: '🌲' },
];

export interface LevelState {
  level: number; title: string; stage: string;
  next?: LevelDef; starsIntoLevel: number; starsForNext: number; toNext: number;
}
export function levelForStars(stars: number): LevelState {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (stars >= l.stars) cur = l;
  const next = LEVELS[cur.level] ?? undefined; // index = level since level-1 titles are 0-indexed
  return {
    level: cur.level, title: cur.title, stage: cur.stage, next,
    starsIntoLevel: stars - cur.stars,
    starsForNext: next ? next.stars - cur.stars : 0,
    toNext: next ? Math.max(0, next.stars - stars) : 0,
  };
}

/* ---------------- Day helpers ---------------- */
export const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const todayKey = () => dayKey(Date.now());
export function mondayKey(ts = Date.now()): string {
  const d = new Date(ts);
  const day = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - day);
  return dayKey(d.getTime());
}

/* ---------------- Learning streak (per spec §6) ---------------- */
export function learningStreak(events: ActivityEvent[], childId: string, now = Date.now()): { current: number; longest: number; activeToday: boolean } {
  const days = new Set(events.filter((e) => e.childId === childId).map((e) => dayKey(e.ts)));
  const MS = 86400000;
  const activeToday = days.has(dayKey(now));
  let current = 0;
  let cursor = activeToday ? now : now - MS; // a missed *today* doesn't break it yet
  while (days.has(dayKey(cursor))) { current += 1; cursor -= MS; }
  // longest: walk all days
  let longest = 0;
  const sorted = [...days].sort();
  let run = 0; let prev: string | null = null;
  for (const k of sorted) {
    if (prev) {
      const p = new Date(prev).getTime();
      run = dayKey(p + MS) === k ? run + 1 : 1;
    } else run = 1;
    longest = Math.max(longest, run);
    prev = k;
  }
  return { current, longest, activeToday };
}

/* ---------------- Per-journey progress (per spec §13–14) ---------------- */
export interface JourneyProgress {
  area: AreaKey;
  activities: number;        // all activities in this journey
  journeys: number; quickfires: number; sayits: number;
  level: number;             // 1..5 journey level (0 = not started)
  completedScenarios: string[];
  totalScenarios: number;    // scenario count in content for this area
  bossDone: boolean;
}
export const JOURNEY_LEVEL_AT = [1, 3, 6, 9]; // activities → levels 1-4; level 5 = complete + boss

export function journeyProgress(events: ActivityEvent[], childId: string, area: AreaKey, totalScenarios: number): JourneyProgress {
  const mine = events.filter((e) => e.childId === childId && e.area === area);
  const journeys = mine.filter((e) => e.kind === 'journey').length;
  const quickfires = mine.filter((e) => e.kind === 'quickfire').length;
  const sayits = mine.filter((e) => e.kind === 'sayit').length;
  const bossDone = mine.some((e) => e.kind === 'boss');
  const activities = mine.length;
  const completedScenarios = [...new Set(mine.filter((e) => e.scenarioId).map((e) => e.scenarioId!))];
  let level = 0;
  for (let i = 0; i < JOURNEY_LEVEL_AT.length; i++) if (activities >= JOURNEY_LEVEL_AT[i]) level = i + 1;
  const complete = totalScenarios > 0 && completedScenarios.length >= totalScenarios && bossDone;
  if (complete) level = 5;
  return { area, activities, journeys, quickfires, sayits, level, completedScenarios, totalScenarios, bossDone };
}

/* ---------------- Boss challenge (per Quest-tab design) ---------------- */
export const BOSS = {
  title: 'The Big Playground Test',
  need: 3,                       // journeys at level ≥ 2 unlock the boss
  minJourneyLevel: 2,
  scenarioId: 'friends-01',      // played in hard mode with the boss wrapper
  mode: 'hard' as const,
};
export function bossUnlock(progress: JourneyProgress[]): { unlocked: boolean; have: number; need: number } {
  const have = progress.filter((p) => p.level >= BOSS.minJourneyLevel).length;
  return { unlocked: have >= BOSS.need, have: Math.min(have, BOSS.need), need: BOSS.need };
}

/* ---------------- Badges (per spec §21–24) ---------------- */
export interface BadgeDef {
  key: string; label: string; icon: string; tint: string;
  /** Illustrated badge art in /assets/badges/ (falls back to the icon coin). */
  art?: string;
  requirement: string;
  earned: (ctx: BadgeCtx) => boolean;
}
export interface BadgeCtx {
  events: ActivityEvent[]; childId: string;
  streak: { current: number; longest: number };
  journeys: JourneyProgress[];
}
const count = (ctx: BadgeCtx, kind?: ActivityKind, area?: AreaKey) =>
  ctx.events.filter((e) => e.childId === ctx.childId && (!kind || e.kind === kind) && (!area || e.area === area)).length;

export const BADGES: BadgeDef[] = [
  { key: 'first-step', art: '/assets/badges/seedling.webp',    label: 'First Step',        icon: 'footprints', tint: 'var(--green-100)', requirement: 'Complete your first activity',        earned: (c) => count(c) >= 1 },
  { key: 'first-journey', art: '/assets/badges/traveler.webp', label: 'First Journey',     icon: 'map',        tint: 'var(--grape-100)', requirement: 'Complete a Journey lesson',           earned: (c) => count(c, 'journey') >= 1 },
  { key: 'qf-starter', art: '/assets/badges/fire.webp',    label: 'Quick Fire Hero',   icon: 'zap',        tint: '#E7F2FB',          requirement: 'Complete a Quick Fire round',         earned: (c) => count(c, 'quickfire') >= 1 },
  { key: 'sayit-starter', art: '/assets/badges/air.webp', label: 'Say It Loud Pro',   icon: 'mic',        tint: '#E7F2FB',          requirement: 'Complete a Say It Out Loud',          earned: (c) => count(c, 'sayit') >= 1 },
  { key: 'real-world', art: '/assets/badges/explorer.webp',    label: 'Real World Explorer', icon: 'globe',    tint: 'var(--sun-100)',   requirement: 'Complete a Real World Challenge',    earned: (c) => count(c, 'realworld') >= 1 },
  { key: 'friend-finder', art: '/assets/badges/gardener.webp', label: 'Friend Finder',     icon: 'users',      tint: 'var(--grape-100)', requirement: 'Grow the Friends journey to Level 3', earned: (c) => (c.journeys.find((j) => j.area === 'connect')?.level ?? 0) >= 3 },
  { key: 'conversation', art: '/assets/badges/chef.webp',  label: 'Conversation Builder', icon: 'megaphone', tint: '#E7F2FB',        requirement: 'Grow the Talking journey to Level 3', earned: (c) => (c.journeys.find((j) => j.area === 'speakup')?.level ?? 0) >= 3 },
  { key: 'people-reader', art: '/assets/badges/sage.webp', label: 'People Reader',     icon: 'eye',        tint: 'var(--sun-100)',   requirement: 'Grow the People journey to Level 3',  earned: (c) => (c.journeys.find((j) => j.area === 'conflict')?.level ?? 0) >= 3 },
  { key: 'boundary', art: '/assets/badges/warrior.webp',      label: 'Boundary Builder',  icon: 'shield',     tint: 'var(--coral-100)', requirement: 'Grow the Boundaries journey to Level 3', earned: (c) => (c.journeys.find((j) => j.area === 'feelings')?.level ?? 0) >= 3 },
  { key: 'streak-3', art: '/assets/badges/flyer.webp',      label: 'Three Learning Days', icon: 'flame',    tint: 'var(--coral-100)', requirement: '3-day learning streak',               earned: (c) => c.streak.longest >= 3 },
  { key: 'streak-7', art: '/assets/badges/mage.webp',      label: 'Perfect Week',      icon: 'trophy',     tint: 'var(--sun-100)',   requirement: '7-day learning streak',               earned: (c) => c.streak.longest >= 7 },
  { key: 'question-master', art: '/assets/badges/elder.webp', label: 'Question Master', icon: 'circle-help', tint: 'var(--grape-100)', requirement: 'Complete 25 game rounds',            earned: (c) => count(c, 'journey') + count(c, 'quickfire') >= 25 },
  { key: 'boss-winner', art: '/assets/badges/warrior-b.webp',   label: 'Boss Winner',       icon: 'crown',      tint: 'var(--sun-100)',   requirement: 'Beat a Boss Challenge',               earned: (c) => count(c, 'boss') >= 1 },
];

export interface BadgeState extends BadgeDef { isEarned: boolean }
export function badgeStates(ctx: BadgeCtx): BadgeState[] {
  return BADGES.map((b) => ({ ...b, isEarned: b.earned(ctx) }));
}

/* ---------------- Power toolkit (per spec §25) ---------------- */
export interface ToolDef { id: string; label: string; icon: string; hint: string; area: AreaKey; need: number; steps: string[] }
export const TOOLS: ToolDef[] = [
  { id: 'ford',   label: 'FORD',                    icon: 'message-circle', hint: 'Family · Occupation · Recreation · Dreams', area: 'speakup',  need: 3,
    steps: ['Family — ask about home & people', 'Occupation — school, what they do', 'Recreation — fun, games, hobbies', 'Dreams — what they wish for'] },
  { id: 'ptr',    label: 'Pause · Think · Respond', icon: 'brain',   hint: 'Take a beat before you react',   area: 'feelings', need: 3,
    steps: ['Pause — stop and breathe', 'Think — what do I really want?', 'Respond — say it calm and clear'] },
  { id: 'ask1',   label: 'Ask One More Question',   icon: 'circle-help', hint: 'Keep the conversation alive', area: 'speakup', need: 5,
    steps: ['Listen to their answer', 'Find one interesting bit', 'Ask about that bit'] },
  { id: 'listen', label: 'Listen First',            icon: 'ear',     hint: 'Understand before you answer',   area: 'connect',  need: 5,
    steps: ['Look at them', 'Let them finish', 'Say back what you heard'] },
  { id: 'common', label: 'Find Something In Common', icon: 'users',  hint: 'The fast track to friendship',   area: 'connect',  need: 7,
    steps: ['Ask what they like', 'Share what you like', 'Find the overlap'] },
  { id: 'kindno', label: 'Kind No',                 icon: 'hand',    hint: 'Say no without being mean',      area: 'feelings', need: 5,
    steps: ['Short and calm', '“No thanks — not for me”', 'No over-explaining'] },
  { id: 'calm',   label: 'Calm & Short',            icon: 'volume-2', hint: 'Say it once, kind and clear',   area: 'listen',   need: 5,
    steps: ['Keep your voice calm', 'Say it once', 'Don’t over-explain'] },
];
export function toolStates(events: ActivityEvent[], childId: string): (ToolDef & { unlocked: boolean; have: number })[] {
  return TOOLS.map((t) => {
    const have = events.filter((e) => e.childId === childId && e.area === t.area).length;
    return { ...t, unlocked: have >= t.need, have };
  });
}

/* ---------------- Daily quest (per spec §16–17) ---------------- */
export type QuestKind = 'journey' | 'quickfire2' | 'sayit' | 'realworld';
export interface DailyQuest { kind: QuestKind; title: string; sub: string; icon: string }
const QUEST_POOL: DailyQuest[] = [
  { kind: 'journey',    title: 'Complete 1 Journey',        sub: 'Any world you like!',            icon: 'gamepad-2' },
  { kind: 'quickfire2', title: 'Play 2 Quick Fire rounds',  sub: 'Fast and fun',                   icon: 'zap' },
  { kind: 'sayit',      title: 'Say one line out loud',     sub: 'Brave voice practice',           icon: 'mic' },
  { kind: 'realworld',  title: 'Do the Real World Challenge', sub: 'Out there, for real',          icon: 'globe' },
];
export function dailyQuest(date: string, childId: string): DailyQuest {
  // deterministic rotation per child per day
  let h = 0;
  const s = `${date}:${childId}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return QUEST_POOL[h % QUEST_POOL.length];
}
export function dailyQuestDone(quest: DailyQuest, events: ActivityEvent[], childId: string, date = todayKey()): boolean {
  const today = events.filter((e) => e.childId === childId && dayKey(e.ts) === date);
  switch (quest.kind) {
    case 'journey': return today.some((e) => e.kind === 'journey');
    case 'quickfire2': return today.filter((e) => e.kind === 'quickfire').length >= 2;
    case 'sayit': return today.some((e) => e.kind === 'sayit');
    case 'realworld': return today.some((e) => e.kind === 'realworld');
  }
}

/* ---------------- Weekly adventure (per spec §18) ---------------- */
export interface WeeklyTarget { kind: ActivityKind; need: number; label: string }
export const WEEKLY_TARGETS: WeeklyTarget[] = [
  { kind: 'journey',   need: 3, label: '3 Journeys' },
  { kind: 'quickfire', need: 2, label: '2 Quick Fires' },
  { kind: 'sayit',     need: 1, label: '1 Say It Out Loud' },
  { kind: 'realworld', need: 1, label: '1 Real World Challenge' },
];
export function weeklyProgress(events: ActivityEvent[], childId: string, weekStart = mondayKey()) {
  const inWeek = events.filter((e) => e.childId === childId && dayKey(e.ts) >= weekStart);
  const rows = WEEKLY_TARGETS.map((t) => ({ ...t, have: Math.min(t.need, inWeek.filter((e) => e.kind === t.kind).length) }));
  return { rows, done: rows.every((r) => r.have >= r.need) };
}

/* ---------------- Real world challenges (per spec §27) ---------------- */
export const RWC_POOL = [
  'Say hello to someone today',
  'Ask someone what they like to play',
  'Say thank you to someone',
  'Ask one follow-up question',
  'Invite someone to join you',
  'Tell someone “good job”',
  'Ask for help politely',
  'Practice saying “No thank you”',
  'Share one idea with someone',
];
export function realWorldChallenge(date: string, childId: string): string {
  let h = 7;
  const s = `${date}:${childId}:rwc`;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return RWC_POOL[h % RWC_POOL.length];
}

/* ---------------- First activity of the day bonus ---------------- */
export function isFirstOfDay(events: ActivityEvent[], childId: string, now = Date.now()): boolean {
  return !events.some((e) => e.childId === childId && dayKey(e.ts) === dayKey(now));
}

/* ---------------- Next Unlock (per spec §9) ---------------- */
export interface NextUnlock { label: string; have: number; need: number; icon: string }
export function nextUnlock(stars: number, ctx: BadgeCtx): NextUnlock {
  const lvl = levelForStars(stars);
  const options: NextUnlock[] = [];
  if (lvl.next) options.push({ label: `${lvl.toNext} more stars until… ${lvl.next.title}!`, have: lvl.starsIntoLevel, need: lvl.starsForNext, icon: 'gift' });
  // closest unearned badge with a star-independent requirement → show as journey goal
  const unearned = badgeStates(ctx).filter((b) => !b.isEarned);
  if (unearned.length) options.push({ label: `Next badge: ${unearned[0].label} — ${unearned[0].requirement.toLowerCase()}`, have: 0, need: 1, icon: 'award' });
  return options[0] ?? { label: 'You’ve unlocked everything (for now)!', have: 1, need: 1, icon: 'sparkles' };
}

/* ---------------- Weekly summary for parents ---------------- */
export function weeklySummary(events: ActivityEvent[], childId: string, weekStart = mondayKey()) {
  const inWeek = events.filter((e) => e.childId === childId && dayKey(e.ts) >= weekStart);
  return {
    stars: inWeek.reduce((s, e) => s + e.stars, 0),
    journeys: inWeek.filter((e) => e.kind === 'journey').length,
    quickfires: inWeek.filter((e) => e.kind === 'quickfire').length,
    sayits: inWeek.filter((e) => e.kind === 'sayit').length,
    realworld: inWeek.filter((e) => e.kind === 'realworld').length,
    lessons: inWeek.filter((e) => e.kind === 'lesson').length,
    activities: inWeek.length,
  };
}
