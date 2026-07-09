import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppStore';
import { areaColor, areaKidWorld, type AreaKey } from '../../constants/areas';
import { Button, Icon, PinPad, Sheet } from '../../components/ds';
import { INK } from '../../components/pop';
import { useSoundMaster } from '../../audio/MusicProvider';
import { sfx } from '../../audio/sfx';
import { learningStreak } from '../../engine/economy';
import { usePlan, FREE_SCENARIO_ID } from '../../engine/plan';
import { useTour } from '../../components/GuidedTour';
import { AREA_TO_JOURNEY } from '../../data/journey';
import { KidQuest } from './KidQuest';
import { KidProgress } from './KidProgress';
import { Mascot } from './Mascot';
import { QuickFireGame } from './games/QuickFire';
import { SayItGame } from './games/SayIt';
import { burstConfetti } from './confetti';

// Lazy so the heavy Journey scenario data only downloads when a child actually
// opens a Journey (or the Boss Challenge), not on entering Kid Zone.
const JourneyFlow = lazy(() => import('./JourneyFlow').then((m) => ({ default: m.JourneyFlow })));
const BossFlow = lazy(() => import('./BossFlow').then((m) => ({ default: m.BossFlow })));

export type GameKind = 'quickfire' | 'journey' | 'sayit';

export function KidZone() {
  const { activeChild, state } = useApp();
  const navigate = useNavigate();
  const plan = usePlan();
  const tour = useTour();
  const child = activeChild;

  // During the guided tour the parent is watching — skip the "hand phone over" gate.
  const inKidTour = tour.active && (tour.stepId === 'kid-journey' || tour.stepId === 'kid-games');
  const [entered, setEntered] = useState(inKidTour);
  useEffect(() => { if (inKidTour) setEntered(true); }, [inKidTour]);
  const [view, setView] = useState<'quest' | 'me'>('quest');
  const [game, setGame] = useState<GameKind | null>(null);
  const [boss, setBoss] = useState(false);
  const [gate, setGate] = useState(false);
  const [parentGate, setParentGate] = useState(false);
  const [pin, setPin] = useState('');
  const [wrong, setWrong] = useState(false);
  const [journeyArea, setJourneyArea] = useState<AreaKey | null>(null);

  // Free plan: one Quick Fire + one Say It Out Loud sample, one Journey story.
  // A premium lock inside Kid Zone always shows the Parent Check first.
  const played = (kind: string) => state.activity.some((e) => e.childId === child.id && e.kind === kind);
  const tryPlay = (g: GameKind) => {
    if (!plan.isPremium && played(g === 'quickfire' ? 'quickfire' : 'sayit')) setParentGate(true);
    else setGame(g);
  };

  useEffect(() => { if (game || boss) sfx('enter'); }, [game, boss]);

  // Tour drives the Journey demo: step 'kid-journey' auto-opens the Friends world
  // (the free scenario auto-launches into its game); later steps show the quest.
  useEffect(() => {
    if (!tour.active) return;
    setJourneyArea(tour.stepId === 'kid-journey' ? 'connect' : null);
  }, [tour.active, tour.stepId]);

  const exitToParent = () => navigate('/today');

  let content: React.ReactNode;

  if (!entered) {
    content = (
      <div className="kidzone" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 28, background: 'var(--kid-bg)' }}>
        <div style={{ width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #EAF6E2, #BFE3CB)', border: `2.5px solid ${INK}`, boxShadow: '5px 6px 0 rgba(42,37,33,.85)', display: 'grid', placeItems: 'center', marginBottom: 24 }}>
          <Mascot mood="idle" size={112} />
        </div>
        <h1 style={{ fontSize: 'var(--text-3xl)', color: 'var(--grape-600)' }}>Hand the phone<br />to {child.name}</h1>
        <p style={{ color: 'var(--ink-700)', fontSize: 'var(--text-lg)', maxWidth: 280, margin: '12px 0 28px' }}>Time to play, practice, and earn some stars!</p>
        <div style={{ width: '100%', maxWidth: 300 }}>
          <Button variant="primary" size="lg" fullWidth iconLeft={<Icon name="play" size={22} color="#fff" />} onClick={() => { sfx('enter'); setEntered(true); }}>I’m ready!</Button>
        </div>
        <button onClick={exitToParent} style={{ marginTop: 18, border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>Not now</button>
      </div>
    );
  } else if (boss) {
    content = (
      <div className="kidzone" style={{ minHeight: '100dvh', background: 'var(--kid-bg)' }}>
        <Suspense fallback={<KidLoading />}>
          <BossFlow child={child} onExit={() => setBoss(false)} />
        </Suspense>
      </div>
    );
  } else if (journeyArea) {
    content = (
      <div className="kidzone" style={{ minHeight: '100dvh', background: 'var(--kid-bg)' }}>
        <Suspense fallback={<KidLoading />}>
          <JourneyFlow
            child={child}
            category={AREA_TO_JOURNEY[journeyArea]}
            worldName={areaKidWorld(journeyArea)}
            color={areaColor(journeyArea)}
            freeScenarioId={plan.isPremium ? null : FREE_SCENARIO_ID}
            autoOpenId={tour.active && tour.stepId === 'kid-journey' ? FREE_SCENARIO_ID : null}
            onLocked={() => setParentGate(true)}
            onExit={() => setJourneyArea(null)}
          />
        </Suspense>
      </div>
    );
  } else if (game) {
    const title = game === 'quickfire' ? 'Quick Fire' : 'Say It Out Loud';
    content = (
      <div className="kidzone" style={{ minHeight: '100dvh', background: 'var(--kid-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 4px' }}>
          <button onClick={() => setGame(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: 'var(--grape-600)', fontWeight: 800, cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
            <Icon name="x" size={20} color="var(--grape-600)" /> Quit
          </button>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--grape-600)', whiteSpace: 'nowrap' }}>{title}</div>
          <MuteButton />
        </div>
        {game === 'quickfire' && <QuickFireGame child={child} onExit={() => setGame(null)} />}
        {game === 'sayit' && <SayItGame child={child} onExit={() => setGame(null)} />}
      </div>
    );
  } else {
    // --- Quest / My Growth (design: grape gradient header + halftone body) ---
    content = (
      <div className="kidzone" style={{ minHeight: '100dvh', backgroundColor: '#F6F1FF', backgroundImage: 'radial-gradient(rgba(122,90,217,.10) 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }}>
        <div style={{ background: 'linear-gradient(160deg, var(--grape-500), var(--grape-600))', borderBottom: `2.5px solid ${INK}`, padding: '16px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button aria-label="Grown-ups only" onClick={() => { setGate(true); setPin(''); setWrong(false); }} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.18)', border: '2px solid rgba(255,255,255,.5)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <Icon name="x" size={18} color="#fff" />
            </button>
            <h1 style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#fff', textAlign: 'center', margin: 0 }}>Kid Zone</h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '3px 11px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: INK }}>
              <Icon name="star" size={13} color="var(--sun-500)" fill="var(--sun-500)" />{child.stars}
            </span>
          </div>
          <div style={{ display: 'flex', border: `2.5px solid ${INK}`, borderRadius: 99, background: '#fff', padding: 3, marginTop: 14, boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}>
            {([['quest', 'Play'], ['me', 'My Growth']] as const).map(([k, label]) => {
              const on = view === k;
              return (
                <button
                  key={k} type="button" onClick={() => setView(k)}
                  style={{
                    flex: 1, height: 36, border: 'none', borderRadius: 99, cursor: 'pointer',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14,
                    background: on ? 'var(--grape-500)' : 'transparent',
                    color: on ? '#fff' : 'var(--ink-500)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {view === 'quest'
          ? <KidQuest child={child} onPlay={tryPlay} onOpenJourney={setJourneyArea} onBoss={() => setBoss(true)} />
          : <KidProgress child={child} />}

        {/* PIN gate */}
        <Sheet open={gate} onClose={() => setGate(false)} title="Grown-up check">
          <p style={{ marginTop: -6, marginBottom: 16, color: 'var(--text-muted)', textAlign: 'center' }}>Enter your parent PIN to leave Kid Zone.</p>
          <PinPad
            value={pin} error={wrong}
            onChange={(v) => { setPin(v); setWrong(false); }}
            onComplete={(p) => {
              if (p === state.settings.pin) exitToParent();
              else { setWrong(true); setTimeout(() => setPin(''), 500); }
            }}
          />
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>Demo PIN: {state.settings.pin}</p>
        </Sheet>
      </div>
    );
  }

  return (
    <>
      {content}
      <ParentGateSheet open={parentGate} onClose={() => setParentGate(false)} onPass={() => { setParentGate(false); navigate('/plans'); }} />
      <CelebrationOverlay />
    </>
  );
}

/**
 * Parent Check before any purchase screen reachable from Kid Zone:
 * hold the button for 3 seconds (a child-resistant adult confirmation).
 */
function ParentGateSheet({ open, onClose, onPass }: { open: boolean; onClose: () => void; onPass: () => void }) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  const start = () => {
    setHolding(true);
    const t0 = Date.now();
    timer.current = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / 3000);
      setProgress(p);
      if (p >= 1) { window.clearInterval(timer.current); setHolding(false); setProgress(0); onPass(); }
    }, 50);
  };
  const stop = () => { window.clearInterval(timer.current); setHolding(false); setProgress(0); };

  return (
    <Sheet open={open} onClose={onClose} title="Parent Check 🔒">
      <p style={{ marginTop: -6, marginBottom: 6, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 700 }}>
        This part is for grown-ups. Ask your parent to continue.
      </p>
      <p style={{ margin: '0 0 16px', color: 'var(--ink-400)', textAlign: 'center', fontWeight: 700, fontSize: 12.5 }}>
        Parents: press and hold for 3 seconds.
      </p>
      <button
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        style={{ position: 'relative', width: '100%', minHeight: 54, border: `2.5px solid ${INK}`, borderRadius: 99, background: '#fff', overflow: 'hidden', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: INK }}
      >
        <span style={{ position: 'absolute', inset: 0, width: `${progress * 100}%`, background: 'var(--grape-100)', transition: holding ? 'none' : 'width .2s' }} />
        <span style={{ position: 'relative' }}>{holding ? 'Keep holding…' : 'Hold to continue'}</span>
      </button>
    </Sheet>
  );
}

function KidLoading() {
  return (
    <div style={{ minHeight: '60dvh', display: 'grid', placeItems: 'center' }}>
      <Mascot mood="idle" size={96} />
    </div>
  );
}

function MuteButton() {
  const { anyOn, setAll } = useSoundMaster();
  return (
    <button aria-label={anyOn ? 'Mute sound' : 'Play sound'} onClick={() => setAll(!anyOn)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grape-100)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
      <Icon name={anyOn ? 'volume-2' : 'volume-x'} size={18} color="var(--grape-600)" />
    </button>
  );
}

/**
 * Watches the economy's lastAward and celebrates: full-screen level-up
 * (growth animation + new title, tap to continue) or a short award toast for
 * badges / daily-quest completion. Celebrations are short (2–5s) per spec.
 */
function CelebrationOverlay() {
  const { state } = useApp();
  const award = state.lastAward;
  const seen = useRef<number>(award?.ts ?? 0);
  const [levelUp, setLevelUp] = useState<{ level: number; title: string; stars: number } | null>(null);
  const [streakPop, setStreakPop] = useState<{ days: number; stars: number } | null>(null);
  const [toast, setToast] = useState<{ title: string; sub?: string } | null>(null);
  const confettiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!award || award.ts <= seen.current) return;
    seen.current = award.ts;
    const firstOfDay = award.breakdown.some((b) => /first activity today/.test(b));
    if (award.leveledTo) {
      setLevelUp({ ...award.leveledTo, stars: award.stars });
      sfx('cheer');
      setTimeout(() => burstConfetti(confettiRef.current, 36), 300);
    } else if (firstOfDay) {
      // the day's first meaningful activity extended the learning streak
      const days = learningStreak(state.activity, award.childId).current;
      setStreakPop({ days, stars: award.stars });
      sfx('cheer');
      setTimeout(() => burstConfetti(confettiRef.current, 28), 300);
    } else if (award.newBadges.length) {
      setToast({ title: `🏅 New badge: ${award.newBadges[0]}!`, sub: `+${award.stars} stars earned` });
      sfx('celebrate');
    } else if (award.questCompleted) {
      setToast({ title: '✅ Daily Quest complete!', sub: `+${award.stars} stars earned` });
      sfx('celebrate');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [award]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  if (levelUp) {
    return (
      <div
        onClick={() => setLevelUp(null)}
        style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(42,37,33,.72)', display: 'grid', placeItems: 'center', padding: 24 }}
      >
        <div ref={confettiRef} style={{ background: 'linear-gradient(155deg, var(--grape-500), var(--grape-600))', border: `2.5px solid ${INK}`, borderRadius: 24, boxShadow: '6px 7px 0 rgba(42,37,33,.9)', padding: 8, width: '100%', maxWidth: 340 }}>
          <div style={{ border: '2px dashed rgba(255,255,255,.4)', borderRadius: 17, padding: '22px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, letterSpacing: '.1em', color: 'var(--sun-300)' }}>✦ LEVEL UP ✦</div>
            <div style={{ margin: '10px auto 0', width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #EAF6E2, #BFE3CB)', border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
              <Mascot mood="growth" playKey={levelUp.level} size={116} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: '#fff', marginTop: 12, lineHeight: 1.1 }}>{levelUp.title}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--grape-100)', marginTop: 3 }}>Your Sprout grew to Level {levelUp.level}!</div>
            <div style={{ marginTop: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '4px 14px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: INK }}>
                <Icon name="star" size={14} color="var(--sun-500)" fill="var(--sun-500)" />+{levelUp.stars} stars
              </span>
            </div>
            <button style={{ marginTop: 16, width: '100%', border: `2.5px solid ${INK}`, borderRadius: 99, background: '#fff', color: INK, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, padding: 12, boxShadow: '3px 4px 0 rgba(42,37,33,.5)', cursor: 'pointer' }}>
              Keep growing! 🌱
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (streakPop) {
    return (
      <div
        onClick={() => setStreakPop(null)}
        style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(42,37,33,.72)', display: 'grid', placeItems: 'center', padding: 24 }}
      >
        <div ref={confettiRef} style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 24, boxShadow: '6px 7px 0 rgba(42,37,33,.9)', padding: '26px 20px', width: '100%', maxWidth: 320, textAlign: 'center' }}>
          <span style={{ display: 'inline-grid', placeItems: 'center', width: 84, height: 84, borderRadius: '50%', background: '#FBE3D8', border: `2.5px solid ${INK}`, fontSize: 40 }}>🔥</span>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: INK, marginTop: 12, lineHeight: 1.05 }}>
            {streakPop.days}-day streak!
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, color: 'var(--ink-500)', marginTop: 5 }}>
            Your Sprout grew today. {streakPop.days >= 3 ? 'You’re on a roll! 🌱' : 'Come back tomorrow to keep it going!'}
          </div>
          <div style={{ marginTop: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--sun-100)', border: `2px solid ${INK}`, borderRadius: 99, padding: '4px 14px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: INK }}>
              <Icon name="star" size={14} color="var(--sun-500)" fill="var(--sun-500)" />+{streakPop.stars} stars
            </span>
          </div>
          <button style={{ marginTop: 16, width: '100%', border: `2.5px solid ${INK}`, borderRadius: 99, background: 'var(--coral-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, padding: 12, boxShadow: '3px 4px 0 rgba(42,37,33,.85)', cursor: 'pointer' }}>
            Keep it up! 🔥
          </button>
        </div>
      </div>
    );
  }

  if (toast) {
    return (
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)', zIndex: 300, display: 'flex', justifyContent: 'center', pointerEvents: 'none', padding: '0 20px' }}>
        <div className="fade-up" style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: '4px 5px 0 rgba(42,37,33,.85)', padding: '12px 18px', maxWidth: 340 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: INK }}>{toast.title}</div>
          {toast.sub && <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-500)', marginTop: 2 }}>{toast.sub}</div>}
        </div>
      </div>
    );
  }
  return null;
}
