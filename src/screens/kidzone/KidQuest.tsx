import { useState } from 'react';
import { useApp } from '../../store/AppStore';
import { useChildEconomy } from '../../engine/selectors';
import { Icon, Sheet } from '../../components/ds';
import { INK, InkChip, InkBar, ArrowCoin, SectionHead } from '../../components/pop';
import { REWARD, BOSS } from '../../engine/economy';
import { AREAS } from '../../constants/areas';
import { Mascot } from './Mascot';
import { sfx } from '../../audio/sfx';
import type { Child } from '../../types';
import type { AreaKey } from '../../constants/areas';
import type { GameKind } from './KidZone';

/**
 * Kid Zone · QUEST — "What do I do today?"
 * Hero → Today's Quest → Continue Playing → Pick a game → Weekly Adventure →
 * Boss Challenge (the only locked thing) → Real World Challenge.
 */
export function KidQuest({ child, onPlay, onOpenJourney, onBoss }: {
  child: Child;
  onPlay: (game: GameKind) => void;
  onOpenJourney: (area: AreaKey) => void;
  onBoss: () => void;
}) {
  const { dispatch } = useApp();
  const eco = useChildEconomy(child.id);
  const [worldsOpen, setWorldsOpen] = useState(false);
  const journeyLabel = AREAS.find((a) => a.key === eco.currentJourney);
  const curJourney = eco.journeys.find((j) => j.area === eco.currentJourney);

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
      {/* hero */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 var(--grape-300)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', flex: 'none' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 88, height: 88, borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #EAF6E2, #BFE3CB)', border: `2.5px solid ${INK}`, overflow: 'hidden' }}>
              <Mascot mood="idle" size={78} />
            </span>
            <span style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', background: 'var(--grape-500)', color: '#fff', border: `2px solid ${INK}`, borderRadius: 99, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, padding: '1px 9px', whiteSpace: 'nowrap' }}>Lv {eco.level.level}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: INK, lineHeight: 1.1 }}>Hi {child.name}!</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-500)', marginTop: 2 }}>{eco.level.title} · ready for today’s quest?</div>
            <div style={{ display: 'flex', gap: 7, marginTop: 9, flexWrap: 'wrap' }}>
              <InkChip icon="star" iconColor="var(--sun-500)" bg="var(--sun-100)">{child.stars}</InkChip>
              <InkChip icon="flame" iconColor="var(--coral-600)" bg="#FBE3D8">{eco.streak.current} days</InkChip>
            </div>
          </div>
        </div>
      </div>

      {/* today's quest */}
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ background: 'var(--sun-100)', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 rgba(42,37,33,.85)', padding: '15px 16px' }}>
          <span style={{ display: 'inline-flex', transform: 'rotate(-1.2deg)', alignItems: 'center', gap: 6, background: '#fff', border: `2px solid ${INK}`, color: 'var(--green-600)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, letterSpacing: '.07em', padding: '3px 11px', borderRadius: 99, boxShadow: '2px 3px 0 rgba(42,37,33,.5)' }}>
            <Icon name="sprout" size={13} color="var(--green-600)" />TODAY’S QUEST
          </span>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: INK, lineHeight: 1.15, marginTop: 10 }}>{eco.quest.def.title}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-500)', marginTop: 2 }}>{eco.quest.def.sub}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, color: 'var(--ink-500)' }}>REWARD</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '2px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, color: 'var(--sun-600)' }}>
              <Icon name="star" size={12} color="var(--sun-500)" fill="var(--sun-500)" />+{REWARD.dailyQuestBonus}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '2px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, color: 'var(--green-600)' }}>
              <Icon name="sprout" size={12} color="var(--green-500)" />Growth
            </span>
          </div>
          {eco.quest.done ? (
            <div style={{ width: '100%', border: `2.5px solid ${INK}`, borderRadius: 99, background: 'var(--green-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, padding: 12, marginTop: 13, textAlign: 'center' }}>
              ✓ Quest complete — amazing!
            </div>
          ) : (
            <button onClick={startQuest} style={{ width: '100%', border: `2.5px solid ${INK}`, borderRadius: 99, background: 'var(--grape-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, padding: 12, marginTop: 13, boxShadow: '4px 5px 0 rgba(42,37,33,.9)', cursor: 'pointer' }}>
              Start Quest!
            </button>
          )}
        </div>
      </div>

      {/* continue playing */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="play" tint="var(--grape-100)">
          {eco.parentRecommended ? 'Mom & Dad recommended' : 'Continue playing'}
        </SectionHead>
        <div onClick={() => onOpenJourney(eco.currentJourney)} style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 var(--grape-300)', padding: '14px 15px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--grape-100)', border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
              <Icon name="gamepad-2" size={22} color="var(--grape-600)" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--ink-400)', letterSpacing: '.05em' }}>JOURNEY · {journeyLabel?.kidWorld.toUpperCase()}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16.5, color: INK }}>{journeyLabel?.kidWorld} World</div>
            </div>
            <ArrowCoin />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 11 }}>
            <InkBar striped pct={((curJourney?.level ?? 0) / 5) * 100} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--grape-600)' }}>Lv {curJourney?.level ?? 0} / 5</span>
          </div>
        </div>
      </div>

      {/* pick a game */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="gamepad-2" tint="#E7F2FB">Pick a game</SectionHead>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {([
            ['Journey', 'gamepad-2', 'var(--grape-100)', 'var(--grape-600)', () => setWorldsOpen(true), -0.6],
            ['Quick Fire', 'zap', '#E7F2FB', 'var(--sky-500)', () => onPlay('quickfire'), 0],
            ['Say It Out Loud', 'mic', 'var(--green-100)', 'var(--green-600)', () => onPlay('sayit'), 0.6],
          ] as const).map(([label, icon, bg, color, go, tilt]) => (
            <button key={label} onClick={() => { sfx('pop'); go(); }} style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: '3px 4px 0 var(--grape-300)', padding: '12px 8px', textAlign: 'center', transform: `rotate(${tilt}deg)`, cursor: 'pointer' }}>
              <span style={{ display: 'inline-grid', placeItems: 'center', width: 42, height: 42, borderRadius: '50%', background: bg, border: `2px solid ${INK}` }}>
                <Icon name={icon} size={20} color={color} />
              </span>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: INK, lineHeight: 1.15, marginTop: 7 }}>{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* weekly adventure */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="calendar-heart" tint="var(--sun-100)">Weekly adventure</SectionHead>
        <div style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 var(--grape-300)', padding: '13px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {eco.weekly.rows.map((r) => (
              <div key={r.kind} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${INK}`, background: r.have >= r.need ? 'var(--green-500)' : '#fff', display: 'grid', placeItems: 'center', flex: 'none' }}>
                  {r.have >= r.need && <Icon name="check" size={12} color="#fff" strokeWidth={3.5} />}
                </span>
                <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: r.have >= r.need ? 'var(--ink-400)' : INK, textDecoration: r.have >= r.need ? 'line-through' : 'none' }}>{r.label}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--grape-600)' }}>{r.have}/{r.need}</span>
              </div>
            ))}
          </div>
          {eco.weekly.done && !eco.weekly.claimed ? (
            <button
              onClick={() => { sfx('cheer'); dispatch({ type: 'claimWeekly', childId: child.id }); }}
              style={{ width: '100%', border: `2.5px solid ${INK}`, borderRadius: 99, background: 'var(--sun-500)', color: '#3A2A00', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, padding: 11, marginTop: 12, boxShadow: '3px 4px 0 rgba(42,37,33,.85)', cursor: 'pointer' }}
            >
              Claim +{REWARD.weeklyAdventure} stars! 🎉
            </button>
          ) : eco.weekly.claimed ? (
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--green-600)', marginTop: 11 }}>✓ Claimed — new adventure Monday!</div>
          ) : (
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--ink-400)', marginTop: 11 }}>
              Finish all four for +{REWARD.weeklyAdventure} ⭐
            </div>
          )}
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
              <button onClick={() => { sfx('pop'); dispatch({ type: 'rwcSet', childId: child.id, status: 'trying' }); }} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 99, background: 'var(--green-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, padding: 11, boxShadow: '3px 4px 0 rgba(42,37,33,.85)', cursor: 'pointer' }}>
                I’ll try it!
              </button>
            )}
            {eco.rwc.status === 'trying' && (
              <button onClick={() => { sfx('star'); dispatch({ type: 'rwcSet', childId: child.id, status: 'did' }); }} style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 99, background: 'var(--green-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, padding: 11, boxShadow: '3px 4px 0 rgba(42,37,33,.85)', cursor: 'pointer' }}>
                I did it! ✋
              </button>
            )}
            {eco.rwc.status === 'did' && (
              <div style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 99, background: '#fff', color: INK, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, padding: 11, textAlign: 'center' }}>
                Waiting for a grown-up… ⭐
              </div>
            )}
            {eco.rwc.status === 'verified' && (
              <div style={{ flex: 1, border: `2.5px solid ${INK}`, borderRadius: 99, background: 'var(--green-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, padding: 11, textAlign: 'center' }}>
                ✓ Completed!
              </div>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '6px 12px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--sun-600)', flex: 'none' }}>
              <Icon name="star" size={13} color="var(--sun-500)" fill="var(--sun-500)" />
              {eco.rwc.status === 'verified' ? `+${REWARD.realworldDidIt + REWARD.realworldVerify}` : `+${REWARD.realworldDidIt}`}
            </span>
          </div>
        </div>
      </div>

      {/* world picker */}
      <Sheet open={worldsOpen} onClose={() => setWorldsOpen(false)} title="Pick a world 🌍">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {eco.journeys.map((j) => (
            <button
              key={j.area}
              onClick={() => { setWorldsOpen(false); sfx('enter'); onOpenJourney(j.area); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: '2px 3px 0 var(--grape-300)', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ width: 40, height: 40, borderRadius: 12, background: j.color, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
                <Icon name={j.icon} size={19} color="#fff" />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: INK }}>{j.kidWorld}</span>
                <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-500)' }}>
                  {j.activities === 0 ? 'Not started' : `Level ${j.level} · ${j.activities} activities`}
                </span>
              </span>
              <ArrowCoin color={j.color} size={30} />
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
