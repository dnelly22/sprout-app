import { areaColor, areaIcon, type AreaKey } from '../constants/areas';
import type { LessonCategory, LessonContent, SituationCategory } from '../types';
import { LESSON_CONTENT, validateLessonContent } from './lessonContent';
import { PARENT_SCENARIOS } from './parentScenarios';

/**
 * Library metadata + combined lookups.
 *  - "Talking with your child" shelf → LESSON_CONTENT (7 categories)
 *  - "Your situations" shelf          → PARENT_SCENARIOS (6 categories)
 */

export interface CategoryDef<K extends string> {
  key: K;
  label: string;
  emoji: string;
  /** Lucide icon for the solid colored tile. */
  icon: string;
  color: string;
}

/** The seven "Talking with your child" categories, in display order. */
export const LESSON_CATEGORIES: CategoryDef<LessonCategory>[] = [
  { key: 'openup',            label: 'Open Up',                 emoji: '💬', icon: 'message-circle', color: 'var(--sky-500)' },
  { key: 'bigfeelings',       label: 'Big Feelings',            emoji: '❤️', icon: 'heart',          color: 'var(--berry-500)' },
  { key: 'confidence',        label: 'Building Confidence',     emoji: '🌟', icon: 'star',           color: 'var(--sun-600)' },
  { key: 'friends',           label: 'Friends & Social Skills', emoji: '👥', icon: 'users',          color: 'var(--green-500)' },
  { key: 'boundaries',        label: 'Boundaries & Self-Respect', emoji: '🛡️', icon: 'shield',       color: 'var(--grape-500)' },
  { key: 'hardconversations', label: 'Hard Conversations',      emoji: '🚧', icon: 'compass',        color: 'var(--coral-500)' },
  { key: 'connection',        label: 'Connection & Trust',      emoji: '🤝', icon: 'sparkles',       color: '#2F8E7C' },
];

/** The six "Your situations" categories (parent's own communication). */
export const SITUATION_CATEGORIES: CategoryDef<SituationCategory>[] = [
  { key: 'connecting',        label: 'Connecting',         emoji: '🤝', icon: 'users',     color: '#2F8E7C' },
  { key: 'speakingup',        label: 'Speaking Up',        emoji: '🗣️', icon: 'megaphone', color: 'var(--coral-500)' },
  { key: 'relationships',     label: 'Relationships',      emoji: '❤️', icon: 'heart',     color: 'var(--berry-500)' },
  { key: 'understanding',     label: 'Understanding People', emoji: '🧠', icon: 'brain',   color: 'var(--grape-500)' },
  { key: 'boundaries',        label: 'Boundaries',         emoji: '🛡️', icon: 'shield',    color: 'var(--sky-500)' },
  { key: 'hardconversations', label: 'Hard Conversations', emoji: '🚧', icon: 'compass',   color: 'var(--sun-600)' },
];

const lessonCatById = Object.fromEntries(LESSON_CATEGORIES.map((c) => [c.key, c]));
const sitCatById = Object.fromEntries(SITUATION_CATEGORIES.map((c) => [c.key, c]));

export const lessonCategory = (key: LessonCategory) => lessonCatById[key];
export const situationCategory = (key: SituationCategory) => sitCatById[key];

/**
 * Solid colored tile + white icon for a lesson — prefers a tagged kid area,
 * then the talking category, then the situation category.
 */
export function lessonVisual(l: { areaTags: AreaKey[]; parentCategory?: LessonCategory; situationCategory?: SituationCategory }): { color: string; icon: string } {
  if (l.areaTags.length) return { color: areaColor(l.areaTags[0]), icon: areaIcon(l.areaTags[0]) };
  if (l.parentCategory) { const c = lessonCategory(l.parentCategory); return { color: c.color, icon: c.icon }; }
  if (l.situationCategory) { const c = situationCategory(l.situationCategory); return { color: c.color, icon: c.icon }; }
  return { color: 'var(--coral-500)', icon: 'message-circle' };
}

/** Every authored lesson across both shelves. */
export const ALL_LESSON_CONTENT: LessonContent[] = [...LESSON_CONTENT, ...PARENT_SCENARIOS];

if (import.meta.env.DEV) validateLessonContent(ALL_LESSON_CONTENT);

const contentById = Object.fromEntries(ALL_LESSON_CONTENT.map((l) => [l.id, l]));
export const lessonContentById = (id: string): LessonContent | undefined => contentById[id];

/** Lesson the Today "continue where you left off" card points at by default. */
export const CONTINUE_LESSON = { id: 'open1' };
