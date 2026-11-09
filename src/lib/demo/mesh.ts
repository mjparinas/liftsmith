import type { Muscle } from "../types";
import type { Motion } from "./motions";
import {
  ANKLE_H, V, add, clamp, cross, dot, interp, len, lerp, mul, norm, rad, solve, sub,
  type Body, type Joints, type Side, type Vec,
} from "./rig";

// The hologram body: each limb is a capped tube whose cross-section is an ellipse (front and back
// from the side profile, sides from the front profile), the torso is one tube, the head and hands
// are ellipsoids. Grid sizes are fixed so index buffers are built once and only positions change.
// Shared by the three.js renderer and the 2D canvas drawing used when WebGL is missing.

const CAP = 3;
export interface Part { name: string; kind: "torso" | "head" | "hair" | "limb" | "hand" | "foot"; base?: "thigh" | "shin" | "upper" | "fore"; a?: string; b?: string; side?: Side; NT: number; M: number }

export const PARTS: Part[] = [{ name: "torso", kind: "torso", NT: 26, M: 30 }, { name: "head", kind: "head", NT: 12, M: 20 }, { name: "hair", kind: "hair", NT: 10, M: 10 }];
for (const s of ["L", "R"] as Side[]) {
  PARTS.push(
    { name: "thigh" + s, kind: "limb", base: "thigh", a: "hip" + s, b: "knee" + s, side: s, NT: 18, M: 20 },
    { name: "shin" + s, kind: "limb", base: "shin", a: "knee" + s, b: "ankle" + s, side: s, NT: 18, M: 18 },
    { name: "upper" + s, kind: "limb", base: "upper", a: "sh" + s, b: "elbow" + s, side: s, NT: 16, M: 18 },
    { name: "fore" + s, kind: "limb", base: "fore", a: "elbow" + s, b: "hand" + s, side: s, NT: 14, M: 14 },
    { name: "hand" + s, kind: "hand", side: s, NT: 8, M: 12 },
    { name: "foot" + s, kind: "foot", side: s, NT: 12, M: 12 },
  );
}

/** Line and triangle indices for a part's grid (rings and longitudes; diagonals; shell). */
export function partIndices(P: Part) {
  const lines: number[] = [], diags: number[] = [], tris: number[] = [];
  const id = (i: number, j: number) => i * P.M + (j % P.M);
  for (let i = 0; i < P.NT; i++)
    for (let j = 0; j < P.M; j++) {
      lines.push(id(i, j), id(i, j + 1));
      if (i < P.NT - 1) {
        lines.push(id(i, j), id(i + 1, j));
        diags.push((i + j) % 2 ? id(i, j) : id(i, j + 1), (i + j) % 2 ? id(i + 1, j + 1) : id(i + 1, j));
        tris.push(id(i, j), id(i + 1, j), id(i + 1, j + 1), id(i, j), id(i + 1, j + 1), id(i, j + 1));
      }
    }
  return { lines, diags, tris };
}

function capRings(NT: number, e0: number, e1: number) {
  const rings: [number, number, number][] = [];
  const NB = NT - 2 * CAP;
  for (let c = 0; c < CAP; c++) { const ph = (c / CAP) * Math.PI / 2; rings.push([0, Math.sin(ph), -e0 * Math.cos(ph)]); }
  for (let i = 0; i < NB; i++) { const t = i / (NB - 1); rings.push([t, 1, t]); }
  for (let c = CAP - 1; c >= 0; c--) { const ph = (c / CAP) * Math.PI / 2; rings.push([1, Math.sin(ph), 1 + e1 * Math.cos(ph)]); }
  return rings;
}

/** Cross-section frame for a bone: u along it, f = front (from the side-view perpendicular), o = outer. */
export function boneFrame(a: Vec, b: Vec, kind: "limb" | "torso", sideSign: number) {
  const u = norm(sub(b, a));
  let d2 = [u[0], u[1]];
  const l2 = Math.hypot(d2[0], d2[1]);
  d2 = l2 < 1e-4 ? [0, -1] : [d2[0] / l2, d2[1] / l2];
  const p2: Vec = kind === "torso" ? [d2[1], -d2[0], 0] : [-d2[1], d2[0], 0];
  let f = sub(p2, mul(u, dot(p2, u)));
  f = len(f) < 1e-4 ? [1, 0, 0] : norm(f);
  let o = norm(cross(u, f));
  if (o[2] * sideSign < 0) o = mul(o, -1);
  return { u, f, o };
}

const FOOT_SIDE = [[0, 0.045, 0.04], [0.35, 0.05, 0.03], [0.7, 0.03, 0.022], [1, 0.018, 0.018]];
const FOOT_FRONT = [[0, 0.036, 0.036], [0.4, 0.046, 0.042], [0.75, 0.048, 0.045], [1, 0.04, 0.038]];

/** Fill one part's vertex grid for a pose; meta (t along, angle around) is filled when given. */
export function evalPart(P: Part, J: Joints, B: Body, pos: Float32Array, meta?: Float32Array) {
  const { NT, M } = P;
  const j = J as unknown as Record<string, Vec>;
  let k = 0;
  const put = (p: Vec, t: number, ang: number) => {
    pos[k * 3] = p[0]; pos[k * 3 + 1] = p[1]; pos[k * 3 + 2] = p[2];
    if (meta) { meta[k * 2] = t; meta[k * 2 + 1] = ang; }
    k++;
  };
  const section = (c: Vec, F: { f: Vec; o: Vec }, ang: number, rf: number, ro: number) => add(c, add(mul(F.f, Math.cos(ang) * rf), mul(F.o, Math.sin(ang) * ro)));
  if (P.kind === "limb" || P.kind === "foot") {
    const sg = P.side === "L" ? -1 : 1;
    let a: Vec, b: Vec, sideT: number[][], frontT: number[][];
    if (P.kind === "limb") { a = j[P.a!]; b = j[P.b!]; sideT = B.side[P.base!]; frontT = B.front[P.base!]; }
    else {
      const ank = j["ankle" + P.side], heel = j["heel" + P.side], toe = j["toe" + P.side];
      const fd = norm(sub(toe, heel));
      let fu = sub(sub(ank, heel), mul(fd, dot(sub(ank, heel), fd)));
      fu = len(fu) < 1e-4 ? V(0, 1) : norm(fu);
      a = add(heel, add(mul(fd, 0.02), mul(fu, 0.04)));
      b = add(toe, mul(fu, 0.017));
      sideT = FOOT_SIDE; frontT = FOOT_FRONT.map((r) => r.map((v, i) => (i ? v * B.s : v)));
    }
    const L = len(sub(b, a)) || 1e-3;
    const F = boneFrame(a, b, "limb", sg);
    const w0 = (sideT[0][1] + sideT[0][2]) / 2, w1 = (sideT[sideT.length - 1][1] + sideT[sideT.length - 1][2]) / 2;
    const topCap = P.base === "thigh" ? 0.22 : P.base === "upper" ? 0.8 : 0.5;
    const rings = capRings(NT, Math.min(0.5, (topCap * w0) / L), Math.min(0.5, (0.5 * w1) / L));
    for (const [tw, sc0, tr] of rings) {
      const sc = P.base === "thigh" && tw < 0.22 ? sc0 * lerp(0.8, 1, tw / 0.22) : sc0;
      const c = add(a, mul(sub(b, a), tr));
      for (let m = 0; m < M; m++) {
        const ang = (m / M) * Math.PI * 2;
        const rf = (Math.cos(ang) >= 0 ? interp(sideT, tw, 1) : interp(sideT, tw, 2)) * sc;
        const ro = (Math.sin(ang) >= 0 ? interp(frontT, tw, 1) : interp(frontT, tw, 2)) * sc;
        put(section(c, F, ang, rf, ro), tr, ang);
      }
    }
  } else if (P.kind === "torso") {
    const F = boneFrame(J.hipC, J.shC, "torso", 1);
    for (let i = 0; i < NT; i++) {
      const t = lerp(-0.13, 1.16, i / (NT - 1));
      const sc = i === 0 ? 0.35 : i === 1 ? 0.8 : 1;
      const c = add(J.hipC, mul(sub(J.shC, J.hipC), t));
      for (let m = 0; m < M; m++) {
        const ang = (m / M) * Math.PI * 2;
        const rf = (Math.cos(ang) >= 0 ? interp(B.torsoSide, t, 1) : interp(B.torsoSide, t, 2)) * sc;
        const ro = interp(B.torsoFront, t, 1) * sc;
        put(section(c, F, ang, rf, ro), t, ang);
      }
    }
  } else if (P.kind === "head" || P.kind === "hand") {
    let c: Vec, up: Vec, fw: Vec, rx: number, ry: number, rz: number;
    if (P.kind === "head") {
      c = J.head; up = J.headDir; fw = norm([up[1], -up[0], 0]);
      rx = B.head[0] * 1.1; ry = B.head[1]; rz = B.head[0] * 0.96;
    } else {
      const s = P.side!;
      const d = norm(sub(j["hand" + s], j["elbow" + s]));
      c = add(j["hand" + s], mul(d, 0.02)); up = d; fw = cross(d, [0, 0, 1]);
      fw = len(fw) < 0.1 ? [1, 0, 0] : norm(fw);
      ry = B.hand * 1.35; rx = B.hand * 0.8; rz = B.hand;
    }
    const sd = norm(cross(fw, up));
    for (let i = 0; i < NT; i++) {
      const lat = -Math.PI / 2 + (Math.PI * i) / (NT - 1);
      for (let m = 0; m < M; m++) {
        const lon = (m / M) * Math.PI * 2;
        let fx = Math.cos(lat) * Math.cos(lon) * rx;
        const sy = Math.sin(lat) * ry, sz = Math.cos(lat) * Math.sin(lon) * rz;
        if (P.kind === "head" && lat < 0 && Math.cos(lon) > 0) fx *= 1 + 0.18 * Math.sin(-lat) * Math.cos(lon); // jaw
        put(add(c, add(mul(fw, fx), add(mul(up, sy), mul(sd, sz)))), i / (NT - 1), lon);
      }
    }
  } else {
    // hair: a tapered ponytail tube behind the head (zero radius on bodies without hair)
    const c = J.head, up = J.headDir, fw = norm([up[1], -up[0], 0]);
    const H = (u: number, v: number) => add(c, add(mul(fw, u), mul(up, v)));
    const ctrl = [[-0.06, 0.075, 0.03], [-0.12, 0.045, 0.036], [-0.155, -0.05, 0.03], [-0.15, -0.17, 0.02], [-0.13, -0.22, 0.004]];
    for (let i = 0; i < NT; i++) {
      const s = (i / (NT - 1)) * (ctrl.length - 1), k0 = Math.min(ctrl.length - 2, Math.floor(s)), q = s - k0;
      const A = ctrl[k0], Bq = ctrl[k0 + 1];
      const r = lerp(A[2], Bq[2], q) * (B.hair ? 1 : 0);
      const p = H(lerp(A[0], Bq[0], q), lerp(A[1], Bq[1], q));
      const tan = norm(sub(H(Bq[0], Bq[1]), H(A[0], A[1]))), n1: Vec = [0, 0, 1], n2 = norm(cross(tan, n1));
      for (let m = 0; m < M; m++) { const ang = (m / M) * Math.PI * 2; put(add(p, add(mul(n1, Math.cos(ang) * r), mul(n2, Math.sin(ang) * r))), 0, 0); }
    }
  }
}

// ---------- muscles on the mesh: part, t range along it, angle range around it (0 front, 90 outer, 180 back, -90 inner) ----------
interface Region { id: Muscle; part: "torso" | "thigh" | "shin" | "upper" | "fore"; t: [number, number]; a: [number, number]; mirror?: boolean }
export const REGIONS: Region[] = [
  { id: "quads", part: "thigh", t: [0.06, 0.94], a: [-70, 100] },
  { id: "hamstrings", part: "thigh", t: [0.1, 0.9], a: [115, 245] },
  { id: "adductors", part: "thigh", t: [0.02, 0.55], a: [-150, -65] },
  { id: "calves", part: "shin", t: [0.06, 0.62], a: [100, 260] },
  { id: "glutes", part: "torso", t: [-0.13, 0.22], a: [112, 248] },
  { id: "lowerBack", part: "torso", t: [0.06, 0.66], a: [152, 208] },
  { id: "lats", part: "torso", t: [0.48, 0.86], a: [92, 150], mirror: true },
  { id: "upperBack", part: "torso", t: [0.62, 0.95], a: [140, 220] },
  { id: "traps", part: "torso", t: [0.86, 1.14], a: [105, 255] },
  { id: "chest", part: "torso", t: [0.64, 0.92], a: [6, 78], mirror: true },
  { id: "abs", part: "torso", t: [0.28, 0.66], a: [-26, 26] },
  { id: "obliques", part: "torso", t: [0.26, 0.6], a: [34, 88], mirror: true },
  { id: "frontDelts", part: "upper", t: [-0.2, 0.34], a: [-70, 40] },
  { id: "sideDelts", part: "upper", t: [-0.2, 0.34], a: [40, 135] },
  { id: "rearDelts", part: "upper", t: [-0.2, 0.34], a: [135, 230] },
  { id: "triceps", part: "upper", t: [0.24, 0.9], a: [125, 235] },
  { id: "biceps", part: "upper", t: [0.28, 0.9], a: [-55, 55] },
  { id: "forearms", part: "fore", t: [0.02, 0.62], a: [-180, 180] },
];

function angIn(deg: number, a0: number, a1: number) {
  const x = (((deg - a0) % 360) + 360) % 360, span = a1 - a0;
  if (span >= 360 || x <= span) return 0;
  return Math.min(x - span, 360 - x);
}

/**
 * Per-vertex muscle weight (0..1) for a part; static per exercise because t and angle never change.
 * When `which` is given it gets the index (in REGIONS) of the muscle that won each vertex, or -1.
 */
export function partWeights(P: Part, meta: Float32Array, targets: Partial<Record<Muscle, number>>, out: Float32Array, which?: Int8Array) {
  out.fill(0);
  which?.fill(-1);
  const base = P.base ?? P.name;
  if (!["torso", "thigh", "shin", "upper", "fore"].includes(base)) return;
  const regions = REGIONS.filter((r) => r.part === base && targets[r.id]);
  if (!regions.length) return;
  for (let k = 0; k < out.length; k++) {
    const t = meta[k * 2], deg = (meta[k * 2 + 1] * 180) / Math.PI;
    let w = 0, win = -1;
    for (const r of regions) {
      const u = (t - r.t[0]) / (r.t[1] - r.t[0]);
      if (u < 0 || u > 1) continue;
      const along = Math.pow(Math.sin(Math.PI * u), 0.5);
      let off = angIn(deg, r.a[0], r.a[1]);
      if (r.mirror) off = Math.min(off, angIn(-deg, r.a[0], r.a[1]));
      const v = targets[r.id]! * along * clamp(1 - off / 22, 0, 1);
      if (v > w) { w = v; win = REGIONS.indexOf(r); }
    }
    out[k] = w;
    if (which) which[k] = win;
  }
}

// ---------- skeleton ----------
export const SKEL_MAX = 1400;
/** Writes x-ray skeleton line segments (pairs of points) and returns how many. */
export function skeletonSegments(J: Joints, B: Body, arr: Float32Array): number {
  let n = 0;
  const j = J as unknown as Record<string, Vec>;
  const seg = (a: Vec, b: Vec) => { if (n >= SKEL_MAX) return; arr.set(a, n * 6); arr.set(b, n * 6 + 3); n++; };
  const ring = (c: Vec, a1: Vec, a2: Vec, r1: number, r2: number, N = 16, from = 0, to = Math.PI * 2) => {
    let prev: Vec | null = null;
    for (let i = 0; i <= N; i++) {
      const a = from + ((to - from) * i) / N;
      const p = add(c, add(mul(a1, Math.cos(a) * r1), mul(a2, Math.sin(a) * r2)));
      if (prev) seg(prev, p);
      prev = p;
    }
  };
  const boneLine = (a: Vec, b: Vec, r: number) => {
    const F = boneFrame(a, b, "limb", 1);
    for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) seg(add(a, add(mul(F.f, x * r * 0.5), mul(F.o, y * r * 0.5))), add(b, add(mul(F.f, x * r * 0.5), mul(F.o, y * r * 0.5))));
    ring(a, F.f, F.o, r, r, 10); ring(b, F.f, F.o, r * 0.9, r * 0.9, 10);
  };
  for (const s of ["L", "R"]) {
    boneLine(j["hip" + s], j["knee" + s], 0.028); boneLine(j["knee" + s], j["ankle" + s], 0.024);
    boneLine(j["sh" + s], j["elbow" + s], 0.022); boneLine(j["elbow" + s], j["hand" + s], 0.018);
    seg(j["ankle" + s], j["toe" + s]); seg(j["ankle" + s], j["heel" + s]);
    seg(add(J.shC, mul(norm(sub(J.shC, J.hipC)), -0.02)), j["sh" + s]);
  }
  const F = boneFrame(J.hipC, J.shC, "torso", 1), TS = B.torsoSide, TF = B.torsoFront;
  const at = (t: number, f: number, o: number) => add(add(J.hipC, mul(sub(J.shC, J.hipC), t)), add(mul(F.f, f), mul(F.o, o)));
  const spine: Vec[] = [];
  for (let i = 0; i <= 16; i++) { const t = -0.04 + i * 0.075; spine.push(at(t, -interp(TS, t, 2) * (0.55 + 0.12 * Math.sin(t * 6)), 0)); }
  for (let i = 0; i < spine.length - 1; i++) seg(spine[i], spine[i + 1]);
  for (const p of spine) ring(p, F.f, F.o, 0.014, 0.022, 6);
  for (const t of [0.56, 0.63, 0.7, 0.77, 0.84, 0.9]) {
    const c = at(t, (interp(TS, t, 1) - interp(TS, t, 2)) * 0.25, 0), k = 0.78 - (t - 0.56) * 0.3;
    ring(c, F.f, F.o, (interp(TS, t, 1) + interp(TS, t, 2)) * 0.5 * k, interp(TF, t, 1) * k, 22, Math.PI * 0.08, Math.PI * 1.92);
  }
  ring(at(0.06, 0, 0), F.f, F.o, interp(TS, 0.06, 2) * 0.7, interp(TF, 0.06, 1) * 0.72, 20);
  ring(at(-0.02, 0, 0), F.f, F.o, interp(TS, 0, 2) * 0.45, interp(TF, 0, 1) * 0.45, 16);
  const up = J.headDir, fw = norm([up[1], -up[0], 0]), sd: Vec = [0, 0, 1];
  const hc = add(J.head, mul(up, 0.01));
  ring(hc, fw, up, B.head[0] * 0.82, B.head[1] * 0.8, 20); ring(hc, sd, up, B.head[0] * 0.78, B.head[1] * 0.8, 20); ring(hc, fw, sd, B.head[0] * 0.82, B.head[0] * 0.78, 20);
  for (const sg of [-1, 1]) ring(add(hc, add(mul(fw, B.head[0] * 0.62), mul(sd, sg * B.head[0] * 0.32))), sd, up, 0.016, 0.016, 8);
  ring(add(hc, mul(up, -B.head[1] * 0.55)), fw, sd, B.head[0] * 0.6, B.head[0] * 0.55, 14, -Math.PI * 0.45, Math.PI * 0.45);
  return n;
}

// ---------- placing the figure ----------
export interface Placement { roll: (d: number) => number; lift: number; shiftZ: number }

const JOINT_KEYS = ["hipC", "shC", "neck", "head", "hipL", "kneeL", "ankleL", "heelL", "toeL", "shL", "elbowL", "handL", "hipR", "kneeR", "ankleR", "heelR", "toeR", "shR", "elbowR", "handR"] as const;

/** Rotate about the forward (x) axis by `deg`, then lift and shift. */
export function placeVec(p: Vec, deg: number, lift: number, shiftZ: number): Vec {
  if (!deg) return [p[0], p[1] + lift, p[2] + shiftZ];
  const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
  return [p[0], p[1] * c - p[2] * s + lift, p[1] * s + p[2] * c + shiftZ];
}

/** For rolled motions (side planks): how far to lift and shift so the figure rests on the floor, centred. */
export function placement(m: Motion, B: Body): Placement {
  const roll = m.roll ?? (() => 0);
  if (!m.roll) return { roll, lift: 0, shiftZ: 0 };
  let minY = Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i <= 8; i++) {
    const d = i / 8;
    const J = solve(m.pose(B, d), B, { stance: m.stance ?? 0.14, grip: m.grip ?? 0.25 }) as unknown as Record<string, Vec>;
    for (const k of JOINT_KEYS) {
      const p = placeVec(J[k], roll(d), 0, 0);
      minY = Math.min(minY, p[1]); minZ = Math.min(minZ, p[2]); maxZ = Math.max(maxZ, p[2]);
    }
  }
  return { roll, lift: 0.05 - minY, shiftZ: -(minZ + maxZ) / 2 };
}

/** Solve the pose for a phase value, in the figure's own frame (the renderer applies the placement). */
export function jointsAt(m: Motion, B: Body, d: number): Joints {
  return solve(m.pose(B, d), B, { stance: m.stance ?? 0.14, grip: m.grip ?? 0.25 });
}

/** Bounding box of the figure over one rep, for framing the camera. */
export function bounds(m: Motion, B: Body, pl: Placement) {
  const lo: Vec = [Infinity, Infinity, Infinity], hi: Vec = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i <= 10; i++) {
    const d = i / 10;
    const J = jointsAt(m, B, d) as unknown as Record<string, Vec>;
    for (const k of [...JOINT_KEYS, "bar"]) {
      if (!J[k]) continue;
      const p = placeVec(J[k], pl.roll(d), pl.lift, pl.shiftZ);
      for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], p[a]); hi[a] = Math.max(hi[a], p[a]); }
    }
  }
  lo[1] = Math.min(lo[1], 0);
  hi[1] += 0.15; // head top
  return { lo, hi, centre: mul(add(lo, hi), 0.5), size: Math.max(hi[1] - lo[1], hi[0] - lo[0] + 0.3, hi[2] - lo[2] + 0.2, 1.2) };
}

export { ANKLE_H };
