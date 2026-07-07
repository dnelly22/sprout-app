/**
 * THE five communication areas — single source of truth.
 *
 * The README's #1 gotcha: there is ONE set of five areas, used identically
 * across parent, kid, assessment, and progress, but with TWO label
 * vocabularies — the parent-facing "area" label and the kid-facing "world"
 * name. Keep that mapping here and nowhere else.
 *
 * Key      parentLabel          kidWorld      color token        icon (Lucide)
 * speakup  Speaking up          Talking       --area-speakup     megaphone
 * listen   Staying calm         Teasing       --area-listen      leaf
 * feelings Setting boundaries   Boundaries    --area-feelings    shield
 * conflict Reading the room     People        --area-conflict    eye
 * connect  Connecting           Friends       --area-connect     heart
 */

export type AreaKey = 'speakup' | 'listen' | 'feelings' | 'conflict' | 'connect';

export interface AreaDef {
  key: AreaKey;
  /** Parent-facing label (used on parent screens + progress). */
  parentLabel: string;
  /** Kid-facing playful "world" name (used in Kid Zone). */
  kidWorld: string;
  /** CSS custom property for this area's color. */
  color: string;
  /** Lucide icon name (PascalCase resolved in <Icon/>). */
  icon: string;
  /** Kid Zone quest-world icon (can differ from the parent area icon). */
  questIcon: string;
}

export const AREAS: AreaDef[] = [
  { key: 'speakup',  parentLabel: 'Speaking up',        kidWorld: 'Talking',    color: 'var(--area-speakup)',  icon: 'megaphone', questIcon: 'megaphone' },
  { key: 'listen',   parentLabel: 'Staying calm',       kidWorld: 'Teasing',    color: 'var(--area-listen)',   icon: 'leaf',      questIcon: 'shield' },
  { key: 'feelings', parentLabel: 'Setting boundaries', kidWorld: 'Boundaries', color: 'var(--area-feelings)', icon: 'shield',    questIcon: 'hand' },
  { key: 'conflict', parentLabel: 'Reading the room',   kidWorld: 'People',     color: 'var(--area-conflict)', icon: 'eye',       questIcon: 'eye' },
  { key: 'connect',  parentLabel: 'Connecting',         kidWorld: 'Friends',    color: 'var(--area-connect)',  icon: 'heart',     questIcon: 'users' },
];

export const AREA_KEYS = AREAS.map((a) => a.key);

const byKey = Object.fromEntries(AREAS.map((a) => [a.key, a])) as Record<AreaKey, AreaDef>;

export const areaByKey = (key: AreaKey): AreaDef => byKey[key];
export const areaColor = (key: AreaKey): string => byKey[key].color;
export const areaParentLabel = (key: AreaKey): string => byKey[key].parentLabel;
export const areaKidWorld = (key: AreaKey): string => byKey[key].kidWorld;
export const areaIcon = (key: AreaKey): string => byKey[key].icon;

/** A zeroed-out per-area record, handy for new children / accumulators. */
export const emptyAreaScores = (): Record<AreaKey, number> => ({
  speakup: 0, listen: 0, feelings: 0, conflict: 0, connect: 0,
});
