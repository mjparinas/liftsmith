import { EXERCISES } from "../exercises";
import type { Muscle } from "../types";
import {
  ANKLE_H, MIDFOOT, TEMPO, V, add, clamp, ease, lerp, lerpV, mul, norm, rad, sub,
  type Anchor, type Body, type Hold, type Load, type PhaseRow, type Pose, type Prop, type Vec,
} from "./rig";

// One motion per exercise in the library. Motions are built from a few families (squat, hinge,
// press, bench, row, pull, curl, push-up, ...) with parameters, so the same family covers its
// barbell, dumbbell, machine and bodyweight versions. Every pose is a function of the body, so the
// male and female figures share the motion.

export interface Motion {
  phases: PhaseRow[];
  pose: (B: Body, d: number) => Pose;
  load: Load;
  hold?: Hold;
  stance?: number;
  grip?: number;
  props?: (B: Body) => Prop[];
  /** Plate size on the barbell (1 = full-size plates; curls and skull crushers use small ones). */
  plates?: number;
  /** Whole-figure roll about the forward axis in degrees (side planks); the figure is then set on the floor. */
  roll?: (d: number) => number;
}

// ---------- shared helpers ----------
const reach = (B: Body) => B.upper + B.fore;
const legMax = (B: Body) => (B.shin + B.thigh) * 0.995;
/** Hip height with straight legs and the hip `dx` ahead of the ankles. */
const standY = (B: Body, dx = 0.03, bend = 1) => ANKLE_H + Math.sqrt(Math.max(0.01, (legMax(B) * bend) ** 2 - dx * dx));
/** Shoulder centre for a torso leaning `lean` degrees forward from vertical (90 = face down, -90 = face up, head behind). */
const torsoAt = (B: Body, hip: Vec, lean: number): Vec => add(hip, V(Math.sin(rad(lean)) * B.torso, Math.cos(rad(lean)) * B.torso, 0));
/** The torso's front direction for a lean. */
const frontOf = (lean: number): Vec => V(Math.cos(rad(lean)), -Math.sin(rad(lean)));
/** A point on the torso surface: t along hip → shoulder, `out` metres in front. */
const onTorso = (hip: Vec, sh: Vec, lean: number, t: number, out: number): Vec => add(lerpV(hip, sh, t), mul(frontOf(lean), out));
/** A point `l` from `from` at angle `a` degrees measured from straight down, forward positive. */
const swing = (from: Vec, l: number, a: number): Vec => add(from, V(Math.sin(rad(a)) * l, -Math.cos(rad(a)) * l));
const side = (B: Body, sgn: number, sh: Vec) => V(sh[0], sh[1], sgn * B.shW);
const per = (L: Vec, R: Vec) => ({ L, R });
/** Hands hanging straight from the shoulders, a little out to the sides. */
const hang = (B: Body, sh: Vec, out = 0.03, k = 0.97): Vec => V(sh[0] + 0.02, sh[1] - reach(B) * k, B.shW + out);

const bench = (x0: number, x1: number, top = 0.45, w = 0.3): Prop => ({ kind: "box", at: V((x0 + x1) / 2, top / 2), size: V(x1 - x0, top, w) });
const pad = (at: Vec, l: number, tilt: number, w = 0.3): Prop => ({ kind: "box", at, size: V(l, 0.08, w), tilt });
/** A pad behind (or in front of) the torso, along it. */
function torsoPad(B: Body, hip: Vec, lean: number, where: "back" | "front" = "back", w = 0.32): Prop {
  const sh = torsoAt(B, hip, lean);
  const c = add(lerpV(hip, sh, 0.5), mul(frontOf(lean), where === "front" ? 0.17 : -0.16));
  return { kind: "box", at: c, size: V(B.torso * 1.15, 0.07, w), tilt: 90 - lean };
}
const boxP = (x: number, top: number, w = 0.45, d = 0.4): Prop => ({ kind: "box", at: V(x, top / 2), size: V(d, top, w) });
const rail = (at: Vec, length: number, axis: "x" | "y" | "z" = "z"): Prop => ({ kind: "rail", at, length, axis });
const cable = (from: Anchor, to: Anchor = "hands"): Prop => ({ kind: "cable", from, to });

/** Seated: hips on a seat of height `seat`, feet on the floor in front. */
function seated(B: Body, seat = 0.45, lean = -8) {
  const hip = V(0, seat + 0.07);
  const sh = torsoAt(B, hip, lean);
  return { hip, sh, ankle: V(B.thigh * 0.95, ANKLE_H, 0.2), kneePole: V(0.2, 1, 0.3) };
}
const seatProps = (lean = -8, back = true) => (B: Body): Prop[] => {
  const p: Prop[] = [bench(-0.2, 0.3, 0.45, 0.34)];
  if (back) p.push(torsoPad(B, V(0, 0.52), lean));
  return p;
};

// ---------- squats ----------
type SquatHold = "back" | "front" | "goblet" | "arms" | "hips";
function squat(o: { hold: SquatHold; load?: Load; depth?: number; box?: boolean; smith?: boolean; holdKind?: Hold }): Motion {
  const depth = o.depth ?? 1;
  return {
    phases: TEMPO.lowerFirst(),
    load: o.load ?? (o.hold === "back" || o.hold === "front" ? "barbell" : "none"),
    hold: o.holdKind,
    stance: 0.19,
    grip: o.hold === "back" ? 0.34 : o.hold === "front" ? 0.2 : 0.06,
    pose(B, d0) {
      const d = d0 * depth;
      const upright = o.hold === "front" || o.hold === "goblet" ? 0.6 : 1;
      const lean = rad(8 + 36 * upright * Math.pow(d, 0.85));
      const shX = MIDFOOT + 0.05;
      const hipX = shX - Math.sin(lean) * B.torso;
      const topY = ANKLE_H + Math.sqrt(Math.max(0.01, legMax(B) ** 2 - hipX * hipX));
      const hipY = lerp(topY, ANKLE_H + B.shin * 0.98, d);
      const hip = V(hipX, hipY);
      const sh = V(shX, hipY + Math.cos(lean) * B.torso);
      const leanDeg = (lean * 180) / Math.PI;
      if (o.hold === "back") {
        const bar = V(MIDFOOT, sh[1] - 0.03);
        return { hip, sh, bar, hand: bar, elbowPole: V(-1, -0.7, 0), kneePole: V(1, 0, 0.45), headBlend: 0.45 };
      }
      if (o.hold === "front") {
        const bar = add(sh, add(mul(frontOf(leanDeg), 0.12), V(0, 0.02)));
        return { hip, sh, bar, hand: V(bar[0] - 0.02, bar[1] - 0.02, 0.2), elbowPole: V(1, -0.1, 0.3), headBlend: 0.7 };
      }
      if (o.hold === "goblet") {
        const c = onTorso(hip, sh, leanDeg, 0.88, 0.2);
        return { hip, sh, hand: V(c[0], c[1] - 0.04, 0.06), elbowPole: V(0.2, -1, 0.3), headBlend: 0.7 };
      }
      if (o.hold === "hips") return { hip, sh, hand: V(hip[0] + 0.02, hip[1] + 0.06, B.hipW + 0.13), elbowPole: V(-0.4, 0, 1), headBlend: 0.6 };
      const hand = V(sh[0] + reach(B) * 0.9, sh[1] - 0.06, 0.16);
      return { hip, sh, hand, elbowPole: V(0, -1, 0.3), headBlend: 0.7 };
    },
    props: o.box || o.smith ? (B) => {
      const p: Prop[] = [];
      if (o.box) p.push(boxP(-0.25, ANKLE_H + B.shin * 0.98 - 0.1, 0.4, 0.35));
      if (o.smith) p.push(rail(V(MIDFOOT, 1.15, 0.62), 2.3, "y"), rail(V(MIDFOOT, 1.15, -0.62), 2.3, "y"));
      return p;
    } : undefined,
  };
}

function hackSquat(): Motion {
  const back = 25;
  return {
    phases: TEMPO.lowerFirst(),
    load: "none",
    stance: 0.17,
    pose(B, d) {
      const ankle = V(0.18, 0.2);
      const dir = V(-Math.sin(rad(back)), Math.cos(rad(back)));
      const top = add(ankle, mul(dir, legMax(B) * 0.97));
      const hip = sub(top, mul(dir, legMax(B) * 0.5 * d));
      const sh = torsoAt(B, hip, -back);
      return { hip, sh, ankle: V(ankle[0], ankle[1], 0.17), foot: -back, hand: V(sh[0] + 0.05, sh[1] + 0.02, B.shW + 0.08), elbowPole: V(1, -0.6, 0.6), headBlend: 0.3 };
    },
    props(B) {
      const p = this.pose(B, 0.5);
      return [torsoPad(B, p.hip, -back, "back", 0.4), pad(V(0.2, 0.12), 0.5, -back, 0.6)];
    },
  };
}

function legPress(): Motion {
  const recline = 60;
  return {
    phases: TEMPO.lowerFirst(),
    load: "none",
    stance: 0.17,
    pose(B, d) {
      const hip = V(0, 0.5);
      const sh = torsoAt(B, hip, -recline);
      const dir = norm(V(1, 0.85));
      const ankle = add(hip, mul(dir, lerp(legMax(B) * 0.96, legMax(B) * 0.42, d)));
      return { hip, sh, ankle: V(ankle[0], ankle[1], 0.17), foot: -115, kneePole: V(-0.2, 1, 0.35), hand: V(0.05, 0.5, B.hipW + 0.18), elbowPole: V(-1, 0, 0.6), headBlend: 0.2 };
    },
    props: (B) => [torsoPad(B, V(0, 0.5), -recline, "back", 0.45), bench(-0.2, 0.2, 0.36, 0.45), { kind: "box", at: mul(norm(V(1, 0.85)), 0.1), size: V(0.06, 0.6, 0.6), tilt: -40, follow: "ankles" }],
  };
}

// ---------- hinges ----------
function deadlift(o: { trap?: boolean } = {}): Motion {
  return {
    phases: [[0.6, 1, 1, "Set", 0.35], [1.3, 1, 0, "Pull · 1s", 1], [0.45, 0, 0, "Lockout", 0.6], [1.5, 0, 1, "Lower · 2s", 0.55]],
    load: o.trap ? "trapbar" : "barbell",
    stance: 0.13,
    grip: o.trap ? 0.27 : 0.25,
    pose(B, d) {
      const r = reach(B) * 0.97;
      const hipTop = ANKLE_H + legMax(B) * 0.995;
      const barTop = hipTop + B.torso * 0.99 - r;
      const barX = o.trap ? 0.0 : MIDFOOT;
      const barY = lerp(barTop, o.trap ? 0.27 : 0.235, d);
      const sh = V(barX + (o.trap ? 0.03 : 0.045) * d, barY + r);
      let hipY = lerp(hipTop, ANKLE_H + (B.shin + B.thigh) * (o.trap ? 0.55 : 0.6), Math.pow(d, 1.15));
      hipY = Math.max(hipY, sh[1] - B.torso * 0.995);
      const hipX = sh[0] - Math.sqrt(Math.max(0, B.torso * B.torso - (sh[1] - hipY) ** 2));
      const bar = V(barX, barY);
      return { hip: V(hipX, hipY), sh, bar, hand: bar, elbowPole: V(-1, 0, 0), kneePole: V(1, 0, 0.2), headBlend: 0.1 };
    },
  };
}

function rdl(o: { load: Load; hold?: Hold; single?: boolean }): Motion {
  return {
    phases: TEMPO.lowerFirst("Hips back · 2s", "Stand · 1s", "Tall", "Stretch"),
    load: o.load,
    hold: o.hold,
    stance: o.single ? 0.08 : 0.12,
    grip: o.load === "barbell" ? 0.24 : 0.2,
    pose(B, d) {
      const lean = lerp(6, o.single ? 80 : 72, d);
      const bend = lerp(1, 0.96, d);
      const shX = MIDFOOT + 0.03;
      const hipX = shX - Math.sin(rad(lean)) * B.torso;
      const hipY = standY(B, hipX, bend);
      const hip = V(hipX, hipY);
      const sh = torsoAt(B, hip, lean);
      const handY = sh[1] - reach(B) * 0.97;
      const bar = V(sh[0] + 0.01, handY);
      const pose: Pose = { hip, sh, hand: o.load === "barbell" ? bar : V(bar[0], bar[1], 0.19), bar: o.load === "barbell" ? bar : undefined, elbowPole: V(-1, 0, 0), kneePole: V(1, 0, 0.2), headBlend: 0.1 };
      if (o.single) {
        const u = norm(sub(sh, hip));
        pose.ankle = per(V(0, ANKLE_H, -0.09), add(V(hip[0], hip[1], 0.1), mul(u, -legMax(B) * 0.98)));
        pose.foot = { L: 0, R: lean };
        pose.kneePole = per(V(1, 0, -0.2), V(0, -1, 0.2));
      }
      return pose;
    },
  };
}

function kbSwing(): Motion {
  return {
    phases: [[0.75, 1, 0, "Snap the hips", 1], [0.75, 0, 1, "Hike back", 0.55]],
    load: "kettlebell",
    hold: "centre",
    stance: 0.2,
    grip: 0.03,
    pose(B, d) {
      const lean = lerp(2, 60, d);
      const shX = 0.04 + 0.06 * d;
      const hipX = shX - Math.sin(rad(lean)) * B.torso;
      const hipY = standY(B, hipX, lerp(1, 0.9, d));
      const hip = V(hipX, hipY);
      const sh = torsoAt(B, hip, lean);
      const arm = lerp(95, -25, d) + lean * 0.6 * d;
      return { hip, sh, hand: add(swing(sh, reach(B) * 0.97, arm), V(0, 0, 0.03)), elbowPole: V(0, 1, 0.2), headBlend: 0.3 };
    },
  };
}

function pullThrough(): Motion {
  return {
    phases: TEMPO.lowerFirst("Hinge back · 2s", "Snap forward · 1s", "Tall", "Stretch"),
    load: "handle",
    stance: 0.22,
    grip: 0.03,
    pose(B, d) {
      const lean = lerp(5, 65, d);
      const shX = 0.05 + 0.08 * d;
      const hipX = shX - Math.sin(rad(lean)) * B.torso;
      const hip = V(hipX, standY(B, hipX, lerp(1, 0.93, d)));
      const sh = torsoAt(B, hip, lean);
      const h = swing(sh, reach(B) * 0.95, lerp(8, -28, d));
      const hand = V(h[0], h[1], 0.03);
      return { hip, sh, hand, elbowPole: V(0, 1, 0.2), headBlend: 0.2 };
    },
    props: () => [cable(V(-1.1, 0.15), "hands")],
  };
}

function backExtension(): Motion {
  return {
    phases: TEMPO.liftFirst("Rise · 1s", "Lower · 2s", "Hang", "Straight line"),
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const hip = V(0, 0.95);
      const legDir = V(-Math.sin(rad(45)), -Math.cos(rad(45)));
      const ankle = add(hip, mul(legDir, legMax(B) * 0.98));
      const lean = lerp(150, 45, d);
      const sh = torsoAt(B, hip, lean);
      const hand = onTorso(hip, sh, lean, 0.85, 0.16);
      return { hip, sh, ankle: V(ankle[0], ankle[1], 0.1), foot: 45, hand: V(hand[0], hand[1], 0.1), elbowPole: V(-1, 0, 1), kneePole: V(0, -1, 0.1), headBlend: 0 };
    },
    props: (B) => [pad(V(0.08, 0.86), 0.35, 135, 0.4), pad(add(V(0, 0.95), mul(V(-0.707, -0.707), legMax(B) * 0.98 - 0.02)), 0.12, 45, 0.4), rail(V(-0.15, 0.45, 0), 0.9, "y")],
  };
}

/** Lying on the back, shoulders at `shAt`, hips rising. */
function bridge(o: { bench?: boolean; bar?: boolean; single?: boolean }): Motion {
  return {
    phases: TEMPO.liftFirst("Drive · 1s", "Lower · 2s", "Set", "Squeeze"),
    load: o.bar ? "barbell" : "none",
    stance: 0.15,
    grip: 0.36,
    pose(B, d) {
      const shAt = o.bench ? V(-0.15, 0.5) : V(-0.3, 0.13);
      const a = o.bench ? lerp(-32, 4, d) : lerp(4, 30, d);
      const hip = add(shAt, V(Math.cos(rad(a)) * B.torso, Math.sin(rad(a)) * B.torso));
      const ankleX = shAt[0] + B.torso + B.thigh * 0.95;
      const bar = add(hip, V(0, 0.12));
      const pose: Pose = { hip, sh: shAt, ankle: V(ankleX, ANKLE_H, 0.16), kneePole: V(0.2, 1, 0.3), hand: o.bar ? bar : V(shAt[0] + 0.25, o.bench ? shAt[1] - 0.02 : 0.04, B.shW + 0.08), elbowPole: V(0, 1, 0.5), headBlend: 0, bar: o.bar ? bar : undefined };
      if (o.single) {
        pose.ankle = per(V(ankleX, ANKLE_H, -0.14), add(hip, V(0.3, 0.38, 0.1)));
        pose.kneePole = per(V(0.2, 1, -0.3), V(1, 0.5, 0.2));
      }
      return pose;
    },
    props: o.bench ? () => [bench(-0.55, -0.15, 0.45, 1.0)] : undefined,
  };
}

// ---------- presses ----------
function overhead(o: { load: Load; seated?: boolean; machine?: boolean }): Motion {
  return {
    phases: [[0.5, 1, 1, "Rack", 0.35], [1.1, 1, 0, "Press · 1s", 1], [0.5, 0, 0, "Lockout", 0.6], [1.5, 0, 1, "Lower · 2s", 0.55]],
    load: o.load,
    stance: 0.13,
    grip: 0.27,
    pose(B, d) {
      const s = 1 - d;
      let hip: Vec, sh: Vec, ankle: Vec | undefined, kneePole: Vec | undefined;
      if (o.seated) ({ hip, sh, ankle, kneePole } = seated(B, 0.45, -6));
      else {
        hip = V(0.03, standY(B));
        sh = torsoAt(B, hip, -3);
      }
      const r = reach(B) * 0.985;
      if (o.load === "barbell") {
        const hand = V(sh[0] + 0.035 + 0.12 * (1 - Math.pow(s, 4)), sh[1] - 0.01 + r * s);
        const headBack = -0.045 * Math.sin(Math.PI * clamp(s * 1.3, 0, 1));
        return { hip, sh, ankle, kneePole, bar: hand, hand, elbowPole: V(0.6, -1, 0), headBlend: 1, headBack };
      }
      // dumbbells and handles: from ear height out wide to overhead
      const z = lerp(B.shW + 0.12, B.shW - 0.03, s);
      const y = lerp(sh[1] + 0.06, sh[1] + Math.sqrt(Math.max(0.01, r * r - (z - B.shW) ** 2)) * 0.98, s);
      return { hip, sh, ankle, kneePole, hand: V(sh[0] + 0.04, y, z), elbowPole: V(0, -1, 1), headBlend: 1 };
    },
    props: o.seated ? seatProps(-6) : undefined,
  };
}

/** Lying on a bench (flat or incline), pressing up. */
function benchPress(o: { load: Load; incline?: number; grip?: number; close?: boolean }): Motion {
  const inc = o.incline ?? 0;
  return {
    phases: TEMPO.lowerFirst("Lower · 2s", "Press · 1s", "Unrack", "Touch"),
    load: o.load,
    stance: 0.3,
    grip: o.grip ?? 0.26,
    pose(B, d) {
      const hip = V(0.28, 0.53);
      const lean = -90 + inc;
      const sh = torsoAt(B, hip, lean);
      const r = reach(B) * 0.97;
      const top = V(sh[0] + 0.03, sh[1] + r);
      const chest = onTorso(hip, sh, lean, o.close ? 0.72 : 0.78, inc ? 0.13 : 0.16);
      const p = lerpV(top, chest, d);
      const pose: Pose = { hip, sh, hand: p, ankle: V(0.72, ANKLE_H, 0.3), kneePole: V(0.3, 1, 0.3), headBlend: 0, elbowPole: V(0, -1, o.close ? 0.15 : 0.6) };
      if (o.load === "barbell") return { ...pose, bar: p, hand: p };
      const z = lerp(0.15, 0.27, d);
      return { ...pose, hand: V(p[0], p[1], z) };
    },
    props: (B) => inc ? [bench(0.05, 0.45, 0.45, 0.32), torsoPad(B, V(0.28, 0.53), -90 + inc)] : [bench(-0.55, 0.5, 0.45, 0.3)],
  };
}

function machinePress(): Motion {
  return {
    phases: TEMPO.liftFirst("Press · 1s", "Return · 2s", "Set", "Lockout"),
    load: "handle",
    grip: 0.24,
    pose(B, d) {
      const { hip, sh, ankle, kneePole } = seated(B, 0.45, -10);
      const y = sh[1] - 0.08;
      const hand = V(lerp(sh[0] + 0.12, sh[0] + reach(B) * 0.92, d), y, 0.24);
      return { hip, sh, ankle, kneePole, hand, elbowPole: V(-0.3, -1, 0.7), headBlend: 0.8 };
    },
    props: seatProps(-10),
  };
}

/** Arms sweeping through an arc: `plane` "front" sweeps in front of the chest, "down" opens the arms out to the sides. */
function fly(o: { posture: "supine" | "seated" | "standing" | "bent" | "facePad"; from: number; to: number; load: Load; first: "lower" | "lift"; cable?: "high" | "low" | "side"; oneArm?: boolean }): Motion {
  return {
    phases: o.first === "lower" ? TEMPO.lowerFirst("Open · 2s", "Squeeze · 1s", "Top", "Stretch") : TEMPO.liftFirst(),
    load: o.load,
    hold: o.oneArm ? "R" : undefined,
    stance: o.posture === "standing" ? 0.14 : 0.25,
    pose(B, d) {
      let hip: Vec, sh: Vec, ankle: Vec | undefined, kneePole: Vec | undefined, lean = 0;
      if (o.posture === "supine") {
        hip = V(0.28, 0.53); lean = -90; sh = torsoAt(B, hip, lean); ankle = V(0.72, ANKLE_H, 0.3); kneePole = V(0.3, 1, 0.3);
      } else if (o.posture === "seated" || o.posture === "facePad") {
        ({ hip, sh, ankle, kneePole } = seated(B, 0.45, o.posture === "facePad" ? 10 : -8));
        lean = o.posture === "facePad" ? 10 : -8;
      } else if (o.posture === "bent") {
        lean = 72;
        const shX = MIDFOOT + 0.05;
        const hipX = shX - Math.sin(rad(lean)) * B.torso;
        hip = V(hipX, standY(B, hipX, 0.95)); sh = torsoAt(B, hip, lean);
      } else {
        lean = o.cable === "high" ? 12 : 4;
        hip = V(0.02, standY(B)); sh = torsoAt(B, hip, lean);
      }
      const phi = rad(lerp(o.from, o.to, d));
      const r = reach(B) * 0.92;
      const hands = (sgn: number): Vec => {
        const s = side(B, sgn, sh);
        if (o.posture === "supine") return add(s, V(0.03, r * Math.cos(phi), sgn * r * Math.sin(phi)));
        if (o.posture === "bent" || o.cable === "low" || o.cable === "side" || (o.posture === "standing" && o.load !== "handle")) return add(s, V(0.04, -r * Math.cos(phi), sgn * r * Math.sin(phi)));
        // horizontal arc in front of the chest (pec deck, reverse pec deck, cable fly, pull-aparts)
        const drop = o.cable === "high" ? -0.1 * (1 - Math.sin(phi)) : -0.03;
        return add(s, V(r * Math.cos(phi), drop, sgn * r * Math.sin(phi) - sgn * B.shW * Math.cos(phi) * 0.8));
      };
      let L = hands(-1);
      const R = hands(1);
      if (o.oneArm) L = V(hip[0] + 0.04, hip[1] + 0.06, -(B.hipW + 0.13));
      return { hip, sh, ankle, kneePole, hand: per(L, R), elbowPole: o.posture === "supine" ? V(0, -1, 0.4) : V(-0.6, -1, 0.5), headBlend: o.posture === "bent" ? 0.3 : 0.8 };
    },
    props: (B) => {
      const p: Prop[] = [];
      if (o.posture === "supine") p.push(bench(-0.55, 0.5, 0.45, 0.3));
      if (o.posture === "seated" || o.posture === "facePad") p.push(...seatProps(o.posture === "facePad" ? 10 : -8, o.posture !== "facePad")(B));
      if (o.posture === "facePad") p.push(pad(V(0.3, 1.1), 0.6, 90 - 10, 0.3));
      if (o.cable === "high") p.push(cable(V(-0.15, 1.5, -1.0), "handL"), cable(V(-0.15, 1.5, 1.0), "handR"));
      if (o.cable === "side") p.push(cable(V(0.05, 0.12, -0.35), "handR"));
      if (o.cable === "low") p.push(cable("ankleL", "handL"), cable("ankleR", "handR"));
      return p;
    },
  };
}

// ---------- push-ups and dips ----------
function pushUp(o: { hands?: number; feet?: number; width?: number; rings?: boolean; close?: boolean }): Motion {
  return {
    phases: TEMPO.lowerFirst("Lower · 2s", "Push · 1s", "Plank", "Bottom"),
    load: "none",
    stance: 0.1,
    grip: o.width ?? 0.22,
    pose(B, d) {
      const handY = (o.hands ?? 0) + (o.rings ? 0.1 : 0.03);
      const ankleY = (o.feet ?? 0) + 0.11;
      const Lb = legMax(B) * 0.99 + B.torso;
      const r = reach(B) * 0.97;
      const shTop = handY + r;
      const shBot = handY + (o.close ? 0.2 : 0.17);
      const shY = lerp(shTop, shBot, d);
      const thTop = Math.asin(clamp((shTop - ankleY) / Lb, -1, 1));
      const handX = 0.45;
      const ankleX = handX - Lb * Math.cos(thTop);
      const th = Math.asin(clamp((shY - ankleY) / Lb, -1, 1));
      const dir = V(Math.cos(th), Math.sin(th));
      const ankle = V(ankleX, ankleY);
      const hip = add(ankle, mul(dir, legMax(B) * 0.99));
      const sh = add(hip, mul(dir, B.torso));
      const lean = 90 - (th * 180) / Math.PI;
      return { hip, sh, ankle: V(ankle[0], ankle[1], 0.1), foot: 90 - (th * 180) / Math.PI - 35, kneePole: V(0, -1, 0.1), hand: V(handX + 0.02, handY, o.width ?? 0.22), elbowPole: o.close ? V(-1, 0.3, 0.1) : V(-0.7, 0.6, 0.7), headBlend: lean > 60 ? 0 : 0.2 };
    },
    props: () => {
      const p: Prop[] = [];
      if (o.hands) p.push(boxP(0.47, o.hands, 0.7, 0.35));
      if (o.feet) p.push(boxP(-1.05, o.feet, 0.5, 0.4));
      if (o.rings) p.push(cable(V(0.47, 2.2, -0.24), "handL"), cable(V(0.47, 2.2, 0.24), "handR"));
      return p;
    },
  };
}

function pikePushUp(): Motion {
  return {
    phases: TEMPO.lowerFirst("Head down · 2s", "Press · 1s", "Pike", "Bottom"),
    load: "none",
    stance: 0.12,
    grip: 0.24,
    pose(B, d) {
      const ankle = V(-0.55, 0.1);
      const hip = add(ankle, mul(V(Math.cos(rad(58)), Math.sin(rad(58))), legMax(B) * 0.98));
      const hand = V(0.32, 0.03);
      const r = lerp(reach(B) * 0.96, reach(B) * 0.55, d);
      const sh = circles(hip, B.torso, hand, r, 1);
      return { hip, sh, ankle: V(ankle[0], ankle[1], 0.12), foot: 30, kneePole: V(0, -1, 0.1), hand: V(hand[0], hand[1], 0.24), elbowPole: V(-0.8, 0.4, 0.5), headBlend: 0 };
    },
  };
}

/** The intersection of circles (c1, r1) and (c2, r2) in the x-y plane; `pick` 1 takes the one further forward. */
function circles(c1: Vec, r1: number, c2: Vec, r2: number, pick: 1 | -1): Vec {
  const dx = c2[0] - c1[0], dy = c2[1] - c1[1];
  const D = Math.max(1e-6, Math.hypot(dx, dy));
  const dd = clamp(D, Math.abs(r1 - r2) + 1e-4, r1 + r2 - 1e-4);
  const a = (r1 * r1 - r2 * r2 + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const mx = c1[0] + (a * dx) / D, my = c1[1] + (a * dy) / D;
  const p1 = V(mx + (h * dy) / D, my - (h * dx) / D), p2 = V(mx - (h * dy) / D, my + (h * dx) / D);
  return (p1[0] > p2[0]) === (pick === 1) ? p1 : p2;
}

function dip(o: { bench?: boolean }): Motion {
  return {
    phases: TEMPO.lowerFirst("Lower · 2s", "Press · 1s", "Top", "Bottom"),
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const r = reach(B) * 0.97;
      if (o.bench) {
        const hand = V(-0.2, 0.47, 0.2);
        const sh = V(-0.17, lerp(0.47 + r, 0.47 + r - 0.24, d));
        const hip = torsoAt(B, sh, 180 + 4);
        return { hip, sh, ankle: V(0.5, ANKLE_H, 0.12), kneePole: V(0.3, 1, 0.2), hand, elbowPole: V(-1, 0.1, 0.1), headBlend: 0.8 };
      }
      const barY = 1.3;
      const lean = lerp(8, 24, d);
      const sh = V(0.02 + 0.06 * d, lerp(barY + r, barY + r - 0.3, d));
      const hip = sub(sh, V(Math.sin(rad(lean)) * B.torso, Math.cos(rad(lean)) * B.torso));
      const ankle = add(hip, V(-0.3, -legMax(B) * 0.8));
      return { hip, sh, ankle: V(ankle[0], ankle[1], 0.06), foot: 40, kneePole: V(1, 0, 0.1), hand: V(0.02, barY, 0.26), elbowPole: V(-1, 0, 0.1), headBlend: 0.6 };
    },
    props: o.bench ? () => [bench(-0.55, -0.15, 0.45, 0.6)] : () => [rail(V(0.05, 1.28, -0.26), 0.8, "x"), rail(V(0.05, 1.28, 0.26), 0.8, "x"), rail(V(0.4, 0.64, -0.26), 1.28, "y"), rail(V(0.4, 0.64, 0.26), 1.28, "y")],
  };
}

// ---------- rows and pulls ----------
function bentRow(o: { load: Load; lean?: number; oneArm?: boolean; hold?: Hold; grip?: number }): Motion {
  const lean = o.lean ?? 48;
  return {
    phases: TEMPO.liftFirst("Row · 1s", "Lower · 2s", "Hang", "Squeeze"),
    load: o.load,
    hold: o.oneArm ? "R" : o.hold,
    stance: 0.15,
    grip: o.grip ?? 0.26,
    pose(B, d) {
      const shX = MIDFOOT + 0.06;
      const hipX = shX - Math.sin(rad(lean)) * B.torso;
      const hip = V(hipX, standY(B, hipX, 0.93));
      const sh = torsoAt(B, hip, lean);
      const low = V(sh[0] + 0.02, sh[1] - reach(B) * 0.96);
      const high = onTorso(hip, sh, lean, 0.42, 0.1);
      const p = lerpV(low, high, d);
      const z = o.grip ?? (o.load === "barbell" ? 0.26 : 0.2);
      const bar = V(p[0], p[1]);
      const pose: Pose = { hip, sh, hand: V(p[0], p[1], z), elbowPole: V(-1, 0.6, 0.5), headBlend: 0.15, kneePole: V(1, 0, 0.3), bar: o.load === "barbell" ? bar : undefined };
      if (o.oneArm) pose.hand = per(add(V(hip[0], hip[1], 0), V(0.4, -0.12, -0.17)), V(p[0], p[1], z));
      return pose;
    },
  };
}

function oneArmBenchRow(): Motion {
  return {
    phases: TEMPO.liftFirst("Row to the hip · 1s", "Lower · 2s", "Stretch", "Squeeze"),
    load: "dumbbell",
    hold: "R",
    pose(B, d) {
      const hip = V(-0.12, 0.88);
      const lean = 78;
      const sh = torsoAt(B, hip, lean);
      const low = V(sh[0] + 0.02, sh[1] - reach(B) * 0.95, B.shW + 0.04);
      const high = add(onTorso(hip, sh, lean, 0.3, -0.02), V(0, 0, B.shW + 0.1));
      return {
        hip, sh,
        ankle: per(V(-0.48, 0.53, -0.12), V(-0.3, ANKLE_H, 0.28)),
        foot: { L: 80, R: 0 },
        kneePole: per(V(0.1, -1, -0.2), V(1, 0, 0.3)),
        hand: per(V(sh[0] + 0.06, 0.47, -0.17), lerpV(low, high, d)),
        elbowPole: per(V(-0.4, 0, -1), V(-1, 0.8, 0.3)),
        headBlend: 0.15,
      };
    },
    props: () => [bench(-0.7, 0.55, 0.45, 0.3)],
  };
}

function chestSupportedRow(): Motion {
  return {
    phases: TEMPO.liftFirst("Row · 1s", "Lower · 2s", "Hang", "Squeeze"),
    load: "dumbbell",
    stance: 0.16,
    pose(B, d) {
      const hip = V(0, 0.68);
      const lean = 60;
      const sh = torsoAt(B, hip, lean);
      const low = V(sh[0] + 0.03, sh[1] - reach(B) * 0.95);
      const high = onTorso(hip, sh, lean, 0.5, 0.1);
      const p = lerpV(low, high, d);
      return { hip, sh, ankle: V(-0.45, ANKLE_H, 0.16), foot: 20, kneePole: V(1, 0, 0.2), hand: V(p[0], p[1], 0.2), elbowPole: V(-1, 0.6, 0.5), headBlend: 0.4 };
    },
    props: (B) => [torsoPad(B, V(0, 0.68), 60, "front"), bench(-0.25, 0.2, 0.6, 0.3)],
  };
}

function seatedRow(): Motion {
  return {
    phases: TEMPO.liftFirst("Row · 1s", "Reach · 2s", "Reach", "Squeeze"),
    load: "handle",
    grip: 0.06,
    stance: 0.14,
    pose(B, d) {
      const hip = V(0, 0.42);
      const lean = lerp(22, -6, d);
      const sh = torsoAt(B, hip, lean);
      const far = V(sh[0] + reach(B) * 0.95, sh[1] - 0.14);
      const near = onTorso(hip, sh, lean, 0.48, 0.14);
      return { hip, sh, ankle: V(0.62, 0.24, 0.14), foot: -25, kneePole: V(0, 1, 0.3), hand: lerpV(far, V(near[0], near[1], 0), d), elbowPole: V(-1, -0.2, 0.4), headBlend: 0.8 };
    },
    props: () => [bench(-0.35, 0.25, 0.35, 0.3), pad(V(0.72, 0.25), 0.4, 70, 0.5), cable(V(1.05, 0.4), "hands")],
  };
}

function pulldown(o: { straightArm?: boolean } = {}): Motion {
  return {
    phases: TEMPO.liftFirst("Pull · 1s", "Return · 2s", "Stretch", "Squeeze"),
    load: "handle",
    grip: o.straightArm ? 0.18 : 0.32,
    stance: 0.14,
    pose(B, d) {
      if (o.straightArm) {
        const lean = 22;
        const hipX = 0.02 - Math.sin(rad(lean)) * B.torso * 0.3;
        const hip = V(hipX, standY(B, hipX, 0.97));
        const sh = torsoAt(B, hip, lean);
        const a = lerp(150, 15, d);
        const h = swing(sh, reach(B) * 0.95, a);
        return { hip, sh, hand: V(h[0], h[1], 0.18), elbowPole: V(0, -1, 0.5), headBlend: 0.4 };
      }
      const { hip, sh, ankle, kneePole } = seated(B, 0.48, -12);
      const r = reach(B) * 0.96;
      const top = V(sh[0] + 0.06, sh[1] + Math.sqrt(r * r - (0.32 - B.shW) ** 2) * 0.98);
      const bottom = V(sh[0] + 0.14, sh[1] + 0.04);
      const p = lerpV(top, bottom, d);
      return { hip, sh, ankle, kneePole, hand: V(p[0], p[1], 0.32), elbowPole: V(-0.3, -1, 1), headBlend: 0.6 };
    },
    props: o.straightArm ? () => [cable(V(1.0, 2.3), "hands")] : (B) => [...seatProps(-12, false)(B), pad(V(0.28, 0.72), 0.12, 0, 0.5), cable(V(0.1, 2.5), "hands")],
  };
}

function hanging(o: { grip: number; chin?: boolean; band?: boolean; knees?: boolean }): Motion {
  return {
    phases: o.knees ? TEMPO.liftFirst("Knees up · 1s", "Lower · 2s", "Hang", "Curl") : TEMPO.liftFirst("Pull · 1s", "Lower · 2s", "Hang", "Chin over"),
    load: "none",
    grip: o.grip,
    pose(B, d) {
      const barY = 2.05 * (B.s > 0.95 ? 1 : 0.97);
      const r = reach(B) * 0.97;
      const dz = o.grip - B.shW;
      const hangY = barY - Math.sqrt(Math.max(0.01, r * r - dz * dz));
      const pull = o.knees ? 0 : d;
      const sh = V(-0.01 - 0.03 * pull, lerp(hangY, barY - 0.13, pull));
      const hip = torsoAt(B, sh, 180 + 6);
      const pose: Pose = {
        hip: V(hip[0], hip[1]), sh,
        ankle: V(hip[0] - 0.1, hip[1] - legMax(B) * 0.9, 0.07),
        foot: 35,
        kneePole: V(1, 0, 0.1),
        hand: V(0.04, barY, o.grip),
        elbowPole: o.chin ? V(0.6, -1, 0.3) : V(-0.2, -1, 1),
        headBlend: 0.8,
      };
      if (o.knees) pose.ankle = add(hip, V(lerp(-0.06, 0.25, d), lerp(-legMax(B) * 0.92, -0.28, d), 0.08));
      return pose;
    },
    props: (B) => {
      const barY = 2.05 * (B.s > 0.95 ? 1 : 0.97);
      const p: Prop[] = [rail(V(0.04, barY, 0), 1.3, "z")];
      if (o.band) p.push(cable(V(0.04, barY, -0.05), "kneeR"));
      return p;
    },
  };
}

/** Body straight from the heels, pulling up to a fixed handle (inverted row, ring row, door row). */
function leanRow(o: { angle: number; handY: number; rings?: boolean; door?: boolean }): Motion {
  return {
    phases: TEMPO.liftFirst("Pull · 1s", "Lower · 2s", "Hang", "Squeeze"),
    load: "none",
    grip: o.door ? 0.05 : 0.24,
    stance: 0.12,
    pose(B, d) {
      const ankle = V(0.55, ANKLE_H);
      const body = (th: number) => {
        const dir = V(-Math.cos(rad(th)), Math.sin(rad(th)));
        const hip = add(ankle, mul(dir, legMax(B) * 0.99));
        return { hip, sh: add(hip, mul(dir, B.torso)) };
      };
      // the handle sits just in front of the chest at the top
      const top = body(o.angle);
      const handle = V(top.sh[0] + 0.12, o.handY);
      // lowest angle where straight arms reach the handle
      let th0 = o.angle;
      for (let a = o.angle; a > 5; a -= 0.5) {
        th0 = a;
        const { sh } = body(a);
        if (Math.hypot(sh[0] - handle[0], sh[1] - handle[1]) >= reach(B) * 0.96) break;
      }
      const th = lerp(th0, o.angle, d);
      const { hip, sh } = body(th);
      return { hip, sh, ankle: V(ankle[0], ankle[1], 0.12), foot: -(90 - th) * 0.8, kneePole: V(0, 1, 0.1), hand: V(handle[0], handle[1], o.door ? 0.05 : 0.24), elbowPole: V(0, -1, 0.6), headBlend: 0 };
    },
    props: (B) => {
      const handleX = (() => {
        const dir = V(-Math.cos(rad(o.angle)), Math.sin(rad(o.angle)));
        return 0.55 + dir[0] * (legMax(B) * 0.99 + B.torso) + 0.12;
      })();
      if (o.rings) return [cable(V(handleX, 2.3, -0.24), "handL"), cable(V(handleX, 2.3, 0.24), "handR")];
      if (o.door) return [{ kind: "box", at: V(handleX - 0.08, 1.0), size: V(0.05, 2.0, 0.9) }];
      return [rail(V(handleX, o.handY, 0), 1.3, "z"), rail(V(handleX, o.handY / 2, -0.6), o.handY, "y"), rail(V(handleX, o.handY / 2, 0.6), o.handY, "y")];
    },
  };
}

function facePull(): Motion {
  return {
    phases: TEMPO.liftFirst("Pull to the eyes · 1s", "Return · 2s", "Reach", "Split the rope"),
    load: "none",
    stance: 0.14,
    pose(B, d) {
      const hip = V(0, standY(B));
      const sh = torsoAt(B, hip, -6);
      const far = V(sh[0] + reach(B) * 0.92, sh[1] + 0.12, 0.05);
      const near = V(sh[0] + 0.1, sh[1] + 0.17, B.shW + 0.06);
      return { hip, sh, hand: lerpV(far, near, d), elbowPole: V(-0.4, 0.6, 1), headBlend: 1 };
    },
    props: () => [cable(V(1.25, 1.62), "hands")],
  };
}

function shrug(): Motion {
  return {
    phases: TEMPO.liftFirst("Shrug · 1s", "Lower · 2s", "Hang", "Hold"),
    load: "dumbbell",
    stance: 0.13,
    pose(B, d) {
      const hip = V(0.03, standY(B));
      const sh = torsoAt(B, hip, 0);
      const up = 0.065 * d;
      const h = hang(B, sh, 0.04);
      return { hip, sh, shrug: up, hand: V(h[0], h[1] + up, h[2]), elbowPole: V(-1, 0, 0.3), headBlend: 1 };
    },
  };
}

function carry(o: { hold: Hold; load: Load }): Motion {
  return {
    phases: TEMPO.walk(),
    load: o.load,
    hold: o.hold,
    pose(B, d) {
      const ph = d * Math.PI * 2;
      const stride = 0.17;
      const foot = (s: number): Vec => {
        const p = ph + (s > 0 ? Math.PI : 0);
        return V(stride * Math.sin(p), ANKLE_H + Math.max(0, 0.07 * Math.cos(p)), s * 0.12);
      };
      const hipY = standY(B, 0.05, 0.97) - 0.015 * Math.abs(Math.cos(ph));
      const hip = V(0.05, hipY);
      const sh = torsoAt(B, hip, 0);
      const h = hang(B, sh, 0.06);
      const free = hang(B, sh, 0.03);
      const hand = o.hold === "R" ? per(V(free[0] + 0.04 * Math.sin(ph), free[1], -free[2]), h) : h;
      const L = foot(-1), R = foot(1);
      return { hip, sh, ankle: per(L, R), foot: { L: L[1] > ANKLE_H + 0.01 ? 12 : 0, R: R[1] > ANKLE_H + 0.01 ? 12 : 0 }, hand, elbowPole: V(-1, 0, 0.3), headBlend: 1 };
    },
  };
}

// ---------- arms ----------
type ArmPosture = "stand" | "incline" | "seatedThighs";
function curl(o: { load: Load; grip?: number; posture?: ArmPosture; hold?: Hold; cable?: "low" | "band" }): Motion {
  const posture = o.posture ?? "stand";
  return {
    plates: 0.55,
    phases: TEMPO.liftFirst("Curl · 1s", "Lower · 2s", "Hang", "Squeeze"),
    load: o.load,
    hold: o.hold,
    stance: 0.13,
    grip: o.grip ?? 0.21,
    pose(B, d) {
      if (posture === "seatedThighs") {
        const { hip, sh: sh0, ankle, kneePole } = seated(B, 0.45, 25);
        const knee = V(B.thigh * 0.92, 0.55);
        const hand = V(knee[0] + 0.1, knee[1] + 0.03 + 0.07 * d, 0.13);
        return { hip, sh: sh0, ankle, kneePole, hand, elbowPole: V(-1, 0.3, 0.2), headBlend: 0.3 };
      }
      let hip: Vec, sh: Vec, ankle: Vec | undefined, kneePole: Vec | undefined;
      if (posture === "incline") ({ hip, sh, ankle, kneePole } = seated(B, 0.45, -42));
      else { hip = V(0.03, standY(B)); sh = torsoAt(B, hip, 0); }
      const z = o.grip ?? 0.21;
      const elbow = V(sh[0] - (posture === "incline" ? 0.0 : 0.02), sh[1] - B.upper * 0.98);
      const a = lerp(8, 135, d);
      const h = swing(elbow, B.fore * 0.98, a);
      return { hip, sh, ankle, kneePole, hand: V(h[0], h[1], z), bar: o.load === "barbell" ? V(h[0], h[1]) : undefined, elbowPole: V(-1, -0.2, 0.3), headBlend: 1 };
    },
    props: (B) => {
      const p: Prop[] = [];
      if (posture === "incline") p.push(...seatProps(-42)(B));
      if (posture === "seatedThighs") p.push(bench(-0.25, 0.3, 0.45, 0.34));
      if (o.cable === "low") p.push(cable(V(0.55, 0.12), "hands"));
      if (o.cable === "band") p.push(cable("ankleL", "handL"), cable("ankleR", "handR"));
      return p;
    },
  };
}

function pushdown(o: { band?: boolean }): Motion {
  return {
    phases: TEMPO.liftFirst("Push down · 1s", "Return · 2s", "Set", "Lockout"),
    load: o.band ? "none" : "handle",
    grip: 0.1,
    stance: 0.14,
    pose(B, d) {
      const lean = 12;
      const hip = V(0.0, standY(B));
      const sh = torsoAt(B, hip, lean);
      const elbow = V(sh[0] - 0.02, sh[1] - B.upper * 0.98);
      const h = swing(elbow, B.fore * 0.98, lerp(105, 4, d));
      return { hip, sh, hand: V(h[0], h[1], 0.1), elbowPole: V(-1, -0.1, 0.3), headBlend: 0.8 };
    },
    props: o.band ? () => [rail(V(0.3, 2.1, 0), 1.2, "z"), cable(V(0.3, 2.1, -0.05), "handL"), cable(V(0.3, 2.1, 0.05), "handR")] : () => [cable(V(0.32, 2.3), "hands")],
  };
}

function overheadExtension(o: { lying?: boolean }): Motion {
  return {
    phases: TEMPO.lowerFirst("Lower · 2s", "Extend · 1s", "Top", "Stretch"),
    load: o.lying ? "barbell" : "dumbbell",
    plates: 0.55,
    hold: o.lying ? undefined : "centre",
    stance: o.lying ? 0.3 : 0.13,
    grip: o.lying ? 0.13 : 0.05,
    pose(B, d) {
      if (o.lying) {
        const hip = V(0.28, 0.53);
        const sh = torsoAt(B, hip, -90);
        const elbow = add(sh, V(-Math.sin(rad(14)) * B.upper * 0.98, Math.cos(rad(14)) * B.upper * 0.98));
        const b = rad(lerp(8, 120, d));
        const h = add(elbow, V(-Math.sin(b) * B.fore * 0.98, Math.cos(b) * B.fore * 0.98));
        return { hip, sh, ankle: V(0.72, ANKLE_H, 0.3), kneePole: V(0.3, 1, 0.3), hand: V(h[0], h[1], 0.13), bar: V(h[0], h[1]), elbowPole: V(0, 1, 0.1), headBlend: 0 };
      }
      const hip = V(0.03, standY(B));
      const sh = torsoAt(B, hip, -2);
      const elbow = add(sh, V(0.03, B.upper * 0.98));
      const b = rad(lerp(5, 145, d));
      const h = add(elbow, V(-Math.sin(b) * B.fore * 0.98, Math.cos(b) * B.fore * 0.98));
      return { hip, sh, hand: V(h[0], h[1], 0.05), elbowPole: V(0.4, 1, 0.15), headBlend: 1 };
    },
    props: o.lying ? () => [bench(-0.55, 0.5, 0.45, 0.3)] : undefined,
  };
}

// ---------- legs ----------
function lunge(o: { rear?: "floor" | "bench" | "box"; step?: "back" | "walk"; hands: "dumbbells" | "hips"; lean?: number }): Motion {
  return {
    phases: TEMPO.lowerFirst("Lower · 2s", "Drive · 1s", "Tall", "Bottom"),
    load: o.hands === "dumbbells" ? "dumbbell" : "none",
    pose(B, d) {
      const rearH = o.rear === "bench" ? 0.45 : o.rear === "box" ? 0.42 : 0;
      const frontA = V(0.34, ANKLE_H, 0.11);
      let rearA = V(rearH ? -0.58 : -0.5, rearH + (rearH ? 0.05 : ANKLE_H + 0.02), -0.11);
      if (o.step === "back") rearA = lerpV(V(0.02, ANKLE_H, -0.11), rearA, clamp(d * 2.2, 0, 1));
      const hipX = rearH ? -0.04 : -0.06;
      const topY = Math.min(standY(B, frontA[0] - hipX, 0.99), standY(B, rearA[0] - hipX, 0.99) + rearH * 0.5);
      const botY = rearH ? 0.52 : 0.07 + B.thigh * 0.96;
      const hip = V(hipX, lerp(topY, botY, ease(d)));
      const lean = o.lean ?? 6;
      const sh = torsoAt(B, hip, lean);
      const hand = o.hands === "dumbbells" ? hangHands(B, sh) : V(hip[0] + 0.02, hip[1] + 0.06, B.hipW + 0.13);
      return { hip, sh, ankle: per(rearA, frontA), foot: { L: rearH ? 75 : lerp(0, 55, clamp(d * 2.2, 0, 1)), R: 0 }, kneePole: per(V(1, -0.3, -0.1), V(1, 0, 0.2)), hand, elbowPole: o.hands === "hips" ? V(-0.4, 0, 1) : V(-1, 0, 0.3), headBlend: 0.8 };
    },
    props: o.rear === "bench" ? () => [bench(-0.95, -0.5, 0.45, 0.3)] : o.rear === "box" ? () => [boxP(-0.62, 0.42, 0.4, 0.35)] : undefined,
  };
}
const hangHands = (B: Body, sh: Vec): Vec => hang(B, sh, 0.05);

function stepUp(): Motion {
  return {
    phases: TEMPO.liftFirst("Step up · 1s", "Lower · 2s", "Foot on box", "Stand tall"),
    load: "none",
    pose(B, d) {
      const top = 0.45;
      const R = V(0.36, top + ANKLE_H, 0.11);
      const Lfloor = V(-0.08, ANKLE_H, -0.11);
      const Lup = V(0.25, top + ANKLE_H + 0.22, -0.11);
      const L = lerpV(Lfloor, Lup, ease(clamp((d - 0.4) / 0.6, 0, 1)));
      const hipStart = V(0.08, standY(B, 0.16, 0.99));
      const hipEnd = V(0.33, top + standY(B, 0.03, 0.99));
      const hip = lerpV(hipStart, hipEnd, ease(clamp(d / 0.85, 0, 1)));
      hip[1] = Math.min(hip[1], L[1] + Math.sqrt(Math.max(0.01, (legMax(B) * 0.99) ** 2 - (hip[0] - L[0]) ** 2)));
      const sh = torsoAt(B, hip, lerp(14, 4, d));
      return { hip, sh, ankle: per(L, R), foot: { L: d < 0.4 ? lerp(0, 35, d / 0.4) : 15, R: 0 }, kneePole: per(V(1, 0.2, -0.2), V(1, 0, 0.2)), hand: V(hip[0] + 0.02, hip[1] + 0.06, B.hipW + 0.13), elbowPole: V(-0.4, 0, 1), headBlend: 0.8 };
    },
    props: () => [boxP(0.4, 0.45, 0.5, 0.42)],
  };
}

function cossack(): Motion {
  return {
    phases: TEMPO.alternate("Sit to the right", "Sit to the left"),
    load: "none",
    pose(B, d) {
      const shift = lerp(-0.32, 0.32, d);
      const depth = Math.abs(shift) / 0.32;
      const hipY = lerp(standY(B, 0.05, 0.8), 0.5, depth);
      const hip = V(-0.02 - 0.06 * depth, hipY, shift);
      const sh = add(torsoAt(B, V(hip[0], hip[1]), 18 * depth), V(0, 0, shift));
      const hands = V(sh[0] + 0.32, sh[1] - 0.25);
      const straightL = shift > 0;
      return {
        hip, sh,
        ankle: per(V(0, ANKLE_H, -0.5), V(0, ANKLE_H, 0.5)),
        foot: { L: straightL ? -30 * depth : 0, R: straightL ? 0 : -30 * depth },
        kneePole: per(V(1, 0, -0.5), V(1, 0, 0.5)),
        hand: per(V(hands[0], hands[1], shift - 0.05), V(hands[0], hands[1], shift + 0.05)),
        elbowPole: V(0, -1, 0.5),
        headBlend: 0.8,
      };
    },
  };
}

function kneeMachine(o: { extend: boolean }): Motion {
  return {
    phases: o.extend ? TEMPO.liftFirst("Extend · 1s", "Lower · 2s", "Bent", "Squeeze") : TEMPO.liftFirst("Curl · 1s", "Return · 2s", "Straight", "Squeeze"),
    load: "none",
    stance: 0.13,
    pose(B, d) {
      const hip = V(0, 0.55);
      const sh = torsoAt(B, hip, -12);
      const knee = V(B.thigh * 0.99, 0.55);
      const a = o.extend ? lerp(5, 82, d) : lerp(80, -12, d);
      const ankle = swing(knee, B.shin * 0.98, a);
      return { hip, sh, ankle: V(ankle[0], ankle[1], 0.13), foot: -a * 0.3, kneePole: V(0, 1, 0.1), hand: V(0.05, 0.52, B.hipW + 0.2), elbowPole: V(-1, 0, 0.5), headBlend: 0.8 };
    },
    props: (B) => [...seatProps(-12)(B), { kind: "box", at: V(B.thigh * 0.99, 0.25), size: V(0.08, 0.5, 0.4) }],
  };
}

function nordic(): Motion {
  return {
    phases: [[0.5, 0, 0, "Kneel tall", 0.35], [3, 0, 1, "Lower slowly · 3s", 1], [0.4, 1, 1, "Catch", 0.6], [1.2, 1, 0, "Push back up", 0.55]],
    load: "none",
    stance: 0.12,
    pose(B, d) {
      const knee = V(0, 0.07);
      const a = lerp(0, 68, d);
      const dir = V(Math.sin(rad(a)), Math.cos(rad(a)));
      const hip = add(knee, mul(dir, B.thigh * 0.995));
      const sh = add(hip, mul(dir, B.torso));
      const n = frontOf(a);
      const hand = add(lerpV(hip, sh, 0.8), mul(n, 0.15 + 0.2 * d));
      return { hip, sh, ankle: V(-B.shin * 0.98, 0.08, 0.12), foot: 70, kneePole: V(0, -1, 0.1), hand: V(hand[0], hand[1] - 0.05 * d, 0.2), elbowPole: V(-1, -0.4, 0.4), headBlend: 0.2 };
    },
    props: () => [rail(V(-0.48, 0.17, 0), 0.6, "z")],
  };
}

function calfRaise(o: { single?: boolean; machine?: boolean; step?: boolean; load: Load; hold?: Hold }): Motion {
  return {
    phases: TEMPO.liftFirst("Rise · 1s", "Lower · 2s", "Stretch", "Top"),
    load: o.load,
    hold: o.hold,
    stance: 0.11,
    pose(B, d) {
      const base = o.step ? 0.15 : 0;
      const rise = lerp(o.step ? -0.03 : 0, 0.095, d);
      const pitch = (Math.asin(clamp(rise / 0.2, -1, 1)) * 180) / Math.PI;
      const hip = V(0.03, standY(B) + base + rise);
      const sh = torsoAt(B, hip, 0);
      const a = V(0, ANKLE_H + base + rise, 0.11);
      const pose: Pose = { hip, sh, ankle: a, foot: pitch, hand: o.machine ? V(sh[0] + 0.05, sh[1] + 0.12, B.shW + 0.05) : V(sh[0] + 0.02, sh[1] - reach(B) * 0.97, B.shW + 0.05), elbowPole: o.machine ? V(0, -1, 1) : V(-1, 0, 0.3), headBlend: 1 };
      if (o.single) {
        pose.ankle = per(add(hip, V(-0.3, -legMax(B) * 0.7, -0.2)), V(0, a[1], 0.1));
        pose.foot = { L: 40, R: pitch };
        pose.kneePole = per(V(1, 0, -0.1), V(1, 0, 0.2));
        pose.hand = per(V(sh[0] + 0.25, sh[1] - 0.3, -0.35), V(sh[0] + 0.02, sh[1] - reach(B) * 0.97, B.shW + 0.05));
      }
      return pose;
    },
    props: () => {
      const p: Prop[] = [];
      if (o.step) p.push({ kind: "box", at: V(0.1, 0.075), size: V(0.25, 0.15, 0.6) });
      if (o.machine) p.push(pad(V(0, 1.55, 0), 0.25, 0, 0.6), rail(V(-0.15, 1.0, -0.4), 2.0, "y"), rail(V(-0.15, 1.0, 0.4), 2.0, "y"));
      return p;
    },
  };
}

// ---------- core ----------
function plank(): Motion {
  return {
    phases: TEMPO.hold(),
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const elbowY = 0.05;
      const shY = elbowY + B.upper * 0.97 + 0.01 * d;
      const ankle = V(-0.95, 0.11);
      const Lb = legMax(B) * 0.99 + B.torso;
      const th = Math.asin((shY - ankle[1]) / Lb);
      const dir = V(Math.cos(th), Math.sin(th));
      const hip = add(add(ankle, mul(dir, legMax(B) * 0.99)), V(0, 0.01 * d));
      const sh = add(ankle, mul(dir, Lb));
      return { hip, sh, ankle: V(ankle[0], ankle[1], 0.1), foot: 55, kneePole: V(0, -1, 0.1), hand: V(sh[0] + B.fore * 0.92, 0.04, 0.12), elbowPole: V(-0.3, -1, 0.1), headBlend: 0 };
    },
  };
}

/** Side plank, built standing up in the figure's frame and rolled onto the left forearm. */
function sidePlank(o: { lift?: boolean }): Motion {
  return {
    phases: o.lift ? TEMPO.liftFirst("Lift the hips · 1s", "Lower · 2s", "Low", "Hold") : TEMPO.hold(),
    load: "none",
    stance: 0.05,
    pose(B) {
      const hip = V(0, standY(B, 0));
      const sh = torsoAt(B, hip, 0);
      const elbowZ = -(B.shW + B.upper * 0.97);
      return {
        hip, sh,
        ankle: per(V(0, ANKLE_H, -0.06), V(0, ANKLE_H, o.lift ? 0.2 : 0.05)),
        hand: per(V(B.fore * 0.92, sh[1] + 0.02, elbowZ), V(hip[0] + 0.03, hip[1] + 0.08, B.hipW + 0.12)),
        elbowPole: per(V(0, -1, -0.2), V(-0.4, 0, 1)),
        headBlend: 0,
      };
    },
    roll: (d) => -90 + (o.lift ? lerp(6, 16, d) : 14 + 1.5 * d),
  };
}

function hangingRaise(): Motion {
  return hanging({ grip: 0.28, knees: true });
}

function cableCrunch(): Motion {
  return {
    phases: TEMPO.liftFirst("Crunch · 1s", "Return · 2s", "Tall", "Squeeze"),
    load: "none",
    stance: 0.12,
    pose(B, d) {
      const knee = V(0, 0.07);
      const hip = add(knee, V(0.03, B.thigh * 0.97));
      const lean = lerp(15, 78, d);
      const sh = torsoAt(B, hip, lean);
      const n = frontOf(lean);
      const hand = add(add(sh, mul(norm(sub(sh, hip)), 0.1)), mul(n, 0.12));
      return { hip, sh, ankle: V(-B.shin * 0.98, 0.08, 0.12), foot: 70, kneePole: V(0, -1, 0.1), hand: V(hand[0], hand[1], 0.07), elbowPole: V(0.3, -1, 0.6), headBlend: 0 };
    },
    props: () => [cable(V(0.45, 2.3), "hands")],
  };
}

function abWheel(): Motion {
  return {
    phases: TEMPO.lowerFirst("Roll out · 2s", "Pull back · 1s", "Kneel", "Long"),
    load: "wheel",
    grip: 0.08,
    stance: 0.12,
    pose(B, d) {
      const knee = V(0, 0.07);
      const a = lerp(30, 68, d);
      const hip = add(knee, V(Math.sin(rad(a)) * B.thigh * 0.99, Math.cos(rad(a)) * B.thigh * 0.99));
      const lean = lerp(72, 82, d);
      const sh = torsoAt(B, hip, lean);
      const r = reach(B) * 0.97;
      const dy = sh[1] - 0.1;
      const hand = V(sh[0] + Math.sqrt(Math.max(0.0001, r * r - dy * dy)), 0.1, 0.08);
      return { hip, sh, ankle: V(-B.shin * 0.98, 0.08, 0.12), foot: 70, kneePole: V(0, -1, 0.1), hand, elbowPole: V(-0.2, 1, 0.3), headBlend: 0 };
    },
  };
}

function deadBug(): Motion {
  return {
    phases: [[2, 0, 0.5, "Left arm, right leg", 0.9], [2, 0.5, 1, "Right arm, left leg", 0.9]],
    load: "none",
    pose(B, d) {
      const hip = V(0.25, 0.13);
      const sh = torsoAt(B, hip, -90);
      const s = Math.sin(d * Math.PI * 2);
      const a = Math.max(0, s), b = Math.max(0, -s);
      const armUp = (k: number, z: number): Vec => add(V(sh[0], sh[1], z), lerpV(V(0.02, reach(B) * 0.95), V(-reach(B) * 0.93, 0.05), k));
      const knee = V(hip[0], hip[1] + B.thigh * 0.97);
      const legIn = (z: number): Vec => V(knee[0] + B.shin * 0.97, knee[1], z);
      const legOut = (z: number): Vec => V(hip[0] + legMax(B) * 0.97, 0.18, z);
      return {
        hip, sh,
        ankle: per(lerpV(legIn(-0.12), legOut(-0.12), b), lerpV(legIn(0.12), legOut(0.12), a)),
        kneePole: V(0.2, 1, 0.1),
        hand: per(armUp(a, -B.shW - 0.03), armUp(b, B.shW + 0.03)),
        elbowPole: V(0, -1, 0.5),
        headBlend: 0,
      };
    },
  };
}

function pallof(): Motion {
  return {
    phases: TEMPO.liftFirst("Press out · 1s", "Return · 2s", "At the chest", "Hold"),
    load: "handle",
    grip: 0.04,
    stance: 0.17,
    pose(B, d) {
      const hip = V(0.02, standY(B, 0.03, 0.97));
      const sh = torsoAt(B, hip, 0);
      const near = V(sh[0] + 0.14, sh[1] - 0.16, 0.04);
      const far = V(sh[0] + reach(B) * 0.93, sh[1] - 0.16, 0.04);
      return { hip, sh, hand: lerpV(near, far, d), elbowPole: V(-0.3, -1, 0.6), headBlend: 1 };
    },
    props: () => [cable(V(0.4, 1.2, -1.2), "hands")],
  };
}

function russianTwist(): Motion {
  return {
    phases: TEMPO.alternate("Turn right", "Turn left"),
    load: "none",
    pose(B, d) {
      const hip = V(0, 0.13);
      const lean = -40;
      const sh = torsoAt(B, hip, lean);
      const z = lerp(-0.2, 0.2, d);
      const c = V(sh[0] + 0.28, sh[1] - 0.2);
      return { hip, sh, ankle: V(0.55, 0.15, 0.12), foot: -10, kneePole: V(0, 1, 0.1), hand: per(V(c[0], c[1], z - 0.04), V(c[0], c[1], z + 0.04)), elbowPole: V(0, -1, 0.5), headBlend: 0.3 };
    },
  };
}

function superman(): Motion {
  return {
    phases: TEMPO.liftFirst("Lift · 1s", "Lower · 2s", "Flat", "Hold"),
    load: "none",
    stance: 0.12,
    pose(B, d) {
      const hip = V(0, 0.13);
      const th = lerp(3, 14, d);
      const sh = add(hip, V(Math.cos(rad(th)) * B.torso, Math.sin(rad(th)) * B.torso));
      const hand = add(sh, V(reach(B) * 0.93 * Math.cos(rad(th * 1.3)), reach(B) * 0.93 * Math.sin(rad(th * 1.3)) - 0.04));
      const ankle = add(hip, V(-legMax(B) * 0.98 * Math.cos(rad(th * 0.8)), legMax(B) * 0.98 * Math.sin(rad(th * 0.8))));
      return { hip, sh, ankle: V(ankle[0], ankle[1], 0.12), foot: 80, kneePole: V(0, -1, 0.1), hand: V(hand[0], hand[1], 0.24), elbowPole: V(0, 1, 0.5), headBlend: 0 };
    },
  };
}

function stand(): Motion {
  return {
    phases: [[3, 0, 1, "", 0], [3, 1, 0, "", 0]],
    load: "none",
    stance: 0.14,
    pose(B, d) {
      const hip = V(0.02, standY(B) - 0.003 * d);
      const sh = torsoAt(B, hip, 0);
      const h = hang(B, sh, 0.1, 0.96);
      return { hip, sh, hand: V(h[0], h[1], h[2]), elbowPole: V(-1, 0, 0.4), headBlend: 1 };
    },
  };
}

// ---------- the library ----------
const MOTIONS: Record<string, () => Motion> = {
  // chest
  "bench-press": () => benchPress({ load: "barbell" }),
  "incline-bench-press": () => benchPress({ load: "barbell", incline: 30 }),
  "close-grip-bench": () => benchPress({ load: "barbell", grip: 0.16, close: true }),
  "db-bench-press": () => benchPress({ load: "dumbbell" }),
  "db-incline-press": () => benchPress({ load: "dumbbell", incline: 30 }),
  "db-fly": () => fly({ posture: "supine", from: 6, to: 78, load: "dumbbell", first: "lower" }),
  "machine-chest-press": machinePress,
  "pec-deck": () => fly({ posture: "seated", from: 82, to: 10, load: "handle", first: "lift" }),
  "cable-fly": () => fly({ posture: "standing", from: 78, to: 8, load: "handle", first: "lift", cable: "high" }),
  "push-up": () => pushUp({}),
  "incline-push-up": () => pushUp({ hands: 0.45 }),
  "decline-push-up": () => pushUp({ feet: 0.42 }),
  dip: () => dip({}),
  "ring-push-up": () => pushUp({ rings: true, width: 0.2 }),
  // shoulders
  "overhead-press": () => overhead({ load: "barbell" }),
  "db-shoulder-press": () => overhead({ load: "dumbbell", seated: true }),
  "machine-shoulder-press": () => overhead({ load: "handle", seated: true, machine: true }),
  "lateral-raise": () => fly({ posture: "standing", from: 8, to: 84, load: "dumbbell", first: "lift" }),
  "cable-lateral-raise": () => fly({ posture: "standing", from: 8, to: 84, load: "handle", first: "lift", cable: "side", oneArm: true }),
  "band-lateral-raise": () => fly({ posture: "standing", from: 8, to: 82, load: "none", first: "lift", cable: "low" }),
  "rear-delt-fly": () => fly({ posture: "bent", from: 5, to: 80, load: "dumbbell", first: "lift" }),
  "reverse-pec-deck": () => fly({ posture: "facePad", from: 12, to: 88, load: "handle", first: "lift" }),
  "face-pull": facePull,
  "band-pull-apart": () => ({ ...fly({ posture: "standing", from: 10, to: 86, load: "none", first: "lift" }), pose: bandApart, props: () => [cable("handL", "handR")] }),
  "pike-push-up": pikePushUp,
  // back
  deadlift: () => deadlift(),
  "trap-bar-deadlift": () => deadlift({ trap: true }),
  "barbell-row": () => bentRow({ load: "barbell" }),
  "db-row": oneArmBenchRow,
  "chest-supported-row": chestSupportedRow,
  "seated-cable-row": seatedRow,
  "lat-pulldown": () => pulldown(),
  "cable-pullover": () => pulldown({ straightArm: true }),
  "pull-up": () => hanging({ grip: 0.34 }),
  "chin-up": () => hanging({ grip: 0.2, chin: true }),
  "band-assisted-pull-up": () => hanging({ grip: 0.34, band: true }),
  "inverted-row": () => leanRow({ angle: 32, handY: 0.95 }),
  "ring-row": () => leanRow({ angle: 46, handY: 1.0, rings: true }),
  "towel-row": () => leanRow({ angle: 58, handY: 1.0, door: true }),
  "kb-row": () => bentRow({ load: "kettlebell", lean: 62, oneArm: true, grip: 0.18 }),
  shrug,
  "back-extension": backExtension,
  superman,
  // arms
  "barbell-curl": () => curl({ load: "barbell", grip: 0.21 }),
  "ez-curl": () => curl({ load: "barbell", grip: 0.17 }),
  "db-curl": () => curl({ load: "dumbbell", grip: 0.22 }),
  "hammer-curl": () => curl({ load: "dumbbell", grip: 0.23 }),
  "incline-db-curl": () => curl({ load: "dumbbell", grip: 0.25, posture: "incline" }),
  "cable-curl": () => curl({ load: "handle", grip: 0.18, cable: "low" }),
  "kb-curl": () => curl({ load: "kettlebell", grip: 0.07, hold: "centre" }),
  "band-curl": () => curl({ load: "none", grip: 0.2, cable: "band" }),
  "skull-crusher": () => overheadExtension({ lying: true }),
  "db-overhead-extension": () => overheadExtension({}),
  "cable-pushdown": () => pushdown({}),
  "bench-dip": () => dip({ bench: true }),
  "diamond-push-up": () => pushUp({ width: 0.06, close: true }),
  "band-pushdown": () => pushdown({ band: true }),
  "wrist-curl": () => curl({ load: "dumbbell", posture: "seatedThighs" }),
  "farmers-carry": () => carry({ hold: "each", load: "dumbbell" }),
  // legs
  "back-squat": () => squat({ hold: "back" }),
  "front-squat": () => squat({ hold: "front" }),
  "box-squat": () => squat({ hold: "back", box: true, depth: 0.9 }),
  "smith-squat": () => squat({ hold: "back", smith: true }),
  "hack-squat": hackSquat,
  "leg-press": legPress,
  "goblet-squat": () => squat({ hold: "goblet", load: "dumbbell", holdKind: "centre" }),
  "kb-goblet-squat": () => squat({ hold: "goblet", load: "kettlebell", holdKind: "centre" }),
  "bodyweight-squat": () => squat({ hold: "arms" }),
  "bulgarian-split-squat": () => lunge({ rear: "bench", hands: "dumbbells", lean: 12 }),
  "bw-split-squat": () => lunge({ rear: "box", hands: "hips", lean: 8 }),
  "walking-lunge": () => lunge({ step: "walk", hands: "dumbbells" }),
  "reverse-lunge": () => lunge({ step: "back", hands: "hips" }),
  "step-up": stepUp,
  "leg-extension": () => kneeMachine({ extend: true }),
  "romanian-deadlift": () => rdl({ load: "barbell" }),
  "db-rdl": () => rdl({ load: "dumbbell" }),
  "kb-swing": kbSwing,
  "single-leg-rdl": () => rdl({ load: "none", single: true }),
  "lying-leg-curl": () => kneeMachine({ extend: false }),
  "nordic-curl": nordic,
  "glute-bridge": () => bridge({}),
  "hip-thrust": () => bridge({ bench: true, bar: true }),
  "single-leg-hip-thrust": () => bridge({ bench: true, single: true }),
  "cable-pull-through": pullThrough,
  "copenhagen-plank": () => ({ ...sidePlank({ lift: true }), props: undefined }),
  "cossack-squat": cossack,
  "standing-calf-raise": () => calfRaise({ machine: true, step: true, load: "none" }),
  "db-calf-raise": () => calfRaise({ single: true, step: true, load: "dumbbell", hold: "R" }),
  "bw-calf-raise": () => calfRaise({ load: "none" }),
  // core
  plank,
  "side-plank": () => sidePlank({}),
  "hanging-knee-raise": hangingRaise,
  "cable-crunch": cableCrunch,
  "ab-wheel": abWheel,
  "dead-bug": deadBug,
  "pallof-press": pallof,
  "russian-twist": russianTwist,
  "kb-suitcase-carry": () => carry({ hold: "R", load: "kettlebell" }),
};

function bandApart(B: Body, d: number): Pose {
  const hip = V(0.02, standY(B));
  const sh = torsoAt(B, hip, 0);
  const phi = rad(lerp(8, 84, d));
  const r = reach(B) * 0.95;
  const at = (sgn: number): Vec => V(sh[0] + r * Math.cos(phi), sh[1] - 0.02, sgn * (B.shW * (1 - Math.cos(phi)) * 0.3 + r * Math.sin(phi) * 0.95 + 0.06));
  return { hip, sh, hand: per(at(-1), at(1)), elbowPole: V(-0.4, -1, 0.5), headBlend: 1 };
}

const cache = new Map<string, Motion>();
/** The motion for an exercise id; a relaxed standing pose when there is none (or no id). */
export function motionFor(id?: string | null): Motion {
  const key = id && MOTIONS[id] ? id : "__stand";
  let m = cache.get(key);
  if (!m) {
    m = key === "__stand" ? stand() : MOTIONS[key]();
    cache.set(key, m);
  }
  return m;
}

export function hasMotion(id: string) {
  return id in MOTIONS;
}

export const MOTION_IDS = Object.keys(MOTIONS);

/** Every library exercise has a motion (checked by a test). */
export function missingMotions(): string[] {
  return EXERCISES.filter((e) => !hasMotion(e.id)).map((e) => e.id);
}

// ---------- target muscles ----------
/** How strongly each app muscle lights up: primary 1, secondary 0.5. */
export function targetsFor(id?: string | null, highlight?: Partial<Record<Muscle, number>>): Partial<Record<Muscle, number>> {
  if (highlight) return highlight;
  const e = id ? EXERCISES.find((x) => x.id === id) : undefined;
  if (!e) return {};
  const t: Partial<Record<Muscle, number>> = {};
  for (const m of e.secondary) t[m] = 0.5;
  for (const m of e.primary) t[m] = 1;
  return t;
}
