import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hook, MultiBeat, SingleBeat, MechanismBeat, GamesBeat, ValueStack1, ValueStack2,
  Recommendation, Offer, Progress, InstallSheet, type Opt, type Creative,
} from './ui';
import {
  detectEnv, resolveEnv, track, KID_MAP, KID_DESC, PARENT_MAP, STATE_KEY, INTAKE_KEY, type Env,
} from './env';

/* ---- ad creatives (set per ad via ?angle=freeze|meltdown|hangback) ---- */
const AD_ANGLES: Record<string, Creative> = {
  freeze: {
    eyebrow: 'FOR KIDS WHO FREEZE UP',
    headline: 'Your kid doesn’t need more confidence lectures. They need practice.',
    sub: 'Take 30 seconds — see exactly where your child is stuck, and the plan that fixes it.',
  },
  meltdown: {
    eyebrow: 'FOR KIDS WHO MELT DOWN',
    headline: 'Big feelings don’t need another lecture. They need practice.',
    sub: 'Take 30 seconds — see exactly where your child is stuck, and the plan that fixes it.',
  },
  hangback: {
    eyebrow: 'FOR KIDS WHO HANG BACK',
    headline: 'Confidence isn’t a pep talk. It’s something you practice.',
    sub: 'Take 30 seconds — see exactly where your child is stuck, and the plan that fixes it.',
  },
};

const Q1_PROBLEM: Opt[] = [
  { k: 'freeze', label: 'Freezes up and goes quiet' },
  { k: 'givein', label: 'Gives in / gets walked over' },
  { k: 'meltdown', label: 'Melts down when things go wrong' },
  { k: 'friends', label: 'Struggles to make or keep friends' },
  { k: 'teasing', label: 'Can’t shake off teasing' },
  { k: 'pushy', label: 'Gets loud or pushy instead of talking' },
];
const Q2_AGITATE: Opt[] = [
  { k: 'deflated', label: 'They come home upset or deflated' },
  { k: 'avoid', label: 'They stop wanting to try — avoid it next time' },
  { k: 'helpless', label: 'I watch it happen and feel helpless' },
  { k: 'friendships', label: 'It’s starting to affect their friendships' },
  { k: 'confidence', label: 'Their confidence is slipping' },
];
const Q3_ASPIRE: Opt[] = [
  { k: 'speak', label: 'They speak up for themselves' },
  { k: 'join', label: 'They walk into a new group and just… join in' },
  { k: 'teasing', label: 'They shrug off teasing instead of crumbling' },
  { k: 'talks', label: 'Hard talks between us get easier', tag: 'FOR YOU' },
  { k: 'feelings', label: 'They handle big feelings without melting down' },
];
const Q4_OBJECT: Opt[] = [
  { k: 'notime', label: 'I talk to them, but I don’t always have time to keep at it' },
  { k: 'whattosay', label: 'I’m not always sure what the right thing to say is' },
  { k: 'myself', label: 'Honestly, I’d like to get better at communicating myself', tag: 'FOR YOU' },
  { k: 'nothing', label: 'I’ve tried apps or books, but nothing stuck' },
];

interface Saved { beat?: number; q1?: string[]; q2?: string[]; q3?: string | null; q4?: string[] }
function loadState(): Saved {
  try { const s = JSON.parse(localStorage.getItem(STATE_KEY) || 'null'); if (s && typeof s === 'object') return s; } catch { /* ignore */ }
  return {};
}
const asArr = (v: unknown): string[] => (Array.isArray(v) ? v : []);

/**
 * Sprout acquisition funnel (the Meta-ads landing page at /start).
 * 11-beat linear flow → personalized plan → PWA install. The installed
 * home-screen icon opens the app at "/" (manifest start_url), and the app
 * reads `sprout_intake` to personalize onboarding.
 */
export function Funnel() {
  const navigate = useNavigate();
  const angle = (new URLSearchParams(window.location.search).get('angle') || 'freeze') as keyof typeof AD_ANGLES;
  const creative = AD_ANGLES[angle] || AD_ANGLES.freeze;

  const saved = useRef(loadState()).current;
  const [beat, setBeat] = useState(saved.beat || 1);
  const [q1, setQ1] = useState<string[]>(asArr(saved.q1));
  const [q2, setQ2] = useState<string[]>(asArr(saved.q2));
  const [q3, setQ3] = useState<string | null>(saved.q3 || null);
  const [q4, setQ4] = useState<string[]>(asArr(saved.q4));
  const [sheet, setSheet] = useState(false);
  const [installed, setInstalled] = useState(false);

  const detected = useRef<Env>(detectEnv()).current;
  const effEnv = resolveEnv(detected);
  const deferredPrompt = useRef<{ prompt?: () => void } | null>(null);

  const primProblem = q1[0] || 'freeze';
  const primObject = q4[0] || 'whattosay';
  const kidWorld = KID_MAP[primProblem] || 'Talking';
  const kidDesc = KID_DESC[primProblem] || 'Finding the words to speak up';
  const parentTrack = PARENT_MAP[primObject] || 'When They Won’t Open Up';

  useEffect(() => {
    try { localStorage.setItem(STATE_KEY, JSON.stringify({ beat, q1, q2, q3, q4 })); } catch { /* ignore */ }
  }, [beat, q1, q2, q3, q4]);

  // Pass-through: write intake once the plan is revealed (app reads this).
  useEffect(() => {
    if (beat >= 10) {
      try { localStorage.setItem(INTAKE_KEY, JSON.stringify({ q1, q2, q3, q4, kidWorld, parentTrack, ts: Date.now() })); } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat]);

  useEffect(() => { track('ViewContent', { content_name: 'funnel_v2_hook', angle }); }, [angle]);
  useEffect(() => { if (beat === 10) track('Lead', { kidWorld, parentTrack }); }, [beat, kidWorld, parentTrack]);
  useEffect(() => { if (detected === 'installed') track('CompleteRegistration', { via: 'standalone' }); }, [detected]);

  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); deferredPrompt.current = e as unknown as { prompt?: () => void }; };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, [beat, sheet]);

  const goto = (b: number) => setBeat(b);
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (key: string) =>
    setter((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  const pickSingle = (setter: (v: string) => void, next: number) => (val: string) => { setter(val); setTimeout(() => setBeat(next), 360); };

  function handleInstall() {
    track('InitiateCheckout', { content_name: 'install', env: effEnv });
    if (detected === 'installed') { setInstalled(true); setSheet(true); track('CompleteRegistration', { via: 'already_installed' }); return; }
    setSheet(true);
  }
  function androidInstall() {
    const dp = deferredPrompt.current;
    if (dp && dp.prompt) { try { dp.prompt(); } catch { /* ignore */ } }
    setInstalled(true);
    track('CompleteRegistration', { via: 'android_prompt' });
  }
  // "Just open it in my browser for now" → go straight into the app.
  function fallbackOpen() {
    track('CompleteRegistration', { via: 'browser_fallback' });
    navigate('/');
  }

  let screen;
  if (beat === 1) screen = <Hook creative={creative} onNext={() => goto(2)} />;
  else if (beat === 2) screen = (
    <MultiBeat key="q1" head="Does your child do any of these?" sub="Tick all that sound familiar — most parents pick a few."
      options={Q1_PROBLEM} values={q1} onToggle={toggle(setQ1)} onNext={() => goto(3)} cta="Yep, that’s them"
      footer="No judgment — you’re here, and that’s the hard part." />
  );
  else if (beat === 3) screen = (
    <MultiBeat key="q2" head="And when that happens… what does it usually lead to?"
      options={Q2_AGITATE} values={q2} onToggle={toggle(setQ2)} onNext={() => goto(4)} cta="That’s us"
      note={
        <div className="pop-in" style={{ display: 'flex', alignItems: 'flex-start', gap: 11, margin: '16px 0 2px', padding: '12px 14px', background: 'var(--sun-100)', border: '2.5px solid var(--ink-900)', borderRadius: 16, boxShadow: '3px 4px 0 rgba(42,37,33,.2)' }}>
          <span style={{ flex: 'none', width: 22, height: 22, marginTop: 1, borderRadius: '50%', background: '#fff', border: '2px solid var(--ink-900)', display: 'grid', placeItems: 'center', fontSize: 13 }}>♥</span>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.5 }}>
            You’re not overreacting. These small moments add up — <b style={{ color: 'var(--ink-900)', fontWeight: 800 }}>which is exactly why practicing them matters.</b>
          </span>
        </div>
      } />
  );
  else if (beat === 4) screen = (
    <SingleBeat key="q3" head="If one thing changed this month, what would you pick?" sub="Picture it — this is what we’ll build toward."
      options={Q3_ASPIRE} value={q3} onPick={pickSingle(setQ3, 5)} />
  );
  else if (beat === 5) screen = (
    <MultiBeat key="q4" head="How have you tried to help so far?" sub="Totally honest — most parents pick more than one."
      options={Q4_OBJECT} values={q4} onToggle={toggle(setQ4)} onNext={() => goto(6)} cta="Show me what works"
      note={
        <div className="pop-in" style={{ margin: '16px 0 2px', padding: '13px 15px', background: 'var(--grape-100)', border: '2.5px solid var(--ink-900)', borderRadius: 16, boxShadow: '3px 4px 0 rgba(42,37,33,.2)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5, color: 'var(--grape-600)', lineHeight: 1.35 }}>Here’s the thing almost every parent misses…</span>
        </div>
      } />
  );
  else if (beat === 6) screen = <MechanismBeat onNext={() => goto(7)} />;
  else if (beat === 7) screen = <GamesBeat onNext={() => goto(8)} />;
  else if (beat === 8) screen = <ValueStack1 onNext={() => goto(9)} />;
  else if (beat === 9) screen = <ValueStack2 onNext={() => goto(10)} />;
  else if (beat === 10) screen = <Recommendation kidWorld={kidWorld} kidDesc={kidDesc} parentTrack={parentTrack} onNext={() => goto(11)} />;
  else screen = <Offer onInstall={handleInstall} onFallback={fallbackOpen} />;

  const showBack = beat >= 2 && beat <= 10 && !sheet;

  return (
    <div className="fnl-page">
      <div className="fnl-stage">
        {showBack && (
          <div style={{ marginBottom: beat >= 2 && beat <= 5 ? 12 : 16 }}>
            <button onClick={() => goto(beat - 1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--grape-600)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, padding: 0 }}>
              <span style={{ fontSize: 17, lineHeight: 1 }}>←</span> Back
            </button>
          </div>
        )}
        {beat >= 2 && beat <= 5 && <Progress n={beat - 1} total={4} />}
        {screen}
      </div>
      {sheet && (
        <InstallSheet
          env={detected === 'installed' ? 'installed' : effEnv}
          installed={installed}
          onClose={() => setSheet(false)}
          onAndroidInstall={androidInstall}
        />
      )}
    </div>
  );
}
