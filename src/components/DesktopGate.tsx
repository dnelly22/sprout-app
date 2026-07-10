import { useState, type ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { INK, popBg, PopButton } from './pop';
import { Mascot } from '../screens/kidzone/Mascot';

/**
 * Sprout is a phone/tablet app. On a desktop/laptop we show a "scan to open on
 * your phone" screen with a QR of the current URL (so ad-click attribution and
 * funnel progress carry over). iPhone / iPad / Android / tablets pass straight
 * through. There's an escape hatch to keep going on the computer anyway.
 */
function isDesktop(): boolean {
  try {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod|Android/i.test(ua)) return false;                       // phones + Android tablets
    if (/Mobile|Tablet|Silk|Kindle|PlayBook|BB10|webOS|Windows Phone/i.test(ua)) return false;
    if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return false;      // iPadOS 13+ reports as Mac
    return true;                                                                  // Windows / desktop Mac / Linux
  } catch { return false; }
}

export function DesktopGate({ children }: { children: ReactNode }) {
  const [proceed, setProceed] = useState(false);
  if (proceed || !isDesktop()) return <>{children}</>;

  const href = typeof window !== 'undefined' ? window.location.href : 'https://sprout-app-bice.vercel.app';
  const pretty = typeof window !== 'undefined' ? (window.location.host + window.location.pathname).replace(/\/$/, '') : 'sprout-app-bice.vercel.app';

  return (
    <div style={{ minHeight: '100dvh', ...popBg, display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 84, height: 84, margin: '0 auto 16px', borderRadius: '50%', background: 'radial-gradient(circle at 50% 35%, #EAF6E2, #BFE3CB)', border: `2.5px solid ${INK}`, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
          <Mascot mood="idle" size={70} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: INK, margin: '0 0 8px', lineHeight: 1.1 }}>
          Sprout is made for your phone 📱
        </h1>
        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink-600)', margin: '0 0 20px', lineHeight: 1.5 }}>
          Point your phone camera at this code to open Sprout there. It installs like a real app and works best on <b style={{ color: INK }}>iPhone, iPad, and Android</b>.
        </p>

        <div style={{ display: 'inline-block', background: '#fff', border: `2.5px solid ${INK}`, borderRadius: 22, boxShadow: '4px 5px 0 var(--grape-300)', padding: 18, marginBottom: 16 }}>
          <QRCodeSVG value={href} size={196} bgColor="#ffffff" fgColor={INK} level="M" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 22 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--ink-500)' }}>or visit</span>
          <span style={{ background: '#fff', border: `2px solid ${INK}`, borderRadius: 99, padding: '5px 12px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: INK }}>{pretty}</span>
        </div>

        <PopButton ghost onClick={() => setProceed(true)}>Continue on this computer</PopButton>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-400)', margin: '10px 0 0' }}>
          You can use Sprout here too — but the Kid Zone games and “add to home screen” work best on a phone or tablet.
        </p>
      </div>
    </div>
  );
}
