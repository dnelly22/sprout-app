import { useState } from 'react';
import { useApp } from '../store/AppStore';
import { AREAS, type AreaKey } from '../constants/areas';
import { Button, Icon, Sheet } from './ds';
import type { Child } from '../types';

const MOODS = ['😣', '😕', '😐', '🙂', '😄'];
const CHALLENGE_OPTS: { value: 'yes' | 'partly' | 'no'; label: string }[] = [
  { value: 'yes', label: 'Yes!' },
  { value: 'partly', label: 'Partly' },
  { value: 'no', label: 'Not yet' },
];

export function CheckinFlow({ open, onClose, child }: { open: boolean; onClose: () => void; child: Child }) {
  const { dispatch } = useApp();
  const [mood, setMood] = useState(3);
  const [ratings, setRatings] = useState<Record<AreaKey, number>>({ speakup: 3, listen: 3, feelings: 3, conflict: 3, connect: 3 });
  const [challengeDone, setChallengeDone] = useState<'yes' | 'partly' | 'no'>('partly');
  const [winNote, setWinNote] = useState('');

  const submit = () => {
    dispatch({
      type: 'recordCheckin',
      checkin: {
        childId: child.id,
        weekOf: new Date().toISOString().slice(0, 10),
        mood,
        areaRatings: ratings,
        challengeDone,
        winNote: winNote.trim() || undefined,
      },
    });
    onClose();
    // reset for next time
    setMood(3); setChallengeDone('partly'); setWinNote('');
    setRatings({ speakup: 3, listen: 3, feelings: 3, conflict: 3, connect: 3 });
  };

  return (
    <Sheet open={open} onClose={onClose} title={`This week with ${child.name}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Mood */}
        <div>
          <Label>How did the week feel?</Label>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
            {MOODS.map((m, i) => {
              const on = mood === i + 1;
              return (
                <button
                  key={i} onClick={() => setMood(i + 1)}
                  style={{
                    flex: 1, height: 52, borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 24,
                    border: on ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    background: on ? 'var(--green-50)' : 'var(--surface)',
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Area ratings */}
        <div>
          <Label>How are these going?</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {AREAS.map((a) => (
              <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: 1, fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-strong)' }}>{a.parentLabel}</span>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const on = ratings[a.key] >= n;
                    return (
                      <button
                        key={n} aria-label={`${a.parentLabel} ${n}`} onClick={() => setRatings((r) => ({ ...r, [a.key]: n }))}
                        style={{ width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', border: 'none', background: on ? a.color : 'var(--cream-200)' }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Challenge done */}
        <div>
          <Label>Did you try this week’s mission?</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {CHALLENGE_OPTS.map((o) => {
              const on = challengeDone === o.value;
              return (
                <button
                  key={o.value} onClick={() => setChallengeDone(o.value)}
                  style={{
                    height: 44, borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontWeight: 800, fontSize: 'var(--text-sm)',
                    border: on ? '1.5px solid transparent' : '1.5px solid var(--border)',
                    background: on ? 'var(--primary)' : 'var(--surface)', color: on ? '#fff' : 'var(--text-body)',
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Win note */}
        <div>
          <Label>A win to celebrate? <span style={{ color: 'var(--text-faint)', fontWeight: 600 }}>(optional)</span></Label>
          <textarea
            value={winNote} onChange={(e) => setWinNote(e.target.value)} rows={2}
            placeholder={`Something ${child.name} did well this week…`}
            style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', padding: 12, fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', fontWeight: 600, resize: 'none' }}
          />
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={submit} iconRight={<Icon name="check" size={20} color="#fff" />}>
          Save this week
        </Button>
      </div>
    </Sheet>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="sprout-eyebrow" style={{ marginBottom: 10 }}>{children}</div>;
}
