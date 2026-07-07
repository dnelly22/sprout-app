// Parses the founder's Journey scenario markdown (journey-<cat>-NN-*.md) into
// typed data at src/data/journeyScenarios.ts. Re-run when the markdown changes:
//   node scripts/parse-journey.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Scenario markdown lives in the repo at content/journey/ — add or edit files
// there, then re-run this script to regenerate the typed data.
const SRC_DIR = join(process.cwd(), 'content/journey');
const OUT = join(process.cwd(), 'src/data/journeyScenarios.ts');

const stripEmphasis = (s) =>
  (s ?? '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const lastBacktick = (s) => { const m = [...s.matchAll(/`([^`]+)`/g)]; return m.length ? m[m.length - 1][1].trim() : null; };
// header ids are written `id: e1` — pull just the id
const beatId = (s) => { const m = s.match(/`id:\s*([^`]+)`/i); return m ? m[1].trim() : null; };

const QUALITY = new Set(['passive', 'poor', 'partial repair', 'refuses repair', 'repair']);

function parseChoiceLine(line) {
  // **A.** <text> — ★★★★★ · +25 XP · *traits*
  const m = line.match(/^\*\*([A-D])\.\*\*\s*(.*)$/);
  if (!m) return null;
  const letter = m[1];
  let rest = m[2];
  // split on the em-dash that precedes the RATING (★/☆) — answer text itself often
  // contains em-dashes ("Ha, fair — inside jokes are the best…"), so match greedily.
  let text = rest, meta = '';
  const dm = rest.match(/^(.*)\s—\s([★☆].*)$/s);
  if (dm) { text = dm[1]; meta = dm[2]; }
  text = stripEmphasis(text);
  const filled = (meta.match(/★/g) || []).length;
  const stars = filled === 0 ? 1 : filled;
  const xpM = meta.match(/\+(\d+)\s*XP/);
  const xp = xpM ? Number(xpM[1]) : 0;
  // trailing *traits* (last emphasis run in meta)
  const traitM = [...meta.matchAll(/\*([^*]+)\*/g)];
  let traits = [];
  if (traitM.length) {
    const raw = traitM[traitM.length - 1][1].trim();
    if (!QUALITY.has(raw.toLowerCase())) traits = raw.split(/[,·]/).map((t) => t.trim()).filter(Boolean);
  }
  // some answers put the next-beat inline on the choice line: ... *Boundaries* → `e2`
  const inlineNext = lastBacktick(line);
  return { letter, text, stars, xp, traits, inlineNext };
}

function parseCoachingLine(line) {
  // → *Coaching:* "..." **Skill learned: X.** ... *Tip: ...* → `next`
  let body = line.replace(/^→\s*/, '').replace(/\*Coaching:\*\s*/i, '');
  const next = lastBacktick(body);
  // remove the trailing → `next`
  body = body.replace(/→\s*`[^`]+`\s*$/, '').trim();
  let skillLearned;
  const skillM = body.match(/\*\*Skill learned:\s*([^*]+?)\.?\*\*/i);
  if (skillM) skillLearned = skillM[1].trim();
  let tip;
  const tipM = body.match(/\*Tip:\s*([^*]+)\*/i);
  if (tipM) tip = stripEmphasis(tipM[1]);
  // clean coaching prose: drop the skill-learned + tip markers
  let coaching = body
    .replace(/\*\*Skill learned:[^*]+\*\*/i, '')
    .replace(/\*Tip:[^*]+\*/i, '');
  coaching = stripEmphasis(coaching).replace(/^["“]|["”]\s*$/g, '').trim();
  return { coaching, skillLearned, tip, next };
}

function parseSpeakerLine(line) {
  // **Name** *(desc)*: "line"   OR   **Name:** "line"
  let m = line.match(/^\*\*([^*]+?)\*\*\s*(?:\*\([^)]*\)\*)?\s*:?\s*["“](.+)["”]\s*$/);
  if (!m) m = line.match(/^\*\*([^:*]+):\*\*\s*["“](.+)["”]\s*$/);
  if (!m) return null;
  return { speaker: m[1].replace(/:$/, '').trim(), line: stripEmphasis(m[2]) };
}

function parseBeat(headerLine, body) {
  const id = beatId(headerLine);
  const isRepair = /Repair Opportunity/i.test(headerLine);
  const isReflection = /Final Reflection/i.test(headerLine);
  const titleM = headerLine.match(/—\s*(.+?)\s*`id:/);
  const title = titleM ? stripEmphasis(titleM[1]) : undefined;
  const lines = body.split('\n');

  if (isReflection) {
    const quote = lines.filter((l) => l.trim().startsWith('>')).map((l) => l.replace(/^>\s?/, '').trim());
    const reflection = stripEmphasis(quote.join('\n').replace(/^["“]|["”]$/g, '')).replace(/\\n/g, '\n');
    // keep paragraph breaks
    const reflectionText = quote.join('\n').replace(/^>?\s*/, '');
    const saveM = body.match(/\*\*Save this line:\*\*\s*(?:💬\s*)?\*?["“]?(.+?)["”]?\*?\s*$/m);
    const saveLine = saveM ? stripEmphasis(saveM[1]) : undefined;
    return { kind: 'reflection', id, reflection: cleanReflection(quote), saveLine };
  }

  let narration = '';
  let speaker, line;
  const choices = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    const c = parseChoiceLine(l);
    if (c) {
      const { inlineNext, ...choice } = c;
      // a coaching line is the NEXT non-empty line if it starts with → ; otherwise
      // the choice carried its next inline and has no separate coaching.
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      let coach;
      if (j < lines.length && lines[j].trim().startsWith('→')) {
        coach = parseCoachingLine(lines[j].trim());
        i = j;
      } else {
        coach = { coaching: '', skillLearned: undefined, tip: undefined, next: inlineNext };
      }
      if (!coach.next) coach.next = inlineNext;
      choices.push({ ...choice, ...coach });
      continue;
    }
    if (choices.length) continue; // skip anything between/after choices
    if (/^\*\*Your move:\*\*/.test(l)) continue;
    const nm = l.match(/^\*\*Narration:\*\*\s*(.+)$/);
    if (nm) { narration = stripEmphasis(nm[1]); continue; }
    if (/^\*\*Setting:\*\*/.test(l)) continue; // per-beat setting (ignore for now)
    const sp = parseSpeakerLine(l);
    if (sp) {
      if (/^you$/i.test(sp.speaker)) narration = (narration ? narration + ' ' : '') + `You: “${sp.line}”`;
      else { speaker = sp.speaker; line = sp.line; }
      continue;
    }
    // speaker doing an action with no spoken line: **Name:** *(glances up)*
    const act = l.match(/^\*\*([^:*]+):\*\*\s*\*\((.+)\)\*\s*$/);
    if (act) narration = (narration ? narration + ' ' : '') + `${act[1].trim()} (${stripEmphasis(act[2])})`;
  }

  const round = (() => {
    const m = (id || '').match(/(\d+)/);
    return m ? Number(m[1]) : undefined;
  })();

  return { kind: isRepair ? 'repair' : 'conversation', id, title, narration, speaker, line, round, choices };
}

function cleanReflection(quoteLines) {
  // join, drop empty leading/trailing, strip wrapping quotes, keep paragraph breaks
  const text = quoteLines.join('\n').trim().replace(/^["“]/, '').replace(/["”]$/, '');
  return text.split(/\n\s*\n/).map((p) => stripEmphasis(p)).filter(Boolean).join('\n\n');
}

function parseMode(modeBody) {
  // modeBody starts after "# X MODE ..." — first split intro vs beats
  const headerIdx = modeBody.search(/^## /m);
  const intro = headerIdx >= 0 ? modeBody.slice(0, headerIdx) : modeBody;
  const beatsBlock = headerIdx >= 0 ? modeBody.slice(headerIdx) : '';
  const castM = intro.match(/\*\*The cast:\*\*\s*(.+)/);
  const settingM = intro.match(/\*\*Setting:\*\*\s*(.+)/);
  const cast = castM ? stripEmphasis(castM[1]) : undefined;
  const setting = settingM ? stripEmphasis(settingM[1]) : undefined;

  // split beats by "## " headers
  const parts = beatsBlock.split(/^## /m).filter((p) => p.trim());
  const beats = {};
  let start = null;
  let reflectionId = null, reflection = '', saveLine;
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const headerLine = '## ' + part.slice(0, nl).trim();
    const body = part.slice(nl + 1);
    if (/```/.test(headerLine)) continue;
    const beat = parseBeat(headerLine, body);
    if (!beat.id) continue;
    if (beat.kind === 'reflection') {
      reflectionId = beat.id; reflection = beat.reflection; saveLine = beat.saveLine;
      continue;
    }
    if (!start && beat.kind === 'conversation') start = beat.id;
    beats[beat.id] = { id: beat.id, kind: beat.kind, round: beat.round, title: beat.title, narration: beat.narration, speaker: beat.speaker, line: beat.line, choices: beat.choices };
  }
  return { cast, setting, start, beats, reflectionId, reflection, saveLine };
}

function parseFile(text, fname) {
  const fm = fname.match(/journey-([a-z]+)-(\d+)/i);
  const category = fm ? fm[1] : 'friends';
  const index = fm ? Number(fm[2]) : 0;
  const id = `${category}-${String(index).padStart(2, '0')}`;

  const titleM = text.match(/\*\*Title:\*\*\s*(.+)/);
  const skillM = text.match(/\*\*Communication skill:\*\*\s*(.+)/);
  const whyM = text.match(/\*\*Why this skill matters[^*]*\*\*\s*\n([\s\S]+?)(?:\n\n|\n---|\n#)/);
  const title = titleM ? stripEmphasis(titleM[1]) : id;
  const skill = skillM ? stripEmphasis(skillM[1]) : '';
  const whyItMatters = whyM ? stripEmphasis(whyM[1]) : '';

  // split by mode headers
  const modes = {};
  const modeRe = /^#\s+(EASY|MEDIUM|HARD)\s+MODE(?:\s*[—-]\s*"?(.+?)"?)?\s*$/gim;
  const marks = [];
  let mm;
  while ((mm = modeRe.exec(text))) marks.push({ mode: mm[1].toLowerCase(), label: mm[2] ? stripEmphasis(mm[2]) : null, idx: mm.index, end: modeRe.lastIndex });
  for (let k = 0; k < marks.length; k++) {
    const cur = marks[k];
    const body = text.slice(cur.end, k + 1 < marks.length ? marks[k + 1].idx : text.length);
    const parsed = parseMode(body);
    modes[cur.mode] = { label: cur.label || (cur.mode[0].toUpperCase() + cur.mode.slice(1)), ...parsed };
  }

  return { id, category, index, title, skill, whyItMatters, modes };
}

// --- run ---
const files = readdirSync(SRC_DIR).filter((f) => /^journey-[a-z]+-\d+.*\.md$/i.test(f)).sort();
const scenarios = files.map((f) => parseFile(readFileSync(join(SRC_DIR, f), 'utf8'), f));

// sanity report
let warnings = 0;
for (const s of scenarios) {
  for (const mode of ['easy', 'medium', 'hard']) {
    const m = s.modes[mode];
    if (!m) { console.warn(`! ${s.id} missing ${mode}`); warnings++; continue; }
    const convs = Object.values(m.beats).filter((b) => b.kind === 'conversation').length;
    if (convs < 5) { console.warn(`! ${s.id}/${mode} has ${convs} conversation beats`); warnings++; }
    if (!m.reflection) { console.warn(`! ${s.id}/${mode} missing reflection`); warnings++; }
    for (const b of Object.values(m.beats)) {
      if (b.kind === 'conversation' && b.choices.length !== 4) console.warn(`  ~ ${s.id}/${mode}/${b.id}: ${b.choices.length} choices`);
      for (const c of b.choices) if (!c.next) console.warn(`  ~ ${s.id}/${mode}/${b.id} ${c.letter}: no next`);
    }
  }
}

const header = `// AUTO-GENERATED by scripts/parse-journey.mjs — do not edit by hand.\nimport type { JourneyScenario } from '../types/journey';\n\nexport const JOURNEY_SCENARIOS: JourneyScenario[] = `;
writeFileSync(OUT, header + JSON.stringify(scenarios, null, 2) + ';\n');

// tiny metadata module (scenario counts per category) — safe to import from the
// main bundle without dragging the full scenario data along
const counts = {};
for (const s of scenarios) counts[s.category] = (counts[s.category] || 0) + 1;
writeFileSync(join(process.cwd(), 'src/data/journeyMeta.ts'),
  `// AUTO-GENERATED by scripts/parse-journey.mjs — do not edit by hand.\n` +
  `import type { JourneyArea } from '../types/journey';\n\n` +
  `/** Scenario count per journey category (for journey-completion math). */\n` +
  `export const SCENARIO_TOTALS: Partial<Record<JourneyArea, number>> = ${JSON.stringify(counts)};\n`);
console.log(`\nWrote ${scenarios.length} scenarios → ${OUT} (${warnings} warnings)`);
for (const s of scenarios) console.log(`  ${s.id}  "${s.title}"  modes: ${Object.keys(s.modes).join('/')}`);
