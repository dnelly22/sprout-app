import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../../store/AppStore';
import { quickfireRound } from '../../../data/drills';
import { STARS } from '../../../engine/gamification';
import { areaColor, areaParentLabel } from '../../../constants/areas';
import { Icon } from '../../../components/ds';
import { PopCard, PopButton, InkBar, INK } from '../../../components/pop';
import { StarPop } from '../KidFace';
import { Mascot, useMascotCelebrate, preloadMascots } from '../Mascot';
import { burstConfetti } from '../confetti';
import { useSceneMusic } from '../../../audio/MusicProvider';
import { sfx } from '../../../audio/sfx';
import type { Child, QuickfireScenario } from '../../../types';

interface Props { child: Child; onExit: () => void }
type Phase = 'play' | 'feedback' | 'end';

export function QuickFireGame({ child, onExit }: Props) {
  const { dispatch, state } = useApp();
  const [qs] = useState(() => quickfireRound(7));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [stars, setStars] = useState(0);
  const [results, setResults] = useState<{ q: QuickfireScenario; nailed: boolean }[]>([]);
  const [phase, setPhase] = useState<Phase>('play');
  const fbMascotRef = useRef<HTMLDivElement>(null);
  const { mood: celebMood, playKey, celebrate } = useMascotCelebrate();
  useSceneMusic('quickfire');

  const q = qs[i];
  const chosen = picked != null ? q.options[picked] : null;
  const correctOpt = q.options.find((o) => o.correct)!;

  // Warm the jump animations so the first celebrate doesn't flicker.
  useEffect(() => { preloadMascots(); }, []);

  // When the answer lands, the mascot plays its full jump (then settles to idle
  // on its own) + confetti. At round end, ONE economy award for the whole round
  // (10 base + 10 full round + 10 perfect) — per-answer stars are display-only.
  useEffect(() => {
    if (phase === 'feedback') {
      celebrate(chosen?.correct ? 'jump1' : 'jump2');
      sfx(chosen?.correct ? 'answerBest' : 'answerMid');
      burstConfetti(fbMascotRef.current, chosen?.correct ? 24 : 16);
    } else if (phase === 'end') {
      celebrate('jump1');
      sfx('cheer');
      const nailed = results.filter((r) => r.nailed).length;
      const areas = results.map((r) => r.q.area);
      const modalArea = areas.sort((a, b) => areas.filter(v => v === a).length - areas.filter(v => v === b).length).pop();
      dispatch({
        type: 'recordActivity',
        input: { childId: child.id, kind: 'quickfire', area: modalArea, fullRound: true, perfect: nailed === qs.length },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const pick = (idx: number) => {
    if (phase !== 'play') return;
    const opt = q.options[idx];
    const gain = opt.correct ? STARS.quickfireBest : STARS.quickfireTry;
    setPicked(idx);
    setStars((s) => s + gain);
    setResults((r) => [...r, { q, nailed: opt.correct }]);
    setPhase('feedback');
  };

  const next = () => {
    if (i + 1 >= qs.length) { setPhase('end'); return; }
    setI(i + 1); setPicked(null); setPhase('play');
  };

  if (phase === 'end') {
    const nailed = results.filter((r) => r.nailed).length;
    const powerUps = results.filter((r) => !r.nailed).map((r) => r.q);
    return (
      <div style={{ padding: '8px 20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{ display: 'inline-block' }}><Mascot mood={celebMood} playKey={playKey} size={96} /></div>
          <h1 style={{ fontSize: 'var(--text-3xl)', color: 'var(--grape-600)', marginTop: 10 }}>Round done!</h1>
        </div>
        <PopCard tone="sun" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', padding: '18px 12px' }}>
          <EndStat value={`+${state.lastAward?.childId === child.id ? state.lastAward.stars : stars}`} label="STARS EARNED" color="#7a5600" />
          <Divider />
          <EndStat value={`${nailed} of ${qs.length}`} label="NAILED" color="var(--grape-600)" />
          <Divider />
          <EndStat value={`${child.streak + 1}🔥`} label="DAY STREAK" color="var(--coral-600)" />
        </PopCard>

        {powerUps.length > 0 && (
          <div>
            <h2 style={{ fontSize: 'var(--text-xl)', color: 'var(--grape-600)', marginBottom: 4 }}>Power-ups to remember</h2>
            <p style={{ margin: '0 0 12px', fontSize: 'var(--text-sm)', color: 'var(--ink-500)', fontWeight: 600 }}>Collect these moves for next time 💪</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {powerUps.map((pq) => {
                const strong = pq.options.find((o) => o.correct)!;
                const isSaved = state.savedToolkit.includes(strong.text);
                return (
                  <PopCard key={pq.id} style={{ padding: 14, borderLeft: `6px solid ${areaColor(pq.area)}` }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--ink-500)' }}>{pq.scene}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 6px' }}>
                      <Icon name="zap" size={16} color={areaColor(pq.area)} />
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: INK, fontSize: 'var(--text-sm)' }}>{strong.text}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-700)', marginBottom: 12 }}>{strong.why}</div>
                    <button
                      onClick={() => dispatch({ type: 'saveToolkit', label: strong.text })}
                      disabled={isSaved}
                      style={{
                        width: '100%', minHeight: 42, borderRadius: 99, cursor: isSaved ? 'default' : 'pointer',
                        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-sm)',
                        border: `2.5px solid ${INK}`,
                        background: isSaved ? 'var(--green-100)' : '#fff',
                        boxShadow: isSaved ? 'none' : '2px 3px 0 var(--grape-300)',
                        color: isSaved ? 'var(--green-700)' : areaColor(pq.area),
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <Icon name={isSaved ? 'check' : 'bookmark-plus'} size={16} color={isSaved ? 'var(--green-700)' : areaColor(pq.area)} />
                      {isSaved ? 'Saved to your toolkit!' : 'Save to my toolkit'}
                    </button>
                  </PopCard>
                );
              })}
            </div>
          </div>
        )}

        <PopButton fullWidth onClick={onExit} style={{ minHeight: 52, fontSize: 16 }}>Back to games</PopButton>
      </div>
    );
  }

  const progress = ((i + (phase === 'feedback' ? 1 : 0)) / qs.length) * 100;
  return (
    <div style={{ padding: '4px 20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <InkBar pct={progress} height={10} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xs)', fontWeight: 800, color: INK }}>{i + 1}/{qs.length}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-display)', fontSize: 'var(--text-xs)', fontWeight: 800, color: '#7a5600' }}>
          <Icon name="star" size={14} color="var(--sun-500)" fill="var(--sun-500)" />{stars}
        </span>
      </div>

      {phase === 'play' ? (
        <>
          <PopCard style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px' }}>
            <Mascot mood="idle" size={52} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xs)', fontWeight: 800, color: areaColor(q.area), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{areaParentLabel(q.area)}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-sm)', color: INK, lineHeight: 1.25, marginTop: 2 }}>{q.scene}</div>
            </div>
          </PopCard>
          <h1 style={{ fontSize: 'var(--text-xl)', color: 'var(--grape-600)', textAlign: 'center', margin: 0 }}>{q.prompt}</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((o, idx) => (
              <button
                key={idx}
                onClick={() => pick(idx)}
                style={{
                  textAlign: 'left', padding: '13px 16px', borderRadius: 16, cursor: 'pointer',
                  border: `2.5px solid ${INK}`, background: '#fff', boxShadow: '3px 4px 0 var(--grape-300)',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)', color: INK, lineHeight: 1.3,
                }}
              >
                {o.text}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ textAlign: 'center', paddingTop: 6 }}>
            <div ref={fbMascotRef} style={{ display: 'inline-block' }}><Mascot mood={celebMood} playKey={playKey} size={92} /></div>
            <div style={{ marginTop: 12 }}><StarPop amount={chosen!.correct ? STARS.quickfireBest : STARS.quickfireTry} /></div>
            <h1 style={{ fontSize: 'var(--text-2xl)', color: chosen!.correct ? 'var(--green-600)' : 'var(--grape-600)', marginTop: 12 }}>
              {chosen!.correct ? 'Nailed it! 🎉' : 'Good try!'}
            </h1>
          </div>

          {!chosen!.correct && (
            <PopCard tone="green" style={{ padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xs)', fontWeight: 800, color: 'var(--green-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>An even stronger move</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <Icon name="zap" size={18} color="var(--green-600)" />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: INK }}>{correctOpt.text}</span>
              </div>
            </PopCard>
          )}
          <PopCard style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '13px 15px' }}>
            <Icon name="lightbulb" size={20} color="var(--sun-500)" />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-700)', fontWeight: 600 }}>{chosen!.correct ? chosen!.why : correctOpt.why}</div>
          </PopCard>
          <PopButton fullWidth onClick={next} style={{ minHeight: 52, fontSize: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {i + 1 >= qs.length ? 'See results' : 'Next'}<Icon name="arrow-right" size={18} color="#fff" />
          </PopButton>
        </>
      )}
    </div>
  );
}

function EndStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-2xl)', color, whiteSpace: 'nowrap' }}>{value}</div>
      <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 800, color: 'var(--ink-500)' }}>{label}</div>
    </div>
  );
}
function Divider() {
  return <div style={{ width: 1, background: 'var(--border)' }} />;
}
