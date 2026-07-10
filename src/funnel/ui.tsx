/* Landing funnel — Comic Pop UI primitives + beat screens (presentational).
   Ported from design_handoff_funnel_v2 (ships default variants only). */
import type { ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const A = '/assets/funnel';
const INK = 'var(--ink-900)';
export const CP = {
  ink: '4px 5px 0 rgba(42,37,33,.9)',
  grape: '4px 5px 0 var(--grape-300)',
  soft: '3px 4px 0 rgba(42,37,33,.2)',
  h1: (size = 30) => ({ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size, lineHeight: 1.14, color: INK, margin: '0 0 12px' }) as React.CSSProperties,
  sub: () => ({ color: 'var(--ink-500)', fontSize: 16, fontWeight: 500, lineHeight: 1.55, margin: '0 0 22px' }) as React.CSSProperties,
};

/* ---------- tiny inline icon set ---------- */
const PATHS: Record<string, string> = {
  check: 'M20 6 9 17l-5-5', arrowRight: 'M5 12h13M13 6l6 6-6 6', chevronRight: 'M9 6l6 6-6 6',
  share: 'M12 15V3M8.5 6.5 12 3l3.5 3.5M6 11v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8',
  download: 'M12 3v12M8 11l4 4 4-4M5 20h14', x: 'M6 6l12 12M18 6 6 18',
  shield: 'M12 3l7 3v5c0 4.4-3 7.4-7 8.6C8 18.4 5 15.4 5 11V6z',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  spark: 'M12 3v6M12 15v6M3 12h6M15 12h6', arrowUpRight: 'M7 17 17 7M9 7h8v8',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2',
  bolt: 'M13 2 4 14h6l-1 8 9-12h-6z',
  pin: 'M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z M12 10.4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3',
  chat: 'M20 4H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4v4l5-4h7a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18',
};
export function Ico({ name, size = 22, color = INK, sw = 2.4 }: { name: string; size?: number; color?: string; sw?: number }) {
  const p = PATHS[name] || '';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
      {name === 'add' && <rect x="3" y="3" width="18" height="18" rx="4" stroke={color} strokeWidth={sw} />}
      {name === 'alert' && <path d="M12 3l9 16H3z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />}
      {name === 'alert' && <path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={sw} strokeLinecap="round" />}
      {p && <path d={p} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

/* ---------- brand + chrome ---------- */
function SproutMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label="Sprout">
      <path d="M32 58 C32 44 32 40 32 32" stroke="#15724A" strokeWidth="6" strokeLinecap="round" />
      <path d="M33 34 C36 22 46 16 56 16 C56 28 47 37 36 37 C34.5 37 33.5 36 33 34 Z" fill="#1F8A5B" />
      <path d="M31 40 C28.5 31 20.5 26 12 26 C12 36 19.5 43 29 43 C30.2 43 31 42 31 40 Z" fill="#44A971" />
      <circle cx="32" cy="58" r="3.5" fill="#F2724C" />
    </svg>
  );
}
export function Brand() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, margin: '0 0 20px' }}>
      <SproutMark size={30} />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: INK, letterSpacing: '-0.5px', lineHeight: 1 }}>Sprout</span>
    </div>
  );
}
function Eyebrow({ children, hot }: { children: ReactNode; hot?: boolean }) {
  const skin = hot ? { background: 'var(--coral-600)', color: '#fff' } : { background: 'var(--sun-100)', color: 'var(--coral-600)' };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', transform: 'rotate(-1.2deg)', border: '2px solid var(--ink-900)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, letterSpacing: '.06em', padding: '5px 13px', borderRadius: 999, boxShadow: '2px 3px 0 rgba(42,37,33,.85)', marginBottom: 15, ...skin }}>
      {hot ? '⚡' : '✦'} {children}
    </div>
  );
}
function Trust({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 14, color: 'var(--ink-400)', fontSize: 12.5, fontWeight: 700, textAlign: 'center' }}>
      <span style={{ flex: 'none' }}><Ico name="shield" size={15} color="var(--ink-400)" /></span>{children}
    </div>
  );
}
function PrimaryBtn({ children, onClick, arrow }: { children: ReactNode; onClick: () => void; arrow?: boolean }) {
  return (
    <button onClick={onClick} style={{ width: '100%', border: '2.5px solid var(--ink-900)', borderRadius: 999, background: 'var(--grape-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17.5, padding: '16px 18px', boxShadow: CP.ink, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
      {children}{arrow && <Ico name="arrowRight" size={20} color="#fff" />}
    </button>
  );
}
function StepBtn({ children, onClick, disabled, arrow }: { children: ReactNode; onClick: () => void; disabled?: boolean; arrow?: boolean }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ width: '100%', border: '2.5px solid var(--ink-900)', borderRadius: 999, cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? '#EDE9F5' : 'var(--grape-500)', color: disabled ? 'var(--ink-400)' : '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17.5, padding: '16px 18px', boxShadow: disabled ? 'none' : CP.ink, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
      {children}{arrow && !disabled && <Ico name="arrowRight" size={20} color="#fff" />}
    </button>
  );
}
export function Progress({ n, total = 4 }: { n: number; total?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 20 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: 'var(--grape-600)', whiteSpace: 'nowrap' }}>Question {n} of {total}</span>
      <div style={{ flex: 1, display: 'flex', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} style={{ flex: 1, height: 8, border: '2px solid var(--ink-900)', borderRadius: 5, background: i < n ? 'var(--grape-400)' : '#fff' }} />
        ))}
      </div>
    </div>
  );
}

/* ---------- choice cards ---------- */
export interface Opt { k: string; label: string; tag?: string }
function ChoiceCard({ label, tag, selected, multi, onPick }: { label: string; tag?: string; selected: boolean; multi?: boolean; onPick: () => void }) {
  return (
    <button onClick={onPick} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', borderRadius: 18, border: '2.5px solid var(--ink-900)', cursor: 'pointer', background: selected ? 'var(--grape-500)' : '#fff', boxShadow: selected ? CP.ink : '2px 3px 0 var(--grape-300)' }}>
      <span style={{ flex: 'none', width: 27, height: 27, borderRadius: multi ? 9 : '50%', border: '2.5px solid var(--ink-900)', background: selected ? '#fff' : 'var(--grape-100)', display: 'grid', placeItems: 'center' }}>
        {selected && <Ico name="check" size={17} color="var(--grape-600)" />}
      </span>
      <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, lineHeight: 1.3, color: selected ? '#fff' : INK }}>{label}</span>
      {tag && <span style={{ flex: 'none', background: selected ? 'rgba(255,255,255,.24)' : 'var(--grape-100)', color: selected ? '#fff' : 'var(--grape-600)', border: '2px solid var(--ink-900)', borderRadius: 999, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, letterSpacing: '.04em', padding: '2px 9px' }}>{tag}</span>}
    </button>
  );
}

/* ================= BEATS ================= */
export interface Creative { eyebrow: string; headline: string; sub: string }

export function Hook({ creative, onNext }: { creative: Creative; onNext: () => void }) {
  return (
    <div className="beat-in">
      <Brand />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <Eyebrow>{creative.eyebrow}</Eyebrow>
        <div style={{ width: '100%', margin: '6px 0 14px' }}>
          <img src={`${A}/hero.webp`} alt="Sprout flying hand in hand with two kids" style={{ display: 'block', width: '100%' }} />
        </div>
        <h1 style={{ ...CP.h1(31), textAlign: 'center' }}>{creative.headline}</h1>
        <p style={{ ...CP.sub(), textAlign: 'center', maxWidth: 360 }}>{creative.sub}</p>
      </div>
      <PrimaryBtn onClick={onNext} arrow>Show me</PrimaryBtn>
      <Trust>Free to start · no account · nothing leaves your device.</Trust>
    </div>
  );
}

export function MultiBeat({ head, sub, options, values, onToggle, onNext, note, cta, footer }: {
  head: string; sub?: string; options: Opt[]; values: string[]; onToggle: (k: string) => void; onNext: () => void; note?: ReactNode; cta?: string; footer?: string;
}) {
  const chosen = values.length > 0;
  return (
    <div className="beat-in">
      <h1 style={CP.h1(27)}>{head}</h1>
      {sub && <p style={{ ...CP.sub(), fontSize: 15, margin: '-4px 0 16px' }}>{sub}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {options.map((o) => <ChoiceCard key={o.k} multi label={o.label} tag={o.tag} selected={values.includes(o.k)} onPick={() => onToggle(o.k)} />)}
      </div>
      {note && chosen && note}
      <div style={{ marginTop: 18 }}><StepBtn onClick={onNext} disabled={!chosen} arrow>{cta || 'Continue'}</StepBtn></div>
      {footer && <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-400)', marginTop: 13 }}>{footer}</div>}
    </div>
  );
}

export function SingleBeat({ head, sub, options, value, onPick }: { head: string; sub?: string; options: Opt[]; value: string | null; onPick: (k: string) => void }) {
  return (
    <div className="beat-in">
      <h1 style={CP.h1(27)}>{head}</h1>
      {sub && <p style={{ ...CP.sub(), fontSize: 15, margin: '-4px 0 16px' }}>{sub}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {options.map((o) => <ChoiceCard key={o.k} label={o.label} tag={o.tag} selected={value === o.k} onPick={() => onPick(o.k)} />)}
      </div>
    </div>
  );
}

function Shot({ src, alt, h, caption }: { src: string; alt?: string; h?: number; caption?: string }) {
  return (
    <div>
      <div style={{ borderRadius: 16, border: '2.5px solid var(--ink-900)', boxShadow: CP.grape, overflow: 'hidden', background: '#fff' }}>
        <img src={src} alt={alt || 'Sprout app'} style={{ display: 'block', width: '100%', height: h || 'auto', objectFit: 'cover', objectPosition: 'top' }} />
      </div>
      {caption && <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--ink-400)', marginTop: 9 }}>{caption}</div>}
    </div>
  );
}
function Band({ fill, color, children, big }: { fill?: string; color?: string; children: ReactNode; big?: boolean }) {
  return (
    <div style={{ margin: '18px 0 0', padding: big ? '15px 16px' : '13px 15px', background: fill || 'var(--sun-100)', border: '2.5px solid var(--ink-900)', borderRadius: 16, boxShadow: CP.soft, textAlign: 'center' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: big ? 18 : 14.5, color: color || INK, lineHeight: 1.3 }}>{children}</span>
    </div>
  );
}

/* BEAT 6 — MECHANISM */
const MECH = [
  { fc: '#F2724C', fcs: '#FFC2AE', icon: 'pin', kick: 'A real moment', title: 'Real-life scenarios', desc: 'Recess, teasing, being left out.' },
  { fc: 'var(--grape-500)', fcs: 'var(--grape-300)', icon: 'chat', kick: 'Their turn', title: 'Choose what to say', desc: 'Pick a reply — every card’s safe.' },
  { fc: 'var(--green-500)', fcs: '#A6D9BE', icon: 'globe', kick: '5 worlds', title: '200+ ways to practice', desc: 'Friends, boundaries, teasing & more.' },
];
export function MechanismBeat({ onNext }: { onNext: () => void }) {
  return (
    <div className="beat-in">
      <Eyebrow>How Sprout works</Eyebrow>
      <h1 style={CP.h1(27)}>They rehearse the hard moment — <span style={{ color: 'var(--grape-600)' }}>before</span> it ever happens.</h1>
      <p style={{ ...CP.sub(), fontSize: 15, margin: '0 0 6px' }}>A lecture teaches them <i>about</i> speaking up. Practice teaches them <i>to</i>. So every round is a real moment they can try — safely, as many times as it takes.</p>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', margin: '2px 0 22px' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 300, height: 300, transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(255,253,247,.9), rgba(255,253,247,0) 66%)', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1, width: 180, height: 373, transform: 'rotate(-1deg)', borderRadius: 36, background: 'linear-gradient(150deg,#4a443d,#211d18)', padding: 3.5, boxShadow: '0 22px 38px rgba(28,18,6,.36), 8px 12px 0 rgba(42,37,33,.14)' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 32, background: '#0b0a09', padding: 4 }}>
            <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 28, background: '#5D41B0' }}>
              <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', width: 54, height: 16, borderRadius: 999, background: '#000', zIndex: 4 }} />
              <div style={{ position: 'relative', height: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 13px', zIndex: 3 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, color: '#fff', marginTop: 1 }}>9:41</span>
              </div>
              <img src={`${A}/scene.webp`} alt="A real Sprout scenario" style={{ position: 'absolute', top: 26, left: 0, width: '100%', height: 'calc(100% - 26px)', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
              <div style={{ position: 'absolute', left: '50%', bottom: 5, transform: 'translateX(-50%)', width: 60, height: 3.5, borderRadius: 999, background: 'rgba(255,255,255,.6)', zIndex: 5 }} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
        {MECH.map((f) => (
          <div key={f.title} style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '2.5px solid var(--ink-900)', borderRadius: 15, boxShadow: '3px 4px 0 ' + f.fcs, padding: '12px 11px 13px' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, background: f.fc, border: '2px solid var(--ink-900)', boxShadow: '1.5px 2px 0 rgba(42,37,33,.85)', marginBottom: 9 }}>
              <Ico name={f.icon} size={18} color="#fff" sw={2.6} />
            </span>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 8.5, letterSpacing: '.05em', textTransform: 'uppercase', color: f.fc, marginBottom: 3 }}>{f.kick}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, lineHeight: 1.1, color: INK, marginBottom: 5 }}>{f.title}</div>
            <div style={{ fontWeight: 600, fontSize: 10.5, lineHeight: 1.35, color: 'var(--ink-700)' }}>{f.desc}</div>
          </div>
        ))}
      </div>
      <Band fill="var(--grape-100)" color="var(--grape-600)">So we turned it into a game they’ll actually play.</Band>
      <div style={{ marginTop: 20 }}><PrimaryBtn onClick={onNext} arrow>Show me the games</PrimaryBtn></div>
    </div>
  );
}

/* BEAT 7 — THE 3 GAMES (Original layout) */
const GAMES = [
  { icon: 'eye', name: 'Scenario Games', tag: 'Picture it.', desc: 'Real situations, real choices. They pick the best way to respond — and see what happens.', fc: 'var(--green-500)', fcs: '#A6D9BE', tint: 'var(--green-100)' },
  { icon: 'bolt', name: 'Quick Fire', tag: 'Think it.', desc: 'Fast rounds that train them to think on their feet, the way real moments happen.', fc: 'var(--sky-500)', fcs: '#BFE0F5', tint: 'rgba(42,143,216,.13)' },
  { icon: 'chat', name: 'Say It Out Loud', tag: 'Say it.', desc: 'They practice saying the words aloud — so it moves from their head to their mouth.', fc: 'var(--coral-600)', fcs: '#FFC2AE', tint: 'rgba(240,138,106,.18)' },
];
export function GamesBeat({ onNext }: { onNext: () => void }) {
  return (
    <div className="beat-in">
      <Eyebrow>The 3 games</Eyebrow>
      <h1 style={CP.h1(27)}>Three ways to practice — so it actually sticks.</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
        {GAMES.map((g) => (
          <div key={g.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', background: g.tint, border: '2.5px solid var(--ink-900)', borderRadius: 18, boxShadow: '3px 4px 0 ' + g.fcs }}>
            <span style={{ flex: 'none', display: 'grid', placeItems: 'center', width: 60, height: 60, borderRadius: 16, background: g.fc, border: '2.5px solid var(--ink-900)', boxShadow: '2px 3px 0 rgba(42,37,33,.85)' }}>
              <Ico name={g.icon} size={30} color="#fff" sw={2.5} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16.5, color: INK, lineHeight: 1.1 }}>{g.name}</div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-700)', lineHeight: 1.4, margin: '4px 0 8px' }}>{g.desc}</div>
              <span style={{ alignSelf: 'flex-start', background: '#fff', border: '2px solid var(--ink-900)', borderRadius: 999, padding: '2px 11px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11.5, color: g.fc }}>{g.tag}</span>
            </div>
          </div>
        ))}
      </div>
      <Band fill="var(--sun-100)" big>See it. Think it. Say it.<br /><span style={{ fontSize: 13.5, color: 'var(--ink-500)' }}>That’s how it sticks.</span></Band>
      <div style={{ marginTop: 20 }}><PrimaryBtn onClick={onNext} arrow>Keep going</PrimaryBtn></div>
    </div>
  );
}

/* BEAT 8 — VALUE STACK 1 */
function Chip({ children }: { children: ReactNode }) {
  return <span style={{ display: 'inline-block', background: 'var(--grape-100)', border: '2px solid var(--ink-900)', borderRadius: 999, padding: '8px 13px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: 'var(--grape-600)', boxShadow: '2px 2px 0 var(--grape-300)' }}>{children}</span>;
}
export function ValueStack1({ onNext }: { onNext: () => void }) {
  return (
    <div className="beat-in">
      <Eyebrow hot>And here’s the part for you</Eyebrow>
      <h1 style={CP.h1(27)}>Your child copies how <i>you</i> handle hard moments.</h1>
      <p style={{ ...CP.sub(), fontSize: 15.5, margin: '0 0 18px' }}>So Sprout doesn’t just coach them — it hands <b style={{ color: INK, fontWeight: 800 }}>you</b> the exact words too. A whole library of parent scripts for the real stuff:</p>
      <Shot src={`${A}/lesson.webp`} alt="A real parent script" h={228} caption="A real parent script from the library." />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, margin: '18px 0 0' }}>
        <Chip>When they won’t open up</Chip><Chip>When they’re melting down</Chip><Chip>When they got left out</Chip><Chip>Building the bond back</Chip>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: INK, lineHeight: 1.4, margin: '18px 0 0' }}>Help them where they’re stuck — <span style={{ color: 'var(--grape-600)' }}>and grow closer while you do it.</span></p>
      <div style={{ marginTop: 20 }}><PrimaryBtn onClick={onNext} arrow>There’s more</PrimaryBtn></div>
    </div>
  );
}

/* BEAT 9 — VALUE STACK 2 */
const CATS = [
  { icon: '🤝', name: 'Connecting', desc: 'Small talk, rapport, deeper conversations', tint: 'var(--green-100)' },
  { icon: '🗣️', name: 'Speaking Up', desc: 'Asking for what you need, being heard', tint: 'rgba(42,143,216,.16)' },
  { icon: '❤️', name: 'Relationships', desc: 'Partner, family, closest people', tint: 'rgba(240,138,106,.24)' },
  { icon: '🧠', name: 'Understanding People', desc: 'Reading the room, defusing tension', tint: 'var(--grape-100)' },
  { icon: '✋', name: 'Boundaries', desc: 'Saying no, holding your line — kindly', tint: 'var(--sun-100)' },
  { icon: '💬', name: 'Hard Conversations', desc: 'Conflict, apologies, the talks you dread', tint: 'rgba(210,84,47,.15)' },
];
export function ValueStack2({ onNext }: { onNext: () => void }) {
  return (
    <div className="beat-in">
      <Eyebrow hot>And on top of that</Eyebrow>
      <h1 style={CP.h1(27)}>A full communication library — for your life, too.</h1>
      <p style={{ ...CP.sub(), fontSize: 15.5, margin: '0 0 18px' }}>70+ real scenarios with what to say, what <i>not</i> to say, and how to walk in. Not kid stuff — grown-up life:</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
        {CATS.map((c) => (
          <div key={c.name} style={{ background: '#fff', border: '2.5px solid var(--ink-900)', borderRadius: 16, boxShadow: '2px 3px 0 var(--grape-300)', padding: '13px 12px' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: '50%', background: c.tint, border: '2.5px solid var(--ink-900)', fontSize: 18, marginBottom: 9 }}>{c.icon}</span>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: INK, lineHeight: 1.12 }}>{c.name}</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-500)', lineHeight: 1.35, marginTop: 4 }}>{c.desc}</div>
          </div>
        ))}
      </div>
      <Band fill="var(--grape-100)" color="var(--grape-600)" big>You came for your kid.<br />You’ll stay for yourself.</Band>
      <div style={{ marginTop: 20 }}><PrimaryBtn onClick={onNext} arrow>Build our plan</PrimaryBtn></div>
    </div>
  );
}

/* BEAT 10 — RECOMMENDATION (Dual tiles default) */
export function Recommendation({ kidWorld, kidDesc, parentTrack, onNext }: { kidWorld: string; kidDesc: string; parentTrack: string; onNext: () => void }) {
  const Tile = ({ fc, tint, icon, tag, title, meta }: { fc: string; tint: string; icon: string; tag: string; title: string; meta: string }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: tint, border: '2.5px solid var(--ink-900)', borderRadius: 18, boxShadow: '3px 4px 0 rgba(42,37,33,.16)', padding: '14px 13px', minHeight: 158 }}>
      <span style={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: 12, background: fc, border: '2.5px solid var(--ink-900)', boxShadow: '2px 2px 0 rgba(42,37,33,.85)', marginBottom: 9 }}>
        <Ico name={icon} size={20} color="#fff" sw={2.5} />
      </span>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', color: fc, marginBottom: 3 }}>{tag}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, color: INK, lineHeight: 1.14 }}>{title}</div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-500)', lineHeight: 1.35, marginTop: 4 }}>{meta}</div>
    </div>
  );
  return (
    <div className="beat-in">
      <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0 4px' }}>
        <img src={`${A}/kids-thumbs.webp`} alt="Two kids and Sprout giving a thumbs up" className="float" style={{ width: '92%', maxWidth: 360, height: 'auto', display: 'block' }} />
      </div>
      <h1 style={{ ...CP.h1(27), textAlign: 'center' }}>Here’s where you both start 🌱</h1>
      <p style={{ ...CP.sub(), textAlign: 'center', fontSize: 14.5, margin: '0 0 22px' }}>Built from everything you told us.</p>
      <div style={{ position: 'relative', display: 'flex', gap: 14, alignItems: 'stretch' }}>
        <Tile fc="var(--green-500)" tint="var(--green-100)" icon="globe" tag="Your child" title={kidWorld} meta={kidDesc} />
        <Tile fc="var(--coral-600)" tint="var(--grape-100)" icon="chat" tag="You" title={parentTrack} meta="Real scripts for real moments" />
        <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 28, height: 28, borderRadius: '50%', background: 'var(--sun-300)', border: '2.5px solid var(--ink-900)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: INK, boxShadow: '2px 2px 0 rgba(42,37,33,.4)', zIndex: 2 }}>+</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 0', padding: '12px 14px', background: 'var(--sun-100)', border: '2.5px solid var(--ink-900)', borderRadius: 16, boxShadow: CP.soft }}>
        <span style={{ flex: 'none' }}><Ico name="spark" size={18} color="var(--coral-600)" /></span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: INK, lineHeight: 1.35 }}>You’re both working the same skill — <span style={{ color: 'var(--grape-600)' }}>from two sides.</span></span>
      </div>
      <div style={{ marginTop: 22 }}><PrimaryBtn onClick={onNext}>Get Sprout — start free</PrimaryBtn></div>
      <Trust>Free to start · no account · nothing leaves your device.</Trust>
    </div>
  );
}

/* BEAT 11 — OFFER / INSTALL */
export function Offer({ onInstall, onFallback }: { onInstall: () => void; onFallback: () => void }) {
  return (
    <div className="beat-in">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div className="float" style={{ width: 104, height: 104, borderRadius: 26, overflow: 'hidden', border: '2.5px solid var(--ink-900)', boxShadow: '4px 6px 0 rgba(42,37,33,.85)' }}>
          <img src={`${A}/app-icon.webp`} alt="Sprout app icon" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      </div>
      <h1 style={{ ...CP.h1(30), textAlign: 'center' }}>Get Sprout and start their plan — free.</h1>
      <p style={{ ...CP.sub(), textAlign: 'center' }}>It installs like a real app — full screen, works offline. Takes 15 seconds.</p>
      <PrimaryBtn onClick={onInstall}>Add Sprout to my home screen</PrimaryBtn>
      <div style={{ textAlign: 'center', marginTop: 15 }}>
        <a href="#" onClick={(e) => { e.preventDefault(); onFallback(); }} style={{ fontSize: 13.5, color: 'var(--ink-500)', fontWeight: 800 }}>Just open it in my browser for now</a>
      </div>
      <Trust>Free to start · no account · no ads · nothing leaves your device.</Trust>
    </div>
  );
}

/* ---------- install sheet ---------- */
function StepBox({ n, children, label }: { n: number; children: ReactNode; label: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, padding: '15px 8px', background: 'var(--cream-100)', border: '2.5px solid var(--ink-900)', borderRadius: 16, boxShadow: '3px 4px 0 var(--grape-300)', position: 'relative' }}>
      <span style={{ position: 'absolute', top: -11, left: -9, width: 26, height: 26, borderRadius: '50%', background: 'var(--grape-500)', border: '2.5px solid var(--ink-900)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, display: 'grid', placeItems: 'center' }}>{n}</span>
      <span style={{ width: 46, height: 46, borderRadius: 13, background: '#fff', border: '2.5px solid var(--ink-900)', display: 'grid', placeItems: 'center' }}>{children}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11.5, textAlign: 'center', color: INK, lineHeight: 1.25 }}>{label}</span>
    </div>
  );
}
export function InstallSheet({ env, onClose, onAndroidInstall, installed }: {
  env: 'ios' | 'android' | 'inapp' | 'installed' | 'desktop'; onClose: () => void; onAndroidInstall: () => void; installed: boolean;
}) {
  const done = installed || env === 'installed';
  const titles = { ios: 'Make Sprout one tap away', android: 'Make Sprout one tap away', inapp: 'Almost — one quick step', installed: 'You’re all set 🎉', desktop: 'Get Sprout on your phone' };
  const subs = {
    ios: 'Add it to your home screen so it opens like a real app — full screen, works offline.',
    android: 'Add it to your home screen so it opens like a real app — full screen, works offline.',
    inapp: 'You’re in an in-app browser, which can’t install apps. Open Sprout in your real browser first — your plan comes with you.',
    installed: 'Sprout is on your home screen. Your plan for the whole family is loaded and ready.',
    desktop: 'Sprout works best on a phone or tablet. Point your phone camera at this code to open it there and add it to your home screen.',
  };
  let body: ReactNode;
  if (done) {
    body = (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 16px' }}>
        <span className="pop-in" style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-100)', border: '2.5px solid var(--ink-900)', display: 'grid', placeItems: 'center', boxShadow: CP.soft }}>
          <Ico name="check" size={32} color="var(--green-600)" />
        </span>
      </div>
    );
  } else if (env === 'ios') {
    body = (
      <div style={{ display: 'flex', gap: 11, margin: '6px 0 16px' }}>
        <StepBox n={1} label="Tap Share"><Ico name="share" size={22} color="var(--sky-500)" /></StepBox>
        <StepBox n={2} label="Add to Home Screen"><Ico name="add" size={22} color="var(--grape-600)" /></StepBox>
        <StepBox n={3} label={'Tap “Add”'}><span style={{ fontWeight: 800, fontSize: 14, color: 'var(--sky-500)' }}>Add</span></StepBox>
      </div>
    );
  } else if (env === 'desktop') {
    const href = typeof window !== 'undefined' ? window.location.href : 'https://sprout-app-bice.vercel.app/start';
    const pretty = typeof window !== 'undefined' ? (window.location.host + window.location.pathname).replace(/\/$/, '') : 'sprout-app-bice.vercel.app';
    body = (
      <div style={{ margin: '10px 0 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ background: '#fff', border: '2.5px solid var(--ink-900)', borderRadius: 20, boxShadow: CP.grape, padding: 15 }}>
          <QRCodeSVG value={href} size={172} bgColor="#ffffff" fgColor={INK} level="M" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: 'var(--ink-500)' }}>or visit</span>
          <span style={{ background: '#fff', border: '2px solid var(--ink-900)', borderRadius: 99, padding: '4px 11px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: INK }}>{pretty}</span>
        </div>
      </div>
    );
  } else if (env === 'android') {
    body = (
      <div style={{ margin: '6px 0 16px' }}>
        <button onClick={onAndroidInstall} style={{ width: '100%', border: '2.5px solid var(--ink-900)', borderRadius: 999, background: 'var(--grape-500)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, padding: '15px', boxShadow: CP.ink, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
          <Ico name="download" size={20} color="#fff" />Install app
        </button>
        <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-500)', marginTop: 10 }}>One tap — Sprout adds itself to your home screen.</div>
      </div>
    );
  } else {
    body = (
      <div style={{ margin: '6px 0 16px' }}>
        <div style={{ display: 'flex', gap: 12, padding: '14px 15px', background: 'var(--sun-100)', border: '2.5px solid var(--ink-900)', borderRadius: 16, boxShadow: CP.soft }}>
          <span style={{ flex: 'none', width: 38, height: 38, borderRadius: '50%', background: '#fff', border: '2.5px solid var(--ink-900)', display: 'grid', placeItems: 'center' }}><Ico name="alert" size={20} color="var(--coral-600)" /></span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: INK, marginBottom: 3 }}>Tap the ••• menu, top-right</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-700)', lineHeight: 1.5 }}>Then choose <b>“Open in Safari”</b> (or your browser) and add Sprout there.</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, paddingRight: 6 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--grape-600)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5 }}>up here <Ico name="arrowUpRight" size={16} color="var(--grape-600)" /></span>
        </div>
      </div>
    );
  }
  const key = done ? 'installed' : env;
  return (
    <div className="sheet-scrim" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(42,37,33,.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="sheet-body" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, position: 'relative', background: '#fff', border: '2.5px solid var(--ink-900)', borderBottom: 'none', borderRadius: '26px 26px 0 0', padding: '14px 22px calc(16px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><span style={{ width: 46, height: 5, borderRadius: 999, background: 'var(--ink-400)', opacity: .6 }} /></div>
        <img src={`${A}/sprout-cut.webp`} alt="Sprout" style={{ position: 'absolute', top: -56, right: 22, width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(2px 4px 0 rgba(42,37,33,.18))' }} />
        <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 14, right: 16, width: 30, height: 30, borderRadius: '50%', border: '2px solid var(--ink-900)', background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0 }}><Ico name="x" size={15} /></button>
        {!done && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, letterSpacing: '.08em', color: 'var(--coral-600)' }}>{env === 'inapp' ? 'ONE MORE STEP' : env === 'desktop' ? 'SCAN TO GET THE APP' : 'ADD TO HOME SCREEN'}</div>}
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 23, color: INK, margin: '5px 0 7px', maxWidth: 260, lineHeight: 1.12 }}>{titles[key]}</h2>
        <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink-500)', lineHeight: 1.5, margin: '0 0 4px' }}>{subs[key]}</p>
        {body}
        <div style={{ textAlign: 'center', paddingBottom: 2 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); onClose(); }} style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--grape-600)' }}>{done ? 'Done' : 'Maybe later'}</a>
        </div>
      </div>
    </div>
  );
}
