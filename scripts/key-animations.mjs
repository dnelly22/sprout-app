// Offline port of the APPROVED background-removal pipeline from
// design_handoff_animations/"Animation Background Tests v2.html" (keyFrame + CONF
// are the spec — ported near-verbatim; do not "simplify" the enclosed-pocket
// protection or the edge finishing, they are load-bearing).
//
// Pipeline per frame: per-pixel background model interpolated from border samples
// → border flood fill (local-model OR global-color match) → shadow pass (kids)
// → protected enclosed-pocket removal (keeps eyes/teeth) → magenta pass (growth)
// → soft edge band with despill → speckle cleanup → 3 gaussian alpha passes +
// edge chroma smoothing.
//
// Frames are processed at 640×640 (the spec's PROC supersample) and emitted at
// the app size. Run: node scripts/key-animations.mjs [nameFilter]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir, homedir } from 'node:os';
import sharp from 'sharp';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(homedir(), 'Downloads', 'design_handoff_animations', 'assets');
const PROC = 640;
const FPS = 10;
const MAX_FRAMES = 70;

const KID = { shadow: true, enclosedMin: 100, protect: true, tol: 12 };
const JOBS = [
  // [src, out, conf, loop, outSize]
  ['sprout/Sprout - idle 1.gif',              'public/assets/mascot/sprout-idle.webp',       { enclosedMin: 30 }, 0, 320],
  ['sprout/Sprout Jump 1.gif',                'public/assets/mascot/sprout-jump1.webp',      { enclosedMin: 30 }, 1, 320],
  ['sprout/Sprout - growth 1.gif',            'public/assets/mascot/sprout-growth.webp',     { magenta: true, enclosedMin: 30 }, 1, 320],
  // NOTE: sad/thinking/sunglasses/surprised are NOT in the reference CONF —
  // like sleeping, they get NO enclosed-pocket removal so their white eyes survive.
  ['sprout/sprout - sad 1.gif',               'public/assets/mascot/sprout-sad.webp',        {}, 1, 320],
  ['sprout/sprout - thinking.gif',            'public/assets/mascot/sprout-thinking.webp',   {}, 1, 320],
  ['sprout/sprout - putting sunglasses 1.gif','public/assets/mascot/sprout-sunglasses.webp', {}, 1, 320],
  ['sprout/sprout - reading book 1.gif',      'public/assets/mascot/sprout-reading.webp',    { enclosedMin: 30 }, 1, 320],
  ['sprout/sprout - surprised.gif',           'public/assets/mascot/sprout-surprised.webp',  {}, 1, 320],
  ['sprout/sprout - sleeping.gif',            'public/assets/mascot/sprout-sleeping.webp',   {}, 1, 320],
  ['sprout/group - waving.gif',               'public/assets/mascot/group-waving.webp',      KID, 0, 480],
  ['kids/boy - idle new.gif',                 'public/assets/journey/characters/boy-idle.webp',      KID, 1, 400],
  ['kids/boy - laughing new.gif',             'public/assets/journey/characters/boy-laughing.webp',  KID, 1, 400],
  ['kids/boy - mean new.gif',                 'public/assets/journey/characters/boy-mean.webp',      KID, 1, 400],
  ['kids/boy - thinking new.gif',             'public/assets/journey/characters/boy-thinking.webp',  KID, 1, 400],
  ['kids/girl - idle new.gif',                'public/assets/journey/characters/girl-idle.webp',     KID, 1, 400],
  ['kids/gilr - laughing new.gif',            'public/assets/journey/characters/girl-laughing.webp', KID, 1, 400],
  ['kids/girl - mean new.gif',                'public/assets/journey/characters/girl-mean.webp',     KID, 1, 400],
  ['kids/girl - snarky new.gif',              'public/assets/journey/characters/girl-snarky.webp',   KID, 1, 400],
  ['kids/girl - thinking new.gif',            'public/assets/journey/characters/girl-thinking.webp', KID, 1, 400],
];

/* ---------- keyFrame: verbatim port (d = RGBA Uint8ClampedArray, S = side) ---------- */
function keyFrame(d, S, conf) {
  conf = conf || {};
  const N = S * S;
  const mn3 = (o) => Math.min(d[o], d[o + 1], d[o + 2]);

  let gR = 255, gG = 255, gB = 255, gBest = -1;
  {
    const consider = (i) => {
      const o = i * 4, mx = Math.max(d[o], d[o + 1], d[o + 2]), mn = mn3(o);
      if (mn > 170 && (mx - mn) < 26 && mn > gBest) { gBest = mn; gR = d[o]; gG = d[o + 1]; gB = d[o + 2]; }
    };
    for (let t = 0; t < S; t++) { consider(t); consider((S - 1) * S + t); consider(t * S); consider(t * S + S - 1); }
  }

  function borderLine(idx) {
    const arr = new Float32Array(S * 3), valid = [];
    for (let t = 0; t < S; t++) {
      const o = idx(t) * 4, mx = Math.max(d[o], d[o + 1], d[o + 2]), mn = mn3(o);
      if (mn > 170 && (mx - mn) < 26 && (Math.abs(d[o] - gR) + Math.abs(d[o + 1] - gG) + Math.abs(d[o + 2] - gB)) < 45) {
        arr[t * 3] = d[o]; arr[t * 3 + 1] = d[o + 1]; arr[t * 3 + 2] = d[o + 2]; valid.push(t);
      }
    }
    if (!valid.length) { for (let t = 0; t < S; t++) { arr[t * 3] = gR; arr[t * 3 + 1] = gG; arr[t * 3 + 2] = gB; } return arr; }
    for (let k = 0; k <= valid.length; k++) {
      const a = (k === 0) ? -1 : valid[k - 1], b = (k === valid.length) ? S : valid[k];
      for (let t2 = a + 1; t2 < b; t2++) {
        if (a < 0) { arr[t2 * 3] = arr[b * 3]; arr[t2 * 3 + 1] = arr[b * 3 + 1]; arr[t2 * 3 + 2] = arr[b * 3 + 2]; }
        else if (b >= S) { arr[t2 * 3] = arr[a * 3]; arr[t2 * 3 + 1] = arr[a * 3 + 1]; arr[t2 * 3 + 2] = arr[a * 3 + 2]; }
        else {
          const f = (t2 - a) / (b - a);
          arr[t2 * 3] = arr[a * 3] * (1 - f) + arr[b * 3] * f;
          arr[t2 * 3 + 1] = arr[a * 3 + 1] * (1 - f) + arr[b * 3 + 1] * f;
          arr[t2 * 3 + 2] = arr[a * 3 + 2] * (1 - f) + arr[b * 3 + 2] * f;
        }
      }
    }
    return arr;
  }
  const top = borderLine((t) => t), bot = borderLine((t) => (S - 1) * S + t);
  const lef = borderLine((t) => t * S), rig = borderLine((t) => t * S + S - 1);
  const mR = new Uint8ClampedArray(N), mG = new Uint8ClampedArray(N), mB = new Uint8ClampedArray(N);
  for (let y0 = 0; y0 < S; y0++) {
    const wy = y0 / (S - 1);
    for (let x0 = 0; x0 < S; x0++) {
      const wx = x0 / (S - 1), i0 = y0 * S + x0;
      mR[i0] = (top[x0 * 3] * (1 - wy) + bot[x0 * 3] * wy + lef[y0 * 3] * (1 - wx) + rig[y0 * 3] * wx) / 2;
      mG[i0] = (top[x0 * 3 + 1] * (1 - wy) + bot[x0 * 3 + 1] * wy + lef[y0 * 3 + 1] * (1 - wx) + rig[y0 * 3 + 1] * wx) / 2;
      mB[i0] = (top[x0 * 3 + 2] * (1 - wy) + bot[x0 * 3 + 2] * wy + lef[y0 * 3 + 2] * (1 - wx) + rig[y0 * 3 + 2] * wx) / 2;
    }
  }
  const dist = (i) => { const o = i * 4; return Math.abs(d[o] - mR[i]) + Math.abs(d[o + 1] - mG[i]) + Math.abs(d[o + 2] - mB[i]); };
  const dG = (i) => { const o = i * 4; return Math.abs(d[o] - gR) + Math.abs(d[o + 1] - gG) + Math.abs(d[o + 2] - gB); };
  const magCast = (i) => { const o = i * 4; return Math.min(d[o], d[o + 2]) - d[o + 1]; };
  const TOL = conf.tol || 16;
  const bg = new Uint8Array(N); let stack = [];
  const isBg = (i) => dist(i) < TOL || dG(i) < 18 || (conf.magenta && magCast(i) > 44);
  for (let x = 0; x < S; x++) {
    for (const i of [x, (S - 1) * S + x, x * S, x * S + S - 1]) if (!bg[i] && isBg(i)) { bg[i] = 1; stack.push(i); }
  }
  while (stack.length) {
    const i = stack.pop(), px = i % S, py = (i - px) / S;
    if (px > 0) { const j = i - 1; if (!bg[j] && isBg(j)) { bg[j] = 1; stack.push(j); } }
    if (px < S - 1) { const j = i + 1; if (!bg[j] && isBg(j)) { bg[j] = 1; stack.push(j); } }
    if (py > 0) { const j = i - S; if (!bg[j] && isBg(j)) { bg[j] = 1; stack.push(j); } }
    if (py < S - 1) { const j = i + S; if (!bg[j] && isBg(j)) { bg[j] = 1; stack.push(j); } }
  }
  if (conf.shadow) {
    const st2 = [];
    const isShadow = (j) => {
      const o = j * 4, mx = Math.max(d[o], d[o + 1], d[o + 2]), mn = mn3(o);
      if (!(mn >= 168 && (mx - mn) <= 16)) return false;
      const lum = (d[o] + d[o + 1] + d[o + 2]) / 3, mlum = (mR[j] + mG[j] + mB[j]) / 3;
      if (mlum - lum < 6 || mlum - lum > 85) return false;
      return ((j - (j % S)) / S) > S * 0.52;
    };
    for (let s1 = 0; s1 < N; s1++) {
      if (bg[s1] || !isShadow(s1)) continue;
      const ps = s1 % S, qs = (s1 - ps) / S;
      if ((ps > 0 && bg[s1 - 1]) || (ps < S - 1 && bg[s1 + 1]) || (qs > 0 && bg[s1 - S]) || (qs < S - 1 && bg[s1 + S])) { bg[s1] = 1; st2.push(s1); }
    }
    while (st2.length) {
      const i3 = st2.pop(), p3 = i3 % S, q3 = (i3 - p3) / S;
      for (const [nx, ny] of [[p3 - 1, q3], [p3 + 1, q3], [p3, q3 - 1], [p3, q3 + 1]]) {
        if (nx < 0 || nx >= S || ny < 0 || ny >= S) continue;
        const j3 = ny * S + nx;
        if (!bg[j3] && isShadow(j3)) { bg[j3] = 1; st2.push(j3); }
      }
    }
  }
  let near = null;
  if (conf.protect) {
    near = new Uint8Array(N); const q = []; let head = 0;
    for (let nb = 0; nb < N; nb++) if (bg[nb]) { near[nb] = 9; q.push(nb); }
    while (head < q.length) {
      const cn = q[head++], dep = near[cn] - 1;
      if (dep <= 0) continue;
      const nx = cn % S, ny = (cn - nx) / S;
      if (nx > 0 && near[cn - 1] < dep) { near[cn - 1] = dep; q.push(cn - 1); }
      if (nx < S - 1 && near[cn + 1] < dep) { near[cn + 1] = dep; q.push(cn + 1); }
      if (ny > 0 && near[cn - S] < dep) { near[cn - S] = dep; q.push(cn - S); }
      if (ny < S - 1 && near[cn + S] < dep) { near[cn + S] = dep; q.push(cn + S); }
    }
  }
  if (conf.enclosedMin) {
    const seen = new Uint8Array(N);
    for (let e = 0; e < N; e++) {
      if (seen[e] || bg[e] || (dist(e) >= 16 && dG(e) >= 18)) continue;
      const comp = [e]; let read = 0, touchesNear = false; seen[e] = 1;
      while (read < comp.length) {
        const c0 = comp[read++];
        if (near && near[c0]) touchesNear = true;
        const cx = c0 % S, cy = (c0 - cx) / S;
        for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
          if (nx < 0 || nx >= S || ny < 0 || ny >= S) continue;
          const j2 = ny * S + nx;
          if (!seen[j2] && !bg[j2] && (dist(j2) < 16 || dG(j2) < 18)) { seen[j2] = 1; comp.push(j2); }
        }
      }
      const isGap = !conf.protect || touchesNear || comp.length >= 3000;
      if (comp.length >= conf.enclosedMin && isGap) for (let ci = 0; ci < comp.length; ci++) bg[comp[ci]] = 1;
    }
  }
  if (conf.magenta) for (let g2 = 0; g2 < N; g2++) if (!bg[g2] && magCast(g2) > 44) bg[g2] = 1;

  const band = new Uint8Array(N);
  const mark = (from, val) => {
    for (let i = 0; i < N; i++) {
      if (bg[i] || band[i]) continue;
      const px = i % S, py = (i - px) / S;
      if ((px > 0 && from(i - 1)) || (px < S - 1 && from(i + 1)) || (py > 0 && from(i - S)) || (py < S - 1 && from(i + S))) band[i] = val;
    }
  };
  mark((j) => bg[j] === 1, 1); mark((j) => band[j] === 1, 2); mark((j) => band[j] === 2, 3); mark((j) => band[j] === 3, 4);
  for (let i2 = 0; i2 < N; i2++) {
    const o = i2 * 4;
    if (bg[i2]) { d[o + 3] = 0; continue; }
    if (!band[i2] || band[i2] > 2) continue;
    const dd = dist(i2);
    let a = Math.round(255 * Math.max(0, Math.min(1, (dd - 10) / 64)));
    if (band[i2] === 2) a = Math.max(a, 210);
    if (a <= 6) { d[o + 3] = 0; continue; }
    if (conf.magenta) {
      const mc = magCast(i2);
      if (mc > 40) { d[o + 3] = 0; continue; }
      if (mc > 8) { d[o] = d[o] - (mc - 8); d[o + 2] = Math.max(0, d[o + 2] - Math.round((mc - 8) * 0.9)); }
    }
    if (a < 255) {
      const af = a / 255, inv = 1 - af;
      d[o] = Math.max(0, Math.min(255, Math.round((d[o] - mR[i2] * inv) / af)));
      d[o + 1] = Math.max(0, Math.min(255, Math.round((d[o + 1] - mG[i2] * inv) / af)));
      d[o + 2] = Math.max(0, Math.min(255, Math.round((d[o + 2] - mB[i2] * inv) / af)));
      d[o + 3] = a;
    }
  }
  const A0 = new Uint8Array(N);
  for (let s0 = 0; s0 < N; s0++) A0[s0] = d[s0 * 4 + 3];
  for (let sp = 0; sp < N; sp++) {
    if (A0[sp] === 0 || dist(sp) >= 40) continue;
    const px4 = sp % S, py4 = (sp - px4) / S; let tn = 0;
    if (px4 > 0 && A0[sp - 1] === 0) tn++;
    if (px4 < S - 1 && A0[sp + 1] === 0) tn++;
    if (py4 > 0 && A0[sp - S] === 0) tn++;
    if (py4 < S - 1 && A0[sp + S] === 0) tn++;
    if (tn >= 2) d[sp * 4 + 3] = 0;
  }
  for (let pass = 0; pass < 3; pass++) {
    const A = new Float32Array(N);
    for (let s3 = 0; s3 < N; s3++) A[s3] = d[s3 * 4 + 3];
    for (let s4 = 0; s4 < N; s4++) {
      if (!band[s4] || band[s4] > 3) continue;
      const sx = s4 % S, sy = (s4 - sx) / S;
      if (sx < 1 || sx >= S - 1 || sy < 1 || sy >= S - 1) continue;
      const sum = 4 * A[s4] + 2 * (A[s4 - 1] + A[s4 + 1] + A[s4 - S] + A[s4 + S]) + (A[s4 - S - 1] + A[s4 - S + 1] + A[s4 + S - 1] + A[s4 + S + 1]);
      d[s4 * 4 + 3] = Math.round(sum / 16);
    }
  }
  const C0 = new Uint8ClampedArray(d);
  for (let c4 = 0; c4 < N; c4++) {
    if (!band[c4] || band[c4] > 2) continue;
    const cxp = c4 % S, cyp = (c4 - cxp) / S;
    if (cxp < 1 || cxp >= S - 1 || cyp < 1 || cyp >= S - 1) continue;
    let wr = 0, wg = 0, wb = 0, wt = 0;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const nn = c4 + oy * S + ox, on = nn * 4, wA = C0[on + 3] * ((ox || oy) ? 1 : 2);
      if (!wA) continue;
      wr += C0[on] * wA; wg += C0[on + 1] * wA; wb += C0[on + 2] * wA; wt += wA;
    }
    if (wt > 0) { const oc = c4 * 4; d[oc] = Math.round(wr / wt); d[oc + 1] = Math.round(wg / wt); d[oc + 2] = Math.round(wb / wt); }
  }
}

/* ---------- driver ---------- */
async function processFile(src, out, conf, loop, outSize) {
  const td = mkdtempSync(join(tmpdir(), 'keyanim-'));
  try {
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', join(SRC, src),
      '-vf', `fps=${FPS},scale=${PROC}:${PROC}`, join(td, 'f%04d.png')]);
    let frames = readdirSync(td).filter((f) => f.startsWith('f')).sort();
    const stride = Math.max(1, Math.ceil(frames.length / MAX_FRAMES));
    frames = frames.filter((_, i) => i % stride === 0);
    const dur = Math.round(1000 / FPS * stride);
    const args = ['-loop', String(loop)];
    for (let k = 0; k < frames.length; k++) {
      const { data } = await sharp(join(td, frames[k])).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const d = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
      keyFrame(d, PROC, conf);
      const op = join(td, `o${String(k).padStart(4, '0')}.png`);
      await sharp(Buffer.from(d.buffer, d.byteOffset, d.length), { raw: { width: PROC, height: PROC, channels: 4 } })
        .resize(outSize, outSize).png().toFile(op);
      args.push('-d', String(dur), '-lossy', '-q', '60', op);
    }
    args.push('-o', join(ROOT, out));
    execFileSync('img2webp', args);
    console.log(`${out}  ${frames.length}f  ${Math.round(statSync(join(ROOT, out)).size / 1024)}KB`);
  } finally {
    rmSync(td, { recursive: true, force: true });
  }
}

const filter = process.argv[2];
for (const [src, out, conf, loop, outSize] of JOBS) {
  if (filter && !out.includes(filter)) continue;
  await processFile(src, out, conf, loop, outSize);
}
console.log('done');
