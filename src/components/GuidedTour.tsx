import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { INK } from './pop';
import { Mascot } from '../screens/kidzone/Mascot';

/*
 * Guided first-run tour ("see it work"). After onboarding, a non-modal coach bar
 * walks the parent through the real app so they hit the value immediately:
 *   Kid Zone (mandatory taste — play a real Journey) → the three games → the
 *   Journey tab (growth) → the lesson library → Ask Sprout.
 * Non-modal on purpose — the rest of the screen stays tappable so they actually
 * play. Runs once (settings.tourDone), skippable after the mandatory Kid Zone step.
 *
 * NOTE: step ids 'kid-journey' and 'kid-games' are load-bearing — KidZone reads
 * useTour() to auto-open the Journey demo on 'kid-journey' and drop back to the
 * Play grid on 'kid-games'. Keep those ids if you edit the steps.
 */

interface Step { id: string; route?: string; title: string; body: string; mandatory?: boolean; top?: boolean }
const STEPS: Step[] = [
  // Starts right inside a real, playing Journey game — value first, and mandatory.
  { id: 'kid-journey', route: '/kid', mandatory: true, top: true, title: 'This is a Journey', body: 'Watch — {kid} rehearses a real moment. Tap an answer to try it, then hit Next.' },
  { id: 'kid-games', route: '/kid', title: 'Three ways to play', body: 'This is {kid}’s Play tab: Journey tells a story, Quick Fire trains fast thinking, and Say It Out Loud practices the real words.' },
  { id: 'progress', route: '/progress', title: 'The Journey tab', body: 'Watch {kid} grow — levels, badges and streaks — and flip to your own learning any time.' },
  { id: 'library', route: '/lessons', title: 'Your lesson library', body: 'Real scripts for what to say — “Talking with {kid}” and “Your Situations.” It all lives under Learn.' },
  { id: 'ask-sprout', route: '/coach', title: 'Stuck? Ask Sprout', body: 'Tell Sprout what’s going on and it points you straight to the lesson that fits. Tap the ✨ in the middle any time.' },
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
          mandatory={!!step.mandatory} top={!!step.top} onNext={next} onSkip={finish}
        />
      )}
    </Ctx.Provider>
  );
}

function TourBar({ title, body, index, total, mandatory, top, onNext, onSkip }: {
  title: string; body: string; index: number; total: number; mandatory: boolean; top?: boolean; onNext: () => void; onSkip: () => void;
}) {
  const isLast = index === total - 1;
  const pos: React.CSSProperties = top
    ? { top: 0, padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 12px 0' }
    : { bottom: 0, padding: '0 12px calc(12px + env(safe-area-inset-bottom))' };
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, zIndex: 250, pointerEvents: 'none', ...pos }}>
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
            {isLast ? 'Jump in' : 'Next'}
          </button>
          {!mandatory && (
            <button onClick={onSkip} style={{ border: 'none', background: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, color: 'var(--ink-400)', cursor: 'pointer' }}>
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
