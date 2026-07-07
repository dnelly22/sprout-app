import { Icon } from './ds';

/*
 * "Focus Pop" (T4) design primitives — shared by the four dashboards.
 * Lavender halftone body, 2.5px ink borders, hard grape shadows (ink on
 * heroes/CTAs), icon-chip section heads, striped progress bars.
 */

export const INK = '#2A2521';
export const GRAPE = '#7A5AD9';

export const popBg: React.CSSProperties = {
  backgroundColor: '#F6F1FF',
  backgroundImage: 'radial-gradient(rgba(122,90,217,.10) 1.5px, transparent 1.5px)',
  backgroundSize: '16px 16px',
};

export function PopCard({ children, tone = 'white', shadow = 'grape', tilt = 0, style, onClick }: {
  children: React.ReactNode;
  tone?: 'white' | 'sun' | 'green' | 'grape' | 'dark';
  shadow?: 'grape' | 'ink' | 'none';
  tilt?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const bg = {
    white: '#fff', sun: 'var(--sun-100)', green: 'var(--green-100)',
    grape: 'linear-gradient(155deg, var(--grape-500), var(--grape-600))',
    dark: 'linear-gradient(160deg, #463A66, #2A2521)',
  }[tone];
  const sh = shadow === 'none' ? 'none' : shadow === 'ink' ? '4px 5px 0 rgba(42,37,33,.85)' : '4px 5px 0 var(--grape-300)';
  return (
    <div
      onClick={onClick}
      style={{
        background: bg, border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: sh,
        transform: tilt ? `rotate(${tilt}deg)` : undefined, cursor: onClick ? 'pointer' : undefined,
        color: tone === 'grape' || tone === 'dark' ? '#fff' : INK, ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionHead({ icon, tint, children, action, onAction }: {
  icon: string; tint: string; children: React.ReactNode; action?: string; onAction?: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '0 0 10px' }}>
      <span style={{ width: 28, height: 28, borderRadius: 9, background: tint, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
        <Icon name={icon} size={14} color={INK} />
      </span>
      <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, letterSpacing: '.05em', textTransform: 'uppercase', color: INK }}>{children}</span>
      {action && (
        <button onClick={onAction} style={{ border: 'none', background: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--grape-600)', cursor: 'pointer' }}>{action}</button>
      )}
    </div>
  );
}

export function InkChip({ icon, iconColor, bg = '#fff', children }: {
  icon?: string; iconColor?: string; bg?: string; children: React.ReactNode;
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, border: `2px solid ${INK}`, borderRadius: 99, padding: '3px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, color: INK, whiteSpace: 'nowrap' }}>
      {icon && <Icon name={icon} size={12} color={iconColor ?? INK} />}
      {children}
    </span>
  );
}

/** Ink-bordered progress bar; `striped` for in-progress game/lesson bars. */
export function InkBar({ pct, color = 'var(--grape-500)', striped, height = 11 }: {
  pct: number; color?: string; striped?: boolean; height?: number;
}) {
  const fill = striped
    ? `repeating-linear-gradient(45deg, ${color}, ${color} 6px, color-mix(in srgb, ${color} 75%, white) 6px, color-mix(in srgb, ${color} 75%, white) 12px)`
    : color;
  return (
    <div style={{ flex: 1, height, border: `2px solid ${INK}`, borderRadius: 7, background: '#fff', overflow: 'hidden' }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', background: fill, transition: 'width .3s ease' }} />
    </div>
  );
}

/** Round ink-bordered arrow button (card affordance). */
export function ArrowCoin({ color = 'var(--grape-500)', size = 34 }: { color?: string; size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', background: color, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
      <Icon name="arrow-right" size={size * 0.47} color="#fff" />
    </span>
  );
}

/** Star row (filled/outline) for skill levels — never percentages. */
export function StarRow({ n, of = 5, size = 15 }: { n: number; of?: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: of }).map((_, i) => (
        i < n
          ? <Icon key={i} name="star" size={size} color="var(--sun-500)" fill="var(--sun-500)" />
          : <Icon key={i} name="star" size={size} color="var(--grape-300)" />
      ))}
    </span>
  );
}

/** Tilted sun-cream eyebrow chip (comic label). */
export function PopEyebrow({ color = 'var(--coral-600)', icon, children }: { color?: string; icon?: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', transform: 'rotate(-1.2deg)', alignItems: 'center', gap: 6, background: '#fff', border: `2px solid ${INK}`, color, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, letterSpacing: '.07em', padding: '3px 11px', borderRadius: 99, boxShadow: '2px 3px 0 rgba(42,37,33,.5)', textTransform: 'uppercase' }}>
      {icon && <Icon name={icon} size={13} color={color} />}
      {children}
    </span>
  );
}

/** Primary pill button in the pop language. */
export function PopButton({ children, color = 'var(--grape-500)', ghost, fullWidth, disabled, onClick, style }: {
  children: React.ReactNode; color?: string; ghost?: boolean; fullWidth?: boolean; disabled?: boolean; onClick?: () => void; style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: fullWidth ? '100%' : undefined, border: `2.5px solid ${INK}`, borderRadius: 99,
        background: ghost ? '#fff' : color, color: ghost ? INK : '#fff',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, padding: '11px 20px',
        boxShadow: ghost ? '3px 4px 0 var(--grape-300)' : '3px 4px 0 rgba(42,37,33,.85)',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, minHeight: 44, ...style,
      }}
    >
      {children}
    </button>
  );
}
