import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { useChildEconomy, type ChildEconomy } from '../engine/selectors';
import { Icon, Sheet, Input, Button } from '../components/ds';
import { popBg, PopCard, SectionHead, InkChip, InkBar, PopButton, INK, GRAPE } from '../components/pop';
import { areaParentLabel, emptyAreaScores, type AreaKey } from '../constants/areas';
import { lessonVisual } from '../data/lessons';
import { REWARD } from '../engine/economy';
import { usePlan } from '../engine/plan';
import { centeredOnTablet } from '../useResponsive';
import type { Child } from '../types';
import { AGE_GROUPS } from './onboarding/Onboarding';

export function Today() {
  const { state, dispatch, activeChild } = useApp();
  const navigate = useNavigate();
  const eco = useChildEconomy();
  const [hubOpen, setHubOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const recommended = useMemo(
    () => state.lessons.find((l) => l.shelf === 'talking' && l.status === 'in-progress')
      ?? state.lessons.find((l) => l.shelf === 'talking' && l.status !== 'done')
      ?? state.lessons[0],
    [state.lessons],
  );
  const latestBadge = useMemo(() => {
    const earned = state.earnedBadges[activeChild.id] ?? {};
    const entries = Object.entries(earned).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return null;
    const def = eco.badges.find((b) => b.key === entries[0][0]);
    return def ? { ...def, ts: entries[0][1] } : null;
  }, [state.earnedBadges, activeChild.id, eco.badges]);

  const plan = usePlan();

  const notifItems = useNotifications(eco);
  const continueLesson = useMemo(() => state.lessons.find((l) => l.status === 'in-progress'), [state.lessons]);
  const recentlyAdded = useMemo(() => state.lessons.slice(-6).reverse().slice(0, 5), [state.lessons]);
  const topAreas = useMemo(
    () => (Object.entries(activeChild.areaScores) as [AreaKey, number][]).sort((a, b) => b[1] - a[1]).slice(0, 2),
    [activeChild.areaScores],
  );

  return (
    <div style={{ minHeight: '100%', ...popBg, paddingBottom: 28, ...centeredOnTablet }} className="fade-up">
      {/* header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: INK, lineHeight: 1.1 }}>
            👋 {greeting}, <span style={{ color: GRAPE }}>{state.parent.name}</span>
          </div>
        </div>
        <button onClick={() => setNotifOpen(true)} aria-label="Updates" style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', background: '#fff', border: `2.5px solid ${INK}`, boxShadow: '2px 3px 0 var(--grape-300)', display: 'grid', placeItems: 'center', cursor: 'pointer', flex: 'none' }}>
          <Icon name="bell" size={19} color={INK} />
          {notifItems.length > 0 && <span style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: 'var(--coral-500)', border: `2px solid ${INK}` }} />}
        </button>
        <button onClick={() => navigate('/settings')} aria-label="Account & settings" style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--green-400)', border: `2.5px solid ${INK}`, boxShadow: '2px 3px 0 var(--grape-300)', display: 'grid', placeItems: 'center', cursor: 'pointer', flex: 'none', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>
          {(state.parent.name?.[0] || 'S').toUpperCase()}
        </button>
      </div>

      {/* family pill + streak chips */}
      <div style={{ padding: '10px 20px 0', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setHubOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 99, padding: '5px 12px 5px 6px', boxShadow: '2px 3px 0 var(--grape-300)', cursor: 'pointer' }}>
          <span style={{ width: 24, height: 24, borderRadius: '50%', background: activeChild.color, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12 }}>{activeChild.name[0]}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: INK }}>Viewing · {activeChild.name}</span>
          <Icon name="chevron-down" size={14} color={INK} />
        </button>
        <InkChip icon="flame" iconColor="var(--coral-600)" bg="#FBE3D8">{eco.streak.current} day streak</InkChip>
        <InkChip icon="book-open" iconColor="var(--grape-600)" bg="var(--grape-100)">{state.parent.lessonsCompleted} completed</InkChip>
      </div>

      {/* plan banner (trial countdown / trial ended / free preview) */}
      {plan.tier !== 'premium' && (
        <div style={{ padding: '12px 20px 0' }}>
          <PopCard tone="sun" onClick={() => navigate('/plans')} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="sparkles" size={18} color="var(--sun-600)" />
            <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: INK }}>
              {plan.tier === 'trial' ? `${plan.trialDaysLeft} day${plan.trialDaysLeft === 1 ? '' : 's'} left in your free trial`
                : plan.trialExpired ? 'Your free trial has ended'
                : 'Free preview — start your 7-day free trial'}
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--grape-600)' }}>See plans →</span>
          </PopCard>
        </div>
      )}

      {/* RWC verification prompt */}
      {eco.rwc.status === 'did' && (
        <div style={{ padding: '14px 20px 0' }}>
          <PopCard tone="green" shadow="ink" style={{ padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, color: INK }}>
              🌍 {activeChild.name} says they did today’s Real World Challenge!
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginTop: 3 }}>“{eco.rwc.text}” — confirm to add +{REWARD.realworldVerify} bonus stars.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
              <PopButton color="var(--green-500)" onClick={() => dispatch({ type: 'rwcVerify', childId: activeChild.id })} style={{ flex: 1 }}>Confirm ⭐</PopButton>
              <PopButton ghost onClick={() => dispatch({ type: 'rwcSet', childId: activeChild.id, status: 'trying' })} style={{ flex: 1 }}>Not yet</PopButton>
            </div>
          </PopCard>
        </div>
      )}

      {/* recommended for you (+ docked continue-reading bar) */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="star" tint="var(--sun-100)">Recommended for you</SectionHead>
        <PopCard tone="grape" shadow="ink" onClick={() => navigate(`/lessons/${recommended.id}`)} style={{ padding: '16px 16px', borderRadius: continueLesson ? '20px 20px 4px 4px' : 20, position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, letterSpacing: '.07em', color: 'var(--grape-100)' }}>PARENT LESSON</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, lineHeight: 1.15, marginTop: 5 }}>{recommended.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 800, color: 'var(--grape-100)' }}><Icon name="book-open" size={14} color="#fff" />3 min read</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', color: 'var(--grape-600)', border: `2px solid ${INK}`, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, padding: '8px 15px', borderRadius: 99, boxShadow: '2px 3px 0 rgba(42,37,33,.4)' }}>
              {recommended.status === 'in-progress' ? 'Continue' : 'Start reading'} <Icon name="arrow-right" size={15} color="var(--grape-600)" />
            </span>
          </div>
        </PopCard>
        {continueLesson && (
          <div onClick={() => navigate(`/lessons/${continueLesson.id}`)} style={{ background: 'var(--sun-100)', border: `2.5px solid ${INK}`, borderTop: 'none', borderRadius: '0 0 18px 18px', margin: '0 12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '3px 4px 0 var(--grape-300)', cursor: 'pointer' }}>
            <Icon name="bookmark" size={15} color={INK} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Continue: {continueLesson.title}</div>
              <div style={{ height: 6, border: `1.5px solid ${INK}`, borderRadius: 4, background: '#fff', overflow: 'hidden', marginTop: 4 }}>
                <div style={{ width: `${continueLesson.progress ?? 60}%`, height: '100%', background: 'var(--coral-500)' }} />
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, color: 'var(--coral-600)', flex: 'none' }}>{continueLesson.progress ?? 60}%</span>
            <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--grape-500)', border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}><Icon name="arrow-right" size={16} color="#fff" /></span>
          </div>
        )}
      </div>

      {/* 2-up: daily challenge + achievement */}
      <div style={{ padding: '18px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <PopCard style={{ padding: 13 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10.5, letterSpacing: '.06em', color: 'var(--coral-600)' }}>DAILY CHALLENGE</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: INK, lineHeight: 1.2, margin: '5px 0 7px', minHeight: 34 }}>{eco.quest.def.title}</div>
          <InkChip icon="star" iconColor="var(--sun-500)" bg="var(--sun-100)">+{REWARD.dailyQuestBonus}</InkChip>
          <div style={{ marginTop: 9 }}>
            {eco.quest.done
              ? <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: 'var(--green-600)' }}>✓ Done today!</span>
              : <PopButton color="var(--coral-500)" onClick={() => navigate('/kid')} style={{ padding: '7px 16px', fontSize: 13, minHeight: 36 }}>Start</PopButton>}
          </div>
        </PopCard>
        <PopCard style={{ padding: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10.5, letterSpacing: '.06em', color: 'var(--grape-600)' }}>ACHIEVEMENT</div>
            {latestBadge && Date.now() - latestBadge.ts < 172800000 && (
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, color: '#fff', background: GRAPE, border: `2px solid ${INK}`, borderRadius: 99, padding: '1px 8px' }}>NEW ✦</span>
            )}
          </div>
          {latestBadge ? (
            <>
              {latestBadge.art ? (
                <img src={latestBadge.art} alt={latestBadge.label} width={46} height={46} draggable={false} style={{ display: 'inline-block', width: 46, height: 46, objectFit: 'contain', marginTop: 8 }} />
              ) : (
                <span style={{ display: 'inline-grid', placeItems: 'center', width: 40, height: 40, borderRadius: '50%', background: latestBadge.tint, border: `2px solid ${INK}`, marginTop: 8 }}>
                  <Icon name={latestBadge.icon} size={19} color={INK} />
                </span>
              )}
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, color: INK, lineHeight: 1.15, marginTop: 6 }}>{latestBadge.label}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', marginTop: 2 }}>{activeChild.name} earned this!</div>
            </>
          ) : (
            <>
              <span style={{ display: 'inline-grid', placeItems: 'center', width: 40, height: 40, borderRadius: '50%', background: '#F1EDE6', border: '2px dashed var(--ink-400)', marginTop: 8 }}>
                <Icon name="award" size={19} color="var(--ink-400)" />
              </span>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, color: 'var(--ink-500)', lineHeight: 1.15, marginTop: 6 }}>First badge awaits</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', marginTop: 2 }}>One activity unlocks it</div>
            </>
          )}
        </PopCard>
      </div>

      {/* recently added rail */}
      <div style={{ marginTop: 18 }}>
        <div style={{ padding: '0 20px' }}><SectionHead icon="sparkles" tint="var(--sun-100)">Recently added</SectionHead></div>
        <div className="card-rail" style={{ display: 'flex', gap: 11, overflowX: 'auto', padding: '2px 20px 8px' }}>
          {recentlyAdded.map((l) => {
            const vis = lessonVisual(l);
            return (
              <div key={l.id} onClick={() => navigate(`/lessons/${l.id}`)} style={{ flex: 'none', width: 150, background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: '3px 4px 0 var(--grape-300)', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
                <span style={{ position: 'absolute', top: 8, left: 8, zIndex: 1, background: 'var(--coral-500)', color: '#fff', border: `2px solid ${INK}`, borderRadius: 99, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, padding: '1px 8px' }}>NEW</span>
                <div style={{ height: 64, background: `color-mix(in srgb, ${vis.color} 18%, white)`, borderBottom: `2px solid ${INK}`, display: 'grid', placeItems: 'center' }}>
                  <Icon name={vis.icon} size={26} color={vis.color} />
                </div>
                <div style={{ padding: '9px 11px 11px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, lineHeight: 1.22, color: INK, minHeight: 46 }}>{l.title}</div>
              </div>
            );
          })}
          <div style={{ flex: 'none', width: 8 }} />
        </div>
      </div>

      {/* child progress — skill bars */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="trending-up" tint="#E7F2FB" action="See full" onAction={() => navigate('/progress')}>{activeChild.name}’s progress</SectionHead>
        <PopCard style={{ padding: '15px 16px' }}>
          {topAreas.map(([area, score], i) => (
            <div key={area} style={{ marginBottom: i < topAreas.length - 1 ? 12 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink-700)' }}>{areaParentLabel(area)}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: INK }}>{score}%</span>
              </div>
              <InkBar pct={score} color={i === 0 ? 'var(--grape-500)' : 'var(--sky-500)'} height={11} />
            </div>
          ))}
        </PopCard>
      </div>

      {/* ask sprout callout */}
      <div style={{ padding: '18px 20px 0' }}>
        <PopCard style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(180deg, #FAC3ED, #2A8FD8)', border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
            <Icon name="sparkles" size={20} color="#fff" />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5, color: INK }}>Have a parenting question?</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-500)' }}>Tap the <b style={{ color: GRAPE }}>Sprout</b> button below to chat instantly.</div>
          </div>
          <Icon name="chevron-down" size={20} color="var(--grape-400)" />
        </PopCard>
      </div>

      <FamilyHub open={hubOpen} onClose={() => setHubOpen(false)} />
      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} items={notifItems} />
    </div>
  );
}


/* ---------- notifications (derived parent updates feed) ---------- */
export interface NotifItem { icon: string; tint: string; title: string; sub?: string; action?: { label: string; to: string } }

function useNotifications(eco: ChildEconomy): NotifItem[] {
  const { state, activeChild } = useApp();
  return useMemo(() => {
    const items: NotifItem[] = [];
    if (eco.rwc.status === 'did') {
      items.push({ icon: 'globe', tint: 'var(--green-100)', title: `${activeChild.name} says they did today’s Real World Challenge`, sub: 'Confirm on Today to add bonus stars' });
    }
    if (eco.weekly.done && !eco.weekly.claimed) {
      items.push({ icon: 'trophy', tint: 'var(--sun-100)', title: `${activeChild.name} finished this week’s Adventure!`, sub: 'Open Kid Zone → Quest to claim +150 stars' });
    }
    const recent = state.activity.filter((e) => e.childId === activeChild.id && Date.now() - e.ts < 3 * 86400000).slice(-4).reverse();
    for (const e of recent) {
      const label = e.area ? areaParentLabel(e.area) : 'communication';
      items.push({
        icon: 'sparkles', tint: 'var(--grape-100)',
        title: `${activeChild.name} practiced ${label.toLowerCase()}`,
        sub: e.kind === 'journey' ? 'Journey game completed' : e.kind === 'quickfire' ? 'Quick Fire round' : e.kind === 'sayit' ? 'Said it out loud' : e.kind === 'boss' ? 'Boss Challenge!' : 'Real world challenge',
        action: { label: 'Related lessons', to: '/lessons' },
      });
    }
    return items;
  }, [state.activity, activeChild, eco.rwc.status, eco.weekly.done, eco.weekly.claimed]);
}

function NotificationsSheet({ open, onClose, items }: { open: boolean; onClose: () => void; items: NotifItem[] }) {
  const navigate = useNavigate();
  return (
    <Sheet open={open} onClose={onClose} title="Updates">
      {items.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, padding: '18px 0' }}>
          Nothing new yet — updates appear here when your child practices.
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((n, i) => (
          <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', background: '#fff', border: `2px solid ${INK}`, borderRadius: 16, padding: '11px 13px', boxShadow: '2px 3px 0 var(--grape-300)' }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', background: n.tint, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
              <Icon name={n.icon} size={16} color={INK} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: INK, lineHeight: 1.25 }}>{n.title}</div>
              {n.sub && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-500)', marginTop: 2 }}>{n.sub}</div>}
              {n.action && (
                <button onClick={() => { onClose(); navigate(n.action!.to); }} style={{ marginTop: 5, border: 'none', background: 'none', padding: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--grape-600)', cursor: 'pointer' }}>
                  {n.action.label} →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------- Family Hub: child selector + add child ---------- */
const HUB_COLORS = ['var(--grape-400)', 'var(--coral-400)', 'var(--sky-500)', 'var(--sun-500)', 'var(--green-400)', '#EC7FA0'];

function makeHubChild(name: string, age: number, ageLabel: string, color: string): Child {
  const baseline = emptyAreaScores();
  (Object.keys(baseline) as AreaKey[]).forEach((k) => { baseline[k] = 50; });
  return {
    id: `child-${Date.now()}`, name: name.trim(), age, ageLabel, color,
    pronoun: { subj: 'they', obj: 'them', poss: 'their' },
    level: 1, levelName: 'Seed', nextLevelName: 'Tiny Sprout', stars: 0, starsToNext: 100, streak: 0,
    areaScores: baseline, growing: { area: 'speakup', note: 'Just getting started' }, weeks: [50],
    missionsDone: 0, scenariosMastered: 0, questProgress: 0, currentGoalId: '', wins: [],
    badges: [],
  };
}

export function FamilyHub({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch, activeChild } = useApp();
  const plan = usePlan();
  const navigate = useNavigate();
  const maxKids = plan.isPremium ? 3 : 1;
  const realKids = state.children.length;
  const atLimit = realKids >= maxKids;
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[1]);
  const [color, setColor] = useState(HUB_COLORS[4]);

  const add = () => {
    if (!name.trim()) return;
    const child = makeHubChild(name, ageGroup.age, ageGroup.label, color);
    dispatch({ type: 'addChild', child });
    dispatch({ type: 'setActiveChild', id: child.id });
    setAdding(false); setName('');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Family">
      {!adding ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {state.children.map((c) => {
              const on = c.id === activeChild.id;
              return (
                <button
                  key={c.id}
                  onClick={() => { dispatch({ type: 'setActiveChild', id: c.id }); onClose(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', background: on ? 'var(--grape-100)' : '#fff', border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: on ? '3px 4px 0 var(--grape-400)' : '2px 3px 0 var(--grape-300)', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ width: 40, height: 40, borderRadius: '50%', background: c.color, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, flex: 'none' }}>{c.name[0]}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, color: INK }}>{c.name}</span>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink-500)' }}>⭐ {c.stars} · {c.levelName}</span>
                  </span>
                  {on && <Icon name="check" size={18} color="var(--grape-600)" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 14 }}>
            {atLimit ? (
              <PopButton ghost fullWidth onClick={() => { onClose(); navigate('/plans'); }}>
                {plan.isPremium ? 'Premium includes up to 3 children' : '+ Add a child (Premium)'}
              </PopButton>
            ) : (
              <PopButton ghost fullWidth onClick={() => setAdding(true)}>+ Add a child</PopButton>
            )}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Child’s first name" iconLeft={<Icon name="smile" size={18} />} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              {AGE_GROUPS.map((g) => (
                <button key={g.label} onClick={() => setAgeGroup(g)} style={{ minHeight: 44, borderRadius: 99, border: `2.5px solid ${INK}`, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, background: ageGroup.label === g.label ? GRAPE : '#fff', color: ageGroup.label === g.label ? '#fff' : INK, cursor: 'pointer' }}>{g.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 9 }}>
              {HUB_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} aria-label="color" style={{ width: 36, height: 36, borderRadius: '50%', background: c, border: `3px solid ${color === c ? INK : '#fff'}`, boxShadow: 'var(--shadow-sm)', cursor: 'pointer', padding: 0 }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Button variant="soft" size="lg" onClick={() => setAdding(false)} style={{ flex: 1 }}>Back</Button>
            <Button variant="primary" size="lg" disabled={!name.trim()} onClick={add} style={{ flex: 1 }}>Add {name.trim() || 'child'}</Button>
          </div>
        </>
      )}
    </Sheet>
  );
}
