import { useState } from 'react';
import { Icon, IconButton } from '../../components/ds';
import { useSoundMaster } from '../../audio/MusicProvider';
import { MODE_META } from '../../data/journey';
import { journeyByCategory } from '../../data/journeyData';
import { JourneyGame } from './games/Journey';
import type { Child } from '../../types';
import type { JourneyArea, JourneyMode, JourneyScenario } from '../../types/journey';

/** Friends world → scenario list → difficulty picker → the Journey game. */
export function JourneyFlow({ child, category, worldName, color, onExit, freeScenarioId, onLocked }: {
  child: Child; category: JourneyArea; worldName: string; color: string; onExit: () => void;
  /** When set (free plan), only this scenario id is playable; others show a premium lock. */
  freeScenarioId?: string | null;
  onLocked?: () => void;
}) {
  const scenarios = journeyByCategory(category);
  const [scenario, setScenario] = useState<JourneyScenario | null>(null);
  const [mode, setMode] = useState<JourneyMode | null>(null);

  if (scenario && mode) {
    return <JourneyGame child={child} scenario={scenario} mode={mode} onExit={() => { setMode(null); setScenario(null); }} />;
  }

  return (
    <div style={{ paddingBottom: 28 }}>
      <Header
        title={scenario ? scenario.title : `${worldName} Quests`}
        onBack={() => (scenario ? setScenario(null) : onExit())}
      />
      {!scenario ? (
        <div style={{ padding: '4px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: '0 2px 4px', fontSize: 'var(--text-sm)', color: 'var(--ink-500)', fontWeight: 600 }}>
            {scenarios.length ? 'Pick a real-life moment to practice 🌱' : 'New quests are on the way!'}
          </p>
          {scenarios.map((s) => {
            const locked = !!freeScenarioId && s.id !== freeScenarioId;
            return (
              <button
                key={s.id}
                onClick={() => (locked ? onLocked?.() : setScenario(s))}
                style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', padding: 14, borderRadius: 'var(--radius-lg)', background: 'var(--surface)', border: '1.5px solid var(--grape-300)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', opacity: locked ? 0.75 : 1 }}
              >
                <span style={{ flex: 'none', width: 44, height: 44, borderRadius: 'var(--radius-md)', background: locked ? 'var(--ink-300, #C9C2B6)' : color, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-lg)' }}>
                  {locked ? <Icon name="lock" size={19} color="#fff" /> : s.index}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-md)', color: 'var(--ink-900)', lineHeight: 1.15 }}>{s.title}</span>
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--ink-500)', marginTop: 2 }}>{s.skill}</span>
                </span>
                {locked
                  ? <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, color: 'var(--grape-600)', background: 'var(--grape-100)', borderRadius: 99, padding: '3px 9px', flex: 'none' }}>PREMIUM</span>
                  : <Icon name="chevron-right" size={20} color="var(--grape-300)" />}
              </button>
            );
          })}
          {!scenarios.length && (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--ink-400)', fontWeight: 700 }}>
              <Icon name="sparkles" size={30} color="var(--grape-300)" />
              <div style={{ marginTop: 8 }}>More {worldName} scenarios coming soon!</div>
            </div>
          )}
        </div>
      ) : (
        <ModePicker scenario={scenario} color={color} onPick={setMode} />
      )}
    </div>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  const { anyOn, setAll } = useSoundMaster();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 8px' }}>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', color: 'var(--grape-600)', fontWeight: 800, cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
        <Icon name="arrow-left" size={20} color="var(--grape-600)" /> Back
      </button>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--grape-600)', fontSize: 'var(--text-md)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 190, textAlign: 'center' }}>{title}</div>
      <IconButton variant="soft" label={anyOn ? 'Mute sound' : 'Play sound'} onClick={() => setAll(!anyOn)}>
        <Icon name={anyOn ? 'volume-2' : 'volume-x'} size={20} color="var(--grape-600)" />
      </IconButton>
    </div>
  );
}

function ModePicker({ scenario, color, onPick }: { scenario: JourneyScenario; color: string; onPick: (m: JourneyMode) => void }) {
  return (
    <div style={{ padding: '4px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', border: '1.5px solid var(--grape-300)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: color, color: '#fff', fontWeight: 800, fontSize: 'var(--text-2xs)', padding: '4px 11px', borderRadius: 'var(--radius-pill)', marginBottom: 8 }}>
          <Icon name="target" size={13} color="#fff" />{scenario.skill}
        </div>
        <p style={{ margin: 0, fontFamily: 'var(--font-read)', fontSize: 'var(--text-md)', color: 'var(--ink-700)', lineHeight: 1.5 }}>{scenario.whyItMatters}</p>
      </div>

      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--grape-600)', marginTop: 2 }}>Choose your level</div>
      {(['easy', 'medium', 'hard'] as JourneyMode[]).map((m) => {
        const meta = MODE_META[m];
        const md = scenario.modes[m];
        return (
          <button
            key={m}
            onClick={() => onPick(m)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', padding: 14, borderRadius: 'var(--radius-lg)', background: 'var(--surface)', border: `2px solid ${meta.color}`, boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 26 }}>{meta.dot}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-md)', color: 'var(--ink-900)' }}>{meta.label}</span>
              {md?.label && md.label !== meta.label && (
                <span style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--ink-500)', marginTop: 1 }}>“{md.label}”</span>
              )}
            </span>
            <Icon name="play" size={18} color={meta.color} />
          </button>
        );
      })}
    </div>
  );
}
