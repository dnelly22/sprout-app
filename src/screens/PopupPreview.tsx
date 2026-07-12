import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { popBg, SectionHead, INK, GRAPE } from '../components/pop';
import { Icon } from '../components/ds';
import { centeredOnTablet } from '../useResponsive';
import { CelebrationModal, LevelUpCard, KidStreakCard, AwardToast, type Celebration } from '../components/celebrations';

/*
 * Dev-only preview gallery: tap any popup/animation and it plays on demand,
 * using the REAL celebration components (no copies), so you can iterate on the
 * look without walking through the whole app. Linked from Settings → Admin.
 */
type Demo =
  | { kind: 'modal'; cel: Celebration }
  | { kind: 'levelup' }
  | { kind: 'kidstreak' }
  | { kind: 'toast'; title: string; sub?: string };

const ITEMS: { label: string; emoji: string; where: string; make: () => Demo }[] = [
  { label: 'Daily streak', emoji: '🔥', where: 'Parent · Today', make: () => ({ kind: 'modal', cel: { emoji: '🔥', tint: '#FBE3D8', title: '3-day streak!', body: 'Ava has shown up 3 days running — that consistency builds real confidence. 🌱', cta: 'Keep it going! 🔥', ctaBg: 'var(--coral-500)' } }) },
  { label: 'Weekly recap', emoji: '📅', where: 'Parent · Today', make: () => ({ kind: 'modal', cel: { emoji: '📅', tint: 'var(--green-100)', title: 'Your week with Sprout', body: '6 activities · 120 ⭐ earned · 4-day streak. Keep the momentum going!', cta: 'Let’s keep going', ctaBg: 'var(--green-500)' } }) },
  { label: 'Level-up alert', emoji: '🌟', where: 'Parent · Today', make: () => ({ kind: 'modal', cel: { emoji: '🌟', tint: 'var(--grape-100)', title: 'Ava reached Level 3!', body: 'Now a Young Sprout. Their Sprout is growing — nice work showing up together.', cta: 'Love it 🌱', ctaBg: 'var(--grape-500)' } }) },
  { label: 'Badge alert', emoji: '🏅', where: 'Parent · Today', make: () => ({ kind: 'modal', cel: { emoji: '🏅', tint: 'var(--sun-100)', title: 'Ava earned a badge!', body: '“Three Learning Days” — a real sign the practice is sticking.', cta: 'Awesome!', ctaBg: 'var(--grape-500)' } }) },
  { label: 'Lesson complete', emoji: '🌱', where: 'Parent · Reader', make: () => ({ kind: 'modal', cel: { emoji: '🌱', tint: 'var(--green-100)', title: 'Lesson complete!', body: 'You finished “Getting More Than One-Word Answers.” That’s 4 lessons done — one more script in your back pocket. 🌱', cta: 'Back to lessons', ctaBg: 'var(--green-500)' } }) },
  { label: 'Level-up', emoji: '✦', where: 'Kid · full-screen + confetti', make: () => ({ kind: 'levelup' }) },
  { label: 'Streak', emoji: '🔥', where: 'Kid · confetti', make: () => ({ kind: 'kidstreak' }) },
  { label: 'New badge', emoji: '🏅', where: 'Kid · toast', make: () => ({ kind: 'toast', title: '🏅 New badge: Three Learning Days!', sub: '+50 stars earned' }) },
  { label: 'Daily quest', emoji: '✅', where: 'Kid · toast', make: () => ({ kind: 'toast', title: '✅ Daily Quest complete!', sub: '+30 stars earned' }) },
];

export function PopupPreview() {
  const navigate = useNavigate();
  const [demo, setDemo] = useState<Demo | null>(null);

  // Toasts auto-dismiss like they do in the app.
  useEffect(() => {
    if (demo?.kind !== 'toast') return;
    const t = setTimeout(() => setDemo(null), 3500);
    return () => clearTimeout(t);
  }, [demo]);

  return (
    <div style={{ minHeight: '100%', ...popBg, paddingBottom: 28, ...centeredOnTablet }} className="fade-up">
      <div style={{ padding: '20px 20px 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/settings')} aria-label="Back" style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', border: `2.5px solid ${INK}`, boxShadow: '2px 3px 0 var(--grape-300)', display: 'grid', placeItems: 'center', cursor: 'pointer', flex: 'none' }}>
          <Icon name="arrow-left" size={20} color={INK} />
        </button>
        <h1 style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: INK, margin: 0 }}>
          Popup <span style={{ color: GRAPE }}>preview</span>
        </h1>
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        <SectionHead icon="sparkles" tint="var(--grape-100)">Tap to play</SectionHead>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
          {ITEMS.map((it) => (
            <button
              key={it.label + it.where}
              onClick={() => setDemo(it.make())}
              style={{ textAlign: 'left', cursor: 'pointer', background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 16, boxShadow: '3px 4px 0 var(--grape-300)', padding: 14 }}
            >
              <span style={{ display: 'inline-grid', placeItems: 'center', width: 46, height: 46, borderRadius: 13, background: 'var(--grape-100)', border: `2px solid ${INK}`, fontSize: 24 }}>{it.emoji}</span>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5, color: INK, marginTop: 9, lineHeight: 1.1 }}>{it.label}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-400)', marginTop: 2 }}>{it.where}</div>
            </button>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--ink-400)', marginTop: 16 }}>
          These are the live components — tweaking them updates the real app too.
        </p>
      </div>

      {demo?.kind === 'modal' && <CelebrationModal cel={demo.cel} onClose={() => setDemo(null)} />}
      {demo?.kind === 'levelup' && <LevelUpCard level={3} title="Young Sprout" stars={80} onClose={() => setDemo(null)} />}
      {demo?.kind === 'kidstreak' && <KidStreakCard days={5} stars={40} onClose={() => setDemo(null)} />}
      {demo?.kind === 'toast' && <AwardToast title={demo.title} sub={demo.sub} />}
    </div>
  );
}
