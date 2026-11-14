import { motionFor, type Motion } from "./motions";
import { add, ANKLE_H, clamp, ease, len, lerp, mul, norm, rad, sub, V, type Body, type Pose, type Vec } from "./rig";

// The dance easter egg (Melvin, 2026-11-11: "if you tap on it 5 times, can you get it to do a popular dance").
// Five quick taps on the 3D figure make it dance for about sixteen seconds, then it goes back to what it was doing.
//
// The routine (Melvin, 2026-11-14: follow the famous zombie music video dance, as a parody) is a zombie-dance
// homage: the signature, widely known moves of that routine in a similar order and feel, reinterpreted for our
// wireframe lifter, not a frame-by-frame copy of anyone's choreography. No music, no footage, no names:
//   1. the rise: slumped and limp, jerking upright with the head snapped to one side
//   2. the zombie walk: lurching steps forward, arms dangling, head lolling with each step
//   3. head snaps and the shoulder shimmy: wide stance, head snapping side to side on the beat
//   4. the claw walk: claws up by one side of the head, step and drag sideways, then the other way
//   5. the claw swipe: both claws sweeping from low on one side to high on the other
//   6. the hip thrust: knees bent, claws by the hips, hips popping forward on the beat
//   7. the group pose: one foot forward, leaning in, claws raised, then the hands go back to the bar,
//      so the squat picks up where it left off.
//
// The rig keeps the trunk in one piece (no twist), so the moves live in the arms, legs, hips, shoulders and
// head. Frame: x forward, y up, z to the figure's right; the floor is y = 0.

/** The demo id that plays the dance (the engine looks it up before stretches and exercises). */
export const DANCE_ID = "egg:dance";
/** How long the routine lasts, in seconds. */
export const DANCE_SECONDS = 16;
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
type Arm = [fwd: number, up: number, out: number]; // hand from its shoulder, in arm lengths; out is away from the body
type Foot = [x: number, z: number]; // ankle on the floor
interface Key {
  t: number;
  hx: number; // hips forward (the walk travels)
  hz: number; // hips sideways
  dip: number; // knees bent (metres the hips drop)
  lean: number; // trunk forward, degrees
  tilt: number; // shoulders over the hips sideways, metres
  shrug: number;
  head: number; // head forward (+) or back (-)
  headTilt: number; // head tipped to the figure's right (+) or left (-)
  hL: Arm;
  hR: Arm;
  fL: Foot;
  fR: Foot;
  elbowUp: number; // 0 elbows down and back, 1 out to the sides (claws)
}

const HANG: Arm = [0.06, -1, 0.07];
const DANGLE: Arm = [0.3, -0.93, 0.02];
const LIMP: Arm = [0.24, -0.84, 0.3];
const THRUST: Arm = [0.32, -0.7, 0.3];
const RAISED: Arm = [0.55, 0.76, 0.16];
// claws up by the right side of the head: the right hand out by the ear, the left one crossed in front of the face
const CLAW_R = { hL: [0.58, 0.42, -0.34] as Arm, hR: [0.3, 0.56, 0.42] as Arm };
const CLAW_L = { hL: CLAW_R.hR, hR: CLAW_R.hL };
// the swipe: from low on the left to high on the right
const LOW_L = { hL: [0.36, -0.64, 0.42] as Arm, hR: [0.52, -0.56, -0.36] as Arm };
const HIGH_R = { hL: [0.52, 0.56, -0.3] as Arm, hR: [0.24, 0.76, 0.46] as Arm };
const L0: Foot = [0.03, -0.14];
const R0: Foot = [0.03, 0.14];
const WIDE = (x: number): { fL: Foot; fR: Foot } => ({ fL: [x, -0.23], fR: [x, 0.23] });

const base = (t: number, o: Partial<Key>): Key => ({
  t,
  hx: 0,
  hz: 0,
  dip: 0,
  lean: 3,
  tilt: 0,
  shrug: 0,
  head: 0,
  headTilt: 0,
  hL: HANG,
  hR: HANG,
  fL: L0,
  fR: R0,
  elbowUp: 0,
  ...o,
});

// the walk ends this far forward; the claw walk drifts back to the start
const FWD = 0.26;
const KEYS: Key[] = [
  // 1. the rise: slumped, arms limp, head hanging; a half jerk up, then upright with the head snapped over
  base(0, { dip: 0.13, lean: 32, head: 0.04, headTilt: -0.02, hL: DANGLE, hR: DANGLE }),
  base(1.0, { dip: 0.13, lean: 34, head: 0.045, headTilt: -0.025, hL: DANGLE, hR: [0.34, -0.9, 0] }),
  base(1.35, { dip: 0.07, lean: 16, head: 0.02, hL: DANGLE, hR: DANGLE }),
  base(1.9, { dip: 0.02, lean: 6, shrug: 0.06, head: 0.015, headTilt: 0.05, hL: DANGLE, hR: DANGLE }),
  // 2. the zombie walk: four lurching steps forward, the arms swinging dead from the shoulders
  base(2.5, { hx: 0.07, dip: 0.05, lean: 9, shrug: 0.06, headTilt: -0.04, fR: [0.18, 0.14], hL: [0.42, -0.86, 0.04], hR: HANG }),
  base(3.1, {
    hx: 0.15,
    dip: 0.04,
    lean: 9,
    shrug: 0.05,
    headTilt: 0.04,
    fL: [0.3, -0.14],
    fR: [0.18, 0.14],
    hL: HANG,
    hR: [0.42, -0.86, 0.04],
  }),
  base(3.7, {
    hx: 0.22,
    dip: 0.05,
    lean: 9,
    shrug: 0.06,
    headTilt: -0.04,
    fL: [0.3, -0.14],
    fR: [0.42, 0.14],
    hL: [0.42, -0.86, 0.04],
    hR: HANG,
  }),
  base(4.3, { hx: FWD, dip: 0.04, lean: 8, shrug: 0.05, headTilt: 0.03, fL: [0.3, -0.14], fR: [0.3, 0.14], hL: DANGLE, hR: DANGLE }),
  // 3. head snaps and the shoulder shimmy (the snaps and the shimmy ride on the beat, below)
  base(4.8, { hx: FWD, dip: 0.06, lean: 6, shrug: 0.03, hL: LIMP, hR: LIMP, elbowUp: 0.35, ...WIDE(0.3) }),
  base(6.5, { hx: FWD, dip: 0.06, lean: 6, shrug: 0.03, hL: LIMP, hR: LIMP, elbowUp: 0.35, ...WIDE(0.3) }),
  // 4. the claw walk: claws up on the right, step right and drag; then claws on the left, step left and drag
  base(7.0, { hx: FWD, dip: 0.04, lean: 7, headTilt: 0.03, ...CLAW_R, elbowUp: 1, fL: [0.3, -0.14], fR: [0.3, 0.14] }),
  base(7.5, {
    hx: 0.2,
    hz: 0.13,
    dip: 0.08,
    lean: 9,
    tilt: -0.02,
    headTilt: 0.04,
    ...CLAW_R,
    elbowUp: 1,
    fL: [0.3, -0.14],
    fR: [0.22, 0.42],
  }),
  base(8.0, { hx: 0.16, hz: 0.27, dip: 0.03, lean: 7, headTilt: 0.03, ...CLAW_R, elbowUp: 1, fL: [0.16, 0.14], fR: [0.22, 0.42] }),
  base(8.5, { hx: 0.12, hz: 0.27, dip: 0.04, lean: 7, headTilt: -0.03, ...CLAW_L, elbowUp: 1, fL: [0.16, 0.14], fR: [0.22, 0.42] }),
  base(9.0, {
    hx: 0.08,
    hz: 0.14,
    dip: 0.08,
    lean: 9,
    tilt: 0.02,
    headTilt: -0.04,
    ...CLAW_L,
    elbowUp: 1,
    fL: [0.08, -0.14],
    fR: [0.22, 0.42],
  }),
  base(9.5, { hx: 0.03, hz: 0, dip: 0.03, lean: 7, headTilt: -0.03, ...CLAW_L, elbowUp: 1, fL: [0.08, -0.14], fR: [0.05, 0.14] }),
  // 5. the claw swipe, twice: low on the left, up and across to high on the right
  base(9.9, { dip: 0.07, lean: 10, headTilt: -0.04, ...LOW_L, elbowUp: 0.5, ...WIDE(0.04) }),
  base(10.35, { dip: 0.02, lean: 4, tilt: 0.02, headTilt: 0.05, ...HIGH_R, elbowUp: 0.8, ...WIDE(0.04) }),
  base(10.8, { dip: 0.07, lean: 10, headTilt: -0.04, ...LOW_L, elbowUp: 0.5, ...WIDE(0.04) }),
  base(11.25, { dip: 0.02, lean: 4, tilt: 0.02, headTilt: 0.05, ...HIGH_R, elbowUp: 0.8, ...WIDE(0.04) }),
  // 6. the hip thrust (the thrusts ride on the beat, below)
  base(11.7, { dip: 0.09, lean: 4, shrug: 0.02, hL: THRUST, hR: THRUST, elbowUp: 0.6, ...WIDE(0.04) }),
  base(13.5, { dip: 0.09, lean: 4, shrug: 0.02, hL: THRUST, hR: THRUST, elbowUp: 0.6, ...WIDE(0.04) }),
  // 7. the group pose: right foot forward, leaning in, claws raised high, head cocked
  base(14.1, {
    hx: 0.06,
    dip: 0.07,
    lean: 14,
    head: 0.02,
    headTilt: 0.04,
    hL: RAISED,
    hR: RAISED,
    elbowUp: 1,
    fL: [-0.04, -0.17],
    fR: [0.24, 0.17],
  }),
  base(15.1, {
    hx: 0.06,
    dip: 0.08,
    lean: 15,
    head: 0.02,
    headTilt: 0.045,
    hL: RAISED,
    hR: RAISED,
    elbowUp: 1,
    fL: [-0.04, -0.17],
    fR: [0.24, 0.17],
  }),
];
const POSE_HOLD = 15.2; // then the last 0.8 s blends into the squat's first frame
/** Where each beat-driven move plays, in seconds into the routine. */
const PARTS = { snaps: [4.8, 6.6], claws: [7.0, 9.6], thrust: [11.7, 13.6], pose: [14.1, 15.2] } as const;
/** About 118 beats a minute: the tempo of that era's dance-floor pop. */
const BEAT_HZ = 118 / 60;

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
/** A snap: holds at -1 or +1 and flips fast, instead of a smooth sine. */
const snap = (x: number) => Math.tanh(7 * Math.sin(x));

/** The dancing pose at `t` seconds into the routine. */
function danceAt(B: Body, t: number): Pose {
  const { a, b, u } = keyAt(t);
  const k = (f: (x: Key) => number) => lerp(f(a), f(b), u);
  // a foot that moves lifts off the floor on the way
  const footLift = (fa: Foot, fb: Foot) =>
    Math.min(0.09, Math.abs(fb[1] - fa[1]) * 0.35 + Math.abs(fb[0] - fa[0]) * 0.35) * Math.sin(Math.PI * u);

  const ph = 2 * Math.PI * BEAT_HZ * t;
  const pulse = Math.max(0, Math.sin(ph));
  const snaps = env(t, PARTS.snaps[0], PARTS.snaps[1], 0.2);
  const claws = env(t, PARTS.claws[0], PARTS.claws[1], 0.2);
  const thrust = env(t, PARTS.thrust[0], PARTS.thrust[1], 0.2);
  const hold = env(t, PARTS.pose[0], PARTS.pose[1], 0.3);
  // head snaps right and left, one side a beat; the shoulders shimmy twice as fast
  const headSnap = 0.055 * snap(ph / 2) * snaps;
  const shimmy = 0.03 * Math.sin(ph * 2) * snaps;
  // the hips pop forward on every beat, the shoulders rocking back against them
  const pop = Math.max(0, snap(ph)) * thrust;

  const hx = k((x) => x.hx) + 0.075 * pop;
  const dip = Math.max(0, k((x) => x.dip) + 0.02 * pulse * (claws + hold) - 0.02 * pop);
  const leanDeg = k((x) => x.lean) - 14 * pop;
  const lean = rad(leanDeg);
  const hip = V(
    0.02 - 0.02 * Math.sin(rad(Math.max(0, leanDeg))) + hx,
    standY(B) - dip,
    k((x) => x.hz),
  );
  const sh = add(hip, V(Math.sin(lean) * B.torso, Math.cos(lean) * B.torso, k((x) => x.tilt) + shimmy));
  const shrug = k((x) => x.shrug) + 0.05 * Math.abs(Math.sin(ph * 2)) * snaps + 0.035 * pulse * (claws + thrust);
  const up = norm(sub(sh, hip));
  // the claws shake on the beat
  const shake = 0.035 * Math.sin(ph * 2) * (claws + hold);

  const hand = (sgn: number, arm: Arm): Vec => {
    const top = add(V(sh[0], sh[1] + shrug, sh[2] + sgn * B.shW), mul(up, -B.shDrop));
    const R = reach(B);
    const target = add(top, V(arm[0] * R, arm[1] * R + shake, sgn * arm[2] * R));
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
    kneePole: { L: V(1, 0, -0.35), R: V(1, 0, 0.35) },
    elbowPole: { L: pole(-1), R: pole(1) },
    headBlend: lerp(0.9, 0.2, clamp(k((x) => x.lean) / 30, 0, 1)),
    headBack: k((x) => x.head),
    headTilt: k((x) => x.headTilt) + headSnap,
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
  headTilt: number;
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
    headTilt: p.headTilt ?? 0,
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
    headTilt: lerp(a.headTilt, b.headTilt, u),
  };
}

let cached: Motion | null = null;
/** The dance as a demo motion: one sixteen-second pass (d runs 0 → 1 evenly), ending in the back squat's start. */
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
