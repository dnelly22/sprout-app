import type { Goal, ParentProfile, WeeklyChallenge } from '../types';

export const SEED_PARENT: ParentProfile = {
  name: 'Jordan',
  email: '',
  type: 'The Steady Encourager',
  consentGiven: true,
  areaScores: { speakup: 72, listen: 48, feelings: 60, conflict: 55, connect: 80 },
  lessonsCompleted: 14,
  checkinsCount: 5,
  insight: {
    area: 'listen',
    text: 'Staying calm is your softest area right now. The “When big feelings hit” lessons are tuned to help you stay grounded mid-moment.',
  },
};

/** Per-child focus statement shown on Today. */
export const FOCUS_BY_CHILD: Record<string, string> = {
  mia: 'Helping Mia speak up when she feels nervous',
  theo: 'Helping Theo stay calm before big feelings boil over',
};

export const SEED_GOALS: Goal[] = [
  { id: 'goal-mia',  childId: 'mia',  area: 'speakup', statement: 'Help Mia speak up when she feels nervous',        status: 'active' },
  { id: 'goal-theo', childId: 'theo', area: 'listen',  statement: 'Help Theo stay calm before big feelings boil over', status: 'active' },
];

export const WEEKLY_CHALLENGE: WeeklyChallenge = {
  title: 'Catch one brave moment and name it out loud',
  detailTemplate: 'When {name} tries something hard this week, tell {them} exactly what you saw.',
  done: 1,
  total: 3,
};
