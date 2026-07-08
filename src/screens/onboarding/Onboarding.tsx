import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppStore';
import { Icon } from '../../components/ds';
import { Mascot } from '../kidzone/Mascot';
import { PARENT_POWERS } from '../../data/quiz';
import { AREAS, areaKidWorld, emptyAreaScores, type AreaKey } from '../../constants/areas';
import { trackOnce } from '../../analytics';
import type { Child, Goal } from '../../types';

/*
 * Parent onboarding — web version (local-only, no login).
 * Hook → Value+features → Parent name/email → Add child → Quiz ×4 (child ×3 +
 * parent ×1) → Family plan → Meet Sprout → Privacy & controls → Notifications →
 * Trial. Funnel arrivals (who answered on /start) skip the quiz. Comic Pop.
 */

const INK = '#2A2521';
const GRAPE = '#7A5AD9';
const KID_COLORS = ['var(--grape-400)', 'var(--coral-400)', 'var(--sky-500)', 'var(--sun-500)', 'var(--green-400)', '#EC7FA0'];

/** Age groups (friendlier than a number row); `age` keeps a representative value. */
export const AGE_GROUPS: { label: string; age: number }[] = [
  { label: '4–6', age: 5 },
  { label: '7–9', age: 8 },
  { label: '10–12', age: 11 },
  { label: '13+', age: 14 },
];

/** Q3 — what the child should get better at → their starting world. */
const CHILD_FOCUS: { label: string; area: AreaKey; goal: string }[] = [
  { label: 'Speaking up for themselves', area: 'speakup', goal: 'speak up when they feel nervous' },
  { label: 'Making & keeping friends', area: 'connect', goal: 'feel brave making new friends' },
  { label: 'Brushing off teasing', area: 'listen', goal: 'stay steady when teasing happens' },
  { label: 'Standing their ground', area: 'feelings', goal: 'set boundaries and hold their ground' },
  { label: 'Reading people & the room', area: 'conflict', goal: 'read people and social cues' },
];

/** Q4 — what the PARENT wants to get more confident in → their library track. */
const PARENT_FOCUS: { label: string; track: string }[] = [
  { label: 'Getting them to open up', track: 'When They Won’t Open Up' },
  { label: 'Big feelings & meltdowns', track: 'Big Feelings & Meltdowns' },
  { label: 'Setting limits without a fight', track: 'Boundaries & Limits' },
  { label: 'Hard conversations', track: 'Hard Conversations' },
  { label: 'Communicating better myself', track: 'Connecting & Conversation' },
];

interface Draft { name: string; age: number; ageLabel: string; color: string }

function makeChild(draft: Draft, goalId: string): Child {
  const baseline = emptyAreaScores();
  (Object.keys(baseline) as AreaKey[]).forEach((k) => { baseline[k] = 50; });
  return {
    id: `child-${Date.now()}`,
    name: draft.name.trim(),
    age: draft.age,
    ageLabel: draft.ageLabel,
    color: draft.color,
    pronoun: { subj: 'they', obj: 'them', poss: 'their' },
    level: 1, levelName: 'Seed', nextLevelName: 'Tiny Sprout',
    stars: 0, starsToNext: 100, streak: 0,
    areaScores: baseline,
    growing: { area: 'speakup', note: 'Just getting started' },
    weeks: [50], missionsDone: 0, scenariosMastered: 0, questProgress: 0,
    currentGoalId: goalId, wins: [], badges: [],
  };
}

/* ---------- Comic Pop primitives ---------- */
const dotBg: React.CSSProperties = {
  backgroundColor: '#F6F1FF',
  backgroundImage: 'radial-gradient(rgba(122,90,217,.13) 1.5px, transparent 1.5px)',
  backgroundSize: '15px 15px',
};

function EButton({ children, ghost, disabled, onClick }: {
  children: React.ReactNode; ghost?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', minHeight: 54, borderRadius: 99, border: `2.5px solid ${INK}`, cursor: disabled ? 'default' : 'pointer', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, padding: '13px 18px', background: ghost ? '#fff' : GRAPE, color: ghost ? INK : '#fff', boxShadow: ghost ? '3px 4px 0 var(--grape-300)' : '4px 5px 0 rgba(42,37,33,.9)', opacity: disabled ? 0.45 : 1 }}>
      {children}
    </button>
  );
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, transform: 'rotate(-1.2deg)', background: '#FFF3D6', border: `2px solid ${INK}`, color: '#D2542F', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, letterSpacing: '.08em', padding: '4px 12px', borderRadius: 99, boxShadow: '2px 3px 0 rgba(42,37,33,.85)', textTransform: 'uppercase' }}>✦ {children}</span>
    </div>
  );
}
function H1({ text, grape }: { text: string; grape?: string }) {
  const parts = grape ? text.split(grape) : [text];
  return (
    <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, lineHeight: 1.12, color: INK, margin: '0 0 12px' }}>
      {grape && parts.length > 1
        ? <>{parts[0]}<span style={{ color: GRAPE }}>{grape}</span>{parts.slice(1).join(grape)}</>
        : text}
    </h1>
  );
}
function Sub({ children }: { children: React.ReactNode }) {
  return <p style={{ color: 'var(--ink-500)', fontSize: 15.5, lineHeight: 1.55, margin: '0 0 20px' }}>{children}</p>;
}
function ECard({ children, tilt = 0, style }: { children: React.ReactNode; tilt?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 var(--grape-300)', transform: tilt ? `rotate(${tilt}deg)` : undefined, ...style }}>
      {children}
    </div>
  );
}
function EInput({ icon, value, onChange, type = 'text', placeholder }: {
  icon: string; value: string; onChange: (v: string) => void; type?: string; placeholder: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: '3px 4px 0 var(--grape-300)', padding: '14px 16px' }}>
      <Icon name={icon} size={19} color={INK} />
      <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15.5, color: INK }} />
    </div>
  );
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em', margin: '16px 0 8px' }}>{children}</div>;
}

/* ---------- flow ---------- */
type Screen = 'hook' | 'value' | 'parent' | 'child' | 'quiz1' | 'quiz2' | 'quiz3' | 'quiz4' | 'plan' | 'meet' | 'privacy' | 'notif' | 'trial';
const FLOW_ALL: Screen[] = ['hook', 'value', 'parent', 'child', 'quiz1', 'quiz2', 'quiz3', 'quiz4', 'plan', 'meet', 'privacy', 'notif', 'trial'];

export function Onboarding() {
  const { dispatch } = useApp();
  const navigate = useNavigate();

  // Came through the /start funnel? Then they already answered the quiz — skip it.
  const intake = useRef<{ kidWorld?: string; parentTrack?: string } | null>(
    (() => { try { return JSON.parse(localStorage.getItem('sprout_intake') || 'null'); } catch { return null; } })(),
  ).current;
  const funnelUser = !!intake;
  const FLOW = funnelUser ? FLOW_ALL.filter((s) => !s.startsWith('quiz')) : FLOW_ALL;

  const [screen, setScreen] = useState<Screen>('hook');
  const [parentName, setParentName] = useState('');
  const [email, setEmail] = useState('');
  const [draft, setDraft] = useState<Draft>({ name: '', age: 8, ageLabel: '7–9', color: KID_COLORS[4] });
  const [a1, setA1] = useState(-1); // Q1 situational → parent profile
  const [a2, setA2] = useState(-1); // Q2 situational → tuning
  const [a3, setA3] = useState(-1); // Q3 child focus → starting world
  const [a4, setA4] = useState(-1); // Q4 parent focus → library track
  const [allowNotifs, setAllowNotifs] = useState(true);

  const kid = draft.name.trim() || 'your child';
  const idx = FLOW.indexOf(screen);
  const next = () => setScreen(FLOW[Math.min(FLOW.length - 1, idx + 1)]);
  const back = () => setScreen(FLOW[Math.max(0, idx - 1)]);

  // Derived plan (from quiz, or the funnel's answers for funnel users).
  const childFocus = CHILD_FOCUS[a3 >= 0 ? a3 : 0];
  const childArea: AreaKey = funnelUser
    ? (AREAS.find((a) => a.kidWorld === intake?.kidWorld)?.key ?? 'speakup')
    : childFocus.area;
  const childWorld = funnelUser ? (intake?.kidWorld || areaKidWorld(childArea)) : areaKidWorld(childArea);
  const childGoal = funnelUser ? 'grow their communication confidence' : childFocus.goal;
  const parentTrack = funnelUser ? (intake?.parentTrack || 'When They Won’t Open Up') : PARENT_FOCUS[a4 >= 0 ? a4 : 0].track;
  const power = PARENT_POWERS[a1 >= 0 ? Math.min(a1, PARENT_POWERS.length - 1) : 1];

  const finish = (plan: 'trial' | 'free') => {
    const goalId = `goal-${Date.now()}`;
    const child = makeChild(draft, goalId);
    const goal: Goal = {
      id: goalId, childId: child.id, area: childArea,
      statement: `Help ${child.name} ${childGoal}`, status: 'active',
    };
    if (plan === 'trial') trackOnce('start_trial', 'StartTrial', { via: 'onboarding', currency: 'USD', predicted_ltv: 99 });
    dispatch({ type: 'updateSettings', patch: plan === 'trial' ? { plan: 'trial', trialStart: Date.now() } : { plan: 'free' } });
    dispatch({ type: 'completeOnboarding', parent: { name: parentName.trim(), email: email.trim(), consentGiven: true, type: power.type }, child, goal });
    dispatch({ type: 'updateSettings', patch: { notifications: allowNotifs } });
    dispatch({ type: 'awardStars', childId: child.id, stars: 10 });
    dispatch({ type: 'recommendArea', childId: child.id, area: childArea });
    navigate('/today', { replace: true });
  };

  const showHeader = screen !== 'hook';
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', ...dotBg }}>
      {showHeader && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 24px 4px' }}>
          <button onClick={back} aria-label="Back" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, display: 'grid', placeItems: 'center' }}>
            <Icon name="arrow-left" size={20} color={INK} />
          </button>
          <div style={{ flex: 1, display: 'flex', gap: 3 }}>
            {FLOW.slice(1).map((s, i) => (
              <span key={s} style={{ flex: 1, height: 8, border: `2px solid ${INK}`, borderRadius: 5, background: i < idx ? 'var(--grape-400)' : '#fff' }} />
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: showHeader ? '14px 24px 24px' : '0 0 24px', overflowY: 'auto' }}>
        {screen === 'hook' && <Hook onNext={next} />}
        {screen === 'value' && <Value onNext={next} />}
        {screen === 'parent' && <ParentInfo name={parentName} setName={setParentName} email={email} setEmail={setEmail} onNext={next} />}
        {screen === 'child' && <AddChild draft={draft} setDraft={setDraft} onNext={next} />}
        {screen === 'quiz1' && <Quiz eyebrow="A few quick questions" q={`When ${kid} comes home upset about a friend, you usually…`} options={['Jump in with advice right away', 'Ask questions and listen first', 'Give them space, then circle back']} selected={a1} onPick={(i) => { setA1(i); setTimeout(next, 320); }} />}
        {screen === 'quiz2' && <Quiz eyebrow="A few quick questions" q={`How does ${kid} handle a brand-new group of kids?`} options={['Dives right in', 'Warms up slowly', 'Sticks close to kids they know']} selected={a2} onPick={(i) => { setA2(i); setTimeout(next, 320); }} />}
        {screen === 'quiz3' && <Quiz eyebrow="For your child" q={`What do you most want ${kid} to get better at?`} options={CHILD_FOCUS.map((c) => c.label)} selected={a3} onPick={(i) => { setA3(i); setTimeout(next, 320); }} />}
        {screen === 'quiz4' && <Quiz eyebrow="For you" q="And what would you like to feel more confident in?" sub="Sprout has a whole parent library too." options={PARENT_FOCUS.map((p) => p.label)} selected={a4} onPick={(i) => { setA4(i); setTimeout(next, 320); }} />}
        {screen === 'plan' && <FamilyPlan kid={kid} childWorld={childWorld} parentTrack={parentTrack} onNext={next} />}
        {screen === 'meet' && <MeetSprout kid={kid} onNext={next} />}
        {screen === 'privacy' && <Privacy onNext={next} />}
        {screen === 'notif' && <Notifications kid={kid} onPick={(allow) => { setAllowNotifs(allow); next(); }} />}
        {screen === 'trial' && <TrialStep onPick={finish} />}
      </div>
    </div>
  );
}

/* ---------- 01 · Hook ---------- */
function Hook({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '26px 24px 24px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Eyebrow>When nobody knows what to say</Eyebrow>
        <div style={{ alignSelf: 'center', position: 'relative', margin: '10px 0 22px' }}>
          <span style={{ position: 'absolute', top: 6, left: -18, fontSize: 20, color: 'var(--grape-400)' }}>✦</span>
          <span style={{ position: 'absolute', top: 18, right: -14, fontSize: 15, color: 'var(--coral-400)' }}>✦</span>
          <div style={{ width: 208, height: 208, borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #EAF6E2, #BFE3CB)', border: `2.5px solid ${INK}`, boxShadow: '6px 7px 0 rgba(42,37,33,.85)', position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', left: '50%', bottom: -14, transform: 'translateX(-50%)' }}>
              <Mascot mood="idle" size={182} />
            </span>
          </div>
        </div>
        <H1 text="Confidence for your kid. Confidence for you." grape="Confidence for you." />
        <Sub>Sprout coaches them through the hard moments — and coaches you through yours.</Sub>
      </div>
      <EButton onClick={onNext}>Get started</EButton>
      <button onClick={onNext} style={{ display: 'block', margin: '13px auto 0', border: 'none', background: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--grape-600)', cursor: 'pointer' }}>
        How it works
      </button>
    </div>
  );
}

/* ---------- 02 · Value + feature squares ---------- */
function Value({ onNext }: { onNext: () => void }) {
  const tiles: [string, string, string, string, string][] = [
    ['gamepad-2', 'Journey Games', 'Story-based practice', 'var(--grape-500)', 'var(--grape-100)'],
    ['zap', 'Quick Fire', 'Think fast on their feet', 'var(--sky-500)', '#E7F2FB'],
    ['mic', 'Say It Out Loud', 'Rehearse the real words', 'var(--coral-600)', '#FBE3D8'],
    ['messages-square', 'Parent scripts', 'What to say, ready to go', 'var(--green-600)', 'var(--green-100)'],
    ['sparkles', 'Ask Sprout', 'Instant answers for you', 'var(--grape-600)', 'var(--grape-100)'],
    ['star', 'Stars & badges', 'Growth they can see', 'var(--sun-600)', 'var(--sun-100)'],
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Eyebrow>Built for kids &amp; grown-ups</Eyebrow>
      <H1 text="Helping your child feel more confident." grape="more confident." />
      <Sub>Everything your family needs to practice real conversations — for them, and for you.</Sub>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
        {tiles.map(([icon, label, desc, ic, bg], i) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: 13, borderRadius: 16, background: bg, border: `2.5px solid ${INK}`, boxShadow: '3px 4px 0 rgba(42,37,33,.7)', transform: `rotate(${i % 2 ? 0.4 : -0.4}deg)` }}>
            <span style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: `2px solid ${INK}`, display: 'grid', placeItems: 'center' }}>
              <Icon name={icon} size={18} color={ic} />
            </span>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, color: INK, lineHeight: 1.1 }}>{label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', lineHeight: 1.3 }}>{desc}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 16 }} />
      <EButton onClick={onNext}>Continue</EButton>
    </div>
  );
}

/* ---------- 03 · Parent name + email (required) ---------- */
function ParentInfo({ name, setName, email, setEmail, onNext }: {
  name: string; setName: (v: string) => void; email: string; setEmail: (v: string) => void; onNext: () => void;
}) {
  const emailOk = /.+@.+\..+/.test(email.trim());
  const ready = name.trim().length > 0 && emailOk;
  return (
    <>
      <Eyebrow>Your turn first</Eyebrow>
      <H1 text="Let’s set up your account." grape="your account." />
      <Sub>No password needed. We’ll use this to save your plan and send your receipt — never spam.</Sub>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        <EInput icon="user" value={name} onChange={setName} placeholder="Your first name" />
        <EInput icon="mail" value={email} onChange={setEmail} type="email" placeholder="Email address" />
      </div>
      <div style={{ flex: 1, minHeight: 14 }} />
      <EButton disabled={!ready} onClick={onNext}>Continue</EButton>
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, fontWeight: 700, color: 'var(--ink-400)', lineHeight: 1.5 }}>
        By continuing you confirm you’re a grown-up setting this up for your child.
      </div>
    </>
  );
}

/* ---------- 04 · Add child ---------- */
function AddChild({ draft, setDraft, onNext }: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>>; onNext: () => void }) {
  const initial = (draft.name.trim() || 'M').charAt(0).toUpperCase();
  return (
    <>
      <Eyebrow>Who are we cheering on?</Eyebrow>
      <H1 text="Who are we cheering on?" grape="cheering on?" />
      <Sub>Add more children later in Settings.</Sub>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <span style={{ display: 'inline-grid', placeItems: 'center', width: 84, height: 84, borderRadius: '50%', background: draft.color, border: `2.5px solid ${INK}`, boxShadow: '4px 5px 0 var(--grape-300)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, color: '#fff' }}>
          {initial}
        </span>
      </div>
      <EInput icon="user" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} placeholder="Child’s first name" />
      <FieldLabel>Age group</FieldLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        {AGE_GROUPS.map((g) => {
          const on = draft.ageLabel === g.label;
          return (
            <button key={g.label} onClick={() => setDraft((d) => ({ ...d, age: g.age, ageLabel: g.label }))} style={{ minHeight: 46, textAlign: 'center', padding: '8px 0', borderRadius: 99, border: `2.5px solid ${INK}`, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, background: on ? GRAPE : '#fff', color: on ? '#fff' : INK, boxShadow: on ? '2px 3px 0 rgba(42,37,33,.6)' : 'none', cursor: 'pointer' }}>
              {g.label}
            </button>
          );
        })}
      </div>
      <FieldLabel>Favorite color</FieldLabel>
      <div style={{ display: 'flex', gap: 9 }}>
        {KID_COLORS.map((c) => (
          <button key={c} onClick={() => setDraft((d) => ({ ...d, color: c }))} aria-label="Pick color" style={{ width: 40, height: 40, borderRadius: '50%', background: c, border: `3px solid ${draft.color === c ? INK : '#fff'}`, boxShadow: 'var(--shadow-sm)', cursor: 'pointer', padding: 0 }} />
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 16 }} />
      <EButton disabled={!draft.name.trim()} onClick={onNext}>Continue</EButton>
    </>
  );
}

/* ---------- 05–08 · Quiz (child ×3 + parent ×1) ---------- */
function Quiz({ eyebrow, q, sub, options, selected, onPick }: {
  eyebrow: string; q: string; sub?: string; options: string[]; selected: number; onPick: (i: number) => void;
}) {
  return (
    <>
      <Eyebrow>{eyebrow}</Eyebrow>
      <H1 text={q} />
      <Sub>{sub || 'No wrong answers — this just tunes your plan.'}</Sub>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 2 }}>
        {options.map((o, i) => {
          const on = i === selected;
          return (
            <button key={o} onClick={() => onPick(i)}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 15px', borderRadius: 18, border: `2.5px solid ${INK}`, background: on ? 'var(--grape-100)' : '#fff', boxShadow: on ? '4px 5px 0 var(--grape-400)' : '2px 3px 0 var(--grape-300)', transform: `rotate(${i % 2 ? 0.4 : -0.4}deg)`, cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${INK}`, background: on ? GRAPE : '#fff', color: on ? '#fff' : INK, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, display: 'grid', placeItems: 'center', flex: 'none' }}>
                {String.fromCharCode(65 + i)}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: INK }}>{o}</span>
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, minHeight: 10 }} />
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--ink-400)' }}>Pick one to continue</div>
    </>
  );
}

/* ---------- 09 · Family plan (combined recommendation) ---------- */
function FamilyPlan({ kid, childWorld, parentTrack, onNext }: { kid: string; childWorld: string; parentTrack: string; onNext: () => void }) {
  const Tile = ({ fc, tint, icon, tag, title, meta }: { fc: string; tint: string; icon: string; tag: string; title: string; meta: string }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: tint, border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: '3px 4px 0 rgba(42,37,33,.16)', padding: '14px 13px', minHeight: 150 }}>
      <span style={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: 12, background: fc, border: `2.5px solid ${INK}`, boxShadow: '2px 2px 0 rgba(42,37,33,.85)', marginBottom: 9 }}>
        <Icon name={icon} size={20} color="#fff" />
      </span>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', color: fc, marginBottom: 3 }}>{tag}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, color: INK, lineHeight: 1.14 }}>{title}</div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-500)', lineHeight: 1.35, marginTop: 4 }}>{meta}</div>
    </div>
  );
  return (
    <>
      <Eyebrow>Built from your answers</Eyebrow>
      <H1 text={`Here’s where you both start 🌱`} grape="you both" />
      <div style={{ position: 'relative', display: 'flex', gap: 14, alignItems: 'stretch', marginTop: 2 }}>
        <Tile fc="var(--green-500)" tint="var(--green-100)" icon="globe" tag="For your child" title={childWorld} meta={`${kid} starts here — 1 Journey story a day.`} />
        <Tile fc="var(--coral-600)" tint="var(--grape-100)" icon="chat" tag="For you" title={parentTrack} meta="Real parent scripts, ready when you need them." />
        <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 28, height: 28, borderRadius: '50%', background: 'var(--sun-300)', border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: INK, boxShadow: '2px 2px 0 rgba(42,37,33,.4)', zIndex: 2 }}>+</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 0', padding: '13px 15px', background: 'var(--sun-100)', border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: '3px 4px 0 rgba(42,37,33,.2)' }}>
        <Icon name="sparkles" size={18} color="var(--coral-600)" />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: INK, lineHeight: 1.35 }}>Little and often wins. Even a few minutes a day builds real confidence.</span>
      </div>
      <div style={{ flex: 1, minHeight: 12 }} />
      <EButton onClick={onNext}>Love it — keep going</EButton>
    </>
  );
}

/* ---------- 10 · Meet Sprout ---------- */
function MeetSprout({ kid, onNext }: { kid: string; onNext: () => void }) {
  const pts: [string, string][] = [
    ['lock', 'Kid Zone lives behind your parent PIN'],
    ['list-checks', 'Every kid conversation is fully scripted — no open chat, ever'],
  ];
  return (
    <>
      <Eyebrow>One more thing</Eyebrow>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 14px' }}>
        <Mascot mood="idle" size={150} />
      </div>
      <H1 text={`Meet Sprout — ${kid}’s practice buddy`} grape="Sprout" />
      <Sub>Sprout stars in the games where {kid} rehearses tricky moments. You’ll hand the phone over inside Kid Zone.</Sub>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pts.map(([icon, t]) => (
          <ECard key={icon}>
            <div style={{ display: 'flex', gap: 12, padding: '12px 14px', alignItems: 'center' }}>
              <Icon name={icon} size={20} color="var(--grape-600)" />
              <span style={{ fontWeight: 700, fontSize: 13.5, color: INK, lineHeight: 1.35 }}>{t}</span>
            </div>
          </ECard>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 10 }} />
      <EButton onClick={onNext}>Continue</EButton>
    </>
  );
}

/* ---------- 11 · Privacy & parental controls ---------- */
function Privacy({ onNext }: { onNext: () => void }) {
  const pts: [string, string, string][] = [
    ['lock', 'Kid Zone is PIN-locked', 'Your child can’t leave Kid Zone or reach settings without your PIN.'],
    ['shield-check', 'Private by default', 'Minimal data, kept on your device. Never sold, never used for ads.'],
    ['trash-2', 'Delete anytime', 'Remove your family’s data completely, whenever you want.'],
  ];
  return (
    <>
      <Eyebrow>You’re in control</Eyebrow>
      <H1 text="Safe for kids, private for you." grape="private for you." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pts.map(([icon, t, d], i) => (
          <ECard key={icon} tilt={i % 2 ? 0.4 : -0.4}>
            <div style={{ display: 'flex', gap: 13, padding: 14 }}>
              <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--grape-100)', border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
                <Icon name={icon} size={19} color={INK} />
              </span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: INK }}>{t}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-500)', lineHeight: 1.45, marginTop: 2 }}>{d}</div>
              </div>
            </div>
          </ECard>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 12 }} />
      <EButton onClick={onNext}>Got it</EButton>
    </>
  );
}

/* ---------- 12 · Notifications ---------- */
function Notifications({ kid, onPick }: { kid: string; onPick: (allow: boolean) => void }) {
  const allow = async () => {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') await Notification.requestPermission();
    } catch { /* not supported — carry on */ }
    onPick(true);
  };
  const benefits: [string, string, string][] = [
    ['calendar-heart', 'One weekly mission', 'A single nudge each week — never a nag.'],
    ['bell-ring', 'Gentle practice reminders', `Only when ${kid} has something to finish.`],
  ];
  return (
    <>
      <Eyebrow>Stay in the loop</Eyebrow>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 16px' }}>
        <span style={{ width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #F3EFFC, var(--grape-100))', border: `2.5px solid ${INK}`, boxShadow: '4px 5px 0 var(--grape-300)', display: 'grid', placeItems: 'center', transform: 'rotate(-2deg)' }}>
          <Icon name="bell-ring" size={42} color="var(--grape-600)" />
        </span>
      </div>
      <H1 text="Helpful nudges, never noise" grape="never noise" />
      <Sub>We’ll remind you about the weekly mission and when {kid} finishes a practice round.</Sub>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {benefits.map(([icon, t, d]) => (
          <ECard key={icon}>
            <div style={{ display: 'flex', gap: 12, padding: '13px 14px', alignItems: 'center' }}>
              <Icon name={icon} size={22} color="var(--grape-600)" />
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: INK }}>{t}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-500)' }}>{d}</div>
              </div>
            </div>
          </ECard>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 10 }} />
      <EButton onClick={allow}>Allow Notifications</EButton>
      <div style={{ height: 9 }} />
      <EButton ghost onClick={() => onPick(false)}>Maybe Later</EButton>
    </>
  );
}

/* ---------- 13 · Trial / Subscription ---------- */
function TrialStep({ onPick }: { onPick: (p: 'trial' | 'free') => void }) {
  const [selected, setSelected] = useState<'annual' | 'monthly'>('annual');
  return (
    <>
      <Eyebrow>7 days free</Eyebrow>
      <H1 text="Start your 7-day free trial" grape="7-day free trial" />
      <Sub>Unlock parent scripts, kid games, daily quests, and communication activities for your family. Cancel anytime.</Sub>
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 12, marginTop: 4 }}>
        <button onClick={() => setSelected('annual')} style={{ position: 'relative', background: selected === 'annual' ? GRAPE : '#fff', color: selected === 'annual' ? '#fff' : INK, border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: selected === 'annual' ? '4px 5px 0 rgba(42,37,33,.9)' : '3px 4px 0 var(--grape-300)', padding: '18px 10px 12px', textAlign: 'center', cursor: 'pointer' }}>
          <span style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%) rotate(-2deg)', background: 'var(--sun-500)', color: '#3A2A00', border: `2px solid ${INK}`, borderRadius: 99, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, padding: '1px 9px', whiteSpace: 'nowrap' }}>BEST VALUE · SAVE 45%</span>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, opacity: .85 }}>ANNUAL</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginTop: 2 }}>$99<span style={{ fontSize: 12 }}>/yr</span></div>
          <div style={{ fontSize: 11, fontWeight: 800, opacity: .9 }}>Just $8.25/month</div>
        </button>
        <button onClick={() => setSelected('monthly')} style={{ background: selected === 'monthly' ? GRAPE : '#fff', color: selected === 'monthly' ? '#fff' : INK, border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: selected === 'monthly' ? '4px 5px 0 rgba(42,37,33,.9)' : '3px 4px 0 var(--grape-300)', padding: '18px 10px 12px', textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, opacity: .85 }}>MONTHLY</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginTop: 2 }}>$14.99<span style={{ fontSize: 12 }}>/mo</span></div>
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {['Parent scripts for everyday situations', 'Kid games that teach what to say', 'Daily Quests, Stars & Sprout growth', 'Up to 3 child profiles'].map((b) => (
          <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: 13.5, color: INK }}>
            <Icon name="check" size={15} color="var(--green-600)" strokeWidth={3} />{b}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 10 }} />
      <EButton onClick={() => onPick('trial')}>Start Free Trial</EButton>
      <button onClick={() => onPick('free')} style={{ display: 'block', margin: '12px auto 0', border: 'none', background: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--ink-400)', cursor: 'pointer' }}>
        Maybe Later
      </button>
      <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', margin: '10px 0 0', lineHeight: 1.5 }}>
        Cancel anytime before your trial ends. Renews automatically unless canceled.
      </p>
    </>
  );
}
