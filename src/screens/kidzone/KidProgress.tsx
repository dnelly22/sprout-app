import { useEffect, useState } from 'react';
import { useChildEconomy } from '../../engine/selectors';
import { Icon, Sheet } from '../../components/ds';
import { INK, InkChip, SectionHead, StarRow } from '../../components/pop';
import { LEVELS } from '../../engine/economy';
import { Mascot, useMascotCelebrate, preloadMascots, type CelebrateMood } from './Mascot';
import { sfx } from '../../audio/sfx';
import type { Child } from '../../types';

/** Tapping the hero Sprout plays one of these, fading in, then settles to idle. */
const BUBBLE_MOODS: CelebrateMood[] = ['jump1', 'reading', 'surprised', 'sleeping'];

/**
 * Kid Zone · MY GROWTH — "Look how much stronger I've become."
 * Collectible hero → Next Unlock → Evolution Road → Communication Powers →
 * Power Toolkit → Badge Collection → Communication Journey → Statistics.
 */
export function KidProgress({ child }: { child: Child }) {
  const eco = useChildEconomy(child.id);
  const { mood, playKey, celebrate } = useMascotCelebrate();
  const [tool, setTool] = useState<(typeof eco.tools)[number] | null>(null);
  useEffect(() => { preloadMascots(BUBBLE_MOODS); }, []);

  const journeyName = eco.journeys.find((j) => j.area === eco.currentJourney)?.kidWorld ?? 'Friends';
  const roadIdx = eco.level.level - 1;

  return (
    <div style={{ padding: '0 0 26px' }}>
      {/* collectible hero card */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ background: 'linear-gradient(155deg, var(--grape-500), var(--grape-600))', border: `2.5px solid ${INK}`, borderRadius: 24, boxShadow: '5px 6px 0 rgba(42,37,33,.85)', padding: 8 }}>
          <div style={{ border: '2px dashed rgba(255,255,255,.4)', borderRadius: 17, padding: '16px 14px', textAlign: 'center', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 10, left: 12, color: 'var(--sun-300)', fontSize: 16 }}>✦</span>
            <span style={{ position: 'absolute', top: 22, right: 14, color: 'var(--sun-300)', fontSize: 12 }}>✦</span>
            <button
              onClick={() => { sfx('pop'); celebrate(BUBBLE_MOODS[Math.floor(Math.random() * BUBBLE_MOODS.length)]); }}
              aria-label="Poke Sprout"
              style={{ display: 'grid', placeItems: 'center', width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #EAF6E2, #BFE3CB)', border: `2.5px solid ${INK}`, overflow: 'hidden', margin: '0 auto', padding: 0, cursor: 'pointer' }}
            >
              <Mascot mood={mood} playKey={playKey} size={98} />
            </button>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#fff', marginTop: 10, lineHeight: 1.1 }}>{eco.level.title}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--grape-100)', marginTop: 2 }}>{child.name}’s Sprout · Level {eco.level.level}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginTop: 11, flexWrap: 'wrap' }}>
              <InkChip icon="star" iconColor="var(--sun-500)">{child.stars} stars</InkChip>
              <InkChip icon="flame" iconColor="var(--coral-600)">{eco.streak.current} day streak</InkChip>
              <InkChip icon="globe" iconColor="var(--sky-500)">{journeyName} Journey</InkChip>
            </div>
          </div>
        </div>
      </div>

      {/* next unlock */}
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ background: 'var(--sun-100)', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 rgba(42,37,33,.85)', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none', transform: 'rotate(-3deg)' }}>
              <Icon name={eco.next.icon} size={23} color="var(--coral-600)" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, letterSpacing: '.07em', color: 'var(--coral-600)' }}>NEXT UNLOCK</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: INK, lineHeight: 1.15 }}>{eco.next.label}</div>
            </div>
          </div>
          {eco.next.need > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 11 }}>
              <div style={{ flex: 1, height: 11, border: `2px solid ${INK}`, borderRadius: 7, background: '#fff', overflow: 'hidden' }}>
                <div style={{ width: `${(eco.next.have / eco.next.need) * 100}%`, height: '100%', background: 'var(--sun-500)' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, color: 'var(--sun-600)' }}>{eco.next.have} / {eco.next.need}</span>
            </div>
          )}
        </div>
      </div>

      {/* evolution road */}
      <div style={{ marginTop: 18 }}>
        <div style={{ padding: '0 20px' }}><SectionHead icon="trending-up" tint="var(--green-100)">Evolution road</SectionHead></div>
        <div className="card-rail" style={{ display: 'flex', overflowX: 'auto', padding: '12px 18px 10px', gap: 0 }}>
          {LEVELS.map((l, i) => {
            const st = i < roadIdx ? 'done' : i === roadIdx ? 'current' : 'next';
            const coinBg = st === 'done' ? 'var(--green-100)' : st === 'current' ? 'var(--sun-100)' : '#fff';
            return (
              <div key={l.level} style={{ display: 'flex', flex: 'none' }}>
                <div style={{ flex: 'none', width: 96, textAlign: 'center', background: st === 'current' ? 'var(--grape-100)' : '#fff', border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: '3px 4px 0 var(--grape-300)', padding: '12px 8px', position: 'relative', opacity: st === 'next' ? 0.85 : 1 }}>
                  {st === 'current' && (
                    <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%) rotate(-2deg)', background: 'var(--grape-500)', color: '#fff', border: `2px solid ${INK}`, borderRadius: 99, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 8.5, padding: '1px 8px', whiteSpace: 'nowrap', zIndex: 1 }}>YOU ARE HERE</span>
                  )}
                  <span style={{ display: 'inline-grid', placeItems: 'center', width: 44, height: 44, borderRadius: '50%', background: coinBg, border: `2px solid ${INK}`, fontSize: 22, lineHeight: 1 }}>{l.stage}</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: INK, lineHeight: 1.15, marginTop: 7 }}>{l.title}</div>
                  {st === 'done' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 8.5, color: 'var(--green-600)' }}>
                      <Icon name="check" size={10} color="var(--green-600)" />GROWN
                    </div>
                  )}
                  {st === 'current' && (
                    <div style={{ marginTop: 4, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 8.5, color: 'var(--grape-600)' }}>
                      {eco.level.toNext > 0 ? `${eco.level.toNext} ⭐ to next` : 'MAX'}
                    </div>
                  )}
                  {st === 'next' && <div style={{ marginTop: 4, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 8.5, color: 'var(--ink-400)' }}>{l.stars} ⭐</div>}
                </div>
                {i < LEVELS.length - 1 && <span style={{ alignSelf: 'center', flex: 'none', margin: '0 7px' }}><Icon name="arrow-right" size={16} color="var(--ink-400)" /></span>}
              </div>
            );
          })}
          <div style={{ flex: 'none', width: 8 }} />
        </div>
      </div>

      {/* communication powers */}
      <div style={{ padding: '14px 20px 0' }}>
        <SectionHead icon="zap" tint="var(--grape-100)">Communication powers</SectionHead>
        <div style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 var(--grape-300)', padding: '5px 16px' }}>
          {eco.journeys.map((j, i) => (
            <div key={j.area} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: i < eco.journeys.length - 1 ? '2px dashed var(--grape-100)' : 'none' }}>
              <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, color: INK }}>{j.kidWorld}</span>
              <StarRow n={j.level} />
              <span style={{ background: 'var(--grape-500)', color: '#fff', border: `2px solid ${INK}`, borderRadius: 99, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, padding: '2px 9px', flex: 'none' }}>Lv {j.level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* power toolkit */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="wrench" tint="#E7F2FB">Power toolkit</SectionHead>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {eco.tools.map((t, i) => (
            <button
              key={t.id}
              onClick={t.unlocked ? () => { sfx('pop'); setTool(t); } : undefined}
              style={{ background: '#fff', border: t.unlocked ? `2.5px solid ${INK}` : '2.5px dashed var(--ink-400)', borderRadius: 16, boxShadow: t.unlocked ? '3px 4px 0 var(--grape-300)' : 'none', opacity: t.unlocked ? 1 : 0.72, padding: 12, transform: `rotate(${i % 2 ? 0.4 : -0.4}deg)`, cursor: t.unlocked ? 'pointer' : 'default', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-grid', placeItems: 'center', width: 36, height: 36, borderRadius: 11, background: t.unlocked ? 'var(--grape-100)' : '#F1EDE6', border: `2px solid ${t.unlocked ? INK : 'var(--ink-400)'}` }}>
                  <Icon name={t.unlocked ? t.icon : 'lock'} size={17} color={t.unlocked ? 'var(--grape-600)' : 'var(--ink-400)'} />
                </span>
                {t.unlocked
                  ? <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9, color: 'var(--green-600)', background: 'var(--green-100)', border: `1.5px solid ${INK}`, borderRadius: 99, padding: '1px 7px' }}>UNLOCKED</span>
                  : <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9, color: 'var(--ink-400)' }}>{t.have}/{t.need}</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12.5, color: INK, lineHeight: 1.2, marginTop: 8 }}>{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* badge collection */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="award" tint="var(--sun-100)">Badge collection</SectionHead>
        <div style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 var(--grape-300)', padding: '15px 10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px 4px' }}>
            {eco.badges.map((b) => (
              <div key={b.key} style={{ textAlign: 'center' }} title={b.requirement}>
                {b.art ? (
                  <img
                    src={b.art}
                    alt={b.label}
                    width={52}
                    height={52}
                    draggable={false}
                    style={{ display: 'inline-block', width: 52, height: 52, objectFit: 'contain', filter: b.isEarned ? 'none' : 'grayscale(1)', opacity: b.isEarned ? 1 : 0.45 }}
                  />
                ) : (
                  <span style={{ display: 'inline-grid', placeItems: 'center', width: 46, height: 46, borderRadius: '50%', background: b.isEarned ? b.tint : '#F6F3EC', border: b.isEarned ? `2.5px solid ${INK}` : '2.5px dashed #C9C2B6', opacity: b.isEarned ? 1 : 0.65 }}>
                    <Icon name={b.isEarned ? b.icon : 'lock'} size={19} color={b.isEarned ? INK : 'var(--ink-400)'} />
                  </span>
                )}
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9.5, color: b.isEarned ? INK : 'var(--ink-400)', lineHeight: 1.15, marginTop: 5 }}>{b.label}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--grape-600)', marginTop: 12 }}>
            {eco.badgesEarned} of {eco.badges.length} collected — keep going!
          </div>
        </div>
      </div>

      {/* communication journey progress */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="map" tint="var(--green-100)">Communication journey</SectionHead>
        <div style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: '4px 5px 0 var(--grape-300)', padding: '5px 16px' }}>
          {eco.journeys.map((j, i) => (
            <div key={j.area} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: i < eco.journeys.length - 1 ? '2px dashed var(--grape-100)' : 'none' }}>
              <span style={{ width: 32, height: 32, borderRadius: 10, background: j.color, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
                <Icon name={j.icon} size={15} color="#fff" />
              </span>
              <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: INK }}>{j.kidWorld}</span>
              {j.level >= 5 ? (
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, color: 'var(--green-600)' }}>✓ Completed</span>
              ) : j.activities > 0 ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 64, height: 9, border: `2px solid ${INK}`, borderRadius: 5, background: '#fff', overflow: 'hidden', display: 'inline-block' }}>
                    <span style={{ display: 'block', width: `${Math.min(100, (j.completedScenarios.length / Math.max(1, j.totalScenarios)) * 100)}%`, height: '100%', background: j.color }} />
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, color: 'var(--ink-500)' }}>{j.completedScenarios.length}/{j.totalScenarios}</span>
                </span>
              ) : (
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, color: 'var(--ink-400)' }}>Not started</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* statistics */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="trending-up" tint="var(--grape-100)">My stats</SectionHead>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {([
            ['star', 'var(--sun-500)', child.stars, 'Stars'],
            ['flame', 'var(--coral-500)', eco.streak.current, 'Day streak'],
            ['map', 'var(--sky-500)', `${eco.stats.explored}/5`, 'Journeys'],
            ['gamepad-2', 'var(--grape-500)', eco.stats.journeys, 'Games'],
            ['zap', 'var(--sky-500)', eco.stats.quickfires, 'Quick Fires'],
            ['mic', 'var(--green-500)', eco.stats.sayits, 'Said aloud'],
          ] as const).map(([icon, color, value, label]) => (
            <div key={label} style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: '3px 4px 0 var(--grape-300)', padding: '10px 6px', textAlign: 'center' }}>
              <Icon name={icon} size={16} color={color} />
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: INK, marginTop: 2 }}>{value}</div>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--ink-400)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* tool detail */}
      <Sheet open={!!tool} onClose={() => setTool(null)} title={tool?.label ?? ''}>
        {tool && (
          <>
            <p style={{ marginTop: -4, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>{tool.hint}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {tool.steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#fff', border: `2px solid ${INK}`, borderRadius: 14, padding: '10px 13px', boxShadow: '2px 3px 0 var(--grape-300)' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--grape-500)', color: '#fff', border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, flex: 'none' }}>{i + 1}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: INK }}>{s}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}
