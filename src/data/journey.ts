import type { JourneyArea } from '../types/journey';
import type { AreaKey } from '../constants/areas';

// NOTE: This module is intentionally data-free. The heavy JOURNEY_SCENARIOS
// array (and the helpers that read it) live in ./journeyData so that the tiny
// area maps below can be imported by parent-facing / Kid Zone shell code without
// dragging the ~50KB scenario bundle into the chunk. Keep it that way.

/** Quest worlds (5 areas) ↔ Journey categories. bigFeelings is a future 6th world. */
export const AREA_TO_JOURNEY: Record<AreaKey, JourneyArea> = {
  connect: 'friends',
  speakup: 'talking',
  listen: 'teasing',
  conflict: 'people',
  feelings: 'boundaries',
};

/** Journey category → quest area (for awarding stars). */
export const JOURNEY_TO_AREA: Record<JourneyArea, AreaKey> = {
  friends: 'connect',
  talking: 'speakup',
  teasing: 'listen',
  people: 'conflict',
  boundaries: 'feelings',
  bigFeelings: 'feelings',
};

export const MODE_META: Record<'easy' | 'medium' | 'hard', { label: string; dot: string; color: string }> = {
  easy: { label: 'Easy', dot: '🟢', color: 'var(--green-500)' },
  medium: { label: 'Medium', dot: '🟡', color: 'var(--sun-500)' },
  hard: { label: 'Hard', dot: '🔴', color: 'var(--coral-500)' },
};
