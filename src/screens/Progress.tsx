import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { useChildEconomy } from '../engine/selectors';
import { dayKey } from '../engine/economy';
import { Icon, Sheet } from '../components/ds';
import { popBg, PopCard, SectionHead, InkBar, InkChip, PopButton, INK, GRAPE } from '../components/pop';
import { centeredOnTablet } from '../useResponsive';
import { QUIZ, PARENT_POWERS } from '../data/quiz';
import { areaParentLabel } from '../constants/areas';

/**
 * Learning Journey (J3) — "Look how far we've come."
 * Story of learning, not analytics: no percentages, no confidence charts.
 */
export function Progress() {
  const { activeChild } = useApp();
  const navigate = useNavigate();
  const [view, setView] = useState<'child' | 'parent'>('child');

  return (
    <div style={{ minHeight: '100%', ...popBg, paddingBottom: 28, ...centeredOnTablet }} className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 12px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: INK, margin: 0 }}>
          Learning <span style={{ color: GRAPE }}>Journey</span>
        </h1>
        <button onClick={() => navigate('/settings')} aria-label="Settings" style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', border: `2.5px solid ${INK}`, boxShadow: '2px 3px 0 var(--grape-300)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
          <Icon name="settings" size={19} color={INK} />
        </button>
      </div>

      <div style={{ padding: '0 20px 4px' }}>
        <div style={{ display: 'flex', border: `2.5px solid ${INK}`, borderRadius: 99, background: '#fff', padding: 3, boxShadow: '3px 4px 0 var(--grape-300)' }}>
          {([['child', `${activeChild.name}’s learning`], ['parent', 'Parent learning']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setView(k)} style={{ flex: 1, height: 36, border: 'none', borderRadius: 99, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, background: view === k ? 'var(--grape-500)' : 'transparent', color: view === k ? '#fff' : 'var(--ink-500)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'child' ? <ChildJourney /> : <ParentJourney />}
    </div>
  );
}

/* ================= child tab ================= */
function ChildJourney() {
  const { state, dispatch, activeChild } = useApp();
  const navigate = useNavigate();
  const eco = useChildEconomy();
  const cur = eco.journeys.find((j) => j.area === eco.currentJourney) ?? eco.journeys[0];

  const recent = useMemo(() => {
    const mine = state.activity.filter((e) => e.childId === activeChild.id).slice(-8).reverse();
    const today = dayKey(Date.now());
    const yesterday = dayKey(Date.now() - 86400000);
    return mine.map((e) => ({
      ...e,
      when: dayKey(e.ts) === today ? 'Today' : dayKey(e.ts) === yesterday ? 'Yesterday' : 'Earlier',
      label: e.kind === 'journey' ? 'Journey game' : e.kind === 'quickfire' ? 'Quick Fire round' : e.kind === 'sayit' ? 'Say It Out Loud' : e.kind === 'boss' ? 'Boss Challenge' : 'Real World Challenge',
    }));
  }, [state.activity, activeChild.id]);

  const wins = [
    { icon: 'trophy', tint: 'var(--sun-100)', title: eco.boss.done ? 'Boss beaten!' : `${eco.stats.journeys} games played`, sub: eco.boss.done ? 'The Big Playground Test' : 'Journey adventures' },
    { icon: 'award', tint: 'var(--grape-100)', title: `${eco.badgesEarned} badges`, sub: 'Collected so far' },
    { icon: 'flame', tint: '#FBE3D8', title: `${eco.streak.longest}-day streak`, sub: 'Personal best' },
    { icon: 'zap', tint: '#E7F2FB', title: `${eco.stats.quickfires} Quick Fires`, sub: 'Fast thinking!' },
  ];

  return (
    <>
      {/* current journey hero */}
      <div style={{ padding: '16px 20px 0' }}>
        <PopCard tone="grape" shadow="ink" style={{ padding: '16px 16px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: `2px solid ${INK}`, color: 'var(--grape-600)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, letterSpacing: '.07em', padding: '3px 11px', borderRadius: 99, transform: 'rotate(-1.2deg)' }}>
            <Icon name="map" size={13} color="var(--grape-600)" />CURRENT JOURNEY
          </span>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginTop: 10 }}>{cur.kidWorld}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.8)', marginTop: 2 }}>
            Level {cur.level} · {cur.completedScenarios.length} of {cur.totalScenarios} stories completed
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 11 }}>
            <div style={{ flex: 1, height: 11, border: `2px solid ${INK}`, borderRadius: 7, background: 'rgba(255,255,255,.25)', overflow: 'hidden' }}>
              <div style={{ width: `${(cur.level / 5) * 100}%`, height: '100%', background: '#fff' }} />
            </div>
          </div>
          <button onClick={() => navigate('/kid')} style={{ marginTop: 12, border: `2.5px solid ${INK}`, borderRadius: 99, background: '#fff', color: INK, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, padding: '9px 20px', boxShadow: '2px 3px 0 rgba(42,37,33,.5)', cursor: 'pointer' }}>
            Continue in Kid Zone
          </button>
        </PopCard>
      </div>

      {/* communication journeys */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="map" tint="var(--grape-100)">Communication journeys</SectionHead>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {eco.journeys.map((j) => (
            <PopCard key={j.area} style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: j.color, border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
                  <Icon name={j.icon} size={19} color="#fff" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: INK }}>{j.kidWorld}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)' }}>{j.completedScenarios.length} / {j.totalScenarios} stories</div>
                </div>
                <InkChip bg="var(--grape-100)">Lv {j.level}</InkChip>
                {eco.parentRecommended === j.area ? (
                  <button onClick={() => dispatch({ type: 'recommendArea', childId: activeChild.id, area: null })} style={{ border: `2px solid ${INK}`, borderRadius: 99, background: 'var(--sun-500)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10.5, padding: '4px 10px', cursor: 'pointer', color: '#3A2A00', flex: 'none' }}>★ Suggested</button>
                ) : (
                  <button onClick={() => dispatch({ type: 'recommendArea', childId: activeChild.id, area: j.area })} style={{ border: `2px solid ${INK}`, borderRadius: 99, background: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10.5, padding: '4px 10px', cursor: 'pointer', color: INK, flex: 'none' }}>Suggest</button>
                )}
              </div>
              <div style={{ marginTop: 9, display: 'flex' }}>
                <InkBar pct={(j.level / 5) * 100} color={j.color} height={9} />
              </div>
            </PopCard>
          ))}
        </div>
        <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-400)', margin: '8px 2px 0' }}>
          “Suggest” makes that journey {activeChild.name}’s recommended path in Kid Zone.
        </p>
      </div>

      {/* recent activity */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="clock" tint="#E7F2FB">Recent activity</SectionHead>
        <PopCard style={{ padding: '5px 16px' }}>
          {recent.length === 0 && <p style={{ padding: '12px 0', color: 'var(--ink-500)', fontWeight: 700, fontSize: 13.5, textAlign: 'center' }}>No activity yet — the story starts in Kid Zone!</p>}
          {recent.map((e, i) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i < recent.length - 1 ? '2px dashed var(--grape-100)' : 'none' }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--green-100)', border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
                <Icon name={e.kind === 'journey' ? 'gamepad-2' : e.kind === 'quickfire' ? 'zap' : e.kind === 'sayit' ? 'mic' : e.kind === 'boss' ? 'trophy' : 'globe'} size={14} color={INK} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5, color: INK }}>{e.label}{e.area ? ` · ${areaParentLabel(e.area)}` : ''}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)' }}>{e.when}</div>
              </div>
              <InkChip icon="star" iconColor="var(--sun-500)" bg="var(--sun-100)">+{e.stars}</InkChip>
            </div>
          ))}
        </PopCard>
      </div>

      {/* wins to celebrate */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="trophy" tint="var(--sun-100)">Wins to celebrate</SectionHead>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {wins.map((w, i) => (
            <PopCard key={w.title} tilt={i % 2 ? 0.4 : -0.4} style={{ padding: 12 }}>
              <span style={{ display: 'inline-grid', placeItems: 'center', width: 36, height: 36, borderRadius: '50%', background: w.tint, border: `2px solid ${INK}` }}>
                <Icon name={w.icon} size={17} color={INK} />
              </span>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: INK, marginTop: 7, lineHeight: 1.15 }}>{w.title}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', marginTop: 2 }}>{w.sub}</div>
            </PopCard>
          ))}
        </div>
      </div>

      {/* learning statistics */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="trending-up" tint="var(--green-100)">Learning statistics</SectionHead>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {([
            ['Stars earned', eco.stars],
            ['Games completed', eco.stats.journeys + eco.stats.quickfires],
            ['Said out loud', eco.stats.sayits],
            ['Real-world tries', eco.stats.realworld],
            ['Badges', eco.badgesEarned],
            ['Journeys explored', `${eco.stats.explored}/5`],
          ] as const).map(([label, value]) => (
            <div key={label} style={{ background: '#fff', border: `2px solid ${INK}`, borderRadius: 14, padding: '10px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-500)' }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: GRAPE }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ================= parent tab ================= */
function ParentJourney() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const parent = state.parent;
  const [retake, setRetake] = useState(false);
  const [qi, setQi] = useState(0);

  const nextLessons = state.lessons.filter((l) => l.status === 'new').slice(0, 3);
  const doneCats = new Set(state.lessons.filter((l) => l.status === 'done').map((l) => l.parentCategory ?? l.situationCategory));
  const achievements = [
    { label: 'Curious Learner', icon: 'lightbulb', earned: parent.lessonsCompleted >= 1 },
    { label: 'Explorer', icon: 'compass', earned: doneCats.size >= 2 },
    { label: 'Consistent Reader', icon: 'book-open', earned: parent.lessonsCompleted >= 5 },
    { label: 'Check-in Champ', icon: 'calendar-check', earned: parent.checkinsCount >= 1 },
    { label: 'Helping Hand', icon: 'heart', earned: state.savedToolkit.length >= 1 },
  ];

  return (
    <>
      {/* profile card */}
      <div style={{ padding: '16px 20px 0' }}>
        <PopCard style={{ padding: '18px 16px', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', transform: 'rotate(-1.5deg)', background: 'var(--grape-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, letterSpacing: '.08em', padding: '4px 14px', borderRadius: 99, border: `2px solid ${INK}` }}>
            YOUR PARENT POWER
          </span>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FFF3D6', border: `2.5px solid ${INK}`, boxShadow: '3px 4px 0 var(--grape-300)', display: 'grid', placeItems: 'center', margin: '12px auto 8px' }}>
            <Icon name="award" size={30} color={INK} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: INK }}>{parent.type}</div>
          <div style={{ marginTop: 12 }}>
            <PopButton ghost onClick={() => { setQi(0); setRetake(true); }} style={{ padding: '8px 18px', fontSize: 13, minHeight: 38 }}>Retake assessment</PopButton>
          </div>
        </PopCard>
      </div>

      {/* learning stats */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="book-open" tint="var(--grape-100)">Your learning</SectionHead>
        <PopCard style={{ padding: '5px 16px' }}>
          {([
            ['book-open', 'Lessons completed', parent.lessonsCompleted],
            ['calendar-check', 'Weekly check-ins', parent.checkinsCount],
            ['bookmark', 'Scripts saved', state.savedToolkit.length],
          ] as const).map(([icon, label, value], i, arr) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: i < arr.length - 1 ? '2px dashed var(--grape-100)' : 'none' }}>
              <Icon name={icon} size={17} color="var(--grape-600)" />
              <span style={{ flex: 1, fontWeight: 800, fontSize: 13.5, color: INK }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: GRAPE }}>{value}</span>
            </div>
          ))}
        </PopCard>
      </div>

      {/* recommended next */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="star" tint="var(--sun-100)">Recommended next</SectionHead>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {nextLessons.map((l) => (
            <div key={l.id} onClick={() => navigate(`/lessons/${l.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'var(--sun-100)', border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: '3px 4px 0 var(--grape-300)', padding: '12px 14px', cursor: 'pointer' }}>
              <Icon name="book-open" size={17} color="var(--sun-600)" />
              <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: INK, lineHeight: 1.25 }}>{l.title}</span>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--grape-500)', border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
                <Icon name="arrow-right" size={13} color="#fff" />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* achievements */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="award" tint="var(--green-100)">Your milestones</SectionHead>
        <PopCard style={{ padding: '14px 12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {achievements.map((a) => (
              <span key={a.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: a.earned ? 'var(--green-100)' : '#F6F3EC', border: a.earned ? `2px solid ${INK}` : '2px dashed #C9C2B6', borderRadius: 99, padding: '5px 12px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, color: a.earned ? INK : 'var(--ink-400)', opacity: a.earned ? 1 : 0.7 }}>
                <Icon name={a.earned ? a.icon : 'lock'} size={13} color={a.earned ? 'var(--green-600)' : 'var(--ink-400)'} />
                {a.label}
              </span>
            ))}
          </div>
        </PopCard>
      </div>

      {/* retake assessment */}
      <Sheet open={retake} onClose={() => setRetake(false)} title="Parenting quiz">
        <p style={{ marginTop: -4, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: 13.5 }}>
          {qi + 1} of {QUIZ.length} — no wrong answers.
        </p>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: INK, textAlign: 'center', margin: '8px 0 14px' }}>
          {QUIZ[qi].q.replace('{name}', 'your child')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {QUIZ[qi].options.map((o, oi) => (
            <button
              key={o}
              onClick={() => {
                if (qi === 0) dispatch({ type: 'updateParent', patch: { type: PARENT_POWERS[Math.min(oi, PARENT_POWERS.length - 1)].type } });
                if (qi + 1 >= QUIZ.length) setRetake(false);
                else setQi(qi + 1);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', borderRadius: 16, border: `2.5px solid ${INK}`, background: '#fff', boxShadow: '2px 3px 0 var(--grape-300)', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, flex: 'none' }}>{String.fromCharCode(65 + oi)}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: INK }}>{o}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
