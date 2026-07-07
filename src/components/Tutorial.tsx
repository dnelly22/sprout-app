import { useState } from 'react';
import { Icon } from './ds';
import { INK, GRAPE } from './pop';
import { Mascot } from '../screens/kidzone/Mascot';

export interface TourStep { icon: string; tint: string; title: string; text: string }

/**
 * First-run tutorial: a short sequence of cards over a dimmed backdrop.
 * Used once on the parent Today screen and once inside Kid Zone.
 */
export function Tutorial({ steps, mascot, onDone }: { steps: TourStep[]; mascot?: boolean; onDone: () => void }) {
  const [i, setI] = useState(0);
  const s = steps[i];
  const last = i === steps.length - 1;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(42,37,33,.72)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="fade-up" key={i} style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 24, boxShadow: '6px 7px 0 rgba(42,37,33,.9)', padding: '24px 20px', width: '100%', maxWidth: 330, textAlign: 'center' }}>
        {mascot && i === 0 ? (
          <span style={{ display: 'inline-grid', placeItems: 'center', width: 96, height: 96, borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #EAF6E2, #BFE3CB)', border: `2.5px solid ${INK}`, overflow: 'hidden' }}>
            <Mascot mood="idle" size={84} />
          </span>
        ) : (
          <span style={{ display: 'inline-grid', placeItems: 'center', width: 64, height: 64, borderRadius: '50%', background: s.tint, border: `2.5px solid ${INK}` }}>
            <Icon name={s.icon} size={28} color={INK} />
          </span>
        )}
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, color: INK, marginTop: 12, lineHeight: 1.15 }}>{s.title}</div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-500)', lineHeight: 1.5, margin: '8px 0 0' }}>{s.text}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, margin: '14px 0 2px' }}>
          {steps.map((_, k) => (
            <span key={k} style={{ width: k === i ? 18 : 7, height: 7, borderRadius: 99, background: k === i ? GRAPE : 'var(--grape-100)', border: `1.5px solid ${INK}`, transition: 'width .2s' }} />
          ))}
        </div>
        <button
          onClick={() => (last ? onDone() : setI(i + 1))}
          style={{ marginTop: 12, width: '100%', border: `2.5px solid ${INK}`, borderRadius: 99, background: GRAPE, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, padding: 12, boxShadow: '3px 4px 0 rgba(42,37,33,.85)', cursor: 'pointer' }}
        >
          {last ? 'Let’s go!' : 'Next'}
        </button>
        {!last && (
          <button onClick={onDone} style={{ marginTop: 8, border: 'none', background: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: 'var(--ink-400)', cursor: 'pointer' }}>
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
}

export const PARENT_TOUR: TourStep[] = [
  { icon: 'house', tint: 'var(--sun-100)', title: 'Welcome to Sprouts! 🌱', text: 'Today shows what matters right now: a recommended lesson, your child’s progress, and this week’s recap.' },
  { icon: 'book-open', tint: 'var(--grape-100)', title: 'Learn', text: 'Short parent lessons with word-for-word scripts for everyday moments — teasing, big feelings, making friends.' },
  { icon: 'sparkles', tint: '#E7F2FB', title: 'Ask Sprout', text: 'The center button opens instant answers to “what do I say when…” questions. Educational, never clinical.' },
  { icon: 'gamepad-2', tint: 'var(--green-100)', title: 'Kid Zone & Journey', text: 'Hand the phone over in Kid Zone — games teach your child what to say. Watch the story unfold in Journey.' },
];

export const KID_TOUR: TourStep[] = [
  { icon: 'sprout', tint: 'var(--green-100)', title: 'Hi! I’m Sprout 🌱', text: 'Every game you play helps me grow. Ready to practice some brave words?' },
  { icon: 'star', tint: 'var(--sun-100)', title: 'Earn stars', text: 'Finish your Daily Quest, play games, and try Real World Challenges to earn stars and badges!' },
  { icon: 'trending-up', tint: 'var(--grape-100)', title: 'Watch me grow', text: 'The My Growth tab shows your level, your badge collection, and what unlocks next. Let’s go!' },
];
