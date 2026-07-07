/**
 * character-voices.ts — gibberish dialogue voices for the boy & girl characters.
 *
 * Two voices: "boy" (lower) and "girl" (higher). No real words — just blips
 * shaped by pitch and emotion, so any language reads the feeling. Pairs with
 * sprout-sounds.ts (the mascot). No audio files; synthesized with Tone.js.
 *
 * SETUP
 *   npm i tone
 *
 * USAGE — text bubble (the main one):
 *   import { speak } from "./character-voices";
 *   // Start when the bubble appears / begins typing:
 *   const v = speak("girl", "Hi! Want to play?", "talking");
 *   // Stop when the bubble finishes or is dismissed:
 *   v.stop();
 *   // Emotion tints the talking: "talking" | "happy" | "sad" | "mad"
 *
 * USAGE — one-shot reaction:
 *   import { react } from "./character-voices";
 *   react("boy", "laughMean");   // snide laugh
 *   react("girl", "curious");    // questioning "hmm?"
 *   // also: "surprised" | "happy" | "sad" | "mad"
 *
 * TIP: the returned handle has `.durationMs` (estimated). Reveal the bubble
 * text over that span so the voice and typing finish together, and call
 * v.stop() if the player dismisses the bubble early. Use { rate } to speed
 * up or slow down.
 */

import * as Tone from "tone";

export type Character = "boy" | "girl";
export type TalkEmotion = "talking" | "happy" | "sad" | "mad";
export type ReactEmotion = "laughMean" | "curious" | "surprised" | "happy" | "sad" | "mad";

let out: any = null;
let started = false;

async function ensure() {
  if (started && out) return out;
  await Tone.start();
  try { out = new Tone.Reverb({ decay: 0.8, wet: 0.12 }).toDestination(); }
  catch { out = Tone.getDestination(); }
  started = true;
  return out;
}

const dest = () => out ?? Tone.getDestination();
const disposeLater = (nodes: any[], ms: number) =>
  setTimeout(() => nodes.forEach((n) => { try { n.dispose(); } catch {} }), ms);
const jit = (n: number, amt = 0.06) => n * (1 + (Math.random() - 0.5) * amt);

// Base voice per character.
function charCfg(c: Character) {
  return c === "girl"
    ? { center: 560, filter: 3000, harmonicity: 2, modIndex: 3 }
    : { center: 380, filter: 2300, harmonicity: 1.6, modIndex: 4 };
}

function makeVoice(filterFreq: number, type: any, harmonicity: number, modIndex: number, vol: number) {
  const filter = new Tone.Filter(filterFreq, "lowpass").connect(dest());
  const v = new Tone.FMSynth({
    harmonicity, modulationIndex: modIndex,
    oscillator: { type },
    envelope: { attack: 0.008, decay: 0.07, sustain: 0.4, release: 0.06 },
    modulation: { type: "sine" },
    modulationEnvelope: { attack: 0.008, decay: 0.08, sustain: 0.3, release: 0.08 },
    volume: vol,
  }).connect(filter);
  return { v, filter };
}

// Animalese-style voice: a fast blip per letter, each a short pitched "bweep"
// that bounces around a high, cute range, with a quick pitch-bend inside each
// blip. Liveliness comes from per-blip pitch jumps + the bend, not a melody.
const PITCH: Record<Character, { center: number; lo: number; hi: number }> = {
  girl: { center: 720, lo: -3, hi: 6 },
  boy: { center: 540, lo: -4, hi: 5 },
};

// ---- Streaming bubble voice (Animalese-style blippy gibberish) ----
export function speak(
  character: Character,
  text: string,
  emotion: TalkEmotion = "talking",
  opts: { rate?: number } = {}
): { stop: () => void; durationMs: number } {
  const handle: any = { stop: () => {}, durationMs: 0 };
  let stopped = false;

  const e = {
    talking: { perChar: 58, dur: 0.05,  lp: 2200, glide: 0.07, osc: "square",   vol: -11, drift: 0 },
    happy:   { perChar: 50, dur: 0.05,  lp: 2600, glide: 0.09, osc: "square",   vol: -10, drift: 3 },
    sad:     { perChar: 82, dur: 0.075, lp: 1600, glide: 0.06, osc: "triangle", vol: -12, drift: -4 },
    mad:     { perChar: 48, dur: 0.045, lp: 3400, glide: 0.1,  osc: "square",   vol: -9,  drift: -2 },
  }[emotion];

  const rate = opts.rate ?? 1;
  const chars = text.replace(/\s+/g, " ");
  const letters = chars.replace(/ /g, "").length;
  handle.durationMs = Math.round(letters * e.perChar * rate + 150);

  (async () => {
    await ensure();
    if (stopped) return;
    const o = dest();

    const lp = new Tone.Filter(e.lp, "lowpass").connect(o);
    const synth = new Tone.Synth({
      oscillator: { type: e.osc as any },
      envelope: { attack: 0.004, decay: e.dur, sustain: 0, release: 0.04 },
      volume: e.vol,
    }).connect(lp);

    const P = PITCH[character];
    const isQuestion = /\?\s*$/.test(text);
    let i = 0, lastSemi = 99;
    const finish = () => disposeLater([synth, lp], 250);
    let timer: any;

    const step = () => {
      if (stopped || i >= chars.length) { finish(); return; }
      const ch = chars[i]; i++;
      if (ch === " ") { timer = setTimeout(step, e.perChar * rate * 0.7); return; } // word gap, no blip

      const t = Tone.now() + 0.02;
      let semi = Math.floor(P.lo + Math.random() * (P.hi - P.lo + 1));
      if (semi === lastSemi) semi = semi < P.hi ? semi + 1 : semi - 1; // always bounce off last
      lastSemi = semi;
      if (i >= chars.length) semi = isQuestion ? P.hi : P.lo;          // end cadence
      const drift = e.drift * (i / chars.length - 0.3);
      const startHz = P.center * Math.pow(2, (semi + drift) / 12);
      const endHz = startHz * (1 + (Math.random() - 0.5) * 2 * e.glide); // the little "bweep"
      const dur = e.dur * (0.85 + Math.random() * 0.3);

      synth.triggerAttack(startHz, t);
      synth.frequency.setValueAtTime(startHz, t);
      synth.frequency.linearRampToValueAtTime(endHz, t + dur);
      synth.triggerRelease(t + dur);

      timer = setTimeout(step, e.perChar * rate * (0.85 + Math.random() * 0.3));
    };

    timer = setTimeout(step, 10);
    handle.stop = () => { stopped = true; clearTimeout(timer); finish(); };
  })();

  return handle;
}

// ---- One-shot emotional bursts ----
type Syl = { f: number; to: number; dur: number; gap?: number };

function playPhrase(character: Character, syllables: Syl[], o: { type?: any; biteFilter?: number; vol?: number }) {
  const base = charCfg(character);
  const { v, filter } = makeVoice(
    o.biteFilter ?? base.filter,
    o.type ?? "sine",
    base.harmonicity,
    base.modIndex,
    o.vol ?? -6
  );
  let t = Tone.now();
  for (const s of syllables) {
    const d = jit(s.dur, 0.1);
    v.triggerAttack(jit(s.f), t);
    v.frequency.rampTo(jit(s.to), d * 0.85, t);
    v.triggerRelease(t + d);
    t += d + (s.gap ?? 0.04);
  }
  disposeLater([v, filter], (t - Tone.now()) * 1000 + 500);
}

export async function react(character: Character, emotion: ReactEmotion): Promise<void> {
  await ensure();
  const C = charCfg(character).center;

  if (emotion === "laughMean") {
    // Snide, descending "heh-heh-heh-hehh" with a saw bite.
    playPhrase(character, [
      { f: 0.98 * C, to: 0.96 * C, dur: 0.09, gap: 0.05 },
      { f: 0.96 * C, to: 0.93 * C, dur: 0.09, gap: 0.05 },
      { f: 0.92 * C, to: 0.88 * C, dur: 0.09, gap: 0.05 },
      { f: 0.86 * C, to: 0.78 * C, dur: 0.16, gap: 0 },
    ], { type: "sawtooth", biteFilter: charCfg(character).filter + 800, vol: -6 });
  }

  if (emotion === "curious") {
    playPhrase(character, [
      { f: 0.9 * C, to: 0.93 * C, dur: 0.12, gap: 0.05 },
      { f: 0.95 * C, to: 1.3 * C, dur: 0.2, gap: 0 }, // rise = question
    ], {});
  }

  if (emotion === "surprised") {
    playPhrase(character, [
      { f: 1.0 * C, to: 1.02 * C, dur: 0.05, gap: 0.03 },
      { f: 1.42 * C, to: 1.5 * C, dur: 0.16, gap: 0 }, // sharp jump up
    ], {});
  }

  if (emotion === "happy") {
    playPhrase(character, [
      { f: 1.0 * C, to: 1.12 * C, dur: 0.09, gap: 0.04 },
      { f: 1.15 * C, to: 1.28 * C, dur: 0.09, gap: 0.04 },
      { f: 1.25 * C, to: 1.45 * C, dur: 0.13, gap: 0 },
    ], {});
  }

  if (emotion === "sad") {
    playPhrase(character, [
      { f: 1.0 * C, to: 0.85 * C, dur: 0.18, gap: 0.05 },
      { f: 0.82 * C, to: 0.68 * C, dur: 0.22, gap: 0.05 },
      { f: 0.66 * C, to: 0.5 * C, dur: 0.32, gap: 0 },
    ], { vol: -8 });
  }

  if (emotion === "mad") {
    playPhrase(character, [
      { f: 0.72 * C, to: 0.6 * C, dur: 0.09, gap: 0.035 },
      { f: 0.66 * C, to: 0.55 * C, dur: 0.09, gap: 0.035 },
      { f: 0.78 * C, to: 0.6 * C, dur: 0.09, gap: 0.035 },
      { f: 0.6 * C, to: 0.5 * C, dur: 0.12, gap: 0 },
    ], { type: "sawtooth", biteFilter: charCfg(character).filter + 700, vol: -6 });
  }
}
