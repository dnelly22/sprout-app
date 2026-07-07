import { Icon } from './Icon';

interface PinPadProps {
  value: string;
  error?: boolean;
  length?: number;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function PinPad({ value, error, length = 4, onChange, onComplete }: PinPadProps) {
  const press = (k: string) => {
    if (k === 'del') { onChange(value.slice(0, -1)); return; }
    if (k === '' || value.length >= length) return;
    const next = value + k;
    onChange(next);
    if (next.length === length) onComplete(next);
  };

  return (
    <div>
      <div className={error ? 'shake' : ''} style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 22 }}>
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <span key={i} style={{
              width: 18, height: 18, borderRadius: '50%',
              background: error ? 'var(--danger)' : filled ? 'var(--primary)' : 'transparent',
              border: filled || error ? 'none' : '2px solid var(--border-strong)',
              transition: 'background var(--dur-fast)',
            }} />
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 280, margin: '0 auto' }}>
        {KEYS.map((k, i) => (
          <button
            key={i}
            type="button"
            onClick={() => press(k)}
            disabled={k === ''}
            style={{
              height: 60, borderRadius: 'var(--radius-lg)', cursor: k === '' ? 'default' : 'pointer',
              border: 'none', background: k === '' ? 'transparent' : 'var(--surface)',
              boxShadow: k === '' ? 'none' : 'var(--shadow-sm)',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-xl)', color: 'var(--text-strong)',
              display: 'grid', placeItems: 'center',
            }}
          >
            {k === 'del' ? <Icon name="delete" size={24} color="var(--text-muted)" /> : k}
          </button>
        ))}
      </div>
    </div>
  );
}
