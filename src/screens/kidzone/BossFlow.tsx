import { useState } from 'react';
import type { Child } from '../../types';
import { JOURNEY_SCENARIOS } from '../../data/journeyScenarios';
import { JourneyGame } from './games/Journey';
import { BOSS, REWARD } from '../../engine/economy';
import { Icon } from '../../components/ds';
import { INK } from '../../components/pop';
import { sfx } from '../../audio/sfx';

/**
 * Boss Challenge — a special story played on HARD mode with boss framing.
 * The economy records it as kind 'boss' (75★ base, +25★ perfect) via the
 * `boss` prop on JourneyGame.
 */
export function BossFlow({ child, onExit }: { child: Child; onExit: () => void }) {
  const [playing, setPlaying] = useState(false);
  const scenario = JOURNEY_SCENARIOS.find((s) => s.id === BOSS.scenarioId) ?? JOURNEY_SCENARIOS[0];

  if (playing) {
    return <JourneyGame child={child} scenario={{ ...scenario, title: BOSS.title }} mode={BOSS.mode} boss onExit={onExit} />;
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg, #463A66, #2A2521)', padding: 24 }}>
      <button onClick={onExit} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: 'rgba(255,255,255,.8)', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
        <Icon name="arrow-left" size={18} color="rgba(255,255,255,.8)" /> Back
      </button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--sun-500)', border: `2px solid ${INK}`, color: '#3A2A00', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, letterSpacing: '.07em', padding: '4px 14px', borderRadius: 99, transform: 'rotate(-1.5deg)' }}>
          <Icon name="trophy" size={14} color="#3A2A00" />BOSS CHALLENGE
        </span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: '#fff', margin: '18px 0 0', lineHeight: 1.15 }}>{BOSS.title}</h1>
        <p style={{ color: 'rgba(255,255,255,.75)', fontWeight: 700, fontSize: 15, maxWidth: 300, margin: '12px 0 0', lineHeight: 1.5 }}>
          The toughest story yet — every skill you’ve learned, all in one adventure. No easy answers this time!
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '4px 12px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: 'var(--sun-600)' }}>
            <Icon name="star" size={13} color="var(--sun-500)" fill="var(--sun-500)" />+{REWARD.bossBase}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '4px 12px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: 'var(--grape-600)' }}>
            <Icon name="crown" size={13} color="var(--grape-500)" />+{REWARD.bossPerfect} perfect
          </span>
        </div>
      </div>
      <button
        onClick={() => { sfx('enter'); setPlaying(true); }}
        style={{ width: '100%', border: `2.5px solid ${INK}`, borderRadius: 99, background: 'var(--sun-500)', color: '#3A2A00', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, padding: 14, boxShadow: '4px 5px 0 rgba(0,0,0,.5)', cursor: 'pointer' }}
      >
        I’m ready — let’s go! 🏆
      </button>
    </div>
  );
}
