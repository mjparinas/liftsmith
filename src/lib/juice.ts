"use client";
// Haptics, sounds and confetti. Haptics go through Capacitor (@capacitor/haptics, the same calls on
// Android and iOS) when the native shell is there and fall back to navigator.vibrate. Sounds are
// synthesized (no audio files), as in Gradelings.
//
// The sound set (design pass, 2026-11-09): every sound is one voice, a soft glassy mallet (a sine with
// a quiet octave and a faint bell partial), and every note is from A major pentatonic, so any two
// sounds played together still sound like one app. Quiet sounds for small things, short rising phrases
// for progress, one longer phrase for the end of a workout.

type Cap = { isNativePlatform?: () => boolean; Plugins?: Record<string, Record<string, (a?: unknown) => Promise<unknown>>> };
const cap = (): Cap | undefined => (typeof window !== "undefined" ? (window as unknown as { Capacitor?: Cap }).Capacitor : undefined);

export function isNative(): boolean {
  return !!cap()?.isNativePlatform?.();
}

/**
 * The lifter's feel settings, mirrored here from the profile by the app shell so any component can
 * play a sound or buzz without reading the store. `calm` is Lean mode: no confetti or flourishes.
 */
export const feel = { sound: true, haptics: true, calm: false };

const reducedMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
/** True when motion flourishes should be skipped: the system setting or Lean mode. */
export const calm = () => feel.calm || reducedMotion();

export type HapticKind = "select" | "tick" | "tap" | "thud" | "success" | "warning";

export function haptic(kind: HapticKind) {
  if (!feel.haptics) return;
  const h = cap()?.Plugins?.Haptics;
  if (h && isNative()) {
    if (kind === "success") void h.notification?.({ type: "SUCCESS" });
    else if (kind === "warning") void h.notification?.({ type: "WARNING" });
    else if (kind === "select") void (h.selectionChanged?.() ?? h.impact?.({ style: "LIGHT" }));
    else void h.impact?.({ style: kind === "tick" ? "LIGHT" : kind === "tap" ? "MEDIUM" : "HEAVY" });
    return;
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const p = { select: 5, tick: 8, tap: 18, thud: [40, 60, 40], success: [20, 40, 20, 40, 60], warning: [30, 50, 30] }[kind];
    try {
      navigator.vibrate(p);
    } catch {}
  }
}

let ctx: AudioContext | null = null;
let out: GainNode | null = null;
function audio(): AudioContext | null {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") return null;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      // One gentle compressor and master level for every sound, so loudness stays even.
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      out = ctx.createGain();
      out.gain.value = 0.9;
      out.connect(comp).connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** A major pentatonic, by name, so phrases read like music. */
export const NOTE = { A4: 440, B4: 493.88, Cs5: 554.37, E5: 659.25, Fs5: 739.99, A5: 880, B5: 987.77, Cs6: 1108.73, E6: 1318.51, Fs6: 1479.98, A6: 1760 } as const;

/** One mallet note: start and length in seconds, level 0..1. */
export function mallet(freq: number, start = 0, dur = 0.18, level = 0.5) {
  const a = audio();
  if (!a || !out) return;
  const t = a.currentTime + start;
  const env = a.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.22 * level, t + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  env.connect(out);
  const partials: [number, number][] = [[1, 1], [2, 0.18], [3.01, 0.06]];
  for (const [mult, amp] of partials) {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = "sine";
    o.frequency.value = freq * mult;
    g.gain.value = amp;
    o.connect(g).connect(env);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

const phrase = (notes: [number, number, number?, number?][]) => notes.forEach(([f, at, dur, lvl]) => mallet(f, at, dur, lvl));

export const sound = {
  /** Kept for older callers; mirrors feel.sound. */
  get enabled() {
    return feel.sound;
  },
  set enabled(v: boolean) {
    feel.sound = v;
  },
  /** Stepper and chip changes: barely there. */
  tick() {
    if (feel.sound) mallet(NOTE.E6, 0, 0.05, 0.18);
  },
  /** A set logged: a quick rising pair. */
  log() {
    if (feel.sound) phrase([[NOTE.A5, 0, 0.12, 0.55], [NOTE.E6, 0.06, 0.2, 0.5]]);
  },
  /** An exercise swapped. */
  swap() {
    if (feel.sound) phrase([[NOTE.Fs5, 0, 0.1, 0.4], [NOTE.B5, 0.05, 0.14, 0.4]]);
  },
  /** Workout started. */
  start() {
    if (feel.sound) phrase([[NOTE.A4, 0, 0.16, 0.45], [NOTE.Cs5, 0.07, 0.16, 0.45], [NOTE.E5, 0.14, 0.18, 0.5], [NOTE.A5, 0.21, 0.32, 0.55]]);
  },
  /** The last three seconds of rest. */
  countdown() {
    if (feel.sound) mallet(NOTE.E5, 0, 0.09, 0.4);
  },
  /** Rest is over: a clear three-note chime that cuts through gym music. */
  restEnd() {
    if (feel.sound) phrase([[NOTE.A5, 0, 0.22, 0.8], [NOTE.Cs6, 0.12, 0.22, 0.8], [NOTE.E6, 0.24, 0.5, 0.9]]);
  },
  /** A step back (discard, undo). */
  back() {
    if (feel.sound) phrase([[NOTE.E5, 0, 0.12, 0.35], [NOTE.B4, 0.07, 0.18, 0.35]]);
  },
  /** End of a workout and other big moments. */
  fanfare() {
    if (!feel.sound) return;
    phrase([[NOTE.A4, 0, 0.3, 0.5], [NOTE.Cs5, 0.09, 0.3, 0.5], [NOTE.E5, 0.18, 0.3, 0.55], [NOTE.A5, 0.27, 0.45, 0.6], [NOTE.Cs6, 0.42, 0.5, 0.45], [NOTE.E6, 0.42, 0.7, 0.4], [NOTE.A6, 0.5, 0.8, 0.25]]);
  },
};

/** The confetti palette follows the design tokens. */
export const CONFETTI = ["#4c8dff", "#8b7bff", "#38d6e8", "#34d399", "#f2c14e", "#ff8a3d", "#ffffff"];

export async function confetti(big = false) {
  if (calm()) return;
  const { default: c } = await import("canvas-confetti");
  const colors = CONFETTI;
  void c({ particleCount: big ? 160 : 70, spread: big ? 100 : 70, origin: { y: 0.7 }, colors, disableForReducedMotion: true });
  if (big) setTimeout(() => void c({ particleCount: 90, angle: 60, spread: 70, origin: { x: 0 }, colors }), 220);
  if (big) setTimeout(() => void c({ particleCount: 90, angle: 120, spread: 70, origin: { x: 1 }, colors }), 360);
}

/** Keeps the screen on during a workout. */
let lock: { release(): Promise<void> } | null = null;
export async function keepAwake(on: boolean) {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request(t: "screen"): Promise<{ release(): Promise<void> }> } };
    if (on && !lock && nav.wakeLock) lock = await nav.wakeLock.request("screen");
    if (!on && lock) {
      await lock.release();
      lock = null;
    }
  } catch {}
}
