import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { Icon, Input } from '../components/ds';
import { popBg, PopCard, SectionHead, InkBar, ArrowCoin, INK, GRAPE } from '../components/pop';
import { AREAS, type AreaKey } from '../constants/areas';
import { SITUATION_CATEGORIES, lessonVisual } from '../data/lessons';
import { usePlan, FREE_LESSON_INDEX } from '../engine/plan';
import type { Lesson, LessonShelf } from '../types';

/**
 * Lessons (L1 dashboard + L3 category library) — "What can I learn?"
 * Discovery first: recommended hero → continue reading → recently added →
 * two big category buttons → popular → completed. Search on demand.
 */
export function Lessons() {
  const { state, activeChild } = useApp();
  const navigate = useNavigate();
  const plan = usePlan();
  const freeId = state.lessons[FREE_LESSON_INDEX]?.id;
  const isLocked = (id: string) => !plan.isPremium && id !== freeId;
  const [mode, setMode] = useState<'dash' | 'library'>('dash');
  const [shelf, setShelf] = useState<LessonShelf>('talking');
  const [filter, setFilter] = useState<string>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => { setFilter('all'); }, [shelf]);

  const open = (id: string) => navigate(isLocked(id) ? '/plans' : `/lessons/${id}`);
  const searching = searchOpen && !!q.trim();
  const results = useMemo(
    () => (searching ? state.lessons.filter((l) => l.title.toLowerCase().includes(q.toLowerCase())).slice(0, 12) : []),
    [searching, q, state.lessons],
  );

  const talking = state.lessons.filter((l) => l.shelf === 'talking');
  const situations = state.lessons.filter((l) => l.shelf === 'situations');
  const popular = useMemo(() => [talking[2], situations[1], talking[7]].filter(Boolean) as Lesson[], [state.lessons]); // eslint-disable-line react-hooks/exhaustive-deps
  const completed = state.lessons.filter((l) => l.status === 'done').slice(0, 4);

  /* header (shared) */
  const header = (
    <div style={{ padding: '20px 20px 6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {mode === 'library' && (
          <button onClick={() => setMode('dash')} aria-label="Back" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
            <Icon name="arrow-left" size={22} color={INK} />
          </button>
        )}
        <h1 style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: INK, margin: 0 }}>
          {mode === 'dash' ? <>Less<span style={{ color: GRAPE }}>ons</span></> : 'Lessons Library'}
        </h1>
        <button onClick={() => { setSearchOpen((s) => !s); setQ(''); }} aria-label="Search" style={{ width: 40, height: 40, borderRadius: '50%', background: searchOpen ? 'var(--grape-100)' : '#fff', border: `2.5px solid ${INK}`, boxShadow: '2px 3px 0 var(--grape-300)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
          <Icon name={searchOpen ? 'x' : 'search'} size={19} color={INK} />
        </button>
      </div>
      <div style={{ marginTop: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '4px 12px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, color: 'var(--ink-500)' }}>
          Viewing · {activeChild.name}
        </span>
      </div>
      {searchOpen && (
        <div style={{ marginTop: 10 }}>
          <Input value={q} onChange={(e) => setQ(e.target.value)} iconLeft={<Icon name="search" size={18} />} placeholder="Search all lessons" autoFocus />
        </div>
      )}
    </div>
  );

  /* search takes over both modes */
  if (searching) {
    return (
      <div style={{ minHeight: '100%', ...popBg, paddingBottom: 28 }} className="fade-up">
        {header}
        <div style={{ padding: '8px 20px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {results.length === 0 && <p style={{ textAlign: 'center', color: 'var(--ink-500)', fontWeight: 700, padding: '20px 0' }}>No lessons match “{q}”.</p>}
          {results.map((l) => <LessonRow key={l.id} lesson={l} locked={isLocked(l.id)} onOpen={() => open(l.id)} />)}
        </div>
      </div>
    );
  }

  /* ---------- L3 · category library ---------- */
  if (mode === 'library') {
    const chips = shelf === 'talking'
      ? [{ key: 'all', label: 'All' }, ...AREAS.map((a) => ({ key: a.key, label: a.parentLabel }))]
      : [{ key: 'all', label: 'All' }, ...SITUATION_CATEGORIES.map((c) => ({ key: c.key, label: c.label }))];
    const list = (shelf === 'talking' ? talking : situations).filter((l) =>
      filter === 'all'
      || (shelf === 'talking' ? l.areaTags.includes(filter as AreaKey) : l.situationCategory === filter));
    return (
      <div style={{ minHeight: '100%', ...popBg, paddingBottom: 28 }} className="fade-up">
        {header}
        <div style={{ padding: '8px 20px 0' }}>
          <div style={{ display: 'flex', border: `2.5px solid ${INK}`, borderRadius: 99, background: '#fff', padding: 3, boxShadow: '3px 4px 0 var(--grape-300)' }}>
            {([['talking', `Talking with ${activeChild.name}`], ['situations', 'Your situations']] as const).map(([k, label]) => (
              <button key={k} onClick={() => setShelf(k)} style={{ flex: 1, height: 36, border: 'none', borderRadius: 99, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, background: shelf === k ? (k === 'talking' ? 'var(--grape-500)' : 'var(--green-500)') : 'transparent', color: shelf === k ? '#fff' : 'var(--ink-500)' }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '12px 0 2px' }} className="card-rail">
            {chips.map((c) => (
              <button key={c.key} onClick={() => setFilter(c.key)} style={{ flex: 'none', border: `2px solid ${INK}`, borderRadius: 99, padding: '6px 13px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, background: filter === c.key ? INK : '#fff', color: filter === c.key ? '#fff' : INK, cursor: 'pointer' }}>
                {c.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-400)', margin: '8px 2px' }}>{list.length} lessons</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {list.map((l) => <LessonRow key={l.id} lesson={l} locked={isLocked(l.id)} onOpen={() => open(l.id)} />)}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- L1 · dashboard ---------- */
  return (
    <div style={{ minHeight: '100%', ...popBg, paddingBottom: 28 }} className="fade-up">
      {header}

      {/* browse the library — two big category buttons */}
      <div style={{ padding: '12px 20px 0' }}>
        <SectionHead icon="library" tint="var(--grape-100)">Browse the library</SectionHead>
        <div data-tour="lessons-cats" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div onClick={() => { setShelf('talking'); setMode('library'); }} style={{ background: 'linear-gradient(155deg, var(--grape-500), var(--grape-600))', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 rgba(42,37,33,.9)', padding: '18px 16px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 13, minHeight: 118 }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.18)', border: '2px solid rgba(255,255,255,.55)', display: 'grid', placeItems: 'center', flex: 'none' }}>
              <Icon name="messages-square" size={22} color="#fff" />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, lineHeight: 1.15 }}>Talking with {activeChild.name}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--grape-100)', marginTop: 3 }}>Scripts for moments together · {talking.length} lessons</div>
            </div>
            <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff', border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
              <Icon name="arrow-right" size={17} color="var(--grape-600)" />
            </span>
          </div>
          <div onClick={() => { setShelf('situations'); setMode('library'); }} style={{ background: 'linear-gradient(155deg, var(--green-500), var(--green-600, #187347))', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 rgba(42,37,33,.9)', padding: '18px 16px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 13, minHeight: 118 }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.18)', border: '2px solid rgba(255,255,255,.55)', display: 'grid', placeItems: 'center', flex: 'none' }}>
              <Icon name="compass" size={22} color="#fff" />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, lineHeight: 1.15 }}>Your Situations</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-100)', marginTop: 3 }}>Family, school & everywhere else · {situations.length} lessons</div>
            </div>
            <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff', border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
              <Icon name="arrow-right" size={17} color="var(--green-600)" />
            </span>
          </div>
        </div>
      </div>

      {/* popular */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="flame" tint="#FBE3D8">Popular lessons</SectionHead>
        <PopCard style={{ padding: '5px 16px' }}>
          {popular.map((l, i) => (
            <div key={l.id} onClick={() => open(l.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 0', borderBottom: i < popular.length - 1 ? '2px dashed var(--grape-100)' : 'none', cursor: 'pointer' }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: ['var(--sun-500)', 'var(--grape-400)', 'var(--sky-500)'][i], border: `2px solid ${INK}`, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, flex: 'none' }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: INK, lineHeight: 1.25 }}>{l.title}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)' }}>{[1284, 967, 733][i]} parents read this</div>
              </div>
              <Icon name="arrow-right" size={15} color="var(--grape-500)" />
            </div>
          ))}
        </PopCard>
      </div>

      {/* completed */}
      {completed.length > 0 && (
        <div style={{ padding: '18px 20px 0' }}>
          <SectionHead icon="check" tint="var(--green-100)">Completed</SectionHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {completed.map((l) => <LessonRow key={l.id} lesson={l} locked={isLocked(l.id)} onOpen={() => open(l.id)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

/** L3 lesson row: icon tile + title + state (arrow / striped bar / DONE). */
function LessonRow({ lesson, onOpen, locked }: { lesson: Lesson; onOpen: () => void; locked?: boolean }) {
  const vis = lessonVisual(lesson);
  const done = lesson.status === 'done';
  return (
    <div onClick={onOpen} style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: '2px 3px 0 var(--grape-300)', padding: '11px 13px', cursor: 'pointer', opacity: done ? 0.75 : 1 }}>
      <span style={{ width: 38, height: 38, borderRadius: 11, background: `color-mix(in srgb, ${vis.color} 18%, white)`, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
        <Icon name={vis.icon} size={17} color={vis.color} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: INK, lineHeight: 1.25 }}>{lesson.title}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)' }}>3 min read</div>
      </div>
      {locked ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, color: 'var(--grape-600)', background: 'var(--grape-100)', border: `2px solid ${INK}`, borderRadius: 99, padding: '3px 9px', flex: 'none' }}><Icon name="lock" size={10} color="var(--grape-600)" />PREMIUM</span>
      ) : done ? (
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, color: 'var(--green-600)', background: 'var(--green-100)', border: `2px solid ${INK}`, borderRadius: 99, padding: '2px 9px', flex: 'none' }}>DONE</span>
      ) : lesson.status === 'in-progress' ? (
        <span style={{ width: 56, display: 'flex', flex: 'none' }}><InkBar striped pct={lesson.progress ?? 50} height={9} /></span>
      ) : (
        <ArrowCoin size={30} />
      )}
    </div>
  );
}
