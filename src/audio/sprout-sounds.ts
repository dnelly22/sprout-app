/**
 * sprout-sounds.ts — Sprout's complete sound system.
 *
 * No audio files. Everything is synthesized at runtime with Tone.js,
 * so it works offline and adds ~0 KB of assets.
 *
 * SETUP
 *   npm i tone
 *
 * USAGE
 *   import { initSound, playSound, sproutVoice } from "./sprout-sounds";
 *
 *   // Call once, inside the FIRST user tap (browsers require a gesture):
 *   onFirstTap = () => { void initSound(); };
 *
 *   // Then anywhere:
 *   playSound("pop");           // button tap
 *   playSound("enter");         // entering a game
 *   playSound("answerBest");    // child picked the best option
 *   playSound("answerMid");     // a decent option
 *   playSound("answerThird");   // a weaker option (gentle, never punishing)
 *   playSound("celebrate");     // big end-of-journey finale
 *   sproutVoice("happy");       // mascot reacts, no words, any language
 *
 * All sounds auto-initialize audio if needed, so calling them from a
 * click handler before initSound() still works.
 */

import * as Tone from "tone";

export type SoundId =
  | "answerBest"
  | "answerMid"
  | "answerThird"
  | "tryagain"
  | "star"
  | "grow"
  | "cheer"
  | "celebrate"
  | "enter"
  | "pop"
  | "hello"
  | "curious";

export type Mood = "happy" | "sad" | "mad";

let out: any = null;
let started = false;

/** Resume the audio context. Call inside a user gesture (first tap). */
export async function initSound(): Promise<void> {
  if (started) return;
  await Tone.start();
  try {
    out = new Tone.Reverb({ decay: 0.9, wet: 0.14 }).toDestination();
  } catch {
    out = Tone.getDestination();
  }
  started = true;
}

function dest() {
  return out ?? Tone.getDestination();
}

function disposeLater(nodes: any[], ms: number) {
  setTimeout(() => nodes.forEach((n) => { try { n.dispose(); } catch {} }), ms);
}

function tone(type: any, env: any) {
  return new Tone.Synth({ oscillator: { type }, envelope: env, volume: -6 }).connect(dest());
}

// Small random wiggle so Sprout's voice feels alive, not looped.
function jit(n: number, amt = 0.05) {
  return n * (1 + (Math.random() - 0.5) * amt);
}

type Syllable = { from: number; to: number; dur: number; gap?: number };

function playVoice(
  syllables: Syllable[],
  opts: { harmonicity: number; modIndex: number; type?: any; filterFreq: number; vol: number }
) {
  const filter = new Tone.Filter(opts.filterFreq, "lowpass").connect(dest());
  const v = new Tone.FMSynth({
    harmonicity: opts.harmonicity,
    modulationIndex: opts.modIndex,
    oscillator: { type: opts.type || "sine" },
    envelope: { attack: 0.012, decay: 0.08, sustain: 0.5, release: 0.07 },
    modulation: { type: "sine" },
    modulationEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.1 },
    volume: opts.vol,
  }).connect(filter);

  let t = Tone.now();
  for (const s of syllables) {
    const from = jit(s.from);
    const to = jit(s.to);
    const dur = jit(s.dur, 0.12);
    v.triggerAttack(from, t);
    v.frequency.rampTo(to, dur * 0.85, t);
    v.triggerRelease(t + dur);
    t += dur + (s.gap ?? 0.04);
  }
  disposeLater([v, filter], (t - Tone.now()) * 1000 + 600);
}

/** Sprout's non-verbal voice — emotion carried by pitch shape, not words. */
export async function sproutVoice(mood: Mood): Promise<void> {
  await initSound();

  if (mood === "happy") {
    playVoice(
      [
        { from: 440, to: 540, dur: 0.1, gap: 0.04 },
        { from: 560, to: 650, dur: 0.1, gap: 0.04 },
        { from: 680, to: 790, dur: 0.1, gap: 0.04 },
        { from: 760, to: 900, dur: 0.15, gap: 0 },
      ],
      { harmonicity: 2, modIndex: 3, filterFreq: 2800, vol: -5 }
    );
  }

  if (mood === "sad") {
    playVoice(
      [
        { from: 430, to: 360, dur: 0.18, gap: 0.05 },
        { from: 350, to: 300, dur: 0.22, gap: 0.05 },
        { from: 300, to: 205, dur: 0.34, gap: 0 },
      ],
      { harmonicity: 2, modIndex: 2, filterFreq: 1300, vol: -7 }
    );
  }

  if (mood === "mad") {
    playVoice(
      [
        { from: 200, to: 150, dur: 0.09, gap: 0.035 },
        { from: 185, to: 138, dur: 0.09, gap: 0.035 },
        { from: 215, to: 150, dur: 0.09, gap: 0.035 },
        { from: 160, to: 125, dur: 0.13, gap: 0 },
      ],
      { harmonicity: 1.5, modIndex: 8, type: "sawtooth", filterFreq: 3200, vol: -6 }
    );
  }
}

/** All non-voice sounds: UI, answer feedback, rewards, celebration. */
export async function playSound(id: SoundId): Promise<void> {
  await initSound();
  const t = Tone.now();

  switch (id) {
    // ---- Answer feedback (quick-fire / journey choices) ----
    case "answerBest": {
      const s = tone("triangle", { attack: 0.01, decay: 0.16, sustain: 0, release: 0.2 });
      ["C5", "E5", "G5", "C6"].forEach((n, i) => s.triggerAttackRelease(n, 0.1, t + i * 0.09));
      const sp = tone("sine", { attack: 0.005, decay: 0.22, sustain: 0, release: 0.22 });
      ["E6", "G6", "C7"].forEach((n, i) => sp.triggerAttackRelease(n, 0.08, t + 0.38 + i * 0.07));
      disposeLater([s, sp], 1100);
      break;
    }
    case "answerMid": {
      const s = tone("triangle", { attack: 0.01, decay: 0.18, sustain: 0, release: 0.22 });
      s.triggerAttackRelease("C5", 0.11, t);
      s.triggerAttackRelease("E5", 0.16, t + 0.1);
      disposeLater([s], 700);
      break;
    }
    case "answerThird": {
      // Gentle, neutral, never a buzzer. A soft "okay, there's a better one."
      const s = tone("triangle", { attack: 0.02, decay: 0.22, sustain: 0, release: 0.28 });
      s.volume.value = -9;
      s.triggerAttackRelease("C5", 0.14, t);
      s.triggerAttackRelease("A4", 0.2, t + 0.14);
      disposeLater([s], 800);
      break;
    }
    case "tryagain": {
      // Encouraging lilt: dips then lifts ("pick it back up").
      const s = tone("triangle", { attack: 0.02, decay: 0.24, sustain: 0, release: 0.3 });
      s.volume.value = -7;
      s.triggerAttackRelease("F4", 0.16, t);
      s.triggerAttackRelease("A4", 0.22, t + 0.16);
      disposeLater([s], 800);
      break;
    }

    // ---- Rewards & progress ----
    case "star": {
      const s = tone("sine", { attack: 0.005, decay: 0.25, sustain: 0, release: 0.25 });
      ["E6", "A6", "C7"].forEach((n, i) => s.triggerAttackRelease(n, 0.08, t + i * 0.07));
      disposeLater([s], 800);
      break;
    }
    case "grow": {
      const sweep = tone("sine", { attack: 0.02, decay: 0.4, sustain: 0.2, release: 0.4 });
      sweep.triggerAttack("C4", t);
      sweep.frequency.rampTo("C6", 0.45, t);
      sweep.triggerRelease(t + 0.5);
      const chord = ["C5", "E5", "G5"].map(() =>
        tone("triangle", { attack: 0.02, decay: 0.5, sustain: 0, release: 0.5 })
      );
      ["C5", "E5", "G5"].forEach((n, i) => chord[i].triggerAttackRelease(n, 0.5, t + 0.42));
      disposeLater([sweep, ...chord], 1300);
      break;
    }
    case "cheer": {
      const s = tone("triangle", { attack: 0.01, decay: 0.16, sustain: 0, release: 0.2 });
      ["C5", "E5", "G5", "C6", "E6"].forEach((n, i) => s.triggerAttackRelease(n, 0.1, t + i * 0.08));
      const sp = tone("sine", { attack: 0.005, decay: 0.2, sustain: 0, release: 0.2 });
      ["G6", "C7"].forEach((n, i) => sp.triggerAttackRelease(n, 0.08, t + 0.42 + i * 0.08));
      disposeLater([s, sp], 1200);
      break;
    }
    case "celebrate": {
      // The big finale: rising fanfare + bloom chord + sparkle shower + a happy lilt.
      const fan = tone("triangle", { attack: 0.01, decay: 0.16, sustain: 0, release: 0.25 });
      ["C5", "E5", "G5", "C6", "E6", "G6", "C7"].forEach((n, i) =>
        fan.triggerAttackRelease(n, 0.11, t + i * 0.07)
      );
      const chord = ["C5", "E5", "G5", "C6"].map(() =>
        tone("triangle", { attack: 0.02, decay: 0.7, sustain: 0, release: 0.7 })
      );
      ["C5", "E5", "G5", "C6"].forEach((n, i) => chord[i].triggerAttackRelease(n, 0.8, t + 0.55));
      const sp = tone("sine", { attack: 0.004, decay: 0.2, sustain: 0, release: 0.2 });
      [0, 1, 2, 3, 4].forEach((i) =>
        sp.triggerAttackRelease(jit(1400 + i * 180), 0.07, t + 0.6 + i * 0.09)
      );
      disposeLater([fan, ...chord, sp], 1900);
      // Sprout joins in:
      sproutVoice("happy");
      break;
    }

    // ---- Interface ----
    case "enter": {
      const sweep = tone("sine", { attack: 0.01, decay: 0.3, sustain: 0.25, release: 0.2 });
      sweep.triggerAttack(262, t);
      sweep.frequency.rampTo(523, 0.22, t);
      sweep.triggerRelease(t + 0.26);
      const top = tone("triangle", { attack: 0.005, decay: 0.25, sustain: 0, release: 0.25 });
      ["C5", "G5", "C6"].forEach((n, i) => top.triggerAttackRelease(n, 0.16, t + 0.24 + i * 0.05));
      disposeLater([sweep, top], 1100);
      break;
    }
    case "pop": {
      const s = tone("sine", { attack: 0.001, decay: 0.06, sustain: 0, release: 0.05 });
      s.triggerAttack(720, t);
      s.frequency.rampTo(290, 0.05, t);
      s.triggerRelease(t + 0.06);
      disposeLater([s], 300);
      break;
    }
    case "hello": {
      const s = tone("triangle", { attack: 0.01, decay: 0.18, sustain: 0, release: 0.2 });
      s.triggerAttackRelease("C5", 0.12, t);
      s.triggerAttackRelease("G5", 0.2, t + 0.13);
      disposeLater([s], 700);
      break;
    }
    case "curious": {
      const s = tone("triangle", { attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.3 });
      s.triggerAttack("E5", t);
      s.frequency.rampTo("B5", 0.18, t);
      s.frequency.rampTo("G5", 0.18, t + 0.18);
      s.triggerRelease(t + 0.4);
      disposeLater([s], 800);
      break;
    }
  }
}
