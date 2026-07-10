import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { usePlan, FREE_LESSON_INDEX } from '../engine/plan';
import { lessonCategory, lessonContentById, situationCategory } from '../data/lessons';
import { fillTpl } from '../utils/fillTpl';
import { areaParentLabel } from '../constants/areas';
import { Icon } from '../components/ds';

const INK = '#2A2521';

type StepKind = 'narrative' | 'scripts' | 'note' | 'skip' | 'try' | 'done';
interface Step {
  key: string; kind: StepKind; icon: string; kicker: string; sub: string;
  body?: string; scripts?: string[]; intro?: string; items?: string[]; goesWith?: string;
}

/**
 * Lesson reader — "Comic Classic": one screen per step, big colored section head,
 * halftone bubble bodies, tap-to-save script lines, back/Next footer. Accent is
 * coral for "Talking with {child}", grape for "Your Situations".
 */
export function LessonDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { state, activeChild, dispatch } = useApp();
  const plan = usePlan();
  const content = lessonContentById(id);
  const freeId = state.lessons[FREE_LESSON_INDEX]?.id;
  const row = state.lessons.find((l) => l.id === id);
  const fill = (s: string) => fillTpl(s, activeChild);

  useEffect(() => {
    if (!plan.isPremium && id !== freeId) navigate('/plans', { replace: true });
  }, [plan.isPremium, id, freeId, navigate]);
  useEffect(() => {
    if (row && row.status === 'new') dispatch({ type: 'setLessonStatus', id, status: 'in-progress', progress: 10 });
  }, [id, row, dispatch]);

  const talking = content?.shelf === 'talking';
  const ACC = talking
    ? { c100: '#FFE7DE', c200: '#FFD4C5', c300: 'var(--coral-300)', c500: 'var(--coral-500)', c600: 'var(--coral-600)' }
    : { c100: 'var(--grape-100)', c200: '#E1D6F7', c300: 'var(--grape-300)', c500: 'var(--grape-500)', c600: 'var(--grape-600)' };

  const eyebrow = content?.parentCategory ? lessonCategory(content.parentCategory).label
    : content?.situationCategory ? situationCategory(content.situationCategory).label
    : content?.areaTags[0] ? areaParentLabel(content.areaTags[0])
    : talking ? 'Talking' : 'Your situations';

  const steps = useMemo<Step[]>(() => {
    if (!content) return [];
    const out: Step[] = [];
    if (content.theMoment) out.push({ key: 'moment', kind: 'narrative', icon: 'eye', kicker: 'The moment', sub: 'The situation', body: content.theMoment });
    out.push({ key: 'why', kind: 'narrative', icon: 'lightbulb', kicker: 'What’s really going on?', sub: 'The why behind it', body: content.whatsReallyGoingOn });
    if (content.whatToSay?.length) out.push({ key: 'say', kind: 'scripts', icon: 'message-circle', kicker: 'What to say', sub: 'The actual words', intro: 'Steal these word-for-word — tap the ribbon to save one.', scripts: content.whatToSay });
    else if (content.questionsToAsk?.length) out.push({ key: 'ask', kind: 'scripts', icon: 'message-circle', kicker: 'What to ask', sub: 'Open the door', intro: 'Try one of these — tap the ribbon to save it.', scripts: content.questionsToAsk });
    if (content.howToSayIt) out.push({ key: 'how', kind: 'note', icon: 'volume-2', kicker: 'How to say it', sub: 'Energy over words', body: content.howToSayIt });
    if (content.commonMistakes?.length) out.push({ key: 'skip', kind: 'skip', icon: 'circle-slash', kicker: 'Common mistakes', sub: 'What backfires', items: content.commonMistakes });
    else if (content.skipThis) out.push({ key: 'skip', kind: 'skip', icon: 'circle-slash', kicker: 'Skip this', sub: 'What backfires', items: [content.skipThis] });
    if (content.tryItThisWeek) out.push({ key: 'try', kind: 'try', icon: 'target', kicker: 'Try it this week', sub: 'One small step', body: content.tryItThisWeek, goesWith: content.goesWith });
    out.push({ key: 'done', kind: 'done', icon: 'check', kicker: 'Nice work', sub: 'That’s the whole lesson', body: content.keyLine || 'That’s the whole move.' });
    return out;
  }, [content]);

  const [i, setI] = useState(0);
  if (!content || !steps.length) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div>
          <p style={{ fontWeight: 700, color: 'var(--ink-500)' }}>This lesson is coming soon.</p>
          <button onClick={() => navigate('/lessons')} style={{ marginTop: 12, border: `2.5px solid ${INK}`, borderRadius: 99, background: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, padding: '10px 20px', cursor: 'pointer' }}>Back to lessons</button>
        </div>
      </div>
    );
  }

  const step = steps[Math.min(i, steps.length - 1)];
  const atLast = i === steps.length - 1;
  const done = row?.status === 'done';
  const savedFromLesson = (content.whatToSay || content.questionsToAsk || []).filter((l) => state.savedToolkit.includes(fill(l)));

  const next = () => {
    if (atLast) {
      if (!done) { dispatch({ type: 'setLessonStatus', id, status: 'done', progress: 100 }); dispatch({ type: 'updateParent', patch: { lessonsCompleted: state.parent.lessonsCompleted + 1 } }); }
      navigate('/lessons');
      return;
    }
    setI((n) => Math.min(steps.length - 1, n + 1));
  };
  const back = () => (i === 0 ? navigate('/lessons') : setI((n) => Math.max(0, n - 1)));
  const toggleSave = (line: string) => dispatch({ type: 'saveToolkit', label: fill(line) });

  const headColor = step.kind === 'done' ? 'var(--green-500)' : ACC.c500;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--cream-100, #FBF6EC)', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 18px 0', flex: 'none' }}>
        <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
          <button onClick={() => navigate('/lessons')} aria-label="Close" style={{ width: 46, height: 46, borderRadius: 14, border: `2.5px solid ${INK}`, background: '#fff', display: 'grid', placeItems: 'center', flex: 'none', cursor: 'pointer', boxShadow: '2px 2px 0 rgba(42,37,33,.55)' }}>
            <Icon name="x" size={20} color={INK} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '4px 11px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, letterSpacing: '.05em', textTransform: 'uppercase', color: ACC.c600, boxShadow: '2px 2px 0 rgba(42,37,33,.4)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACC.c500, border: `1.5px solid ${INK}` }} />{eyebrow}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '4px 11px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, color: 'var(--ink-700)', boxShadow: '2px 2px 0 rgba(42,37,33,.4)' }}>
                <Icon name="clock" size={12} color="var(--ink-700)" />3 min
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, lineHeight: 1.12, color: INK, marginTop: 9 }}>{content.title}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, padding: '14px 0 2px' }}>
          {steps.map((s, n) => (
            <span key={s.key} style={{ flex: 1, height: 7, border: `2px solid ${INK}`, borderRadius: 5, background: n <= i ? ACC.c500 : '#fff' }} />
          ))}
        </div>
      </div>

      {/* content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', padding: '2px 20px 16px' }}>
        <div style={{ display: 'flex', gap: 13, alignItems: 'center', margin: '12px 0 16px' }}>
          <span style={{ width: 54, height: 54, borderRadius: 15, background: headColor, border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none', boxShadow: '3px 3px 0 rgba(42,37,33,.7)' }}>
            <Icon name={step.icon} size={25} color="#fff" />
          </span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: INK, lineHeight: 1.02 }}>{step.kicker}</div>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink-400)', marginTop: 2 }}>{step.sub}</div>
          </div>
        </div>

        {step.kind === 'narrative' && (
          <div style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: `5px 6px 0 ${ACC.c200}`, padding: 18, transform: 'rotate(-.5deg)' }}>
            <p style={{ fontFamily: 'var(--font-read)', fontSize: 20, lineHeight: 1.48, margin: 0, color: INK }}>{fill(step.body!)}</p>
          </div>
        )}

        {step.kind === 'scripts' && (
          <>
            <p style={{ fontSize: 14.5, color: 'var(--ink-500)', fontWeight: 700, margin: '0 0 14px', lineHeight: 1.45 }}>{step.intro}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {step.scripts!.map((line, n) => {
                const isSaved = state.savedToolkit.includes(fill(line));
                return (
                  <div key={n} style={{ display: 'flex', gap: 11, alignItems: 'center', background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: `3px 4px 0 ${ACC.c500}`, padding: '12px 13px', transform: `rotate(${n % 2 ? 0.5 : -0.5}deg)` }}>
                    <span style={{ flex: 'none', width: 30, height: 30, borderRadius: '50%', background: ACC.c500, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', boxShadow: '1px 2px 0 rgba(42,37,33,.55)' }}>
                      <Icon name="quote" size={14} color="#fff" />
                    </span>
                    <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, color: INK, lineHeight: 1.28 }}>{fill(line)}</span>
                    <button onClick={() => toggleSave(line)} aria-label={isSaved ? 'Saved' : 'Save line'} style={{ flex: 'none', width: 40, height: 40, borderRadius: '50%', border: `2.5px solid ${INK}`, background: isSaved ? ACC.c500 : '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: '2px 2px 0 rgba(42,37,33,.55)' }}>
                      <Icon name={isSaved ? 'bookmark-check' : 'bookmark'} size={18} color={isSaved ? '#fff' : ACC.c500} />
                    </button>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, color: 'var(--ink-400)', fontSize: 12.5, fontWeight: 800 }}>
              <Icon name="bookmark" size={14} color="var(--ink-400)" />TAP TO SAVE · {savedFromLesson.length} IN YOUR TOOLKIT
            </div>
          </>
        )}

        {step.kind === 'note' && (
          <div style={{ background: 'var(--sun-100)', border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: '4px 5px 0 var(--sun-300)', padding: '16px 17px', transform: 'rotate(.4deg)' }}>
            <Tag icon="volume-2" bg="#fff" fg="var(--sun-600)">Say it like</Tag>
            <p style={{ fontSize: 17, fontWeight: 600, color: INK, lineHeight: 1.5, margin: '11px 0 0' }}>{fill(step.body!)}</p>
          </div>
        )}

        {step.kind === 'skip' && step.items!.map((it, n) => (
          <div key={n} style={{ background: ACC.c100, border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: `4px 5px 0 ${ACC.c300}`, padding: '15px 16px', transform: `rotate(${n % 2 ? 0.4 : -0.4}deg)`, marginBottom: n < step.items!.length - 1 ? 13 : 0 }}>
            <Tag icon="circle-slash" bg="#fff" fg={ACC.c600}>Avoid</Tag>
            <p style={{ fontSize: 16.5, fontWeight: 600, color: INK, lineHeight: 1.45, margin: '10px 0 0' }}>{fill(it)}</p>
          </div>
        ))}

        {step.kind === 'try' && (
          <>
            <div style={{ background: 'var(--green-100)', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '5px 6px 0 rgba(42,37,33,.85)', padding: 18, transform: 'rotate(.3deg)' }}>
              <Tag icon="target" bg="#fff" fg="var(--green-600)">Do this</Tag>
              <p style={{ fontFamily: 'var(--font-read)', fontSize: 20, lineHeight: 1.46, margin: '11px 0 0', color: INK }}>{fill(step.body!)}</p>
            </div>
            {step.goesWith && (
              <div style={{ marginTop: 16 }}>
                <Tag icon="link" bg="#fff" fg="var(--grape-600)">Goes with</Tag>
                <div style={{ color: 'var(--ink-500)', fontSize: 14.5, fontWeight: 700, marginTop: 7, paddingLeft: 2 }}>{step.goesWith}</div>
              </div>
            )}
          </>
        )}

        {step.kind === 'done' && (
          <>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'inline-grid', placeItems: 'center', width: 66, height: 66, borderRadius: '50%', background: 'var(--green-500)', border: `2.5px solid ${INK}`, boxShadow: '3px 4px 0 rgba(42,37,33,.85)', marginBottom: 14 }}>
                <Icon name="check" size={32} color="#fff" strokeWidth={3} />
              </span>
            </div>
            <div style={{ position: 'relative', background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '5px 6px 0 var(--green-300)', padding: 18, marginBottom: 16 }}>
              <p style={{ fontFamily: 'var(--font-read)', fontSize: 18, lineHeight: 1.46, margin: 0, color: INK }}>{fill(step.body!)}</p>
            </div>
            <div style={{ background: 'var(--green-100)', border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: '4px 5px 0 rgba(42,37,33,.85)', padding: '15px 16px' }}>
              <Tag icon="bookmark-check" bg="#fff" fg="var(--green-600)">Saved to toolkit · {savedFromLesson.length}</Tag>
              <div style={{ marginTop: 12 }}>
                {savedFromLesson.length === 0 ? (
                  <div style={{ fontSize: 13.5, color: 'var(--ink-500)', fontWeight: 700 }}>No lines saved yet — tap a bubble on “What to say.”</div>
                ) : savedFromLesson.map((t, n) => (
                  <div key={n} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 9 }}>
                    <span style={{ flex: 'none', width: 24, height: 24, borderRadius: '50%', background: 'var(--green-500)', border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', marginTop: 1 }}><Icon name="quote" size={12} color="#fff" /></span>
                    <span style={{ fontFamily: 'var(--font-read)', fontSize: 16, fontStyle: 'italic', lineHeight: 1.32, color: INK }}>“{fill(t).replace(/^["“”']+|["“”']+$/g, '')}”</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* footer */}
      <div style={{ padding: '12px 18px calc(12px + env(safe-area-inset-bottom))', background: '#fff', borderTop: `2.5px solid ${INK}`, display: 'flex', gap: 12, alignItems: 'center', flex: 'none' }}>
        <button onClick={back} aria-label="Back" style={{ width: 58, height: 58, borderRadius: 16, border: `2.5px solid ${INK}`, background: '#fff', display: 'grid', placeItems: 'center', flex: 'none', cursor: 'pointer', boxShadow: '3px 3px 0 rgba(42,37,33,.55)' }}>
          <Icon name="arrow-left" size={20} color="var(--ink-700)" />
        </button>
        <button onClick={next} style={{ flex: 1, height: 58, borderRadius: 99, border: `2.5px solid ${INK}`, background: 'var(--green-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: '4px 5px 0 rgba(42,37,33,.85)' }}>
          {atLast ? 'Add to this week' : 'Next'}<Icon name={atLast ? 'plus' : 'arrow-right'} size={19} color="#fff" />
        </button>
      </div>
    </div>
  );
}

function Tag({ icon, bg, fg, children }: { icon: string; bg: string; fg: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: `2px solid ${INK}`, borderRadius: 99, padding: '3px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase', boxShadow: '2px 2px 0 rgba(42,37,33,.4)', background: bg, color: fg }}>
      <Icon name={icon} size={12} color={fg} />{children}
    </span>
  );
}
