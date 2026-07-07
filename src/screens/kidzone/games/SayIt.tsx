import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../../store/AppStore';
import { sayItRound } from '../../../data/drills';
import { areaColor, areaParentLabel } from '../../../constants/areas';
import { Button, Icon } from '../../../components/ds';
import { StarPop } from '../KidFace';
import { Mascot, useMascotCelebrate, preloadMascots } from '../Mascot';
import { burstConfetti } from '../confetti';
import { sfx } from '../../../audio/sfx';
import type { Child } from '../../../types';

interface Props { child: Child; onExit: () => void }

export function SayItGame({ child }: Props) {
  const { dispatch } = useApp();
  const [lines] = useState(() => sayItRound(10));
  const [n, setN] = useState(0);
  const [variant, setVariant] = useState(0);
  const [listening, setListening] = useState(false);
  const [said, setSaid] = useState(false);
  const awarded = useRef(false); // one economy award (15★) per session
  const saidMascotRef = useRef<HTMLDivElement>(null);
  const { mood: celebMood, playKey, celebrate } = useMascotCelebrate();

  const item = lines[n];
  const allLines = [item.line, ...item.alts];
  const current = allLines[variant];

  // Warm the jump animations so the first celebrate doesn't flicker.
  useEffect(() => { preloadMascots(); }, []);

  // When they say it out loud, the mascot plays its full jump (then settles to
  // idle on its own) + confetti.
  useEffect(() => {
    if (said) { celebrate('jump1'); sfx('cheer'); burstConfetti(saidMascotRef.current, 24); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [said]);

  const mic = () => {
    sfx('pop');
    setListening(true);
    setTimeout(() => setListening(false), 1800);
  };
  const confirmSaid = () => {
    if (!awarded.current) {
      awarded.current = true;
      dispatch({ type: 'recordActivity', input: { childId: child.id, kind: 'sayit', area: item.area, scenarioId: item.id } });
    }
    setSaid(true);
  };
  const nextSetup = () => {
    setN((n + 1) % lines.length); setVariant(0); setSaid(false); setListening(false);
  };

  if (said) {
    return (
      <div style={{ padding: '8px 20px 28px', display: 'flex', flexDirection: 'column', gap: 18, minHeight: '100%', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div ref={saidMascotRef} style={{ display: 'inline-block' }}><Mascot mood={celebMood} playKey={playKey} size={104} /></div>
          <h1 style={{ fontSize: 'var(--text-3xl)', color: 'var(--green-600)', marginTop: 10 }}>You said it! 🎉</h1>
          <div style={{ marginTop: 12 }}><StarPop amount={15} /></div>
          <p style={{ color: 'var(--ink-700)', fontWeight: 600, fontSize: 'var(--text-md)', maxWidth: 280, margin: '14px auto 0' }}>
            Saying it out loud makes it easier in real life. Your voice did the brave part!
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="soft" size="lg" onClick={() => setSaid(false)} style={{ flex: 1 }}>Say it again</Button>
          <Button variant="primary" size="lg" onClick={nextSetup} iconRight={<Icon name="arrow-right" size={18} color="#fff" />} style={{ flex: 1 }}>New line</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '6px 20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-block' }}><Mascot mood="idle" size={84} /></div>
        <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 800, color: areaColor(item.area), textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 10 }}>{areaParentLabel(item.area)}</div>
        <p style={{ fontWeight: 700, color: 'var(--ink-700)', fontSize: 'var(--text-md)', margin: '4px auto 0', maxWidth: 300 }}>{item.setup}</p>
      </div>

      <div style={{ position: 'relative', textAlign: 'center', padding: '26px 18px', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(150deg, var(--grape-100), var(--sky-100))', border: '2px dashed var(--grape-300)' }}>
        <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 800, color: 'var(--grape-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Your line</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-3xl)', color: 'var(--ink-900)', lineHeight: 1.1 }}>“{current}”</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'center', background: 'var(--sun-100)', borderRadius: 'var(--radius-pill)', padding: '8px 16px' }}>
        <Icon name="volume-2" size={18} color="#7a5600" />
        <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color: '#7a5600' }}>{item.cue}</span>
      </div>

      <div>
        <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 800, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8, textAlign: 'center' }}>Make it yours</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {allLines.map((l, idx) => {
            const on = idx === variant;
            return (
              <button
                key={idx}
                onClick={() => setVariant(idx)}
                style={{
                  padding: '9px 14px', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontWeight: 800, fontSize: 'var(--text-sm)',
                  border: on ? '1.5px solid transparent' : '1.5px solid var(--grape-300)',
                  background: on ? 'var(--grape-500)' : 'var(--surface)', color: on ? '#fff' : 'var(--ink-700)',
                }}
              >
                {idx === 0 ? '⭐ ' : ''}{l}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={mic} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
        <span
          className={listening ? 'mic-live' : ''}
          style={{
            width: 88, height: 88, borderRadius: '50%', display: 'grid', placeItems: 'center',
            background: listening ? 'var(--coral-500)' : 'linear-gradient(150deg, var(--grape-400), var(--grape-600))',
            boxShadow: listening ? '0 0 0 10px rgba(232,93,76,0.18)' : '0 10px 24px rgba(98,66,188,0.35)',
          }}
        >
          <Icon name="mic" size={38} color="#fff" />
        </span>
        <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color: listening ? 'var(--coral-600)' : 'var(--grape-600)' }}>
          {listening ? 'Listening… go!' : 'Say it out loud'}
        </span>
      </button>

      <Button variant="primary" size="lg" fullWidth onClick={confirmSaid} iconLeft={<Icon name="star" size={20} color="#fff" />}>I said it!</Button>
    </div>
  );
}
