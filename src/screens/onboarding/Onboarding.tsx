import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppStore';
import { Icon } from '../../components/ds';
import { Mascot } from '../kidzone/Mascot';
import { QUIZ, PARENT_POWERS, GOAL_BY_FOCUS } from '../../data/quiz';
import { AREAS, emptyAreaScores, type AreaKey } from '../../constants/areas';
import { trackOnce } from '../../analytics';
import type { Child, Goal } from '../../types';

/*
 * Parent onboarding — design_handoff_onboarding, direction E · "Comic Pop".
 * 12 screens: Splash → Welcome → Sign up → Consent → Add child → Notifications
 * → Quiz ×3 → Profile result → Meet Sprout → All set. Screens 3–12 carry the
 * 10-segment ink progress header. Visual system: lavender halftone, 2.5px ink
 * borders, hard GRAPE shadows (ink on primary CTAs), grape-highlighted titles.
 */

const INK = '#2A2521';
const GRAPE = '#7A5AD9';
const KID_COLORS = ['var(--grape-400)', 'var(--coral-400)', 'var(--sky-500)', 'var(--sun-500)', 'var(--green-400)', '#EC7FA0'];
/** Age groups (friendlier than a row of numbers); `age` keeps a representative value. */
export const AGE_GROUPS: { label: string; age: number }[] = [
  { label: '4–5', age: 5 },
  { label: '6–8', age: 7 },
  { label: '9–11', age: 10 },
  { label: '12+', age: 12 },
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
    level: 1,
    levelName: 'Brave Beginner',
    nextLevelName: 'Getting Bolder',
    stars: 0,
    starsToNext: 40,
    streak: 0,
    areaScores: baseline,
    growing: { area: 'speakup', note: 'Just getting started' },
    weeks: [50],
    missionsDone: 0,
    scenariosMastered: 0,
    questProgress: 0,
    currentGoalId: goalId,
    wins: [],
    badges: [
      { key: 'first',  label: 'First Steps',      icon: 'footprints', earned: false },
      { key: 'real',   label: 'Real-World Brave', icon: 'globe',      earned: false },
      { key: 'streak', label: '3-Week Streak',    icon: 'flame',      earned: false },
      { key: 'champ',  label: 'Champion',         icon: 'crown',      earned: false },
    ],
  };
}

/* ---------- E design primitives ---------- */

const dotBg: React.CSSProperties = {
  backgroundColor: '#F6F1FF',
  backgroundImage: 'radial-gradient(rgba(122,90,217,.13) 1.5px, transparent 1.5px)',
  backgroundSize: '15px 15px',
};

function EButton({ children, ghost, disabled, onClick }: {
  children: React.ReactNode; ghost?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', minHeight: 54, borderRadius: 99, border: `2.5px solid ${INK}`, cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, padding: '13px 18px',
        background: ghost ? '#fff' : GRAPE, color: ghost ? INK : '#fff',
        boxShadow: ghost ? '3px 4px 0 var(--grape-300)' : '4px 5px 0 rgba(42,37,33,.9)',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, transform: 'rotate(-1.2deg)',
        background: '#FFF3D6', border: `2px solid ${INK}`, color: '#D2542F',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, letterSpacing: '.08em',
        padding: '4px 12px', borderRadius: 99, boxShadow: '2px 3px 0 rgba(42,37,33,.85)', textTransform: 'uppercase',
      }}>✦ {children}</span>
    </div>
  );
}

/** Title with ONE grape-highlighted phrase. */
function H1({ text, grape }: { text: string; grape?: string }) {
  const parts = grape ? text.split(grape) : [text];
  return (
    <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, lineHeight: 1.12, color: INK, margin: '0 0 12px' }}>
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
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15.5, color: INK }}
      />
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.06em', margin: '16px 0 8px' }}>{children}</div>;
}

/* ---------- flow ---------- */

// Web version: no login/register (the app is local-only — a password would be
// fake friction). Straight from welcome into a lightweight "add child" setup.
type Screen = 'splash' | 'welcome' | 'child' | 'trial' | 'notif' | 'quiz1' | 'quiz2' | 'quiz3' | 'result' | 'meet' | 'allset';
const ORDER: Screen[] = ['splash', 'welcome', 'child', 'trial', 'notif', 'quiz1', 'quiz2', 'quiz3', 'result', 'meet', 'allset'];
// 'allset' is the success screen — no progress header
const STEP: Partial<Record<Screen, number>> = { child: 1, trial: 2, notif: 3, quiz1: 4, quiz2: 5, quiz3: 6, result: 7, meet: 8 };
const TOTAL_STEPS = 8;

export function Onboarding() {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>('splash');
  const [email, setEmail] = useState('');
  const [draft, setDraft] = useState<Draft>({ name: '', age: 7, ageLabel: '6–8', color: KID_COLORS[4] });
  const [allowNotifs, setAllowNotifs] = useState(true);
  const [answers, setAnswers] = useState<number[]>([-1, -1, -1]);

  const kid = draft.name.trim() || 'your child';
  const next = () => setScreen(ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(screen) + 1)]);
  const back = () => setScreen(ORDER[Math.max(0, ORDER.indexOf(screen) - 1)]);

  const power = PARENT_POWERS[answers[0] >= 0 ? Math.min(answers[0], PARENT_POWERS.length - 1) : 1];
  const focus = GOAL_BY_FOCUS[answers[2] >= 0 ? Math.min(answers[2], GOAL_BY_FOCUS.length - 1) : 0];

  const finish = () => {
    const goalId = `goal-${Date.now()}`;
    const child = makeChild(draft, goalId);
    const feel = child.pronoun.subj === 'they' ? 'feel' : 'feels';
    const goal: Goal = {
      id: goalId, childId: child.id, area: focus.area,
      statement: focus.statement.replace('{name}', child.name).replace('{subj}', child.pronoun.subj).replace('{feel}', feel),
      status: 'active',
    };
    dispatch({ type: 'completeOnboarding', parent: { email, consentGiven: true, type: power.type }, child, goal });
    dispatch({ type: 'updateSettings', patch: { notifications: allowNotifs } });
    dispatch({ type: 'awardStars', childId: child.id, stars: 10 }); // +10 stars for finishing setup
    // Funnel pass-through: if the parent came through /start, point Kid Zone at
    // the world their answers recommended (skips re-quizzing).
    try {
      const intake = JSON.parse(localStorage.getItem('sprout_intake') || 'null');
      const world = intake?.kidWorld as string | undefined;
      const area = world && AREAS.find((a) => a.kidWorld === world)?.key;
      if (area) dispatch({ type: 'recommendArea', childId: child.id, area });
    } catch { /* ignore */ }
    navigate('/today', { replace: true });
  };

  const step = STEP[screen];
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', ...dotBg }}>
      {step && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 24px 4px' }}>
          <button onClick={back} aria-label="Back" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, display: 'grid', placeItems: 'center' }}>
            <Icon name="arrow-left" size={20} color={INK} />
          </button>
          <div style={{ flex: 1, display: 'flex', gap: 3 }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span key={i} style={{ flex: 1, height: 8, border: `2px solid ${INK}`, borderRadius: 5, background: i < step ? 'var(--grape-400)' : '#fff' }} />
            ))}
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--grape-600)' }}>{step}/{TOTAL_STEPS}</span>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: step ? '14px 24px 24px' : '0 0 24px', overflowY: 'auto' }}>
        {screen === 'splash' && <Splash onGo={next} />}
        {screen === 'welcome' && <Welcome onNext={next} />}
        {screen === 'child' && <AddChild draft={draft} setDraft={setDraft} email={email} setEmail={setEmail} onNext={next} />}
        {screen === 'trial' && <TrialStep onPick={(p) => { if (p === 'trial') trackOnce('start_trial', 'StartTrial', { via: 'onboarding', currency: 'USD', predicted_ltv: 99 }); dispatch({ type: 'updateSettings', patch: p === 'trial' ? { plan: 'trial', trialStart: Date.now() } : { plan: 'free' } }); next(); }} />}
        {screen === 'notif' && <Notifications kid={kid} onPick={(allow) => { setAllowNotifs(allow); next(); }} />}
        {(screen === 'quiz1' || screen === 'quiz2' || screen === 'quiz3') && (
          <Quiz
            qi={screen === 'quiz1' ? 0 : screen === 'quiz2' ? 1 : 2}
            kid={kid}
            selected={answers[screen === 'quiz1' ? 0 : screen === 'quiz2' ? 1 : 2]}
            onPick={(qi, oi) => {
              setAnswers((a) => { const n = [...a]; n[qi] = oi; return n; });
              window.setTimeout(next, 350);
            }}
          />
        )}
        {screen === 'result' && <Result power={power} kid={kid} onNext={next} />}
        {screen === 'meet' && <MeetSprout kid={kid} onNext={next} />}
        {screen === 'allset' && <AllSet kid={kid} age={draft.ageLabel} power={power.type} onDone={finish} />}
      </div>
    </div>
  );
}

/* ---------- 01 · Splash ---------- */
function Splash({ onGo }: { onGo: () => void }) {
  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 28px', position: 'relative' }}>
        <span style={{ position: 'absolute', top: '11%', left: '14%', fontSize: 22, color: 'var(--grape-400)' }}>✦</span>
        <span style={{ position: 'absolute', top: '21%', right: '14%', fontSize: 16, color: 'var(--coral-400)' }}>✦</span>
        <div style={{ transform: 'rotate(-2deg)', marginBottom: 18 }}>
          <span style={{ display: 'inline-block', background: '#FFF3D6', border: `2.5px solid ${INK}`, borderRadius: 99, padding: '6px 16px', boxShadow: '3px 4px 0 rgba(42,37,33,.9)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, letterSpacing: '.08em', color: '#D2542F' }}>
            LET’S PRACTICE TALKING!
          </span>
        </div>
        <div style={{ width: 186, height: 186, borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #EAF6E2, #BFE3CB)', border: `2.5px solid ${INK}`, boxShadow: '6px 7px 0 rgba(42,37,33,.85)', position: 'relative', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', left: '50%', bottom: -12, transform: 'translateX(-50%)' }}>
            <Mascot mood="idle" size={164} />
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 50, color: 'var(--grape-600)', marginTop: 20 }}>sprout</div>
        <p style={{ color: 'var(--ink-500)', fontWeight: 700, fontSize: 16, margin: '4px 0 0', maxWidth: 250 }}>Big feelings, brave words — one game at a time.</p>
      </div>
      <div style={{ padding: '0 24px' }}>
        <EButton onClick={onGo}>Let’s Go!</EButton>
      </div>
    </>
  );
}

/* ---------- 02 · Welcome ---------- */
function Welcome({ onNext }: { onNext: () => void }) {
  const tiles: [string, string, string, string][] = [
    ['messages-square', 'Real scripts', 'var(--sky-500)', '#E7F2FB'],
    ['gamepad-2', 'Kid games', 'var(--grape-500)', 'var(--grape-100)'],
    ['compass', 'Parent guidance', 'var(--green-500)', 'var(--green-100)'],
    ['star', 'Earn rewards', 'var(--sun-500)', 'var(--sun-100)'],
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '28px 24px 0' }}>
      <Eyebrow>Built for kids &amp; grown-ups</Eyebrow>
      <H1 text="Help your child feel more confident." grape="more confident." />
      <Sub>Practice making friends, speaking up, and handling tricky moments — together.</Sub>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {tiles.map(([icon, label, ic, bg], i) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 18, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, background: bg, color: INK, border: `2.5px solid ${INK}`, boxShadow: '3px 4px 0 rgba(42,37,33,.75)', transform: `rotate(${i % 2 ? 0.5 : -0.5}deg)` }}>
            <span style={{ width: 38, height: 38, borderRadius: '50%', background: '#fff', border: `2px solid ${INK}`, display: 'grid', placeItems: 'center' }}>
              <Icon name={icon} size={19} color={ic} />
            </span>
            {label}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 10 }} />
      <EButton onClick={onNext}>Continue</EButton>
    </div>
  );
}

/* ---------- 05 · Add child ---------- */
function AddChild({ draft, setDraft, email, setEmail, onNext }: {
  draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  email: string; setEmail: (v: string) => void; onNext: () => void;
}) {
  const initial = (draft.name.trim() || 'M').charAt(0).toUpperCase();
  const emailOk = !email.trim() || /.+@.+\..+/.test(email.trim());
  return (
    <>
      <Eyebrow>Let’s set up</Eyebrow>
      <H1 text="Who are we cheering on?" grape="cheering on?" />
      <Sub>No account or password needed — just tell us who’s playing. Add more children later in Settings.</Sub>
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
            <button key={g.label} onClick={() => setDraft((d) => ({ ...d, age: g.age, ageLabel: g.label }))} style={{ minHeight: 46, textAlign: 'center', padding: '8px 0', borderRadius: 99, border: `2.5px solid ${INK}`, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5, background: on ? GRAPE : '#fff', color: on ? '#fff' : INK, boxShadow: on ? '2px 3px 0 rgba(42,37,33,.6)' : 'none', cursor: 'pointer' }}>
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
      <FieldLabel>Your email (optional)</FieldLabel>
      <EInput icon="mail" value={email} onChange={setEmail} type="email" placeholder="For receipts & tips — skip if you like" />
      <div style={{ flex: 1, minHeight: 14 }} />
      <EButton disabled={!draft.name.trim() || !emailOk} onClick={onNext}>Continue</EButton>
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, fontWeight: 700, color: 'var(--ink-400)', lineHeight: 1.5 }}>
        By continuing you confirm you’re a grown-up setting this up for your child.
      </div>
    </>
  );
}

/* ---------- 06 · Notifications ---------- */
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
      <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0 18px' }}>
        <span style={{ width: 106, height: 106, borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #F3EFFC, var(--grape-100))', border: `2.5px solid ${INK}`, boxShadow: '4px 5px 0 var(--grape-300)', display: 'grid', placeItems: 'center', transform: 'rotate(-2deg)' }}>
          <Icon name="bell-ring" size={44} color="var(--grape-600)" />
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

/* ---------- 07–09 · Quiz ---------- */
function Quiz({ qi, kid, selected, onPick }: { qi: number; kid: string; selected: number; onPick: (qi: number, oi: number) => void }) {
  const q = QUIZ[qi];
  return (
    <>
      <Eyebrow>Parenting quiz · {qi + 1} of 3</Eyebrow>
      <H1 text={q.q.replace('{name}', kid)} />
      <Sub>No wrong answers — this just tunes the story.</Sub>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
        {q.options.map((o, i) => {
          const on = i === selected;
          return (
            <button
              key={o}
              onClick={() => onPick(qi, i)}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 15px', borderRadius: 18, border: `2.5px solid ${INK}`, background: on ? 'var(--grape-100)' : '#fff', boxShadow: on ? '4px 5px 0 var(--grape-400)' : '2px 3px 0 var(--grape-300)', transform: `rotate(${i % 2 ? 0.4 : -0.4}deg)`, cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${INK}`, background: on ? GRAPE : '#fff', color: on ? '#fff' : INK, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, display: 'grid', placeItems: 'center', flex: 'none' }}>
                {String.fromCharCode(65 + i)}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: INK }}>{o}</span>
              {on && (
                <span style={{ position: 'absolute', top: -11, right: 10, background: GRAPE, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10.5, padding: '2px 10px', borderRadius: 99, border: `2px solid ${INK}` }}>
                  THAT’S US
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, minHeight: 10 }} />
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--ink-400)' }}>Pick one to continue</div>
    </>
  );
}

/* ---------- 10 · Profile result ---------- */
function Result({ power, kid, onNext }: { power: (typeof PARENT_POWERS)[number]; kid: string; onNext: () => void }) {
  return (
    <>
      <Eyebrow>Quiz complete</Eyebrow>
      <H1 text="Here’s your parenting profile" grape="parenting profile" />
      <ECard tilt={-0.6}>
        <div style={{ padding: '22px 20px', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', transform: 'rotate(-1.5deg)', background: GRAPE, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, letterSpacing: '.08em', padding: '4px 14px', borderRadius: 99, border: `2px solid ${INK}`, marginBottom: 12 }}>
            YOUR PARENT POWER
          </span>
          <div style={{ width: 74, height: 74, borderRadius: '50%', background: '#FFF3D6', border: `2.5px solid ${INK}`, boxShadow: '3px 4px 0 var(--grape-300)', display: 'grid', placeItems: 'center', margin: '0 auto 10px' }}>
            <Icon name="award" size={34} color={INK} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: INK }}>{power.type}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            {power.traits.map((t) => (
              <span key={t} style={{ padding: '6px 13px', borderRadius: 99, border: `2.5px solid ${INK}`, background: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: INK }}>{t}</span>
            ))}
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--ink-500)', lineHeight: 1.5, margin: '12px 0 0' }}>{power.blurb.replace('{name}', kid)}</p>
        </div>
      </ECard>
      <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-400)', marginTop: 12 }}>You can retake this anytime in Progress.</div>
      <div style={{ flex: 1, minHeight: 10 }} />
      <EButton onClick={onNext}>Meet Sprout</EButton>
    </>
  );
}

/* ---------- 11 · Meet Sprout ---------- */
function MeetSprout({ kid, onNext }: { kid: string; onNext: () => void }) {
  const pts: [string, string][] = [
    ['lock', 'Kid Zone lives behind your parent PIN'],
    ['list-checks', 'Every kid conversation is fully scripted — no open chat, ever'],
  ];
  return (
    <>
      <Eyebrow>One more thing</Eyebrow>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 14px' }}>
        <div style={{ position: 'relative' }}>
          <Mascot mood="idle" size={160} />
          <div style={{ position: 'absolute', top: -8, right: -80, transform: 'rotate(2deg)', background: GRAPE, color: '#fff', border: `2.5px solid ${INK}`, borderRadius: 14, padding: '7px 12px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, boxShadow: '3px 4px 0 rgba(42,37,33,.85)', whiteSpace: 'nowrap' }}>
            Hi {kid}!
            <span style={{ position: 'absolute', left: -9, top: '55%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: `9px solid ${INK}` }} />
          </div>
        </div>
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

/* ---------- 12 · All set ---------- */
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

function AllSet({ kid, age, power, onDone }: { kid: string; age: string; power: string; onDone: () => void }) {
  const items: [string, string, boolean][] = [
    ['Account created', 'check', false],
    [`${kid} added (ages ${age})`, 'check', false],
    [`Profile: ${power.replace(/^The /, '')}`, 'check', false],
    ['First mission ready', 'sparkles', true],
  ];
  return (
    <>
      <Eyebrow>All set</Eyebrow>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 6px' }}>
        <span style={{ transform: 'rotate(-2deg)', background: GRAPE, color: '#fff', border: `2.5px solid ${INK}`, borderRadius: 99, boxShadow: '3px 4px 0 rgba(42,37,33,.9)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, letterSpacing: '.08em', padding: '6px 16px' }}>
          SETUP COMPLETE ✦
        </span>
      </div>
      <H1 text="You’re all set!" grape="all set!" />
      <Sub>Here’s what we set up. Your first weekly mission is waiting on Today.</Sub>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map(([label, icon, last], i) => (
          <ECard key={label} tilt={i % 2 ? 0.4 : -0.4}>
            <div style={{ display: 'flex', gap: 12, padding: '12px 14px', alignItems: 'center' }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: last ? 'var(--sun-300)' : 'var(--green-100)', border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
                <Icon name={icon} size={15} color={INK} />
              </span>
              <span style={{ fontWeight: 800, fontSize: 14.5, color: INK }}>{label}</span>
            </div>
          </ECard>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 10 }} />
      <EButton onClick={onDone}>Go to Today</EButton>
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, fontWeight: 800, color: GRAPE }}>+10 stars for finishing setup ✦</div>
    </>
  );
}
