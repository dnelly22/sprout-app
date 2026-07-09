import type { CSSProperties, ReactNode } from 'react';
import { areaColor, areaParentLabel, type AreaKey } from '../../constants/areas';
import { Icon } from './Icon';

/* ------------------------------ Card ------------------------------ */
type CardTone = 'default' | 'tint' | 'coach' | 'warm' | 'plain' | 'flat' | 'sun';

interface CardProps {
  children: ReactNode;
  tone?: CardTone;
  interactive?: boolean;
  onClick?: () => void;
  padding?: string | number;
  style?: CSSProperties;
}

const CARD_TONE: Record<CardTone, CSSProperties> = {
  default: { background: 'var(--surface)', border: '1.5px solid var(--border)' },
  tint:    { background: 'var(--green-50)', border: '1.5px solid var(--green-100)' },
  coach:   { background: 'var(--sky-100)', border: '1.5px solid var(--sky-300)' },
  warm:    { background: 'var(--cream-50)', border: '1.5px solid var(--border)' },
  plain:   { background: 'var(--surface)', border: '1.5px solid var(--border)' },
  flat:    { background: 'var(--surface-sunk)', border: '1.5px solid var(--border)' },
  sun:     { background: 'var(--sun-100)', border: '1.5px solid var(--sun-300)' },
};

export function Card({ children, tone = 'default', interactive, onClick, padding, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={{
        borderRadius: 'var(--radius-lg)',
        padding: padding ?? 'var(--card-pad)',
        boxShadow: 'var(--shadow-sm)',
        cursor: interactive ? 'pointer' : undefined,
        ...CARD_TONE[tone],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ----------------------------- Badge ------------------------------ */
type BadgeTone = 'coach' | 'grape' | 'primary' | 'sun' | 'accent';

const BADGE_TONE: Record<BadgeTone, { bg: string; fg: string }> = {
  coach:   { bg: 'var(--sky-100)',   fg: 'var(--sky-600)' },
  grape:   { bg: 'var(--grape-100)', fg: 'var(--grape-600)' },
  primary: { bg: 'var(--green-100)', fg: 'var(--green-700)' },
  sun:     { bg: 'var(--sun-100)',   fg: '#7a5600' },
  accent:  { bg: 'var(--coral-100)', fg: 'var(--coral-600)' },
};

export function Badge({ children, tone = 'primary' }: { children: ReactNode; tone?: BadgeTone }) {
  const t = BADGE_TONE[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px',
      borderRadius: 'var(--radius-pill)', background: t.bg, color: t.fg,
      fontWeight: 800, fontSize: 'var(--text-xs)',
    }}>
      {children}
    </span>
  );
}

/* ----------------------------- Avatar ----------------------------- */
interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  ring?: boolean;
  badge?: string | number;
}

export function Avatar({ name, color, size = 44, ring, badge }: AvatarProps) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <span style={{ position: 'relative', display: 'inline-block', flex: 'none' }}>
      <span style={{
        width: size, height: size, borderRadius: '50%', background: color,
        display: 'grid', placeItems: 'center', color: '#fff',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size * 0.42,
        boxShadow: ring ? '0 0 0 3px var(--surface), 0 0 0 5px ' + color : 'var(--shadow-xs)',
      }}>
        {initial}
      </span>
      {badge != null && (
        <span style={{
          position: 'absolute', bottom: -4, right: -4, background: 'var(--sun-500)', color: '#5a3d00',
          fontWeight: 800, fontSize: 'var(--text-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-pill)',
          border: '2px solid var(--surface)', whiteSpace: 'nowrap',
        }}>
          {badge}
        </span>
      )}
    </span>
  );
}

/* --------------------------- ProgressBar -------------------------- */
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  label?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, max = 100, color = 'var(--primary)', height = 8, label, showLabel }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--text-strong)' }}>{label}</span>
          <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color }}>{pct}%</span>
        </div>
      )}
      <div style={{ height, borderRadius: 'var(--radius-pill)', background: 'rgba(42,37,33,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 'var(--radius-pill)', transition: 'width var(--dur-slow) var(--ease-out)' }} />
      </div>
    </div>
  );
}

/* ---------------------------- StatTile ---------------------------- */
type StatTone = 'sun' | 'accent' | 'primary' | 'grape' | 'coach';

const STAT_TONE: Record<StatTone, { bg: string; fg: string }> = {
  sun:     { bg: 'var(--sun-100)',   fg: '#7a5600' },
  accent:  { bg: 'var(--coral-100)', fg: 'var(--coral-600)' },
  primary: { bg: 'var(--green-100)', fg: 'var(--green-700)' },
  grape:   { bg: 'var(--grape-100)', fg: 'var(--grape-600)' },
  coach:   { bg: 'var(--sky-100)',   fg: 'var(--sky-600)' },
};

export function StatTile({ icon, tone, value, caption }: { icon: string; tone: StatTone; value: string; caption: string }) {
  const t = STAT_TONE[tone];
  return (
    <div style={{
      background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)',
      padding: 14, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <span style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: t.bg, display: 'grid', placeItems: 'center' }}>
        <Icon name={icon} size={20} color={t.fg} />
      </span>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-xl)', color: 'var(--text-strong)', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 700 }}>{caption}</div>
      </div>
    </div>
  );
}

/* ----------------------------- AreaTag ---------------------------- */
export function AreaTag({ area }: { area: AreaKey }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--text-muted)' }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: areaColor(area) }} />
      {areaParentLabel(area)}
    </span>
  );
}

/* ------------------------------ Sheet ----------------------------- */
interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 120, background: 'var(--scrim)',
        display: 'flex', alignItems: 'flex-end', animation: 'fadeUp var(--dur-base) var(--ease-out)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', background: 'var(--surface)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          padding: '10px 20px 24px', boxShadow: 'var(--shadow-pop)', maxHeight: '82%', overflowY: 'auto',
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border-strong)', margin: '0 auto 14px' }} />
        {title && <h2 style={{ fontSize: 'var(--text-xl)', textAlign: 'center', marginBottom: 16 }}>{title}</h2>}
        {children}
      </div>
    </div>
  );
}
