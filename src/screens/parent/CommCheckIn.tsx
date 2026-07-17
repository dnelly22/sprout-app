import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppStore';
import { Icon } from '../../components/ds';

/*
 * Everyday Communication Check-In. A friendly 9-question questionnaire that
 * recommends parent scripts/lessons — framed as a check-in, never a diagnosis.
 * Answers map into one of five recommendation buckets; the result is saved as
 * parent.commFocus and shown on the parent Learning card.
 */

const INK = '#2A2521';
const GRAPE = '#7A5AD9';
const dotBg: React.CSSProperties = { backgroundColor: '#F6F1FF', backgroundImage: 'radial-gradient(rgba(122,90,217,.13) 1.5px, transparent 1.5px)', backgroundSize: '15px 15px' };

type Bucket = 'boundaries' | 'calmdirect' | 'repair' | 'ask' | 'start';

/** Each option carries the buckets it points toward. */
interface Opt { label: string; b?: Bucket[] }
interface Question { q: string; sub?: string; pick?: number; options: Opt[] }

const QUESTIONS: Question[] = [
  {
    q: 'What would you like everyday conversations to feel more like?',
    options: [
      { label: 'Clearer', b: ['calmdirect'] },
      { label: 'Calmer', b: ['calmdirect'] },
      { label: 'Shorter', b: ['calmdirect'] },
      { label: 'More respectful', b: ['boundaries'] },
      { label: 'Less awkward', b: ['start'] },
      { label: 'Easier to start', b: ['start'] },
    ],
  },
  {
    q: 'Which moments come up most for you?',
    sub: 'Pick up to 2.',
    pick: 2,
    options: [
      { label: 'Saying no', b: ['boundaries'] },
      { label: 'Setting boundaries', b: ['boundaries'] },
      { label: 'Asking for help', b: ['ask'] },
      { label: 'Giving feedback', b: ['calmdirect'] },
      { label: 'Apologizing', b: ['repair'] },
      { label: 'Repairing after tension', b: ['repair'] },
      { label: 'Talking about responsibilities', b: ['ask'] },
      { label: 'Handling pushback', b: ['calmdirect'] },
    ],
  },
  {
    q: 'Who do you most often need scripts with?',
    options: [
      { label: 'Partner or spouse', b: ['ask'] },
      { label: 'Family members', b: ['ask'] },
      { label: 'Friends', b: ['start'] },
      { label: 'Co-parent', b: ['ask'] },
      { label: 'Coworkers', b: ['calmdirect'] },
      { label: 'Boss or manager', b: ['calmdirect'] },
      { label: 'Neighbors or community', b: ['start'] },
      { label: 'A mix of people' },
    ],
  },
  {
    q: 'What usually makes these conversations hard?',
    options: [
      { label: 'I wait too long to say something', b: ['start'] },
      { label: 'I over-explain', b: ['boundaries'] },
      { label: 'I worry they’ll be upset', b: ['boundaries'] },
      { label: 'I get frustrated too quickly', b: ['calmdirect'] },
      { label: 'I give in to keep peace', b: ['boundaries'] },
      { label: 'I don’t know how to start', b: ['start'] },
    ],
  },
  {
    q: 'When someone pushes back, you usually…',
    options: [
      { label: 'Explain more', b: ['boundaries'] },
      { label: 'Get quiet', b: ['start'] },
      { label: 'Back down', b: ['boundaries'] },
      { label: 'Get sharper than I meant to', b: ['calmdirect'] },
      { label: 'Try to smooth it over', b: ['repair'] },
      { label: 'Repeat myself calmly', b: ['calmdirect'] },
    ],
  },
  {
    q: 'What kind of words feel most natural to you?',
    options: [
      { label: 'Warm and gentle', b: ['repair'] },
      { label: 'Calm and direct', b: ['calmdirect'] },
      { label: 'Firm but respectful', b: ['boundaries'] },
      { label: 'Short and simple', b: ['calmdirect'] },
      { label: 'Friendly and light', b: ['start'] },
      { label: 'Thoughtful and detailed', b: ['ask'] },
    ],
  },
  {
    q: 'What would be most useful to practice first?',
    options: [
      { label: 'Starting the conversation', b: ['start'] },
      { label: 'Saying the main point clearly', b: ['calmdirect'] },
      { label: 'Holding a boundary', b: ['boundaries'] },
      { label: 'Responding to pushback', b: ['calmdirect'] },
      { label: 'Repairing after a hard moment', b: ['repair'] },
      { label: 'Ending the conversation kindly', b: ['repair'] },
    ],
  },
  {
    q: 'What do you want Sprout to recommend?',
    options: [
      { label: 'Quick scripts I can use right away' },
      { label: 'Step-by-step lesson cards' },
      { label: 'Text message examples' },
      { label: 'In-person conversation scripts' },
      { label: 'What to avoid saying' },
      { label: 'A mix of all of these' },
    ],
  },
  {
    q: 'How often do you want to practice these scripts?',
    options: [
      { label: 'Just when I need them' },
      { label: 'Once a week' },
      { label: 'A few times a week' },
      { label: 'Short daily practice' },
    ],
  },
];

interface BucketResult {
  focus: string;
  note: string;
  readFirst: string[];
  practiceNext: string[];
  alsoRec: string[];
}
const BUCKETS: Record<Bucket, BucketResult> = {
  boundaries: {
    focus: 'Clear Boundaries',
    note: 'Helpful for saying what you mean without over-explaining.',
    readFirst: ['Saying No Without Overexplaining', 'Setting a Boundary Kindly', 'What to Say When Someone Pushes Back'],
    practiceNext: ['A short text version', 'A calm in-person version', 'A “repeat the boundary” script'],
    alsoRec: ['Repairing After Tension', 'Asking for Help Clearly', 'Ending a Conversation Respectfully'],
  },
  calmdirect: {
    focus: 'Calm and Direct',
    note: 'Helpful for saying the main point clearly, without the heat.',
    readFirst: ['Making Your Point in One Sentence', 'Staying Calm When You’re Frustrated', 'Responding to Pushback Without Escalating'],
    practiceNext: ['A short, clear text', 'A calm in-person version', 'A “pause, then respond” script'],
    alsoRec: ['Giving Feedback Kindly', 'Holding a Boundary', 'Ending a Conversation Respectfully'],
  },
  repair: {
    focus: 'Repair and Reset',
    note: 'Helpful for smoothing things over and reconnecting after tension.',
    readFirst: ['A Simple, Honest Apology', 'Repairing After a Hard Moment', 'Reopening a Conversation Gently'],
    practiceNext: ['A short repair text', 'A calm in-person reset', 'A “name it and move on” script'],
    alsoRec: ['Saying No Without Overexplaining', 'Asking for Help Clearly', 'Ending a Conversation Respectfully'],
  },
  ask: {
    focus: 'Ask and Coordinate',
    note: 'Helpful for asking clearly and sharing responsibilities without friction.',
    readFirst: ['Asking for Help Clearly', 'Talking About Who Does What', 'Making a Request Without Guilt'],
    practiceNext: ['A short ask by text', 'A calm in-person version', 'A “let’s split this” script'],
    alsoRec: ['Setting a Boundary Kindly', 'Repairing After Tension', 'Giving Feedback Kindly'],
  },
  start: {
    focus: 'Start the Conversation',
    note: 'Helpful for opening the conversation before it grows bigger.',
    readFirst: ['How to Start a Hard Conversation', 'Bringing Something Up Early', 'Breaking the Ice Without the Awkward'],
    practiceNext: ['A short opener by text', 'A calm in-person opener', 'A “can we talk?” script'],
    alsoRec: ['Saying the Main Point Clearly', 'Holding a Boundary', 'Repairing After Tension'],
  },
};
// Tie-break order when scores are equal.
const PRIORITY: Bucket[] = ['boundaries', 'calmdirect', 'repair', 'ask', 'start'];

/** The friendly focus label for a saved commFocus key (for the parent card). */
export function commFocusLabel(key?: string): string | undefined {
  return key ? BUCKETS[key as Bucket]?.focus : undefined;
}

function scoreBuckets(answers: number[][]): Bucket {
  const score: Record<Bucket, number> = { boundaries: 0, calmdirect: 0, repair: 0, ask: 0, start: 0 };
  answers.forEach((picks, qi) => {
    picks.forEach((oi) => {
      QUESTIONS[qi].options[oi]?.b?.forEach((b) => { score[b] += 1; });
    });
  });
  return PRIORITY.reduce((best, b) => (score[b] > score[best] ? b : best), PRIORITY[0]);
}

/* ---------- shared bits ---------- */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12, textAlign: 'center' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, transform: 'rotate(-1.2deg)', background: '#FFF3D6', border: `2px solid ${INK}`, color: '#D2542F', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, letterSpacing: '.08em', padding: '4px 12px', borderRadius: 99, boxShadow: '2px 3px 0 rgba(42,37,33,.85)', textTransform: 'uppercase' }}>✦ {children}</span>
    </div>
  );
}
function Btn({ children, onClick, disabled, ghost }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; ghost?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: '100%', minHeight: 52, borderRadius: 99, border: `2.5px solid ${INK}`, cursor: disabled ? 'default' : 'pointer', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, padding: '13px 18px', background: ghost ? '#fff' : GRAPE, color: ghost ? INK : '#fff', boxShadow: ghost ? '3px 4px 0 var(--grape-300)' : '4px 5px 0 rgba(42,37,33,.9)', opacity: disabled ? 0.45 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{children}</button>
  );
}

export function CommCheckIn({ onClose }: { onClose: () => void }) {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<'intro' | 'q' | 'result'>('intro');
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<number[][]>(QUESTIONS.map(() => []));
  const [multi, setMulti] = useState<number[]>([]); // current multi-select buffer

  const result = BUCKETS[scoreBuckets(answers)];

  const commit = (picks: number[]) => {
    const nextAnswers = answers.map((a, i) => (i === qi ? picks : a));
    setAnswers(nextAnswers);
    if (qi + 1 >= QUESTIONS.length) {
      const bucket = scoreBuckets(nextAnswers);
      dispatch({ type: 'updateParent', patch: { commFocus: bucket } });
      setStep('result');
    } else {
      setMulti([]);
      setQi(qi + 1);
    }
  };
  const back = () => {
    if (step === 'result') { setStep('q'); setQi(QUESTIONS.length - 1); return; }
    if (qi === 0) { setStep('intro'); return; }
    setMulti([]);
    setQi(qi - 1);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 220, display: 'flex', flexDirection: 'column', ...dotBg }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 20px 6px', flex: 'none' }}>
        <button onClick={step === 'intro' ? onClose : back} aria-label="Back" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, display: 'grid', placeItems: 'center' }}>
          <Icon name={step === 'intro' ? 'x' : 'arrow-left'} size={20} color={INK} />
        </button>
        {step === 'q' && (
          <div style={{ flex: 1, display: 'flex', gap: 4 }}>
            {QUESTIONS.map((_, i) => (
              <span key={i} style={{ flex: 1, minWidth: 0, height: 8, border: `2px solid ${INK}`, borderRadius: 99, background: i <= qi ? 'var(--grape-400)' : '#fff' }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '6px 20px calc(env(safe-area-inset-bottom, 0px) + 18px)' }}>
        {step === 'intro' && <Intro onStart={() => setStep('q')} />}
        {step === 'q' && (
          <Quiz
            key={qi}
            q={QUESTIONS[qi]}
            multi={multi}
            setMulti={setMulti}
            onSingle={(oi) => commit([oi])}
            onMultiContinue={() => commit(multi)}
          />
        )}
        {step === 'result' && (
          <Result
            r={result}
            onStart={() => { onClose(); navigate('/lessons'); }}
            onBrowse={() => { onClose(); navigate('/lessons'); }}
          />
        )}
      </div>
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
      <Eyebrow>For you</Eyebrow>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 78, height: 78, borderRadius: '50%', background: '#FFF3D6', border: `2.5px solid ${INK}`, boxShadow: '4px 5px 0 var(--grape-300)' }}>
          <Icon name="messages-square" size={34} color={GRAPE} />
        </span>
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 27, lineHeight: 1.12, color: INK, margin: '0 0 10px' }}>
        Everyday Communication <span style={{ color: GRAPE }}>Check-In</span>
      </h1>
      <p style={{ color: 'var(--ink-500)', fontSize: 15, fontWeight: 600, lineHeight: 1.5, margin: '0 auto 4px', maxWidth: 360 }}>
        Answer a few quick questions and Sprout will recommend parent scripts and lessons that fit your everyday communication style.
      </p>
      <div style={{ flex: '0 0 24px' }} />
      <Btn onClick={onStart}>Start Check-In <Icon name="arrow-right" size={18} color="#fff" /></Btn>
      <p style={{ color: 'var(--ink-400)', fontSize: 12, fontWeight: 700, marginTop: 12 }}>9 questions · about a minute · no wrong answers</p>
    </div>
  );
}

function Quiz({ q, multi, setMulti, onSingle, onMultiContinue }: {
  q: Question; multi: number[]; setMulti: (m: number[]) => void; onSingle: (oi: number) => void; onMultiContinue: () => void;
}) {
  const isMulti = (q.pick ?? 1) > 1;
  const toggle = (oi: number) => {
    if (multi.includes(oi)) setMulti(multi.filter((x) => x !== oi));
    else if (multi.length < (q.pick ?? 1)) setMulti([...multi, oi]);
  };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, lineHeight: 1.15, color: INK, margin: '2px 0 4px' }}>{q.q}</h1>
      <p style={{ color: 'var(--ink-500)', fontSize: 13.5, fontWeight: 700, margin: '0 0 14px' }}>{q.sub || 'No wrong answers — this just tunes your recommendations.'}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.options.map((o, oi) => {
          const on = isMulti && multi.includes(oi);
          return (
            <button key={o.label} onClick={() => (isMulti ? toggle(oi) : onSingle(oi))}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 15px', borderRadius: 15, border: `2.5px solid ${INK}`, background: on ? 'var(--grape-100)' : '#fff', boxShadow: on ? '4px 5px 0 var(--grape-400)' : '2px 3px 0 var(--grape-300)', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ width: 24, height: 24, borderRadius: isMulti ? 6 : '50%', border: `2px solid ${INK}`, background: on ? GRAPE : '#fff', color: '#fff', display: 'grid', placeItems: 'center', flex: 'none' }}>
                {isMulti ? (on ? <Icon name="check" size={14} color="#fff" strokeWidth={3} /> : null) : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: INK }}>{String.fromCharCode(65 + oi)}</span>}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: INK }}>{o.label}</span>
            </button>
          );
        })}
      </div>
      {isMulti && (
        <>
          <div style={{ flex: 1, minHeight: 12 }} />
          <Btn onClick={onMultiContinue} disabled={multi.length === 0}>Continue{multi.length ? ` (${multi.length}/${q.pick})` : ''} <Icon name="arrow-right" size={18} color="#fff" /></Btn>
        </>
      )}
    </div>
  );
}

function RecList({ icon, tint, iconColor, title, items }: { icon: string; tint: string; iconColor: string; title: string; items: string[] }) {
  return (
    <div style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: '3px 4px 0 var(--grape-300)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: tint, borderBottom: `2.5px solid ${INK}` }}>
        <Icon name={icon} size={16} color={iconColor} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, letterSpacing: '.03em', textTransform: 'uppercase', color: INK }}>{title}</span>
      </div>
      <div style={{ padding: '4px 14px' }}>
        {items.map((t, i) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < items.length - 1 ? '2px dashed var(--grape-100)' : 'none' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: iconColor, flex: 'none' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: INK, lineHeight: 1.25 }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Result({ r, onStart, onBrowse }: { r: BucketResult; onStart: () => void; onBrowse: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Eyebrow>Built from your answers</Eyebrow>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, lineHeight: 1.12, color: INK, margin: '0 0 6px', textAlign: 'center' }}>
        Your everyday script path <span style={{ color: GRAPE }}>is ready</span>
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--ink-500)', fontSize: 13.5, fontWeight: 700, margin: '0 0 14px', lineHeight: 1.4 }}>
        Based on your answers, Sprout recommends these parent lessons and scripts to start with.
      </p>

      {/* starter focus */}
      <div style={{ background: 'var(--grape-100)', border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: '4px 5px 0 var(--grape-300)', padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--grape-600)', marginBottom: 3 }}>Your starter focus</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: INK, lineHeight: 1.12 }}>{r.focus}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-600)', lineHeight: 1.4, marginTop: 5 }}>“{r.note}”</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <RecList icon="book-open" tint="var(--sun-100)" iconColor="var(--sun-600)" title="Read first" items={r.readFirst} />
        <RecList icon="mic" tint="#E7F2FB" iconColor="var(--sky-500)" title="Practice next" items={r.practiceNext} />
        <RecList icon="bookmark" tint="var(--green-100)" iconColor="var(--green-600)" title="Also recommended" items={r.alsoRec} />
      </div>

      <div style={{ height: 16 }} />
      <Btn onClick={onStart}>Start My Script Path <Icon name="arrow-right" size={18} color="#fff" /></Btn>
      <button onClick={onBrowse} style={{ display: 'block', margin: '10px auto 0', border: 'none', background: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, color: 'var(--grape-600)', cursor: 'pointer' }}>Browse All Scripts</button>
    </div>
  );
}
