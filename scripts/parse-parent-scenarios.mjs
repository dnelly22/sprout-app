// Parses the Parent Communication Library markdown files into typed lesson data.
// Run: node scripts/parse-parent-scenarios.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const DOWNLOADS = '/Users/davidnf/Downloads';

const FILES = [
  { file: 'parent-comm-library-01-connecting.md',           cat: 'connecting',        short: 'pconn' },
  { file: 'parent-comm-library-02-speaking-up.md',          cat: 'speakingup',        short: 'pspk' },
  { file: 'parent-comm-library-03-relationships.md',        cat: 'relationships',     short: 'prel' },
  { file: 'parent-comm-library-04-understanding-people.md', cat: 'understanding',     short: 'pund' },
  { file: 'parent-comm-library-05-boundaries.md',           cat: 'boundaries',        short: 'pbnd' },
  { file: 'parent-comm-library-06-hard-conversations.md',   cat: 'hardconversations', short: 'phard' },
];

const stripEmphasis = (s) => s.replace(/\*/g, '').replace(/_{2}/g, '').trim();

const collapsePara = (raw) =>
  stripEmphasis(
    raw.split('\n').filter((l) => l.trim() && !l.trim().startsWith('>')).join(' ').replace(/\s+/g, ' '),
  );

const collectBullets = (raw) =>
  raw.split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- '))
    .map((l) => stripEmphasis(l.slice(2)))
    .filter(Boolean);

const MARKERS = [
  { field: 'theMoment',          re: /\*\*The Situation\*\*/ },
  { field: 'whatsReallyGoingOn', re: /\*\*What.s Really Going On\?\*\*/ },
  { field: 'whatToSay',          re: /\*\*What To Say\*\*/ },
  { field: 'questionsToAsk',     re: /\*\*Questions To Ask\*\*/ },
  { field: 'howToSayIt',         re: /\*\*How To Say It\*\*/ },
  { field: 'commonMistakes',     re: /\*\*Common Mistakes\*\*/ },
  { field: 'tryItThisWeek',      re: /\*\*Try It This Week\*\*/ },
  { field: 'saveLine',           re: /\*\*Save This Line\*\*/ },
];

function parseLesson(text) {
  const found = [];
  for (const { field, re } of MARKERS) {
    const m = re.exec(text);
    if (m) found.push({ field, start: m.index, lineEnd: text.indexOf('\n', m.index) });
  }
  found.sort((a, b) => a.start - b.start);
  const raw = {};
  for (let i = 0; i < found.length; i++) {
    const cur = found[i];
    const next = found[i + 1];
    const from = cur.lineEnd === -1 ? text.length : cur.lineEnd + 1;
    const to = next ? next.start : text.length;
    raw[cur.field] = text.slice(from, to).trim();
  }

  // tryIt may carry a "> *Note:*" line before Save This Line.
  let note;
  let tryIt = raw.tryItThisWeek || '';
  if (tryIt) {
    const noteLines = tryIt.split('\n').filter((l) => l.trim().startsWith('>'));
    if (noteLines.length) {
      note = stripEmphasis(noteLines.join(' ').replace(/^>\s*/gm, '').replace(/\s+/g, ' ')).replace(/^Note:\s*/i, '');
    }
    tryIt = collapsePara(tryIt);
  }

  let keyLine;
  if (raw.saveLine) keyLine = stripEmphasis(raw.saveLine.split('\n').find((l) => l.trim()) || '');

  return {
    theMoment: collapsePara(raw.theMoment || ''),
    whatsReallyGoingOn: collapsePara(raw.whatsReallyGoingOn || ''),
    whatToSay: collectBullets(raw.whatToSay || ''),
    questionsToAsk: collectBullets(raw.questionsToAsk || ''),
    howToSayIt: collapsePara(raw.howToSayIt || ''),
    commonMistakes: collectBullets(raw.commonMistakes || ''),
    tryItThisWeek: tryIt,
    keyLine,
    note,
  };
}

const all = [];
for (const { file, cat, short } of FILES) {
  const text = readFileSync(`${DOWNLOADS}/${file}`, 'utf8');
  // Lesson blocks start with "# N · Title"
  const blocks = text.split(/\n(?=# \d+ · )/);
  let n = 0;
  for (const block of blocks) {
    const titleMatch = block.match(/^# (\d+) · (.+)$/m);
    if (!titleMatch) continue;
    n += 1;
    const title = titleMatch[2].trim();
    // cut off any trailing Tools / "Next category" section within the block
    const body = block.split(/\n## |\n\*Next category/)[0];
    const parsed = parseLesson(body);
    all.push({
      id: `${short}${n}`,
      shelf: 'situations',
      situationCategory: cat,
      areaTags: [],
      title,
      ...parsed,
    });
  }
  console.error(`${cat}: ${n} lessons`);
}

// Emit TS
const lines = [];
lines.push(`import type { LessonContent } from '../types';`);
lines.push('');
lines.push('/**');
lines.push(' * Parent Communication Library — the parent\'s own scenarios ("Your situations").');
lines.push(' * AUTO-GENERATED from the markdown sources by scripts/parse-parent-scenarios.mjs.');
lines.push(' * Edit the markdown and re-run, or tweak here directly.');
lines.push(' */');
lines.push('export const PARENT_SCENARIOS: LessonContent[] = [');
for (const l of all) {
  lines.push('  {');
  lines.push(`    id: ${JSON.stringify(l.id)}, shelf: 'situations', situationCategory: ${JSON.stringify(l.situationCategory)}, areaTags: [],`);
  lines.push(`    title: ${JSON.stringify(l.title)},`);
  lines.push(`    theMoment: ${JSON.stringify(l.theMoment)},`);
  lines.push(`    whatsReallyGoingOn: ${JSON.stringify(l.whatsReallyGoingOn)},`);
  lines.push(`    whatToSay: ${JSON.stringify(l.whatToSay)},`);
  lines.push(`    questionsToAsk: ${JSON.stringify(l.questionsToAsk)},`);
  lines.push(`    howToSayIt: ${JSON.stringify(l.howToSayIt)},`);
  lines.push(`    commonMistakes: ${JSON.stringify(l.commonMistakes)},`);
  lines.push(`    tryItThisWeek: ${JSON.stringify(l.tryItThisWeek)},`);
  if (l.keyLine) lines.push(`    keyLine: ${JSON.stringify(l.keyLine)},`);
  if (l.note) lines.push(`    note: ${JSON.stringify(l.note)},`);
  lines.push('  },');
}
lines.push('];');
lines.push('');

writeFileSync(new URL('../src/data/parentScenarios.ts', import.meta.url), lines.join('\n'));
console.error(`\nTotal: ${all.length} lessons → src/data/parentScenarios.ts`);
