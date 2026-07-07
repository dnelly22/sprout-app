// Processes the founder's character/mascot animation GIFs into transparent
// animated WebPs: samples each file's background color from a corner, chroma-keys
// it (tight similarity + small blend = sharp-but-feathered edges), scales, and
// encodes. Boy/girl mood clips use loop=1 (play once, freeze on last frame);
// the sprout idle loops forever. Run: node scripts/process-journey-anims.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SRC = join(homedir(), 'Downloads', 'Sprout App Animations');
const CHAR_OUT = 'public/assets/journey/characters';
const MASCOT_OUT = 'public/assets/mascot';
mkdirSync(CHAR_OUT, { recursive: true });

const CHARACTERS = [
  ['boy - idle.gif', 'boy-idle'],
  ['boy - laughing.gif', 'boy-laughing'],
  ['boy - thinking.gif', 'boy-thinking'],
  ['boy - mad.gif', 'boy-mad'],
  ['Boy - big wave.gif', 'boy-wave'],
  ['girl - idle.gif', 'girl-idle'],
  ['girl - laughing.gif', 'girl-laughing'],
  ['girl - thinking.gif', 'girl-thinking'],
  ['girl - mean.gif', 'girl-mean'],
  ['girl - snarky.gif', 'girl-snarky'],
  ['Girl - big wave.gif', 'girl-wave'],
];

function bgColor(file) {
  // sample the top-left corner pixel (2,2) of the first frame
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-frames:v', '1',
    '-vf', 'crop=1:1:2:2', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  return raw.subarray(0, 3).toString('hex');
}

function key(file, out, { height = 400, fps = 10, loop = 1, quality = 48 }) {
  const bg = bgColor(file);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', file,
    '-vf', `colorkey=0x${bg}:0.08:0.12,format=rgba,fps=${fps},scale=-2:${height}`,
    '-c:v', 'libwebp_anim', '-lossless', '0', '-q:v', String(quality), '-loop', String(loop),
    out]);
  console.log(`${out}  (bg #${bg})`);
}

// --- journey characters: play once, freeze on last frame ---
for (const [file, name] of CHARACTERS) {
  key(join(SRC, file), join(CHAR_OUT, `${name}.webp`), { loop: 1 });
}

// --- mascot: new art set (idle loops; jump plays and the app returns it to idle) ---
// back up the previous art once
const bak = join(MASCOT_OUT, '_prev_art');
mkdirSync(bak, { recursive: true });
for (const f of ['sprout-idle.webp', 'sprout-idle.gif', 'sprout-jump1.webp', 'sprout-jump1.gif']) {
  const p = join(MASCOT_OUT, f);
  if (existsSync(p) && !existsSync(join(bak, f))) copyFileSync(p, join(bak, f));
}
key(join(SRC, 'Sprout - idle 1.gif'), join(MASCOT_OUT, 'sprout-idle.webp'), { height: 320, loop: 0 });
key(join(SRC, 'Sprout Jump 1.gif'), join(MASCOT_OUT, 'sprout-jump1.webp'), { height: 320, loop: 0 });

// gif fallbacks for the mascot (1-bit alpha, used only by non-webp browsers)
for (const [src, out] of [['Sprout - idle 1.gif', 'sprout-idle.gif'], ['Sprout Jump 1.gif', 'sprout-jump1.gif']]) {
  const bg = bgColor(join(SRC, src));
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', join(SRC, src),
    '-filter_complex', `[0:v]colorkey=0x${bg}:0.08:0.12,format=rgba,fps=12,scale=-2:320,split[a][b];[a]palettegen=reserve_transparent=1[p];[b][p]paletteuse=alpha_threshold=128`,
    '-loop', '0', join(MASCOT_OUT, out)]);
  console.log(`${join(MASCOT_OUT, out)}  (gif fallback)`);
}
console.log('done');
