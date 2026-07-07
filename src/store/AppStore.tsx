import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type {
  AreaKey, Child, Goal, Lesson, ParentProfile, WeeklyChallenge, WeeklyCheckin,
} from '../types';
import { SEED_CHILDREN } from '../data/children';
import { SEED_PARENT, SEED_GOALS, WEEKLY_CHALLENGE } from '../data/parent';
import { ALL_LESSON_CONTENT } from '../data/lessons';
import { applyWinBump } from '../engine/gamification';
import {
  type ActivityEvent, type ActivityKind,
  REWARD, journeyStars, quickfireStars, levelForStars, learningStreak,
  journeyProgress, badgeStates, dailyQuest, dailyQuestDone, weeklyProgress,
  isFirstOfDay, todayKey, mondayKey, dayKey as dayKeyOf,
} from '../engine/economy';
import { AREA_TO_JOURNEY } from '../data/journey';
import { SCENARIO_TOTALS } from '../data/journeyMeta';
import { AREAS } from '../constants/areas';

/** List rows are derived from the authored lesson library (content is the source of truth). */
const seedLessons = (): Lesson[] =>
  ALL_LESSON_CONTENT.map((c) => ({
    id: c.id,
    shelf: c.shelf,
    parentCategory: c.parentCategory,
    situationCategory: c.situationCategory,
    areaTags: c.areaTags,
    title: c.title,
    status: c.seedStatus ?? 'new',
    progress: c.seedProgress,
  }));

const STORAGE_KEY = 'sprout_state_v1';

export interface Settings {
  notifications: boolean;
  pin: string;
  checkinDay: number; // 0=Sun … 6=Sat
  music?: boolean; // background music; undefined = on (default)
  sfx?: boolean; // sound effects; undefined = on (default)
  plan?: 'free' | 'trial' | 'premium' | 'plus'; // 'plus' = legacy name for premium
  trialStart?: number;     // epoch ms; set when the trial starts
  admin?: boolean;         // unlocked via admin code: premium access + admin tools
  tourParentDone?: boolean; // first-run tutorial flags
  tourKidDone?: boolean;
}

export type RwcStatus = 'new' | 'trying' | 'did' | 'verified';
export interface RwcState { date: string; status: RwcStatus }

/** What the last recordActivity produced — drives celebrations. */
export interface AwardSummary {
  childId: string;
  ts: number;
  stars: number;
  breakdown: string[];
  newBadges: string[];       // labels
  leveledTo?: { level: number; title: string };
  questCompleted?: boolean;
}

export interface AppState {
  onboarded: boolean;
  parent: ParentProfile;
  children: Child[];
  activeChildId: string;
  goals: Goal[];
  lessons: Lesson[];
  savedToolkit: string[];
  challenge: WeeklyChallenge;
  checkins: WeeklyCheckin[];
  settings: Settings;
  /* --- economy (v2) --- */
  activity: ActivityEvent[];
  realWorld: Record<string, RwcState>;          // childId → today's RWC state
  parentRecs: Record<string, AreaKey | null>;   // childId → parent-recommended area
  weeklyClaimed: Record<string, string>;        // childId → weekStart already claimed
  earnedBadges: Record<string, Record<string, number>>; // childId → badgeKey → ts
  lastAward?: AwardSummary;
}

const seedState = (): AppState => ({
  onboarded: false,
  parent: structuredClone(SEED_PARENT),
  children: structuredClone(SEED_CHILDREN),
  activeChildId: SEED_CHILDREN[0].id,
  goals: structuredClone(SEED_GOALS),
  lessons: seedLessons(),
  savedToolkit: [],
  challenge: structuredClone(WEEKLY_CHALLENGE),
  checkins: [],
  settings: { notifications: true, pin: '1234', checkinDay: 0, music: true, sfx: true },
  activity: [],
  realWorld: {},
  parentRecs: {},
  weeklyClaimed: {},
  earnedBadges: {},
});

export interface RecordActivityInput {
  childId: string;
  kind: ActivityKind;
  area?: AreaKey;
  scenarioId?: string;
  xpRatio?: number;      // journey: earned/max
  perfect?: boolean;     // quickfire perfect round / boss perfect
  fullRound?: boolean;   // quickfire finished all questions
}

type Action =
  | { type: 'setActiveChild'; id: string }
  | { type: 'completeOnboarding'; parent: Partial<ParentProfile>; child: Child; goal: Goal }
  | { type: 'replayOnboarding' }
  | { type: 'addChild'; child: Child }
  | { type: 'awardStars'; childId: string; stars: number; area?: AreaKey }
  | { type: 'recordActivity'; input: RecordActivityInput }
  | { type: 'rwcSet'; childId: string; status: RwcStatus }
  | { type: 'rwcVerify'; childId: string }
  | { type: 'claimWeekly'; childId: string }
  | { type: 'recommendArea'; childId: string; area: AreaKey | null }
  | { type: 'updateParent'; patch: Partial<ParentProfile> }
  | { type: 'logWin'; childId: string; area: AreaKey | null; note: string }
  | { type: 'setLessonStatus'; id: string; status: Lesson['status']; progress?: number }
  | { type: 'saveToolkit'; label: string }
  | { type: 'markChallengeDone' }
  | { type: 'recordCheckin'; checkin: WeeklyCheckin }
  | { type: 'updateSettings'; patch: Partial<Settings> }
  | { type: 'setGoal'; goal: Goal };

function mapChild(state: AppState, id: string, fn: (c: Child) => Child): AppState {
  return { ...state, children: state.children.map((c) => (c.id === id ? fn(c) : c)) };
}

/** Refresh a child's derived level/streak fields from the economy (kept on the
 *  object so every existing screen shows spec-correct values). */
function refreshChild(c: Child, activity: ActivityEvent[]): Child {
  const lvl = levelForStars(c.stars);
  const streak = learningStreak(activity, c.id);
  return {
    ...c,
    level: lvl.level,
    levelName: lvl.title,
    nextLevelName: lvl.next?.title ?? lvl.title,
    starsToNext: lvl.next ? lvl.next.stars : c.stars,
    streak: streak.current,
  };
}

const journeyTotal = (area: AreaKey) => SCENARIO_TOTALS[AREA_TO_JOURNEY[area]] ?? 0;

/** The award pipeline: base stars + first-of-day + daily-quest bonus + new-badge
 *  bonuses (+50 each) + journey-completion bonus. Single source of truth. */
function applyAward(state: AppState, input: RecordActivityInput): AppState {
  const now = Date.now();
  const child = state.children.find((c) => c.id === input.childId);
  if (!child) return state;

  // base stars per activity table
  let base = 0;
  switch (input.kind) {
    case 'journey': base = journeyStars(input.xpRatio ?? 0.8); break;
    case 'quickfire': base = quickfireStars(input.fullRound ?? true, input.perfect ?? false); break;
    case 'sayit': base = REWARD.sayitBase; break;
    case 'realworld': base = REWARD.realworldDidIt; break;
    case 'boss': base = REWARD.bossBase + (input.perfect ? REWARD.bossPerfect : 0); break;
    case 'lesson': base = 0; break; // parent lessons don't award kid stars
  }

  const breakdown: string[] = [`+${base} ${input.kind === 'boss' ? 'Boss Challenge' : 'activity'}`];
  let stars = base;

  // first meaningful activity of the day
  if (isFirstOfDay(state.activity, child.id, now)) {
    stars += REWARD.firstOfDayBonus;
    breakdown.push(`+${REWARD.firstOfDayBonus} first activity today`);
  }

  const event: ActivityEvent = {
    id: `a-${now}-${Math.random().toString(36).slice(2, 7)}`,
    childId: child.id, ts: now, kind: input.kind, area: input.area,
    scenarioId: input.scenarioId, stars: base, perfect: input.perfect,
  };
  const activity = [...state.activity, event];

  // daily quest completion bonus (crossing from not-done → done)
  const quest = dailyQuest(todayKey(), child.id);
  const wasDone = dailyQuestDone(quest, state.activity, child.id);
  const nowDone = dailyQuestDone(quest, activity, child.id);
  const questCompleted = !wasDone && nowDone;
  if (questCompleted) {
    stars += REWARD.dailyQuestBonus;
    breakdown.push(`+${REWARD.dailyQuestBonus} Daily Quest complete`);
  }

  // journey completion bonus (this event pushes the journey to level 5)
  if (input.area) {
    const before = journeyProgress(state.activity, child.id, input.area, journeyTotal(input.area));
    const after = journeyProgress(activity, child.id, input.area, journeyTotal(input.area));
    if (before.level < 5 && after.level === 5) {
      stars += REWARD.journeyComplete;
      breakdown.push(`+${REWARD.journeyComplete} Journey complete!`);
    }
  }

  // badge awards (+50 each, once)
  const streak = learningStreak(activity, child.id, now);
  const journeys = AREAS.map((a) => journeyProgress(activity, child.id, a.key, journeyTotal(a.key)));
  const ctx = { events: activity, childId: child.id, streak, journeys };
  const already = state.earnedBadges[child.id] ?? {};
  const newBadges = badgeStates(ctx).filter((b) => b.isEarned && !already[b.key]);
  const earnedBadges = newBadges.length
    ? { ...state.earnedBadges, [child.id]: { ...already, ...Object.fromEntries(newBadges.map((b) => [b.key, now])) } }
    : state.earnedBadges;
  if (newBadges.length) {
    stars += newBadges.length * REWARD.badgeBonus;
    breakdown.push(...newBadges.map((b) => `+${REWARD.badgeBonus} badge: ${b.label}`));
  }

  const prevLevel = levelForStars(child.stars).level;
  const newStars = child.stars + stars;
  const newLevel = levelForStars(newStars);

  const nextState: AppState = {
    ...mapChild({ ...state, activity, earnedBadges }, child.id, (c) =>
      refreshChild({
        ...c,
        stars: newStars,
        areaScores: input.area
          ? { ...c.areaScores, [input.area]: Math.min(100, c.areaScores[input.area] + 4) }
          : c.areaScores,
      }, activity)),
    lastAward: {
      childId: child.id, ts: now, stars, breakdown,
      newBadges: newBadges.map((b) => b.label),
      leveledTo: newLevel.level > prevLevel ? { level: newLevel.level, title: newLevel.title } : undefined,
      questCompleted,
    },
  };
  return nextState;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setActiveChild':
      return { ...state, activeChildId: action.id };

    case 'completeOnboarding': {
      const children = [...state.children, action.child];
      return {
        ...state,
        onboarded: true,
        parent: { ...state.parent, ...action.parent },
        children,
        activeChildId: action.child.id,
        goals: [...state.goals, action.goal],
        settings: { ...state.settings, plan: state.settings.plan ?? 'trial', trialStart: state.settings.plan === 'free' ? state.settings.trialStart : (state.settings.trialStart ?? Date.now()) },
      };
    }

    case 'replayOnboarding':
      return { ...state, onboarded: false };

    case 'addChild':
      return { ...state, children: [...state.children, action.child] };

    case 'awardStars':
      return mapChild(state, action.childId, (c) =>
        refreshChild({
          ...c,
          stars: c.stars + action.stars,
          areaScores: action.area ? { ...c.areaScores, [action.area]: Math.min(100, c.areaScores[action.area] + 4) } : c.areaScores,
        }, state.activity));

    case 'recordActivity':
      return applyAward(state, action.input);

    case 'rwcSet': {
      const today = todayKey();
      if (action.status === 'did') {
        // completing the challenge is a meaningful activity (20★ base via pipeline)
        const awarded = applyAward(state, { childId: action.childId, kind: 'realworld' });
        return { ...awarded, realWorld: { ...awarded.realWorld, [action.childId]: { date: today, status: 'did' } } };
      }
      return { ...state, realWorld: { ...state.realWorld, [action.childId]: { date: today, status: action.status } } };
    }

    case 'rwcVerify': {
      const rw = state.realWorld[action.childId];
      if (!rw || rw.date !== todayKey() || rw.status !== 'did') return state;
      const verified = mapChild(state, action.childId, (c) => refreshChild({ ...c, stars: c.stars + REWARD.realworldVerify }, state.activity));
      // mark today's realworld event as parent-verified
      const activity = verified.activity.map((e) =>
        e.childId === action.childId && e.kind === 'realworld' && dayKeyOf(e.ts) === todayKey()
          ? { ...e, verified: true, stars: e.stars + REWARD.realworldVerify }
          : e,
      );
      return {
        ...verified,
        activity,
        realWorld: { ...state.realWorld, [action.childId]: { ...rw, status: 'verified' } },
      };
    }

    case 'claimWeekly': {
      const week = mondayKey();
      if (state.weeklyClaimed[action.childId] === week) return state;
      if (!weeklyProgress(state.activity, action.childId, week).done) return state;
      const claimed = mapChild(state, action.childId, (c) => refreshChild({ ...c, stars: c.stars + REWARD.weeklyAdventure }, state.activity));
      return {
        ...claimed,
        weeklyClaimed: { ...state.weeklyClaimed, [action.childId]: week },
        lastAward: { childId: action.childId, ts: Date.now(), stars: REWARD.weeklyAdventure, breakdown: [`+${REWARD.weeklyAdventure} Weekly Adventure!`], newBadges: [], questCompleted: false },
      };
    }

    case 'recommendArea':
      return { ...state, parentRecs: { ...state.parentRecs, [action.childId]: action.area } };

    case 'updateParent':
      return { ...state, parent: { ...state.parent, ...action.patch } };

    case 'logWin':
      return mapChild(state, action.childId, (c) => {
        const win = {
          id: `w-${Date.now()}`,
          childId: c.id,
          source: 'kid' as const,
          area: action.area,
          note: action.note,
          date: `${c.name} logged this · just now`,
        };
        const bumped = applyWinBump({ ...c, wins: [win, ...c.wins] }, action.area);
        return refreshChild(bumped, state.activity);
      });

    case 'setLessonStatus':
      return {
        ...state,
        lessons: state.lessons.map((l) =>
          l.id === action.id ? { ...l, status: action.status, progress: action.progress ?? l.progress } : l,
        ),
        parent:
          action.status === 'done'
            ? { ...state.parent, lessonsCompleted: state.parent.lessonsCompleted + 1 }
            : state.parent,
      };

    case 'saveToolkit':
      return state.savedToolkit.includes(action.label)
        ? state
        : { ...state, savedToolkit: [...state.savedToolkit, action.label] };

    case 'markChallengeDone':
      return { ...state, challenge: { ...state.challenge, done: state.challenge.total } };

    case 'recordCheckin': {
      const c = action.checkin;
      const clamp = (n: number) => Math.max(0, Math.min(100, n));
      const ratedKeys = Object.keys(c.areaRatings) as AreaKey[];
      const ratingVals = ratedKeys.map((k) => c.areaRatings[k]!);
      const avg = ratingVals.length ? ratingVals.reduce((a, b) => a + b, 0) / ratingVals.length : 3;
      const chartPoint = Math.round((avg / 5) * 100);

      const pAreas = { ...state.parent.areaScores };
      ratedKeys.forEach((k) => { pAreas[k] = clamp(pAreas[k] + (c.areaRatings[k]! - 3) * 3); });

      const children = state.children.map((ch) => {
        if (ch.id !== c.childId) return ch;
        const wins = c.winNote
          ? [{ id: `w-${Date.now()}`, childId: ch.id, source: 'parent' as const, area: ratedKeys[0] ?? null, note: c.winNote, date: 'You noted this · just now' }, ...ch.wins]
          : ch.wins;
        return { ...ch, weeks: [...ch.weeks, chartPoint].slice(-8), wins };
      });

      return {
        ...state,
        checkins: [...state.checkins, c],
        parent: { ...state.parent, checkinsCount: state.parent.checkinsCount + 1, areaScores: pAreas },
        children,
        challenge: c.challengeDone === 'yes' ? { ...state.challenge, done: state.challenge.total } : state.challenge,
      };
    }

    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'setGoal':
      return {
        ...state,
        goals: [...state.goals.filter((g) => g.childId !== action.goal.childId), action.goal],
        children: state.children.map((c) =>
          c.id === action.goal.childId ? { ...c, currentGoalId: action.goal.id } : c,
        ),
      };

    default:
      return state;
  }
}

function loadState(): AppState {
  if (typeof window === 'undefined') return seedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const merged: AppState = { ...seedState(), ...parsed } as AppState;
    // normalize v2 economy fields for old saves
    merged.activity ??= [];
    merged.realWorld ??= {};
    merged.parentRecs ??= {};
    merged.weeklyClaimed ??= {};
    merged.earnedBadges ??= {};
    merged.settings = { ...seedState().settings, ...(parsed.settings ?? {}) };
    if (merged.settings.plan === 'plus') merged.settings.plan = 'premium';
    if (merged.onboarded && merged.settings.plan == null) {
      merged.settings.plan = 'trial';
      merged.settings.trialStart = merged.settings.trialStart ?? Date.now();
    }
    // re-derive level/streak fields so old saves match the spec level table
    merged.children = merged.children.map((c) => refreshChild(c, merged.activity));
    return merged;
  } catch {
    return seedState();
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  activeChild: Child;
  goalForActive: Goal | undefined;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const value = useMemo<AppContextValue>(() => {
    const activeChild = state.children.find((c) => c.id === state.activeChildId) ?? state.children[0];
    const goalForActive = state.goals.find((g) => g.childId === activeChild.id && g.status === 'active');
    return { state, dispatch, activeChild, goalForActive };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
