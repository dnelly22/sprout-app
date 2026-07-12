import { useEffect, useRef } from 'react';
import { INK } from './pop';
import { Icon } from './ds';
import { Mascot } from '../screens/kidzone/Mascot';
import { burstConfetti } from '../screens/kidzone/confetti';
import { sfx } from '../audio/sfx';

/*
 * Shared celebration visuals. Every popup/animation lives here so the app AND
 * the /dev preview gallery render the exact same components (no drift). The
 * animated ones (level-up, streak) fire their own confetti + sound on mount, so
 * a consumer just renders them.
 */

/* ---- Parent card modal (streak / recap / milestone / lesson complete) ---- */
export interface Celebration { emoji: string; tint: string; title: string; body: string; cta: string; ctaBg: string }

export function CelebrationModal({ cel, onClose }: { cel: Celebration; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(42,37,33,.72)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="pop-in" style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 24, boxShadow: '6px 7px 0 rgba(42,37,33,.9)', padding: '26px 20px', width: '100%', maxWidth: 340, textAlign: 'center' }}>
        <span style={{ display: 'inline-grid', placeItems: 'center', width: 84, height: 84, borderRadius: '50%', background: cel.tint, border: `2.5px solid ${INK}`, fontSize: 40 }}>{cel.emoji}</span>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: INK, marginTop: 12, lineHeight: 1.1 }}>{cel.title}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, color: 'var(--ink-500)', marginTop: 6 }}>{cel.body}</div>
        <button onClick={onClose} style={{ marginTop: 16, width: '100%', border: `2.5px solid ${INK}`, borderRadius: 99, background: cel.ctaBg, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, padding: 12, boxShadow: '3px 4px 0 rgba(42,37,33,.85)', cursor: 'pointer' }}>{cel.cta}</button>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(42,37,33,.72)', display: 'grid', placeItems: 'center', padding: 24 };

/* ---- Kid Zone: level-up (mascot growth + confetti) ---- */
export function LevelUpCard({ level, title, stars, onClose }: { level: number; title: string; stars: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try { sfx('cheer'); } catch { /* ignore */ }
    const t = setTimeout(() => burstConfetti(ref.current, 36), 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <div onClick={onClose} style={overlay}>
      <div ref={ref} style={{ background: 'linear-gradient(155deg, var(--grape-500), var(--grape-600))', border: `2.5px solid ${INK}`, borderRadius: 24, boxShadow: '6px 7px 0 rgba(42,37,33,.9)', padding: 8, width: '100%', maxWidth: 340 }}>
        <div style={{ border: '2px dashed rgba(255,255,255,.4)', borderRadius: 17, padding: '22px 16px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, letterSpacing: '.1em', color: 'var(--sun-300)' }}>✦ LEVEL UP ✦</div>
          <div style={{ margin: '10px auto 0', width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #EAF6E2, #BFE3CB)', border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            <Mascot mood="growth" playKey={level} size={116} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: '#fff', marginTop: 12, lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--grape-100)', marginTop: 3 }}>Your Sprout grew to Level {level}!</div>
          <div style={{ marginTop: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '4px 14px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: INK }}>
              <Icon name="star" size={14} color="var(--sun-500)" fill="var(--sun-500)" />+{stars} stars
            </span>
          </div>
          <button onClick={onClose} style={{ marginTop: 16, width: '100%', border: `2.5px solid ${INK}`, borderRadius: 99, background: '#fff', color: INK, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, padding: 12, boxShadow: '3px 4px 0 rgba(42,37,33,.5)', cursor: 'pointer' }}>
            Keep growing! 🌱
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Kid Zone: streak (confetti) ---- */
export function KidStreakCard({ days, stars, onClose }: { days: number; stars: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try { sfx('cheer'); } catch { /* ignore */ }
    const t = setTimeout(() => burstConfetti(ref.current, 28), 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <div onClick={onClose} style={overlay}>
      <div ref={ref} style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 24, boxShadow: '6px 7px 0 rgba(42,37,33,.9)', padding: '26px 20px', width: '100%', maxWidth: 320, textAlign: 'center' }}>
        <span style={{ display: 'inline-grid', placeItems: 'center', width: 84, height: 84, borderRadius: '50%', background: '#FBE3D8', border: `2.5px solid ${INK}`, fontSize: 40 }}>🔥</span>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: INK, marginTop: 12, lineHeight: 1.05 }}>{days}-day streak!</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, color: 'var(--ink-500)', marginTop: 5 }}>
          Your Sprout grew today. {days >= 3 ? 'You’re on a roll! 🌱' : 'Come back tomorrow to keep it going!'}
        </div>
        <div style={{ marginTop: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--sun-100)', border: `2px solid ${INK}`, borderRadius: 99, padding: '4px 14px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: INK }}>
            <Icon name="star" size={14} color="var(--sun-500)" fill="var(--sun-500)" />+{stars} stars
          </span>
        </div>
        <button onClick={onClose} style={{ marginTop: 16, width: '100%', border: `2.5px solid ${INK}`, borderRadius: 99, background: 'var(--coral-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, padding: 12, boxShadow: '3px 4px 0 rgba(42,37,33,.85)', cursor: 'pointer' }}>
          Keep it up! 🔥
        </button>
      </div>
    </div>
  );
}

/* ---- Kid Zone: award toast (badge / quest) ---- */
export function AwardToast({ title, sub }: { title: string; sub?: string }) {
  useEffect(() => { try { sfx('celebrate'); } catch { /* ignore */ } }, []);
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)', zIndex: 300, display: 'flex', justifyContent: 'center', pointerEvents: 'none', padding: '0 20px' }}>
      <div className="fade-up" style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: '4px 5px 0 rgba(42,37,33,.85)', padding: '12px 18px', maxWidth: 340 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: INK }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-500)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}
