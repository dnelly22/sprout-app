import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { INK } from './pop';
import { Mascot } from '../screens/kidzone/Mascot';

/*
 * Guided first-run tour. A spotlight coach-mark walkthrough of the five bottom
 * tabs: it dims the whole app, cuts a bright hole around the tab it's talking
 * about, points a bubble at it, and blocks all app interaction — the only thing
 * the parent can tap is "Next" (and "Skip" after the first, mandatory step).
 * Runs once (settings.tourDone); replayable from Settings.
 */

interface Step { id: string; tab: string; route: string; title: string; body: string; mandatory?: boolean }
const STEPS: Step[] = [
  { id: 'today', tab: 'today', route: '/today', mandatory: true, title: 'Today — your home base', body: 'Your recommended lesson and a snapshot of {kid}’s progress live here.' },
  { id: 'learn', tab: 'lessons', route: '/lessons', title: 'Learn — your lesson library', body: 'Real scripts for what to say: “Talking with {kid}” and “Your Situations.”' },
  { id: 'sprout', tab: 'coach', route: '/coach', title: 'Sprout — your helper', body: 'Stuck in the moment? Tell Sprout what’s happening and it points you to the lesson that fits.' },
  { id: 'kid', tab: 'kid', route: '/today', title: 'Kid Zone — where {kid} plays', body: 'Journeys, Quick Fire and Say It Out Loud. Tap here whenever {kid} wants to practise.' },
  { id: 'journey', tab: 'progress', route: '/progress', title: 'Journey — track growth', body: 'Watch {kid} grow with levels, badges and streaks — plus your own learning.' },
];

interface TourCtx { active: boolean; stepId: string | null }
const Ctx = createContext<TourCtx>({ active: false, stepId: null });
export const useTour = () => useContext(Ctx);

export function TourProvider({ children }: { children: ReactNode }) {
  const { state, activeChild, dispatch } = useApp();
  const navigate = useNavigate();
  const loc = useLocation();
  const [i, setI] = useState(-1); // -1 = inactive
  const [rect, setRect] = useState<DOMRect | null>(null);

  const blocked = ['/onboarding', '/start'].some((p) => loc.pathname.startsWith(p));
  const eligible = state.onboarded && !state.settings.tourDone && !blocked;

  // Auto-start once, when they first land in the app after onboarding.
  useEffect(() => {
    if (eligible && i === -1) setI(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible]);

  const active = i >= 0 && i < STEPS.length;
  const step = active ? STEPS[i] : null;

  // Drive navigation when entering a step (nav is persistent so the tab stays put).
  useEffect(() => {
    if (step?.route && loc.pathname !== step.route) navigate(step.route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  // Locate the highlighted tab, and keep it fresh across nav/render/resize.
  useEffect(() => {
    if (!step) { setRect(null); return; }
    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.tab}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    const r1 = requestAnimationFrame(() => requestAnimationFrame(measure));
    const t = window.setTimeout(measure, 280);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(r1); clearTimeout(t); window.removeEventListener('resize', measure); };
  }, [i, loc.pathname]);

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
        <TourOverlay
          title={fill(step.title)} body={fill(step.body)} index={i} total={STEPS.length}
          mandatory={!!step.mandatory} rect={rect} onNext={next} onSkip={finish}
        />
      )}
    </Ctx.Provider>
  );
}

function TourOverlay({ title, body, index, total, mandatory, rect, onNext, onSkip }: {
  title: string; body: string; index: number; total: number; mandatory: boolean; rect: DOMRect | null; onNext: () => void; onSkip: () => void;
}) {
  const isLast = index === total - 1;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 812;

  // Spotlight geometry (extra top room so the raised centre button clears the ring).
  const padTop = 26, pad = 8;
  const cut = rect
    ? { top: rect.top - padTop, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + padTop + pad }
    : null;

  // Coach bar floats just above the nav; pointer aims at the tab's centre.
  const barBottom = rect ? vh - rect.top + 22 : undefined;
  const pointerLeft = rect ? rect.left + rect.width / 2 : null;

  return (
    <>
      {/* full-screen blocker — eats every app tap so only Next/Skip work */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 235 }} onClick={(e) => e.stopPropagation()} />

      {/* spotlight: transparent hole with a giant shadow that dims everything else */}
      {cut ? (
        <div style={{ position: 'fixed', top: cut.top, left: cut.left, width: cut.width, height: cut.height, borderRadius: 16, boxShadow: '0 0 0 9999px rgba(20,14,40,.66)', border: '3px solid var(--sun-400, #FFC64B)', zIndex: 236, pointerEvents: 'none', transition: 'all .25s ease' }} />
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,14,40,.66)', zIndex: 236, pointerEvents: 'none' }} />
      )}

      {/* downward pointer at the tab */}
      {pointerLeft != null && (
        <div style={{ position: 'fixed', left: pointerLeft - 11, bottom: (barBottom ?? 0) - 12, width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: '13px solid #fff', filter: 'drop-shadow(0 2px 0 rgba(42,37,33,.5))', zIndex: 251, pointerEvents: 'none' }} />
      )}

      {/* coach bubble */}
      <div style={{ position: 'fixed', left: 0, right: 0, zIndex: 250, pointerEvents: 'none', bottom: barBottom ?? 'calc(var(--nav-h, 76px) + env(safe-area-inset-bottom) + 18px)', padding: '0 12px' }}>
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
              {isLast ? 'Done' : 'Next'}
            </button>
            {!mandatory && (
              <button onClick={onSkip} style={{ border: 'none', background: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, color: 'var(--ink-400)', cursor: 'pointer' }}>
                Skip tour
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
