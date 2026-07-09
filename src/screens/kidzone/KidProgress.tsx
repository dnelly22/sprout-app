import { useEffect, useState } from 'react';
import { useChildEconomy } from '../../engine/selectors';
import { Icon, Sheet } from '../../components/ds';
import { INK, SectionHead, StarRow } from '../../components/pop';
import { LEVELS } from '../../engine/economy';
import { Mascot, useMascotCelebrate, preloadMascots, type CelebrateMood } from './Mascot';
import { sfx } from '../../audio/sfx';
import type { Child } from '../../types';

/** Tapping the hero Sprout plays one of these, fading in, then settles to idle. */
const BUBBLE_MOODS: CelebrateMood[] = ['jump1', 'reading', 'surprised', 'sleeping'];

/**
 * Kid Zone · MY GROWTH (design: "Growth — Sprout card").
 * Collectible Sprout card (mascot + level bar + stat tiles) → Next Unlock →
 * Journey Map → colour-coded Powers, Toolkit, Badges, and Communication Journey.
 */
export function KidProgress({ child }: { child: Child }) {
  const eco = useChildEconomy(child.id);
  const { mood, playKey, celebrate } = useMascotCelebrate();
  const [tool, setTool] = useState<(typeof eco.tools)[number] | null>(null);
  useEffect(() => { preloadMascots(BUBBLE_MOODS); }, []);

  const roadIdx = eco.level.level - 1;
  const bandStart = LEVELS.find((l) => l.level === eco.level.level)?.stars ?? 0;
  const bandEnd = eco.level.next?.stars ?? bandStart;
  const levelPct = bandEnd > bandStart ? Math.max(0, Math.min(100, Math.round(((child.stars - bandStart) / (bandEnd - bandStart)) * 100))) : 100;

  return (
    <div style={{ padding: '0 0 26px' }}>
      {/* collectible Sprout card */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ background: 'linear-gradient(155deg, var(--grape-500), var(--grape-600))', border: `2.5px solid ${INK}`, borderRadius: 24, boxShadow: '5px 6px 0 rgba(42,37,33,.85)', padding: 8 }}>
          <div style={{ border: '2px dashed rgba(255,255,255,.4)', borderRadius: 17, padding: '14px 14px 16px', textAlign: 'center', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 10, left: 12, color: 'var(--sun-300)', fontSize: 16 }}>✦</span>
            <span style={{ position: 'absolute', top: 22, right: 14, color: 'var(--sun-300)', fontSize: 12 }}>✦</span>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={() => { sfx('pop'); celebrate(BUBBLE_MOODS[Math.floor(Math.random() * BUBBLE_MOODS.length)]); }}
                aria-label="Poke Sprout"
                style={{ display: 'grid', placeItems: 'center', width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #EAF6E2, #BFE3CB)', border: `3px solid ${INK}`, overflow: 'hidden', margin: '0 auto', padding: 0, cursor: 'pointer', boxShadow: '0 5px 0 rgba(42,37,33,.3)' }}
              >
                <Mascot mood={mood} playKey={playKey} size={116} />
              </button>
              <span style={{ position: 'absolute', top: 2, right: -12, background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 99, padding: '5px 12px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--grape-600)', boxShadow: '2px 2px 0 rgba(42,37,33,.4)' }}>Tap me! 👋</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#fff', marginTop: 8, lineHeight: 1.1 }}>{eco.level.title}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--grape-100)', marginTop: 2 }}>{child.name}’s Sprout · Level {eco.level.level}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <div style={{ flex: 1, height: 14, border: `2.5px solid ${INK}`, borderRadius: 8, background: 'rgba(255,255,255,.3)', overflow: 'hidden' }}>
                <div style={{ width: `${levelPct}%`, height: '100%', background: '#B5D95A' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10.5, color: '#fff', whiteSpace: 'nowrap' }}>{child.stars} / {bandEnd || child.stars}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginTop: 13 }}>
              {([
                ['star', 'var(--sun-500)', child.stars, 'Stars'],
                ['flame', 'var(--coral-500)', eco.streak.current, 'Streak'],
                ['map', 'var(--sky-500)', `${eco.stats.explored}/5`, 'Journeys'],
              ] as const).map(([icon, bg, value, label]) => (
                <div key={label} style={{ background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 14, boxShadow: '2px 3px 0 rgba(42,37,33,.5)', padding: '10px 6px' }}>
                  <span style={{ display: 'inline-grid', placeItems: 'center', width: 30, height: 30, borderRadius: '50%', background: bg, border: `2px solid ${INK}` }}>
                    <Icon name={icon} size={15} color="#fff" />
                  </span>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: INK, marginTop: 4 }}>{value}</div>
                  <div style={{ fontSize: 8.5, fontWeight: 800, color: 'var(--ink-700)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
                </div>
              ))}
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
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16.5, color: INK, lineHeight: 1.15 }}>{eco.next.label}</div>
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

      {/* journey map — stepping stones */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="map" tint="var(--grape-100)">Journey map</SectionHead>
        <div style={{ background: 'var(--grape-100)', border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: '4px 5px 0 var(--grape-300)', padding: '16px 8px' }}>
          <div className="card-rail" style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto' }}>
            {LEVELS.map((l, i) => {
              const st = i < roadIdx ? 'done' : i === roadIdx ? 'current' : 'next';
              const bg = st === 'done' ? 'var(--green-500)' : st === 'current' ? 'var(--grape-500)' : '#fff';
              return (
                <div key={l.level} style={{ display: 'flex', alignItems: 'flex-start', flex: 'none' }}>
                  <div style={{ width: 76, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: st === 'next' ? 0.7 : 1 }}>
                    <span style={{ position: 'relative', width: 58, height: 58, borderRadius: '50%', background: bg, border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', fontSize: 26, lineHeight: 1, boxShadow: st === 'current' ? '0 0 0 4px var(--sun-300), 2px 3px 0 rgba(42,37,33,.4)' : '2px 3px 0 rgba(42,37,33,.4)' }}>
                      {l.stage}
                      {st === 'done' && (
                        <span style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: '50%', background: 'var(--green-600)', border: '2px solid #fff', display: 'grid', placeItems: 'center' }}>
                          <Icon name="check" size={12} color="#fff" />
                        </span>
                      )}
                    </span>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, color: INK, lineHeight: 1.1, marginTop: 6, textAlign: 'center' }}>{l.title}</div>
                  </div>
                  {i < LEVELS.length - 1 && <span style={{ flex: 'none', alignSelf: 'flex-start', marginTop: 20 }}><Icon name="arrow-right" size={18} color="var(--grape-500)" /></span>}
                </div>
              );
            })}
            <div style={{ flex: 'none', width: 8 }} />
          </div>
        </div>
      </div>

      {/* communication powers — colour-coded 2-col */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="wand-sparkles" tint="var(--grape-100)">Communication powers</SectionHead>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
          {eco.journeys.map((j) => (
            <div key={j.area} style={{ background: `color-mix(in srgb, ${j.color} 15%, white)`, border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: `3px 4px 0 color-mix(in srgb, ${j.color} 45%, white)`, padding: '12px 13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 32, height: 32, borderRadius: 10, background: j.color, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
                  <Icon name={j.icon} size={16} color="#fff" />
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: INK }}>{j.kidWorld}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 }}>
                <StarRow n={j.level} size={13} />
                <span style={{ background: j.color, color: '#fff', border: `2px solid ${INK}`, borderRadius: 99, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, padding: '1px 8px' }}>Lv {j.level}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* power toolkit — colour-coded pills */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="wrench" tint="#E7F2FB">Power toolkit</SectionHead>
        <div style={{ background: '#E7F2FB', border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: '4px 5px 0 #BFE0F5', padding: 13, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {eco.tools.map((t, i) => {
            const tint = ['var(--green-500)', 'var(--coral-500)', 'var(--sky-500)', 'var(--grape-500)', 'var(--sun-500)'][i % 5];
            return (
              <button key={t.id} onClick={t.unlocked ? () => { sfx('pop'); setTool(t); } : undefined} style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#fff', border: t.unlocked ? `2px solid ${INK}` : '2px dashed var(--ink-400)', borderRadius: 13, padding: 10, opacity: t.unlocked ? 1 : 0.72, cursor: t.unlocked ? 'pointer' : 'default', textAlign: 'left' }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: t.unlocked ? tint : '#F1EDE6', border: `2px solid ${t.unlocked ? INK : 'var(--ink-400)'}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
                  <Icon name={t.unlocked ? t.icon : 'lock'} size={16} color={t.unlocked ? '#fff' : 'var(--ink-400)'} />
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11.5, color: INK, lineHeight: 1.15 }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* badge collection — sun container + art */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="award" tint="var(--sun-100)">Badge collection</SectionHead>
        <div style={{ background: 'var(--sun-100)', border: `2.5px solid ${INK}`, borderRadius: 18, boxShadow: '4px 5px 0 var(--sun-300)', padding: '15px 10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px 4px' }}>
            {eco.badges.map((b, i) => (
              <div key={b.key} style={{ textAlign: 'center', opacity: b.isEarned ? 1 : 0.5 }} title={b.requirement}>
                {b.art ? (
                  <img src={b.art} alt={b.label} width={48} height={48} draggable={false} style={{ display: 'inline-block', width: 48, height: 48, objectFit: 'contain', transform: `rotate(${i % 2 ? 3 : -3}deg)`, filter: b.isEarned ? 'none' : 'grayscale(1)' }} />
                ) : (
                  <span style={{ display: 'inline-grid', placeItems: 'center', width: 48, height: 48, borderRadius: '50%', background: b.isEarned ? b.tint : '#F1EDE6', border: b.isEarned ? `2.5px solid ${INK}` : '2.5px dashed var(--ink-400)', transform: `rotate(${i % 2 ? 3 : -3}deg)` }}>
                    <Icon name={b.isEarned ? b.icon : 'lock'} size={b.isEarned ? 21 : 15} color={b.isEarned ? INK : 'var(--ink-400)'} />
                  </span>
                )}
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, color: INK, lineHeight: 1.1, marginTop: 5 }}>{b.label}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 12, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, color: 'var(--sun-600)' }}>{eco.badgesEarned} of {eco.badges.length} collected — keep going!</div>
        </div>
      </div>

      {/* communication journey — colour-coded rows */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionHead icon="book-open" tint="var(--green-100)">Communication journey</SectionHead>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {eco.journeys.map((j) => {
            const done = j.level >= 5;
            const current = j.area === eco.currentJourney && !done;
            const started = j.activities > 0;
            return (
              <div key={j.area} style={{ display: 'flex', alignItems: 'center', gap: 11, background: `color-mix(in srgb, ${j.color} 15%, white)`, border: `2.5px solid ${INK}`, borderRadius: 14, boxShadow: '2px 3px 0 rgba(42,37,33,.4)', padding: '10px 12px' }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: j.color, border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
                  <Icon name={j.icon} size={16} color="#fff" />
                </span>
                <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: INK }}>{j.kidWorld}</span>
                {done ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '2px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, color: 'var(--green-600)' }}><Icon name="check" size={10} color="var(--green-600)" />Completed</span>
                ) : current ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 44, height: 8, border: `2px solid ${INK}`, borderRadius: 5, background: '#fff', overflow: 'hidden', display: 'inline-block' }}><span style={{ display: 'block', width: `${Math.min(100, (j.completedScenarios.length / Math.max(1, j.totalScenarios)) * 100)}%`, height: '100%', background: 'var(--sky-500)' }} /></span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, color: '#1E73B4' }}>{j.completedScenarios.length} of {j.totalScenarios}</span>
                  </span>
                ) : started ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '2px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, color: 'var(--grape-600)' }}><Icon name="play" size={9} color="var(--grape-600)" />Started</span>
                ) : (
                  <span style={{ background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '2px 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, color: 'var(--ink-400)' }}>Not started</span>
                )}
              </div>
            );
          })}
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
