import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppStore';
import { Icon, Input } from '../components/ds';
import { popBg, PopCard, PopButton, INK, GRAPE } from '../components/pop';
import { usePlan, PRICE, goToCheckout } from '../engine/plan';
import { track, trackOnce } from '../analytics';

const UNLOCK_CODE = 'SPROUT-FAM';   // family & friends → premium
const ADMIN_CODE = 'SPROUT-ADMIN';  // premium + admin tools in Settings

/**
 * Sprouts Premium — one plan, 7-day free trial, annual emphasized.
 * Honest framing: clear pricing, visible monthly option, easy cancel language.
 */
export function Paywall() {
  const { dispatch } = useApp();
  const plan = usePlan();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<'annual' | 'monthly'>('annual');
  const [code, setCode] = useState('');
  const [codeMsg, setCodeMsg] = useState<'ok' | 'admin' | 'bad' | null>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  const startTrial = () => {
    // Begin checkout (browser + CAPI, deduped). StartTrial/Purchase fire later,
    // server-side, from the Stripe webhook + /success page (see api/stripe-webhook).
    const isAnnual = selected === 'annual';
    track('InitiateCheckout', {
      content_name: isAnnual ? 'Annual Plan' : 'Monthly Plan',
      content_category: 'subscription',
      content_ids: [selected],
      value: isAnnual ? 99 : 14.99,
      currency: 'USD',
    });
    goToCheckout(selected); // → Stripe; on success it redirects to /success?session_id=…
  };

  const redeem = () => {
    const c = code.trim().toUpperCase();
    if (c === ADMIN_CODE) {
      dispatch({ type: 'updateSettings', patch: { plan: 'premium', admin: true } });
      setCodeMsg('admin');
    } else if (c === UNLOCK_CODE) {
      dispatch({ type: 'updateSettings', patch: { plan: 'premium' } });
      // Comp'd unlock — a custom event so it never pollutes real StartTrial/Purchase.
      trackOnce('unlock_code', 'UnlockCode', { via: 'unlock_code' }, true);
      setCodeMsg('ok');
    } else setCodeMsg('bad');
  };

  const perks: [string, string][] = [
    ['messages-square', 'Parent communication scripts for everyday situations'],
    ['gamepad-2', 'Kid Journey Games that teach what to say'],
    ['zap', 'Quick Fire and Say It Out Loud practice'],
    ['star', 'Daily Quests, Stars, badges, and Sprout growth'],
    ['trending-up', 'Parent progress view and weekly summaries'],
    ['sparkles', 'Ask Sprout for communication ideas'],
    ['users', 'Up to 3 child profiles'],
  ];

  return (
    <div style={{ minHeight: '100dvh', ...popBg, paddingBottom: 32 }} className="fade-up">
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} aria-label="Back" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
          <Icon name="arrow-left" size={22} color={INK} />
        </button>
      </div>

      <div style={{ padding: '2px 24px 0', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, lineHeight: 1.12, color: INK, margin: '8px 0 8px' }}>
          {plan.tier === 'premium' ? <>You have <span style={{ color: GRAPE }}>Sprouts Premium</span></>
            : plan.trialExpired ? <>Your free trial has <span style={{ color: GRAPE }}>ended</span></>
            : <>Start your <span style={{ color: GRAPE }}>7-day free trial</span></>}
        </h1>
        <p style={{ color: 'var(--ink-500)', fontSize: 14.5, fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
          {plan.tier === 'premium' ? 'Your family’s communication library is unlocked.'
            : plan.trialExpired ? 'Choose a plan to keep using Sprouts Premium.'
            : 'Unlock parent scripts, kid games, daily quests, and communication activities for your family.'}
        </p>
      </div>

      {plan.tier !== 'premium' && (
        <>
          {/* pricing cards — annual default & emphasized, monthly always visible */}
          <div style={{ padding: '18px 20px 0', display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 12, alignItems: 'stretch' }}>
            <div onClick={() => setSelected('annual')} style={{ position: 'relative', background: selected === 'annual' ? 'linear-gradient(155deg, var(--grape-500), var(--grape-600))' : '#fff', color: selected === 'annual' ? '#fff' : INK, border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: selected === 'annual' ? '4px 5px 0 rgba(42,37,33,.85)' : '3px 4px 0 var(--grape-300)', padding: '18px 14px 14px', textAlign: 'center', cursor: 'pointer' }}>
              <span style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%) rotate(-2deg)', background: 'var(--sun-500)', color: '#3A2A00', border: `2px solid ${INK}`, borderRadius: 99, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, padding: '2px 10px', whiteSpace: 'nowrap' }}>BEST VALUE · SAVE {PRICE.save}</span>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, opacity: 0.85 }}>ANNUAL</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginTop: 3 }}>{PRICE.annual}<span style={{ fontSize: 14 }}>/year</span></div>
              <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2, opacity: 0.9 }}>Just {PRICE.annualPerMonth}/month</div>
              <div style={{ marginTop: 7 }}>
                <span style={{ display: 'inline-block', background: selected === 'annual' ? '#fff' : 'var(--green-100)', color: selected === 'annual' ? INK : 'var(--green-600)', border: `2px solid ${INK}`, borderRadius: 99, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10.5, padding: '2px 10px' }}>7 DAYS FREE</span>
              </div>
            </div>
            <div onClick={() => setSelected('monthly')} style={{ background: selected === 'monthly' ? 'linear-gradient(155deg, var(--grape-500), var(--grape-600))' : '#fff', color: selected === 'monthly' ? '#fff' : INK, border: `2.5px solid ${INK}`, borderRadius: 20, boxShadow: selected === 'monthly' ? '4px 5px 0 rgba(42,37,33,.85)' : '3px 4px 0 var(--grape-300)', padding: '18px 14px 14px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, opacity: 0.85 }}>MONTHLY</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginTop: 3 }}>{PRICE.monthly}<span style={{ fontSize: 13 }}>/mo</span></div>
              <div style={{ marginTop: 7 }}>
                <span style={{ display: 'inline-block', background: selected === 'monthly' ? '#fff' : 'var(--green-100)', color: selected === 'monthly' ? INK : 'var(--green-600)', border: `2px solid ${INK}`, borderRadius: 99, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10.5, padding: '2px 10px' }}>7 DAYS FREE</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '16px 20px 0' }}>
            <PopButton fullWidth onClick={startTrial} style={{ fontSize: 16, minHeight: 52 }}>
              {plan.trialExpired ? 'Continue with Premium' : 'Start Free Trial'}
            </PopButton>
            <button onClick={() => navigate(-1)} style={{ display: 'block', margin: '12px auto 0', border: 'none', background: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--ink-400)', cursor: 'pointer' }}>
              Maybe Later
            </button>
          </div>
        </>
      )}

      {/* benefits */}
      <div style={{ padding: '18px 20px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {perks.map(([icon, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#fff', border: `2px solid ${INK}`, borderRadius: 14, padding: '10px 13px', boxShadow: '2px 3px 0 var(--grape-300)' }}>
            <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--grape-100)', border: `2px solid ${INK}`, display: 'grid', placeItems: 'center', flex: 'none' }}>
              <Icon name={icon} size={15} color={INK} />
            </span>
            <span style={{ fontWeight: 800, fontSize: 13, color: INK, lineHeight: 1.3 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* restore / unlock code */}
      {plan.tier !== 'premium' && (
        <div ref={codeRef} style={{ padding: '16px 20px 0' }}>
          <PopCard style={{ padding: '13px 14px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: INK, marginBottom: 8 }}>Restore purchases / unlock code</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Input value={code} onChange={(e) => { setCode(e.target.value); setCodeMsg(null); }} placeholder="CODE" />
              </div>
              <PopButton onClick={redeem} style={{ minHeight: 44 }}>Apply</PopButton>
            </div>
            {codeMsg === 'bad' && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--coral-600)', marginTop: 6 }}>We couldn’t find an active subscription for that code.</div>}
          </PopCard>
        </div>
      )}
      {(codeMsg === 'ok' || codeMsg === 'admin' || plan.tier === 'premium') && (
        <div style={{ padding: '16px 20px 0' }}>
          <PopCard tone="green" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: INK }}>
              {codeMsg === 'admin' ? 'Admin mode unlocked 🛠️' : 'Welcome to Sprouts Premium 🌱'}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginTop: 4 }}>
              {codeMsg === 'admin' ? 'Premium access + admin tools are now in Settings.' : 'Your family’s communication library is unlocked.'}
            </div>
          </PopCard>
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-400)', margin: '16px 24px 0', lineHeight: 1.6 }}>
        Cancel anytime before your trial ends. Subscription renews automatically unless canceled.
        <br />
        <a href="/privacy.html" target="_blank" rel="noreferrer" style={{ color: 'var(--grape-600)' }}>Terms &amp; Privacy</a>
      </p>
    </div>
  );
}
