/**
 * Quick-fire and Say-it content, derived from the Journey scenarios so all three
 * games draw from the same vetted library. Quick-fire turns a Journey "beat" into
 * a multiple-choice question (the ★★★★★ answer is the correct one); Say-it turns a
 * scenario's "save this line" phrase into a line to rehearse. Rounds are sampled
 * randomly so the games are replayable.
 */
import { JOURNEY_SCENARIOS } from './journeyScenarios';
import { JOURNEY_TO_AREA } from './journey';
import type { QuickfireScenario, RehearsalItem } from '../types';
import type { JourneyBeat, JourneyMode, JourneyScenario } from '../types/journey';

const shuffle = <T>(a: T[]): T[] => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

const unquote = (s: string) => s.replace(/^[“"']|[”"']$/g, '').trim();
const firstSentence = (s: string) => (s.split(/(?<=[.!?…])\s/)[0] || s).trim();
const MODES: JourneyMode[] = ['easy', 'medium', 'hard'];

// ---------- Quick-fire ----------
function beatToQuickfire(scenario: JourneyScenario, mode: JourneyMode, beat: JourneyBeat): QuickfireScenario | null {
  if (beat.kind !== 'conversation') return null;
  const best = beat.choices.filter((c) => c.stars === 5);
  if (best.length !== 1 || !best[0].coaching) return null; // need exactly one clear best, with a real "why"
  if (!beat.narration && !beat.line) return null;
  const scene = [
    beat.narration,
    beat.line ? `${beat.speaker ?? 'They'}: “${beat.line}”` : '',
  ].filter(Boolean).join(' ');
  const options = shuffle(beat.choices.map((c) => ({ text: c.text, correct: c.stars === 5, why: c.coaching })));
  return {
    id: `${scenario.id}-${mode}-${beat.id}`,
    area: JOURNEY_TO_AREA[scenario.category],
    scene,
    prompt: beat.line ? 'What do you say?' : 'What do you do?',
    options,
  };
}

let _qfPool: QuickfireScenario[] | null = null;
function quickfirePool(): QuickfireScenario[] {
  if (_qfPool) return _qfPool;
  const all: QuickfireScenario[] = [];
  for (const s of JOURNEY_SCENARIOS) {
    for (const mode of MODES) {
      const m = s.modes[mode];
      if (!m) continue;
      for (const b of Object.values(m.beats)) {
        const q = beatToQuickfire(s, mode, b);
        if (q) all.push(q);
      }
    }
  }
  _qfPool = all;
  return all;
}

/** A fresh random round of quick-fire questions (options shuffled). */
export function quickfireRound(n = 7): QuickfireScenario[] {
  return shuffle(quickfirePool()).slice(0, n);
}

// ---------- Say it out loud ----------
function scenarioToRehearsal(s: JourneyScenario): RehearsalItem | null {
  const easy = s.modes.easy;
  const line = easy?.saveLine ? unquote(easy.saveLine) : null;
  if (!line) return null;
  const fives = Object.values(easy.beats)
    .flatMap((b) => b.choices.filter((c) => c.stars === 5).map((c) => unquote(c.text)))
    .filter((t) => t.length < 56 && !t.startsWith('('));
  const alts = shuffle([...new Set(fives)].filter((t) => t !== line)).slice(0, 2);
  const startBeat = easy.beats[easy.start];
  const setup = firstSentence(startBeat?.narration || '') || `When it comes to ${s.title.toLowerCase()}.`;
  return {
    id: `${s.id}-say`,
    area: JOURNEY_TO_AREA[s.category],
    setup,
    line,
    cue: 'Say it calm and clear — short is brave.',
    alts,
  };
}

/** A fresh random round of lines to rehearse. */
export function sayItRound(n = 10): RehearsalItem[] {
  const items = JOURNEY_SCENARIOS.map(scenarioToRehearsal).filter((x): x is RehearsalItem => x !== null);
  return shuffle(items).slice(0, n);
}
