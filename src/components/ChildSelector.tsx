import { useState } from 'react';
import { useApp } from '../store/AppStore';
import { Avatar, Icon, Sheet } from './ds';

/**
 * Header child selector — keeps "whose data is this" unambiguous (core rule #3).
 * A tappable pill when there's more than one child; a static label when there's one.
 */
export function ChildSelector() {
  const { state, activeChild, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const multi = state.children.length > 1;

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => multi && setOpen(true)}
        disabled={!multi}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 9, padding: '7px 11px 7px 7px',
          borderRadius: 'var(--radius-pill)', border: '1.5px solid var(--border)', background: 'var(--surface)',
          boxShadow: 'var(--shadow-sm)', cursor: multi ? 'pointer' : 'default',
        }}
      >
        <Avatar name={activeChild.name} color={activeChild.color} size={26} />
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--text-muted)' }}>Viewing</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-strong)', fontSize: 'var(--text-sm)' }}>{activeChild.name}</span>
        {multi && <Icon name="chevron-down" size={16} color="var(--ink-400)" />}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Whose progress?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {state.children.map((c) => {
            const active = c.id === activeChild.id;
            return (
              <button
                key={c.id}
                onClick={() => { dispatch({ type: 'setActiveChild', id: c.id }); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer', border: active ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                  background: active ? 'var(--green-50)' : 'var(--surface)',
                }}
              >
                <Avatar name={c.name} color={c.color} size={40} badge={`Lv ${c.level}`} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-strong)' }}>{c.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 700 }}>Age {c.age}</div>
                </div>
                {active && <Icon name="check" size={20} color="var(--primary)" />}
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
