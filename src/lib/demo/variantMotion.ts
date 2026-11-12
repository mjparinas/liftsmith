// Variations a lift's id names, played on the family's motion: holds (a static hold at the hard
// point), negatives (a slow lowering and a quick reset) and alternating sides (one arm or leg at a
// time). Without these a dumbbell curl and an alternating curl, a dip and a negative dip, or a
// shrug and a shrug hold played the same animation, so a swap between them looked like nothing
// happened (Melvin, 2026-11-12). Tempo and paused lifts are in tempoMotion.ts.
import type { Motion } from "./motions";
import type { PerSide, PhaseRow, Pose, Vec } from "./rig";

const strip = (label: string) => label.replace(/\s*·\s*[\d.]+s$/, "");
const isPer = <T>(v: PerSide<T>): v is { L: T; R: T } => typeof v === "object" && v !== null && "L" in (v as object);

/** One side of a per-side value, the way the rig reads it (a single Vec is mirrored; z 0 means the default). */
function sideOf(v: PerSide<Vec> | undefined, side: "L" | "R", defZ: number): Vec | undefined {
  if (v === undefined) return undefined;
  if (isPer(v)) return v[side];
  const z = v[2] === 0 ? defZ : Math.abs(v[2]);
  return [v[0], v[1], side === "L" ? -z : z];
}
function numOf(v: PerSide<number> | undefined, side: "L" | "R"): number | undefined {
  if (v === undefined) return undefined;
  return typeof v === "number" ? v : v[side];
}

const HOLD = /(^|-)hold(-|$)|flexed-arm-hang|^active-hang$/;
const SUPPORT = /support-hold/;

/** Already static or already one side at a time: leave it alone. */
const holds = (m: Motion) => m.phases.some((p) => /^(hold|plank|hang)\b/i.test(p[3])) || m.phases.every((p) => p[1] === p[2]);

export function withVariant(id: string, m: Motion, pattern?: string): Motion {
  if (HOLD.test(id) && !holds(m)) return hold(m, SUPPORT.test(id) || pattern === "carry" ? 0 : 1);
  if (/negative/.test(id)) return negative(m);
  if (/alternating|see-saw/.test(id) && pattern !== "cardio" && !m.phases.some((p) => /side/i.test(p[3]))) return alternate(m);
  return m;
}

/** Into position, hold still at `at`, and out again. */
function hold(m: Motion, at: number): Motion {
  const phases: PhaseRow[] = at
    ? [
        [0.5, 0, 0, "Set", 0.35],
        [0.9, 0, at, "Get set", 0.7],
        [3, at, at, "Hold", 0.95],
        [0.8, at, 0, "Release", 0.5],
      ]
    : [
        [3, 0, 0, "Hold", 0.95],
        [0.6, 0, 0, "Breathe", 0.7],
      ];
  return { ...m, phases };
}

/** The lowering takes four slow seconds; the way back up is a quick reset. */
function negative(m: Motion): Motion {
  const lower = m.phases.findIndex((p) => p[1] !== p[2] && /^lower/i.test(p[3]));
  if (lower < 0) return m;
  const phases = m.phases.map((p, i): PhaseRow => {
    if (i === lower) return [4, p[1], p[2], "Lower · 4s", 0.9];
    if (p[1] !== p[2]) return [0.8, p[1], p[2], `Reset · ${strip(p[3])}`, 0.4];
    return p;
  });
  return { ...m, phases };
}

/**
 * One side, then the other: d 0 → 0.5 is the left side's whole rep and 0.5 → 1 the right's, each
 * side resting while the other works. The trunk follows whichever side is moving.
 */
function alternate(m: Motion): Motion {
  // Each row of the family's rep, mapped into one side's half: the way out lands in the first
  // quarter of that half, the way back in the second.
  const half = (off: number): PhaseRow[] => {
    let peaked = false;
    return m.phases.map(([dur, f, t, label, eff]): PhaseRow => {
      const map = (d: number) => off + (peaked ? 0.5 - d / 4 : d / 4);
      const row: PhaseRow = [dur, map(f), map(t), label, eff];
      if (t === 1) peaked = true;
      return row;
    });
  };
  const left = half(0);
  const right = half(0.5);
  const grip = m.grip ?? 0.25;
  const u = (x: number) => (x <= 0.25 ? x * 4 : x <= 0.5 ? 2 - x * 4 : 0);
  const pose = (B: Parameters<Motion["pose"]>[0], d: number): Pose => {
    const uL = d < 0.5 ? u(d) : 0;
    const uR = d >= 0.5 ? u(d - 0.5) : 0;
    const pL = m.pose(B, uL);
    const pR = m.pose(B, uR);
    const main = d < 0.5 ? pL : pR;
    const per = (k: "hand" | "elbowPole" | "ankle" | "kneePole", defZ: number) => {
      const L = sideOf(pL[k], "L", defZ);
      const R = sideOf(pR[k], "R", defZ);
      return L && R ? { L, R } : main[k];
    };
    const fL = numOf(pL.foot, "L"),
      fR = numOf(pR.foot, "R");
    return {
      ...main,
      hand: per("hand", grip) ?? main.hand,
      elbowPole: per("elbowPole", 0.4),
      ankle: per("ankle", (m.stance ?? 0.14) * B.s),
      kneePole: per("kneePole", 0.45),
      foot: fL !== undefined && fR !== undefined ? { L: fL, R: fR } : main.foot,
      bar: undefined,
    };
  };
  return { ...m, phases: [...left, ...right], pose, hold: m.hold === "centre" || m.hold === "R" ? "each" : m.hold };
}
