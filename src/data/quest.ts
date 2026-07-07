import type { QuestWorld, ToolkitItem } from '../types';

export const LEVEL_LADDER = [
  'Brave Beginner',
  'Getting Bolder',
  'Confident Kid',
  'Confidence Champion',
];

export const QUEST_MAX = 5;

/**
 * The kid's five "worlds" — playful category names mapped onto the five areas.
 * They unlock in sequence; "Challenges" is the capstone unlocked when all are done.
 */
export const QUEST_WORLDS: QuestWorld[] = [
  { key: 'connect',  name: 'Friends',    area: 'connect',  icon: 'users',     status: 'done',    lvl: 4 },
  { key: 'speakup',  name: 'Talking',    area: 'speakup',  icon: 'megaphone', status: 'done',    lvl: 3 },
  { key: 'listen',   name: 'Teasing',    area: 'listen',   icon: 'shield',    status: 'current', lvl: 2, done: 2, total: 3 },
  { key: 'conflict', name: 'People',     area: 'conflict', icon: 'eye',       status: 'current', lvl: 1, done: 0, total: 3 },
  { key: 'feelings', name: 'Boundaries', area: 'feelings', icon: 'hand',      status: 'current', lvl: 1, done: 0, total: 3 },
];

export const TOOLKIT: ToolkitItem[] = [
  { id: 'ford',  label: 'FORD',                  hint: 'Family · Occupation · Recreation · Dreams', icon: 'message-circle',
    steps: ['Family — ask about home & people', 'Occupation — school, what they do', 'Recreation — fun, games, hobbies', 'Dreams — what they wish for'] },
  { id: 'ptr',   label: 'Pause · Think · Respond', hint: 'Take a beat before you react', icon: 'brain',
    steps: ['Pause — stop and breathe', 'Think — what do I really want?', 'Respond — say it calm and clear'] },
  { id: 'calm',  label: 'Calm & short',           hint: 'Say it once, kind and clear', icon: 'volume-2',
    steps: ['Keep your voice calm', 'Say it once', 'Don’t over-explain'] },
];
