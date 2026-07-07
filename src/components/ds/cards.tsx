import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { Button } from './controls';

/* --------------------------- MissionCard -------------------------- */
interface MissionCardProps {
  title: string;
  detail: string;
  done: number;
  total: number;
  onAction?: () => void;
  actionLabel?: string;
}

export function MissionCard({ title, detail, done, total, onAction, actionLabel = 'Start' }: MissionCardProps) {
  const complete = done >= total;
  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-xl)', padding: 'var(--card-pad)',
        background: 'linear-gradient(135deg, var(--coral-100) 0%, #FDEEE2 55%, var(--cream-100) 100%)',
        border: '1.5px solid #F6DBCB', boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* soft decorative corner circle */}
      <span style={{ position: 'absolute', top: -46, right: -34, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative' }}>
        <div className="sprout-eyebrow" style={{ color: 'var(--accent-hover)', marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Icon name="target" size={15} color="var(--accent-hover)" /> This week’s mission
        </div>
        <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--text-strong)', marginBottom: 8, lineHeight: 1.15 }}>{title}</h3>
        <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-body)', marginBottom: 16 }}>{detail}</p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} style={{
              flex: 1, height: 8, borderRadius: 'var(--radius-pill)',
              background: i < done ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
            }} />
          ))}
        </div>

        <Button
          variant={complete ? 'soft' : 'primary'} size="md" fullWidth onClick={onAction}
          iconRight={complete ? undefined : <Icon name="arrow-right" size={18} color="#fff" />}
        >
          {complete ? 'Mission complete 🎉' : actionLabel}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------- CoachMessage -------------------------- */
interface CoachMessageProps {
  from: 'coach' | 'me';
  script?: string;
  children: ReactNode;
}

export function CoachMessage({ from, script, children }: CoachMessageProps) {
  const mine = from === 'me';
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <div style={{ maxWidth: '86%' }}>
        <div style={{
          background: mine ? 'var(--primary)' : 'var(--surface)',
          color: mine ? '#fff' : 'var(--text-body)',
          border: mine ? 'none' : '1.5px solid var(--border)',
          borderRadius: mine ? 'var(--radius-lg) var(--radius-lg) 6px var(--radius-lg)' : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 6px',
          padding: '12px 14px', fontWeight: 600, fontSize: 'var(--text-md)', lineHeight: 1.4, boxShadow: 'var(--shadow-xs)',
        }}>
          {children}
        </div>
        {script && (
          <div style={{
            marginTop: 8, background: 'var(--sky-100)', border: '1.5px solid var(--sky-300)',
            borderRadius: 'var(--radius-md)', padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Icon name="quote" size={13} color="var(--sky-600)" />
              <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 800, color: 'var(--sky-600)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Try saying</span>
            </div>
            <div style={{ fontFamily: 'var(--font-read)', fontStyle: 'italic', color: 'var(--text-strong)', fontSize: 'var(--text-md)' }}>{script}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- StarMeter --------------------------- */
export function StarMeter({ value, max = 5, size = 18 }: { value: number; max?: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3 }}>
      {Array.from({ length: max }).map((_, i) => (
        <Icon key={i} name="star" size={size} color={i < value ? 'var(--sun-500)' : 'var(--border-strong)'} />
      ))}
    </span>
  );
}
