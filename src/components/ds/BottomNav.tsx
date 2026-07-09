import { Icon } from './Icon';

export interface NavTab {
  key: string;
  label: string;
  icon: string;
}

/* Focus Pop nav: Today · Learn · Sprout (raised AI button) · Kid Zone · Journey */
export const NAV_TABS: NavTab[] = [
  { key: 'today',    label: 'Today',    icon: 'house' },
  { key: 'lessons',  label: 'Learn',    icon: 'book-open' },
  { key: 'coach',    label: 'Sprout',   icon: 'sparkles' },
  { key: 'kid',      label: 'Kid Zone', icon: 'gamepad-2' },
  { key: 'progress', label: 'Journey',  icon: 'map' },
];

interface BottomNavProps {
  active: string;
  onChange: (key: string) => void;
}

const INK = '#2A2521';

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      aria-label="Primary"
      style={{
        // position + z-index keep the raised centre button (which pokes 24px
        // above the nav) painting above the momentum-scrolling content layer,
        // so its top never gets clipped while scrolling.
        position: 'relative', zIndex: 20,
        height: 'var(--nav-h)', flex: 'none', background: '#fff',
        borderTop: `2.5px solid ${INK}`, display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      {NAV_TABS.map((tab) => {
        const on = active === tab.key;
        const center = tab.key === 'coach';
        return (
          <button
            key={tab.key}
            type="button"
            data-tour={tab.key}
            onClick={() => onChange(tab.key)}
            aria-current={on ? 'page' : undefined}
            style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
              color: on ? 'var(--grape-600)' : 'var(--ink-400)', padding: '8px 2px',
            }}
          >
            <span
              style={center ? {
                width: 54, height: 54, marginTop: -24, borderRadius: '50%',
                background: 'linear-gradient(180deg, #FAC3ED, #2A8FD8)',
                border: `2.5px solid ${INK}`, boxShadow: '3px 4px 0 rgba(42,37,33,.85)',
                display: 'grid', placeItems: 'center', color: '#fff',
              } : { display: 'grid', placeItems: 'center' }}
            >
              <Icon name={tab.icon} size={center ? 26 : 23} color={center ? '#fff' : (on ? 'var(--grape-600)' : 'var(--ink-400)')} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xs)', fontWeight: 800 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
