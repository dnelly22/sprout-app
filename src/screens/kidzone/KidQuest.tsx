import { useApp } from '../../store/AppStore';
import { useChildEconomy } from '../../engine/selectors';
import { usePlan } from '../../engine/plan';
import { Icon } from '../../components/ds';
import { INK, SectionHead } from '../../components/pop';
import { REWARD, BOSS, LEVELS } from '../../engine/economy';
import { Mascot } from './Mascot';
import { sfx } from '../../audio/sfx';
import type { Child } from '../../types';
import type { AreaKey } from '../../constants/areas';
import type { GameKind } from './KidZone';

/**
 * Kid Zone · PLAY (design: "Play grid") — games big & first.
 * Slim level bar → Journey story hero + Quick Fire / Say It tiles → today's quest
 * → your worlds list → Boss Challenge → Real World Challenge.
 */
export function KidQuest({ child, onPlay, onOpenJourney, onBoss }: {
  child: Child;
  onPlay: (game: GameKind) => void;
  onOpenJourney: (area: AreaKey) => void;
  onBoss: () => void;
}) {
  const { dispatch } = useApp();
  const eco = useChildEconomy(child.id);
  const plan = usePlan();
  const gamesLocked = !plan.isPremium; // free tier: Quick Fire & Say It are Premium

  // level progress (stars within the current level band)
  const lvl = eco.level;
  const bandStart = LEVELS.find((l) => l.level === lvl.level)?.stars ?? 0;
  const bandEnd = lvl.next?.stars ?? bandStart + 1;
  const levelPct = Math.max(0, Math.min(100, Math.round(((child.stars - bandStart) / (bandEnd - bandStart)) * 100)));

  const startQuest = () => {
    sfx('pop');
    switch (eco.quest.def.kind) {
      case 'journey': onOpenJourney(eco.currentJourney); break;
      case 'quickfire2': onPlay('quickfire'); break;
      case 'sayit': onPlay('sayit'); break;
      case 'realworld': document.getElementById('rwc-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); break;
    }
  };

  return (
    <div style={{ padding: '0 0 26px' }}>
      {/* slim level hero bar */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ background: 'linear-gradient(150deg, var(--grape-500), var(--grape-600))', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 rgba(42,37,33,.85)', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 11 }}>
            <span style={{ display: 'grid', placeItems: 'end center', width: 60, height: 60, borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #EAF6E2, #BFE3CB)', border: `2.5px solid ${INK}`, overflow: 'hidden', flex: 'none', boxShadow: '0 4px 0 rgba(42,37,33,.3)' }}>
              <Mascot mood="idle" size={54} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#fff', lineHeight: 1.1 }}>{lvl.title}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--grape-100)', marginTop: 2 }}>Level {lvl.level}</div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '3px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: INK, flex: 'none' }}>
              <Icon name="star" size={13} color="var(--sun-500)" fill="var(--sun-500)" />{child.stars}
            </span>
          </div>
          <div style={{ height: 13, border: `2.5px solid ${INK}`, borderRadius: 8, background: 'rgba(255,255,255,.3)', overflow: 'hidden' }}>
            <div style={{ width: `${levelPct}%`, height: '100%', background: '#B5D95A' }} />
          </div>
        </div>
      </div>

      {/* pick a game — big Journey hero + 2 tiles */}
      <div data-tour="kid-games" style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="dices" tint="#E7F2FB">Pick a game</SectionHead>
        <button onClick={() => { sfx('pop'); onOpenJourney(eco.currentJourney); }} style={{ position: 'relative', overflow: 'hidden', width: '100%', textAlign: 'left', cursor: 'pointer', background: 'linear-gradient(140deg, var(--grape-400), var(--grape-600))', border: `2.5px solid ${INK}`, borderRadius: 22, boxShadow: '5px 6px 0 rgba(42,37,33,.85)', padding: 18, color: '#fff' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.2)', border: '2px solid rgba(255,255,255,.5)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10.5, letterSpacing: '.05em', padding: '3px 10px', borderRadius: 99 }}>
            <Icon name="gamepad-2" size={12} color="#fff" />STORY MODE
          </span>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginTop: 10 }}>Journey</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.9)', maxWidth: 190, lineHeight: 1.35 }}>Play through a real story, one choice at a time.</div>
          <span style={{ position: 'absolute', right: 16, bottom: 16, width: 52, height: 52, borderRadius: '50%', background: '#fff', border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', boxShadow: '2px 3px 0 rgba(42,37,33,.6)' }}>
            <Icon name="play" size={24} color="var(--grape-600)" />
          </span>
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          {([
            ['Quick Fire', 'zap', 'var(--sky-500)', '#E7F2FB', 'Fast rounds', () => onPlay('quickfire'), -0.5],
            ['Say It Out Loud', 'mic', 'var(--green-500)', 'var(--green-100)', 'Say it aloud', () => onPlay('sayit'), 0.5],
          ] as const).map(([label, icon, fc, tint, desc, go, tilt]) => (
            <button key={label} onClick={() => { sfx('pop'); go(); }} style={{ position: 'relative', textAlign: 'left', cursor: 'pointer', background: tint, border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: '3px 4px 0 var(--grape-300)', padding: 14, transform: `rotate(${tilt}deg)`, opacity: gamesLocked ? 0.92 : 1 }}>
              {gamesLocked && (
                <span style={{ position: 'absolute', top: 8, right: 8, display: 'inline-flex', alignItems: 'center', gap: 3, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '2px 7px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 8.5, color: 'var(--grape-600)' }}>
                  <Icon name="lock" size={9} color="var(--grape-600)" />PREMIUM
                </span>
              )}
              <span style={{ display: 'inline-grid', placeItems: 'center', width: 48, height: 48, borderRadius: 14, background: fc, border: `2.5px solid ${INK}`, boxShadow: '2px 2px 0 rgba(42,37,33,.5)' }}>
                <Icon name={icon} size={23} color="#fff" />
              </span>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: INK, marginTop: 9, lineHeight: 1.1 }}>{label}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', marginTop: 2 }}>{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* today's quest — mini row */}
      <div style={{ padding: '18px 20px 0' }}>
        <button onClick={eco.quest.done ? undefined : startQuest} style={{ width: '100%', textAlign: 'left', cursor: eco.quest.done ? 'default' : 'pointer', background: 'var(--sun-100)', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 rgba(42,37,33,.85)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 13 }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: '#fff', border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none', transform: 'rotate(-3deg)' }}>
            <Icon name={eco.quest.done ? 'check' : 'sprout'} size={22} color="var(--green-600)" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10.5, letterSpacing: '.06em', color: 'var(--green-600)' }}>TODAY’S QUEST</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: INK, lineHeight: 1.15 }}>{eco.quest.done ? 'Done — amazing!' : eco.quest.def.title}</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '3px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, color: 'var(--sun-600)', flex: 'none' }}>
            <Icon name="star" size={12} color="var(--sun-500)" />+{REWARD.dailyQuestBonus}
          </span>
        </button>
      </div>

      {/* your worlds */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="map" tint="var(--green-100)">Your worlds</SectionHead>
        <div style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 var(--grape-300)', padding: '5px 15px' }}>
          {eco.journeys.map((j, i) => {
            const done = j.level >= 5;
            const current = j.area === eco.currentJourney && !done;
            const started = j.activities > 0;
            return (
              <button key={j.area} onClick={() => { sfx('pop'); onOpenJourney(j.area); }} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderBottom: i < eco.journeys.length - 1 ? '2px dashed var(--grape-100)' : 'none' }}>
                <span style={{ width: 34, height: 34, borderRadius: 11, background: current ? 'var(--grape-500)' : done ? 'var(--green-500)' : j.color, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
                  <Icon name={done ? 'check' : j.icon} size={16} color="#fff" />
                </span>
                <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: INK }}>{j.kidWorld}</span>
                {done ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--green-100)', border: `2px solid ${INK}`, borderRadius: 99, padding: '2px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, color: 'var(--green-600)' }}><Icon name="check" size={10} color="var(--green-600)" />Done</span>
                ) : current ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 44, height: 8, border: `2px solid ${INK}`, borderRadius: 5, background: '#fff', overflow: 'hidden', display: 'inline-block' }}><span style={{ display: 'block', width: `${(j.level / 5) * 100}%`, height: '100%', background: 'var(--grape-500)' }} /></span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, color: 'var(--grape-600)' }}>Lv {j.level}</span>
                  </span>
                ) : started ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--sun-100)', border: `2px solid ${INK}`, borderRadius: 99, padding: '2px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, color: 'var(--sun-600)' }}><Icon name="play" size={9} color="var(--sun-600)" />Started</span>
                ) : (
                  <span style={{ background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '2px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, color: 'var(--ink-400)' }}>Not started</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* boss challenge */}
      <div style={{ padding: '18px 20px 0' }}>
        <div
          onClick={eco.boss.unlocked ? () => { sfx('enter'); onBoss(); } : undefined}
          style={{ background: 'linear-gradient(160deg, #463A66, #2A2521)', border: `2.5px solid ${INK}`, borderRadius: 22, boxShadow: '5px 6px 0 rgba(42,37,33,.85)', padding: 18, color: '#fff', position: 'relative', overflow: 'hidden', cursor: eco.boss.unlocked ? 'pointer' : 'default' }}
        >
          <span style={{ position: 'absolute', right: -10, top: -12, opacity: 0.14 }}><Icon name="trophy" size={110} color="#fff" /></span>
          <div style={{ position: 'relative' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--sun-500)', border: `2px solid ${INK}`, color: '#3A2A00', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, letterSpacing: '.07em', padding: '3px 11px', borderRadius: 99, transform: 'rotate(-1.5deg)' }}>
              <Icon name="trophy" size={13} color="#3A2A00" />BOSS CHALLENGE
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 13 }}>
              <span style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: eco.boss.unlocked ? '2.5px solid var(--sun-500)' : '2.5px dashed rgba(255,255,255,.45)', display: 'grid', placeItems: 'center', flex: 'none' }}>
                <Icon name={eco.boss.done ? 'crown' : eco.boss.unlocked ? 'trophy' : 'lock'} size={28} color={eco.boss.unlocked ? 'var(--sun-500)' : 'rgba(255,255,255,.85)'} />
              </span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, lineHeight: 1.15 }}>{BOSS.title}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.7)', marginTop: 3 }}>
                  {eco.boss.done ? 'You beat it! Play again for practice.' : eco.boss.unlocked ? 'Unlocked — tap to play!' : `Grow ${BOSS.need} Journeys to Level ${BOSS.minJourneyLevel} to unlock`}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 13 }}>
              {Array.from({ length: eco.boss.need }).map((_, i) => (
                <span key={i} style={{ flex: 1, height: 9, border: '2px solid rgba(255,255,255,.5)', borderRadius: 5, background: i < eco.boss.have ? 'var(--sun-500)' : 'transparent' }} />
              ))}
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, color: 'rgba(255,255,255,.8)', flex: 'none' }}>{eco.boss.have} / {eco.boss.need} journeys</span>
            </div>
          </div>
        </div>
      </div>

      {/* real world challenge */}
      <div id="rwc-card" style={{ padding: '18px 20px 0' }}>
        <div style={{ background: 'var(--green-100)', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 rgba(42,37,33,.85)', padding: '15px 16px' }}>
          <span style={{ display: 'inline-flex', transform: 'rotate(-1.2deg)', alignItems: 'center', gap: 6, background: '#fff', border: `2px solid ${INK}`, color: 'var(--sky-500)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, letterSpacing: '.07em', padding: '3px 11px', borderRadius: 99, boxShadow: '2px 3px 0 rgba(42,37,33,.5)' }}>
            <Icon name="globe" size={13} color="var(--sky-500)" />REAL WORLD CHALLENGE
          </span>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: INK, lineHeight: 1.2, marginTop: 10 }}>{eco.rwc.text}</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-500)', marginTop: 3 }}>
            {eco.rwc.status === 'verified' ? 'A grown-up confirmed it — amazing!' : 'A grown-up confirms it when you did it!'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 13 }}>
            {eco.rwc.status === 'new' && (
              <button onClick={() => { sfx('pop'); dispatch({ type: 'rwcSet', childId: child.id, status: 'trying' }); }} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 99, background: 'var(--green-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, padding: 11, boxShadow: '3px 4px 0 rgba(42,37,33,.85)', cursor: 'pointer' }}>I’ll try it!</button>
            )}
            {eco.rwc.status === 'trying' && (
              <button onClick={() => { sfx('star'); dispatch({ type: 'rwcSet', childId: child.id, status: 'did' }); }} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 99, background: 'var(--green-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, padding: 11, boxShadow: '3px 4px 0 rgba(42,37,33,.85)', cursor: 'pointer' }}>I did it! ✋</button>
            )}
            {eco.rwc.status === 'did' && (
              <div style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 99, background: '#fff', color: INK, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, padding: 11, textAlign: 'center' }}>Waiting for a grown-up… ⭐</div>
            )}
            {eco.rwc.status === 'verified' && (
              <div style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 99, background: 'var(--green-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, padding: 11, textAlign: 'center' }}>✓ Completed!</div>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '6px 12px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--sun-600)', flex: 'none' }}>
              <Icon name="star" size={13} color="var(--sun-500)" fill="var(--sun-500)" />+{REWARD.realworldDidIt}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
