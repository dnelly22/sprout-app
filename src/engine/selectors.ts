import { useMemo } from 'react';
import { useApp } from '../store/AppStore';
import { AREAS, type AreaKey } from '../constants/areas';
import { AREA_TO_JOURNEY } from '../data/journey';
import { SCENARIO_TOTALS } from '../data/journeyMeta';
import {
  levelForStars, learningStreak, journeyProgress, badgeStates, toolStates,
  dailyQuest, dailyQuestDone, weeklyProgress, nextUnlock, bossUnlock,
  realWorldChallenge, weeklySummary, todayKey, mondayKey,
  type JourneyProgress, type BadgeState, type LevelState,
} from './economy';
import type { RwcStatus } from '../store/AppStore';

export interface ChildEconomy {
  childId: string;
  stars: number;
  level: LevelState;
  streak: { current: number; longest: number; activeToday: boolean };
  journeys: (JourneyProgress & { areaLabel: string; kidWorld: string; color: string; icon: string })[];
  currentJourney: AreaKey;                    // where the child left off (or parent rec)
  parentRecommended: AreaKey | null;
  badges: BadgeState[];
  badgesEarned: number;
  tools: ReturnType<typeof toolStates>;
  quest: { def: ReturnType<typeof dailyQuest>; done: boolean };
  weekly: ReturnType<typeof weeklyProgress> & { claimed: boolean };
  boss: ReturnType<typeof bossUnlock> & { done: boolean };
  next: ReturnType<typeof nextUnlock>;
  rwc: { text: string; status: RwcStatus };
  summary: ReturnType<typeof weeklySummary>;
  stats: { journeys: number; quickfires: number; sayits: number; realworld: number; explored: number };
}

/** All derived economy state for one child — the single lens every screen uses. */
export function useChildEconomy(childId?: string): ChildEconomy {
  const { state, activeChild } = useApp();
  const id = childId ?? activeChild.id;
  return useMemo(() => {
    const child = state.children.find((c) => c.id === id) ?? activeChild;
    const events = state.activity;
    const streak = learningStreak(events, id);
    const journeys = AREAS.map((a) => ({
      ...journeyProgress(events, id, a.key, SCENARIO_TOTALS[AREA_TO_JOURNEY[a.key]] ?? 0),
      areaLabel: a.parentLabel,
      kidWorld: a.kidWorld,
      color: a.color,
      icon: a.questIcon,
    }));
    const ctx = { events, childId: id, streak, journeys };
    const badges = badgeStates(ctx);
    const questDef = dailyQuest(todayKey(), id);
    const weekly = weeklyProgress(events, id);
    const mine = events.filter((e) => e.childId === id);
    const lastWithArea = [...mine].reverse().find((e) => e.area);
    const parentRecommended = state.parentRecs[id] ?? null;
    const rwState = state.realWorld[id];
    const boss = bossUnlock(journeys);
    return {
      childId: id,
      stars: child.stars,
      level: levelForStars(child.stars),
      streak,
      journeys,
      currentJourney: parentRecommended ?? (lastWithArea?.area as AreaKey | undefined) ?? 'connect',
      parentRecommended,
      badges,
      badgesEarned: badges.filter((b) => b.isEarned).length,
      tools: toolStates(events, id),
      quest: { def: questDef, done: dailyQuestDone(questDef, events, id) },
      weekly: { ...weekly, claimed: state.weeklyClaimed[id] === mondayKey() },
      boss: { ...boss, done: mine.some((e) => e.kind === 'boss') },
      next: nextUnlock(child.stars, ctx),
      rwc: {
        text: realWorldChallenge(todayKey(), id),
        status: rwState && rwState.date === todayKey() ? rwState.status : 'new',
      },
      summary: weeklySummary(events, id),
      stats: {
        journeys: mine.filter((e) => e.kind === 'journey').length,
        quickfires: mine.filter((e) => e.kind === 'quickfire').length,
        sayits: mine.filter((e) => e.kind === 'sayit').length,
        realworld: mine.filter((e) => e.kind === 'realworld').length,
        explored: journeys.filter((j) => j.activities > 0).length,
      },
    };
  }, [state, id, activeChild]);
}
