import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppStore';
import { areaColor, areaKidWorld, type AreaKey } from '../../constants/areas';
import { Button, Icon, PinPad, Sheet } from '../../components/ds';
import { INK, popBg } from '../../components/pop';
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
import { LevelUpCard, KidStreakCard, AwardToast } from '../../components/celebrations';

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
  const inKidTour = tour.active && tour.stepId === 'kid';
  const [entered, setEntered] = useState(inKidTour);
  useEffect(() => { if (inKidTour) setEntered(true); }, [inKidTour]);
  const [view, setView] = useState<'quest' | 'me'>('quest');
  const [game, setGame] = useState<GameKind | null>(null);
  const [boss, setBoss] = useState(false);
  const [gate, setGate] = useState(false);
  const [pin, setPin] = useState('');
  const [wrong, setWrong] = useState(false);
  const [journeyArea, setJourneyArea] = useState<AreaKey | null>(null);

  // Free plan opens only the one Journey sample — Quick Fire and Say It Out Loud
  // are Premium. Tapping a locked game jumps straight to the upgrade screen.
  const tryPlay = (g: GameKind) => {
    if (!plan.isPremium && (g === 'quickfire' || g === 'sayit')) navigate('/plans');
    else setGame(g);
  };

  useEffect(() => { if (game || boss) sfx('enter'); }, [game, boss]);

  // The tour shows the Play grid (not a game in progress), so keep it closed.
  useEffect(() => {
    if (tour.active) setJourneyArea(null);
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
            onLocked={() => navigate('/plans')}
            onExit={() => setJourneyArea(null)}
          />
        </Suspense>
      </div>
    );
  } else if (game) {
    const title = game === 'quickfire' ? 'Quick Fire' : 'Say It Out Loud';
    content = (
      <div className="kidzone" style={{ minHeight: '100dvh', ...popBg }}>
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
      <CelebrationOverlay />
    </>
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

  useEffect(() => {
    if (!award || award.ts <= seen.current) return;
    seen.current = award.ts;
    const firstOfDay = award.breakdown.some((b) => /first activity today/.test(b));
    // The cards fire their own confetti + sound on mount; we just pick one.
    if (award.leveledTo) {
      setLevelUp({ ...award.leveledTo, stars: award.stars });
    } else if (firstOfDay) {
      // the day's first meaningful activity extended the learning streak
      const days = learningStreak(state.activity, award.childId).current;
      setStreakPop({ days, stars: award.stars });
    } else if (award.newBadges.length) {
      setToast({ title: `🏅 New badge: ${award.newBadges[0]}!`, sub: `+${award.stars} stars earned` });
    } else if (award.questCompleted) {
      setToast({ title: '✅ Daily Quest complete!', sub: `+${award.stars} stars earned` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [award]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  if (levelUp) return <LevelUpCard level={levelUp.level} title={levelUp.title} stars={levelUp.stars} onClose={() => setLevelUp(null)} />;
  if (streakPop) return <KidStreakCard days={streakPop.days} stars={streakPop.stars} onClose={() => setStreakPop(null)} />;
  if (toast) return <AwardToast title={toast.title} sub={toast.sub} />;
  return null;
}
