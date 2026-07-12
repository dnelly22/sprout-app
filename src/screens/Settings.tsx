import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { usePlan } from '../engine/plan';
import { openUrl } from '../native';
import { Icon, Switch, Sheet } from '../components/ds';
import { INK, popBg, PopCard, SectionHead, PopButton } from '../components/pop';
import { centeredOnTablet } from '../useResponsive';
import type { Child } from '../types';

const CHECKIN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const AGE_GROUPS = [
  { label: '4–6', age: 5 },
  { label: '7–9', age: 8 },
  { label: '10–12', age: 11 },
  { label: '13+', age: 14 },
];
const KID_COLORS = ['var(--grape-400)', 'var(--coral-400)', 'var(--sky-500)', 'var(--sun-500)', 'var(--green-400)', '#EC7FA0'];

function makeChild(name: string, group: { label: string; age: number }, color: string): Child {
  return {
    id: `child-${Date.now()}`,
    name: name.trim(),
    age: group.age,
    ageLabel: group.label,
    color,
    pronoun: { subj: 'they', obj: 'them', poss: 'their' },
    level: 1, levelName: 'Seed', nextLevelName: 'Tiny Sprout',
    stars: 0, starsToNext: 100, streak: 0,
    areaScores: { speakup: 50, listen: 50, feelings: 50, conflict: 50, connect: 50 },
    growing: { area: 'speakup', note: 'Just getting started' },
    weeks: [50], missionsDone: 0, scenariosMastered: 0, questProgress: 0,
    currentGoalId: '', wins: [], badges: [],
  };
}

type SheetName = null | 'sub' | 'pin' | 'checkin' | 'privacy' | 'addChild';

export function Settings() {
  const { state, dispatch, activeChild } = useApp();
  const navigate = useNavigate();
  const plan = usePlan();
  const [sheet, setSheet] = useState<SheetName>(null);
  const maxChildren = plan.isPremium ? 3 : 1;

  return (
    <div style={{ minHeight: '100dvh', position: 'relative', ...popBg, ...centeredOnTablet }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 20px 10px' }}>
        <button onClick={() => navigate(-1)} aria-label="Back" style={{ width: 44, height: 44, borderRadius: 14, border: `2.5px solid ${INK}`, background: '#fff', display: 'grid', placeItems: 'center', flex: 'none', cursor: 'pointer', boxShadow: '2px 2px 0 rgba(42,37,33,.55)' }}>
          <Icon name="arrow-left" size={22} color={INK} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: INK, margin: 0 }}>Settings</h1>
      </div>

      <div style={{ padding: '10px 20px calc(40px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* plan hero */}
        <PopCard tone="grape" shadow="ink" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,.18)', border: '2px solid #fff', display: 'grid', placeItems: 'center', flex: 'none' }}>
              <Icon name={plan.isPremium ? 'sparkles' : 'leaf'} size={24} color="#fff" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff' }}>
                {plan.tier === 'premium' ? 'Sprouts Premium' : plan.tier === 'trial' ? 'Free trial' : 'Free preview'}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>{plan.renewalText}</div>
            </div>
          </div>
          <button onClick={() => setSheet('sub')} style={{ marginTop: 13, width: '100%', border: '2.5px solid #fff', borderRadius: 99, background: '#fff', color: 'var(--grape-600)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, padding: '10px', cursor: 'pointer' }}>
            Manage subscription
          </button>
        </PopCard>

        {/* family */}
        <div>
          <SectionHead icon="users" tint="var(--grape-100)">Child profiles</SectionHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {state.children.map((c) => {
              const isActive = c.id === activeChild.id;
              return (
                <PopCard key={c.id} shadow="grape" style={{ padding: '12px 13px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => dispatch({ type: 'setActiveChild', id: c.id })} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ width: 44, height: 44, borderRadius: '50%', background: c.color, border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: '#fff' }}>
                      {(c.name[0] || '?').toUpperCase()}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: INK }}>{c.name}</span>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-500)' }}>Ages {c.ageLabel || c.age} · Level {c.level}</span>
                    </span>
                  </button>
                  {isActive ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--green-100)', border: `2px solid ${INK}`, borderRadius: 99, padding: '3px 9px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, color: 'var(--green-700)' }}>
                      <Icon name="check" size={12} color="var(--green-700)" />Active
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, color: 'var(--grape-600)' }}>Tap to switch</span>
                  )}
                  {state.children.length > 1 && (
                    <button onClick={() => { if (confirm(`Remove ${c.name}'s profile? This can't be undone.`)) dispatch({ type: 'deleteChild', id: c.id }); }} aria-label={`Delete ${c.name}`} style={{ width: 34, height: 34, borderRadius: 10, border: `2px solid ${INK}`, background: '#fff', display: 'grid', placeItems: 'center', flex: 'none', cursor: 'pointer' }}>
                      <Icon name="trash-2" size={16} color="var(--coral-600)" />
                    </button>
                  )}
                </PopCard>
              );
            })}
            {state.children.length < maxChildren ? (
              <PopButton ghost fullWidth onClick={() => setSheet('addChild')}>+ Add a child</PopButton>
            ) : !plan.isPremium ? (
              <PopButton ghost fullWidth onClick={() => navigate('/plans')}>+ Add a child · Premium adds up to 3</PopButton>
            ) : (
              <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-400)', padding: '2px' }}>You've added the maximum of 3 children.</div>
            )}
          </div>
        </div>

        {/* safety & privacy */}
        <div>
          <SectionHead icon="shield-check" tint="var(--sun-100)">Safety &amp; privacy</SectionHead>
          <Group>
            <SettingRow first icon="lock" tint="var(--coral-100)" label="Kid Zone PIN" meta="Locks the parent side away from kids" right={<Icon name="chevron-right" size={20} color="var(--ink-300)" />} onTap={() => setSheet('pin')} />
            <SettingRow icon="calendar-check" tint="var(--sky-100)" label="Weekly check-in day" meta={CHECKIN_DAYS[state.settings.checkinDay]} right={<Icon name="chevron-right" size={20} color="var(--ink-300)" />} onTap={() => setSheet('checkin')} />
            <SettingRow icon="file-lock" tint="var(--green-100)" label="Privacy &amp; your data" meta="Export or delete everything" right={<Icon name="chevron-right" size={20} color="var(--ink-300)" />} onTap={() => setSheet('privacy')} />
          </Group>
        </div>

        {/* app */}
        <div>
          <SectionHead icon="sliders-horizontal" tint="var(--grape-100)">App</SectionHead>
          <Group>
            <SettingRow first icon="bell" tint="var(--sun-100)" label="Notifications" right={<Switch checked={state.settings.notifications} onChange={(v) => dispatch({ type: 'updateSettings', patch: { notifications: v } })} />} />
            <SettingRow icon="music" tint="var(--grape-100)" label="Background music" right={<Switch checked={state.settings.music ?? true} onChange={(v) => dispatch({ type: 'updateSettings', patch: { music: v } })} />} />
            <SettingRow icon="volume-2" tint="var(--sky-100)" label="Sound effects" right={<Switch checked={state.settings.sfx ?? true} onChange={(v) => dispatch({ type: 'updateSettings', patch: { sfx: v } })} />} />
            <SettingRow icon="circle-help" tint="var(--green-100)" label="Help &amp; support" meta="support@alenlor.com" right={<Icon name="chevron-right" size={20} color="var(--ink-300)" />} onTap={() => { window.location.href = 'mailto:support@alenlor.com'; }} />
            <SettingRow icon="file-text" tint="var(--grape-100)" label="Terms of Use" right={<Icon name="chevron-right" size={20} color="var(--ink-300)" />} onTap={() => { void openUrl('/terms.html'); }} />
            <SettingRow icon="shield" tint="var(--sky-100)" label="Privacy Policy" right={<Icon name="chevron-right" size={20} color="var(--ink-300)" />} onTap={() => { void openUrl('/privacy.html'); }} />
            <SettingRow icon="trash-2" tint="var(--coral-100)" label="Delete all my data" meta="Clears everything on this device" onTap={() => { if (confirm('Delete all Sprout data on this device? This can’t be undone.')) { window.localStorage.removeItem('sprout_state_v1'); window.location.assign('/'); } }} />
            <SettingRow icon="info" tint="var(--coral-100)" label="About Sprout" meta="Alenlor, LLC · v1.0.0" />
          </Group>
        </div>

        {plan.admin && (
          <div>
            <SectionHead icon="wrench" tint="var(--sun-100)">Admin tools</SectionHead>
            <Group>
              <SettingRow first icon="star" tint="var(--sun-100)" label="Grant +500 stars" meta={`to ${activeChild.name}`} onTap={() => dispatch({ type: 'awardStars', childId: activeChild.id, stars: 500 })} />
              <SettingRow icon="play" tint="var(--grape-100)" label="Replay the tour" meta="Show the guided tour again" onTap={() => { dispatch({ type: 'updateSettings', patch: { tourDone: false } }); navigate('/today'); }} />
              <SettingRow icon="user" tint="var(--sky-100)" label="Switch to free plan" meta="Preview the locked experience" onTap={() => dispatch({ type: 'updateSettings', patch: { plan: 'free', trialStart: undefined } })} />
              <SettingRow icon="zap" tint="var(--green-100)" label="Back to premium" meta="Restore full access" onTap={() => dispatch({ type: 'updateSettings', patch: { plan: 'premium' } })} />
              <SettingRow icon="trash-2" tint="var(--coral-100)" label="Reset app data" meta="Clears everything &amp; reloads" onTap={() => { if (confirm('Reset all app data?')) { window.localStorage.removeItem('sprout_state_v1'); window.location.assign('/'); } }} />
            </Group>
          </div>
        )}

        <button onClick={() => { dispatch({ type: 'replayOnboarding' }); navigate('/onboarding', { replace: true }); }} style={{ border: `2.5px solid ${INK}`, background: '#fff', color: INK, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, borderRadius: 99, padding: 12, cursor: 'pointer', boxShadow: '3px 4px 0 var(--grape-300)' }}>
          Replay onboarding
        </button>
        <button onClick={() => { dispatch({ type: 'updateSettings', patch: { tourDone: false } }); navigate('/today'); }} style={{ border: `2.5px solid ${INK}`, background: '#fff', color: INK, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, borderRadius: 99, padding: 12, cursor: 'pointer', boxShadow: '3px 4px 0 var(--grape-300)' }}>
          Replay tutorial
        </button>
      </div>

      {/* ---------------- sheets ---------------- */}
      <ManageSubSheet open={sheet === 'sub'} onClose={() => setSheet(null)} plan={plan} onPlans={() => { setSheet(null); navigate('/plans'); }} />
      <PinSheet open={sheet === 'pin'} onClose={() => setSheet(null)} current={state.settings.pin} onSave={(pin) => { dispatch({ type: 'updateSettings', patch: { pin } }); setSheet(null); }} />
      <CheckinSheet open={sheet === 'checkin'} onClose={() => setSheet(null)} day={state.settings.checkinDay} onPick={(d) => { dispatch({ type: 'updateSettings', patch: { checkinDay: d } }); setSheet(null); }} />
      <PrivacySheet open={sheet === 'privacy'} onClose={() => setSheet(null)} email={state.parent.email} />
      <AddChildSheet open={sheet === 'addChild'} onClose={() => setSheet(null)} onAdd={(name, group, color) => { dispatch({ type: 'addChild', child: makeChild(name, group, color) }); setSheet(null); }} />
    </div>
  );
}

/* ------------------------------ rows ------------------------------ */
function Group({ children }: { children: React.ReactNode }) {
  return <PopCard shadow="grape" style={{ padding: 0, overflow: 'hidden' }}>{children}</PopCard>;
}

function SettingRow({ icon, tint, label, meta, right, onTap, first }: {
  icon: string; tint: string; label: string; meta?: string; right?: React.ReactNode; onTap?: () => void; first?: boolean;
}) {
  return (
    <div onClick={onTap} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderTop: first ? 'none' : '2px solid var(--grape-100)', cursor: onTap ? 'pointer' : undefined }}>
      <span style={{ width: 38, height: 38, borderRadius: 11, background: tint, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
        <Icon name={icon} size={19} color={INK} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: INK }}>{label}</div>
        {meta && <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-500)', marginTop: 1 }}>{meta}</div>}
      </div>
      {right ?? null}
    </div>
  );
}

/* ------------------------------ sheets ------------------------------ */
function ManageSubSheet({ open, onClose, plan, onPlans }: { open: boolean; onClose: () => void; plan: ReturnType<typeof usePlan>; onPlans: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Your subscription">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <PopCard tone={plan.isPremium ? 'green' : 'sun'} shadow="grape" style={{ padding: 14 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: INK }}>
            {plan.tier === 'premium' ? 'Sprouts Premium' : plan.tier === 'trial' ? 'Free trial' : 'Free preview'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-600)', marginTop: 2 }}>{plan.renewalText}</div>
          {plan.tier === 'trial' && <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-500)', marginTop: 4 }}>{plan.trialDaysLeft} day{plan.trialDaysLeft === 1 ? '' : 's'} left</div>}
        </PopCard>
        <PopButton fullWidth onClick={onPlans}>{plan.isPremium ? 'Change plan' : 'See plans & upgrade'}</PopButton>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-400)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          {plan.isPremium
            ? 'Manage or cancel your subscription anytime in your App Store or Google Play account.'
            : 'Your 7-day free trial is included — cancel anytime before it ends and you won’t be charged.'}
        </p>
      </div>
    </Sheet>
  );
}

function PinSheet({ open, onClose, current, onSave }: { open: boolean; onClose: () => void; current: string; onSave: (pin: string) => void }) {
  const [pin, setPin] = useState('');
  const valid = /^\d{4}$/.test(pin);
  return (
    <Sheet open={open} onClose={onClose} title="Kid Zone PIN">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-600)', margin: 0, lineHeight: 1.5 }}>
          This 4-digit PIN unlocks the parent side from Kid Zone. Your current PIN is <b style={{ color: INK }}>{'•'.repeat(current.length)}</b>. Enter a new one to change it.
        </p>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          inputMode="numeric" placeholder="New 4-digit PIN" autoFocus
          style={{ letterSpacing: '.5em', textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, border: `2.5px solid ${INK}`, borderRadius: 16, padding: '12px', outline: 'none', background: '#fff', color: INK }}
        />
        <PopButton fullWidth disabled={!valid} onClick={() => valid && onSave(pin)}>Save PIN</PopButton>
      </div>
    </Sheet>
  );
}

function CheckinSheet({ open, onClose, day, onPick }: { open: boolean; onClose: () => void; day: number; onPick: (d: number) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Weekly check-in day">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-600)', margin: 0, lineHeight: 1.5 }}>Pick the day Sprout nudges you to reflect on the week.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {DAY_SHORT.map((d, i) => (
            <button key={d} onClick={() => onPick(i)} style={{ flex: '1 0 28%', minWidth: 72, border: `2.5px solid ${INK}`, borderRadius: 14, background: i === day ? 'var(--grape-500)' : '#fff', color: i === day ? '#fff' : INK, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, padding: '11px 4px', cursor: 'pointer', boxShadow: i === day ? '2px 3px 0 rgba(42,37,33,.7)' : 'none' }}>
              {d}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

function PrivacySheet({ open, onClose, email }: { open: boolean; onClose: () => void; email: string }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const exportData = () => {
    const data = window.localStorage.getItem('sprout_state_v1') || '{}';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sprout-data.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const del = () => { window.localStorage.removeItem('sprout_state_v1'); window.location.assign('/'); };
  return (
    <Sheet open={open} onClose={onClose} title="Privacy & your data">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-600)', margin: 0, lineHeight: 1.5 }}>
          Everything in Sprout is stored privately on this device{email ? ` under ${email}` : ''}. We never sell your data or your child’s data, and there are no third-party trackers in the Kid Zone.
        </p>
        <PopButton ghost fullWidth onClick={exportData}>Export my data (.json)</PopButton>
        {confirmDel ? (
          <PopButton fullWidth color="var(--coral-500)" onClick={del}>Yes, delete everything</PopButton>
        ) : (
          <button onClick={() => setConfirmDel(true)} style={{ border: 'none', background: 'none', color: 'var(--coral-600)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, padding: '6px', cursor: 'pointer' }}>
            Delete all my data
          </button>
        )}
      </div>
    </Sheet>
  );
}

function AddChildSheet({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (name: string, group: { label: string; age: number }, color: string) => void }) {
  const [name, setName] = useState('');
  const [gi, setGi] = useState(1);
  const [color, setColor] = useState(KID_COLORS[0]);
  const valid = name.trim().length > 0;
  return (
    <Sheet open={open} onClose={onClose} title="Add a child">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input
          value={name} onChange={(e) => setName(e.target.value)} placeholder="Child’s name" autoFocus maxLength={24}
          style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, border: `2.5px solid ${INK}`, borderRadius: 14, padding: '12px 14px', outline: 'none', background: '#fff', color: INK }}
        />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: 'var(--ink-500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Age group</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {AGE_GROUPS.map((g, i) => (
              <button key={g.label} onClick={() => setGi(i)} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 13, background: i === gi ? 'var(--grape-500)' : '#fff', color: i === gi ? '#fff' : INK, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, padding: '10px 2px', cursor: 'pointer', boxShadow: i === gi ? '2px 3px 0 rgba(42,37,33,.7)' : 'none' }}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: 'var(--ink-500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Colour</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {KID_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} aria-label="colour" style={{ width: 40, height: 40, borderRadius: '50%', background: c, border: `2.5px solid ${INK}`, cursor: 'pointer', boxShadow: c === color ? `0 0 0 3px var(--sun-300)` : 'none' }} />
            ))}
          </div>
        </div>
        <PopButton fullWidth disabled={!valid} onClick={() => valid && onAdd(name, AGE_GROUPS[gi], color)}>Add {name.trim() || 'child'}</PopButton>
      </div>
    </Sheet>
  );
}
