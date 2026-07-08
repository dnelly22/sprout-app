import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { INK } from './pop';
import { Mascot } from '../screens/kidzone/Mascot';

/*
 * Guided first-run tour ("see it work"). After onboarding, a non-modal coach bar
 * walks the parent through the real app so they hit the value immediately:
 *   intro → Kid Zone (mandatory taste, play a game) → progress → parent library.
 * Non-modal on purpose — the rest of the screen stays tappable so they actually
 * play. Runs once (settings.tourDone), skippable after the mandatory Kid Zone step.
 */

interface Step { id: string; route?: string; title: string; body: string; mandatory?: boolean }
const STEPS: Step[] = [
  { id: 'intro', title: 'You’re all set! 🎉', body: 'Take the 30-second tour — I’ll show you the good stuff first.' },
  { id: 'kid', route: '/kid', mandatory: true, title: '{kid}’s Zone', body: 'This is where {kid} plays. Tap a game — try a Journey to see how they rehearse a real moment.' },
  { id: 'progress', route: '/progress', title: 'Watch {kid} grow', body: 'Levels, badges and streaks build up here — plus your own learning, in one place.' },
  { id: 'library', route: '/lessons', title: 'Your script library', body: 'Exactly what to say — for {kid}, and with {kid}. This part’s for you.' },
];

interface TourCtx { active: boolean; stepId: string | null }
const Ctx = createContext<TourCtx>({ active: false, stepId: null });
export const useTour = () => useContext(Ctx);

export function TourProvider({ children }: { children: ReactNode }) {
  const { state, activeChild, dispatch } = useApp();
  const navigate = useNavigate();
  const loc = useLocation();
  const [i, setI] = useState(-1); // -1 = inactive

  const blocked = ['/onboarding', '/start'].some((p) => loc.pathname.startsWith(p));
  const eligible = state.onboarded && !state.settings.tourDone && !blocked;

  // Auto-start once, when they first land in the app after onboarding.
  useEffect(() => {
    if (eligible && i === -1) setI(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible]);

  const active = i >= 0 && i < STEPS.length;
  const step = active ? STEPS[i] : null;

  // Drive navigation when entering a routed step (only on step change — never fights the user after).
  useEffect(() => {
    if (step?.route && loc.pathname !== step.route) navigate(step.route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const finish = () => {
    setI(-1);
    dispatch({ type: 'updateSettings', patch: { tourDone: true } });
    if (loc.pathname !== '/today') navigate('/today');
  };
  const next = () => (i + 1 >= STEPS.length ? finish() : setI(i + 1));

  const kid = activeChild?.name || 'your child';
  const fill = (s: string) => s.replace(/\{kid\}/g, kid);

  return (
    <Ctx.Provider value={{ active, stepId: step?.id ?? null }}>
      {children}
      {active && step && (
        <TourBar
          title={fill(step.title)} body={fill(step.body)} index={i} total={STEPS.length}
          mandatory={!!step.mandatory} onNext={next} onSkip={finish}
        />
      )}
    </Ctx.Provider>
  );
}

function TourBar({ title, body, index, total, mandatory, onNext, onSkip }: {
  title: string; body: string; index: number; total: number; mandatory: boolean; onNext: () => void; onSkip: () => void;
}) {
  const isIntro = index === 0;
  const isLast = index === total - 1;
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 250, padding: '0 12px calc(12px + env(safe-area-inset-bottom))', pointerEvents: 'none' }}>
      <div className="fade-up" style={{ maxWidth: 460, margin: '0 auto', pointerEvents: 'auto', background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 rgba(42,37,33,.85)', padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #EAF6E2, #BFE3CB)', border: `2px solid ${INK}`, overflow: 'hidden', flex: 'none', display: 'grid', placeItems: 'center' }}>
          <Mascot mood="idle" size={40} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5, color: INK, lineHeight: 1.15 }}>{title}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-700)', lineHeight: 1.4, marginTop: 2 }}>{body}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {Array.from({ length: total }).map((_, k) => (
              <span key={k} style={{ width: k === index ? 16 : 6, height: 6, borderRadius: 99, background: k <= index ? 'var(--grape-500)' : 'var(--grape-100)', border: `1.5px solid ${INK}`, transition: 'width .2s' }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 'none', alignItems: 'stretch' }}>
          <button onClick={onNext} style={{ border: `2.5px solid ${INK}`, borderRadius: 99, background: 'var(--grape-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, padding: '9px 15px', boxShadow: '2px 3px 0 rgba(42,37,33,.7)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {isIntro ? 'Start tour' : isLast ? 'Jump in' : 'Next'}
          </button>
          {!mandatory && (
            <button onClick={onSkip} style={{ border: 'none', background: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, color: 'var(--ink-400)', cursor: 'pointer' }}>
              {isIntro ? 'Maybe later' : 'Skip tour'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
