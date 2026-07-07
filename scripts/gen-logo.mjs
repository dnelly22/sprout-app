// Generates the app icon set from the E "Comic Pop" splash hero: mascot in an
// ink-bordered radial-green circle on the lavender halftone. Outputs:
//   assets/icon.png (1024, App Store source)  ·  public/icons/icon-{512,192}.png
//   public/icons/icon-maskable-512.png (safe-zone padded)  ·  public/icons/apple-touch-icon.png (180)
// Run: node scripts/gen-logo.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const MASCOT = join(homedir(), 'Downloads', 'design_handoff_onboarding', 'assets', 'sprout-cut.png');
const b64 = readFileSync(MASCOT).toString('base64');

// scale factors relative to a 1024 canvas; `pad` shrinks art into the maskable safe zone
function iconSvg(pad = 0) {
  const S = 1024;
  const cx = S / 2, cy = S / 2;
  const R = (S / 2 - 112) * (1 - pad);          // circle radius
  const ink = 26 * (1 - pad);                    // border width
  const mW = R * 1.84;                           // mascot width
  const mX = cx - mW / 2;
  const mY = cy + R - mW * 0.985;                // bottom-anchored in the circle
  // halftone dots as a pattern
  return `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="4.2" fill="rgba(122,90,217,0.13)"/>
    </pattern>
    <radialGradient id="ring" cx="50%" cy="35%" r="75%">
      <stop offset="0" stop-color="#EAF6E2"/><stop offset="1" stop-color="#BFE3CB"/>
    </radialGradient>
    <clipPath id="circ"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
  </defs>
  <rect width="${S}" height="${S}" fill="#F6F1FF"/>
  <rect width="${S}" height="${S}" fill="url(#dots)"/>
  <circle cx="${cx + 14 * (1 - pad)}" cy="${cy + 17 * (1 - pad)}" r="${R + ink / 2}" fill="rgba(42,37,33,0.85)"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#ring)" stroke="#2A2521" stroke-width="${ink}"/>
  <g clip-path="url(#circ)">
    <image href="data:image/png;base64,${b64}" x="${mX}" y="${mY}" width="${mW}" height="${mW}" preserveAspectRatio="xMidYMax meet"/>
  </g>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#2A2521" stroke-width="${ink}"/>
</svg>`;
}

const jobs = [
  [iconSvg(0), 1024, 'assets/icon.png'],
  [iconSvg(0), 512, 'public/icons/icon-512.png'],
  [iconSvg(0), 192, 'public/icons/icon-192.png'],
  [iconSvg(0), 180, 'public/icons/apple-touch-icon.png'],
  [iconSvg(0.18), 512, 'public/icons/icon-maskable-512.png'], // safe zone for Android masks
];
for (const [svg, size, out] of jobs) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  console.log(`${out} (${size})`);
}
console.log('done');
