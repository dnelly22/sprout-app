import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../engine/plan';
import { Badge, Button, Card, Icon, IconButton, Input, Sheet } from '../components/ds';
import { CoachMessage } from '../components/ds';

interface Msg {
  from: 'coach' | 'me';
  text: string;
  script?: string;
  safety?: boolean;
}

const INTRO: Msg = {
  from: 'coach',
  text: "Hi Jordan — I'm here for the in-the-moment stuff. What's going on right now?",
};

const QUICK_PROMPTS = ['She’s having a meltdown', 'Won’t talk to me', 'Fighting with sibling'];

/**
 * CRISIS GUARDRAIL (placeholder logic; real version routes via a vetted,
 * region-appropriate, regularly-updated resource list — never hard-coded numbers).
 * If the parent describes serious risk, the Coach does NOT give coaching tips.
 */
const CRISIS_PATTERNS = [
  /\bsuicid/i, /\bkill (myself|himself|herself|themsel)/i, /\bself.?harm/i, /\bhurt (myself|himself|herself|them)/i,
  /\babuse/i, /\bhitting me\b/i, /\bnot safe\b/i, /\bin danger\b/i, /\bstarving\b/i,
];

function isCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

function cannedReply(userText: string): Msg {
  if (isCrisis(userText)) {
    return {
      from: 'coach',
      safety: true,
      text: 'This sounds serious, and it’s bigger than communication coaching. Please reach out right now to someone who can help in person — a trusted adult, your child’s doctor, or your local emergency number. If you or your child may be in danger, contact local emergency services or a crisis line in your area immediately. You don’t have to handle this alone.',
    };
  }
  return {
    from: 'coach',
    text: 'That’s a tough moment. This connects to Staying calm — reflect what you see first, then offer one small choice. Want me to open that lesson?',
    script: '“You’re really frustrated practice got cancelled. Want to pick what we do instead?”',
  };
}

export function Coach() {
  const plan = usePlan();
  const navigate = useNavigate();
  const [thread, setThread] = useState<Msg[]>([INTRO]);
  const askedCount = thread.filter((m) => m.from === 'me').length;
  const freeLimitHit = !plan.isPremium && askedCount >= 1;
  const [text, setText] = useState('');
  const [scopeOpen, setScopeOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollTop = endRef.current.scrollHeight;
  }, [thread]);

  const send = (msg?: string) => {
    const m = (msg ?? text).trim();
    if (!m || freeLimitHit) return;
    setText('');
    setThread((t) => [...t, { from: 'me', text: m }]);
    setTimeout(() => setThread((t) => [...t, cannedReply(m)]), 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 12px', borderBottom: '2.5px solid #2A2521', background: '#fff' }}>
        <span style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(180deg, #FAC3ED, #2A8FD8)', border: '2.5px solid #2A2521', display: 'grid', placeItems: 'center', flex: 'none' }}><Icon name="sparkles" size={22} color="#fff" /></span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--text-strong)' }}>Ask Sprout</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>Parenting help · recommends lessons, never diagnoses</div>
        </div>
        <IconButton variant="ghost" label="About the coach" onClick={() => setScopeOpen(true)}><Icon name="info" size={22} /></IconButton>
      </div>

      <div ref={endRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Badge tone="coach"><Icon name="shield-check" size={13} /> Educational, not professional advice</Badge>
        </div>
        {thread.map((m, i) => (
          m.safety
            ? <SafetyMessage key={i} text={m.text} />
            : <CoachMessage key={i} from={m.from} script={m.script}>{m.text}</CoachMessage>
        ))}
      </div>

      <div style={{ padding: '8px 16px 14px', borderTop: '1.5px solid var(--border)', background: 'var(--surface)' }}>
        {freeLimitHit && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--sun-100)', border: '2px solid #2A2521', borderRadius: 14, padding: '10px 13px', marginBottom: 10 }}>
            <Icon name="sparkles" size={17} color="var(--sun-600)" />
            <span style={{ flex: 1, fontWeight: 800, fontSize: 'var(--text-sm)', color: '#2A2521' }}>That’s the free preview — Premium unlocks unlimited Ask Sprout.</span>
            <button onClick={() => navigate('/plans')} style={{ border: '2px solid #2A2521', borderRadius: 99, background: 'var(--grape-500)', color: '#fff', fontWeight: 800, fontSize: 12, padding: '6px 12px', cursor: 'pointer', flex: 'none' }}>See plans</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p} onClick={() => send(p)}
              style={{ flex: 'none', border: '1.5px solid var(--sky-300)', background: 'var(--sky-100)', color: 'var(--sky-600)', borderRadius: 'var(--radius-pill)', padding: '8px 14px', fontWeight: 800, fontSize: 'var(--text-sm)', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1 }}><Input value={text} onChange={(e) => setText(e.target.value)} placeholder="What’s happening right now?" /></div>
          <IconButton variant="solid" label="Send" onClick={() => send()}><Icon name="arrow-up" size={22} color="#fff" /></IconButton>
        </div>
      </div>

      <Sheet open={scopeOpen} onClose={() => setScopeOpen(false)} title="About your coach">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GuardRow icon="message-circle" tone="coach" title="Communication only" text="I help with what to say and how to say it — not medical, legal, or clinical advice." />
          <GuardRow icon="life-buoy" tone="accent" title="If it’s urgent" text="For safety or crisis situations I’ll point you to real resources and people who can help right away." />
          <GuardRow icon="book-open" tone="primary" title="Grounded in the book" text="Every tip ties back to a lesson and a script you can open and save." />
          <GuardRow icon="lock" tone="primary" title="Private by default" text="Your chats stay on this device, are never used for ads, and you can delete them anytime." />
          <Button variant="primary" fullWidth onClick={() => setScopeOpen(false)}>Got it</Button>
        </div>
      </Sheet>
    </div>
  );
}

function SafetyMessage({ text }: { text: string }) {
  return (
    <Card style={{ borderLeft: '4px solid var(--danger)', background: 'var(--danger-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon name="life-buoy" size={18} color="var(--danger)" />
        <span style={{ fontWeight: 800, color: 'var(--berry-600)' }}>Please get real-time support</span>
      </div>
      <div style={{ fontSize: 'var(--text-md)', color: 'var(--text-body)', fontWeight: 600, lineHeight: 1.45 }}>{text}</div>
    </Card>
  );
}

function GuardRow({ icon, tone, title, text }: { icon: string; tone: 'coach' | 'accent' | 'primary'; title: string; text: string }) {
  const bg = { coach: 'var(--sky-100)', accent: 'var(--coral-100)', primary: 'var(--green-100)' }[tone];
  const fg = { coach: 'var(--sky-600)', accent: 'var(--coral-600)', primary: 'var(--green-700)' }[tone];
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: bg, display: 'grid', placeItems: 'center', flex: 'none' }}><Icon name={icon} size={20} color={fg} /></span>
      <div>
        <div style={{ fontWeight: 800, color: 'var(--text-strong)' }}>{title}</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{text}</div>
      </div>
    </div>
  );
}
