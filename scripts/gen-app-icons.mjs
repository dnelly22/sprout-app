// Generates the App Store icon + splash source images (assets/icon.png, assets/splash.png)
// from the brand SVG. Run: node scripts/gen-app-icons.mjs
// Then `npx @capacitor/assets generate --ios` (after `npx cap add ios`) fans them out.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync('public/icons/icon-512.svg', 'utf8');
const squareSvg = svg.replace('rx="108"', 'rx="0"'); // Apple masks corners — keep it a full square, opaque

// App icon: 1024×1024, opaque (no alpha/rounded corners).
await sharp(Buffer.from(squareSvg))
  .resize(1024, 1024)
  .flatten({ background: '#1F8A5B' })
  .png()
  .toFile('assets/icon.png');

// Splash: 2732×2732 cream background with the rounded logo centered.
const logo = await sharp(Buffer.from(svg)).resize(720, 720).png().toBuffer();
await sharp({ create: { width: 2732, height: 2732, channels: 4, background: '#FBF6EC' } })
  .composite([{ input: logo, gravity: 'centre' }])
  .png()
  .toFile('assets/splash.png');

console.log('wrote assets/icon.png (1024) + assets/splash.png (2732)');
