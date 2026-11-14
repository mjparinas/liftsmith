// The exercise demo rig (Melvin approved the 3D hologram wireframe, 2026-11-09). Pure maths, no
// three.js, so it runs in node tests. Coordinates are metres: x forward, y up, z to the lifter's
// right. Each exercise is a pose function of one phase value d (0 start, 1 the far end of the rep);
// male and female bodies are bone lengths plus shape tables, so both share every exercise's motion.

export type Vec = [number, number, number];
export type Side = "L" | "R";

export const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: Vec, s: number): Vec => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: Vec) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: Vec): Vec => mul(a, 1 / (len(a) || 1));
export const V = (x: number, y: number, z = 0): Vec => [x, y, z];
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpV = (a: Vec, b: Vec, t: number): Vec => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
export const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const rad = (deg: number) => (deg * Math.PI) / 180;

/** Two-bone IK: the middle joint for a chain from A towards T, bent towards the pole. */
export function ik(A: Vec, T: Vec, l1: number, l2: number, pole: Vec): Vec {
  const v = sub(T, A);
  const d = clamp(len(v), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  const dir = norm(v);
  let p = sub(pole, mul(dir, dot(pole, dir)));
  if (len(p) < 1e-6) p = Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  p = norm(p);
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  return add(A, add(mul(dir, l1 * Math.cos(a)), mul(p, l1 * Math.sin(a))));
}

/** Linear lookup in a [t, ...values] table. */
export function interp(tab: readonly (readonly number[])[], t: number, col: number): number {
  if (t <= tab[0][0]) return tab[0][col];
  for (let i = 1; i < tab.length; i++)
    if (t <= tab[i][0]) {
      const t0 = tab[i - 1][0],
        t1 = tab[i][0];
      return lerp(tab[i - 1][col], tab[i][col], (t - t0) / (t1 - t0));
    }
  return tab[tab.length - 1][col];
}

// ---------- body types: bone lengths + shape tables (side profile [t, front, back], front profile [t, outer, inner]) ----------
type Tab = number[][];
export interface Body {
  s: number;
  shin: number;
  thigh: number;
  torso: number;
  upper: number;
  fore: number;
  neck: number;
  /** How far below the top of the torso the shoulder joints sit, so the arms hang from the shoulders, not the neck. */
  shDrop: number;
  shW: number;
  hipW: number;
  head: [number, number];
  jaw: number;
  chin: number;
  hand: number;
  def: number;
  hair?: boolean;
  torsoSide: Tab;
  torsoFront: Tab;
  side: { thigh: Tab; shin: Tab; upper: Tab; fore: Tab };
  front: { thigh: Tab; shin: Tab; upper: Tab; fore: Tab };
}
export type BodyKey = "male" | "female";

export const BODIES: Record<BodyKey, Body> = {
  male: {
    s: 1,
    shin: 0.45,
    thigh: 0.45,
    torso: 0.52,
    upper: 0.3,
    fore: 0.28,
    neck: 0.09,
    shDrop: 0.05,
    shW: 0.2,
    hipW: 0.095,
    head: [0.088, 0.115],
    jaw: 0.066,
    chin: 0.04,
    hand: 0.038,
    def: 0.3,
    torsoSide: [
      [-0.12, 0.08, 0.09],
      [0, 0.11, 0.15],
      [0.15, 0.115, 0.135],
      [0.32, 0.11, 0.095],
      [0.5, 0.115, 0.1],
      [0.66, 0.14, 0.12],
      [0.8, 0.158, 0.13],
      [0.92, 0.125, 0.13],
      [1.02, 0.075, 0.1],
      [1.16, 0.058, 0.058],
    ],
    torsoFront: [
      [-0.12, 0.07],
      [-0.02, 0.165],
      [0.15, 0.162],
      [0.35, 0.145],
      [0.55, 0.165],
      [0.75, 0.205],
      [0.88, 0.228],
      [0.97, 0.218],
      [1.03, 0.15],
      [1.08, 0.078],
      [1.16, 0.064],
    ],
    side: {
      thigh: [
        [0, 0.09, 0.09],
        [0.25, 0.092, 0.086],
        [0.55, 0.08, 0.072],
        [0.85, 0.06, 0.058],
        [1, 0.05, 0.048],
      ],
      shin: [
        [0, 0.045, 0.048],
        [0.2, 0.045, 0.074],
        [0.42, 0.042, 0.068],
        [0.7, 0.032, 0.04],
        [1, 0.028, 0.03],
      ],
      upper: [
        [0, 0.064, 0.066],
        [0.18, 0.068, 0.066],
        [0.45, 0.055, 0.06],
        [0.75, 0.043, 0.048],
        [1, 0.036, 0.036],
      ],
      fore: [
        [0, 0.038, 0.038],
        [0.25, 0.047, 0.045],
        [0.6, 0.034, 0.032],
        [1, 0.024, 0.024],
      ],
    },
    front: {
      thigh: [
        [0, 0.095, 0.07],
        [0.3, 0.102, 0.076],
        [0.6, 0.082, 0.066],
        [0.85, 0.06, 0.05],
        [1, 0.05, 0.045],
      ],
      shin: [
        [0, 0.048, 0.045],
        [0.22, 0.064, 0.058],
        [0.45, 0.056, 0.048],
        [0.75, 0.035, 0.032],
        [1, 0.03, 0.028],
      ],
      upper: [
        [0, 0.078, 0.045],
        [0.2, 0.072, 0.05],
        [0.5, 0.056, 0.05],
        [0.8, 0.043, 0.04],
        [1, 0.036, 0.034],
      ],
      fore: [
        [0, 0.04, 0.038],
        [0.25, 0.048, 0.043],
        [0.6, 0.034, 0.03],
        [1, 0.024, 0.024],
      ],
    },
  },
  female: {
    s: 0.93,
    shin: 0.42,
    thigh: 0.43,
    torso: 0.48,
    upper: 0.275,
    fore: 0.255,
    neck: 0.085,
    shDrop: 0.045,
    shW: 0.17,
    hipW: 0.092,
    head: [0.083, 0.108],
    jaw: 0.056,
    chin: 0.032,
    hand: 0.032,
    def: 0.14,
    hair: true,
    torsoSide: [
      [-0.12, 0.075, 0.09],
      [0, 0.095, 0.135],
      [0.13, 0.095, 0.126],
      [0.32, 0.085, 0.08],
      [0.5, 0.09, 0.085],
      [0.64, 0.125, 0.1],
      [0.74, 0.148, 0.1],
      [0.84, 0.12, 0.1],
      [0.95, 0.09, 0.095],
      [1.03, 0.064, 0.07],
      [1.16, 0.048, 0.048],
    ],
    torsoFront: [
      [-0.12, 0.07],
      [-0.02, 0.166],
      [0.12, 0.16],
      [0.38, 0.124],
      [0.55, 0.138],
      [0.72, 0.155],
      [0.86, 0.168],
      [0.95, 0.163],
      [1.02, 0.11],
      [1.08, 0.056],
      [1.16, 0.048],
    ],
    side: {
      thigh: [
        [0, 0.085, 0.084],
        [0.25, 0.08, 0.078],
        [0.55, 0.068, 0.064],
        [0.85, 0.05, 0.048],
        [1, 0.044, 0.042],
      ],
      shin: [
        [0, 0.04, 0.042],
        [0.2, 0.04, 0.062],
        [0.42, 0.038, 0.057],
        [0.7, 0.028, 0.034],
        [1, 0.024, 0.026],
      ],
      upper: [
        [0, 0.05, 0.05],
        [0.18, 0.05, 0.05],
        [0.45, 0.04, 0.045],
        [0.75, 0.034, 0.036],
        [1, 0.03, 0.03],
      ],
      fore: [
        [0, 0.031, 0.031],
        [0.25, 0.036, 0.034],
        [0.6, 0.027, 0.026],
        [1, 0.02, 0.02],
      ],
    },
    front: {
      thigh: [
        [0, 0.09, 0.064],
        [0.3, 0.086, 0.068],
        [0.6, 0.068, 0.058],
        [0.85, 0.05, 0.045],
        [1, 0.044, 0.04],
      ],
      shin: [
        [0, 0.042, 0.04],
        [0.22, 0.053, 0.05],
        [0.45, 0.046, 0.042],
        [0.75, 0.03, 0.028],
        [1, 0.026, 0.024],
      ],
      upper: [
        [0, 0.06, 0.036],
        [0.2, 0.055, 0.038],
        [0.5, 0.043, 0.038],
        [0.8, 0.034, 0.032],
        [1, 0.03, 0.028],
      ],
      fore: [
        [0, 0.031, 0.031],
        [0.25, 0.036, 0.033],
        [0.6, 0.027, 0.025],
        [1, 0.02, 0.02],
      ],
    },
  },
};

export const MIDFOOT = 0.07;
export const ANKLE_H = 0.08;

// ---------- poses ----------
/** One value per side, or the same value mirrored across the body (z flipped for the left side). */
export type PerSide<T> = T | { L: T; R: T };

/** What the lifter holds: a barbell at `bar`, a weight in each hand (or one, or one held in both), a cable handle, an ab wheel. */
export type Load = "barbell" | "trapbar" | "dumbbell" | "kettlebell" | "ball" | "handle" | "wheel" | "none";
export type Hold = "each" | "centre" | "R";

/** A joint name, the midpoint of the hands ("hands"), a point just off the upper back ("upperBack", where a band wraps), or a fixed point. */
export type Anchor = Vec | "hands" | "ankles" | "handL" | "handR" | "ankleL" | "ankleR" | "kneeL" | "kneeR" | "hipC" | "neck" | "upperBack";

/** Scenery drawn around the figure, in the figure's own frame. */
export type Prop =
  | { kind: "box"; at: Vec; size: Vec; tilt?: number; follow?: Anchor } // centre (offset from `follow` when set), full size, tilt about z (degrees)
  | { kind: "rail"; at: Vec; length: number; axis?: "x" | "y" | "z" } // pull-up bar, dip bars, smith rails
  | { kind: "cable"; from: Anchor; to: Anchor } // pulley cable or band, follows the joints
  | PoleProp
  | RopeProp;

/**
 * A landmine bar: a thick bar from a pivot on the floor to the hands, running on past them by `past`,
 * with a plate on the sleeve just short of the hands. It follows the hands, so it tilts and swings as they move.
 */
export interface PoleProp {
  kind: "pole";
  from: Anchor;
  to: Anchor;
  past: number;
  /** The plate's radius (0.2 when left out; 0 draws none, for a machine's lever arm). */
  plate?: number;
}

/** POLE_SEGMENTS line segments that draw a pole: the bar as a thin tube of four lines, and a plate ring by the hands. */
export const POLE_SEGMENTS = 4 + 16;
export function poleSegments(p: PoleProp, J: Joints): [Vec, Vec][] {
  const a = anchorAt(J, p.from),
    h = anchorAt(J, p.to);
  const d: Vec = [h[0] - a[0], h[1] - a[1], h[2] - a[2]];
  const l = Math.hypot(d[0], d[1], d[2]) || 1;
  const u: Vec = [d[0] / l, d[1] / l, d[2] / l];
  const b: Vec = [h[0] + u[0] * p.past, h[1] + u[1] * p.past, h[2] + u[2] * p.past];
  // two directions across the bar
  const side: Vec = Math.abs(u[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const n1 = norm(cross(u, side)),
    n2 = cross(u, n1);
  const off = (q: Vec, r: number, t: number): Vec => [
    q[0] + (n1[0] * Math.cos(t) + n2[0] * Math.sin(t)) * r,
    q[1] + (n1[1] * Math.cos(t) + n2[1] * Math.sin(t)) * r,
    q[2] + (n1[2] * Math.cos(t) + n2[2] * Math.sin(t)) * r,
  ];
  const out: [Vec, Vec][] = [];
  for (let i = 0; i < 4; i++) {
    const t = (i * Math.PI) / 2;
    out.push([off(a, 0.018, t), off(b, 0.018, t)]);
  }
  // the plates sit on the sleeve just short of the hands
  const plate: Vec = [h[0] - u[0] * 0.14, h[1] - u[1] * 0.14, h[2] - u[2] * 0.14];
  const pr = p.plate ?? 0.2;
  for (let i = 0; i < 16; i++) {
    // no plate: the unused segments collapse onto the bar's end
    if (!pr) out.push([b, b]);
    else out.push([off(plate, pr, (i * Math.PI) / 8), off(plate, pr, ((i + 1) * Math.PI) / 8)]);
  }
  return out;
}

/**
 * A battle rope from a hand to an anchor on the floor ahead, drawn with a travelling sine wave. The
 * hand circles `centre` (forward and back by 0.4 × `radius`, up and down, or side to side when `axis`
 * is "z", by `radius`), and where it is on that circle sets the wave's phase, so the wave rolls down
 * the rope as the hand moves with no clock of its own. The wave swells a little along the rope, the
 * middle sags to the floor, and the far end stays on the anchor.
 */
export interface RopeProp {
  kind: "rope";
  from: Anchor;
  to: Vec;
  centre: Vec;
  radius: number;
  /** How many wavelengths fit along the rope. */
  waves: number;
  axis?: "y" | "z";
}

export function ropePoints(p: RopeProp, J: Joints, n = 32): Vec[] {
  const h = anchorAt(J, p.from);
  const ai = p.axis === "z" ? 2 : 1;
  const r = p.radius || 0.1;
  const sinP = Math.max(-1, Math.min(1, (h[ai] - p.centre[ai]) / r));
  const phi = Math.atan2(sinP, (h[0] - p.centre[0]) / (0.4 * r));
  const out: Vec[] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const q = lerpV(h, p.to, s);
    const env = Math.pow(1 - s, 0.7) * (1 + 1.5 * s);
    // the hand's own offset fades linearly in the straight line; swap it for the wave
    const wave = r * env * Math.sin(phi - 2 * Math.PI * p.waves * s) - (1 - s) * r * Math.sin(phi);
    q[ai] += wave;
    // the middle of the rope lies on the floor
    q[1] = Math.max(0.02, q[1] - 0.3 * Math.sin(Math.PI * s));
    out.push(q);
  }
  return out;
}

export interface Pose {
  /** Pelvis and shoulder centres. The torso runs between them in the x-y plane (shared z). */
  hip: Vec;
  sh: Vec;
  /** Hand targets. A single Vec is mirrored: its z is the half-grip width (default `grip`). */
  hand: PerSide<Vec>;
  ankle?: PerSide<Vec>;
  /** Foot pitch in degrees about the ankle (positive points the toes down). */
  foot?: PerSide<number>;
  kneePole?: PerSide<Vec>;
  elbowPole?: PerSide<Vec>;
  /** How much the head stays upright (1) or follows the spine (0). */
  headBlend?: number;
  headBack?: number;
  /** Tips the head toward the figure's right (+) or left (-): 0.05 is about 14 degrees (the dance's head snaps). */
  headTilt?: number;
  /** Lifts the shoulder joints (shrugs). */
  shrug?: number;
  /** Barbell centre, when the lift uses one. */
  bar?: Vec;
}

export interface Joints {
  hipC: Vec;
  shC: Vec;
  neck: Vec;
  head: Vec;
  headDir: Vec;
  bar?: Vec;
  hipL: Vec;
  kneeL: Vec;
  ankleL: Vec;
  heelL: Vec;
  toeL: Vec;
  shL: Vec;
  elbowL: Vec;
  handL: Vec;
  hipR: Vec;
  kneeR: Vec;
  ankleR: Vec;
  heelR: Vec;
  toeR: Vec;
  shR: Vec;
  elbowR: Vec;
  handR: Vec;
}

const SIDES: [Side, number][] = [
  ["L", -1],
  ["R", 1],
];
const isPer = <T>(v: PerSide<T>): v is { L: T; R: T } => typeof v === "object" && v !== null && "L" in (v as object);
function pick(v: PerSide<Vec> | undefined, side: Side, sgn: number, defZ: number, fallback: Vec): Vec {
  if (v === undefined) return [fallback[0], fallback[1], sgn * Math.abs(fallback[2])];
  if (isPer(v)) return v[side];
  return [v[0], v[1], sgn * (v[2] === 0 ? defZ : Math.abs(v[2]))];
}
function pickN(v: PerSide<number> | undefined, side: Side): number {
  if (v === undefined) return 0;
  return typeof v === "number" ? v : v[side];
}

export interface PoseOpts {
  stance: number;
  grip: number;
}

/** Turns a pose into every joint, solving knees and elbows with IK. */
export function solve(pose: Pose, B: Body, o: PoseOpts): Joints {
  const up = norm(sub(pose.sh, pose.hip));
  const blend = pose.headBlend ?? 0.45;
  const headDir = norm(add(add(mul(up, 1 - blend * 0.5), mul([0, 1, 0], blend * 0.5)), V(0, 0, (pose.headTilt ?? 0) / 0.2)));
  const neck = add(pose.sh, mul(up, B.neck));
  const head = add(add(neck, mul(headDir, B.head[1] * 1.05)), V(pose.headBack ?? 0, 0));
  const J = { hipC: pose.hip, shC: pose.sh, neck, head, headDir, bar: pose.bar } as Joints;
  const j = J as unknown as Record<string, Vec>;
  for (const [side, sgn] of SIDES) {
    const ankle = pick(pose.ankle, side, sgn, o.stance * B.s, V(0, ANKLE_H, o.stance * B.s));
    const hip = V(pose.hip[0], pose.hip[1], pose.hip[2] + sgn * B.hipW);
    j["ankle" + side] = ankle;
    j["hip" + side] = hip;
    j["knee" + side] = ik(hip, ankle, B.thigh, B.shin, pick(pose.kneePole, side, sgn, 0.45, V(1, 0, 0.45)));
    // feet: heel and toe offsets about the ankle, pitched
    const p = rad(pickN(pose.foot, side));
    const rot = (x: number, y: number): Vec => V(x * Math.cos(p) + y * Math.sin(p), -x * Math.sin(p) + y * Math.cos(p));
    j["heel" + side] = add(ankle, rot(-0.055 * B.s, -0.075));
    j["toe" + side] = add(ankle, add(rot(0.18 * B.s, -0.075), V(0, 0, sgn * 0.03)));
    const hand = pick(pose.hand, side, sgn, o.grip, V(0, 0, o.grip));
    // The shoulder sits shDrop below the top of the torso, but rides back up (the shoulder blade lifts)
    // when the hand needs it: hanging from a bar, locking out overhead.
    const top = V(pose.sh[0], pose.sh[1] + (pose.shrug ?? 0), pose.sh[2] + sgn * B.shW);
    const fits = (d: number) => len(sub(hand, add(top, mul(up, -d)))) <= B.upper + B.fore - 0.002;
    let drop = B.shDrop;
    if (!fits(drop)) {
      let lo = 0,
        hi = drop;
      for (let k = 0; k < 12; k++) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) lo = mid;
        else hi = mid;
      }
      drop = lo;
    }
    const sh = add(top, mul(up, -drop));
    j["sh" + side] = sh;
    j["hand" + side] = hand;
    j["elbow" + side] = ik(sh, hand, B.upper, B.fore, pick(pose.elbowPole, side, sgn, 0.4, V(-1, -0.7, 0.4)));
  }
  return J;
}

// ---------- tempo ----------
export type PhaseRow = [dur: number, from: number, to: number, label: string, effort: number];

export const TEMPO = {
  /** Start at the top, lower, then drive back up (squats, presses from the top, push-ups). */
  lowerFirst: (lower = "Lower · 2s", drive = "Drive · 1s", top = "Brace", bottom = "Bottom"): PhaseRow[] => [
    [0.6, 0, 0, top, 0.35],
    [1.8, 0, 1, lower, 0.55],
    [0.35, 1, 1, bottom, 0.6],
    [1.0, 1, 0, drive, 1],
  ],
  /** Start long, lift, squeeze, lower (pulls, curls, deadlifts, raises). */
  liftFirst: (lift = "Lift · 1s", lower = "Lower · 2s", start = "Set", squeeze = "Squeeze"): PhaseRow[] => [
    [0.6, 0, 0, start, 0.35],
    [1.1, 0, 1, lift, 1],
    [0.45, 1, 1, squeeze, 0.8],
    [1.6, 1, 0, lower, 0.55],
  ],
  /** Holds breathe slowly. */
  hold: (label = "Hold · breathe"): PhaseRow[] => [
    [2, 0, 1, label, 0.8],
    [2, 1, 0, label, 0.8],
  ],
  /** Carries walk: d runs 0 to 1 each stride pair. */
  walk: (): PhaseRow[] => [[1.2, 0, 1, "Walk tall", 0.8]],
  /** Alternating sides: 0 → 1 is one side, 1 → 0 the other. */
  alternate: (a = "One side", b = "Other side"): PhaseRow[] => [
    [1.4, 0, 1, a, 1],
    [1.4, 1, 0, b, 1],
  ],
};

export function cycleLength(phases: PhaseRow[]) {
  return phases.reduce((s, p) => s + p[0], 0);
}

export function sample(phases: PhaseRow[], t: number): { d: number; label: string; effort: number } {
  const total = cycleLength(phases);
  let x = ((t % total) + total) % total;
  for (const [dur, a, b, label, effort] of phases) {
    if (x <= dur) {
      const linear = phases.length === 1;
      return { d: lerp(a, b, linear ? x / dur : ease(x / dur)), label, effort };
    }
    x -= dur;
  }
  return { d: phases[0][1], label: phases[0][3], effort: phases[0][4] };
}

/** Where an anchor is for the current joints. */
export function anchorAt(J: Joints, a: Anchor): Vec {
  if (typeof a !== "string") return a;
  if (a === "hands") return lerpV(J.handL, J.handR, 0.5);
  if (a === "ankles") return lerpV(J.ankleL, J.ankleR, 0.5);
  if (a === "upperBack") {
    // off the shoulder blades, on the side away from the chest
    const ux = J.shC[0] - J.hipC[0],
      uy = J.shC[1] - J.hipC[1];
    const l = Math.hypot(ux, uy) || 1;
    const c = lerpV(J.hipC, J.shC, 0.85);
    return [c[0] - (uy / l) * 0.13, c[1] + (ux / l) * 0.13, c[2]];
  }
  return (J as unknown as Record<string, Vec>)[a];
}
