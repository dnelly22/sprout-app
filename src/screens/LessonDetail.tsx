import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useApp } from '../store/AppStore';
import { usePlan, FREE_LESSON_INDEX } from '../engine/plan';
import { lessonCategory, lessonContentById, lessonVisual, situationCategory } from '../data/lessons';
import { fillTpl } from '../utils/fillTpl';
import { areaParentLabel } from '../constants/areas';
import { Button, Icon, IconButton } from '../components/ds';

interface Slide {
  key: string;
  icon: string;
  title: string;
  subtitle: string;
  body: ReactNode;
}

export function LessonDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { state, activeChild, dispatch } = useApp();
  const plan = usePlan();
  const content = lessonContentById(id);
  const freeId = state.lessons[FREE_LESSON_INDEX]?.id;
  useEffect(() => {
    if (!plan.isPremium && id !== freeId) navigate('/plans', { replace: true });
  }, [plan.isPremium, id, freeId, navigate]);
  const row = state.lessons.find((l) => l.id === id);
  const fill = (s: string) => fillTpl(s, activeChild);

  const [i, setI] = useState(0);
  const [dir, setDir] = useState<'next' | 'prev'>('next');
  const accent = content ? lessonVisual(content).color : 'var(--primary)';
  const lineSaved = content?.keyLine ? state.savedToolkit.includes(content.keyLine) : false;

  useEffect(() => {
    if (row && row.status === 'new') {
      dispatch({ type: 'setLessonStatus', id, status: 'in-progress', progress: 10 });
    }
  }, [id, row, dispatch]);

  const slides = useMemo<Slide[]>(() => {
    if (!content) return [];
    const out: Slide[] = [];

    if (content.theMoment) {
      out.push({ key: 'moment', icon: 'eye', title: 'The moment', subtitle: 'The situation', body: <Read>{fill(content.theMoment)}</Read> });
    }
    out.push({ key: 'why', icon: 'lightbulb', title: 'What’s really going on?', subtitle: 'The why behind it', body: <Read>{fill(content.whatsReallyGoingOn)}</Read> });

    if (content.whatToSay?.length) {
      out.push({
        key: 'say', icon: 'message-circle', title: 'What to say', subtitle: 'The actual words',
        body: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {content.whatToSay.map((line, n) => (
              <div key={n} style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', boxShadow: 'var(--shadow-sm)' }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-lg)', color: 'var(--ink-900)', lineHeight: 1.35 }}>{fill(line)}</span>
              </div>
            ))}
          </div>
        ),
      });
    }
    if (content.questionsToAsk?.length) {
      out.push({
        key: 'ask', icon: 'message-circle', title: 'Questions to ask', subtitle: 'Open the door',
        body: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {content.questionsToAsk.map((line, n) => (
              <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ marginTop: 6, width: 7, height: 7, flex: 'none', borderRadius: '50%', background: accent }} />
                <span style={{ fontWeight: 600, fontSize: 'var(--text-lg)', color: 'var(--ink-900)', lineHeight: 1.4 }}>{fill(line)}</span>
              </div>
            ))}
          </div>
        ),
      });
    }
    if (content.howToSayIt) {
      out.push({ key: 'how', icon: 'volume-2', title: 'How to say it', subtitle: 'Energy over words', body: <Plain>{fill(content.howToSayIt)}</Plain> });
    }
    if (content.commonMistakes?.length) {
      out.push({
        key: 'mistakes', icon: 'ban', title: 'Common mistakes', subtitle: 'What backfires',
        body: (
          <div style={{ background: 'var(--danger-soft)', border: '1.5px solid var(--berry-300)', borderRadius: 'var(--radius-lg)', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {content.commonMistakes.map((line, n) => (
              <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Icon name="x" size={16} color="var(--berry-600)" strokeWidth={3} />
                <span style={{ fontSize: 'var(--text-md)', color: 'var(--text-body)', fontWeight: 500, lineHeight: 1.4 }}>{fill(line)}</span>
              </div>
            ))}
          </div>
        ),
      });
    }
    if (content.skipThis) {
      out.push({
        key: 'skip', icon: 'ban', title: 'Skip this', subtitle: 'What backfires',
        body: (
          <div style={{ background: 'var(--danger-soft)', border: '1.5px solid var(--berry-300)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
            <Plain color="var(--text-body)">{fill(content.skipThis)}</Plain>
          </div>
        ),
      });
    }
    if (content.tryItThisWeek) {
      out.push({
        key: 'try', icon: 'target', title: 'Try it this week', subtitle: 'One small step',
        body: (
          <>
            <div style={{ background: 'var(--green-50)', border: '1.5px solid var(--green-200)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <Read>{fill(content.tryItThisWeek)}</Read>
            </div>
            {content.goesWith && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 18 }}>
                <Icon name="link" size={18} color="var(--text-faint)" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Goes with</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{content.goesWith}</div>
                </div>
              </div>
            )}
          </>
        ),
      });
    }
    if (content.keyLine) {
      out.push({
        key: 'save', icon: 'bookmark', title: 'Save the line', subtitle: 'The line to keep',
        body: (
          <div style={{ background: 'var(--green-50)', border: '1.5px solid var(--green-200)', borderRadius: 'var(--radius-lg)', padding: '22px 20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-2xl)', color: 'var(--ink-900)', lineHeight: 1.2, marginBottom: 16 }}>{fill(content.keyLine)}</div>
            <button
              onClick={() => content.keyLine && dispatch({ type: 'saveToolkit', label: content.keyLine })}
              disabled={lineSaved}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 18px', borderRadius: 'var(--radius-pill)',
                cursor: lineSaved ? 'default' : 'pointer', fontWeight: 800, fontSize: 'var(--text-md)',
                border: lineSaved ? 'none' : '1.5px solid var(--green-300)',
                background: lineSaved ? 'var(--green-100)' : 'var(--surface)', color: 'var(--green-700)',
              }}
            >
              <Icon name={lineSaved ? 'check' : 'bookmark'} size={18} color="var(--green-700)" />
              {lineSaved ? 'Saved to your toolkit' : 'Save this line'}
            </button>
          </div>
        ),
      });
    }
    return out;
  }, [content, activeChild, lineSaved]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!content) {
    return (
      <div style={{ padding: 24 }}>
        <IconButton variant="soft" label="Back" onClick={() => navigate('/lessons')}><Icon name="arrow-left" size={22} /></IconButton>
        <p style={{ marginTop: 16, color: 'var(--text-muted)', fontWeight: 600 }}>This lesson isn’t available yet.</p>
      </div>
    );
  }

  const eyebrow = content.areaTags.length
    ? areaParentLabel(content.areaTags[0])
    : content.parentCategory ? lessonCategory(content.parentCategory).label
    : content.situationCategory ? situationCategory(content.situationCategory).label
    : 'Your situations';
  const done = row?.status === 'done';
  const atFirst = i === 0;
  const atLast = i === slides.length - 1;
  const slide = slides[i];

  const go = (to: number, d: 'next' | 'prev') => { setDir(d); setI(Math.max(0, Math.min(slides.length - 1, to))); };
  const next = () => {
    if (atLast) {
      if (!done) dispatch({ type: 'setLessonStatus', id, status: 'done', progress: 100 });
      navigate('/lessons');
      return;
    }
    go(i + 1, 'next');
  };
  const prev = () => go(i - 1, 'prev');

  const startX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -45 && !atLast) next();
    else if (dx > 45 && !atFirst) prev();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ padding: '16px 20px 0', flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <button
            onClick={() => navigate('/lessons')} aria-label="Close lesson"
            style={{ width: 44, height: 44, flex: 'none', borderRadius: '50%', border: 'none', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
          >
            <Icon name="x" size={22} color="var(--text-body)" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 'var(--text-xs)', fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />{eyebrow}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                <Icon name="clock" size={13} color="var(--text-faint)" /> 1 min
              </span>
            </div>
            <h1 style={{ fontSize: 'var(--text-xl)', lineHeight: 1.15, marginTop: 3, color: 'var(--text-strong)' }}>{fill(content.title)}</h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          {slides.map((s, n) => (
            <span key={s.key} style={{ flex: 1, height: 6, borderRadius: 999, background: n <= i ? accent : 'rgba(42,37,33,0.1)', transition: 'background var(--dur-base)' }} />
          ))}
        </div>
      </div>

      {/* current slide */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 20px 8px' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div key={slide.key} className={dir === 'next' ? 'slide-next' : 'slide-prev'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <span style={{ width: 52, height: 52, flex: 'none', borderRadius: 'var(--radius-md)', background: accent, display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-xs)' }}>
              <Icon name={slide.icon} size={26} color="#fff" />
            </span>
            <div>
              <h2 style={{ fontSize: 'var(--text-2xl)', lineHeight: 1.1, color: 'var(--text-strong)' }}>{slide.title}</h2>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-faint)', marginTop: 2 }}>{slide.subtitle}</div>
            </div>
          </div>
          {slide.body}
        </div>

        {content.note && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 20, padding: '12px 14px', background: 'var(--sun-100)', borderRadius: 'var(--radius-md)' }}>
            <Icon name="life-buoy" size={16} color="#7a5600" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)', fontWeight: 500, lineHeight: 1.4 }}>{content.note}</span>
          </div>
        )}
      </div>

      {/* footer controls */}
      <div style={{ flex: 'none', padding: '8px 20px 16px', display: 'flex', alignItems: 'center', gap: 12, borderTop: '1.5px solid var(--border)', background: 'var(--surface)' }}>
        {!atFirst && (
          <IconButton variant="soft" label="Previous" onClick={prev}><Icon name="arrow-left" size={22} /></IconButton>
        )}
        <div style={{ flex: 1 }}>
          <Button variant="primary" size="lg" fullWidth onClick={next} iconRight={<Icon name={atLast ? 'check' : 'arrow-right'} size={18} color="#fff" />}>
            {atLast ? (done ? 'Done ✓' : 'Mark done') : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Editorial reading text (Newsreader) — for The Moment, the why, and Try-it. */
function Read({ children }: { children: ReactNode }) {
  return <p style={{ fontFamily: 'var(--font-read)', fontSize: 'var(--text-xl)', color: 'var(--text-strong)', lineHeight: 1.5, margin: 0 }}>{children}</p>;
}

/** Plain body text (Nunito). */
function Plain({ children, color = 'var(--text-body)' }: { children: ReactNode; color?: string }) {
  return <p style={{ fontSize: 'var(--text-lg)', color, lineHeight: 1.55, fontWeight: 500, margin: 0 }}>{children}</p>;
}
