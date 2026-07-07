import type { AreaKey } from '../constants/areas';

export interface QuizQuestion {
  q: string; // may contain {name}
  options: string[];
}

/** Parenting quiz (E onboarding). Q1 drives the profile; Q3 picks the first goal. */
export const QUIZ: QuizQuestion[] = [
  {
    q: 'When {name} comes home upset about a friend, you usually…',
    options: ['Jump in with advice right away', 'Ask questions and listen first', 'Give them space, then circle back'],
  },
  {
    q: 'How does {name} handle a brand-new group of kids?',
    options: ['Dives right in', 'Warms up slowly', 'Sticks close to kids they know'],
  },
  {
    q: 'What do you most want to practice together?',
    options: ['Speaking up', 'Making friends', 'Handling teasing', 'Staying calm'],
  },
];

export interface ParentPower {
  type: string;
  traits: [string, string, string];
  blurb: string; // may contain {name}
}

/** Profile result by Q1 answer index. */
export const PARENT_POWERS: ParentPower[] = [
  {
    type: 'The Action Coach',
    traits: ['Direct', 'Practical', 'Energizing'],
    blurb: 'You jump in with solutions. Sprout adds scripts so {name} finds the words themselves.',
  },
  {
    type: 'The Steady Encourager',
    traits: ['Patient', 'Consistent', 'Warm'],
    blurb: 'You lead with calm and consistency. Sprout builds on that.',
  },
  {
    type: 'The Gentle Guide',
    traits: ['Calm', 'Trusting', 'Thoughtful'],
    blurb: 'You give space and circle back. Sprout hands you the words for the circle-back.',
  },
];

/** First goal by Q3 answer index. */
export const GOAL_BY_FOCUS: { area: AreaKey; statement: string }[] = [
  { area: 'speakup',  statement: 'Help {name} speak up when {subj} {feel} nervous' },
  { area: 'connect',  statement: 'Help {name} feel brave making new friends' },
  { area: 'listen',   statement: 'Help {name} stay steady when teasing happens' },
  { area: 'feelings', statement: 'Help {name} handle big feelings calmly' },
];
