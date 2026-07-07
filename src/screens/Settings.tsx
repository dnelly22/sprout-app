import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { Card, Icon, IconButton, Switch } from '../components/ds';
import { usePlan } from '../engine/plan';

const CHECKIN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function Settings() {
  const { state, dispatch, activeChild } = useApp();
  const navigate = useNavigate();
  const plan = usePlan();
  const kids = state.children.map((c) => c.name).join(', ');

  const groups: { title: string; rows: Row[] }[] = [
    {
      title: 'Account',
      rows: [
        { icon: 'user', label: 'Manage subscription', meta: plan.renewalText, onTap: () => navigate('/plans') },
        { icon: 'rotate-ccw', label: 'Restore purchases', meta: 'Have a code? Redeem it here', onTap: () => navigate('/plans') },
        { icon: 'users', label: 'Child profiles', meta: `${kids} (${state.children.length}/${plan.isPremium ? 3 : 1})` },
      ],
    },
    {
      title: 'Safety & privacy',
      rows: [
        { icon: 'shield-check', label: 'Privacy & parental consent', meta: 'View, export, or delete data' },
        { icon: 'lock', label: 'Parental controls & Kid Zone PIN', meta: `PIN set · ${state.settings.pin}` },
        { icon: 'calendar-check', label: 'Weekly check-in day', meta: CHECKIN_DAYS[state.settings.checkinDay] },
      ],
    },
    {
      title: 'App',
      rows: [
        { icon: 'bell', label: 'Notifications', toggle: 'notifications' },
        { icon: 'music', label: 'Background music', meta: 'Plays in the app & games', toggle: 'music' },
        { icon: 'volume-2', label: 'Sound effects', meta: 'Taps, rewards & game sounds', toggle: 'sfx' },
        { icon: 'circle-help', label: 'Help & support' },
        { icon: 'info', label: 'About Sprout', meta: 'v0.1 · local demo' },
      ],
    },
  ];

  if (plan.admin) {
    groups.push({
      title: 'Admin tools 🛠',
      rows: [
        { icon: 'star', label: 'Grant +500 stars', meta: `to ${activeChild.name}`, onTap: () => dispatch({ type: 'awardStars', childId: activeChild.id, stars: 500 }) },
        { icon: 'play', label: 'Replay tutorials', meta: 'Show first-run tours again', onTap: () => dispatch({ type: 'updateSettings', patch: { tourParentDone: false, tourKidDone: false } }) },
        { icon: 'user', label: 'Switch to free plan', meta: 'Preview the locked experience', onTap: () => dispatch({ type: 'updateSettings', patch: { plan: 'free', trialStart: undefined } }) },
        { icon: 'zap', label: 'Back to premium', meta: 'Restore full access', onTap: () => dispatch({ type: 'updateSettings', patch: { plan: 'premium' } }) },
        { icon: 'trash-2', label: 'Reset app data', meta: 'Clears everything & reloads', onTap: () => { window.localStorage.removeItem('sprout_state_v1'); window.location.assign('/'); } },
      ],
    });
  }

  const replay = () => {
    dispatch({ type: 'replayOnboarding' });
    navigate('/onboarding', { replace: true });
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 12px' }}>
        <IconButton variant="soft" label="Back" onClick={() => navigate(-1)}><Icon name="arrow-left" size={22} /></IconButton>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Settings</h1>
      </div>

      <div style={{ padding: '8px 20px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {groups.map((g) => (
          <div key={g.title}>
            <div className="sprout-eyebrow" style={{ marginBottom: 8, paddingLeft: 4 }}>{g.title}</div>
            <Card padding="6px 14px">
              {g.rows.map((r, i) => (
                <div key={r.label} onClick={r.onTap} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderTop: i ? '1.5px solid var(--border)' : 'none', cursor: r.onTap ? 'pointer' : undefined }}>
                  <Icon name={r.icon} size={22} color="var(--ink-500)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{r.label}</div>
                    {r.meta && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>{r.meta}</div>}
                  </div>
                  {r.toggle
                    ? <Switch
                        checked={r.toggle === 'notifications' ? state.settings.notifications : (state.settings[r.toggle] ?? true)}
                        onChange={(v) => dispatch({ type: 'updateSettings', patch: { [r.toggle as string]: v } })}
                      />
                    : <Icon name="chevron-right" size={20} color="var(--ink-300)" />}
                </div>
              ))}
            </Card>
          </div>
        ))}

        <button
          onClick={replay}
          style={{ border: '1.5px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text-body)', fontWeight: 800, borderRadius: 'var(--radius-pill)', padding: 12, cursor: 'pointer', marginTop: 4 }}
        >
          Replay onboarding (demo)
        </button>
        <button style={{ border: 'none', background: 'none', color: 'var(--danger)', fontWeight: 800, padding: '8px 0', cursor: 'pointer' }}>Sign out</button>
      </div>
    </div>
  );
}

interface Row {
  icon: string;
  label: string;
  meta?: string;
  toggle?: 'notifications' | 'music' | 'sfx';
  onTap?: () => void;
}
