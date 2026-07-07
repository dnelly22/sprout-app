import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  action?: string;
  onAction?: () => void;
}

export function SectionTitle({ children, action, onAction }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
      <h2 style={{ fontSize: 'var(--text-xl)' }}>{children}</h2>
      {action && (
        <button
          onClick={onAction}
          style={{ border: 'none', background: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: 'var(--text-sm)', cursor: 'pointer' }}
        >
          {action}
        </button>
      )}
    </div>
  );
}
