"use client";
// Haptics, sounds and confetti. Haptics go through Capacitor when the native shell is there and
// fall back to navigator.vibrate. Sounds are synthesized (no audio files), as in Gradelings.

type Cap = { isNativePlatform?: () => boolean; Plugins?: Record<string, Record<string, (a?: unknown) => Promise<unknown>>> };
const cap = (): Cap | undefined => (typeof window !== "undefined" ? (window as unknown as { Capacitor?: Cap }).Capacitor : undefined);

export function isNative(): boolean {
  return !!cap()?.isNativePlatform?.();
}

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function haptic(kind: "tick" | "tap" | "thud" | "success") {
  const h = cap()?.Plugins?.Haptics;
  if (h && isNative()) {
    if (kind === "success") void h.notification?.({ type: "SUCCESS" });
    else void h.impact?.({ style: kind === "tick" ? "LIGHT" : kind === "tap" ? "MEDIUM" : "HEAVY" });
    return;
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(kind === "tick" ? 8 : kind === "tap" ? 18 : kind === "thud" ? [40, 60, 40] : [20, 40, 20, 40, 60]);
  }
}

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.18) {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq * (0.98 + Math.random() * 0.04);
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.05);
}

export const sound = {
  enabled: true,
  log() {
    if (!this.enabled) return;
    tone(660, 0, 0.09, "triangle", 0.12);
    tone(990, 0.05, 0.12, "triangle", 0.1);
  },
  restEnd() {
    if (!this.enabled) return;
    tone(880, 0, 0.18, "square", 0.08);
    tone(880, 0.25, 0.18, "square", 0.08);
    tone(1320, 0.5, 0.3, "square", 0.08);
  },
  countdown() {
    if (!this.enabled) return;
    tone(520, 0, 0.07, "sine", 0.1);
  },
  fanfare() {
    if (!this.enabled) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.28, "triangle", 0.12));
  },
};

export async function confetti(big = false) {
  if (reduced()) return;
  const { default: c } = await import("canvas-confetti");
  const colors = ["#4c8dff", "#34d399", "#f2c14e", "#f0605d", "#ffffff"];
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
