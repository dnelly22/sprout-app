import type { KidMood } from '../../types';

/**
 * The kid character — a simple, friendly face that emotes.
 * Placeholder for a proper illustrated mascot; KEEP the emote states when swapping.
 * moods: happy, cheer, think, gentle, oops, talk
 */
export function KidFace({ color = 'var(--grape-400)', mood = 'happy', size = 104 }: {
  color?: string; mood?: KidMood; size?: number;
}) {
  const eyeY = mood === 'think' ? 40 : 43;
  const blush = mood === 'cheer' || mood === 'happy';
  const lookUp = mood === 'think';

  return (
    <svg width={size} height={size} viewBox="0 0 104 104" style={{ display: 'block' }} role="img" aria-label={`Character feeling ${mood}`}>
      <circle cx="52" cy="52" r="48" fill={color} />
      <circle cx="52" cy="52" r="48" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="3" />
      {blush && (
        <g fill="rgba(255,255,255,0.35)">
          <circle cx="28" cy="58" r="7" />
          <circle cx="76" cy="58" r="7" />
        </g>
      )}

      {/* eyes */}
      {mood === 'cheer' ? (
        <g stroke="#3a2a14" strokeWidth="3.5" strokeLinecap="round" fill="none">
          <path d="M30 44 Q37 37 44 44" />
          <path d="M60 44 Q67 37 74 44" />
        </g>
      ) : mood === 'oops' ? (
        <g fill="#3a2a14">
          <ellipse cx="37" cy={eyeY} rx="4" ry="5" />
          <ellipse cx="67" cy={eyeY} rx="4" ry="5" />
        </g>
      ) : (
        <g fill="#3a2a14">
          <circle cx={lookUp ? 38 : 37} cy={eyeY} r="4.5" />
          <circle cx={lookUp ? 68 : 67} cy={eyeY} r="4.5" />
        </g>
      )}

      {/* mouth */}
      {mood === 'cheer' && <path d="M38 60 Q52 78 66 60 Q52 66 38 60 Z" fill="#3a2a14" />}
      {mood === 'happy' && <path d="M40 60 Q52 72 64 60" stroke="#3a2a14" strokeWidth="3.5" fill="none" strokeLinecap="round" />}
      {mood === 'gentle' && <path d="M42 62 Q52 69 62 62" stroke="#3a2a14" strokeWidth="3.5" fill="none" strokeLinecap="round" />}
      {mood === 'think' && <path d="M44 64 L60 62" stroke="#3a2a14" strokeWidth="3.5" fill="none" strokeLinecap="round" />}
      {mood === 'oops' && <ellipse cx="52" cy="64" rx="7" ry="8" fill="#3a2a14" />}
      {mood === 'talk' && <ellipse cx="52" cy="63" rx="9" ry="6" fill="#3a2a14" />}
    </svg>
  );
}

export function StarPop({ amount }: { amount: number }) {
  return (
    <span
      className="star-pop"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--sun-100)', color: '#7a5600',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-xl)',
        padding: '8px 18px', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-sm)',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--sun-500)" stroke="var(--sun-600)" strokeWidth="1">
        <polygon points="12 2 15 9 22 9.3 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9.3 9 9" />
      </svg>
      +{amount}
    </span>
  );
}
