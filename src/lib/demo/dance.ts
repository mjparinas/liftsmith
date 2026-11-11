import { motionFor, type Motion } from "./motions";
import { add, ANKLE_H, clamp, ease, len, lerp, mul, norm, rad, sub, V, type Body, type Pose, type Vec } from "./rig";

// The dance easter egg (Melvin, 2026-11-11: "if you tap on it 5 times, can you get it to do a popular dance").
// Five quick taps on the 3D figure make it dance for about ten seconds, then it goes back to what it was doing.
// He suggested the famous zombie music video routine; its choreography, music and name belong to others, so
// this is an original routine that only nods to that era: a slumped wake-up, stiff zombie arms with shoulder
// shrugs, a side shuffle with straight-arm swings, a claw crouch, and a hip-pop finish that ends with the hands
// back on the bar, so the squat picks up where it left off.
//
// The rig keeps the trunk in one piece (no side bend or twist), so the moves live in the arms, legs, hips,
// shoulders and head. Frame: x forward, y up, z to the figure's right; the floor is y = 0.

/** The demo id that plays the dance (the engine looks it up before stretches and exercises). */
export const DANCE_ID = "egg:dance";
/** How long the routine lasts, in seconds. */
export const DANCE_SECONDS = 10;
/** Taps needed, and the most time allowed between two of them. */
export const DANCE_TAPS = 5;
export const DANCE_TAP_GAP_MS = 900;

/**
 * Counts quick taps: give it the times of the taps so far and the new one, get back the new streak and whether
 * it reached DANCE_TAPS (the streak then starts again).
 */
export function tapStreak(taps: readonly number[], now: number): { taps: number[]; dance: boolean } {
  const last = taps[taps.length - 1];
  const next = last !== undefined && now - last <= DANCE_TAP_GAP_MS ? [...taps, now] : [now];
  if (next.length >= DANCE_TAPS) return { taps: [], dance: true };
  return { taps: next, dance: false };
}

// ---------- helpers ----------
const reach = (B: Body) => B.upper + B.fore;
const legMax = (B: Body) => (B.shin + B.thigh) * 0.995;
const standY = (B: Body) => ANKLE_H + Math.sqrt(Math.max(0.01, legMax(B) ** 2 - 0.03 * 0.03));
function toward(from: Vec, to: Vec, max: number): Vec {
  const d = sub(to, from);
  const l = len(d);
  return l <= max ? to : add(from, mul(d, max / l));
}
/** Smooth 0 → 1 → 0 window over [a, b], fading in and out over `f` seconds. */
function env(t: number, a: number, b: number, f = 0.25) {
  if (t <= a || t >= b) return 0;
  return ease(clamp((t - a) / f, 0, 1)) * ease(clamp((b - t) / f, 0, 1));
}

// ---------- the routine, as keyframes ----------
type Arm = [fwd: number, up: number, out: number]; // hand from its shoulder, in arm lengths
type Foot = [x: number, z: number]; // ankle on the floor
interface Key {
  t: number;
  hz: number; // hips sideways
  dip: number; // knees bent (metres the hips drop)
  lean: number; // trunk forward, degrees
  tilt: number; // shoulders over the hips sideways, metres
  shrug: number;
  head: number; // head forward (+) or back (-)
  hL: Arm;
  hR: Arm;
  fL: Foot;
  fR: Foot;
  elbowUp: number; // 0 elbows down and back, 1 out to the sides (claws)
}

const HANG: Arm = [0.06, -1, 0.07];
const DANGLE: Arm = [0.3, -0.93, 0.02];
const ZOMBIE: Arm = [1, -0.08, -0.05];
const SWING_F: Arm = [0.62, -0.74, 0.02];
const SWING_B: Arm = [-0.42, -0.88, 0.06];
const CLAW: Arm = [0.42, 0.42, 0.12];
const UP: Arm = [0.12, 1, 0.16];
const L0: Foot = [0.03, -0.14];
const R0: Foot = [0.03, 0.14];

const base = (t: number, o: Partial<Key>): Key => ({
  t,
  hz: 0,
  dip: 0,
  lean: 3,
  tilt: 0,
  shrug: 0,
  head: 0,
  hL: HANG,
  hR: HANG,
  fL: L0,
  fR: R0,
  elbowUp: 0,
  ...o,
});

const KEYS: Key[] = [
  // wake up: slumped, arms dangling, then a stiff jerk upright
  base(0, { dip: 0.13, lean: 30, head: 0.03, hL: DANGLE, hR: DANGLE }),
  base(1.1, { dip: 0.12, lean: 33, head: 0.04, hL: DANGLE, hR: [0.34, -0.9, 0] }),
  base(1.6, { dip: 0, lean: 1, shrug: 0.05, head: -0.02 }),
  // zombie arms up, straight out in front
  base(2.3, { lean: 5, hL: ZOMBIE, hR: ZOMBIE }),
  base(4.3, { lean: 5, dip: 0.03, hL: ZOMBIE, hR: ZOMBIE }),
  // side shuffle: right, together, back left, together, out left, back in; stiff arms swing on every step
  base(4.8, { hz: 0.12, dip: 0.04, tilt: -0.025, shrug: 0.05, fR: [0.03, 0.4], hL: SWING_F, hR: SWING_B }),
  base(5.3, { hz: 0.26, dip: 0.02, fL: [0.03, 0.12], fR: [0.03, 0.4], hL: SWING_B, hR: SWING_F }),
  base(5.8, { hz: 0.12, dip: 0.04, tilt: 0.025, shrug: 0.05, fL: L0, fR: [0.03, 0.4], hL: SWING_F, hR: SWING_B }),
  base(6.3, { dip: 0.02, hL: SWING_B, hR: SWING_F }),
  base(6.8, { hz: -0.13, dip: 0.04, tilt: 0.025, shrug: 0.05, fL: [0.03, -0.4], hL: SWING_F, hR: SWING_B }),
  base(7.3, { dip: 0.02, hL: SWING_B, hR: SWING_F }),
  // claw crouch: hands up by the head, knees bent, shoulders jerking
  base(7.8, { dip: 0.11, lean: 14, head: 0.03, hL: CLAW, hR: CLAW, elbowUp: 1, fL: [0.03, -0.2], fR: [0.03, 0.2] }),
  base(8.9, { dip: 0.09, lean: 12, head: 0.03, hL: CLAW, hR: CLAW, elbowUp: 1, fL: [0.03, -0.2], fR: [0.03, 0.2] }),
  // hip pop, one arm up
  base(9.3, { hz: 0.05, tilt: -0.04, head: -0.02, hR: UP, elbowUp: 0.3, fL: [0.03, -0.16], fR: [0.03, 0.16] }),
];
const POSE_HOLD = 9.45; // then the last 0.55 s blends into the squat's first frame

function keyAt(t: number): { a: Key; b: Key; u: number } {
  const first = KEYS[0]!;
  if (t <= first.t) return { a: first, b: first, u: 0 };
  for (let i = 1; i < KEYS.length; i++) {
    const b = KEYS[i]!;
    if (t <= b.t) {
      const a = KEYS[i - 1]!;
      return { a, b, u: ease((t - a.t) / (b.t - a.t)) };
    }
  }
  const last = KEYS[KEYS.length - 1]!;
  return { a: last, b: last, u: 0 };
}
const mix3 = <T extends number[]>(a: T, b: T, u: number) => a.map((x, i) => lerp(x, b[i]!, u)) as T;

/** The dancing pose at `t` seconds into the routine. */
function danceAt(B: Body, t: number): Pose {
  const { a, b, u } = keyAt(t);
  const k = (f: (x: Key) => number) => lerp(f(a), f(b), u);
  // a foot that moves lifts off the floor on the way
  const footLift = (fa: Foot, fb: Foot) =>
    Math.min(0.09, Math.abs(fb[1] - fa[1]) * 0.35 + Math.abs(fb[0] - fa[0]) * 0.35) * Math.sin(Math.PI * u);

  // beat overlays: a sway and shrug while the zombie arms are up, a jerky bounce in the claw crouch
  const sway = env(t, 2.3, 4.4, 0.35);
  const claw = env(t, 7.8, 9.0, 0.2);
  const beat = Math.sin(2 * Math.PI * t * 2); // two beats a second
  const pulse = Math.max(0, beat);
  const swayZ = 0.08 * Math.sin(Math.PI * t) * sway;

  const hz = k((x) => x.hz) + swayZ * 0.4;
  const dip = Math.max(0, k((x) => x.dip) + 0.025 * pulse * claw);
  const hip = V(0.02 - 0.02 * Math.sin(rad(k((x) => x.lean))), standY(B) - dip, hz);
  const lean = rad(k((x) => x.lean));
  const sh = add(hip, V(Math.sin(lean) * B.torso, Math.cos(lean) * B.torso, k((x) => x.tilt) - swayZ * 0.3));
  const shrug = k((x) => x.shrug) + 0.04 * pulse * sway + 0.05 * pulse * claw;
  const up = norm(sub(sh, hip));

  const hand = (sgn: number, arm: Arm): Vec => {
    const top = add(V(sh[0], sh[1] + shrug, sh[2] + sgn * B.shW), mul(up, -B.shDrop));
    const R = reach(B);
    const target = add(top, V(arm[0] * R, arm[1] * R + 0.04 * beat * claw, sgn * arm[2] * R + swayZ));
    return toward(top, target, R * 0.97);
  };
  const ankle = (sgn: number, fa: Foot, fb: Foot): Vec => {
    const f = mix3(fa, fb, u);
    const hipJ = V(hip[0], hip[1], hip[2] + sgn * B.hipW);
    return toward(hipJ, V(f[0], ANKLE_H + footLift(fa, fb), f[1]), legMax(B) * 0.985);
  };
  const eu = k((x) => x.elbowUp);
  const pole = (sgn: number): Vec => V(lerp(-1, -0.2, eu), lerp(-0.7, -0.4, eu), sgn * lerp(0.4, 1, eu));

  return {
    hip,
    sh,
    hand: { L: hand(-1, mix3(a.hL, b.hL, u)), R: hand(1, mix3(a.hR, b.hR, u)) },
    ankle: { L: ankle(-1, a.fL, b.fL), R: ankle(1, a.fR, b.fR) },
    foot: { L: 140 * footLift(a.fL, b.fL), R: 140 * footLift(a.fR, b.fR) }, // toes point down as a foot lifts
    kneePole: { L: V(1, 0, -0.3), R: V(1, 0, 0.3) },
    elbowPole: { L: pole(-1), R: pole(1) },
    headBlend: lerp(0.9, 0.2, clamp(k((x) => x.lean) / 30, 0, 1)),
    headBack: k((x) => x.head) + 0.012 * beat * (sway + claw),
  };
}

// ---------- blending into the squat ----------
type Full = Required<Pick<Pose, "hip" | "sh">> & {
  hand: { L: Vec; R: Vec };
  ankle: { L: Vec; R: Vec };
  kneePole: { L: Vec; R: Vec };
  elbowPole: { L: Vec; R: Vec };
  foot: { L: number; R: number };
  headBlend: number;
  headBack: number;
};
type Side = { L: Vec; R: Vec };
function perSide(v: Pose["hand"] | undefined, defZ: number, fallback: Vec): Side {
  if (v === undefined)
    return { L: [fallback[0], fallback[1], -Math.abs(fallback[2])], R: [fallback[0], fallback[1], Math.abs(fallback[2])] };
  if ("L" in (v as object)) return v as Side;
  const p = v as Vec;
  const z = p[2] === 0 ? defZ : Math.abs(p[2]);
  return { L: [p[0], p[1], -z], R: [p[0], p[1], z] };
}
function full(p: Pose, B: Body, stance: number, grip: number): Full {
  const foot = p.foot === undefined ? 0 : p.foot;
  return {
    hip: p.hip,
    sh: p.sh,
    hand: perSide(p.hand, grip, V(0, 0, grip)),
    ankle: perSide(p.ankle, stance * B.s, V(0, ANKLE_H, stance * B.s)),
    kneePole: perSide(p.kneePole, 0.45, V(1, 0, 0.45)),
    elbowPole: perSide(p.elbowPole, 0.4, V(-1, -0.7, 0.4)),
    foot: typeof foot === "number" ? { L: foot, R: foot } : foot,
    headBlend: p.headBlend ?? 0.45,
    headBack: p.headBack ?? 0,
  };
}
const mixV = (a: Vec, b: Vec, u: number): Vec => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const mixS = (a: Side, b: Side, u: number): Side => ({ L: mixV(a.L, b.L, u), R: mixV(a.R, b.R, u) });
function blend(a: Full, b: Full, u: number): Pose {
  return {
    hip: mixV(a.hip, b.hip, u),
    sh: mixV(a.sh, b.sh, u),
    hand: mixS(a.hand, b.hand, u),
    ankle: mixS(a.ankle, b.ankle, u),
    kneePole: mixS(a.kneePole, b.kneePole, u),
    elbowPole: mixS(a.elbowPole, b.elbowPole, u),
    foot: { L: lerp(a.foot.L, b.foot.L, u), R: lerp(a.foot.R, b.foot.R, u) },
    headBlend: lerp(a.headBlend, b.headBlend, u),
    headBack: lerp(a.headBack, b.headBack, u),
  };
}

let cached: Motion | null = null;
/** The dance as a demo motion: one ten-second pass (d runs 0 → 1 evenly), ending in the back squat's start. */
export function danceMotion(): Motion {
  if (cached) return cached;
  const squat = motionFor("back-squat");
  const stance = 0.14;
  cached = {
    phases: [[DANCE_SECONDS, 0, 1, "", 0.7]],
    load: "none",
    stance,
    grip: 0.25,
    pose(B, d) {
      const t = clamp(d, 0, 1) * DANCE_SECONDS;
      const p = danceAt(B, Math.min(t, POSE_HOLD));
      if (t <= POSE_HOLD) return p;
      const to = full(squat.pose(B, 0), B, squat.stance ?? 0.14, squat.grip ?? 0.25);
      return blend(full(p, B, stance, 0.25), to, ease((t - POSE_HOLD) / (DANCE_SECONDS - POSE_HOLD)));
    },
  };
  return cached;
}
