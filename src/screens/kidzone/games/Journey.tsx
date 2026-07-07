import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../store/AppStore';
import { Button, Icon } from '../../../components/ds';
import { Mascot, useMascotCelebrate, preloadMascots } from '../Mascot';
import { burstConfetti } from '../confetti';
import { useSceneMusic } from '../../../audio/MusicProvider';
import { sfx } from '../../../audio/sfx';
import { speakCharacter, type Character } from '../../../audio/voice';
import { JOURNEY_TO_AREA } from '../../../data/journey';
import { castGender, castMood, castClipUrl } from '../../../data/cast';
import type { Child } from '../../../types';
import type { JourneyChoice, JourneyMode, JourneyScenario } from '../../../types/journey';

interface Props { child: Child; scenario: JourneyScenario; mode: JourneyMode; onExit: () => void; boss?: boolean }

/* P3 "Color Block" comic tokens (design_handoff_comic_panel) */
const INK = '#2A2521';
const HARD = (x: number, y: number, a = 0.85) => `${x}px ${y}px 0 rgba(42,37,33,${a})`;
const COIN: Record<string, string> = { A: '#7A5AD9', B: '#2A8FD8', C: '#F08A6A', D: '#1F8A5B' };

/** Some answers are written terse (no coaching) — fall back to a star-tier note. */
const COACH_FALLBACK: Record<number, string> = {
  5: 'Nailed it! That was the strongest, kindest move. 🌟',
  4: 'Nice — that works! A clear, respectful choice. 👍',
  3: 'Good — naming it is the important part.',
  2: 'That works, but there’s an even stronger move next time.',
  1: 'Let’s see what happens — you can always make it right.',
};

/** Types the line out while a gibberish voice plays; resets on line change. */
function useTalkingBubble(text: string, character: Character) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    setShown('');
    if (!text) return;
    const handle = speakCharacter(character, text, 'talking');
    const total = Math.max(300, handle.durationMs);
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / total);
      setShown(text.slice(0, Math.round(k * text.length)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); handle.stop(); };
  }, [text, character]);
  return shown;
}

function Stars({ n, size = 18 }: { n: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        i <= n
          ? <Icon key={i} name="star" size={size} color="var(--sun-500)" fill="var(--sun-500)" strokeWidth={2} />
          : <Icon key={i} name="star" size={size} color="var(--grape-300)" strokeWidth={2} />
      ))}
    </span>
  );
}

/** "Meanwhile, at recess…" — comic kicker derived from the mode's setting line. */
function kickerFor(setting?: string): string {
  if (!setting) return 'Meanwhile…';
  let place = setting.split(/[.—;]/)[0].trim().replace(/^the\s+/i, '');
  if (place.length > 26) place = place.split(',')[0].trim();
  if (!place || place.length > 26) return 'Meanwhile…';
  return `Meanwhile, at ${place.toLowerCase()}…`;
}

export function JourneyGame({ child, scenario, mode, onExit, boss }: Props) {
  const { dispatch, state } = useApp();
  const M = scenario.modes[mode];
  const [beatId, setBeatId] = useState(M.start);
  const [picked, setPicked] = useState<JourneyChoice | null>(null);
  const [committing, setCommitting] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(1);
  const { mood: mascotMood, playKey, celebrate } = useMascotCelebrate();
  const panelRef = useRef<HTMLDivElement>(null);
  useSceneMusic('journey');
  useEffect(() => { preloadMascots(['thinking', 'growth', 'jump1', 'sad', 'sunglasses']); }, []);

  const beat = M.beats[beatId];
  const TOTAL_ROUNDS = 5;
  useEffect(() => { if (beat?.round) setRound(beat.round); }, [beat?.round]);

  // A new question arrives → Sprout fades to thinking, plays it once, then
  // settles back into the idle loop until the kid answers (swiping the cards
  // while idle re-triggers thinking via CardRail's onBrowse).
  useEffect(() => {
    if (!done && beat) celebrate('thinking');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatId]);

  // The other kid on screen: this beat's speaker, else the mode's first speaker.
  const fallbackSpeaker = useMemo(() => {
    for (const b of Object.values(M.beats)) if (b.speaker) return b.speaker;
    return undefined;
  }, [M]);
  const actor = beat?.speaker ?? fallbackSpeaker;
  const gender = castGender(actor);
  const shownLine = useTalkingBubble(picked || committing ? '' : (beat?.line ?? ''), gender);

  // record the completed journey once when the reflection is reached — the
  // economy pipeline handles stars (25 base, +5 perfect run) and all bonuses
  const awarded = useRef(false);
  const award = state.lastAward?.childId === child.id && awarded.current ? state.lastAward : undefined;
  useEffect(() => {
    if (done && !awarded.current) {
      awarded.current = true;
      dispatch({
        type: 'recordActivity',
        input: {
          childId: child.id, kind: boss ? 'boss' : 'journey',
          area: JOURNEY_TO_AREA[scenario.category], scenarioId: scenario.id,
          xpRatio: Math.min(1, xp / 125), perfect: xp >= 125,
        },
      });
      celebrate('sunglasses'); // game finished — Sprout puts the shades on (and keeps them on)
      sfx('celebrate');
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tap a card: commit visually, let Sprout react + confetti play, then reveal
  // coaching. Reaction by answer tier: 5★ → growth, 2–4★ → jump, 1★ → sad.
  const pick = (c: JourneyChoice) => {
    if (picked || committing) return;
    setCommitting(c.letter);
    setXp((x) => x + c.xp);
    celebrate(c.stars >= 5 ? 'growth' : c.stars <= 1 ? 'sad' : 'jump1');
    sfx(c.stars >= 5 ? 'answerBest' : c.stars >= 3 ? 'answerMid' : 'answerThird');
    if (c.stars >= 4) burstConfetti(panelRef.current, 22);
    window.setTimeout(() => { setPicked(c); setCommitting(null); }, 1000);
  };

  const cont = () => {
    if (!picked) return;
    const next = picked.next;
    setPicked(null);
    if (next === M.reflectionId) { setDone(true); return; }
    setBeatId(next);
  };

  const header = (withDots: boolean) => (
    <div style={{ background: 'linear-gradient(180deg, #4E3399, #7A5AD9)', paddingBottom: withDots ? 64 : 18, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 18px 0' }}>
        <button onClick={onExit} aria-label="Quit" style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.16)', border: 'none', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#fff', fontSize: 14, cursor: 'pointer' }}>✕</button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff', fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 210 }}>{scenario.title}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FBB614', color: '#5c3d00', fontWeight: 800, fontSize: 12, padding: '6px 11px', borderRadius: 'var(--radius-pill)', boxShadow: '0 3px 8px rgba(0,0,0,.18)' }}>⭐ {child.stars}</span>
      </div>
      {withDots && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 12 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,.85)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Round {round} of {TOTAL_ROUNDS}</span>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < round ? '#fff' : 'rgba(255,255,255,.28)' }} />
          ))}
        </div>
      )}
    </div>
  );

  // ---------- Final reflection ----------
  if (done) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {header(false)}
        <div className="journey-dotbg" style={{ flex: 1, padding: '16px 20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', paddingTop: 4 }}>
            <Mascot mood={mascotMood} playKey={playKey} size={128} />
            <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 800, color: 'var(--sun-600)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>You finished · {scenario.title}</div>
            <h1 style={{ fontSize: 'var(--text-3xl)', color: 'var(--grape-600)', marginTop: 2 }}>Nice work! 🌱</h1>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--sun-100)', color: '#7a5600', fontWeight: 800, fontSize: 'var(--text-md)', padding: '6px 14px', borderRadius: 'var(--radius-pill)', border: `2px solid ${INK}` }}>
                <Icon name="star" size={15} color="var(--sun-500)" fill="var(--sun-500)" />+{award?.stars ?? 25} stars
              </span>
              {award && award.breakdown.length > 1 && (
                <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 800, color: 'var(--ink-500)' }}>{award.breakdown.join(' · ')}</span>
              )}
            </div>
          </div>

          {M.reflection.split('\n\n').map((p, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: `2.5px solid ${INK}`, boxShadow: HARD(3, 4, 0.9), fontFamily: 'var(--font-read)', fontSize: 'var(--text-md)', color: 'var(--ink-800)', lineHeight: 1.5 }}>
              {p}
            </div>
          ))}

          {M.saveLine && (
            <div style={{ background: '#FFF3D6', borderRadius: 12, padding: '14px 16px', border: `2.5px solid ${INK}`, boxShadow: HARD(3, 4, 0.9) }}>
              <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 800, color: 'var(--coral-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>💬 Save this line</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--ink-900)', lineHeight: 1.2 }}>“{M.saveLine}”</div>
              <button
                onClick={() => dispatch({ type: 'saveToolkit', label: M.saveLine! })}
                disabled={state.savedToolkit.includes(M.saveLine)}
                style={{ marginTop: 10, height: 38, padding: '0 16px', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontWeight: 800, fontSize: 'var(--text-sm)', border: 'none', background: state.savedToolkit.includes(M.saveLine) ? 'var(--green-100)' : 'var(--grape-500)', color: state.savedToolkit.includes(M.saveLine) ? 'var(--green-700)' : '#fff', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Icon name={state.savedToolkit.includes(M.saveLine) ? 'check' : 'bookmark-plus'} size={15} color={state.savedToolkit.includes(M.saveLine) ? 'var(--green-700)' : '#fff'} />
                {state.savedToolkit.includes(M.saveLine) ? 'Saved to your toolkit!' : 'Save to my toolkit'}
              </button>
            </div>
          )}

          <Button variant="primary" size="lg" fullWidth onClick={onExit} iconRight={<Icon name="arrow-right" size={18} color="#fff" />}>Back to scenarios</Button>
        </div>
      </div>
    );
  }

  if (!beat) { onExit(); return null; }

  // ---------- Coaching reveal ----------
  if (picked) {
    const strong = picked.stars >= 4;
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {header(false)}
        <div className="journey-dotbg" style={{ flex: 1, padding: '16px 20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center', paddingTop: 4 }}>
            <Mascot mood={mascotMood} playKey={playKey} size={104} />
            <div style={{ marginTop: 8 }}><Stars n={picked.stars} size={24} /></div>
            <div style={{ display: 'inline-flex', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {picked.traits.map((t) => (
                <span key={t} style={{ background: 'var(--grape-100)', color: 'var(--grape-600)', fontWeight: 800, fontSize: 'var(--text-2xs)', padding: '5px 11px', borderRadius: 'var(--radius-pill)' }}>+ {t}</span>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: '13px 16px', border: `2.5px solid ${INK}`, boxShadow: HARD(3, 4, 0.9) }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--ink-400)', marginBottom: 4 }}>You said:</div>
            <div style={{ fontWeight: 700, color: 'var(--ink-800)', fontSize: 'var(--text-sm)', lineHeight: 1.3 }}>{picked.text}</div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: strong ? '#effaf3' : '#fff', borderRadius: 12, padding: '14px 16px', border: `2.5px solid ${INK}`, boxShadow: HARD(3, 4, 0.9) }}>
            <Icon name={strong ? 'sparkles' : 'lightbulb'} size={20} color={strong ? 'var(--green-600)' : 'var(--sun-500)'} />
            <div style={{ fontSize: 'var(--text-md)', color: 'var(--ink-700)', fontWeight: 600, lineHeight: 1.45 }}>{picked.coaching || COACH_FALLBACK[picked.stars]}</div>
          </div>

          {picked.skillLearned && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, var(--grape-500), var(--grape-600))', borderRadius: 12, padding: '12px 16px', color: '#fff', border: `2.5px solid ${INK}`, boxShadow: HARD(3, 4, 0.9) }}>
              <Icon name="star" size={20} color="var(--sun-300)" />
              <div>
                <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85 }}>Skill learned</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-md)' }}>{picked.skillLearned}</div>
              </div>
            </div>
          )}

          {picked.tip && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FFF3D6', borderRadius: 12, padding: '12px 14px', border: `2.5px solid ${INK}`, boxShadow: HARD(3, 4, 0.9) }}>
              <Icon name="lightbulb" size={18} color="#7a5600" />
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#7a5600', lineHeight: 1.4 }}>{picked.tip}</div>
            </div>
          )}

          <Button variant="primary" size="lg" fullWidth onClick={cont} iconRight={<Icon name="arrow-right" size={18} color="#fff" />}>
            {picked.next === M.reflectionId ? 'See how it went' : 'Continue'}
          </Button>
        </div>
      </div>
    );
  }

  // ---------- Active beat: P3 comic panel ----------
  const isDialogue = !!beat.line;
  const mood = castMood(gender, beat);
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {header(true)}
      <div className="journey-dotbg" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', paddingBottom: 24 }}>
        {/* scene block straddles the color seam */}
        <div style={{ padding: '0 18px', position: 'relative', marginTop: -52, zIndex: 2 }}>
          {/* caption (narration) and/or speech balloon (dialogue) — comic ink style */}
          <div style={{ transform: 'rotate(-1.2deg)', marginBottom: -26, position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {beat.narration && !isDialogue && (
              <div style={{ background: '#FFF3D6', border: `2.5px solid ${INK}`, borderRadius: 8, padding: '10px 14px 11px', boxShadow: HARD(3, 4, 0.9) }}>
                <span style={{ display: 'inline-block', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: '#D2542F', marginBottom: 2 }}>{kickerFor(M.setting)}</span>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, lineHeight: 1.3, color: INK }}>{beat.narration}</div>
              </div>
            )}
            {isDialogue && (
              <>
                {beat.narration && (
                  <div style={{ background: '#FFF3D6', border: `2.5px solid ${INK}`, borderRadius: 8, padding: '8px 14px 9px', boxShadow: HARD(3, 4, 0.9) }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, lineHeight: 1.3, color: INK }}>{beat.narration}</div>
                  </div>
                )}
                <div style={{ position: 'relative', background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 8, padding: '10px 14px 11px', boxShadow: HARD(3, 4, 0.9) }}>
                  <span style={{ display: 'inline-block', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: '#2A8FD8', marginBottom: 2 }}>{actor} says</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, lineHeight: 1.3, color: INK, minHeight: '1.3em' }}>
                    “{shownLine}”{shownLine.length < (beat.line?.length ?? 0) && <span className="type-caret">▌</span>}
                  </div>
                  <span style={{ position: 'absolute', left: 30, bottom: -10, width: 16, height: 16, background: '#fff', borderRight: `2.5px solid ${INK}`, borderBottom: `2.5px solid ${INK}`, transform: 'rotate(45deg)' }} />
                </div>
              </>
            )}
          </div>

          {/* comic frame + sprout overlay */}
          <div style={{ position: 'relative' }}>
            <div ref={panelRef} style={{ position: 'relative', borderRadius: 20, minHeight: 248, border: `2.5px solid ${INK}`, boxShadow: HARD(6, 7), transform: 'rotate(.5deg)', background: '#fff', padding: 6 }}>
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', minHeight: 236 }}>
                <img src="/assets/journey/scene-bg.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'relative', minHeight: 236, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <span style={{ position: 'relative', marginBottom: -2, transform: 'translateX(-30px)' }}>
                    {actor && (
                      <span style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', zIndex: 3, fontSize: 11, fontWeight: 800, color: '#2A8FD8', whiteSpace: 'nowrap', background: 'rgba(255,255,255,.9)', padding: '1px 9px', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-sm)' }}>{actor}</span>
                    )}
                    {/* plays once, freezes on last frame (loop=1); remounts (replays) each beat */}
                    <img
                      key={`${beatId}-${gender}-${mood}`}
                      src={castClipUrl(gender, mood)}
                      alt=""
                      onError={(e) => { const img = e.currentTarget; if (!img.dataset.fb) { img.dataset.fb = '1'; img.src = castClipUrl(gender, 'idle'); } }}
                      style={{ display: 'block', height: 220, width: 'auto', objectFit: 'contain', objectPosition: 'bottom', filter: 'drop-shadow(0 10px 12px rgba(30,25,18,.30))' }}
                    />
                  </span>
                </div>
              </div>
            </div>

            {/* Sprout ("You") overlay — overhangs the frame bottom-right */}
            <div style={{ position: 'absolute', right: 0, bottom: -62, zIndex: 6, width: 176, height: 196 }}>
              <div style={{ position: 'absolute', top: 126, right: 166, zIndex: 3 }}>
                <div style={{ position: 'relative', background: '#7A5AD9', color: '#fff', borderRadius: 16, padding: '8px 14px', boxShadow: '0 6px 14px rgba(70,50,140,.30)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap' }}>
                  What do you do?
                  <div style={{ position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '10px solid #7A5AD9' }} />
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 26, left: '50%', transform: 'translateX(-50%)', zIndex: 0 }}><GrassPlatform w={90} /></div>
              <span style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 1, filter: 'drop-shadow(0 9px 11px rgba(30,25,18,.24))' }}>
                <Mascot mood={mascotMood} playKey={playKey} size={168} />
              </span>
              <span style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: 800, color: '#15724A', background: '#fff', padding: '1px 10px', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-sm)', whiteSpace: 'nowrap', zIndex: 2 }}>You</span>
            </div>
          </div>
        </div>

        {/* hand of cards */}
        <div style={{ marginTop: 44, paddingLeft: 22 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#756C61' }}>Swipe through your cards ←</span>
        </div>
        <CardRail
          choices={beat.choices}
          committing={committing}
          onPick={pick}
          onBrowse={() => { if (mascotMood === 'idle') celebrate('thinking'); }}
        />
      </div>
    </div>
  );
}

/** Swipeable overlapping "hand of cards" with snap + position pips (P3 spec). */
function CardRail({ choices, committing, onPick, onBrowse }: {
  choices: JourneyChoice[]; committing: string | null; onPick: (c: JourneyChoice) => void; onBrowse?: () => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(0);
  const PITCH = 212; // 244px slot − 32px overlap

  const onScroll = () => {
    const el = railRef.current;
    if (!el) return;
    const f = Math.max(0, Math.min(choices.length - 1, Math.round(el.scrollLeft / PITCH)));
    if (f !== focused) onBrowse?.();
    setFocused(f);
  };

  return (
    <>
      <div ref={railRef} onScroll={onScroll} className="card-rail" style={{ padding: '12px 0 8px' }}>
        <div style={{ flex: 'none', width: 'calc(50% - 122px)' }} />
        {choices.map((c, i) => {
          const isAction = c.text.trim().startsWith('(');
          const clean = c.text.trim().replace(/^["“'(]+|[)'"”]+$/g, '');
          const fontSize = clean.length > 100 ? 13.5 : clean.length > 75 ? 15 : 17;
          return (
            <div key={c.letter} style={{ flex: 'none', width: 244, height: 224, marginRight: -32, scrollSnapAlign: 'center', position: 'relative', zIndex: 10 - i }}>
              <button
                onClick={() => onPick(c)}
                className={committing === c.letter ? 'qcard-inner qcard-commit' : 'qcard-inner'}
                style={{
                  position: 'absolute', inset: '0 22px', background: '#fff', border: `2.5px solid ${INK}`, boxShadow: HARD(5, 6),
                  borderRadius: 20, padding: '16px 16px 40px', textAlign: 'left', cursor: 'pointer',
                  opacity: committing && committing !== c.letter ? 0.55 : 1,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: COIN[c.letter] ?? '#7A5AD9', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, display: 'grid', placeItems: 'center', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.15)' }}>{c.letter}</span>
                  <span style={{ fontSize: 12, color: '#D6C8F5' }}>✦ ✦</span>
                </span>
                <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize, color: INK, lineHeight: 1.32, marginTop: 12, fontStyle: isAction ? 'italic' : 'normal' }}>
                  {isAction ? clean : `“${clean}”`}
                </span>
                <span style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#A98BE8', letterSpacing: '.06em' }}>{isAction ? 'DO IT' : 'SAY IT'}</span>
                  <span style={{ fontSize: 12, color: '#D6C8F5' }}>{i + 1} / {choices.length}</span>
                </span>
              </button>
            </div>
          );
        })}
        <div style={{ flex: 'none', width: 'calc(50% - 90px)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, paddingTop: 2 }}>
        {choices.map((_, i) => (
          <span key={i} style={{ width: i === focused ? 18 : 7, height: 7, borderRadius: 4, background: i === focused ? '#7A5AD9' : '#EDE6FB', transition: 'all .2s' }} />
        ))}
      </div>
    </>
  );
}

/** Oval grass platform under Sprout (ported from the design reference's grassPlat). */
function GrassPlatform({ w }: { w: number }) {
  const h = Math.round(w * 0.46), cx = w / 2, cy = h * 0.5, rx = w * 0.46, ry = h * 0.34;
  const N = Math.max(9, Math.round(w / 10));
  const tufts = [];
  for (let i = 0; i < N; i++) {
    const t = Math.PI + ((i + 0.5) / N) * Math.PI;
    const ex = cx + rx * Math.cos(t), ey = cy + ry * Math.sin(t);
    const bw = Math.max(3, (rx * Math.PI) / N * 0.55), bh = 5 + (i % 3) * 3;
    tufts.push(<polygon key={i} points={`${(ex - bw).toFixed(1)},${(ey + 2).toFixed(1)} ${ex.toFixed(1)},${(ey - bh).toFixed(1)} ${(ex + bw).toFixed(1)},${(ey + 2).toFixed(1)}`} fill={i % 2 ? '#8FC96B' : '#73B84E'} />);
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <radialGradient id="gpJourney" cx="50%" cy="30%" r="78%">
          <stop offset="0" stopColor="#AEDB86" /><stop offset="1" stopColor="#5FA23F" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy + 2} rx={rx} ry={ry} fill="#4C8A32" />
      {tufts}
      <ellipse cx={cx} cy={cy} rx={rx - 2} ry={ry - 1.5} fill="url(#gpJourney)" />
      <ellipse cx={cx} cy={cy + ry * 0.35} rx={rx * 0.5} ry={ry * 0.4} fill="rgba(28,52,18,0.28)" />
    </svg>
  );
}
