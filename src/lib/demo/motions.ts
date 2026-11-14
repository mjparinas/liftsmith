import { EXERCISES } from "../exercises";
import type { Muscle } from "../types";
import { withGear } from "./equipmentMotion";
import {
  add,
  ANKLE_H,
  clamp,
  ease,
  lerp,
  lerpV,
  MIDFOOT,
  mul,
  norm,
  rad,
  sub,
  TEMPO,
  V,
  type Anchor,
  type Body,
  type Hold,
  type Load,
  type PerSide,
  type PhaseRow,
  type Pose,
  type Prop,
  type Vec,
} from "./rig";
import { tempoPhases } from "./tempoMotion";
import { withVariant } from "./variantMotion";

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
  /** Whole-figure turn about the vertical axis in degrees (a jump with a half turn). */
  yaw?: (d: number) => number;
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

const bench = (x0: number, x1: number, top = 0.45, w = 0.3): Prop => ({
  kind: "box",
  at: V((x0 + x1) / 2, top / 2),
  size: V(x1 - x0, top, w),
});
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
const seatProps =
  (lean = -8, back = true) =>
  (B: Body): Prop[] => {
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
      if (o.hold === "hips")
        return { hip, sh, hand: V(hip[0] + 0.02, hip[1] + 0.06, B.hipW + 0.13), elbowPole: V(-0.4, 0, 1), headBlend: 0.6 };
      const hand = V(sh[0] + reach(B) * 0.9, sh[1] - 0.06, 0.16);
      return { hip, sh, hand, elbowPole: V(0, -1, 0.3), headBlend: 0.7 };
    },
    props:
      o.box || o.smith
        ? (B) => {
            const p: Prop[] = [];
            if (o.box) p.push(boxP(-0.25, ANKLE_H + B.shin * 0.98 - 0.1, 0.4, 0.35));
            if (o.smith) p.push(rail(V(MIDFOOT, 1.15, 0.62), 2.3, "y"), rail(V(MIDFOOT, 1.15, -0.62), 2.3, "y"));
            return p;
          }
        : undefined,
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
      return {
        hip,
        sh,
        ankle: V(ankle[0], ankle[1], 0.17),
        foot: -back,
        hand: V(sh[0] + 0.05, sh[1] + 0.02, B.shW + 0.08),
        elbowPole: V(1, -0.6, 0.6),
        headBlend: 0.3,
      };
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
      return {
        hip,
        sh,
        ankle: V(ankle[0], ankle[1], 0.17),
        foot: -115,
        kneePole: V(-0.2, 1, 0.35),
        hand: V(0.05, 0.5, B.hipW + 0.18),
        elbowPole: V(-1, 0, 0.6),
        headBlend: 0.2,
      };
    },
    props: (B) => [
      torsoPad(B, V(0, 0.5), -recline, "back", 0.45),
      bench(-0.2, 0.2, 0.36, 0.45),
      { kind: "box", at: mul(norm(V(1, 0.85)), 0.1), size: V(0.06, 0.6, 0.6), tilt: -40, follow: "ankles" },
    ],
  };
}

// ---------- hinges ----------
/** Deadlift from the floor; `deficit` stands on a low platform, so the bar starts further below the feet. */
function deadlift(o: { trap?: boolean; deficit?: number } = {}): Motion {
  const up = o.deficit ?? 0;
  return {
    phases: [
      [0.6, 1, 1, "Set", 0.35],
      [1.3, 1, 0, "Pull · 1s", 1],
      [0.45, 0, 0, "Lockout", 0.6],
      [1.5, 0, 1, "Lower · 2s", 0.55],
    ],
    load: o.trap ? "trapbar" : "barbell",
    stance: 0.13,
    grip: o.trap ? 0.27 : 0.25,
    pose(B, d) {
      const r = reach(B) * 0.97;
      const hipTop = up + ANKLE_H + legMax(B) * 0.995;
      const barTop = hipTop + B.torso * 0.99 - r;
      const barX = o.trap ? 0.0 : MIDFOOT;
      const barY = lerp(barTop, o.trap ? 0.27 : 0.235, d);
      const sh = V(barX + (o.trap ? 0.03 : 0.045) * d, barY + r);
      let hipY = lerp(hipTop, up + ANKLE_H + (B.shin + B.thigh) * (o.trap ? 0.55 : 0.6) - up * 0.6, Math.pow(d, 1.15));
      hipY = Math.max(hipY, sh[1] - B.torso * 0.995);
      const hipX = sh[0] - Math.sqrt(Math.max(0, B.torso * B.torso - (sh[1] - hipY) ** 2));
      const bar = V(barX, barY);
      const pose: Pose = { hip: V(hipX, hipY), sh, bar, hand: bar, elbowPole: V(-1, 0, 0), kneePole: V(1, 0, 0.2), headBlend: 0.1 };
      return up ? { ...pose, ankle: V(0, ANKLE_H + up, 0.13 * B.s) } : pose;
    },
    props: up ? () => [{ kind: "box", at: V(-0.05, up / 2), size: V(0.5, up, 0.8) }] : undefined,
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
      const pose: Pose = {
        hip,
        sh,
        hand: o.load === "barbell" ? bar : V(bar[0], bar[1], 0.19),
        bar: o.load === "barbell" ? bar : undefined,
        elbowPole: V(-1, 0, 0),
        kneePole: V(1, 0, 0.2),
        headBlend: 0.1,
      };
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
    phases: [
      [0.75, 1, 0, "Snap the hips", 1],
      [0.75, 0, 1, "Hike back", 0.55],
    ],
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
      return {
        hip,
        sh,
        ankle: V(ankle[0], ankle[1], 0.1),
        foot: 45,
        hand: V(hand[0], hand[1], 0.1),
        elbowPole: V(-1, 0, 1),
        kneePole: V(0, -1, 0.1),
        headBlend: 0,
      };
    },
    props: (B) => [
      pad(V(0.08, 0.86), 0.35, 135, 0.4),
      pad(add(V(0, 0.95), mul(V(-0.707, -0.707), legMax(B) * 0.98 - 0.02)), 0.12, 45, 0.4),
      rail(V(-0.15, 0.45, 0), 0.9, "y"),
    ],
  };
}

/** Lying on the back, shoulders at `shAt`, hips rising. */
/**
 * Glute bridges (on the floor) and hip thrusts (upper back on a bench): the shoulder blades rest on the
 * bench with the arms out to the sides flat along it (on the floor, along the sides), or the hands hold
 * a bar or a weight on the hips. On one leg, the free leg stays straight, reaching up and forward in
 * line with the working thigh.
 */
function bridge(o: { bench?: boolean; bar?: boolean; single?: boolean; onHips?: boolean }): Motion {
  const benchTop = 0.45;
  return {
    phases: TEMPO.liftFirst("Drive · 1s", "Lower · 2s", "Set", "Squeeze"),
    load: o.bar ? "barbell" : "none",
    hold: o.onHips ? "centre" : undefined,
    stance: 0.15,
    grip: 0.36,
    pose(B, d) {
      const shAt = o.bench ? V(-0.3, benchTop + 0.06) : V(-0.3, 0.13);
      const a = o.bench ? lerp(-32, 4, d) : lerp(4, 30, d);
      const hip = add(shAt, V(Math.cos(rad(a)) * B.torso, Math.sin(rad(a)) * B.torso));
      const ankleX = shAt[0] + B.torso + B.thigh * 0.95;
      const bar = add(hip, V(0, 0.12));
      const r = reach(B) * 0.88;
      const armsOut = o.bench
        ? per(V(shAt[0] - 0.05, benchTop + 0.03, -(B.shW + r)), V(shAt[0] - 0.05, benchTop + 0.03, B.shW + r))
        : V(shAt[0] + 0.25, 0.04, B.shW + 0.08);
      const pose: Pose = {
        hip,
        sh: shAt,
        ankle: V(ankleX, ANKLE_H, 0.16),
        kneePole: V(0.2, 1, 0.3),
        // hands on the bar (or the weight) on the hips, as far as the arms reach
        hand: o.bar
          ? within(V(shAt[0], shAt[1], 0.36), V(bar[0], bar[1], 0.36), reach(B) * 0.97)
          : o.onHips
            ? within(V(shAt[0], shAt[1], 0.12), V(bar[0], bar[1], 0.12), reach(B) * 0.97)
            : armsOut,
        elbowPole: o.bench && !o.bar && !o.onHips ? V(0, 1, 0) : V(0, 1, 0.5),
        headBlend: 0,
        bar: o.bar ? bar : undefined,
      };
      if (o.single) {
        // the free leg straight, angled up a little above the line of the body
        const up = rad(a + (o.bench ? 28 : 22));
        const free = add(V(hip[0], hip[1], 0.1), V(Math.cos(up) * legMax(B) * 0.97, Math.sin(up) * legMax(B) * 0.97, 0));
        pose.ankle = per(V(ankleX, ANKLE_H, -0.14), free);
        pose.kneePole = per(V(0.2, 1, -0.3), V(0, 1, 0.2));
        pose.foot = { L: 0, R: -20 };
      }
      return pose;
    },
    props: o.bench ? () => [bench(-0.85, -0.12, benchTop, 1.2)] : undefined,
  };
}

// ---------- presses ----------
function overhead(o: { load: Load; seated?: boolean; machine?: boolean; behind?: boolean }): Motion {
  return {
    phases: [
      [0.5, 1, 1, "Rack", 0.35],
      [1.1, 1, 0, "Press · 1s", 1],
      [0.5, 0, 0, "Lockout", 0.6],
      [1.5, 0, 1, "Lower · 2s", 0.55],
    ],
    load: o.load,
    stance: 0.13,
    grip: o.behind ? 0.33 : 0.27,
    pose(B, d) {
      const s = 1 - d;
      let hip: Vec, sh: Vec, ankle: Vec | undefined, kneePole: Vec | undefined;
      if (o.seated) ({ hip, sh, ankle, kneePole } = seated(B, 0.45, -6));
      else {
        hip = V(0.03, standY(B));
        sh = torsoAt(B, hip, -3);
      }
      const r = reach(B) * 0.985;
      if (o.load === "barbell" && o.behind) {
        // Behind the neck: the bar starts on the upper traps behind the neck, travels up behind the
        // head (which nods forward to let it by) and locks out over the back of the head.
        const y = sh[1] + 0.06 + (r - 0.06) * s;
        const pastHead = clamp((s - 0.6) / 0.4, 0, 1);
        const x = sh[0] + lerp(-0.09 - 0.03 * Math.sin(Math.PI * clamp(s / 0.6, 0, 1)), -0.015, ease(pastHead));
        const hand = V(x, y);
        const headBack = 0.035 * (1 - pastHead) + 0.02 * Math.sin(Math.PI * clamp(s / 0.6, 0, 1));
        return { hip, sh, ankle, kneePole, bar: hand, hand, elbowPole: V(-0.15, -1, 1), headBlend: 1, headBack };
      }
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
      const pose: Pose = {
        hip,
        sh,
        hand: p,
        ankle: V(0.72, ANKLE_H, 0.3),
        kneePole: V(0.3, 1, 0.3),
        headBlend: 0,
        elbowPole: V(0, -1, o.close ? 0.15 : 0.6),
      };
      if (o.load === "barbell") return { ...pose, bar: p, hand: p };
      const z = lerp(0.15, 0.27, d);
      return { ...pose, hand: V(p[0], p[1], z) };
    },
    props: (B) => (inc ? [bench(0.05, 0.45, 0.45, 0.32), torsoPad(B, V(0.28, 0.53), -90 + inc)] : [bench(-0.55, 0.5, 0.45, 0.3)]),
  };
}

function machinePress(o: { incline?: number } = {}): Motion {
  const inc = rad(o.incline ?? 0);
  return {
    phases: TEMPO.liftFirst("Press · 1s", "Return · 2s", "Set", "Lockout"),
    load: "handle",
    grip: 0.24,
    pose(B, d) {
      const { hip, sh, ankle, kneePole } = seated(B, 0.45, o.incline ? -24 : -10);
      // the handles travel straight out from the chest, angled up on an incline machine
      const out = lerp(0.12, reach(B) * 0.92, d);
      const hand = V(sh[0] + out * Math.cos(inc), sh[1] - 0.08 + (out - 0.12) * Math.sin(inc), 0.24);
      return { hip, sh, ankle, kneePole, hand, elbowPole: V(-0.3, -1, 0.7), headBlend: 0.8 };
    },
    props: seatProps(o.incline ? -24 : -10),
  };
}

/** Arms sweeping through an arc: `plane` "front" sweeps in front of the chest, "down" opens the arms out to the sides. */
function fly(o: {
  posture: "supine" | "seated" | "standing" | "bent" | "facePad";
  from: number;
  to: number;
  load: Load;
  first: "lower" | "lift";
  cable?: "high" | "low" | "side";
  oneArm?: boolean;
}): Motion {
  return {
    phases: o.first === "lower" ? TEMPO.lowerFirst("Open · 2s", "Squeeze · 1s", "Top", "Stretch") : TEMPO.liftFirst(),
    load: o.load,
    hold: o.oneArm ? "R" : undefined,
    stance: o.posture === "standing" ? 0.14 : 0.25,
    pose(B, d) {
      let hip: Vec,
        sh: Vec,
        ankle: Vec | undefined,
        kneePole: Vec | undefined,
        lean = 0;
      if (o.posture === "supine") {
        hip = V(0.28, 0.53);
        lean = -90;
        sh = torsoAt(B, hip, lean);
        ankle = V(0.72, ANKLE_H, 0.3);
        kneePole = V(0.3, 1, 0.3);
      } else if (o.posture === "seated" || o.posture === "facePad") {
        ({ hip, sh, ankle, kneePole } = seated(B, 0.45, o.posture === "facePad" ? 10 : -8));
        lean = o.posture === "facePad" ? 10 : -8;
      } else if (o.posture === "bent") {
        lean = 72;
        const shX = MIDFOOT + 0.05;
        const hipX = shX - Math.sin(rad(lean)) * B.torso;
        hip = V(hipX, standY(B, hipX, 0.95));
        sh = torsoAt(B, hip, lean);
      } else {
        lean = o.cable === "high" ? 12 : 4;
        hip = V(0.02, standY(B));
        sh = torsoAt(B, hip, lean);
      }
      const phi = rad(lerp(o.from, o.to, d));
      const r = reach(B) * 0.92;
      const hands = (sgn: number): Vec => {
        const s = side(B, sgn, sh);
        if (o.posture === "supine") return add(s, V(0.03, r * Math.cos(phi), sgn * r * Math.sin(phi)));
        if (o.posture === "bent" || o.cable === "low" || o.cable === "side" || (o.posture === "standing" && o.load !== "handle"))
          return add(s, V(0.04, -r * Math.cos(phi), sgn * r * Math.sin(phi)));
        // horizontal arc in front of the chest (pec deck, reverse pec deck, cable fly, pull-aparts)
        const drop = o.cable === "high" ? -0.1 * (1 - Math.sin(phi)) : -0.03;
        return add(s, V(r * Math.cos(phi), drop, sgn * r * Math.sin(phi) - sgn * B.shW * Math.cos(phi) * 0.8));
      };
      let L = hands(-1);
      const R = hands(1);
      if (o.oneArm) L = V(hip[0] + 0.04, hip[1] + 0.06, -(B.hipW + 0.13));
      return {
        hip,
        sh,
        ankle,
        kneePole,
        hand: per(L, R),
        elbowPole: o.posture === "supine" ? V(0, -1, 0.4) : V(-0.6, -1, 0.5),
        headBlend: o.posture === "bent" ? 0.3 : 0.8,
      };
    },
    props: (B) => {
      const p: Prop[] = [];
      if (o.posture === "supine") p.push(bench(-0.55, 0.5, 0.45, 0.3));
      if (o.posture === "seated" || o.posture === "facePad")
        p.push(...seatProps(o.posture === "facePad" ? 10 : -8, o.posture !== "facePad")(B));
      if (o.posture === "facePad") p.push(pad(V(0.3, 1.1), 0.6, 90 - 10, 0.3));
      if (o.cable === "high") p.push(cable(V(-0.15, 1.5, -1.0), "handL"), cable(V(-0.15, 1.5, 1.0), "handR"));
      if (o.cable === "side") p.push(cable(V(0.05, 0.12, -0.35), "handR"));
      if (o.cable === "low") p.push(cable("ankleL", "handL"), cable("ankleR", "handR"));
      return p;
    },
  };
}

// ---------- push-ups and dips ----------
interface PushUpOpts {
  hands?: number;
  feet?: number;
  width?: number;
  rings?: boolean;
  close?: boolean;
  /** On the knees, shins on the floor. */
  knees?: boolean;
  /** Hands on blocks, the chest sinking below them. */
  deficit?: boolean;
  /** One hand further forward than the other. */
  stagger?: boolean;
  /** Pseudo planche: hands back by the waist, shoulders leaning past them. */
  planche?: boolean;
  /** Scapular push-up: arms stay straight, only the shoulder blades move. */
  scap?: boolean;
  /** After each rep, turn and reach the right arm to the ceiling. */
  rotate?: boolean;
  /** Hands on a medicine ball. */
  ball?: boolean;
}
function pushUp(o: PushUpOpts): Motion {
  const lower = TEMPO.lowerFirst(
    o.scap ? "Shoulder blades together" : "Lower · 2s",
    o.scap ? "Push apart" : "Push · 1s",
    "Plank",
    "Bottom",
  );
  return {
    phases: o.rotate ? [...lower, [0.8, 0, -1, "Reach to the ceiling", 0.7], [0.8, -1, 0, "Hand back down", 0.5]] : lower,
    load: "none",
    stance: 0.1,
    grip: o.width ?? 0.22,
    pose(B, d0) {
      const d = Math.max(0, d0);
      const handY = (o.hands ?? 0) + (o.rings ? 0.1 : o.deficit ? 0.13 : 0.03);
      const back = o.planche ? 0.2 : 0;
      // the body pivots about the feet, or the knees on a knee push-up
      const pivotY = o.knees ? 0.08 : (o.feet ?? 0) + 0.11;
      const legL = o.knees ? B.thigh * 0.99 : legMax(B) * 0.99;
      const Lb = legL + B.torso;
      const r = reach(B) * 0.97;
      const shTop = handY + Math.sqrt(r * r - back * back);
      const shBot = o.scap ? shTop - 0.05 : o.deficit ? handY - 0.02 : handY + (o.close ? 0.2 : 0.17);
      const shY = lerp(shTop, shBot, d);
      const thTop = Math.asin(clamp((shTop - pivotY) / Lb, -1, 1));
      const handX = 0.45;
      const pivotX = handX + back - Lb * Math.cos(thTop);
      const th = Math.asin(clamp((shY - pivotY) / Lb, -1, 1));
      const dir = V(Math.cos(th), Math.sin(th));
      const pivot = V(pivotX, pivotY);
      const hip = add(pivot, mul(dir, legL));
      const sh = add(hip, mul(dir, B.torso));
      const lean = 90 - (th * 180) / Math.PI;
      const ankle = o.knees ? V(pivot[0] - B.shin * 0.95, 0.1, 0.1) : V(pivot[0], pivot[1], 0.1);
      const z = o.width ?? 0.22;
      const st = o.stagger ? 0.13 : 0;
      let hand: Pose["hand"] = o.stagger ? per(V(handX + 0.02 + st, handY, -z), V(handX + 0.02 - st, handY, z)) : V(handX + 0.02, handY, z);
      if (o.rotate && d0 < 0) {
        const up = add(V(sh[0], sh[1], B.shW), V(0, reach(B) * 0.95, 0.15));
        hand = per(V(handX + 0.02, handY, -z), lerpV(V(handX + 0.02, handY, z), up, -d0));
      }
      return {
        hip,
        sh,
        ankle,
        foot: o.knees ? 150 : 90 - (th * 180) / Math.PI - 35,
        kneePole: o.knees ? V(0.2, -1, 0.1) : V(0, -1, 0.1),
        hand,
        elbowPole: o.close || o.planche ? V(-1, 0.3, 0.1) : V(-0.7, 0.6, 0.7),
        headBlend: lean > 60 ? 0 : 0.2,
      };
    },
    props: () => {
      const p: Prop[] = [];
      if (o.ball) p.push(boxP(0.47, o.hands ?? 0.2, 0.22, 0.22));
      else if (o.hands) p.push(boxP(0.47, o.hands, 0.7, 0.35));
      if (o.deficit) {
        const z = o.width ?? 0.22;
        p.push(
          { kind: "box", at: V(0.47, 0.05, -z), size: V(0.2, 0.1, 0.12) },
          { kind: "box", at: V(0.47, 0.05, z), size: V(0.2, 0.1, 0.12) },
        );
      }
      if (o.feet) p.push(boxP(-1.05, o.feet, 0.5, 0.4));
      if (o.rings) p.push(cable(V(0.47, 2.2, -0.24), "handL"), cable(V(0.47, 2.2, 0.24), "handR"));
      return p;
    },
  };
}

/** Wall push-up: standing, hands on a wall at chest height, the body leaning in and pushing back out. */
function wallPushUp(): Motion {
  return {
    phases: TEMPO.lowerFirst(),
    load: "none",
    stance: 0.12,
    grip: 0.24,
    pose(B, d) {
      const hand = V(0.62, 1.25 * B.s);
      const Lb = legMax(B) * 0.99 + B.torso;
      const ankle = V(0, 0.1);
      const target = lerp(reach(B) * 0.95, 0.24, ease(d));
      // lean in about the ankles until the shoulders are `target` from the wall
      let th = Math.PI / 2;
      for (let k = 0; k < 40; k++) {
        const sh = add(ankle, V(Math.cos(th) * Lb, Math.sin(th) * Lb));
        if (Math.hypot(hand[0] - sh[0], hand[1] - sh[1]) <= target) break;
        th -= rad(0.75);
      }
      const dir = V(Math.cos(th), Math.sin(th));
      const hip = add(ankle, mul(dir, legMax(B) * 0.99));
      const sh = add(hip, mul(dir, B.torso));
      return {
        hip,
        sh,
        ankle: V(ankle[0], ankle[1], 0.12),
        foot: 90 - (th * 180) / Math.PI,
        kneePole: V(1, 0, 0.2),
        hand: V(hand[0], hand[1], 0.24),
        elbowPole: V(-0.7, -0.6, 0.7),
        headBlend: 0.6,
      };
    },
    props: (B) => [{ kind: "box", at: V(0.67, 1.2 * B.s), size: V(0.08, 2.4, 1.4) }],
  };
}

/** Pike push-up: hips high, head down between the hands. `feet` puts the feet up on a box; `deficit` the hands on two blocks. */
function pikePushUp(o: { feet?: number; deficit?: number } = {}): Motion {
  const feet = o.feet ?? 0,
    deficit = o.deficit ?? 0;
  return {
    phases: TEMPO.lowerFirst("Head down · 2s", "Press · 1s", "Pike", "Bottom"),
    load: "none",
    stance: 0.12,
    grip: 0.24,
    props:
      feet || deficit
        ? () => [
            ...(feet ? [{ kind: "box", at: V(-0.45, feet / 2), size: V(0.4, feet, 0.6) } as Prop] : []),
            ...(deficit ? [-0.24, 0.24].map((z): Prop => ({ kind: "box", at: V(0.32, deficit / 2, z), size: V(0.2, deficit, 0.14) })) : []),
          ]
        : undefined,
    pose(B, d) {
      const ankle = feet ? V(-0.4, feet + 0.05) : V(-0.55, 0.1);
      const hip = add(ankle, mul(V(Math.cos(rad(feet ? 42 : 58)), Math.sin(rad(feet ? 42 : 58))), legMax(B) * 0.98));
      const hand = V(0.32, 0.03 + deficit);
      const r = lerp(reach(B) * 0.96, reach(B) * 0.55, d);
      const sh = circles(hip, B.torso, hand, r, 1);
      return {
        hip,
        sh,
        ankle: V(ankle[0], ankle[1], 0.12),
        foot: 30,
        kneePole: V(0, -1, 0.1),
        hand: V(hand[0], hand[1], 0.24),
        elbowPole: V(-0.8, 0.4, 0.5),
        headBlend: 0,
      };
    },
  };
}

/** The intersection of circles (c1, r1) and (c2, r2) in the x-y plane; `pick` 1 takes the one further forward. */
function circles(c1: Vec, r1: number, c2: Vec, r2: number, pick: 1 | -1): Vec {
  const dx = c2[0] - c1[0],
    dy = c2[1] - c1[1];
  const D = Math.max(1e-6, Math.hypot(dx, dy));
  const dd = clamp(D, Math.abs(r1 - r2) + 1e-4, r1 + r2 - 1e-4);
  const a = (r1 * r1 - r2 * r2 + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const mx = c1[0] + (a * dx) / D,
    my = c1[1] + (a * dy) / D;
  const p1 = V(mx + (h * dy) / D, my - (h * dx) / D),
    p2 = V(mx - (h * dy) / D, my + (h * dx) / D);
  return p1[0] > p2[0] === (pick === 1) ? p1 : p2;
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
      return {
        hip,
        sh,
        ankle: V(ankle[0], ankle[1], 0.06),
        foot: 40,
        kneePole: V(1, 0, 0.1),
        hand: V(0.02, barY, 0.26),
        elbowPole: V(-1, 0, 0.1),
        headBlend: 0.6,
      };
    },
    props: o.bench
      ? () => [bench(-0.55, -0.15, 0.45, 0.6)]
      : () => [
          rail(V(0.05, 1.28, -0.26), 0.8, "x"),
          rail(V(0.05, 1.28, 0.26), 0.8, "x"),
          rail(V(0.4, 0.64, -0.26), 1.28, "y"),
          rail(V(0.4, 0.64, 0.26), 1.28, "y"),
        ],
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
      const pose: Pose = {
        hip,
        sh,
        hand: V(p[0], p[1], z),
        elbowPole: V(-1, 0.6, 0.5),
        headBlend: 0.15,
        kneePole: V(1, 0, 0.3),
        bar: o.load === "barbell" ? bar : undefined,
      };
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
        hip,
        sh,
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

/**
 * Rowing chest-down on a pad: dumbbells on an incline bench by default, the machine's handles on a
 * chest-supported row machine, or a barbell under a high flat bench (the seal row, lying flat).
 */
function chestSupportedRow(o: { load?: "dumbbell" | "handle" | "seal" } = {}): Motion {
  const seal = o.load === "seal";
  return {
    phases: TEMPO.liftFirst("Row · 1s", "Lower · 2s", "Hang", "Squeeze"),
    load: o.load === "seal" ? "barbell" : (o.load ?? "dumbbell"),
    hold: o.load === "handle" ? "each" : undefined,
    stance: 0.16,
    grip: seal ? 0.24 : undefined,
    pose(B, d) {
      if (seal) {
        // flat on a bench high enough for the arms to hang straight
        const top = reach(B) * 0.97 + 0.12;
        const hip = V(-0.1, top + 0.1);
        const sh = torsoAt(B, hip, 90);
        const low = V(sh[0] + 0.02, sh[1] - reach(B) * 0.95);
        const high = V(sh[0] - 0.12, top - 0.02);
        const b = lerpV(low, high, d);
        return {
          hip,
          sh,
          ankle: V(hip[0] - legMax(B) * 0.97, top + 0.06, 0.12),
          foot: -80,
          kneePole: V(0, -1, 0.1),
          bar: b,
          hand: b,
          elbowPole: V(-1, 0.6, 0.5),
          headBlend: 0.3,
        };
      }
      const hip = V(0, 0.68);
      const lean = 60;
      const sh = torsoAt(B, hip, lean);
      const low = V(sh[0] + 0.03, sh[1] - reach(B) * 0.95);
      const high = onTorso(hip, sh, lean, 0.5, 0.1);
      const p = lerpV(low, high, d);
      return {
        hip,
        sh,
        ankle: V(-0.45, ANKLE_H, 0.16),
        foot: 20,
        kneePole: V(1, 0, 0.2),
        hand: V(p[0], p[1], 0.2),
        elbowPole: V(-1, 0.6, 0.5),
        headBlend: 0.4,
      };
    },
    props: (B) => {
      if (!seal) return [torsoPad(B, V(0, 0.68), 60, "front"), bench(-0.25, 0.2, 0.6, 0.3)];
      const top = reach(B) * 0.97 + 0.12;
      return [bench(-1.6, 0.25, top, 0.32)];
    },
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
      return {
        hip,
        sh,
        ankle: V(0.62, 0.24, 0.14),
        foot: -25,
        kneePole: V(0, 1, 0.3),
        hand: lerpV(far, V(near[0], near[1], 0), d),
        elbowPole: V(-1, -0.2, 0.4),
        headBlend: 0.8,
      };
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
    props: o.straightArm
      ? () => [cable(V(1.0, 2.3), "hands")]
      : (B) => [...seatProps(-12, false)(B), pad(V(0.28, 0.72), 0.12, 0, 0.5), cable(V(0.1, 2.5), "hands")],
  };
}

function hanging(o: { grip: number; chin?: boolean; band?: boolean; knees?: boolean }): Motion {
  return {
    phases: o.knees
      ? TEMPO.liftFirst("Knees up · 1s", "Lower · 2s", "Hang", "Curl")
      : TEMPO.liftFirst("Pull · 1s", "Lower · 2s", "Hang", "Chin over"),
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
        hip: V(hip[0], hip[1]),
        sh,
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
      return {
        hip,
        sh,
        ankle: V(ankle[0], ankle[1], 0.12),
        foot: -(90 - th) * 0.8,
        kneePole: V(0, 1, 0.1),
        hand: V(handle[0], handle[1], o.door ? 0.05 : 0.24),
        elbowPole: V(0, -1, 0.6),
        headBlend: 0,
      };
    },
    props: (B) => {
      const handleX = (() => {
        const dir = V(-Math.cos(rad(o.angle)), Math.sin(rad(o.angle)));
        return 0.55 + dir[0] * (legMax(B) * 0.99 + B.torso) + 0.12;
      })();
      if (o.rings) return [cable(V(handleX, 2.3, -0.24), "handL"), cable(V(handleX, 2.3, 0.24), "handR")];
      if (o.door) return [{ kind: "box", at: V(handleX - 0.08, 1.0), size: V(0.05, 2.0, 0.9) }];
      return [
        rail(V(handleX, o.handY, 0), 1.3, "z"),
        rail(V(handleX, o.handY / 2, -0.6), o.handY, "y"),
        rail(V(handleX, o.handY / 2, 0.6), o.handY, "y"),
      ];
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

/** Shrugs with what the name holds: dumbbells at the sides, a bar in front of the thighs (barbell, Smith), a trap bar, or cable handles from the low pulleys. */
function shrug(o: { load?: "dumbbell" | "barbell" | "trapbar" | "cable" } = {}): Motion {
  const load = o.load ?? "dumbbell";
  const bar = load === "barbell" || load === "trapbar";
  return {
    phases: TEMPO.liftFirst("Shrug · 1s", "Lower · 2s", "Hang", "Hold"),
    load: load === "cable" ? "handle" : load,
    hold: load === "cable" ? "each" : undefined,
    stance: 0.13,
    grip: load === "trapbar" ? 0.27 : load === "barbell" ? 0.24 : undefined,
    pose(B, d) {
      const hip = V(0.03, standY(B));
      const sh = torsoAt(B, hip, load === "barbell" ? 3 : 0);
      const up = 0.065 * d;
      const h = hang(B, sh, 0.04);
      if (bar) {
        // a straight bar rests on the front of the thighs; a trap bar's handles hang at the sides
        const b = V(load === "barbell" ? hip[0] + 0.13 : h[0], h[1] + up + (load === "barbell" ? 0.03 : 0));
        return { hip, sh, shrug: up, bar: b, hand: b, elbowPole: V(-1, 0, 0.3), headBlend: 1 };
      }
      return { hip, sh, shrug: up, hand: V(h[0], h[1] + up, h[2]), elbowPole: V(-1, 0, 0.3), headBlend: 1 };
    },
    props: load === "cable" ? () => [cable(V(0.3, 0.06, -0.32), "handL"), cable(V(0.3, 0.06, 0.32), "handR")] : undefined,
  };
}

/**
 * A barbell held behind the hips with straight arms: the behind-the-back shrug (the shoulders rise)
 * and the behind-the-back wrist curl (only the hands curl the bar up).
 */
function behindBack(o: { move: "shrug" | "wrists" }): Motion {
  return {
    phases:
      o.move === "shrug"
        ? TEMPO.liftFirst("Shrug · 1s", "Lower · 2s", "Hang", "Hold")
        : TEMPO.liftFirst("Curl · 1s", "Lower · 2s", "Hang", "Squeeze"),
    load: "barbell",
    plates: o.move === "wrists" ? 0.55 : undefined,
    stance: 0.13,
    grip: o.move === "shrug" ? 0.24 : 0.2,
    pose(B, d) {
      const hip = V(0.03, standY(B));
      const sh = torsoAt(B, hip, 4);
      const up = o.move === "shrug" ? 0.065 * d : 0;
      const curl = o.move === "wrists" ? 0.05 * d : 0;
      // behind the glutes, arms long
      const bar = V(hip[0] - B.s * 0.17, sh[1] - B.shDrop - reach(B) * 0.92 + up + curl);
      return { hip, sh, shrug: up, bar, hand: bar, elbowPole: V(-1, 0, 0.4), headBlend: 1 };
    },
  };
}

type CarryAt = "side" | "rack" | "overhead" | "goblet" | "zercher" | "mixed";
/**
 * Walking with a load: at the sides (farmer's), racked at the shoulders, locked out overhead, hugged
 * at the chest (goblet) or a barbell in the crook of the elbows (Zercher). A barbell carry sets `bar`,
 * so the bar and its plates are drawn.
 */
function carry(o: { hold: Hold; load: Load; at?: CarryAt }): Motion {
  const at = o.at ?? "side";
  return {
    phases: TEMPO.walk(),
    load: o.load,
    hold: o.hold,
    grip:
      at === "zercher" ? 0.09 : at === "overhead" && o.load === "barbell" ? 0.3 : at === "rack" && o.load === "barbell" ? 0.2 : undefined,
    pose(B, d) {
      const ph = d * Math.PI * 2;
      const stride = 0.17;
      const foot = (s: number): Vec => {
        const p = ph + (s > 0 ? Math.PI : 0);
        return V(stride * Math.sin(p), ANKLE_H + Math.max(0, 0.07 * Math.cos(p)), s * 0.12);
      };
      const hipY = standY(B, 0.05, 0.97) - 0.015 * Math.abs(Math.cos(ph));
      const hip = V(0.05, hipY);
      const sh = torsoAt(B, hip, at === "zercher" ? -4 : 0);
      const L = foot(-1),
        R = foot(1);
      const base = {
        hip,
        sh,
        ankle: per(L, R),
        foot: { L: L[1] > ANKLE_H + 0.01 ? 12 : 0, R: R[1] > ANKLE_H + 0.01 ? 12 : 0 },
        headBlend: 1,
      };
      const free = hang(B, sh, 0.03);
      const freeL = V(free[0] + 0.04 * Math.sin(ph), free[1], -free[2]);
      const overhead = V(sh[0] + 0.01, sh[1] + reach(B) * 0.97, B.shW + 0.04);
      if (o.load === "barbell" && at === "overhead") {
        const bar = V(sh[0] + 0.01, sh[1] + reach(B) * 0.97);
        return { ...base, bar, hand: bar, elbowPole: V(0.3, -1, 1) };
      }
      if (o.load === "barbell" && at === "rack") {
        const bar = add(sh, V(0.12, 0.02));
        return { ...base, bar, hand: V(bar[0] - 0.02, bar[1] - 0.02, 0.2), elbowPole: V(1, -0.1, 0.3) };
      }
      if (at === "zercher") {
        // upper arms angled forward, forearms folded up, hands clasped in front of the chest:
        // the bar rests in the crook of the elbows
        const shJ = V(sh[0], sh[1] - B.shDrop);
        const elbow = swing(shJ, B.upper * 0.98, 28);
        const hand = swing(elbow, B.fore * 0.95, 160);
        const bar = add(elbow, V(0.025, 0.045));
        return { ...base, bar: o.load === "barbell" ? bar : undefined, hand: V(hand[0], hand[1], 0.09), elbowPole: V(1, -1, 0.5) };
      }
      if (at === "goblet") {
        const c = onTorso(hip, sh, 0, 0.88, 0.2);
        return { ...base, hand: V(c[0], c[1] - 0.04, 0.06), elbowPole: V(0.2, -1, 0.3) };
      }
      if (at === "rack") {
        const rack = V(sh[0] + 0.1, sh[1] - 0.02, B.shW - 0.04);
        return { ...base, hand: o.hold === "R" ? per(freeL, rack) : rack, elbowPole: V(0.2, -1, 0.3) };
      }
      if (at === "mixed") {
        // one racked at the shoulder, one at the side
        const side = hang(B, sh, 0.06);
        return {
          ...base,
          hand: per(V(side[0], side[1], -side[2]), V(sh[0] + 0.1, sh[1] - 0.02, B.shW - 0.04)),
          elbowPole: per(V(-1, 0, -0.3), V(0.2, -1, 0.3)),
        };
      }
      if (at === "overhead") return { ...base, hand: o.hold === "R" ? per(freeL, overhead) : overhead, elbowPole: V(0, -1, 1) };
      const h = hang(B, sh, 0.06);
      return { ...base, hand: o.hold === "R" ? per(freeL, h) : h, elbowPole: V(-1, 0, 0.3) };
    },
  };
}

// ---------- arms ----------
type ArmPosture = "stand" | "incline" | "seatedThighs";
function curl(o: { load: Load; grip?: number; posture?: ArmPosture; hold?: Hold; cable?: "low" | "band"; behind?: boolean }): Motion {
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
      else {
        hip = V(0.03, standY(B));
        sh = torsoAt(B, hip, 0);
      }
      const z = o.grip ?? 0.21;
      // Behind the body: facing away from a low pulley, the upper arm angled back behind the torso.
      const back = o.behind ? 22 : 0;
      const elbow = o.behind
        ? swing(V(sh[0], sh[1] - B.shDrop), B.upper * 0.98, -back)
        : V(sh[0] - (posture === "incline" ? 0.0 : 0.02), sh[1] - B.upper * 0.98);
      const a = lerp(8 - back, 135 - back, d);
      const h = swing(elbow, B.fore * 0.98, a);
      return {
        hip,
        sh,
        ankle,
        kneePole,
        hand: V(h[0], h[1], z),
        bar: o.load === "barbell" ? V(h[0], h[1]) : undefined,
        elbowPole: V(-1, -0.2, 0.3),
        headBlend: 1,
      };
    },
    props: (B) => {
      const p: Prop[] = [];
      if (posture === "incline") p.push(...seatProps(-42)(B));
      if (posture === "seatedThighs") p.push(bench(-0.25, 0.3, 0.45, 0.34));
      if (o.cable === "low") p.push(cable(V(o.behind ? -0.55 : 0.55, 0.12), "hands"));
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
    props: o.band
      ? () => [rail(V(0.3, 2.1, 0), 1.2, "z"), cable(V(0.3, 2.1, -0.05), "handL"), cable(V(0.3, 2.1, 0.05), "handR")]
      : () => [cable(V(0.32, 2.3), "hands")],
  };
}

/** Lying (a bar to the forehead) or standing overhead: one dumbbell in both hands, an EZ bar, or a rope from the low pulley behind. */
function overheadExtension(o: { lying?: boolean; hold?: "ez" | "cable" }): Motion {
  const ez = o.lying || o.hold === "ez";
  return {
    phases: TEMPO.lowerFirst("Lower · 2s", "Extend · 1s", "Top", "Stretch"),
    load: ez ? "barbell" : o.hold === "cable" ? "handle" : "dumbbell",
    plates: 0.55,
    hold: o.lying || ez ? undefined : "centre",
    stance: o.lying ? 0.3 : 0.13,
    grip: o.lying ? 0.13 : ez ? 0.09 : 0.05,
    pose(B, d) {
      if (o.lying) {
        const hip = V(0.28, 0.53);
        const sh = torsoAt(B, hip, -90);
        const elbow = add(sh, V(-Math.sin(rad(14)) * B.upper * 0.98, Math.cos(rad(14)) * B.upper * 0.98));
        const b = rad(lerp(8, 120, d));
        const h = add(elbow, V(-Math.sin(b) * B.fore * 0.98, Math.cos(b) * B.fore * 0.98));
        return {
          hip,
          sh,
          ankle: V(0.72, ANKLE_H, 0.3),
          kneePole: V(0.3, 1, 0.3),
          hand: V(h[0], h[1], 0.13),
          bar: V(h[0], h[1]),
          elbowPole: V(0, 1, 0.1),
          headBlend: 0,
        };
      }
      const hip = V(0.03, standY(B));
      const sh = torsoAt(B, hip, -2);
      const elbow = add(sh, V(0.03, B.upper * 0.98));
      const b = rad(lerp(5, 145, d));
      const h = add(elbow, V(-Math.sin(b) * B.fore * 0.98, Math.cos(b) * B.fore * 0.98));
      if (ez) return { hip, sh, bar: V(h[0], h[1]), hand: V(h[0], h[1], 0.09), elbowPole: V(0.4, 1, 0.15), headBlend: 1 };
      return { hip, sh, hand: V(h[0], h[1], 0.05), elbowPole: V(0.4, 1, 0.15), headBlend: 1 };
    },
    props: o.lying ? () => [bench(-0.55, 0.5, 0.45, 0.3)] : o.hold === "cable" ? () => [cable(V(-0.55, 0.08, 0), "hands")] : undefined,
  };
}

// ---------- legs ----------
function lunge(o: {
  rear?: "floor" | "bench" | "box";
  step?: "back" | "walk";
  hands: "dumbbells" | "hips";
  lean?: number;
  /** Curtsy: the left foot steps behind and across the right. */
  curtsy?: boolean;
}): Motion {
  return {
    phases: TEMPO.lowerFirst("Lower · 2s", "Drive · 1s", "Tall", "Bottom"),
    load: o.hands === "dumbbells" ? "dumbbell" : "none",
    pose(B, d) {
      const rearH = o.rear === "bench" ? 0.45 : o.rear === "box" ? 0.42 : 0;
      const frontA = o.curtsy ? V(0.12, ANKLE_H, 0.13) : V(0.34, ANKLE_H, 0.11);
      let rearA = o.curtsy ? V(-0.34, ANKLE_H + 0.02, 0.26) : V(rearH ? -0.58 : -0.5, rearH + (rearH ? 0.05 : ANKLE_H + 0.02), -0.11);
      if (o.step === "back") rearA = lerpV(V(0.02, ANKLE_H, -0.11), rearA, clamp(d * 2.2, 0, 1));
      const hipX = o.curtsy ? -0.08 : rearH ? -0.04 : -0.06;
      const topY = Math.min(standY(B, frontA[0] - hipX, 0.99), standY(B, rearA[0] - hipX, 0.99) + rearH * 0.5);
      const botY = rearH ? 0.52 : 0.07 + B.thigh * 0.96;
      const hip = V(hipX, lerp(topY, botY, ease(d)));
      const lean = o.lean ?? 6;
      const sh = torsoAt(B, hip, lean);
      const hand = o.hands === "dumbbells" ? hangHands(B, sh) : V(hip[0] + 0.02, hip[1] + 0.06, B.hipW + 0.13);
      return {
        hip,
        sh,
        ankle: per(rearA, frontA),
        foot: { L: rearH ? 75 : lerp(0, 55, clamp(d * 2.2, 0, 1)), R: 0 },
        kneePole: per(o.curtsy ? V(1, -0.4, 0.3) : V(1, -0.3, -0.1), V(1, 0, 0.2)),
        hand,
        elbowPole: o.hands === "hips" ? V(-0.4, 0, 1) : V(-1, 0, 0.3),
        headBlend: 0.8,
      };
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
      return {
        hip,
        sh,
        ankle: per(L, R),
        foot: { L: d < 0.4 ? lerp(0, 35, d / 0.4) : 15, R: 0 },
        kneePole: per(V(1, 0.2, -0.2), V(1, 0, 0.2)),
        hand: V(hip[0] + 0.02, hip[1] + 0.06, B.hipW + 0.13),
        elbowPole: V(-0.4, 0, 1),
        headBlend: 0.8,
      };
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
        hip,
        sh,
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
    phases: o.extend
      ? TEMPO.liftFirst("Extend · 1s", "Lower · 2s", "Bent", "Squeeze")
      : TEMPO.liftFirst("Curl · 1s", "Return · 2s", "Straight", "Squeeze"),
    load: "none",
    stance: 0.13,
    pose(B, d) {
      const hip = V(0, 0.55);
      const sh = torsoAt(B, hip, -12);
      const knee = V(B.thigh * 0.99, 0.55);
      const a = o.extend ? lerp(5, 82, d) : lerp(80, -12, d);
      const ankle = swing(knee, B.shin * 0.98, a);
      return {
        hip,
        sh,
        ankle: V(ankle[0], ankle[1], 0.13),
        foot: -a * 0.3,
        kneePole: V(0, 1, 0.1),
        hand: V(0.05, 0.52, B.hipW + 0.2),
        elbowPole: V(-1, 0, 0.5),
        headBlend: 0.8,
      };
    },
    props: (B) => [...seatProps(-12)(B), { kind: "box", at: V(B.thigh * 0.99, 0.25), size: V(0.08, 0.5, 0.4) }],
  };
}

function nordic(): Motion {
  return {
    phases: [
      [0.5, 0, 0, "Kneel tall", 0.35],
      [3, 0, 1, "Lower slowly · 3s", 1],
      [0.4, 1, 1, "Catch", 0.6],
      [1.2, 1, 0, "Push back up", 0.55],
    ],
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
      return {
        hip,
        sh,
        ankle: V(-B.shin * 0.98, 0.08, 0.12),
        foot: 70,
        kneePole: V(0, -1, 0.1),
        hand: V(hand[0], hand[1] - 0.05 * d, 0.2),
        elbowPole: V(-1, -0.4, 0.4),
        headBlend: 0.2,
      };
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
      const pose: Pose = {
        hip,
        sh,
        ankle: a,
        foot: pitch,
        hand: o.machine ? V(sh[0] + 0.05, sh[1] + 0.12, B.shW + 0.05) : V(sh[0] + 0.02, sh[1] - reach(B) * 0.97, B.shW + 0.05),
        elbowPole: o.machine ? V(0, -1, 1) : V(-1, 0, 0.3),
        headBlend: 1,
      };
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
      return {
        hip,
        sh,
        ankle: V(ankle[0], ankle[1], 0.1),
        foot: 55,
        kneePole: V(0, -1, 0.1),
        hand: V(sh[0] + B.fore * 0.92, 0.04, 0.12),
        elbowPole: V(-0.3, -1, 0.1),
        headBlend: 0,
      };
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
        hip,
        sh,
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
      return {
        hip,
        sh,
        ankle: V(-B.shin * 0.98, 0.08, 0.12),
        foot: 70,
        kneePole: V(0, -1, 0.1),
        hand: V(hand[0], hand[1], 0.07),
        elbowPole: V(0.3, -1, 0.6),
        headBlend: 0,
      };
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
      return {
        hip,
        sh,
        ankle: V(-B.shin * 0.98, 0.08, 0.12),
        foot: 70,
        kneePole: V(0, -1, 0.1),
        hand,
        elbowPole: V(-0.2, 1, 0.3),
        headBlend: 0,
      };
    },
  };
}

function deadBug(): Motion {
  return {
    phases: [
      [2, 0, 0.5, "Left arm, right leg", 0.9],
      [2, 0.5, 1, "Right arm, left leg", 0.9],
    ],
    load: "none",
    pose(B, d) {
      const hip = V(0.25, 0.13);
      const sh = torsoAt(B, hip, -90);
      const s = Math.sin(d * Math.PI * 2);
      const a = Math.max(0, s),
        b = Math.max(0, -s);
      const armUp = (k: number, z: number): Vec => add(V(sh[0], sh[1], z), lerpV(V(0.02, reach(B) * 0.95), V(-reach(B) * 0.93, 0.05), k));
      const knee = V(hip[0], hip[1] + B.thigh * 0.97);
      const legIn = (z: number): Vec => V(knee[0] + B.shin * 0.97, knee[1], z);
      const legOut = (z: number): Vec => V(hip[0] + legMax(B) * 0.97, 0.18, z);
      return {
        hip,
        sh,
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
      return {
        hip,
        sh,
        ankle: V(0.55, 0.15, 0.12),
        foot: -10,
        kneePole: V(0, 1, 0.1),
        hand: per(V(c[0], c[1], z - 0.04), V(c[0], c[1], z + 0.04)),
        elbowPole: V(0, -1, 0.5),
        headBlend: 0.3,
      };
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
      return {
        hip,
        sh,
        ankle: V(ankle[0], ankle[1], 0.12),
        foot: 80,
        kneePole: V(0, -1, 0.1),
        hand: V(hand[0], hand[1], 0.24),
        elbowPole: V(0, 1, 0.5),
        headBlend: 0,
      };
    },
  };
}

function stand(): Motion {
  return {
    phases: [
      [3, 0, 1, "", 0],
      [3, 1, 0, "", 0],
    ],
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

// ---------- cardio and conditioning (2026-11-11) ----------
/** Jumping jacks: feet jump out as the arms sweep overhead, and back in. */
function jumpingJack(): Motion {
  return {
    phases: [
      [0.35, 0, 1, "Out", 0.8],
      [0.35, 1, 0, "In", 0.8],
    ],
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const z = lerp(0.1, 0.34, d);
      const drop = Math.sqrt(Math.max(0.01, (legMax(B) * 0.98) ** 2 - (z - B.hipW) ** 2));
      const hip = V(0.02, ANKLE_H + drop + 0.03 * Math.sin(Math.PI * d));
      const sh = torsoAt(B, hip, 0);
      const phi = rad(lerp(12, 165, d));
      const r = reach(B) * 0.96;
      const hand = V(sh[0] + 0.03, sh[1] - Math.cos(phi) * r, B.shW + Math.sin(phi) * r);
      const ankle = per(V(0.03, ANKLE_H, -z), V(0.03, ANKLE_H, z));
      return { hip, sh, hand, ankle, kneePole: V(1, 0, 0.3), elbowPole: V(-0.2, -0.3, 1), headBlend: 1 };
    },
  };
}

/** Running or high knees: knees drive up in turn, arms swing opposite. `lift` is how high the knee comes. */
function run(o: { lift?: number; lean?: number } = {}): Motion {
  const lift = o.lift ?? 0.5;
  return {
    phases: [
      [0.32, 0, 1, "Drive", 0.9],
      [0.32, 1, 0, "Switch", 0.9],
    ],
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const hip = V(0.02, standY(B) + 0.02);
      const sh = torsoAt(B, hip, o.lean ?? 6);
      const up = (k: number, z: number): Vec =>
        V(lerp(0.0, 0.14 + 0.2 * lift, k), lerp(ANKLE_H + 0.01, ANKLE_H + B.thigh * 1.1 * lift, k), z);
      const ankle = per(up(d, -0.1), up(1 - d, 0.1));
      const arm = (k: number, sgn: number): Vec => {
        const a = lerp(-35, 45, k);
        const p = swing(side(B, sgn, sh), reach(B) * 0.82, a);
        return V(p[0], p[1] + 0.08, sgn * (B.shW + 0.06));
      };
      // The arm opposite the driving knee swings forward.
      return { hip, sh, ankle, hand: per(arm(1 - d, -1), arm(d, 1)), kneePole: V(1, 0.2, 0), elbowPole: V(-1, -0.4, 0.2), headBlend: 1 };
    },
  };
}

/** Mountain climbers: a high plank with the knees driving to the chest in turn. */
function mountainClimber(): Motion {
  const base = pushUp({});
  return {
    phases: [
      [0.4, 0, 1, "Drive", 1],
      [0.4, 1, 0, "Switch", 1],
    ],
    load: "none",
    stance: 0.1,
    grip: base.grip,
    pose(B, d) {
      const p = base.pose(B, 0);
      const back = p.ankle as Vec;
      const tuck = V(p.hip[0] - 0.08, 0.36, 0.12);
      const at = (k: number, sgn: number): Vec => {
        // An arc, so the knee clears the floor on its way forward.
        const v = lerpV(back, tuck, k);
        return V(v[0], v[1] + 0.15 * Math.sin(Math.PI * k), sgn * 0.11);
      };
      return { ...p, ankle: per(at(d, -1), at(1 - d, 1)), kneePole: V(1, -0.2, 0.1) };
    },
  };
}

/** Bear crawl: on hands and toes with the knees just off the floor, opposite hand and foot stepping together. */
function bearCrawl(): Motion {
  const stride = 0.2;
  const steps: Step[] = [];
  const pair = (a: Limb[], dx: number, label: string): Step => ({ limbs: a, by: V(dx, 0), label });
  for (let k = 0; k < 2; k++)
    steps.push(pair(["handR", "ankleL"], stride, "Crawl forward"), pair(["handL", "ankleR"], stride, "Crawl forward"));
  for (let k = 0; k < 2; k++)
    steps.push(pair(["handR", "ankleL"], -stride, "Crawl back"), pair(["handL", "ankleR"], -stride, "Crawl back"));
  return stepper(bearBase, steps, { dur: 0.5 });
}

// ---------- planks and crawls that move ----------
// Each of these used to borrow the forearm plank, the mountain climber or the in-place bear crawl, so a
// sideways plank walk showed a forearm plank holding still (Melvin, 2026-11-13). They share two bases (a high
// plank on the hands and a bear position with the knees hovering) and a stepper that moves hands and feet in turn.

type Limb = "handL" | "handR" | "ankleL" | "ankleR";
const LIMBS: Limb[] = ["handL", "handR", "ankleL", "ankleR"];

/** A pose with each hand and foot given per side, so a stepper can move one at a time. */
interface FourPoint {
  hip: Vec;
  sh: Vec;
  handL: Vec;
  handR: Vec;
  ankleL: Vec;
  ankleR: Vec;
  foot: number;
  kneePole: Vec;
  elbowPole: Vec;
  headBlend: number;
}

/** A straight-armed plank on the hands, feet hip-width, body in one line from heels to head. */
function highPlankBase(B: Body, ankleX?: number): FourPoint {
  const handY = 0.03;
  const ankleY = 0.11;
  const Lb = legMax(B) * 0.99 + B.torso;
  const shY = handY + reach(B) * 0.95;
  const th = Math.asin(clamp((shY - ankleY) / Lb, -1, 1));
  const ax = ankleX ?? 0.45 - Lb * Math.cos(th);
  const dir = V(Math.cos(th), Math.sin(th));
  const ankle = V(ax, ankleY);
  const hip = add(ankle, mul(dir, legMax(B) * 0.99));
  const sh = add(hip, mul(dir, B.torso));
  const hx = sh[0] + 0.02;
  return {
    hip,
    sh,
    handL: V(hx, handY, -0.22),
    handR: V(hx, handY, 0.22),
    ankleL: V(ax, ankleY, -0.1),
    ankleR: V(ax, ankleY, 0.1),
    foot: 90 - (th * 180) / Math.PI - 35,
    kneePole: V(0, -1, 0.1),
    elbowPole: V(-0.7, 0.6, 0.7),
    headBlend: 0,
  };
}

/** The forearm plank (`plank`), as a four-point pose with the feet at `ankleX`. */
function forearmPlankBase(B: Body, ankleX = -0.95): FourPoint {
  const p = plank().pose(B, 0);
  const dx = ankleX + 0.95;
  const hip = add(p.hip, V(dx, 0));
  const sh = add(p.sh, V(dx, 0));
  const a = p.ankle as Vec;
  const h = p.hand as Vec;
  return {
    hip,
    sh,
    handL: V(h[0] + dx, h[1], -0.12),
    handR: V(h[0] + dx, h[1], 0.12),
    ankleL: V(a[0] + dx, a[1], -0.1),
    ankleR: V(a[0] + dx, a[1], 0.1),
    foot: 55,
    kneePole: V(0, -1, 0.1),
    elbowPole: V(-0.3, -1, 0.1),
    headBlend: 0,
  };
}

/** On hands and toes with the knees hovering just off the floor, back flat. */
function bearBase(B: Body): FourPoint {
  const hipY = ANKLE_H + B.thigh * 0.92;
  const hip = V(0, hipY);
  const shY = 0.03 + reach(B) * 0.93;
  const lean = (Math.acos(clamp((shY - hipY) / B.torso, -1, 1)) * 180) / Math.PI;
  const sh = torsoAt(B, hip, lean);
  const toeX = -B.shin * 0.75;
  return {
    hip,
    sh,
    handL: V(sh[0] + 0.02, 0.03, -0.17),
    handR: V(sh[0] + 0.02, 0.03, 0.17),
    ankleL: V(toeX, 0.1, -0.12),
    ankleR: V(toeX, 0.1, 0.12),
    foot: 60,
    kneePole: V(1, -1, 0.1),
    elbowPole: V(-1, 0.2, 0.3),
    headBlend: 0.2,
  };
}

/** Keeps a hand or foot within reach of its shoulder or hip joint, pulling it in along the line between them. */
function within(from: Vec, to: Vec, l: number): Vec {
  const v = sub(to, from);
  const n = Math.hypot(v[0], v[1], v[2]);
  return n <= l ? to : add(from, mul(v, l / n));
}

/** Turns a four-point pose into the rig's pose, keeping every hand and foot within reach. */
function fourPose(B: Body, p: FourPoint): Pose {
  const hipJ = (s: number) => V(p.hip[0], p.hip[1], p.hip[2] + s * B.hipW);
  const shJ = (s: number) => V(p.sh[0], p.sh[1], p.sh[2] + s * B.shW);
  const leg = legMax(B) * 0.99;
  const arm = reach(B) * 0.995;
  return {
    hip: p.hip,
    sh: p.sh,
    hand: per(within(shJ(-1), p.handL, arm), within(shJ(1), p.handR, arm)),
    ankle: per(within(hipJ(-1), p.ankleL, leg), within(hipJ(1), p.ankleR, leg)),
    foot: p.foot,
    kneePole: per(V(p.kneePole[0], p.kneePole[1], -p.kneePole[2]), p.kneePole),
    elbowPole: per(V(p.elbowPole[0], p.elbowPole[1], -p.elbowPole[2]), p.elbowPole),
    headBlend: p.headBlend,
  };
}

/** One move of a stepper: these limbs travel `by` (the body follows by half for a pair, a quarter for one). */
interface Step {
  limbs: Limb[];
  by: Vec;
  label: string;
}

/**
 * Hands and feet stepping in turn and the body travelling with them. Each step is its own phase (d runs 0 to 1
 * across all of them), the moving hand or foot lifts in a small arc, and the steps add up to nothing, so the
 * figure ends where it began. The travel is centred, so the camera frames the whole walk.
 */
function stepper(base: (B: Body) => FourPoint, steps: Step[], o: { dur?: number; handLift?: number; footLift?: number } = {}): Motion {
  const n = steps.length;
  // where everything is before each step
  const keys: { body: Vec; off: Record<Limb, Vec> }[] = [];
  let body = V(0, 0);
  let off: Record<Limb, Vec> = { handL: V(0, 0), handR: V(0, 0), ankleL: V(0, 0), ankleR: V(0, 0) };
  for (const s of steps) {
    keys.push({ body, off });
    off = { ...off };
    for (const l of s.limbs) off[l] = add(off[l], s.by);
    body = add(body, mul(s.by, s.limbs.length / 4));
  }
  keys.push({ body, off });
  const lo = [0, 1, 2].map((a) => Math.min(...keys.map((k) => k.body[a]!)));
  const hi = [0, 1, 2].map((a) => Math.max(...keys.map((k) => k.body[a]!)));
  const centre = V((lo[0]! + hi[0]!) / 2, 0, (lo[2]! + hi[2]!) / 2);
  return {
    phases: steps.map((s, i): PhaseRow => [o.dur ?? 0.55, i / n, (i + 1) / n, s.label, 0.85]),
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const p = base(B);
      const x = clamp(d, 0, 1) * n;
      const i = Math.min(n - 1, Math.floor(x));
      const t = x - i;
      const a = keys[i]!;
      const b = keys[i + 1]!;
      const arc = Math.sin(Math.PI * t);
      const moving = new Set(steps[i]!.limbs);
      const shift = sub(lerpV(a.body, b.body, t), centre);
      const out: FourPoint = { ...p, hip: add(p.hip, shift), sh: add(p.sh, shift) };
      for (const l of LIMBS) {
        const at = add(p[l], lerpV(a.off[l], b.off[l], t));
        const lift = moving.has(l) ? arc * (l.startsWith("hand") ? (o.handLift ?? 0.07) : (o.footLift ?? 0.05)) : 0;
        out[l] = add(sub(at, V(centre[0], 0, centre[2])), V(0, lift));
      }
      return fourPose(B, out);
    },
  };
}

/** `count` steps of a side-by-side pair (same-side hand and foot lead, the others follow), then back again. */
function sidewaysSteps(stride: number, count: number, labels: [string, string]): Step[] {
  const go = (sgn: number, label: string): Step[] => {
    const lead = sgn > 0 ? "R" : "L";
    const trail = sgn > 0 ? "L" : "R";
    const by = V(0, 0, sgn * stride);
    return [
      { limbs: [`hand${lead}`, `ankle${lead}`] as Limb[], by, label },
      { limbs: [`hand${trail}`, `ankle${trail}`] as Limb[], by, label },
    ];
  };
  const steps: Step[] = [];
  for (let k = 0; k < count; k++) steps.push(...go(1, labels[0]));
  for (let k = 0; k < count; k++) steps.push(...go(-1, labels[1]));
  return steps;
}

/** Sideways plank walk: high plank, a hand and the foot on the same side step out together, the others follow, hips level; then back. */
function lateralPlankWalk(): Motion {
  return stepper(highPlankBase, sidewaysSteps(0.2, 3, ["Walk right", "Walk back"]), { handLift: 0.06, footLift: 0.04 });
}

/** Sideways bear crawl: the bear position travelling to the side and back, knees hovering. */
function lateralBearCrawl(): Motion {
  return stepper(bearBase, sidewaysSteps(0.2, 3, ["Crawl right", "Crawl back"]), { dur: 0.5 });
}

/** Backward bear crawl: opposite hand and foot step back together, two strides, then forward to the start. */
function backwardBearCrawl(): Motion {
  const stride = 0.18;
  const steps: Step[] = [];
  const pair = (a: Limb[], dx: number, label: string): Step => ({ limbs: a, by: V(dx, 0), label });
  for (let k = 0; k < 2; k++)
    steps.push(pair(["handL", "ankleR"], -stride, "Crawl back"), pair(["handR", "ankleL"], -stride, "Crawl back"));
  for (let k = 0; k < 2; k++) steps.push(pair(["handL", "ankleR"], stride, "Return"), pair(["handR", "ankleL"], stride, "Return"));
  return stepper(bearBase, steps, { dur: 0.5 });
}

/** A still hold of a four-point pose, breathing. */
function fourHold(base: (B: Body) => FourPoint): Motion {
  return {
    phases: TEMPO.hold(),
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const p = base(B);
      return fourPose(B, { ...p, hip: add(p.hip, V(0, 0.01 * d)) });
    },
  };
}

/** Plank jacks: high plank, the feet jump wide and back together, hips staying low. */
function plankJack(): Motion {
  return {
    phases: [
      [0.45, 0, 1, "Jump out", 1],
      [0.45, 1, 0, "Jump in", 1],
    ],
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const p = highPlankBase(B);
      const hop = Math.sin(Math.PI * d) * 0.04;
      const z = lerp(0.1, 0.42, d);
      return fourPose(B, {
        ...p,
        hip: add(p.hip, V(0, hop * 0.5)),
        ankleL: V(p.ankleL[0], p.ankleL[1] + hop, -z),
        ankleR: V(p.ankleR[0], p.ankleR[1] + hop, z),
      });
    },
  };
}

/** Shoulder taps: from a high plank or bear position, each hand taps the other shoulder in turn while the hips stay square. */
function shoulderTaps(base: (B: Body) => FourPoint): Motion {
  // the tap lands on the front of the other shoulder
  return oneHand(base, (B, p, sgn) => V(p.sh[0] - 0.04, p.sh[1] - 0.09, -sgn * B.shW * 0.85), "Tap");
}

/**
 * One hand leaves the floor and goes to `target`, then back, then the other hand (shoulder taps, reaches,
 * pull-throughs). The body leans a little onto the standing hand.
 */
function oneHand(base: (B: Body) => FourPoint, target: (B: Body, p: FourPoint, sgn: number) => Vec, label: string, dur = 0.8): Motion {
  return {
    phases: [
      [dur, 0, 0.5, label, 0.8],
      [dur, 0.5, 1, label, 0.8],
    ],
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const p = base(B);
      const left = d < 0.5;
      const k = Math.sin(Math.PI * (left ? d * 2 : d * 2 - 1));
      const sgn = left ? -1 : 1; // the moving hand's side
      const hand: Limb = left ? "handL" : "handR";
      const lean = V(0, 0, -sgn * 0.03 * k);
      const out: FourPoint = { ...p, hip: add(p.hip, mul(lean, 0.5)), sh: add(p.sh, lean) };
      out[hand] = add(lerpV(p[hand], add(target(B, p, sgn), lean), k), V(0, 0.05 * Math.sin(Math.PI * k)));
      return fourPose(B, out);
    },
  };
}

/** Plank up-downs: forearms to hands one arm at a time, then back down, feet planted. */
function plankUpDown(): Motion {
  const ankleX = -0.95;
  return {
    phases: [
      [0.6, 0, 0.25, "Up", 1],
      [0.6, 0.25, 0.5, "Up", 1],
      [0.6, 0.5, 0.75, "Down", 0.7],
      [0.6, 0.75, 1, "Down", 0.7],
    ],
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const seg = (a: number) => clamp((d - a) / 0.25, 0, 1);
      const sL = d < 0.5 ? seg(0) : 1 - seg(0.5);
      const sR = d < 0.5 ? seg(0.25) : 1 - seg(0.75);
      const low = forearmPlankBase(B, ankleX);
      const high = highPlankBase(B, ankleX);
      const m = (sL + sR) / 2;
      // the body pivots about the toes from the forearm height to the straight-arm height
      const shY = lerp(low.sh[1], high.sh[1], m);
      const Lb = legMax(B) * 0.99 + B.torso;
      const ankle = V(ankleX, 0.11);
      const th = Math.asin(clamp((shY - ankle[1]) / Lb, -1, 1));
      const dir = V(Math.cos(th), Math.sin(th));
      const hip = add(ankle, mul(dir, legMax(B) * 0.99));
      const sh = add(hip, mul(dir, B.torso));
      const handAt = (s: number, z: number): Vec => {
        const forearm = V(sh[0] + B.fore * 0.92, 0.04, z * 0.12);
        const straight = V(sh[0] + 0.02, 0.03, z * 0.22);
        return add(lerpV(forearm, straight, s), V(0, 0.06 * Math.sin(Math.PI * s)));
      };
      const pole = (s: number, z: number): Vec => lerpV(V(-0.3, -1, z * 0.1), V(-0.7, 0.6, z * 0.7), s);
      const pose = fourPose(B, { ...low, hip, sh, handL: handAt(sL, -1), handR: handAt(sR, 1), foot: lerp(low.foot, high.foot, m) });
      return { ...pose, elbowPole: per(pole(sL, -1), pole(sR, 1)) };
    },
  };
}

/** Plank leg lifts: forearm plank, one straight leg lifts behind and lowers, then the other. */
function plankLegLift(): Motion {
  return {
    phases: [
      [0.9, 0, 0.5, "Lift", 0.8],
      [0.9, 0.5, 1, "Lift", 0.8],
    ],
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const p = forearmPlankBase(B);
      const left = d < 0.5;
      const k = Math.sin(Math.PI * (left ? d * 2 : d * 2 - 1));
      const leg: Limb = left ? "ankleL" : "ankleR";
      const hipJ = V(p.hip[0], p.hip[1], left ? -B.hipW : B.hipW);
      const v = sub(p[leg], hipJ);
      // swing the leg up about the hip, keeping its length
      const a = rad(22 * k);
      const up = V(v[0] * Math.cos(a) + v[1] * Math.sin(a), v[1] * Math.cos(a) - v[0] * Math.sin(a), v[2]);
      const out: FourPoint = { ...p };
      out[leg] = add(hipJ, up);
      return fourPose(B, out);
    },
  };
}

/** Plank saw: forearm plank, the whole body rocks back over the elbows on the toes and forward again. */
function plankSaw(): Motion {
  return {
    phases: [
      [1.2, 0, 1, "Saw back", 0.9],
      [1.2, 1, 0, "Pull forward", 0.9],
    ],
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const p = forearmPlankBase(B);
      const back = V(-0.15 * d, 0);
      return fourPose(B, {
        ...p,
        hip: add(p.hip, back),
        sh: add(p.sh, back),
        ankleL: add(p.ankleL, back),
        ankleR: add(p.ankleR, back),
        foot: 55 + 18 * d,
      });
    },
  };
}

// ---------- push-up variations (audit batch 3) ----------
// Clap, spiderman, archer, one-arm, typewriter, shoulder-tap and hand-release push-ups all played the plain
// push-up, and ring flys and bodyweight skull crushers played push-ups too (Melvin, 2026-11-14 audit).

/** A pose's hands as left and right. */
function handsLR(p: Pose): { L: Vec; R: Vec } {
  const h = p.hand;
  if (typeof h === "object" && "L" in h) return h;
  const v = h as Vec;
  return { L: V(v[0], v[1], -Math.abs(v[2])), R: V(v[0], v[1], Math.abs(v[2])) };
}
function anklesLR(p: Pose): { L: Vec; R: Vec } {
  const a = (p.ankle ?? V(0, ANKLE_H, 0.1)) as Vec | { L: Vec; R: Vec };
  if ("L" in a) return a;
  return { L: V(a[0], a[1], -Math.abs(a[2])), R: V(a[0], a[1], Math.abs(a[2])) };
}

/** Two push-ups, the first doing something on the left and the second on the right: `side` gets the depth, the side's sign and how far into its extra it is. */
function twoSided(base: Motion, labels: [string, string], side: (B: Body, depth: number, sgn: number, k: number) => Pose): Motion {
  return {
    ...base,
    phases: [
      [1.0, 0, 0.5, labels[0], 0.6],
      [0.7, 0.5, 1, labels[1], 1],
      [1.0, 1, 1.5, labels[0], 0.6],
      [0.7, 1.5, 2, labels[1], 1],
    ],
    pose(B, d) {
      const u = clamp(d, 0, 2);
      const first = u <= 1;
      const r = first ? u : u - 1;
      const depth = r <= 0.5 ? r * 2 : 2 - r * 2;
      return side(B, depth, first ? -1 : 1, depth);
    },
  };
}

function clapPushUp(): Motion {
  const base = pushUp({});
  return {
    ...base,
    phases: [
      [0.4, 0, 0, "Plank", 0.4],
      [0.9, 0, 1, "Lower", 0.6],
      [0.4, 1, -0.3, "Explode", 1],
      [0.35, -0.3, 0, "Clap and catch", 0.7],
    ],
    pose(B, d) {
      const p = base.pose(B, d);
      if (d >= 0) return p;
      // in the air: the hands leave the floor and clap in front of the chest
      const k = Math.sin((Math.PI / 2) * Math.min(1, -d / 0.3));
      const { L, R } = handsLR(p);
      const clap = (sgn: number): Vec => V(p.sh[0] + 0.12, p.sh[1] - 0.22, sgn * 0.04);
      return { ...p, hand: per(lerpV(L, clap(-1), k), lerpV(R, clap(1), k)), elbowPole: V(-0.4, -0.2, 1) };
    },
  };
}

function spidermanPushUp(): Motion {
  const base = pushUp({});
  return twoSided(base, ["Lower, knee to elbow", "Push"], (B, depth, sgn, k) => {
    const p = base.pose(B, depth);
    const a = anklesLR(p);
    const knee = V(p.hip[0] - 0.12, p.hip[1] - 0.12, sgn * 0.42);
    const moving = lerpV(sgn < 0 ? a.L : a.R, knee, k);
    return {
      ...p,
      ankle: sgn < 0 ? per(moving, a.R) : per(a.L, moving),
      kneePole: sgn < 0 ? per(V(0.6, 0.2, -1), V(0, -1, 0.1)) : per(V(0, -1, -0.1), V(0.6, 0.2, 1)),
    };
  });
}

function archerPushUp(o: { rings?: boolean }): Motion {
  const base = pushUp({ width: 0.34, rings: o.rings });
  return twoSided(base, ["Lower to one side", "Push"], (B, depth, sgn) => {
    const p = base.pose(B, depth);
    const s = V(0, 0, sgn * 0.2 * depth);
    return { ...p, hip: add(p.hip, mul(s, 0.4)), sh: add(p.sh, s), hand: handsLR(p), elbowPole: per(V(-0.3, 0.4, -1), V(-0.3, 0.4, 1)) };
  });
}

function typewriterPushUp(): Motion {
  const base = pushUp({ width: 0.34 });
  return {
    ...base,
    phases: [
      [1.0, 0, 0.25, "Lower", 0.6],
      [1.6, 0.25, 0.75, "Slide across", 0.9],
      [0.8, 0.75, 1, "Push", 1],
    ],
    pose(B, d) {
      const u = clamp(d, 0, 1) * 4;
      const depth = u < 1 ? u : u > 3 ? 4 - u : 1;
      const shift = u > 1 && u < 3 ? 0.2 * Math.sin(Math.PI * (u - 1)) : 0;
      const p = base.pose(B, depth);
      const s = V(0, 0, shift);
      return { ...p, hip: add(p.hip, mul(s, 0.4)), sh: add(p.sh, s), hand: handsLR(p), elbowPole: per(V(-0.3, 0.4, -1), V(-0.3, 0.4, 1)) };
    },
  };
}

function oneArmPushUp(): Motion {
  const base = pushUp({ width: 0.14 });
  return {
    ...base,
    pose(B, d) {
      const p = base.pose(B, d);
      const { R } = handsLR(p);
      // the free hand rests on the lower back, feet wide for balance
      const back = V(p.hip[0] + 0.12, p.hip[1] + 0.1, -0.08);
      const a = anklesLR(p);
      return {
        ...p,
        sh: add(p.sh, V(0, 0, 0.06)),
        hand: per(back, R),
        ankle: per(
          within(V(p.hip[0], p.hip[1], -B.hipW), V(a.L[0], a.L[1], -0.4), legMax(B) * 0.99),
          within(V(p.hip[0], p.hip[1], B.hipW), V(a.R[0], a.R[1], 0.4), legMax(B) * 0.99),
        ),
        elbowPole: per(V(-0.4, 1, -0.6), V(-1, 0.3, 0.4)),
      };
    },
  };
}

function shoulderTapPushUp(): Motion {
  const base = pushUp({});
  return {
    ...base,
    phases: [
      [1.0, 0, 1, "Lower", 0.6],
      [0.7, 1, 0, "Push", 1],
      [0.6, 0, -1, "Tap", 0.7],
      [0.6, -1, -2, "Tap", 0.7],
    ],
    pose(B, d) {
      if (d >= 0) return base.pose(B, d);
      const p = base.pose(B, 0);
      const left = d > -1;
      const k = Math.sin(Math.PI * (left ? -d : -d - 1));
      const { L, R } = handsLR(p);
      const sgn = left ? -1 : 1;
      const tap = V(p.sh[0] - 0.04, p.sh[1] - 0.09, -sgn * B.shW * 0.85);
      const move = (h: Vec) => add(lerpV(h, tap, k), V(0, 0.05 * Math.sin(Math.PI * k)));
      return { ...p, hand: left ? per(move(L), R) : per(L, move(R)) };
    },
  };
}

function handReleasePushUp(): Motion {
  const base = pushUp({});
  return {
    ...base,
    phases: [
      [1.0, 0, 1, "Lower to the floor", 0.6],
      [0.5, 1, 1.4, "Hands off", 0.5],
      [0.3, 1.4, 1, "Hands down", 0.5],
      [0.8, 1, 0, "Push", 1],
    ],
    pose(B, d) {
      if (d <= 1) return base.pose(B, d);
      const p = base.pose(B, 1);
      const k = (d - 1) / 0.4;
      const { L, R } = handsLR(p);
      const up = (h: Vec, sgn: number) => add(h, V(-0.05 * k, 0.1 * k, sgn * 0.12 * k));
      return { ...p, sh: add(p.sh, V(0, -0.04 * k)), hand: per(up(L, -1), up(R, 1)), elbowPole: V(-0.2, 1, 0.6) };
    },
  };
}

/** Ring fly: a push-up position on the rings, the arms opening wide as the chest lowers, nearly straight. */
function ringFly(): Motion {
  const base = pushUp({ rings: true, width: 0.22 });
  return {
    ...base,
    phases: TEMPO.lowerFirst("Open · 2s", "Squeeze · 1s", "Top", "Stretch"),
    pose(B, d) {
      const top = base.pose(B, 0);
      const p = base.pose(B, d * 0.75);
      const hz = lerp(0.22, 0.62, d);
      const hy = handsLR(top).R[1] + 0.06 * d;
      const hx = handsLR(top).R[0];
      return { ...p, hand: per(V(hx, hy, -hz), V(hx, hy, hz)), elbowPole: per(V(-0.2, 1, -0.3), V(-0.2, 1, 0.3)) };
    },
  };
}

/**
 * Bodyweight skull crusher on a bar (or the rings): leaning into the bar with straight arms out in front,
 * the elbows bend and the head dips under the hands, body straight from the heels.
 */
function bodyweightSkullCrusher(o: { rings?: boolean }): Motion {
  const ankle = V(-0.6, 0.11);
  /** Where the hands hold the bar: arms straight from the top position, a little above level. */
  const barAt = (B: Body): Vec => {
    const Lb = legMax(B) * 0.99 + B.torso;
    const top = add(ankle, V(Math.cos(rad(35)) * Lb, Math.sin(rad(35)) * Lb));
    return add(top, V(Math.cos(rad(-10)) * reach(B) * 0.97, Math.sin(rad(-10)) * reach(B) * 0.97));
  };
  return {
    phases: TEMPO.lowerFirst("Bend the elbows · 2s", "Extend · 1s", "Arms long", "Head under"),
    load: "none",
    stance: 0.1,
    grip: 0.12,
    pose(B, d) {
      const Lb = legMax(B) * 0.99 + B.torso;
      const at = (deg: number) => add(ankle, V(Math.cos(rad(deg)) * Lb, Math.sin(rad(deg)) * Lb));
      const hand = barAt(B);
      const th = lerp(35, 27, d);
      const sh = at(th);
      const dir = norm(sub(sh, ankle));
      const hip = add(ankle, mul(dir, legMax(B) * 0.99));
      return {
        hip,
        sh,
        ankle: V(ankle[0], ankle[1], 0.12),
        foot: 90 - th - 30,
        kneePole: V(0, -1, 0.1),
        hand: V(hand[0], hand[1], 0.12),
        elbowPole: V(1, -0.5, 0.15),
        headBlend: 0,
      };
    },
    props: o.rings ? undefined : (B) => [rail(add(barAt(B), V(0, 0.02)), 1.2, "z")],
  };
}

// ---------- floor positions (audit batch 2) ----------

/** Holds a moving motion still at `at`, breathing (an incline plank is the top of an incline push-up). */
function holdAt(m: Motion, at: number, label = "Hold · breathe"): Motion {
  return {
    ...m,
    phases: TEMPO.hold(label),
    pose(B, d) {
      const p = m.pose(B, at);
      return { ...p, hip: add(p.hip, V(0, 0.01 * d)) };
    },
  };
}

/** Reverse plank: face up, straight arms under the shoulders behind, body in one line to the heels. */
function reversePlankBase(B: Body): FourPoint {
  const shY = 0.03 + reach(B) * 0.95;
  const Lb = legMax(B) * 0.99 + B.torso;
  const th = Math.asin(clamp((shY - ANKLE_H) / Lb, -1, 1));
  const sh = V(0, shY);
  const dir = V(Math.cos(th), -Math.sin(th));
  const hip = add(sh, mul(dir, B.torso));
  const ankle = add(sh, mul(dir, Lb));
  return {
    hip,
    sh,
    handL: V(-0.04, 0.03, -0.2),
    handR: V(-0.04, 0.03, 0.2),
    ankleL: V(ankle[0], ANKLE_H, -0.1),
    ankleR: V(ankle[0], ANKLE_H, 0.1),
    foot: -55,
    kneePole: V(0, 1, 0.1),
    elbowPole: V(-0.2, 0, 1),
    headBlend: 0.6,
  };
}

/** Bridge walkouts and slider leg curls: hips up in a bridge, the heels walk (or slide) out until the legs are nearly straight, then back. */
function bridgeWalkout(o: { slide?: boolean }): Motion {
  const steps = o.slide ? 2 : 8;
  const phases: PhaseRow[] = o.slide
    ? [
        [1.4, 0, 0.5, "Slide out", 0.8],
        [1.0, 0.5, 1, "Curl in", 1],
      ]
    : Array.from({ length: steps }, (_, i): PhaseRow => [0.5, i / steps, (i + 1) / steps, i < steps / 2 ? "Walk out" : "Walk in", 0.85]);
  return {
    phases,
    load: "none",
    stance: 0.15,
    pose(B, d) {
      const shAt = V(-0.3, 0.13);
      // how far out each heel is (0 in, 1 out); walkouts move one foot per step
      let kL: number,
        kR: number,
        lifting: "L" | "R" | null = null,
        t = 0;
      if (o.slide) kL = kR = Math.sin(Math.PI * clamp(d, 0, 1));
      else {
        const x = clamp(d, 0, 1) * steps;
        const i = Math.min(steps - 1, Math.floor(x));
        t = x - i;
        const at = (j: number, f: number) => {
          // feet take turns, a quarter of the way per step: out on the first half, in on the second
          const out = Math.min(j, steps / 2);
          const back = Math.max(0, j - steps / 2);
          const moves = (n: number) => Math.floor((n + (f ? 0 : 1)) / 2);
          return (moves(out) - moves(back)) / (steps / 4);
        };
        const moving = i % 2 === 0 ? "L" : "R";
        lifting = moving;
        const k0L = at(i, 0),
          k1L = at(i + 1, 0),
          k0R = at(i, 1),
          k1R = at(i + 1, 1);
        kL = lerp(k0L, k1L, t);
        kR = lerp(k0R, k1R, t);
      }
      const k = (kL + kR) / 2;
      const a = lerp(28, 12, k);
      const hip = add(shAt, V(Math.cos(rad(a)) * B.torso, Math.sin(rad(a)) * B.torso));
      const base = shAt[0] + B.torso + B.thigh * 0.95;
      const leg = legMax(B) * 0.99;
      const heel = (kk: number, sgn: number, f: "L" | "R"): Vec =>
        within(
          V(hip[0], hip[1], sgn * B.hipW),
          V(base + 0.42 * kk, ANKLE_H + (lifting === f ? 0.05 * Math.sin(Math.PI * t) : 0), sgn * 0.16),
          leg,
        );
      return {
        hip,
        sh: shAt,
        ankle: per(heel(kL, -1, "L"), heel(kR, 1, "R")),
        foot: lerp(0, -45, k),
        kneePole: V(0.2, 1, 0.3),
        hand: V(shAt[0] + 0.25, 0.04, B.shW + 0.08),
        elbowPole: V(0, 1, 0.5),
        headBlend: 0,
      };
    },
  };
}

/** Lying on the left side (built standing, rolled flat): leg raises, bottom-leg adduction and clamshells. */
function sideLying(kind: "raise" | "adduct" | "clam"): Motion {
  return {
    phases:
      kind === "clam"
        ? TEMPO.liftFirst("Open · 1s", "Close · 2s", "Knees together", "Squeeze")
        : TEMPO.liftFirst("Lift · 1s", "Lower · 2s", "Set", "Squeeze"),
    load: "none",
    stance: 0.06,
    pose(B, d) {
      const hip = V(0, standY(B, 0));
      const sh = torsoAt(B, hip, 0);
      const leg = legMax(B) * 0.99;
      const hipJ = (sgn: number) => V(hip[0], hip[1], sgn * B.hipW);
      // the bottom arm reaches overhead under the head, the top hand rests on the floor in front of the chest
      const hand = per(V(0.04, sh[1] + 0.3, -0.24), V(sh[0] + 0.28, sh[1] - 0.22, -0.12));
      const elbowPole = per(V(0.2, 0.4, -1), V(0.6, -0.4, 0.6));
      if (kind === "clam") {
        const ankle = (sgn: number) => V(0, hip[1] - B.thigh * 1.15, sgn * 0.05);
        return {
          hip,
          sh,
          ankle: per(ankle(-1), ankle(1)),
          kneePole: per(V(1, 0, -0.1), lerpV(V(1, 0, 0.1), V(0.3, 0, 1), d)),
          hand,
          elbowPole,
          headBlend: 0,
        };
      }
      if (kind === "raise") {
        const up = within(hipJ(1), V(0, ANKLE_H, lerp(0.06, 0.5, d)), leg);
        return { hip, sh, ankle: per(V(0, ANKLE_H, -0.06), up), kneePole: V(1, 0, 0.1), hand, elbowPole, headBlend: 0 };
      }
      // adduction: the top foot plants in front of the bottom knee and the bottom leg lifts towards the ceiling
      const bottom = within(hipJ(-1), V(0, ANKLE_H, lerp(-0.06, 0.18, d)), leg);
      return {
        hip,
        sh,
        ankle: per(bottom, V(0.42, hip[1] - 0.55, -0.14)),
        kneePole: per(V(1, 0, -0.1), V(1, 0.3, 0.6)),
        hand,
        elbowPole,
        headBlend: 0,
      };
    },
    roll: () => -90,
  };
}

/** Plank on the forearms and knees. */
function kneePlankBase(B: Body): FourPoint {
  const p = forearmPlankBase(B);
  const L = B.thigh * 0.99 + B.torso;
  const kneeY = 0.07;
  const th = Math.asin(clamp((p.sh[1] - kneeY) / L, -1, 1));
  const knee = sub(p.sh, mul(V(Math.cos(th), Math.sin(th)), L));
  const hip = add(knee, mul(V(Math.cos(th), Math.sin(th)), B.thigh * 0.99));
  const ankleX = knee[0] - B.shin * 0.95;
  return { ...p, hip, ankleL: V(ankleX, 0.09, -0.1), ankleR: V(ankleX, 0.09, 0.1), foot: 70, kneePole: V(0, -1, 0.1) };
}

/** Planche lean: a straight-arm plank with the shoulders pushed forward past the hands, up on the toes. */
function plancheLeanBase(B: Body): FourPoint {
  const p = highPlankBase(B);
  const f = V(0.15, 0);
  return { ...p, hip: add(p.hip, f), sh: add(p.sh, f), ankleL: add(p.ankleL, f), ankleR: add(p.ankleR, f), foot: p.foot + 20 };
}

/** Balances on the hands with the knees tucked: the tuck planche (straight arms, hips level) and the frog stand (knees on the elbows). */
function tuckBalance(kind: "planche" | "frog"): Motion {
  return {
    phases: TEMPO.hold("Balance · breathe"),
    load: "none",
    stance: 0.12,
    pose(B, d) {
      const frog = kind === "frog";
      const sh = frog ? V(0.14, 0.36) : V(0.14, 0.03 + reach(B) * 0.92);
      const tilt = frog ? -30 : -6; // the torso's slope from shoulders back to hips (negative: hips higher)
      const dir = V(-Math.cos(rad(tilt)), -Math.sin(rad(tilt)));
      const hip = add(add(sh, mul(dir, B.torso)), V(0, 0.01 * d));
      // knees tucked forward under the chest (resting on the elbows in the frog stand), feet tucked under the hips
      const ankle = (sgn: number): Vec => V(hip[0] + (frog ? -0.06 : 0.02), hip[1] - (frog ? 0.14 : 0.28), sgn * (frog ? 0.22 : 0.09));
      return {
        hip,
        sh,
        ankle: per(ankle(-1), ankle(1)),
        foot: 40,
        kneePole: frog ? per(V(0.4, -1, -0.7), V(0.4, -1, 0.7)) : V(1, -0.2, 0.1),
        hand: V(0, 0.03, 0.22),
        elbowPole: frog ? V(-1, 0.2, 0.6) : V(-1, 0.3, 0.3),
        headBlend: 0.3,
      };
    },
  };
}

/** Plank hip twist: forearm plank, the hips rock down towards the floor on one side, then the other. */
function plankHipTwist(): Motion {
  return {
    phases: [
      [0.9, 0, 0.5, "Twist", 0.8],
      [0.9, 0.5, 1, "Twist", 0.8],
    ],
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const p = forearmPlankBase(B);
      const sgn = d < 0.5 ? -1 : 1;
      const k = Math.sin(Math.PI * (d < 0.5 ? d * 2 : d * 2 - 1));
      const moved = add(p.hip, V(0, -0.1 * k, sgn * 0.14 * k));
      const hip = add(p.sh, mul(norm(sub(moved, p.sh)), B.torso));
      const roll = V(0, 0, sgn * 0.1 * k);
      return fourPose(B, { ...p, hip, ankleL: add(p.ankleL, roll), ankleR: add(p.ankleR, roll) });
    },
  };
}

/** A handstand on straight arms, body stacked over the hands. */
function handstandBase(B: Body, drop = 0): FourPoint {
  const sh = V(0, 0.03 + reach(B) * 0.97 - drop);
  const hip = add(sh, V(0, B.torso));
  const ay = hip[1] + legMax(B) * 0.99;
  return {
    hip,
    sh,
    handL: V(0.02, 0.03, -0.22),
    handR: V(0.02, 0.03, 0.22),
    ankleL: V(0, ay, -0.07),
    ankleR: V(0, ay, 0.07),
    foot: -90,
    kneePole: V(1, 0, 0.1),
    elbowPole: V(-1, 0, 0.4),
    headBlend: 0,
  };
}
const wallBehind = (): Prop[] => [{ kind: "box", at: V(-0.28, 1.3), size: V(0.08, 2.6, 1.6) }];

function handstandPushUp(): Motion {
  return {
    phases: TEMPO.lowerFirst("Lower · 2s", "Press · 1s", "Stack", "Head down"),
    load: "none",
    stance: 0.1,
    pose: (B, d) => fourPose(B, handstandBase(B, d * (reach(B) * 0.97 - 0.26))),
    props: wallBehind,
  };
}

/** Wall walk: from a push-up with the feet at the wall, the feet walk up the wall and the hands walk in, then back down. */
function wallWalk(): Motion {
  const W = -1.25;
  const n = 8;
  // each segment the left foot, right foot, left hand and right hand step in turn
  const WINDOW = { ankleL: 0, ankleR: 0.25, handL: 0.5, handR: 0.75 } as const;
  return {
    phases: Array.from({ length: n }, (_, i): PhaseRow => [
      0.8,
      i / n,
      (i + 1) / n,
      i < n / 2 ? "Walk the feet up, hands in" : "Walk the hands out, feet down",
      i < n / 2 ? 1 : 0.7,
    ]),
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const x = clamp(d, 0, 1) * n;
      const i = Math.min(n - 1, Math.floor(x));
      const t = x - i;
      const level = (j: number) => (j <= n / 2 ? j : n - j) / (n / 2);
      const r = reach(B) * 0.97;
      const Lb = legMax(B) * 0.99 + B.torso;
      // the body at level k: 0 a plank with the feet on the wall low, 1 a handstand nose to the wall
      const at = (k: number) => {
        const th = rad(lerp(12, 72, k));
        const beta = rad(lerp(90, 80, k));
        const handX = W + 0.1 + Lb * Math.cos(th) + r * Math.cos(beta);
        const sh = V(handX - r * Math.cos(beta), 0.03 + r * Math.sin(beta));
        const dir = V(-Math.cos(th), Math.sin(th));
        return { th, handX, sh, dir, footY: sh[1] + Lb * Math.sin(th) };
      };
      const body = at(lerp(level(i), level(i + 1), t));
      const hip = add(body.sh, mul(body.dir, B.torso));
      const limb = (l: keyof typeof WINDOW) => {
        const u = clamp((t - WINDOW[l]) / 0.25, 0, 1);
        return { k: lerp(level(i), level(i + 1), ease(u)), lift: Math.sin(Math.PI * u) };
      };
      const foot = (l: "ankleL" | "ankleR", z: number): Vec => {
        const { k, lift } = limb(l);
        return within(V(hip[0], hip[1], z), V(W + 0.1 + 0.06 * lift, at(k).footY, z), legMax(B) * 0.99);
      };
      const hand = (l: "handL" | "handR", z: number): Vec => {
        const { k, lift } = limb(l);
        return within(V(body.sh[0], body.sh[1], z), V(at(k).handX, 0.03 + 0.06 * lift, z), r);
      };
      return fourPose(B, {
        hip,
        sh: body.sh,
        handL: hand("handL", -0.22),
        handR: hand("handR", 0.22),
        ankleL: foot("ankleL", -0.1),
        ankleR: foot("ankleR", 0.1),
        // the balls of the feet on the wall, toes pointing down it
        foot: 90 + (body.th * 180) / Math.PI - 35,
        kneePole: V(0, -1, 0.1),
        elbowPole: V(-0.7, 0.6, 0.7),
        headBlend: 0,
      });
    },
    props: () => [{ kind: "box", at: V(W - 0.04, 1.2), size: V(0.08, 2.4, 1.6) }],
  };
}

/** The pike (hips high, legs and arms straight) from the pike push-up, as a four-point pose. */
function pikeBase(B: Body): FourPoint {
  const p = pikePushUp().pose(B, 0);
  const a = p.ankle as Vec;
  const h = p.hand as Vec;
  return {
    hip: p.hip,
    sh: p.sh,
    handL: V(h[0], h[1], -h[2]),
    handR: h,
    ankleL: V(a[0], a[1], -a[2]),
    ankleR: a,
    foot: 30,
    kneePole: V(0, -1, 0.1),
    elbowPole: V(-0.8, 0.4, 0.5),
    headBlend: 0,
  };
}

/**
 * From a high plank, the hips drive up into a pike and come back down, hands planted. The feet roll in on
 * the toes (plank to pike) or slide further in towards the hands on sliders.
 */
function plankToPike(o: { slide?: boolean }): Motion {
  return {
    phases: TEMPO.liftFirst(o.slide ? "Pike · 1s" : "Hips up · 1s", "Back to plank · 2s", "Plank", "Pike"),
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const p = highPlankBase(B);
      const hand = V(p.handR[0], 0.03);
      const leg = legMax(B) * 0.99;
      const ankle = V(p.ankleR[0] + (o.slide ? 0.5 : 0.3) * d, 0.11);
      // the shoulders swing back over the hands as the arms line up with the torso
      const a = rad(lerp(2, 32, d));
      const r = reach(B) * 0.95;
      const sh = add(hand, V(-Math.sin(a) * r - 0.02, Math.cos(a) * r));
      // the hip sits where the torso and the legs meet, on the high side
      const dx = ankle[0] - sh[0],
        dy = ankle[1] - sh[1];
      const D = Math.max(1e-6, Math.hypot(dx, dy));
      const dd = clamp(D, Math.abs(B.torso - leg) + 1e-4, B.torso + leg - 1e-4);
      const along = (B.torso * B.torso - leg * leg + dd * dd) / (2 * dd);
      const h = Math.sqrt(Math.max(0, B.torso * B.torso - along * along));
      const ux = dx / D,
        uy = dy / D;
      let hip = V(sh[0] + ux * along - uy * h, sh[1] + uy * along + ux * h);
      if (hip[1] < sh[1] + uy * along - ux * h) hip = V(sh[0] + ux * along + uy * h, sh[1] + uy * along - ux * h);
      return fourPose(B, {
        ...p,
        hip,
        sh,
        ankleL: V(ankle[0], ankle[1], -0.1),
        ankleR: V(ankle[0], ankle[1], 0.1),
        foot: lerp(p.foot, 25, d),
      });
    },
  };
}

/** Hindu push-up: from a pike, swoop the chest down between the hands and up into an upward dog, then push back to the pike. */
function hinduPushUp(): Motion {
  // shoulder positions and the direction from the shoulders to the hips at the pike, the swoop and the upward dog
  const keys = [
    { sh: V(0.17, 0.47), phi: 144 },
    { sh: V(0.6, 0.25), phi: 186 },
    { sh: V(0.45, 0.58), phi: 220 },
  ];
  return {
    phases: [
      [1.0, 0, 0.5, "Swoop down", 0.8],
      [0.8, 0.5, 1, "Up into the dog", 1],
      [0.4, 1, 1, "Look up", 0.6],
      [1.2, 1, 0, "Push back to the pike", 0.7],
    ],
    load: "none",
    stance: 0.12,
    pose(B, d) {
      const s = clamp(d, 0, 1) * 2;
      const i = Math.min(1, Math.floor(s));
      const t = s - i;
      const a = keys[i]!,
        b = keys[i + 1]!;
      const sh = lerpV(a.sh, b.sh, t);
      const phi = rad(lerp(a.phi, b.phi, t));
      const hip = add(sh, V(Math.cos(phi) * B.torso, Math.sin(phi) * B.torso));
      const leg = legMax(B) * 0.99;
      const ankle = (sgn: number) => within(V(hip[0], hip[1], sgn * B.hipW), V(-0.8, 0.1, sgn * 0.12), leg);
      return {
        hip,
        sh,
        ankle: per(ankle(-1), ankle(1)),
        foot: lerp(30, -20, d),
        kneePole: V(0, -1, 0.1),
        hand: V(0.45, 0.03, 0.24),
        elbowPole: V(-0.8, 0.4, 0.5),
        headBlend: lerp(0, 0.9, Math.max(0, d * 2 - 1)),
      };
    },
  };
}

// ---------- standing walks that travel ----------
// Band walks, shuffles, squat walks and sled drags used to play cossack squats or squat reps in place
// (Melvin, 2026-11-14: "an audit of all the other animations"). The feet step in turn and the hips ride
// halfway between them, so the figure really travels, then walks back to where it started.

type Foot = "L" | "R";
interface FootStep {
  foot: Foot;
  by: Vec;
  label: string;
}
type StandHands = "hips" | "guard" | "strap" | "front";

/** `count` side steps one way (the lead foot out, the other foot in) and the same back. */
function sideFootSteps(stride: number, count: number, labels: [string, string]): FootStep[] {
  const steps: FootStep[] = [];
  for (const [sgn, label] of [
    [1, labels[0]],
    [-1, labels[1]],
  ] as const)
    for (let k = 0; k < count; k++) {
      const by = V(0, 0, sgn * stride);
      steps.push({ foot: sgn > 0 ? "R" : "L", by, label }, { foot: sgn > 0 ? "L" : "R", by, label });
    }
  return steps;
}

/** Walking forward, one foot passing the other, then the same steps backwards. */
function forwardFootSteps(stride: number, labels: [string, string], wide = 0): FootStep[] {
  const out = (sgn: number) => sgn * wide;
  const fwd: FootStep[] = [
    { foot: "L", by: V(stride, 0, out(-1)), label: labels[0] },
    { foot: "R", by: V(2 * stride, 0, out(1)), label: labels[0] },
    { foot: "L", by: V(2 * stride, 0, -out(-1)), label: labels[0] },
    { foot: "R", by: V(stride, 0, -out(1)), label: labels[0] },
  ];
  const back = [...fwd].reverse().map((s) => ({ ...s, by: mul(s.by, -1), label: labels[1] }));
  return [...fwd, ...back];
}

function standWalk(o: {
  steps: FootStep[];
  /** Leg straightness at the hip (1 standing tall, lower sits deeper). */
  bend: number;
  /** Half the stance width. */
  w: number;
  lean: number;
  hands: StandHands;
  dur?: number;
  lift?: number;
  hop?: number;
  props?: (B: Body) => Prop[];
}): Motion {
  const n = o.steps.length;
  const keys: { L: Vec; R: Vec }[] = [];
  let cur = { L: V(0, 0), R: V(0, 0) };
  for (const s of o.steps) {
    keys.push(cur);
    cur = { ...cur, [s.foot]: add(cur[s.foot], s.by) };
  }
  keys.push(cur);
  const mids = keys.map((k) => mul(add(k.L, k.R), 0.5));
  const centre = V(
    (Math.min(...mids.map((m) => m[0])) + Math.max(...mids.map((m) => m[0]))) / 2,
    0,
    (Math.min(...mids.map((m) => m[2])) + Math.max(...mids.map((m) => m[2]))) / 2,
  );
  return {
    phases: o.steps.map((s, i): PhaseRow => [o.dur ?? 0.5, i / n, (i + 1) / n, s.label, 0.8]),
    load: "none",
    stance: o.w,
    pose(B, d) {
      const x = clamp(d, 0, 1) * n;
      const i = Math.min(n - 1, Math.floor(x));
      const t = x - i;
      const a = keys[i]!;
      const b = keys[i + 1]!;
      const arc = Math.sin(Math.PI * t);
      const off = { L: sub(lerpV(a.L, b.L, t), centre), R: sub(lerpV(a.R, b.R, t), centre) };
      const mid = mul(add(off.L, off.R), 0.5);
      const hip = V(-0.03 + mid[0], standY(B, 0.04, o.bend) + (o.hop ?? 0) * arc, mid[2]);
      const sh = add(torsoAt(B, V(hip[0], hip[1]), o.lean), V(0, 0, hip[2]));
      const leg = legMax(B) * 0.99;
      const foot = (f: Foot): Vec => {
        const sgn = f === "L" ? -1 : 1;
        const lift = o.steps[i]!.foot === f ? arc * (o.lift ?? 0.07) : 0;
        const at = add(V(0, ANKLE_H + lift, sgn * o.w), off[f]);
        return within(V(hip[0], hip[1], hip[2] + sgn * B.hipW), at, leg);
      };
      const hand = (sgn: number): Vec => {
        if (o.hands === "hips") return V(hip[0] + 0.02, hip[1] + 0.06, hip[2] + sgn * (B.hipW + 0.13));
        if (o.hands === "guard") return V(sh[0] + 0.3, sh[1] - 0.12, sh[2] + sgn * 0.12);
        if (o.hands === "strap") return V(sh[0] + 0.32, sh[1] - 0.4, sh[2] + sgn * 0.06);
        return V(sh[0] + reach(B) * 0.85, sh[1] - 0.1, sh[2] + sgn * 0.15);
      };
      return {
        hip,
        sh,
        ankle: per(foot("L"), foot("R")),
        kneePole: per(V(1, 0, -0.45), V(1, 0, 0.45)),
        hand: per(hand(-1), hand(1)),
        elbowPole: o.hands === "hips" ? V(-0.4, 0, 1) : V(-0.3, -1, 0.5),
        headBlend: 0.8,
      };
    },
    props: o.props,
  };
}

const kneeBand = (): Prop[] => [cable("kneeL", "kneeR")];

function bandLateralWalk(): Motion {
  return standWalk({
    steps: sideFootSteps(0.22, 2, ["Step right", "Step back"]),
    bend: 0.88,
    w: 0.18,
    lean: 14,
    hands: "hips",
    props: kneeBand,
  });
}
function bandMonsterWalk(): Motion {
  return standWalk({
    steps: forwardFootSteps(0.2, ["Walk forward", "Walk back"], 0.06),
    bend: 0.88,
    w: 0.2,
    lean: 14,
    hands: "hips",
    props: kneeBand,
  });
}
function lateralSquatWalk(): Motion {
  return standWalk({ steps: sideFootSteps(0.22, 2, ["Step right", "Step back"]), bend: 0.82, w: 0.2, lean: 24, hands: "hips" });
}
function lateralShuffle(): Motion {
  return standWalk({
    steps: sideFootSteps(0.26, 2, ["Shuffle right", "Shuffle back"]),
    bend: 0.88,
    w: 0.2,
    lean: 20,
    hands: "guard",
    dur: 0.28,
    lift: 0.04,
    hop: 0.03,
  });
}
function duckWalk(): Motion {
  return standWalk({ steps: forwardFootSteps(0.14, ["Walk", "Walk back"]), bend: 0.66, w: 0.2, lean: 30, hands: "front", dur: 0.6 });
}
function sledLateralDrag(): Motion {
  return standWalk({
    steps: sideFootSteps(0.22, 2, ["Step away", "Step back"]),
    bend: 0.86,
    w: 0.2,
    lean: 18,
    hands: "strap",
    dur: 0.65,
    props: () => [cable(V(0.35, 0.2, -2.0), "hands"), { kind: "box", at: V(0.35, 0.12, -2.25), size: V(0.6, 0.25, 0.5) }],
  });
}

/** Skater jumps and side bounds: from one leg, jump sideways and land on the other, the free leg sweeping behind. */
function skater(o: { dist: number; height: number; label: [string, string] }): Motion {
  return {
    phases: [
      [0.25, 0, 0, "Land", 0.6],
      [0.55, 0, 1, o.label[0], 1],
      [0.25, 1, 1, "Land", 0.6],
      [0.55, 1, 0, o.label[1], 1],
    ],
    load: "none",
    stance: 0.12,
    pose(B, d) {
      const k = d;
      const air = Math.sin(Math.PI * k);
      const z = lerp(-o.dist, o.dist, k);
      const hip = V(-0.04, standY(B, 0.05, 0.86) + o.height * air, z);
      const lean = 28 - 10 * air;
      const sh = add(torsoAt(B, V(hip[0], hip[1]), lean), V(0, 0, z));
      const stance = (sgn: number): Vec => V(0.02, ANKLE_H + 0.12 * air, z + sgn * 0.08);
      const swept = (sgn: number): Vec => V(-0.34, 0.3 + 0.1 * air, z - sgn * 0.14);
      // at d 0 the left leg stands and the right sweeps behind; at d 1 the other way round
      const leg = legMax(B) * 0.99;
      const ankleL = within(V(hip[0], hip[1], z - B.hipW), lerpV(stance(-1), swept(-1), k), leg);
      const ankleR = within(V(hip[0], hip[1], z + B.hipW), lerpV(swept(1), stance(1), k), leg);
      // the arms swing across the body, towards the landing side
      const swingZ = lerp(-0.25, 0.25, k);
      const hand = (sgn: number): Vec => V(sh[0] + 0.25, sh[1] - 0.38, z + sgn * 0.14 + swingZ);
      return {
        hip,
        sh,
        ankle: per(ankleL, ankleR),
        foot: { L: lerp(0, 40, k), R: lerp(40, 0, k) },
        kneePole: per(V(1, 0, -0.3), V(1, 0, 0.3)),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(-0.4, -1, 0.4),
        headBlend: 0.8,
      };
    },
  };
}

/** Crab walk: hands behind and feet in front, hips lifted, opposite hand and foot stepping together. */
function crabBase(B: Body): FourPoint {
  const hip = V(0, 0.4);
  const shY = 0.03 + reach(B) * 0.93;
  const lean = -(Math.acos(clamp((shY - hip[1]) / B.torso, -1, 1)) * 180) / Math.PI;
  const sh = torsoAt(B, hip, lean);
  const ax = hip[0] + 0.5;
  return {
    hip,
    sh,
    handL: V(sh[0] - 0.06, 0.03, -0.2),
    handR: V(sh[0] - 0.06, 0.03, 0.2),
    ankleL: V(ax, ANKLE_H, -0.16),
    ankleR: V(ax, ANKLE_H, 0.16),
    foot: 0,
    kneePole: V(0.4, 1, 0.2),
    elbowPole: V(-1, 0.1, 0.3),
    headBlend: 1,
  };
}
function crabWalk(): Motion {
  const stride = 0.16;
  const steps: Step[] = [];
  const pair = (a: Limb[], dx: number, label: string): Step => ({ limbs: a, by: V(dx, 0), label });
  for (let k = 0; k < 2; k++) steps.push(pair(["handL", "ankleR"], stride, "Walk"), pair(["handR", "ankleL"], stride, "Walk"));
  for (let k = 0; k < 2; k++) steps.push(pair(["handL", "ankleR"], -stride, "Walk back"), pair(["handR", "ankleL"], -stride, "Walk back"));
  return stepper(crabBase, steps, { dur: 0.5, handLift: 0.05, footLift: 0.05 });
}

/** Plays a looping motion backwards (backward walking, the elliptical pedalled in reverse). */
function backwards(m: Motion, label: string): Motion {
  return { ...m, phases: m.phases.map(([dur, a, b, , eff]): PhaseRow => [dur, b, a, label, eff]) };
}

/** Battle ropes: a half squat with the hands making fast alternating waves. */
type RopeStyle = "alternating" | "double" | "slam" | "circles" | "side";
/**
 * Battle ropes: an athletic half squat, a rope in each hand running to an anchor on the floor ahead,
 * the hands circling so the ropes roll with travelling waves (`RopeProp`). Alternating waves move
 * the hands out of step, double waves together, slams lift both hands high and drive them down with
 * a dip of the hips, circles turn the hands outwards, and side slams swing both hands from side to
 * side so the waves run sideways.
 */
function battleRopes(o: { style: RopeStyle }): Motion {
  const st = o.style;
  const r = st === "slam" ? 0.36 : st === "side" ? 0.3 : st === "circles" ? 0.16 : 0.13;
  const stance = (B: Body) => {
    const hip = V(-0.1, standY(B, 0.1, 0.86));
    return { hip, sh: torsoAt(B, hip, 20) };
  };
  const centre = (B: Body, sgn: number): Vec => {
    const { sh } = stance(B);
    if (st === "side") return V(sh[0] + 0.26, sh[1] - 0.38, 0);
    return V(sh[0] + 0.26, sh[1] - (st === "slam" ? 0.2 : 0.34), sgn * 0.2);
  };
  const label =
    st === "alternating"
      ? (["Right arm down", "Left arm down"] as const)
      : st === "slam"
        ? (["Arms up", "Slam"] as const)
        : st === "side"
          ? (["Slam to the right", "Slam to the left"] as const)
          : st === "circles"
            ? (["Circle out", "Circle out"] as const)
            : (["Both arms up", "Both arms down"] as const);
  const dur = st === "slam" || st === "side" ? 0.55 : 0.3;
  return {
    phases: [
      [dur, 0, 0.5, label[0], 1],
      [dur, 0.5, 1, label[1], 1],
    ],
    load: "none",
    stance: 0.2,
    pose(B, d) {
      const { hip: hip0, sh: sh0 } = stance(B);
      const phi = 2 * Math.PI * d;
      // slams dip the hips as the hands come down
      const dip = st === "slam" ? 0.08 * (1 - Math.sin(phi)) : st === "side" ? 0.04 * (1 - Math.cos(2 * phi)) : 0;
      const hip = add(hip0, V(0, -dip));
      const sh = add(sh0, V(0, -dip));
      const handAt = (sgn: number, ph: number): Vec => {
        const c = centre(B, sgn);
        if (st === "side") return add(c, V(0.4 * r * Math.cos(ph), 0.12 * Math.cos(2 * ph), r * Math.sin(ph) + sgn * 0.08));
        if (st === "circles") return add(c, V(0.4 * r * Math.cos(ph), r * Math.sin(ph), sgn * r * Math.cos(ph)));
        return add(c, V(0.4 * r * Math.cos(ph), r * Math.sin(ph), 0));
      };
      const reachOf = (sgn: number, v: Vec) => within(V(sh[0], sh[1] - B.shDrop, sgn * B.shW), v, reach(B) * 0.97);
      const hand = per(reachOf(-1, handAt(-1, st === "alternating" ? phi + Math.PI : phi)), reachOf(1, handAt(1, phi)));
      return { hip, sh, hand, kneePole: V(1, 0, 0.4), elbowPole: V(-0.3, -1, 0.6), headBlend: 0.8 };
    },
    props: (B) => [
      {
        kind: "rope",
        from: "handL",
        to: V(3.2, 0.25, -0.3),
        centre: centre(B, -1),
        radius: r,
        waves: 1.6,
        axis: st === "side" ? "z" : "y",
      },
      { kind: "rope", from: "handR", to: V(3.2, 0.25, 0.3), centre: centre(B, 1), radius: r, waves: 1.6, axis: st === "side" ? "z" : "y" },
    ],
  };
}

/** Battle rope jumping jacks: the jumping jack holding the ropes, the arms sweeping them up and down. */
function ropeJack(): Motion {
  const j = jumpingJack();
  return {
    ...j,
    props: (B) => {
      const c = (sgn: number) => V(0.1, standY(B) + B.torso * 0.6, sgn * 0.45);
      return [
        { kind: "rope", from: "handL", to: V(3.2, 0.25, -0.3), centre: c(-1), radius: 0.55, waves: 1.2 },
        { kind: "rope", from: "handR", to: V(3.2, 0.25, 0.3), centre: c(1), radius: 0.55, waves: 1.2 },
      ];
    },
  };
}

/** Where a bike's crank, saddle (hip), shoulders and bars sit for a body. */
function bikeFrame(B: Body) {
  const crank = V(0.2, 0.36);
  const r = 0.16;
  const h = Math.sqrt(Math.max(0.01, (legMax(B) * 0.95 - r) ** 2 - 0.22 ** 2));
  const hip = V(crank[0] - 0.22, crank[1] + h);
  const sh = torsoAt(B, hip, 35);
  const bars = add(sh, V(reach(B) * 0.62, -reach(B) * 0.5));
  return { crank, r, hip, sh, bars };
}

/** A bike: seated on a saddle, leaning to the bars, the feet turning the pedals in a circle. */
function bike(): Motion {
  return {
    phases: [[0.9, 0, 1, "Pedal", 0.8]],
    load: "none",
    stance: 0.12,
    pose(B, d) {
      const { crank, r, hip, sh, bars } = bikeFrame(B);
      const pedal = (th: number, z: number): Vec => V(crank[0] + r * Math.cos(th), crank[1] + r * Math.sin(th), z);
      const th = 2 * Math.PI * d;
      return {
        hip,
        sh,
        ankle: per(pedal(th, -0.12), pedal(th + Math.PI, 0.12)),
        foot: 10,
        kneePole: V(1, 0.4, 0.15),
        hand: V(bars[0], bars[1], 0.22),
        elbowPole: V(-0.3, -1, 0.6),
        headBlend: 0.6,
      };
    },
    props: (B) => {
      const { crank, hip, bars } = bikeFrame(B);
      const seat = hip[1] - 0.08;
      return [
        // saddle and seat post, crank housing, the post up to the bars and the bars themselves
        { kind: "box", at: V(hip[0], seat - 0.01), size: V(0.26, 0.05, 0.16) },
        { kind: "box", at: V(hip[0] + 0.04, seat / 2), size: V(0.06, seat, 0.06) },
        { kind: "box", at: V(crank[0], crank[1]), size: V(0.14, 0.14, 0.12) },
        { kind: "box", at: V(bars[0] + 0.06, (bars[1] - 0.02) / 2), size: V(0.06, bars[1] - 0.02, 0.06) },
        rail(V(bars[0], bars[1], 0), 0.5),
        boxP(0.12, 0.05, 0.45, 0.8),
      ];
    },
  };
}

// ---------- moves that used to borrow another move's motion (2026-11-11) ----------
const deg = (r: number) => (r * 180) / Math.PI;
/** The torso's lean (degrees from upright, forward positive) for a hip and shoulder centre. */
const leanOf = (hip: Vec, sh: Vec) => deg(Math.atan2(sh[0] - hip[0], sh[1] - hip[1]));
type Two = { L: Vec; R: Vec };
/** One side of a per-side value: a single Vec is mirrored (its z is the half-width). */
function sideOf(v: Pose["hand"] | undefined, s: "L" | "R", fallback: Vec): Vec {
  const x = v ?? fallback;
  if (!Array.isArray(x)) return x[s];
  return V(x[0], x[1], (s === "L" ? -1 : 1) * Math.abs(x[2]));
}
const both = (v: Pose["hand"] | undefined, fallback: Vec): Two => ({ L: sideOf(v, "L", fallback), R: sideOf(v, "R", fallback) });

/** A key pose for `keyframes`: hip, torso lean, and where each hand and foot is. */
interface Key {
  hip: Vec;
  lean: number;
  hand: Two;
  ankle: Two;
  foot?: number;
  kneePole?: Two;
  elbowPole?: Two;
  headBlend?: number;
}
/** A Key from a family's pose, so a sequence can start from moves that already exist. */
function keyOf(p: Pose, B: Body, stance = 0.14, grip = 0.25): Key {
  return {
    hip: p.hip,
    lean: leanOf(p.hip, p.sh),
    hand: both(p.hand, V(0, 0, grip)),
    ankle: both(p.ankle, V(0, ANKLE_H, stance * B.s)),
    foot: typeof p.foot === "number" ? p.foot : 0,
    kneePole: both(p.kneePole, V(1, 0, 0.45)),
    elbowPole: both(p.elbowPole, V(-1, -0.7, 0.4)),
    headBlend: p.headBlend ?? 0.45,
  };
}
/**
 * A sequence of key poses (burpees, box jumps, the get-up), d running 0 to 1 across them. Hands
 * and feet blend as offsets from their own shoulder and hip, so a limb that reaches in both keys
 * reaches all the way between them.
 */
function keyframes(B: Body, keys: Key[], d: number): Pose {
  const k = clamp(d, 0, 1) * (keys.length - 1);
  const i = Math.min(Math.floor(k), keys.length - 2);
  const t = k - i;
  const a = keys[i]!,
    b = keys[i + 1]!;
  const hip = lerpV(a.hip, b.hip, t);
  const sh = torsoAt(B, hip, lerp(a.lean, b.lean, t));
  const shA = torsoAt(B, a.hip, a.lean),
    shB = torsoAt(B, b.hip, b.lean);
  const limb = (pa: Vec, pb: Vec, from: Vec, fa: Vec, fb: Vec): Vec =>
    add(V(from[0], from[1], 0), lerpV(sub(pa, V(fa[0], fa[1], 0)), sub(pb, V(fb[0], fb[1], 0)), t));
  const pole = (s: "L" | "R", pa?: Two, pb?: Two): Vec => lerpV(pa?.[s] ?? V(1, 0, 0.45), pb?.[s] ?? V(1, 0, 0.45), t);
  return {
    hip,
    sh,
    hand: per(limb(a.hand.L, b.hand.L, sh, shA, shB), limb(a.hand.R, b.hand.R, sh, shA, shB)),
    ankle: per(limb(a.ankle.L, b.ankle.L, hip, a.hip, b.hip), limb(a.ankle.R, b.ankle.R, hip, a.hip, b.hip)),
    foot: lerp(a.foot ?? 0, b.foot ?? 0, t),
    kneePole: per(pole("L", a.kneePole, b.kneePole), pole("R", a.kneePole, b.kneePole)),
    elbowPole: per(pole("L", a.elbowPole, b.elbowPole), pole("R", a.elbowPole, b.elbowPole)),
    headBlend: lerp(a.headBlend ?? 0.45, b.headBlend ?? 0.45, t),
  };
}

/** Standing tall, arms hanging: the start and end of many sequences. */
function standKey(B: Body, lift = 0): Key {
  const hip = V(0.02, standY(B) + lift);
  const sh = torsoAt(B, hip, 0);
  const h = hang(B, sh, 0.06, 0.95);
  return {
    hip,
    lean: 0,
    hand: both(h, h),
    ankle: both(V(0.03, ANKLE_H + lift, 0.12), V(0, 0, 0)),
    foot: lift ? 35 : 0,
    kneePole: both(V(1, 0, 0.3), V(0, 0, 0)),
    elbowPole: both(V(-1, 0, 0.4), V(0, 0, 0)),
    headBlend: 1,
  };
}

/**
 * One-arm ballistic kettlebell lifts from the swing: the clean (to the rack), the snatch (to
 * overhead) and the high pull (elbow high, bell at the chin). The free arm hangs.
 */
function kbFlow(o: { to: "rack" | "overhead" | "chin"; load?: Load }): Motion {
  const finish = { rack: "Clean to the rack", overhead: "Punch overhead", chin: "Pull, elbow high" }[o.to];
  return {
    phases: [
      [0.8, 1, 0, finish, 1],
      [0.5, 0, 0, o.to === "chin" ? "Top" : "Lock in", 0.5],
      [0.9, 0, 1, "Hike back", 0.55],
    ],
    load: o.load ?? "kettlebell",
    hold: "R",
    stance: 0.2,
    pose(B, d) {
      const hinge = clamp((d - 0.4) / 0.6, 0, 1);
      const lean = lerp(2, 58, hinge);
      const shX = 0.04 + 0.06 * hinge;
      const hipX = shX - Math.sin(rad(lean)) * B.torso;
      const hip = V(hipX, standY(B, hipX, lerp(1, 0.9, hinge)));
      const sh = torsoAt(B, hip, lean);
      const r = reach(B);
      const top = V(sh[0], sh[1], B.shW);
      const low = add(swing(top, r * 0.95, lerp(30, -25, hinge) + lean * 0.6 * hinge), V(0, 0, -0.08));
      const target =
        o.to === "rack"
          ? V(sh[0] + 0.1, sh[1] - 0.1, 0.08)
          : o.to === "overhead"
            ? V(sh[0] + 0.03, sh[1] + r * 0.95, B.shW - 0.02)
            : V(sh[0] + 0.13, sh[1] + 0.01, 0.1);
      const targetPole = o.to === "rack" ? V(0.2, -1, 0.3) : o.to === "overhead" ? V(0, -1, 1) : V(-0.3, 1, 1);
      const k = clamp(d / 0.4, 0, 1);
      const hand = d < 0.4 ? add(lerpV(target, low, k), V(0.06 * Math.sin(Math.PI * k), 0, 0)) : low;
      const free = hang(B, sh, 0.04);
      return {
        hip,
        sh,
        hand: per(V(free[0], free[1], -free[2]), hand),
        elbowPole: per(V(-1, 0, 0.3), lerpV(targetPole, V(0, 1, 0.2), k)),
        kneePole: V(1, 0, 0.45),
        headBlend: 0.5,
      };
    },
  };
}

/** Thrusters: a front squat with the weights racked, standing straight into a press overhead. */
function thruster(o: { load: Load }): Motion {
  const base = squat({ hold: "goblet" });
  return {
    phases: [
      [0.45, 0, 0, "Lockout", 0.5],
      [0.7, 0, 0.35, "Rack", 0.4],
      [1.4, 0.35, 1, "Squat · 2s", 0.55],
      [1.1, 1, 0, "Drive and press", 1],
    ],
    load: o.load,
    hold: "each",
    stance: 0.19,
    pose(B, d) {
      const { hip, sh } = base.pose(B, clamp((d - 0.35) / 0.65, 0, 1));
      const press = clamp(1 - d / 0.35, 0, 1);
      const rack = V(sh[0] + 0.1, sh[1] + 0.03, B.shW + 0.03);
      const up = V(sh[0] + 0.03, sh[1] + reach(B) * 0.95, B.shW - 0.02);
      return { hip, sh, hand: lerpV(rack, up, press), elbowPole: V(0.4, -1, 0.6), kneePole: V(1, 0, 0.45), headBlend: 0.8 };
    },
  };
}

/** Kettlebell halo: the bell held by the horns, circling the head. */
function halo(): Motion {
  return {
    phases: [[2.4, 0, 1, "Circle the head", 0.6]],
    load: "kettlebell",
    hold: "centre",
    stance: 0.15,
    pose(B, d) {
      const hip = V(0.02, standY(B));
      const sh = torsoAt(B, hip, 0);
      const th = 2 * Math.PI * d;
      const c = V(sh[0] + 0.03, sh[1] + 0.17);
      const at = (dz: number): Vec => V(c[0] + 0.2 * Math.cos(th), c[1], 0.2 * Math.sin(th) + dz);
      return { hip, sh, hand: per(at(-0.04), at(0.04)), elbowPole: V(0.4 * Math.cos(th), -1, 1), headBlend: 1 };
    },
  };
}

/** Around the world: the bell passed hand to hand around the waist. */
function aroundWorld(): Motion {
  return {
    phases: [[2.2, 0, 1, "Pass it round", 0.6]],
    load: "kettlebell",
    hold: "centre",
    stance: 0.17,
    pose(B, d) {
      const hip = V(0.02, standY(B));
      const sh = torsoAt(B, hip, 0);
      const th = 2 * Math.PI * d;
      const rx = Math.cos(th) > 0 ? 0.27 : 0.22;
      const c = V(hip[0] + rx * Math.cos(th), hip[1] + 0.12, 0.21 * Math.sin(th));
      return { hip, sh, hand: per(add(c, V(0, 0, -0.035)), add(c, V(0, 0, 0.035))), elbowPole: V(-0.2, -1, 1), headBlend: 1 };
    },
  };
}

/** Lying ab work: crunches, leg raises, V-ups, the hollow hold and bicycle crunches. */
function floorCore(o: { kind: "crunch" | "legRaise" | "vUp" | "hollow" | "bicycle" }): Motion {
  const phases =
    o.kind === "hollow"
      ? TEMPO.hold("Hold · breathe")
      : o.kind === "bicycle"
        ? TEMPO.alternate("Elbow to knee", "Other side")
        : o.kind === "crunch"
          ? TEMPO.liftFirst("Curl up · 1s", "Lower · 2s", "Flat", "Squeeze")
          : o.kind === "legRaise"
            ? TEMPO.liftFirst("Raise · 1s", "Lower · 2s", "Legs low", "Top")
            : TEMPO.liftFirst("Fold up · 1s", "Lower · 2s", "Long", "Touch");
  return {
    phases,
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const hip = V(0.25, 0.13);
      const r = reach(B) * 0.93;
      const L = legMax(B) * 0.97;
      const arm = (sh: Vec, a: number, z: number): Vec => V(sh[0] + Math.cos(rad(a)) * r, sh[1] + Math.sin(rad(a)) * r, z);
      const leg = (a: number, z: number): Vec => V(hip[0] + Math.cos(rad(a)) * L, hip[1] + Math.sin(rad(a)) * L, z);
      const toward = (from: Vec, to: Vec) => deg(Math.atan2(to[1] - from[1], to[0] - from[0]));
      const zA = B.shW + 0.02;
      if (o.kind === "crunch") {
        const sh = torsoAt(B, hip, lerp(-90, -62, d));
        const a = toward(sh, hip) + 16;
        return {
          hip,
          sh,
          ankle: V(hip[0] + 0.5, ANKLE_H, 0.13),
          kneePole: V(0.3, 1, 0.1),
          hand: per(arm(sh, a, -zA), arm(sh, a, zA)),
          elbowPole: V(0, 1, 0.5),
          headBlend: 0,
        };
      }
      if (o.kind === "legRaise") {
        const sh = torsoAt(B, hip, -90);
        const a = lerp(6, 85, d);
        return {
          hip,
          sh,
          ankle: per(leg(a, -0.09), leg(a, 0.09)),
          kneePole: V(-Math.sin(rad(a)), Math.cos(rad(a)), 0.1),
          hand: V(hip[0] - 0.08, 0.05, B.shW + 0.1),
          elbowPole: V(0, 1, 0.5),
          headBlend: 0,
        };
      }
      const lean = o.kind === "vUp" ? lerp(-90, -48, d) : o.kind === "hollow" ? lerp(-75, -73, d) : -66;
      const sh = torsoAt(B, hip, lean);
      if (o.kind === "bicycle") {
        const up = norm(sub(sh, hip));
        const front = frontOf(lean);
        const head = add(add(sh, mul(up, 0.17)), mul(front, -0.05));
        const tuck = (z: number): Vec => V(hip[0] + 0.3, hip[1] + 0.38, z);
        const long = (z: number): Vec => leg(14, z);
        return {
          hip,
          sh,
          ankle: per(lerpV(long(-0.1), tuck(-0.1), d), lerpV(tuck(0.1), long(0.1), d)),
          kneePole: V(-0.1, 1, 0.1),
          hand: per(add(head, V(0, 0, -0.1 - 0.03 * (1 - d))), add(head, V(0, 0, 0.1 + 0.03 * d))),
          elbowPole: V(0.4, 0.4, 1),
          headBlend: 0.2,
        };
      }
      const legA = o.kind === "vUp" ? lerp(5, 52, d) : lerp(13, 15, d);
      const ankle = per(leg(legA, -0.08), leg(legA, 0.08));
      const handA = o.kind === "vUp" ? lerp(172, toward(sh, leg(legA, 0)), d) : 166;
      return {
        hip,
        sh,
        ankle,
        kneePole: V(-Math.sin(rad(legA)), Math.cos(rad(legA)), 0.1),
        hand: per(arm(sh, handA, -0.15), arm(sh, handA, 0.15)),
        elbowPole: V(0, 1, 0.3),
        headBlend: 0.2,
      };
    },
  };
}

/** On hands and knees: bird dogs (opposite arm and leg reach long) and donkey kicks. */
function allFours(o: { kind: "birdDog" | "donkey" }): Motion {
  return {
    phases:
      o.kind === "birdDog"
        ? [
            [0.5, 0.5, 0.5, "All fours", 0.3],
            [1, 0.5, 1, "Reach long", 0.8],
            [0.6, 1, 1, "Hold", 0.7],
            [1, 1, 0.5, "Return", 0.5],
            [1, 0.5, 0, "Other side", 0.8],
            [0.6, 0, 0, "Hold", 0.7],
            [1, 0, 0.5, "Return", 0.5],
          ]
        : TEMPO.liftFirst("Kick up · 1s", "Lower · 2s", "All fours", "Squeeze"),
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const hip = V(0, 0.06 + B.thigh * 0.97);
      const shY = 0.03 + reach(B) * 0.94;
      const lean = deg(Math.acos(clamp((shY - hip[1]) / B.torso, -1, 1)));
      const sh = torsoAt(B, hip, lean);
      const r = reach(B) * 0.93;
      const L = legMax(B) * 0.96;
      const handDown = (z: number): Vec => V(sh[0] + 0.02, 0.03, z);
      const handLong = (z: number): Vec => V(sh[0] + r * 0.98, sh[1] + r * 0.17, z);
      const kneel = (z: number): Vec => V(hip[0] - B.shin * 0.96, 0.08, z);
      const legLong = (z: number): Vec => V(hip[0] - L, hip[1] + 0.05, z);
      const elbowPole = V(-0.6, 0.3, 0.3);
      if (o.kind === "birdDog") {
        const right = clamp((d - 0.5) * 2, 0, 1); // right arm, left leg
        const left = clamp((0.5 - d) * 2, 0, 1); // left arm, right leg
        return {
          hip,
          sh,
          hand: per(lerpV(handDown(-0.17), handLong(-0.15), left), lerpV(handDown(0.17), handLong(0.15), right)),
          ankle: per(lerpV(kneel(-0.1), legLong(-0.1), right), lerpV(kneel(0.1), legLong(0.1), left)),
          foot: { L: lerp(150, 90, right), R: lerp(150, 90, left) },
          kneePole: per(lerpV(V(0.4, -1, -0.1), V(0, -1, -0.1), right), lerpV(V(0.4, -1, 0.1), V(0, -1, 0.1), left)),
          elbowPole,
          headBlend: 0.2,
        };
      }
      // Donkey kick: the right knee stays bent at a right angle while the thigh drives up behind.
      const phi = rad(lerp(0, 100, d));
      const thighDir = V(-Math.sin(phi), -Math.cos(phi));
      const shinDir = V(thighDir[1], -thighDir[0]);
      const ankleR = add(add(hip, mul(thighDir, B.thigh * 0.93)), mul(shinDir, B.shin * 0.97));
      return {
        hip,
        sh,
        hand: handDown(0.17),
        ankle: per(kneel(-0.1), V(ankleR[0], ankleR[1], 0.1)),
        foot: { L: 150, R: lerp(150, 60, d) },
        kneePole: per(V(0.4, -1, -0.1), V(thighDir[0] - shinDir[0], thighDir[1] - shinDir[1], 0.1)),
        elbowPole,
        headBlend: 0.2,
      };
    },
  };
}

/** Standing glute kickback: one straight leg sweeps back against a cable or band. */
function kickback(o: { band?: boolean }): Motion {
  const frame = (B: Body) => {
    const hip = V(0, standY(B, 0.03, 0.99));
    const sh = torsoAt(B, hip, 12);
    return { hip, sh, grab: V(sh[0] + 0.32, sh[1] - 0.22) };
  };
  return {
    phases: TEMPO.liftFirst("Kick back · 1s", "Return · 2s", "Set", "Squeeze"),
    load: "none",
    stance: 0.11,
    pose(B, d) {
      const { hip, sh, grab } = frame(B);
      const a = rad(lerp(4, 38, d));
      const L = legMax(B) * 0.97;
      return {
        hip,
        sh,
        ankle: per(V(0.03, ANKLE_H, -0.11), V(hip[0] - Math.sin(a) * L, hip[1] - Math.cos(a) * L, 0.11)),
        foot: { L: 0, R: lerp(0, 30, d) },
        kneePole: V(1, 0, 0.3),
        hand: o.band ? V(hip[0] + 0.02, hip[1] + 0.06, B.hipW + 0.13) : V(grab[0], grab[1], 0.2),
        elbowPole: o.band ? V(-0.4, 0, 1) : V(-0.3, -1, 0.4),
        headBlend: 0.8,
      };
    },
    props: o.band
      ? () => [cable("ankleL", "ankleR")]
      : (B) => {
          const { grab } = frame(B);
          return [cable(V(-0.8, 0.12, 0.11), "ankleR"), rail(V(grab[0] + 0.02, grab[1], 0), 0.6, "z")];
        },
  };
}

/** Upright rows: the hands rise close to the body to the chest, elbows leading high and wide. */
function uprightRow(o: { load: Load; cable?: boolean }): Motion {
  return {
    phases: TEMPO.liftFirst("Pull up · 1s", "Lower · 2s", "Hang", "Elbows high"),
    load: o.load,
    stance: 0.13,
    grip: 0.11,
    plates: 0.7,
    pose(B, d) {
      const hip = V(0.02, standY(B));
      const sh = torsoAt(B, hip, 0);
      const low = V(sh[0] + 0.12, sh[1] - reach(B) * 0.93, 0.11);
      const high = V(sh[0] + 0.1, sh[1] - 0.06, 0.1);
      const hand = lerpV(low, high, d);
      return {
        hip,
        sh,
        shrug: 0.02 * d,
        hand,
        bar: o.load === "barbell" ? V(hand[0], hand[1], 0) : undefined,
        elbowPole: lerpV(V(-1, 0, 0.6), V(-0.2, 1, 1), d),
        headBlend: 1,
      };
    },
    props: o.cable ? () => [cable(V(0.3, 0.05, 0), "hands")] : undefined,
  };
}

/** L-sit on dip bars: arms locked, legs held straight out in front. */
function lSit(): Motion {
  return {
    phases: TEMPO.hold("Hold · legs long"),
    load: "none",
    stance: 0.07,
    pose(B, d) {
      const barY = 1.3;
      const sh = V(0.02, barY + reach(B) * 0.97);
      const hip = sub(sh, V(Math.sin(rad(4)) * B.torso, Math.cos(rad(4)) * B.torso));
      const a = rad(lerp(-6, 1, d));
      const L = legMax(B) * 0.97;
      return {
        hip,
        sh,
        ankle: V(hip[0] + Math.cos(a) * L, hip[1] + Math.sin(a) * L, 0.07),
        kneePole: V(0, 1, 0.1),
        hand: V(0.02, barY, 0.26),
        elbowPole: V(-1, 0, 0.1),
        headBlend: 0.7,
      };
    },
    props: () => [
      rail(V(0.05, 1.28, -0.26), 0.8, "x"),
      rail(V(0.05, 1.28, 0.26), 0.8, "x"),
      rail(V(0.4, 0.64, -0.26), 1.28, "y"),
      rail(V(0.4, 0.64, 0.26), 1.28, "y"),
    ],
  };
}

/** Renegade row: a plank on two dumbbells, rowing one to the ribs, then the other. */
function renegadeRow(): Motion {
  const base = pushUp({ hands: 0.07, width: 0.2 });
  return {
    phases: [
      [1.3, 0, 0.5, "Row right", 1],
      [1.3, 0.5, 1, "Row left", 1],
    ],
    load: "dumbbell",
    hold: "each",
    stance: 0.2,
    grip: 0.2,
    pose(B, d) {
      const p = base.pose(B, 0);
      const { hip, sh } = p;
      const lean = leanOf(hip, sh);
      const floor = (z: number): Vec => V(0.47, 0.1, z);
      const ribs = (z: number): Vec => {
        const c = onTorso(hip, sh, lean, 0.72, 0.06);
        return V(c[0], c[1], z);
      };
      const right = Math.max(0, Math.sin(2 * Math.PI * d)),
        left = Math.max(0, -Math.sin(2 * Math.PI * d));
      const ankle = sideOf(p.ankle, "R", V(0, 0, 0));
      return {
        ...p,
        hand: per(lerpV(floor(-0.2), ribs(-0.2), left), lerpV(floor(0.2), ribs(0.2), right)),
        ankle: V(ankle[0], ankle[1], 0.2),
        elbowPole: per(lerpV(V(-0.7, 0.6, -0.7), V(-0.6, 1, -0.2), left), lerpV(V(-0.7, 0.6, 0.7), V(-0.6, 1, 0.2), right)),
      };
    },
  };
}

/** Burpee: squat down, hands to the floor, jump back to a plank, jump in, jump up. */
interface BurpeeOpts {
  /** What happens at the top: a jump with the arms up, a tuck jump, a jump to a bar and a pull-up, or just standing. */
  top?: "jump" | "tuck" | "pull" | "none";
  /** Sprawl: the hips drop all the way to the floor instead of holding a plank. */
  sprawl?: boolean;
  /** Hands on kettlebells, standing up as a deadlift. */
  bells?: boolean;
}
function burpee(o: BurpeeOpts = {}): Motion {
  const top = o.top ?? "jump";
  const n = top === "none" ? 3 : top === "pull" ? 5 : 4;
  const p = (i: number) => i / (n - 1);
  const ending: PhaseRow[] =
    top === "none"
      ? [[0.5, p(2), p(2), o.bells ? "Lockout" : "Stand", 0.4]]
      : top === "pull"
        ? [
            [0.45, p(2), p(3), "Jump to the bar", 1],
            [0.7, p(3), p(4), "Pull up", 1],
            [0.6, p(4), p(3), "Lower", 0.5],
            [0.35, p(3), p(2), "Drop down", 0.5],
          ]
        : [
            [0.55, p(2), p(3), top === "tuck" ? "Tuck jump" : "Jump up", 1],
            [0.35, p(3), p(2), "Land soft", 0.5],
          ];
  const barY = (B: Body) => torsoAt(B, standKey(B, 0.14).hip, 0)[1] + reach(B) * 0.95;
  return {
    phases: [
      [0.5, p(2), p(1), "Hands down", 0.6],
      [0.35, p(1), 0, o.sprawl ? "Sprawl, hips down" : "Jump back", 0.9],
      [0.3, 0, 0, o.sprawl ? "Hips on the floor" : "Plank", 0.6],
      [0.35, 0, p(1), "Jump in", 0.9],
      [0.55, p(1), p(2), o.bells ? "Deadlift up" : "Stand up", 1],
      ...ending,
    ],
    load: o.bells ? "kettlebell" : "none",
    hold: o.bells ? "each" : undefined,
    stance: 0.12,
    pose(B, d) {
      const plank = keyOf(pushUp({}).pose(B, 0), B, 0.1, 0.22);
      if (o.sprawl) {
        // hips sink to the floor, arms straight, chest up
        const sh = torsoAt(B, plank.hip, plank.lean);
        const hipLow = V(plank.hip[0] + 0.05, 0.22);
        plank.lean = leanOf(hipLow, sh);
        plank.hip = hipLow;
        plank.kneePole = both(V(1, 0.6, 0.4), V(0, 0, 0));
      }
      const hip = V(-0.12, ANKLE_H + B.shin * 0.72);
      const down: Key = {
        hip,
        lean: 72,
        hand: both(V(0.47, 0.03, 0.22), V(0, 0, 0)),
        ankle: both(V(0.05, ANKLE_H, 0.13), V(0, 0, 0)),
        foot: 0,
        kneePole: both(V(1, 0.2, 0.4), V(0, 0, 0)),
        elbowPole: both(V(-0.7, 0.6, 0.7), V(0, 0, 0)),
        headBlend: 0.4,
      };
      const keys: Key[] = [plank, down, standKey(B)];
      if (top !== "none") {
        const jump = standKey(B, top === "tuck" ? 0.3 : 0.14);
        const sh = torsoAt(B, jump.hip, 0);
        const up = V(sh[0] + 0.02, sh[1] + reach(B) * 0.95, B.shW);
        jump.hand = both(up, up);
        jump.elbowPole = both(V(0, -1, 1), V(0, 0, 0));
        if (top === "tuck") {
          // knees up to the chest, shins hanging under them
          const knee = add(jump.hip, V(B.thigh * 0.95, -0.05, 0));
          jump.ankle = both(V(knee[0] - 0.12, knee[1] - B.shin * 0.9, 0.12), V(0, 0, 0));
          jump.kneePole = both(V(1, 1, 0.2), V(0, 0, 0));
          jump.foot = 40;
        }
        keys.push(jump);
        if (top === "pull") {
          // the same grip on the bar, the body pulled up until the chin clears it
          const pull = standKey(B, 0.14 + reach(B) * 0.95 - 0.15);
          pull.ankle = both(V(pull.hip[0] - 0.05, pull.hip[1] - legMax(B) * 0.9, 0.12), V(0, 0, 0));
          pull.foot = 35;
          pull.hand = both(V(up[0], up[1], B.shW + 0.1), V(0, 0, 0));
          pull.elbowPole = both(V(0.3, -1, 0.6), V(0, 0, 0));
          keys.push(pull);
        }
      }
      return keyframes(B, keys, d);
    },
    props: top === "pull" ? (B) => [rail(V(standKey(B).hip[0] + 0.04, barY(B) + 0.03), 1.2)] : undefined,
  };
}

/** Jump squat: sit down, explode up off the floor with the arms swinging, land soft. */
/** A trap bar held at the sides: the motion's two hands become one bar between them. */
function asTrapBar(m: Motion): Motion {
  return {
    ...m,
    load: "trapbar",
    hold: undefined,
    grip: 0.27,
    pose(B, d) {
      const p = m.pose(B, d);
      const h = p.hand;
      const c = Array.isArray(h) ? h : lerpV(h.L, h.R, 0.5);
      const bar = V(c[0], c[1]);
      return { ...p, bar, hand: bar };
    },
  };
}

function jumpSquat(o: { trap?: boolean } = {}): Motion {
  const base = squat({ hold: "arms" });
  return {
    phases: [
      [0.9, 0.2, 1, "Sit down", 0.55],
      [0.35, 1, 0.2, "Explode", 1],
      [0.25, 0.2, 0, "Jump", 0.8],
      [0.3, 0, 0.2, "Land soft", 0.6],
      [0.4, 0.2, 0.2, "Reset", 0.3],
    ],
    load: "none",
    stance: 0.19,
    pose(B, d) {
      const p = base.pose(B, clamp((d - 0.2) / 0.8, 0, 1));
      const air = clamp((0.2 - d) / 0.2, 0, 1) * 0.13;
      const hip = add(p.hip, V(0, air)),
        sh = add(p.sh, V(0, air));
      const a = o.trap ? 0 : d >= 0.2 ? lerp(60, -30, (d - 0.2) / 0.8) : lerp(150, 60, d / 0.2);
      const hand = swing(V(sh[0], sh[1], B.shW), reach(B) * (o.trap ? 0.97 : 0.95), a);
      return {
        hip,
        sh,
        hand: V(hand[0], hand[1], B.shW + 0.03),
        ankle: V(0, ANKLE_H + air, 0.19 * B.s),
        foot: (air / 0.13) * 35,
        kneePole: V(1, 0, 0.45),
        elbowPole: V(-0.3, -1, 0.3),
        headBlend: 0.7,
      };
    },
  };
}

// ---------- jumps and hops (audit batch 4) ----------
/**
 * Jumps and hops, two to a loop (d 0 → 0.5 and 0.5 → 1). Each half dips, takes off, flies and
 * lands soft. Options give each its look: how deep the dip and how high the flight, travelling
 * forward or sideways (the second half jumps back, or walks back after a broad jump), one leg,
 * landing wide and then narrow, knees tucked at the top, a half turn in the air, or a rope turning.
 */
interface HopOpts {
  /** Squat depth of the dip and the landing, 0 to 1. */
  dip: number;
  /** Height of the flight, in metres. */
  air: number;
  arms: "swing" | "rope" | "chest" | "floor";
  /** Each jump moves this far forward (x) or to the right (z). */
  travel?: { x?: number; z?: number };
  /** After a forward jump, walk back instead of jumping back. */
  walkBack?: boolean;
  /** Hops on the right foot; the left knee is bent with the foot behind. */
  oneLeg?: boolean;
  /** Half stance width on each landing (the first half lands on `wide[1]`, the second on `wide[0]`). */
  wide?: [number, number];
  /** Knees pulled up to the chest at the top. */
  tuck?: boolean;
  /** Degrees turned in the air on each jump. */
  turn?: number;
  /** Rope turns per jump (double-unders turn twice). */
  turns?: number;
  /** The hands cross in front on the first jump (rope crossovers). */
  cross?: boolean;
  /** Boxer skip: the weight shifts, one foot just off the floor on each hop. */
  skip?: boolean;
  labels?: [string, string];
}
function hop(o: HopOpts): Motion {
  const [l1, l2] = o.labels ?? ["Jump", "Jump"];
  const halfRows = (off: number, label: string): PhaseRow[] =>
    o.walkBack && off
      ? [[1.3, 0.5, 1, "Walk back", 0.3]]
      : [
          [0.3, off, off + 0.15, "Dip", 0.6],
          [0.32, off + 0.15, off + 0.35, label, 1],
          [0.3, off + 0.35, off + 0.5, "Land soft", 0.5],
        ];
  const quick = o.dip < 0.15 && !o.travel?.x;
  const rows = [...halfRows(0, l1), ...halfRows(0.5, l2)];
  const phases: PhaseRow[] = quick ? rows.map(([dur, a, b, label, eff]): PhaseRow => [dur * 0.55, a, b, label, eff]) : rows;
  const sq = squat({ hold: "arms" });
  const tx = o.travel?.x ?? 0,
    tz = o.travel?.z ?? 0;
  // where each half starts and ends, as (x, z) offsets
  const ends = (second: boolean): [Vec, Vec] => {
    const a = V(0, 0, -tz / 2),
      b = V(tx, 0, tz / 2);
    return second ? [b, a] : [a, b];
  };
  const halfOf = (d: number) => {
    const second = d >= 0.5;
    return { second, h: clamp((second ? d - 0.5 : d) * 2, 0, 1) };
  };
  const flight = (h: number) => clamp((h - 0.3) / 0.4, 0, 1);
  return {
    phases,
    load: "none",
    stance: 0.14,
    yaw: o.turn ? (d) => (halfOf(d).second ? o.turn! : 0) + o.turn! * ease(flight(halfOf(d).h)) : undefined,
    pose(B, d) {
      const { second, h } = halfOf(d);
      const [from, to] = ends(second);
      const leg = legMax(B) * 0.99;
      const walking = o.walkBack && second;
      // how deep, how high and how far along this half is
      const depth = walking
        ? 0
        : o.dip *
          (h < 0.3
            ? ease(h / 0.3)
            : h < 0.4
              ? 1 - (h - 0.3) / 0.1
              : h < 0.7
                ? 0
                : h < 0.85
                  ? (0.75 * (h - 0.7)) / 0.15
                  : 0.75 * (1 - (h - 0.85) / 0.15));
      const u = walking ? 0 : flight(h);
      const up = walking ? 0 : Math.sin(Math.PI * u) * o.air;
      const along = walking ? h : ease(u);
      const at = lerpV(from, to, along);
      const p = sq.pose(B, clamp(depth, 0, 1));
      const stanceZ = o.wide ? lerp(o.wide[second ? 1 : 0], o.wide[second ? 0 : 1], ease(u)) : 0.13 * B.s;
      const tuck = o.tuck ? Math.sin(Math.PI * u) : 0;
      let hip = add(p.hip, V(at[0], up, at[2]));
      const lean = leanOf(p.hip, p.sh) + 25 * tuck;
      // feet: under the hips, lifted in flight, tucked to the chest at the top of a tuck jump
      const footY = ANKLE_H + up * 0.9;
      const foot = (sgn: number): Vec => {
        let a = V(at[0] + 0.02, footY, at[2] + sgn * stanceZ);
        if (walking) {
          // two steps each foot, the left leading
          const w = (k: number) => clamp(h * 4 - k, 0, 1);
          const steps = sgn < 0 ? ease(w(0)) + ease(w(2)) : ease(w(1)) + ease(w(3));
          const lift = sgn < 0 ? Math.sin(Math.PI * w(0)) + Math.sin(Math.PI * w(2)) : Math.sin(Math.PI * w(1)) + Math.sin(Math.PI * w(3));
          a = V(lerp(from[0], to[0], steps / 2) + 0.02, ANKLE_H + 0.06 * lift, sgn * stanceZ);
        }
        if (tuck) a = lerpV(a, V(hip[0] + 0.12, hip[1] - B.thigh * 0.55, at[2] + sgn * 0.12), tuck * 0.85);
        if (o.skip && sgn === (second ? 1 : -1)) a = add(a, V(0.06, 0.05 * (1 - Math.abs(2 * h - 1)) + 0.03, 0));
        return a;
      };
      let ankleL = foot(-1),
        ankleR = foot(1);
      if (o.oneLeg) {
        ankleR = V(at[0] + 0.02, footY, at[2] + 0.1);
        hip = add(hip, V(0, 0, 0.04));
      }
      if (walking) hip = V(lerp(from[0], to[0], ease(h)) + p.hip[0], standY(B, 0.04, 0.99), 0);
      // keep both standing legs in reach: a wide landing sits lower
      for (const a of o.oneLeg ? [ankleR] : [ankleL, ankleR]) {
        const s = a[2] > hip[2] ? 1 : -1;
        const dx = a[0] - hip[0],
          dz = a[2] - (hip[2] + s * B.hipW);
        hip[1] = Math.min(hip[1], a[1] + Math.sqrt(Math.max(0.01, leg * leg - dx * dx - dz * dz)));
      }
      const sh = add(torsoAt(B, V(hip[0], hip[1]), lean), V(0, 0, hip[2]));
      if (o.oneLeg)
        ankleL = within(V(hip[0], hip[1], hip[2] - B.hipW), V(hip[0] - B.shin * 0.8, hip[1] - B.thigh * 0.75, hip[2] - 0.1), leg);
      // arms
      let hand: Pose["hand"];
      let elbowPole: Pose["elbowPole"] = V(-0.3, -1, 0.3);
      if (o.arms === "rope") {
        const spin = 2 * Math.PI * (o.turns ?? 1) * (walking ? 0 : h);
        const c = (sgn: number) => {
          const crossed = o.cross && !second ? Math.sin(Math.PI * u) : 0;
          return V(
            hip[0] + 0.16 + 0.04 * Math.cos(spin),
            hip[1] + 0.02 + 0.04 * Math.sin(spin),
            hip[2] + sgn * lerp(B.hipW + 0.2, -0.1, crossed),
          );
        };
        hand = per(c(-1), c(1));
        elbowPole = V(-1, -0.2, 0.6);
      } else if (o.arms === "chest") {
        const c = add(sh, V(0.2, -0.18, 0));
        hand = per(add(c, V(0, 0, -0.07)), add(c, V(0, 0, 0.07)));
        elbowPole = V(0.2, -1, 1);
      } else {
        // swing: back on the dip, up in the air, down on the landing
        const a = walking
          ? 0
          : h < 0.3
            ? -40 * ease(h / 0.3)
            : h < 0.7
              ? lerp(-40, o.tuck ? 60 : 150, ease((h - 0.3) / 0.4))
              : lerp(o.tuck ? 60 : 150, 0, (h - 0.7) / 0.3);
        const m = (sgn: number): Vec => {
          const s = swing(V(sh[0], sh[1], 0), reach(B) * 0.95, a);
          let v = V(s[0], s[1], sh[2] + sgn * (B.shW + 0.03));
          if (o.arms === "floor") {
            // frog jumps touch the floor between the feet at the bottom
            const reachDown = clamp((depth / o.dip - 0.5) * 2, 0, 1) * (h < 0.4 ? 1 : 0);
            v = within(side(B, sgn, sh), lerpV(v, V(at[0] + 0.25, 0.05, at[2] + sgn * 0.12), reachDown), reach(B) * 0.98);
          }
          return v;
        };
        hand = per(m(-1), m(1));
      }
      return {
        hip,
        sh,
        hand,
        ankle: per(ankleL, ankleR),
        foot: walking ? 0 : (Math.min(up, 0.1) / 0.1) * 35,
        kneePole: o.tuck ? V(1, 0.6, 0.3) : per(V(1, 0, -0.45), o.oneLeg ? V(1, 0, 0.2) : V(1, 0, 0.45)),
        elbowPole,
        headBlend: 0.75,
      };
    },
  };
}

/** Jumping lunges: down in a lunge, jump and switch the legs in the air, land in a lunge on the other leg. */
function jumpingLunge(): Motion {
  return {
    phases: [
      [0.45, 0, 0.2, "Lower", 0.7],
      [0.35, 0.2, 0.5, "Jump and switch", 1],
      [0.45, 0.5, 0.7, "Lower", 0.7],
      [0.35, 0.7, 1, "Jump and switch", 1],
    ],
    load: "none",
    stance: 0.11,
    pose(B, d) {
      // k runs 0 (right leg in front) to 1 (left in front) and back
      const second = d >= 0.5;
      const h = (second ? d - 0.5 : d) * 2;
      const fly = clamp((h - 0.4) / 0.6, 0, 1);
      const k = second ? 1 - ease(fly) : ease(fly);
      const air = Math.sin(Math.PI * fly) * 0.14;
      const sink = h < 0.4 ? ease(h / 0.4) : 1 - Math.sin(Math.PI * fly * 0.5);
      const front = V(0.3, ANKLE_H, 0.11),
        rear = V(-0.46, ANKLE_H + 0.02, 0.11);
      const pos = (t: number, z: number): Vec => {
        const v = lerpV(front, rear, t);
        return V(v[0], v[1] + air * 0.9 + 0.06 * Math.sin(Math.PI * t) * Math.sin(Math.PI * fly), z);
      };
      const ankleR = pos(k, 0.11),
        ankleL = pos(1 - k, -0.11);
      const topY = standY(B, 0.38, 0.97);
      const botY = 0.07 + B.thigh * 0.98;
      const hip = V(-0.06, lerp(topY, botY, clamp(sink, 0, 1) * 0.85 + 0.15) + air);
      const leg = legMax(B) * 0.99;
      for (const a of [ankleL, ankleR]) hip[1] = Math.min(hip[1], a[1] + Math.sqrt(Math.max(0.01, leg * leg - (a[0] - hip[0]) ** 2)));
      const sh = torsoAt(B, hip, 6);
      // the arms swing opposite the front leg
      const arm = (sgn: number, fwd: number): Vec => {
        const s = swing(V(sh[0], sh[1], 0), reach(B) * 0.85, lerp(-30, 40, fwd));
        return V(s[0], s[1] + 0.06, sgn * (B.shW + 0.06));
      };
      return {
        hip,
        sh,
        ankle: per(ankleL, ankleR),
        foot: { L: lerp(0, 55, k), R: lerp(55, 0, k) },
        kneePole: per(V(1, -0.3, -0.1), V(1, -0.3, 0.1)),
        hand: per(arm(-1, 1 - k), arm(1, k)),
        elbowPole: V(-1, -0.4, 0.2),
        headBlend: 0.8,
      };
    },
  };
}

/** Butt kicks: jogging on the spot, each heel kicking up to the glutes. */
function buttKicks(): Motion {
  return {
    phases: [
      [0.3, 0, 1, "Kick", 0.85],
      [0.3, 1, 0, "Kick", 0.85],
    ],
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const hip = V(0.02, standY(B) + 0.02);
      const sh = torsoAt(B, hip, 4);
      // the thigh stays down and the shin folds up behind it
      const kick = (k: number, z: number): Vec => {
        const knee = V(hip[0] + 0.02, hip[1] - B.thigh * 0.98);
        const a = rad(lerp(0, 165, ease(k)));
        return V(knee[0] - Math.sin(a) * B.shin * 0.95, knee[1] - Math.cos(a) * B.shin * 0.95 + 0.01 * (1 - k), z);
      };
      // the left heel kicks as d nears 1, the right as it nears 0: one foot is always down
      const kL = clamp((d - 0.4) / 0.6, 0, 1),
        kR = clamp((0.6 - d) / 0.6, 0, 1);
      const ankle = per(kick(Math.sin((Math.PI * kL) / 2), -0.1), kick(Math.sin((Math.PI * kR) / 2), 0.1));
      const arm = (k: number, sgn: number): Vec => {
        const p = swing(side(B, sgn, sh), reach(B) * 0.8, lerp(-30, 40, k));
        return V(p[0], p[1] + 0.1, sgn * (B.shW + 0.06));
      };
      return {
        hip,
        sh,
        ankle,
        foot: { L: 60 * kL, R: 60 * kR },
        hand: per(arm(1 - d, -1), arm(d, 1)),
        kneePole: V(0.3, -1, 0),
        elbowPole: V(-1, -0.4, 0.2),
        headBlend: 1,
      };
    },
  };
}

/**
 * Skater squat and shrimp squat: a one-leg squat on the right, the left knee lowering to the floor
 * behind. The skater reaches the arms forward; the shrimp holds the back foot in its hand.
 */
function skaterSquat(o: { shrimp?: boolean }): Motion {
  return {
    phases: TEMPO.lowerFirst("Lower · 2s", "Stand · 1s", "Tall", "Knee down"),
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const e = ease(d);
      const ankleR = V(0.08, ANKLE_H, 0.1);
      const hipX = lerp(0.0, -0.14, e);
      const topY = standY(B, ankleR[0] - hipX, 0.99);
      const botY = 0.08 + B.thigh * 0.98;
      const hip = V(hipX, lerp(topY, botY, e), 0.03);
      const lean = lerp(10, 42, e);
      const sh = add(torsoAt(B, V(hip[0], hip[1]), lean), V(0, 0, 0.03));
      const leg = legMax(B) * 0.99;
      const hipL = V(hip[0], hip[1], hip[2] - B.hipW);
      // back foot: off the floor behind (shrimp: folded up to the glutes)
      const ankleL = o.shrimp
        ? within(hipL, V(hip[0] - B.shin * 0.45, hip[1] - B.thigh * 0.25, -0.12), leg)
        : within(hipL, V(lerp(hip[0] - 0.3, hip[0] - 0.12 - B.shin * 0.85, e), lerp(hip[1] - B.thigh * 1.25, 0.12, e), -0.1), leg);
      const fwd = (sgn: number): Vec => {
        const p = add(sh, V(reach(B) * lerp(0.35, 0.95, e), lerp(-0.45, -0.05, e), 0));
        return V(p[0], p[1], sgn * (B.shW + 0.02));
      };
      const shL = V(sh[0], sh[1], sh[2] - B.shW);
      const hand = o.shrimp ? per(within(shL, add(ankleL, V(0.02, 0.02, -0.03)), reach(B) * 0.98), fwd(1)) : per(fwd(-1), fwd(1));
      return {
        hip,
        sh,
        ankle: per(ankleL, ankleR),
        foot: { L: 60, R: 0 },
        kneePole: per(o.shrimp ? V(0.2, -1, 0) : V(0.6, -1, 0), V(1, 0, 0.2)),
        hand,
        elbowPole: o.shrimp ? per(V(0.2, -1, -0.3), V(-0.2, -1, 0.3)) : V(-0.2, -1, 0.3),
        headBlend: 0.7,
      };
    },
  };
}

/** Box jump: dip, jump onto the box and land in a squat, stand tall, then back down. */
function boxJump(): Motion {
  const box = { x: 0.6, top: 0.45 };
  return {
    phases: [
      [0.5, 0, 0.25, "Dip, arms back", 0.6],
      [0.45, 0.25, 0.75, "Jump", 1],
      [0.5, 0.75, 1, "Stand tall", 0.6],
      [0.5, 1, 1, "On top", 0.3],
      [1.2, 1, 0, "Step down", 0.4],
    ],
    load: "none",
    stance: 0.15,
    pose(B, d) {
      const sq = squat({ hold: "arms" });
      const shift = (k: Key, dx: number, dy: number): Key => {
        const m = (v: Vec) => add(v, V(dx, dy));
        return { ...k, hip: m(k.hip), hand: { L: m(k.hand.L), R: m(k.hand.R) }, ankle: { L: m(k.ankle.L), R: m(k.ankle.R) } };
      };
      const dip = keyOf(sq.pose(B, 0.45), B, 0.15, 0.16);
      const dipSh = torsoAt(B, dip.hip, dip.lean);
      const back = add(swing(V(dipSh[0], dipSh[1], B.shW), reach(B) * 0.95, -35), V(0, 0, 0.03));
      dip.hand = both(back, back);
      dip.elbowPole = both(V(-0.3, -1, 0.3), V(0, 0, 0));
      dip.ankle = both(V(0.03, ANKLE_H, 0.15), V(0, 0, 0));
      const air: Key = {
        hip: V(0.32, 1.18),
        lean: 22,
        hand: both(V(0.75, 1.55, 0.25), V(0, 0, 0)),
        ankle: both(V(0.47, 0.67, 0.15), V(0, 0, 0)),
        foot: 10,
        kneePole: both(V(1, 0.3, 0.3), V(0, 0, 0)),
        elbowPole: both(V(-0.3, -1, 0.3), V(0, 0, 0)),
        headBlend: 0.7,
      };
      const land = shift(keyOf(sq.pose(B, 0.7), B, 0.15, 0.16), box.x - 0.03, box.top);
      land.ankle = both(V(box.x, box.top + ANKLE_H, 0.15), V(0, 0, 0));
      return keyframes(B, [standKey(B), dip, air, land, shift(standKey(B), box.x - 0.02, box.top)], d);
    },
    props: () => [boxP(box.x + 0.03, box.top, 0.6, 0.5)],
  };
}

/** Seated hip machine: the knees press out (abduction) or squeeze in (adduction). */
function seatedHip(o: { out: boolean; band?: boolean }): Motion {
  return {
    phases: TEMPO.liftFirst(o.out ? "Press out · 1s" : "Squeeze in · 1s", "Return · 2s", "Set", "Squeeze"),
    load: "none",
    pose(B, d) {
      const { hip, sh } = seated(B, 0.48, -8);
      const psi = rad(o.out ? lerp(6, 32, d) : lerp(32, 6, d));
      const leg = (sgn: number) => {
        const knee = V(hip[0] + Math.cos(psi) * B.thigh * 0.98, hip[1] - 0.02, sgn * (B.hipW + Math.sin(psi) * B.thigh * 0.98));
        return add(knee, V(0.04, -B.shin * 0.9, 0));
      };
      const pole = (sgn: number) => V(Math.cos(psi), 0.2, sgn * Math.sin(psi));
      return {
        hip,
        sh,
        ankle: per(leg(-1), leg(1)),
        kneePole: per(pole(-1), pole(1)),
        hand: V(hip[0] + 0.08, hip[1] - 0.02, B.hipW + 0.17),
        elbowPole: V(-1, 0, 0.4),
        headBlend: 1,
      };
    },
    props: o.band ? (B) => [...seatProps(-8, false)(B), cable("kneeL", "kneeR")] : seatProps(-8),
  };
}

/** Woodchop: both hands on one handle, chopping from high on one side to low on the other. */
function woodchop(o: { load: Load; anchor?: boolean }): Motion {
  return {
    phases: TEMPO.liftFirst("Chop down · 1s", "Return · 2s", "High", "Low"),
    load: o.load,
    hold: "centre",
    stance: 0.2,
    pose(B, d) {
      const hip = V(0.02, standY(B, 0.03, lerp(0.99, 0.93, d)));
      const sh = torsoAt(B, hip, lerp(0, 18, d));
      const high = V(sh[0] + 0.3, sh[1] + 0.07, 0.15);
      const low = V(sh[0] + 0.3, sh[1] - 0.32, -0.15);
      const c = lerpV(high, low, d);
      return {
        hip,
        sh,
        hand: per(add(c, V(0, 0, -0.035)), add(c, V(0, 0, 0.035))),
        kneePole: V(1, 0, 0.45),
        elbowPole: V(-0.3, -1, 0.6),
        headBlend: 0.9,
      };
    },
    props: o.anchor ? () => [cable(V(0.5, 2.0, 0.9), "hands")] : undefined,
  };
}

/** Sled push: leaning hard into the posts, driving one leg back and then the other. */
function sledPush(): Motion {
  const frame = (B: Body) => {
    const hip = V(0, ANKLE_H + legMax(B) * 0.82);
    const sh = torsoAt(B, hip, 52);
    return { hip, sh, grab: V(sh[0] + reach(B) * 0.72, sh[1] - 0.08) };
  };
  return {
    phases: [[0.9, 0, 1, "Drive", 1]],
    load: "none",
    stance: 0.13,
    pose(B, d) {
      const { hip, sh, grab } = frame(B);
      const ph = 2 * Math.PI * d;
      const foot = (s: number): Vec => {
        const p = ph + (s > 0 ? Math.PI : 0);
        return V(-0.17 + 0.25 * Math.sin(p), ANKLE_H + Math.max(0, 0.08 * Math.cos(p)), s * 0.13);
      };
      return {
        hip,
        sh,
        ankle: per(foot(-1), foot(1)),
        kneePole: V(1, 0, 0.2),
        hand: V(grab[0], grab[1], 0.2),
        elbowPole: V(-0.3, -1, 0.5),
        headBlend: 0.6,
      };
    },
    props: (B) => {
      const { grab } = frame(B);
      return [
        rail(V(grab[0] + 0.03, grab[1] / 2, -0.2), grab[1], "y"),
        rail(V(grab[0] + 0.03, grab[1] / 2, 0.2), grab[1], "y"),
        { kind: "box", at: V(grab[0] + 0.3, 0.12), size: V(0.6, 0.2, 0.6) },
      ];
    },
  };
}

/** Rowing machine: legs, then body, then arms on the drive; arms, body, legs on the way back. */
function erg(): Motion {
  const plate = V(0.78, 0.3);
  return {
    phases: [
      [1, 1, 0, "Drive: legs, body, arms", 1],
      [1.5, 0, 1, "Arms, body, legs back", 0.4],
    ],
    load: "handle",
    hold: "centre",
    grip: 0.12,
    stance: 0.12,
    pose(B, d) {
      const s = 1 - d; // 0 at the catch, 1 at the finish
      const legs = clamp(s / 0.5, 0, 1),
        body = clamp((s - 0.3) / 0.4, 0, 1),
        arms = clamp((s - 0.6) / 0.4, 0, 1);
      const hipY = 0.4;
      const finishX = plate[0] - Math.sqrt(Math.max(0.01, (legMax(B) * 0.97) ** 2 - (hipY - plate[1]) ** 2));
      const hip = V(lerp(plate[0] - 0.33, finishX, ease(legs)), hipY);
      const lean = lerp(30, -25, ease(body));
      const sh = torsoAt(B, hip, lean);
      const straight = add(sh, mul(V(Math.cos(rad(-10)), Math.sin(rad(-10))), reach(B) * 0.95));
      const ribs = onTorso(hip, sh, lean, 0.62, 0.1);
      const hand = lerpV(straight, ribs, ease(arms));
      return {
        hip,
        sh,
        ankle: V(plate[0], plate[1], 0.12),
        foot: -30,
        kneePole: V(0.3, 1, 0.2),
        hand: V(hand[0], hand[1], 0.12),
        elbowPole: V(-1, 0, 0.6),
        headBlend: 0.8,
      };
    },
    props: () => [
      { kind: "box", at: V(0, -0.1), size: V(0.3, 0.05, 0.28), follow: "hipC" },
      { kind: "box", at: V(0.45, 0.22), size: V(1.8, 0.06, 0.12) },
      { kind: "box", at: V(plate[0] + 0.07, 0.27), size: V(0.05, 0.3, 0.36), tilt: -30 },
      { kind: "box", at: V(1.45, 0.38), size: V(0.28, 0.5, 0.4) },
      cable(V(1.32, 0.55, 0), "hands"),
    ],
  };
}

/** Elliptical: feet on pedals travelling an oval, hands pushing and pulling the handles. */
function elliptical(): Motion {
  return {
    phases: [[1.1, 0, 1, "Stride", 0.8]],
    load: "none",
    stance: 0.12,
    pose(B, d) {
      const hipY = 0.13 + Math.sqrt(Math.max(0.01, (legMax(B) * 0.97) ** 2 - 0.22 ** 2));
      const hip = V(0.05, hipY);
      const sh = torsoAt(B, hip, 6);
      const th = 2 * Math.PI * d;
      const pedal = (p: number, z: number): Vec => V(0.05 + 0.22 * Math.cos(p), 0.2 + 0.07 * Math.sin(p), z);
      const handle = (p: number, z: number): Vec => V(sh[0] + 0.3 - 0.1 * Math.cos(p), sh[1] - 0.22, z);
      return {
        hip,
        sh,
        ankle: per(pedal(th, -0.12), pedal(th + Math.PI, 0.12)),
        kneePole: V(1, 0.1, 0.2),
        hand: per(handle(th + Math.PI, -0.25), handle(th, 0.25)),
        elbowPole: V(-1, -0.6, 0.3),
        headBlend: 1,
      };
    },
    props: () => [boxP(0.05, 0.05, 0.5, 0.9)],
  };
}

/** Walking (an incline treadmill walk): steady strides, arms swinging opposite the legs. */
function walk(): Motion {
  const c = carry({ hold: "each", load: "none" });
  return {
    ...c,
    phases: [[1.2, 0, 1, "Walk", 0.6]],
    pose(B, d) {
      const p = c.pose(B, d);
      const ph = 2 * Math.PI * d;
      const arm = (sgn: number): Vec => {
        const h = swing(V(p.sh[0], p.sh[1], sgn * B.shW), reach(B) * 0.95, sgn * 22 * Math.sin(ph));
        return V(h[0], h[1], sgn * (B.shW + 0.05));
      };
      return { ...p, hand: per(arm(-1), arm(1)), elbowPole: V(-1, 0, 0.3) };
    },
    props: () => [boxP(0.05, 0.03, 0.6, 1.4)],
  };
}

/** Turkish get-up: from lying with the bell pressed up, to the elbow, the hand, a kneel, standing, and back down. */
function turkishGetUp(): Motion {
  return {
    phases: [
      [0.9, 0, 0.25, "Roll to the elbow", 0.8],
      [0.9, 0.25, 0.5, "Up to the hand", 0.8],
      [1.2, 0.5, 0.75, "Sweep the leg, kneel", 0.9],
      [1, 0.75, 1, "Stand up", 1],
      [0.6, 1, 1, "Stand tall", 0.5],
      [1, 1, 0.75, "Kneel", 0.7],
      [1.2, 0.75, 0.5, "Hand down", 0.7],
      [0.9, 0.5, 0.25, "To the elbow", 0.6],
      [0.9, 0.25, 0, "Lie down", 0.5],
      [0.5, 0, 0, "Bell up", 0.3],
    ],
    load: "kettlebell",
    hold: "R",
    stance: 0.13,
    pose(B, d) {
      const L = legMax(B) * 0.95;
      const floorHip = V(0.25, 0.13);
      const lying = (lean: number, handL: (sh: Vec) => Vec, poleL: Vec): Key => {
        const sh = torsoAt(B, floorHip, lean);
        return {
          hip: floorHip,
          lean,
          hand: { L: handL(sh), R: V(0, 0, 0) },
          ankle: { L: V(floorHip[0] + L, 0.1, -0.16), R: V(floorHip[0] + 0.45, ANKLE_H, 0.15) },
          foot: 0,
          kneePole: { L: V(0, 1, -0.1), R: V(0.3, 1, 0.1) },
          elbowPole: { L: poleL, R: V(0, 0, 1) },
          headBlend: 0,
        };
      };
      const lie = lying(-90, (sh) => V(sh[0] + 0.15, 0.04, -(B.shW + 0.25)), V(0, 1, -0.5));
      const elbow = lying(-55, (sh) => V(sh[0] + 0.25, 0.04, -(B.shW + 0.13)), V(-0.5, -1, -0.5));
      const hand = lying(-25, (sh) => V(sh[0] - 0.07, 0.05, -(B.shW + 0.1)), V(-1, 0, -0.3));
      hand.headBlend = 0.5;
      const kneelHip = V(0, 0.06 + B.thigh * 0.96);
      const kneelSh = torsoAt(B, kneelHip, 4);
      const free = hang(B, kneelSh, 0.06, 0.95);
      const kneel: Key = {
        hip: kneelHip,
        lean: 4,
        hand: { L: V(free[0], free[1], -free[2]), R: V(0, 0, 0) },
        ankle: { L: V(kneelHip[0] - B.shin * 0.95, 0.08, -0.12), R: V(kneelHip[0] + B.thigh * 0.95, ANKLE_H, 0.14) },
        foot: 0,
        kneePole: { L: V(0.4, -1, -0.1), R: V(1, 0.3, 0.2) },
        elbowPole: { L: V(-1, 0, -0.4), R: V(0, 0, 1) },
        headBlend: 0.9,
      };
      const stood = standKey(B);
      const p = keyframes(B, [lie, elbow, hand, kneel, stood], d);
      // The bell arm stays locked and vertical the whole way.
      const hR = V(p.sh[0], p.sh[1] + reach(B) * 0.95, B.shW);
      return { ...p, hand: per(sideOf(p.hand, "L", V(0, 0, 0)), hR) };
    },
  };
}

/** Kettlebell windmill (drawn as a hinge: the figure can't bend sideways): the bell stays straight up while the free hand slides down the leg. */
function windmill(): Motion {
  return {
    phases: TEMPO.lowerFirst("Hinge down · 2s", "Stand · 1s", "Bell up", "Bottom"),
    load: "kettlebell",
    hold: "R",
    stance: 0.17,
    pose(B, d) {
      const lean = lerp(2, 68, d);
      const shX = 0.03 + 0.08 * d;
      const hipX = shX - Math.sin(rad(lean)) * B.torso;
      const hip = V(hipX, standY(B, hipX, lerp(1, 0.96, d)));
      const sh = torsoAt(B, hip, lean);
      const r = reach(B);
      return {
        hip,
        sh,
        hand: per(V(sh[0] + 0.02, sh[1] - r * 0.95, -(B.shW - 0.02)), V(sh[0], sh[1] + r * 0.95, B.shW)),
        elbowPole: per(V(-1, 0, -0.3), V(0, 0, 1)),
        kneePole: V(1, 0, 0.3),
        headBlend: 0.3,
      };
    },
  };
}

/** Hang clean: from the hang, jump and shrug, pull under and catch the bar in the front rack. */
function hangClean(): Motion {
  return {
    phases: [
      [0.5, 1, 1, "Hang", 0.4],
      [0.45, 1, 0.5, "Jump", 1],
      [0.45, 0.5, 0, "Pull under, rack", 0.9],
      [0.5, 0, 0, "Catch", 0.6],
      [1.2, 0, 1, "Lower to the hang", 0.5],
    ],
    load: "barbell",
    stance: 0.15,
    grip: 0.22,
    pose(B, d) {
      const h = clamp((d - 0.5) / 0.5, 0, 1);
      const catchDip = 0.07 * clamp(1 - d / 0.3, 0, 1);
      const lean = lerp(2, 32, h);
      const shX = 0.04 + 0.05 * h;
      const hipX = shX - Math.sin(rad(lean)) * B.torso;
      const hip = V(hipX, standY(B, hipX, lerp(1, 0.93, h)) - catchDip);
      const sh = torsoAt(B, hip, lean);
      const r = reach(B);
      const hangBar = V(sh[0] + 0.03, sh[1] - r * 0.96);
      const rackBar = add(sh, add(mul(frontOf(lean), 0.12), V(0, 0.02)));
      const k = clamp(d / 0.5, 0, 1); // 0 racked, 1 at the hips
      const bar = d >= 0.5 ? hangBar : add(lerpV(rackBar, hangBar, k), V(0.05 * Math.sin(Math.PI * k), 0, 0));
      return {
        hip,
        sh,
        bar,
        hand: V(bar[0] - 0.02 * (1 - k), bar[1] - 0.02 * (1 - k), 0.22),
        shrug: 0.05 * Math.sin(Math.PI * clamp((d - 0.25) / 0.5, 0, 1)),
        // Elbows lead high on the pull, then whip round to the front for the catch.
        elbowPole: k > 0.5 ? lerpV(V(-0.3, 1, 0.5), V(-1, 0, 0.3), (k - 0.5) * 2) : lerpV(V(1, -0.1, 0.3), V(-0.3, 1, 0.5), k * 2),
        kneePole: V(1, 0, 0.45),
        headBlend: 0.7,
      };
    },
  };
}

// ---------- hangs, one-leg squats and lifts (audit batch 5) ----------
const barHeight = (B: Body) => 2.05 * (B.s > 0.95 ? 1 : 0.97);
/** Turns an offset drawn for an upright torso (x forward, y up) to a torso leaning `lean` degrees. */
const tilt = (v: Vec, lean: number): Vec => {
  const c = Math.cos(rad(lean)),
    s = Math.sin(rad(lean));
  return V(v[0] * c + v[1] * s, -v[0] * s + v[1] * c, v[2]);
};
/** Where the shoulders hang under a bar for a grip, arms straight. */
const hangShoulderY = (B: Body, grip: number) => {
  const r = reach(B) * 0.97;
  return barHeight(B) - Math.sqrt(Math.max(0.01, r * r - (grip - B.shW) ** 2));
};

/**
 * Hanging moves that turn the body around the bar, as key poses: the torso at `lean` (0 upright,
 * -90 face up and level, ±180 upside down), the legs straight or tucked against it. The hands stay
 * on the bar or rings.
 */
interface BarKey {
  sh: Vec;
  lean: number;
  legs: "straight" | "tuck" | "pike";
  elbowPole?: Vec;
}
function barKeys(B: Body, keys: BarKey[], d: number, grip: number): Pose {
  const k = clamp(d, 0, 1) * (keys.length - 1);
  const i = Math.min(Math.floor(k), keys.length - 2);
  const t = ease(k - i);
  const a = keys[i]!,
    b = keys[i + 1]!;
  const sh = lerpV(a.sh, b.sh, t);
  const lean = lerp(a.lean, b.lean, t);
  const hip = sub(sh, V(Math.sin(rad(lean)) * B.torso, Math.cos(rad(lean)) * B.torso));
  const leg = legMax(B);
  const legOff = (l: BarKey["legs"]): Vec => (l === "tuck" ? V(0.24, -0.12) : l === "pike" ? V(leg * 0.97, 0.05) : V(-0.04, -leg * 0.96));
  const off = tilt(lerpV(legOff(a.legs), legOff(b.legs), t), lean);
  const ankle = add(hip, off);
  const bar = barHeight(B);
  return {
    hip,
    sh,
    hand: V(0.04, bar, grip),
    ankle: per(V(ankle[0], ankle[1], -0.08), V(ankle[0], ankle[1], 0.08)),
    foot: 30,
    kneePole: tilt(V(1, 0.1, 0.1), lean),
    elbowPole: lerpV(a.elbowPole ?? V(-0.2, -1, 1), b.elbowPole ?? V(-0.2, -1, 1), t),
    headBlend: 0.4,
  };
}
const barProp = (B: Body): Prop[] => [rail(V(0.04, barHeight(B), 0), 1.3, "z")];

/** Muscle-up: pull high, lean the chest over the bar, press out to straight arms, and lower back to the hang. */
function muscleUp(o: { rings?: boolean } = {}): Motion {
  const grip = o.rings ? 0.26 : 0.3;
  return {
    phases: [
      [0.4, 0, 0, "Hang", 0.4],
      [0.6, 0, 1 / 3, "Pull high", 1],
      [0.45, 1 / 3, 2 / 3, "Over the top", 1],
      [0.5, 2 / 3, 1, "Press out", 0.9],
      [0.5, 1, 1, "Support", 0.5],
      [1.8, 1, 0, "Lower · 2s", 0.6],
    ],
    load: "none",
    grip,
    pose(B, d) {
      const bar = barHeight(B);
      const hang = hangShoulderY(B, grip);
      return barKeys(
        B,
        [
          { sh: V(-0.01, hang), lean: 6, legs: "straight" },
          { sh: V(-0.1, bar - 0.16), lean: 18, legs: "straight", elbowPole: V(-0.4, -1, 0.6) },
          { sh: V(0.14, bar + 0.06), lean: 38, legs: "straight", elbowPole: V(-1, 0.4, 0.3) },
          { sh: V(0.08, bar + reach(B) * 0.9), lean: 12, legs: "straight", elbowPole: V(-1, 0, 0.3) },
        ],
        d,
        grip,
      );
    },
    props: o.rings ? undefined : barProp,
  };
}

/** Skin the cat: tuck and rotate backwards through the arms to a German hang, then back. */
function skinTheCat(): Motion {
  const grip = 0.3;
  return {
    phases: [
      [0.4, 0, 0, "Hang", 0.4],
      [1.1, 0, 0.5, "Tuck and turn over", 0.9],
      [1.1, 0.5, 1, "Lower behind", 0.8],
      [0.8, 1, 1, "Hold", 0.7],
      [2.2, 1, 0, "Back through", 0.7],
    ],
    load: "none",
    grip,
    pose(B, d) {
      const hang = hangShoulderY(B, grip);
      return barKeys(
        B,
        [
          { sh: V(-0.01, hang), lean: 6, legs: "straight" },
          { sh: V(-0.02, hang + 0.04), lean: -90, legs: "tuck" },
          { sh: V(0, hang + 0.04), lean: -180, legs: "tuck" },
          { sh: V(0.1, hang + 0.05), lean: -300, legs: "straight", elbowPole: V(1, -0.3, 0.6) },
        ],
        d,
        grip,
      );
    },
    props: barProp,
  };
}

/** Tuck front lever: from the hang, swing the body up level and face up, knees tucked, and hold. */
function tuckFrontLever(): Motion {
  const grip = 0.3;
  return {
    phases: [
      [0.4, 0, 0, "Hang", 0.4],
      [1, 0, 1, "Pull into the lever", 1],
      [3, 1, 1, "Hold", 0.95],
      [1, 1, 0, "Lower", 0.5],
    ],
    load: "none",
    grip,
    pose(B, d) {
      const hang = hangShoulderY(B, grip);
      return barKeys(
        B,
        [
          { sh: V(-0.01, hang), lean: 6, legs: "straight" },
          { sh: V(-0.06, hang + 0.03), lean: -88, legs: "tuck" },
        ],
        d,
        grip,
      );
    },
    props: barProp,
  };
}

/** Windshield wipers: hanging with the legs up beside the bar, swinging them down to one side and the other. */
function windshieldWiper(): Motion {
  const grip = 0.32;
  return {
    phases: [
      [0.9, 0.5, 1, "Legs to the right", 0.9],
      [1.5, 1, 0, "Over to the left", 0.9],
      [0.9, 0, 0.5, "Back to the centre", 0.7],
    ],
    load: "none",
    grip,
    pose(B, d) {
      const hang = hangShoulderY(B, grip);
      const sh = V(-0.06, hang + 0.04);
      const lean = -55;
      const hip = sub(sh, V(Math.sin(rad(lean)) * B.torso, Math.cos(rad(lean)) * B.torso));
      const s = rad(lerp(-70, 70, d));
      const leg = legMax(B) * 0.97;
      const dir = norm(V(0.25, Math.cos(s), Math.sin(s)));
      const at = (sgn: number): Vec => add(add(hip, V(0, 0, sgn * B.hipW)), mul(dir, leg));
      return {
        hip,
        sh,
        hand: V(0.04, barHeight(B), grip),
        ankle: per(at(-1), at(1)),
        foot: 20,
        kneePole: V(0, 0.2, 1),
        elbowPole: V(-0.2, -1, 1),
        headBlend: 0.3,
      };
    },
    props: barProp,
  };
}

/**
 * Archer and typewriter pull-ups, wide grip: the archer pulls up to one hand with the other arm
 * straight, one side then the other; the typewriter pulls up to the middle and slides across.
 */
function sidePullUp(o: { typewriter?: boolean }): Motion {
  const grip = 0.46;
  return {
    phases: o.typewriter
      ? [
          [0.4, 0, 0, "Hang", 0.4],
          [1, 0, 0.4, "Pull up", 1],
          [2.6, 0.4, 1, "Slide right, then left", 1],
          [1.6, 0.4, 0, "Lower · 2s", 0.6],
        ]
      : [
          [1, 0.5, 1, "Pull to the right", 1],
          [1.5, 1, 0.5, "Lower · 2s", 0.6],
          [1, 0.5, 0, "Pull to the left", 1],
          [1.5, 0, 0.5, "Lower · 2s", 0.6],
        ],
    load: "none",
    grip,
    pose(B, d) {
      const bar = barHeight(B);
      const hang = hangShoulderY(B, grip);
      let pull: number, z: number;
      if (o.typewriter) {
        pull = clamp(d / 0.4, 0, 1);
        z = d > 0.4 ? 0.2 * Math.sin((2 * Math.PI * (d - 0.4)) / 0.6) : 0;
      } else {
        pull = Math.abs(2 * d - 1);
        z = 0.22 * (2 * d - 1);
      }
      const sh = V(-0.01 - 0.04 * pull, lerp(hang, bar - 0.16, ease(pull)), z);
      const hip = add(torsoAt(B, V(sh[0], sh[1]), 186), V(0, 0, z * 0.8));
      return {
        hip,
        sh,
        hand: V(0.04, bar, grip),
        ankle: per(V(hip[0] - 0.08, hip[1] - legMax(B) * 0.92, hip[2] - 0.08), V(hip[0] - 0.08, hip[1] - legMax(B) * 0.92, hip[2] + 0.08)),
        foot: 35,
        kneePole: V(1, 0, 0.1),
        elbowPole: V(-0.2, -1, 1),
        headBlend: 0.8,
      };
    },
    props: barProp,
  };
}

/** Power clean: pull the bar from the floor, jump and catch it on the shoulders, stand, and lower it back down. */
function powerClean(): Motion {
  const hc = hangClean();
  const dl = deadlift();
  return {
    phases: [
      [0.6, 2, 2, "Set", 0.35],
      [0.6, 2, 1, "First pull", 0.9],
      [0.4, 1, 0.5, "Jump", 1],
      [0.4, 0.5, 0, "Pull under, rack", 0.9],
      [0.5, 0, 0, "Catch", 0.6],
      [1.2, 0, 1, "Down to the hips", 0.5],
      [1.2, 1, 2, "Lower to the floor", 0.5],
    ],
    load: "barbell",
    stance: 0.15,
    grip: 0.22,
    pose(B, d) {
      if (d <= 1) return hc.pose(B, d);
      // the deadlift from the floor to the hips, with the clean's grip
      const p = dl.pose(B, d - 1);
      return { ...p, hand: V(p.bar![0], p.bar![1], 0.22) };
    },
  };
}

/** Overhead squat: bar locked out overhead on a wide grip, sitting down with the chest up. */
function overheadSquat(): Motion {
  const sq = squat({ hold: "front" });
  return {
    phases: TEMPO.lowerFirst(),
    load: "barbell",
    stance: 0.2,
    grip: 0.42,
    pose(B, d) {
      const p = sq.pose(B, d * 0.9);
      const r = reach(B) * 0.97;
      const up = Math.sqrt(Math.max(0.01, r * r - (0.42 - B.shW) ** 2));
      const bar = V(MIDFOOT + 0.02, p.sh[1] + up * 0.98);
      return { ...p, bar, hand: V(bar[0], bar[1], 0.42), elbowPole: V(-1, 0, 0.5), headBlend: 0.8 };
    },
  };
}

/**
 * One-leg squats on the right leg: the pistol (left leg held out straight in front), to a box, or
 * holding a strap for balance.
 */
function pistol(o: { box?: boolean; assisted?: boolean }): Motion {
  const sq = squat({ hold: "arms" });
  const depth = o.box ? 0.8 : 1.15;
  return {
    phases: TEMPO.lowerFirst("Lower · 2s", "Stand · 1s", "Tall", o.box ? "Touch the box" : "Bottom"),
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const e = ease(d);
      const p = sq.pose(B, d * depth);
      const hip = add(p.hip, V(0, 0, 0.06));
      const sh = add(p.sh, V(0, 0, 0.06));
      const ankleR = V(0.02, ANKLE_H, 0.12);
      // the free leg straight out in front, the foot off the floor
      const a = rad(lerp(22, 82, e));
      const leg = legMax(B) * 0.97;
      let ankleL = add(V(hip[0], hip[1], hip[2] - B.hipW), V(Math.sin(a) * leg, -Math.cos(a) * leg, -0.02));
      if (ankleL[1] < 0.12) ankleL = V(ankleL[0], 0.12, ankleL[2]);
      ankleL = within(V(hip[0], hip[1], hip[2] - B.hipW), ankleL, leg);
      const reachOut = (sgn: number): Vec => {
        if (o.assisted) return V(0.62, lerp(1.15, 0.95, e), sgn * 0.14);
        const v = add(sh, V(reach(B) * lerp(0.4, 0.95, e), lerp(-0.4, -0.05, e), 0));
        return V(v[0], v[1], sh[2] + sgn * (B.shW + 0.02));
      };
      const shSide = (sgn: number) => V(sh[0], sh[1], sh[2] + sgn * B.shW);
      return {
        hip,
        sh,
        ankle: per(ankleL, ankleR),
        foot: { L: -10, R: 0 },
        kneePole: per(V(0, 1, -0.1), V(1, 0, 0.3)),
        hand: per(within(shSide(-1), reachOut(-1), reach(B) * 0.98), within(shSide(1), reachOut(1), reach(B) * 0.98)),
        elbowPole: V(-0.3, -1, 0.3),
        headBlend: 0.7,
      };
    },
    props: o.box
      ? (B) => [boxP(-0.3, ANKLE_H + B.shin * 0.98 * 0.95 - 0.08, 0.4, 0.35)]
      : o.assisted
        ? () => [cable(V(0.7, 2.4, -0.14), "handL"), cable(V(0.7, 2.4, 0.14), "handR")]
        : undefined,
  };
}

/** Wall sit: back flat on the wall, thighs level, held; one-leg wall sits hold the other leg out straight. */
function wallSit(o: { oneLeg?: boolean }): Motion {
  return {
    phases: [
      [0.9, 0, 1, "Slide down", 0.6],
      [3, 1, 1, "Hold", 0.95],
      [0.9, 1, 0, "Stand up", 0.5],
    ],
    load: "none",
    stance: 0.14,
    pose(B, d) {
      const e = ease(d);
      const ankle = V(0.04, ANKLE_H);
      const hipX = ankle[0] - B.thigh * 0.97;
      const topY = ANKLE_H + Math.sqrt(Math.max(0.01, (legMax(B) * 0.99) ** 2 - (ankle[0] - hipX) ** 2));
      const hip = V(hipX, lerp(topY, ANKLE_H + B.shin * 0.97, e));
      const sh = torsoAt(B, hip, 0);
      const leg = legMax(B) * 0.97;
      const out = within(V(hip[0], hip[1], -B.hipW), V(hip[0] + leg, hip[1] + 0.02, -0.12), leg);
      const ankleL = o.oneLeg ? lerpV(V(ankle[0], ANKLE_H, -0.14), out, e) : V(ankle[0], ANKLE_H, -0.14);
      return {
        hip,
        sh,
        ankle: per(ankleL, V(ankle[0], ANKLE_H, 0.14)),
        kneePole: V(1, 0, 0.3),
        hand: o.oneLeg ? V(hip[0] + 0.05, hip[1] + 0.04, B.hipW + 0.14) : V(hip[0] + 0.25, hip[1] + 0.05, 0.18),
        elbowPole: V(-0.5, -1, 0.5),
        headBlend: 1,
      };
    },
    props: (B) => [{ kind: "box", at: V(-B.thigh * 0.97 - 0.13, 1.2), size: V(0.08, 2.4, 1.4) }],
  };
}

/** Calf raises from the bottom of a wall sit: the back stays on the wall and the heels lift. */
function wallSitCalfRaise(): Motion {
  const base = wallSit({});
  return {
    ...base,
    phases: TEMPO.liftFirst("Heels up · 1s", "Lower · 2s", "Heels down", "Squeeze"),
    pose(B, d) {
      const p = base.pose(B, 1);
      const lift = 0.07 * d;
      const a = p.ankle;
      const up = (v: Vec) => V(v[0], v[1] + lift, v[2]);
      return {
        ...p,
        hip: up(p.hip),
        sh: up(p.sh),
        ankle: a && !Array.isArray(a) ? { L: up(a.L), R: up(a.R) } : a,
        foot: 45 * d,
        hand: Array.isArray(p.hand) ? up(p.hand) : { L: up(p.hand.L), R: up(p.hand.R) },
      };
    },
  };
}

/** Sissy squat: up on the toes, knees travelling forward and down while the body leans back in one line. */
function sissySquat(): Motion {
  return {
    phases: TEMPO.lowerFirst("Lean back · 2s", "Up · 1s", "Tall", "Bottom"),
    load: "none",
    stance: 0.12,
    pose(B, d) {
      const e = ease(d);
      const ankle = V(0.04, ANKLE_H + 0.06 * e);
      const b = rad(lerp(4, 72, e));
      const knee = add(ankle, V(Math.sin(b) * B.shin * 0.99, Math.cos(b) * B.shin * 0.99));
      const c = rad(lerp(2, 50, e));
      const hip = add(knee, V(-Math.sin(c) * B.thigh * 0.99, Math.cos(c) * B.thigh * 0.99));
      const lean = -lerp(2, 45, e);
      const sh = torsoAt(B, hip, lean);
      const c2 = add(sh, V(0.16, -0.16));
      return {
        hip,
        sh,
        ankle: V(ankle[0], ankle[1], 0.12),
        foot: lerp(0, 35, e),
        kneePole: V(1, 0, 0.2),
        hand: per(V(c2[0], c2[1], -0.07), V(c2[0], c2[1], 0.07)),
        elbowPole: V(0.2, -1, 1),
        headBlend: 0.6,
      };
    },
  };
}

/** Lying pullover: on a flat bench, one weight held in both hands, arcing from over the chest to behind the head. */
function pullover(o: { load: "dumbbell" | "barbell" | "kettlebell" }): Motion {
  return {
    phases: TEMPO.lowerFirst("Reach back · 2s", "Pull over · 1s", "Over the chest", "Stretch"),
    load: o.load,
    hold: o.load === "barbell" ? undefined : "centre",
    stance: 0.3,
    grip: o.load === "barbell" ? 0.2 : 0.06,
    pose(B, d) {
      const hip = V(0.28, 0.53);
      const sh = torsoAt(B, hip, -90);
      const phi = rad(lerp(0, 100, d));
      const r = reach(B) * 0.92;
      const hand = add(sh, V(-Math.sin(phi) * r + 0.04, Math.cos(phi) * r));
      const z = o.load === "barbell" ? 0.2 : 0.06;
      return {
        hip,
        sh,
        bar: o.load === "barbell" ? hand : undefined,
        ankle: V(0.72, ANKLE_H, 0.3),
        kneePole: V(0.3, 1, 0.3),
        hand: V(hand[0], hand[1], z),
        elbowPole: V(0.3, 0.2, 1),
        headBlend: 0,
      };
    },
    props: () => [bench(-0.55, 0.5, 0.45, 0.3)],
  };
}

/** Medicine ball slam: reach the ball overhead, then slam it into the floor with the hips and arms, and pick it up. */
function ballSlam(): Motion {
  const sq = squat({ hold: "arms" });
  return {
    phases: [
      [0.6, 1, 0, "Ball overhead", 0.6],
      [0.35, 0, 1, "Slam", 1],
      [0.5, 1, 1, "Pick it up", 0.4],
    ],
    load: "ball",
    hold: "centre",
    stance: 0.2,
    grip: 0.1,
    pose(B, d) {
      const e = ease(d);
      const p = sq.pose(B, 0.8 * e);
      const lean = lerp(-4, 62, e);
      const hip = p.hip;
      const sh = torsoAt(B, hip, lean);
      const over = add(sh, V(0.02, reach(B) * 0.93));
      const floor = V(0.48, 0.16);
      const hand = within(sh, lerpV(over, floor, e), reach(B) * 0.97);
      return {
        hip,
        sh,
        hand: V(hand[0], hand[1], 0.1),
        kneePole: V(1, 0, 0.45),
        elbowPole: V(0.2, lerp(1, -1, e), 0.6),
        headBlend: 0.6,
      };
    },
  };
}

// ---------- the rest of the audit (batch 6) ----------
/** Triceps kickback: bent over, upper arm pinned along the side, the forearm swinging back until the arm is straight. */
function tricepsKickback(o: { load: Load; cable?: boolean }): Motion {
  return {
    phases: TEMPO.liftFirst("Kick back · 1s", "Return · 2s", "Elbow bent", "Squeeze"),
    load: o.load,
    hold: o.load === "dumbbell" ? "R" : undefined,
    stance: 0.15,
    pose(B, d) {
      const lean = 62;
      const shX = MIDFOOT + 0.06;
      const hipX = shX - Math.sin(rad(lean)) * B.torso;
      const hip = V(hipX, standY(B, hipX, 0.93));
      const sh = torsoAt(B, hip, lean);
      // the upper arm runs back along the torso, the elbow by the ribs
      const back = norm(sub(hip, sh));
      const shR = V(sh[0], sh[1] - B.shDrop * 0.5, B.shW);
      const elbow = add(shR, add(mul(back, B.upper * 0.97), V(0, -0.04, 0)));
      const a = rad(lerp(0, 1, ease(d)) * 90);
      const down = V(0, -1, 0);
      const dir = norm(add(mul(down, Math.cos(a)), mul(back, Math.sin(a))));
      const hand = add(elbow, mul(dir, B.fore * 0.97));
      return {
        hip,
        sh,
        hand: per(add(V(hip[0], hip[1], 0), V(0.4, -0.12, -0.17)), V(hand[0], hand[1], B.shW + 0.02)),
        elbowPole: per(V(-1, 0.6, 0.5), add(mul(back, -1), V(0, -0.3, 0.2))),
        kneePole: V(1, 0, 0.3),
        headBlend: 0.15,
      };
    },
    props: o.cable ? () => [cable(V(1.0, 0.25, 0.2), "handR")] : undefined,
  };
}

/** Sleds on a strap or rope: dragging it walking backwards, pulling it in hand over hand, or rowing it in. */
function sledPull(o: { kind: "drag" | "pull" | "row" }): Motion {
  const sledAt = V(1.9, 0.18);
  return {
    phases:
      o.kind === "drag"
        ? TEMPO.walk()
        : o.kind === "pull"
          ? [
              [0.6, 0, 0.5, "Pull, right hand", 0.9],
              [0.6, 0.5, 1, "Pull, left hand", 0.9],
            ]
          : TEMPO.liftFirst("Row · 1s", "Reach · 1s", "Arms long", "Squeeze"),
    load: "handle",
    stance: 0.2,
    grip: 0.12,
    pose(B, d) {
      const ph = d * Math.PI * 2;
      const walk = o.kind === "drag";
      const foot = (s: number): Vec => {
        if (!walk) return V(s * 0.06, ANKLE_H, s * 0.2);
        const p = ph + (s > 0 ? Math.PI : 0);
        return V(0.15 * Math.sin(p), ANKLE_H + Math.max(0, 0.06 * Math.cos(p)), s * 0.14);
      };
      const hip = V(-0.08, standY(B, 0.12, 0.88));
      const lean = walk ? -6 : o.kind === "row" ? lerp(18, -8, ease(d)) : 14;
      const sh = torsoAt(B, hip, lean);
      const r = reach(B) * 0.95;
      const strap = (sgn: number, k: number): Vec => {
        const far = V(sh[0] + r * 0.9, sh[1] - r * 0.4, sgn * 0.12);
        const near = V(sh[0] + 0.12, sh[1] - 0.25, sgn * 0.17);
        return lerpV(far, near, k);
      };
      let hand: Pose["hand"];
      if (walk) {
        const low = (sgn: number) => within(V(sh[0], sh[1], sgn * B.shW), V(hip[0] + 0.4, hip[1] - 0.05, sgn * 0.12), r);
        hand = per(low(-1), low(1));
      } else if (o.kind === "row") hand = per(strap(-1, ease(d)), strap(1, ease(d)));
      else {
        // hand over hand: one reaches out along the rope while the other pulls it to the hip
        const k = (d < 0.5 ? d : 1 - d) * 2;
        hand = per(strap(-1, 1 - k), strap(1, k));
      }
      return {
        hip,
        sh,
        hand,
        ankle: per(foot(-1), foot(1)),
        foot: walk ? { L: foot(-1)[1] > ANKLE_H + 0.01 ? 12 : 0, R: foot(1)[1] > ANKLE_H + 0.01 ? 12 : 0 } : 0,
        kneePole: V(1, 0, 0.4),
        elbowPole: V(-1, -0.2, 0.5),
        headBlend: 0.8,
      };
    },
    props: () => [
      { kind: "box", at: V(sledAt[0], sledAt[1] / 2 + 0.1), size: V(0.7, 0.3, 0.6) },
      cable(V(sledAt[0] - 0.35, sledAt[1] + 0.1, 0), o.kind === "drag" ? "hands" : o.kind === "pull" ? "handL" : "hands"),
    ],
  };
}

/** Tibialis raise: heels down and shoulders back on a wall, the toes lifting towards the shins. */
function tibialisRaise(o: { band?: boolean }): Motion {
  return {
    phases: TEMPO.liftFirst("Toes up · 1s", "Lower · 2s", "Flat", "Squeeze"),
    load: "none",
    stance: 0.12,
    pose(B, d) {
      const ankleX = 0.32;
      const hip = V(0, standY(B, ankleX, 0.99));
      const sh = torsoAt(B, hip, -6);
      const h = hang(B, sh, 0.06, 0.95);
      return {
        hip,
        sh,
        ankle: V(ankleX, ANKLE_H, 0.12),
        foot: lerp(0, -30, ease(d)),
        kneePole: V(1, 0, 0.2),
        hand: V(h[0], h[1], h[2]),
        elbowPole: V(-1, 0, 0.4),
        headBlend: 1,
      };
    },
    props: (B) => {
      const p: Prop[] = [{ kind: "box", at: V(-0.2, 1.2), size: V(0.08, 2.4, 1.4) }];
      if (o.band) p.push(cable(V(0.95, 0.1, -0.12), "ankleL"), cable(V(0.95, 0.1, 0.12), "ankleR"));
      void B;
      return p;
    },
  };
}

/** Fire hydrant: on all fours, the bent right knee lifting out to the side. */
function fireHydrant(): Motion {
  const base = allFours({ kind: "birdDog" });
  return {
    phases: TEMPO.liftFirst("Knee out · 1s", "Lower · 2s", "All fours", "Squeeze"),
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const p = base.pose(B, 0.5);
      const a = rad(lerp(0, 65, ease(d)));
      const hipR = V(p.hip[0], p.hip[1], B.hipW);
      const out = V(0, -Math.cos(a), Math.sin(a));
      const knee = add(hipR, mul(out, B.thigh * 0.97));
      const ankleR = add(knee, V(-B.shin * 0.95, 0.02, 0));
      const ankleL = sideOf(p.ankle, "L", V(0, 0.08, -0.1));
      return { ...p, ankle: per(ankleL, ankleR), kneePole: per(V(0.4, -1, -0.1), out), foot: { L: 150, R: 150 } };
    },
  };
}

/**
 * Standing cable leg moves on one leg (holding a frame): the right leg sweeping out to the side,
 * across in front, or the heel curling up behind.
 */
function cableLeg(o: { move: "out" | "in" | "curl" }): Motion {
  return {
    phases: TEMPO.liftFirst(
      o.move === "curl" ? "Curl · 1s" : o.move === "out" ? "Out · 1s" : "Across · 1s",
      "Return · 2s",
      "Set",
      "Squeeze",
    ),
    load: "none",
    stance: 0.11,
    pose(B, d) {
      const e = ease(d);
      const hip = V(0, standY(B, 0.03, 0.99), -0.03);
      const sh = add(torsoAt(B, V(hip[0], hip[1]), 6), V(0, 0, -0.03));
      const L = legMax(B) * 0.97;
      const hipR = V(hip[0], hip[1], hip[2] + B.hipW);
      let ankleR: Vec;
      let kneePole: Vec = V(1, 0, 0.3);
      if (o.move === "curl") {
        const knee = add(hipR, V(0.02, -B.thigh * 0.98));
        const a = rad(lerp(4, 110, e));
        ankleR = add(knee, V(-Math.sin(a) * B.shin * 0.96, -Math.cos(a) * B.shin * 0.96));
        kneePole = V(0.3, -1, 0);
      } else {
        const a = rad(o.move === "out" ? lerp(3, 38, e) : lerp(30, -14, e));
        ankleR = add(hipR, V(o.move === "in" ? 0.14 * clamp(-Math.sin(a) * 4, 0, 1) : 0.02, -Math.cos(a) * L, Math.sin(a) * L));
      }
      return {
        hip,
        sh,
        ankle: per(V(0.03, ANKLE_H, -0.12), ankleR),
        foot: { L: 0, R: o.move === "curl" ? lerp(0, 40, e) : 10 },
        kneePole,
        hand: per(V(sh[0] + 0.35, sh[1] - 0.3, -0.25), V(hip[0] + 0.02, hip[1] + 0.06, hip[2] + B.hipW + 0.13)),
        elbowPole: per(V(-0.3, -1, -0.4), V(-0.4, 0, 1)),
        headBlend: 0.9,
      };
    },
    props: (B) => [
      cable(o.move === "out" ? V(0, 0.12, -0.9) : o.move === "in" ? V(0, 0.12, 1.0) : V(0.9, 0.12, 0.11), "ankleR"),
      rail(V(reach(B) * 0.5 + 0.06, 1.1, -0.25), 0.3, "y"),
    ],
  };
}

/**
 * Side bends: the trunk tips sideways over the hips. A weight in the right hand lowers down that
 * side; on the cable, the handle comes up as the trunk bends away. The standing oblique crunch
 * brings the right elbow down to a knee lifting out to the side.
 */
function sideBend(o: { load: Load; cable?: boolean; crunch?: boolean }): Motion {
  return {
    phases: TEMPO.lowerFirst("Bend · 2s", "Up · 1s", "Tall", "Stretch"),
    load: o.load,
    hold: o.load === "none" || o.load === "handle" ? undefined : "R",
    stance: o.crunch ? 0.13 : 0.16,
    pose(B, d) {
      const e = ease(d);
      const b = rad(o.cable ? lerp(-16, 18, e) : o.crunch ? lerp(0, 22, e) : lerp(0, 24, e));
      const hip = V(0.02, standY(B, 0.03, 0.99), -Math.sin(b) * 0.04);
      const sh = add(hip, V(0, Math.cos(b) * B.torso, Math.sin(b) * B.torso));
      const shR = add(sh, V(0, 0, B.shW)),
        shL = add(sh, V(0, 0, -B.shW));
      const r = reach(B) * 0.96;
      const behindHead = (s: Vec, sgn: number): Vec => add(s, V(-0.06, 0.2, -sgn * 0.08));
      // the working hand hangs straight down (the left on the cable, beside the stack); the other goes behind the head
      const handR = o.crunch || o.cable ? behindHead(shR, 1) : add(shR, V(0.02, -r, 0.04));
      const handL = o.cable ? add(shL, V(0.02, -r, -0.04)) : behindHead(shL, -1);
      let ankleR: Vec = V(0.03, ANKLE_H, 0.16);
      if (o.crunch) {
        const a = rad(lerp(0, 55, e));
        const hipR = V(hip[0], hip[1], hip[2] + B.hipW);
        const knee = add(hipR, V(0.05, -Math.cos(a) * B.thigh * 0.97, Math.sin(a) * B.thigh * 0.97));
        ankleR = add(knee, V(-0.02, -B.shin * 0.95, 0.02));
      }
      return {
        hip,
        sh,
        hand: per(handL, handR),
        ankle: per(V(0.03, ANKLE_H, -(o.crunch ? 0.13 : 0.16)), ankleR),
        kneePole: V(1, 0, 0.4),
        elbowPole: o.cable
          ? per(V(-0.5, -1, -0.4), V(-0.2, 0.4, 1))
          : o.crunch
            ? per(V(-0.2, 0.4, -1), V(-0.2, 0.4, 1))
            : per(V(-0.2, 0.4, -1), V(-0.5, -1, 0.4)),
        headBlend: 0.6,
      };
    },
    props: o.cable ? () => [cable(V(0.05, 0.15, -0.9), "handL")] : undefined,
  };
}

/** Shadow boxing: fighting stance, hands up, throwing a jab with the left and a cross with the right. */
function shadowBoxing(): Motion {
  return {
    phases: [
      [0.25, 0, 0.25, "Jab", 1],
      [0.25, 0.25, 0.5, "Guard", 0.5],
      [0.25, 0.5, 0.75, "Cross", 1],
      [0.25, 0.75, 1, "Guard", 0.5],
    ],
    load: "none",
    stance: 0.14,
    pose(B, d) {
      const bounce = 0.015 * Math.sin(d * Math.PI * 4);
      const hip = V(0, standY(B, 0.16, 0.95) + bounce);
      const sh = torsoAt(B, hip, 8);
      const r = reach(B) * 0.95;
      const guard = (sgn: number): Vec => V(sh[0] + 0.2, sh[1] + 0.12, sgn * 0.11);
      const punch = (sgn: number): Vec => V(sh[0] + r, sh[1] + 0.06, sgn * 0.04);
      const jab = Math.sin(Math.PI * clamp(d / 0.5, 0, 1));
      const cross = Math.sin(Math.PI * clamp((d - 0.5) / 0.5, 0, 1));
      return {
        hip,
        sh,
        ankle: per(V(0.18, ANKLE_H, -0.12), V(-0.16, ANKLE_H, 0.14)),
        foot: { L: 0, R: 15 },
        kneePole: V(1, 0, 0.4),
        hand: per(lerpV(guard(-1), punch(-1), jab), lerpV(guard(1), punch(1), cross)),
        elbowPole: V(-0.3, -1, 0.5),
        headBlend: 0.9,
      };
    },
  };
}

/** Knee tucks from a high plank, feet in ring straps or on sliders: both knees drive to the chest together. */
function plankKneeTuck(o: { rings?: boolean }): Motion {
  const base = pushUp({});
  return {
    phases: TEMPO.liftFirst("Tuck · 1s", "Extend · 1s", "Plank", "Knees in"),
    load: "none",
    stance: 0.1,
    grip: base.grip,
    pose(B, d) {
      const p = base.pose(B, 0);
      const back = p.ankle as Vec;
      const lift = o.rings ? 0.4 : 0;
      const e = ease(d);
      // the hips rise as the knees come in, turning about the shoulders
      const v = sub(p.hip, p.sh);
      const th = -rad(16 * e);
      const hip = add(p.sh, V(v[0] * Math.cos(th) - v[1] * Math.sin(th), v[0] * Math.sin(th) + v[1] * Math.cos(th), 0));
      const tuck = V(hip[0] - 0.06, 0.32 + lift * 0.6, 0);
      const at = (sgn: number): Vec => {
        const v = lerpV(V(back[0], back[1] + lift, 0), tuck, e);
        return V(v[0], v[1] + 0.06 * Math.sin(Math.PI * e), sgn * 0.1);
      };
      return { ...p, hip, sh: p.sh, ankle: per(at(-1), at(1)), kneePole: V(1, -0.3, 0.1), foot: 60 };
    },
    props: o.rings
      ? (B) => {
          const x = (base.pose(B, 0).ankle as Vec)[0];
          return [cable(V(x, 2.3, -0.1), "ankleL"), cable(V(x, 2.3, 0.1), "ankleR")];
        }
      : undefined,
  };
}

/** Medicine ball chest pass: athletic stance, the ball at the chest, punched out with both hands. */
function chestPass(): Motion {
  return {
    phases: [
      [0.5, 0, 0, "Ball at the chest", 0.4],
      [0.3, 0, 1, "Pass", 1],
      [0.6, 1, 0, "Catch", 0.5],
    ],
    load: "ball",
    hold: "centre",
    stance: 0.18,
    grip: 0.11,
    pose(B, d) {
      const hip = V(-0.02, standY(B, 0.08, 0.95));
      const sh = torsoAt(B, hip, lerp(10, 16, d));
      const near = V(sh[0] + 0.22, sh[1] - 0.14);
      const far = V(sh[0] + reach(B) * 0.95, sh[1] - 0.06);
      const h = lerpV(near, far, ease(d));
      return { hip, sh, hand: V(h[0], h[1], 0.11), elbowPole: V(-0.4, -1, 0.8), kneePole: V(1, 0, 0.4), headBlend: 0.9 };
    },
  };
}

/** Seated dip machine: sitting tall, handles beside the ribs pressed down until the arms are straight. */
function seatedDip(): Motion {
  return {
    phases: TEMPO.liftFirst("Press down · 1s", "Return · 2s", "Elbows bent", "Lockout"),
    load: "handle",
    grip: 0.3,
    pose(B, d) {
      const { hip, sh, ankle, kneePole } = seated(B, 0.45, -4);
      const top = V(sh[0] - 0.02, sh[1] - 0.12);
      const bottom = V(sh[0] + 0.02, sh[1] - reach(B) * 0.94);
      const h = lerpV(top, bottom, ease(d));
      return { hip, sh, ankle, kneePole, hand: V(h[0], h[1], B.shW + 0.1), elbowPole: V(-1, 0.2, 0.3), headBlend: 0.9 };
    },
    props: seatProps(-4),
  };
}

/** Heel slides: lying face up, knees bent, one heel sliding out until the leg is straight, then the other. */
function heelSlide(): Motion {
  return {
    phases: [
      [1.5, 0, 0.5, "Left heel out and back", 0.6],
      [1.5, 0.5, 1, "Right heel out and back", 0.6],
    ],
    load: "none",
    pose(B, d) {
      const hip = V(0.25, 0.13);
      const sh = torsoAt(B, hip, -90);
      const s = Math.sin(d * Math.PI * 2);
      const a = Math.max(0, s),
        b = Math.max(0, -s);
      const bent = (z: number): Vec => V(hip[0] + 0.55, ANKLE_H, z);
      const long = (z: number): Vec => V(hip[0] + legMax(B) * 0.97, ANKLE_H, z);
      return {
        hip,
        sh,
        ankle: per(lerpV(bent(-0.12), long(-0.12), a), lerpV(bent(0.12), long(0.12), b)),
        foot: -20,
        kneePole: V(0.2, 1, 0.1),
        hand: per(V(sh[0] + 0.45, 0.05, -0.3), V(sh[0] + 0.45, 0.05, 0.3)),
        elbowPole: V(0, 1, 0.4),
        headBlend: 0,
      };
    },
  };
}

/** Dumbbell devil press: down to a plank on the dumbbells, a push-up, feet in, and one swing from the floor to overhead. */
function devilPress(): Motion {
  return {
    phases: [
      [0.5, 0, 1 / 8, "Hands down", 0.6],
      [0.35, 1 / 8, 2 / 8, "Jump back", 0.9],
      [0.5, 2 / 8, 3 / 8, "Chest down", 0.8],
      [0.5, 3 / 8, 4 / 8, "Push up", 0.9],
      [0.35, 4 / 8, 5 / 8, "Jump in", 0.9],
      [0.3, 5 / 8, 6 / 8, "Swing back", 0.8],
      [0.55, 6 / 8, 7 / 8, "Snatch overhead", 1],
      [0.8, 7 / 8, 1, "Lower", 0.5],
    ],
    load: "dumbbell",
    hold: "each",
    stance: 0.16,
    pose(B, d) {
      const plank = keyOf(pushUp({}).pose(B, 0), B, 0.1, 0.22);
      const chest = keyOf(pushUp({}).pose(B, 1), B, 0.1, 0.22);
      const down: Key = {
        hip: V(-0.12, ANKLE_H + B.shin * 0.72),
        lean: 72,
        hand: both(V(0.47, 0.06, 0.22), V(0, 0, 0)),
        ankle: both(V(0.05, ANKLE_H, 0.16), V(0, 0, 0)),
        foot: 0,
        kneePole: both(V(1, 0.2, 0.4), V(0, 0, 0)),
        elbowPole: both(V(-0.7, 0.6, 0.7), V(0, 0, 0)),
        headBlend: 0.4,
      };
      const hinge: Key = {
        hip: V(-0.22, ANKLE_H + B.shin * 0.95 + 0.12),
        lean: 62,
        hand: both(V(-0.12, 0.42, 0.1), V(0, 0, 0)),
        ankle: both(V(0.03, ANKLE_H, 0.18), V(0, 0, 0)),
        foot: 0,
        kneePole: both(V(1, 0, 0.5), V(0, 0, 0)),
        elbowPole: both(V(-1, 0.2, 0.3), V(0, 0, 0)),
        headBlend: 0.3,
      };
      const stand = standKey(B);
      const top = standKey(B);
      const sh = torsoAt(B, top.hip, 0);
      const up = V(sh[0] + 0.02, sh[1] + reach(B) * 0.95, B.shW + 0.04);
      top.hand = both(up, up);
      top.elbowPole = both(V(0, -1, 1), V(0, 0, 0));
      return keyframes(B, [stand, down, plank, chest, plank, down, hinge, top, stand], d);
    },
  };
}

/** Kettlebell figure eight: in a half hinge, the bell passed from hand to hand around one leg and the other. */
function figureEight(): Motion {
  return {
    phases: [
      [1, 0, 0.5, "Around the right leg", 0.7],
      [1, 0.5, 1, "Around the left leg", 0.7],
    ],
    load: "kettlebell",
    hold: "R",
    stance: 0.24,
    pose(B, d) {
      const lean = 52;
      const hip = V(-0.18, standY(B, 0.2, 0.9));
      const sh = torsoAt(B, hip, lean);
      const t = 2 * Math.PI * d;
      // a figure eight at knee height around the two legs, crossing between them
      const path = V(0.02 + 0.2 * Math.sin(2 * t), 0.48, 0.3 * Math.sin(t));
      const shR = V(sh[0], sh[1], B.shW),
        shL = V(sh[0], sh[1], -B.shW);
      const hand = within(shR, path, reach(B) * 0.97);
      const other = within(shL, add(path, V(0.03, 0.02, -0.08)), reach(B) * 0.97);
      // the free hand meets the bell between the legs to take it, and rests by the left knee otherwise
      const meet = 1 - Math.min(1, Math.abs(Math.sin(t)) * 2.5);
      const rest = within(shL, V(0.05, 0.55, -0.3), reach(B) * 0.97);
      return {
        hip,
        sh,
        hand: per(lerpV(rest, other, meet), hand),
        ankle: per(V(0.02, ANKLE_H, -0.24), V(0.02, ANKLE_H, 0.24)),
        kneePole: per(V(1, 0, -0.5), V(1, 0, 0.5)),
        elbowPole: V(-0.3, -1, 0.3),
        headBlend: 0.4,
      };
    },
  };
}

/** Pallof press held out while squatting or stepping back into a lunge: the trunk resists the cable. */
function pallofHold(o: { lunge?: boolean }): Motion {
  const base = o.lunge ? lunge({ step: "back", hands: "hips" }) : squat({ hold: "arms", depth: 0.8 });
  return {
    phases: TEMPO.lowerFirst(o.lunge ? "Step back · 2s" : "Squat · 2s", "Up · 1s", "Arms long", "Bottom"),
    load: "handle",
    grip: 0.04,
    stance: o.lunge ? 0.14 : 0.19,
    pose(B, d) {
      const p = base.pose(B, d);
      const sh = p.sh;
      return { ...p, hand: V(sh[0] + reach(B) * 0.93, sh[1] - 0.16, 0.04), elbowPole: V(-0.3, -1, 0.6), headBlend: 1 };
    },
    props: () => [cable(V(0.4, 1.0, -1.2), "hands")],
  };
}

/** Cable squat to row: squat holding the handle out in front, stand, then row it to the ribs. The cable runs to a low-chest pulley ahead. */
function squatToRow(): Motion {
  const sq = squat({ hold: "arms", load: "handle" });
  return {
    ...sq,
    phases: [
      [0.4, 0, 0, "Arms long", 0.4],
      [1.3, 0, 1, "Squat · 2s", 0.6],
      [1, 1, 0, "Stand · 1s", 0.9],
      [0.8, 0, -1, "Row · 1s", 1],
      [1, -1, 0, "Arms long · 1s", 0.5],
    ],
    pose(B, d) {
      const p = sq.pose(B, Math.max(0, d));
      if (d >= 0) return p;
      const k = ease(-d);
      const out = p.hand as Vec;
      const reachOut = V(out[0], out[1], out[2]);
      const ribs = V(p.sh[0] + 0.12, p.sh[1] - 0.26, B.shW + 0.02);
      return { ...p, hand: lerpV(reachOut, ribs, k), elbowPole: lerpV(V(0, -1, 0.5), V(-1, -0.3, 0.3), k) };
    },
    props: () => [cable(V(1.6, 1.25, 0), "hands")],
  };
}

// ---------- incline and decline benches (audit batch 10) ----------
/** Turns `v` about `c` in the x-y plane by `deg` (positive turns +x towards +y). */
const turnXY = (v: Vec, c: Vec, deg: number): Vec => {
  const a = rad(deg),
    x = v[0] - c[0],
    y = v[1] - c[1];
  return V(c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a), v[2]);
};
const turnTwo = (t: PerSide<Vec> | undefined, c: Vec, deg: number): PerSide<Vec> | undefined =>
  t === undefined ? t : Array.isArray(t) ? turnXY(t, c, deg) : { L: turnXY(t.L, c, deg), R: turnXY(t.R, c, deg) };

/** Bench pads for an angled bench: the back pad along the torso, the seat (incline) or the frame and leg rollers (decline). */
function anglePads(B: Body, hip: Vec, deg: number): Prop[] {
  const lean = -90 + deg;
  if (deg > 0) return [bench(0.05, 0.45, 0.45, 0.32), torsoPad(B, hip, lean)];
  // decline: one long pad from under the hips down past the head, standing on a tall post at the
  // hips and a short one at the head, with a post up to the rollers the shins hook under
  const sh = torsoAt(B, hip, lean);
  const back = mul(frontOf(lean), -0.16);
  const hi = add(add(hip, mul(norm(sub(hip, sh)), 0.12)), back);
  const lo = add(add(sh, mul(norm(sub(sh, hip)), 0.3)), back);
  const mid = lerpV(hi, lo, 0.5);
  const len = Math.hypot(hi[0] - lo[0], hi[1] - lo[1]);
  const tilt = deg2(Math.atan2(hi[1] - lo[1], hi[0] - lo[0]));
  const post = (x: number, top: number, w = 0.2): Prop => ({ kind: "box", at: V(x, top / 2), size: V(0.06, top, w) });
  const roller = V(hip[0] + 0.5, hip[1] - 0.24);
  return [
    { kind: "box", at: mid, size: V(len, 0.07, 0.32), tilt },
    post(hi[0] - 0.08, hi[1] - 0.04),
    post(lo[0] + 0.08, lo[1] - 0.04),
    // the frame from the high end out to the rollers, and the rollers across in front of the shins
    {
      kind: "box",
      at: lerpV(V(hi[0], hi[1] - 0.06), roller, 0.5),
      size: V(Math.hypot(roller[0] - hi[0], roller[1] - hi[1] + 0.06), 0.04, 0.06),
      tilt: deg2(Math.atan2(roller[1] - hi[1] + 0.06, roller[0] - hi[0])),
    },
    { kind: "box", at: roller, size: V(0.1, 0.1, 0.42) },
  ];
}
const deg2 = (r: number) => (r * 180) / Math.PI;

/**
 * A move done lying on a flat bench, on an incline (`deg` > 0, shoulders up) or a decline (`deg` < 0,
 * head down, hips up and the knees hooked over a roller). The upper body, hands and bar turn with the
 * bench about the hips; on a decline the whole lifter rises so the head clears the floor.
 */
function onBench(m: Motion, deg: number, o: { press?: boolean } = {}): Motion {
  const lift = deg < 0 ? 0.2 : 0;
  return {
    ...m,
    pose(B, d) {
      const p = m.pose(B, d);
      const c = p.hip;
      const up = V(0, lift);
      const t = (v: Vec) => add(turnXY(v, c, -deg), up);
      // a press keeps the bar moving straight up over the shoulders at the top, touching the chest at the bottom
      const turned = turnTwo(p.hand, c, -deg)!;
      const shift = sub(turnXY(p.sh, c, -deg), p.sh);
      const moved = (v: Vec, w: Vec) => lerpV(add(v, shift), w, ease(d));
      const hand: PerSide<Vec> = !o.press
        ? turned
        : Array.isArray(p.hand)
          ? moved(p.hand, turned as Vec)
          : { L: moved(p.hand.L, (turned as { L: Vec }).L), R: moved(p.hand.R, (turned as { R: Vec }).R) };
      const out: Pose = {
        ...p,
        hip: add(p.hip, up),
        sh: t(p.sh),
        bar: p.bar && (o.press ? add(lerpV(add(p.bar, shift), turnXY(p.bar, c, -deg), ease(d)), up) : t(p.bar)),
        hand: Array.isArray(hand) ? add(hand, up) : { L: add(hand.L, up), R: add(hand.R, up) },
        elbowPole: turnTwo(p.elbowPole, V(0, 0), -deg),
      };
      if (deg < 0) {
        const hip = out.hip;
        return { ...out, ankle: V(hip[0] + 0.42, hip[1] - 0.3, 0.15), kneePole: V(0.4, 1, 0.3), foot: -30 };
      }
      return out;
    },
    props: (B) => {
      const hip = add(m.pose(B, 0).hip, V(0, lift));
      const rest = (m.props?.(B) ?? []).filter((p) => p.kind !== "box");
      return [...rest, ...anglePads(B, hip, deg)];
    },
  };
}

/**
 * Decline sit-ups and crunches: lying back on a decline bench, head down, knees hooked over the
 * rollers, curling up (the crunch lifts the shoulders, the sit-up comes all the way up) and lowering
 * back down slowly.
 */
function declineSitUp(o: { full: boolean }): Motion {
  const deg = -20;
  return {
    phases: TEMPO.liftFirst(o.full ? "Sit up · 1s" : "Crunch · 1s", "Lower · 2s", "Lying back", o.full ? "Sat up" : "Squeeze"),
    load: "none",
    stance: 0.15,
    pose(B, d) {
      const hip = V(0.28, 0.73);
      const lean = lerp(-90 + deg, o.full ? -15 : -55, ease(d));
      const sh = torsoAt(B, hip, lean);
      // hands crossed on the chest
      const chest = onTorso(hip, sh, lean, 0.8, 0.16);
      return {
        hip,
        sh,
        ankle: V(hip[0] + 0.42, hip[1] - 0.3, 0.15),
        foot: -30,
        kneePole: V(0.4, 1, 0.3),
        hand: V(chest[0], chest[1], 0.12),
        elbowPole: V(0.3, 0.2, 1),
        headBlend: lerp(0.1, 0.6, d),
      };
    },
    props: (B) => anglePads(B, V(0.28, 0.73), deg),
  };
}

/**
 * The treadmill on an incline: the belt tilts up ahead and the feet land on it; the body stays
 * upright, leaning a little into the hill.
 */
function uphill(m: Motion, deg = 8): Motion {
  const k = Math.tan(rad(deg));
  return {
    ...m,
    pose(B, d) {
      const p = m.pose(B, d);
      const lean = 4;
      const ankle = p.ankle;
      const foot = (v: Vec) => add(v, V(0, v[0] * k));
      const sh = add(torsoAt(B, p.hip, leanOf(p.hip, p.sh) + lean), V(0, 0, p.sh[2]));
      const dSh = sub(sh, p.sh);
      const hand = p.hand;
      return {
        ...p,
        sh,
        hand: Array.isArray(hand) ? add(hand, dSh) : { L: add(hand.L, dSh), R: add(hand.R, dSh) },
        ankle: ankle === undefined ? ankle : Array.isArray(ankle) ? foot(ankle) : { L: foot(ankle.L), R: foot(ankle.R) },
      };
    },
    props: () => [{ kind: "box", at: V(0.05, 0.03), size: V(1.4, 0.03, 0.6), tilt: deg }],
  };
}

/** Incline front raise: lying back on an incline bench, the arms hanging straight down, raised in front to point at the ceiling. */
function inclineFrontRaise(): Motion {
  return {
    phases: TEMPO.liftFirst("Raise · 1s", "Lower · 2s", "Arms down", "Top"),
    load: "dumbbell",
    stance: 0.25,
    pose(B, d) {
      const { hip, sh, ankle, kneePole } = seated(B, 0.45, -42);
      const a = rad(lerp(4, 132, d));
      const r = reach(B) * 0.95;
      const arm = (sgn: number) => add(side(B, sgn, sh), V(r * Math.sin(a), -r * Math.cos(a), 0));
      return { hip, sh, ankle, kneePole, hand: per(arm(-1), arm(1)), elbowPole: V(0, -1, 0.5), headBlend: 0.6 };
    },
    props: seatProps(-42),
  };
}

/** Incline shrug: chest on an incline bench, arms hanging, shrugging the dumbbells up towards the ears. */
function inclineShrug(): Motion {
  const row = chestSupportedRow();
  return {
    ...row,
    phases: TEMPO.liftFirst("Shrug · 1s", "Lower · 2s", "Hang", "Hold"),
    pose(B, d) {
      const p = row.pose(B, 0);
      const u = mul(norm(sub(p.sh, p.hip)), 0.065 * d);
      const hand = p.hand;
      return {
        ...p,
        shrug: 0.065 * d,
        hand: Array.isArray(hand) ? add(hand, u) : { L: add(hand.L, u), R: add(hand.R, u) },
      };
    },
  };
}

// ---------- moves that travel the way the name says (audit batch 8) ----------
/**
 * Moves every point of a pose by `by` (a sideways or forward shift of the whole figure). Mirrored hands
 * and feet are split into a left and a right first, so a sideways shift moves both the same way.
 */
function shiftPose(p: Pose, by: Vec, B: Body, o: { stance?: number; grip?: number } = {}): Pose {
  const m = (v: Vec) => add(v, by);
  const two = (t: PerSide<Vec> | undefined, defZ: number, fallback: Vec): PerSide<Vec> => {
    if (t === undefined) t = fallback;
    if (!Array.isArray(t)) return { L: m(t.L), R: m(t.R) };
    const z = t[2] === 0 ? defZ : Math.abs(t[2]);
    return { L: m(V(t[0], t[1], -z)), R: m(V(t[0], t[1], z)) };
  };
  const stance = (o.stance ?? 0.12) * B.s,
    grip = o.grip ?? 0.25;
  return {
    ...p,
    hip: m(p.hip),
    sh: m(p.sh),
    bar: p.bar && m(p.bar),
    hand: two(p.hand, grip, V(0, 0, grip)),
    ankle: two(p.ankle, stance, V(0, ANKLE_H, stance)),
  };
}

/**
 * A floor move done lying or kneeling on a flat bench: the whole pose rises by the bench's height and
 * the bench is drawn under the body, from the head end (or the hands) to the hips (or the knees).
 */
function onFlatBench(m: Motion, o: { top?: number; to?: "hips" | "knees" } = {}): Motion {
  const top = o.top ?? 0.45;
  const by = V(0, top - 0.05);
  const pose: Motion["pose"] = (B, d) => shiftPose(m.pose(B, d), by, B, { stance: m.stance, grip: m.grip });
  return {
    ...m,
    pose,
    props: (B) => {
      const p = pose(B, 0);
      const h = p.hand;
      const hx = Array.isArray(h) ? h[0] : h.L[0];
      const k = o.to === "knees" ? (p.hip[0] < p.sh[0] ? p.hip[0] - 0.25 : p.hip[0] + 0.25) : p.hip[0];
      const head = o.to === "knees" ? hx : p.sh[0] + (p.sh[0] < p.hip[0] ? -0.3 : 0.3);
      const x0 = Math.min(head, k) - 0.05,
        x1 = Math.max(head, k) + 0.08;
      return [...(m.props?.(B) ?? []), bench(x0, x1, top, 0.32)];
    },
  };
}

interface LungeLeg {
  /** The foot that stays down, its x, and its heel angle at the start and end. */
  plant: "L" | "R";
  plantX: number;
  plantFoot: [number, number];
  /** The other foot's x at the start and end, and its heel angle at the start. */
  swing: [number, number];
  swingFoot: number;
  hip: [number, number];
  /** Hip height at the start and end (0 standing, 1 at the bottom). */
  depth: [number, number];
}
/**
 * Walking lunges: step forward and lower, drive through and step the back foot past into the next
 * lunge, then bring the feet together, turn around and lunge back. Two lunges each way, d 0 to 1 the
 * whole loop. With `forward` only, one lunge forward and a push back to the start (the forward lunge).
 */
function walkingLunge(o: { hands: "dumbbells" | "hips" | "back"; forward?: boolean }): Motion {
  const S = 0.8;
  const segs: LungeLeg[] = o.forward
    ? [{ plant: "L", plantX: -0.4, plantFoot: [0, 55], swing: [-0.4, 0.4], swingFoot: 0, hip: [-0.37, 0], depth: [0, 1] }]
    : [
        { plant: "L", plantX: -S, plantFoot: [0, 55], swing: [-S, 0], swingFoot: 0, hip: [-S, -0.4], depth: [0, 1] },
        { plant: "R", plantX: 0, plantFoot: [0, 55], swing: [-S, S], swingFoot: 55, hip: [-0.4, 0.4], depth: [1, 1] },
        { plant: "L", plantX: S, plantFoot: [0, 0], swing: [0, S], swingFoot: 55, hip: [0.4, S], depth: [1, 0] },
      ];
  const n = segs.length;
  // forward pass, a turn, the pass back (facing the other way), a turn
  const PASS = o.forward ? 1 : 0.4;
  const turnC = S;
  const rows: PhaseRow[] = o.forward
    ? [
        [0.3, 0, 0, "Tall", 0.4],
        [1.2, 0, 1, "Step forward, lower", 0.8],
        [1, 1, 0, "Push back to the start", 1],
      ]
    : [0, 0.5].flatMap((at): PhaseRow[] => [
        [1.1, at, at + PASS / 3, "Step and lower", 0.8],
        [1.5, at + PASS / 3, at + (2 * PASS) / 3, "Drive through, lower", 1],
        [1, at + (2 * PASS) / 3, at + PASS, "Feet together", 0.6],
        [0.9, at + PASS, at + 0.5, "Turn around", 0.3],
      ]);
  const pass = (B: Body, u: number): Pose => {
    const k = Math.min(n - 1, Math.floor(clamp(u, 0, n - 1e-9)));
    const s = segs[k]!;
    const t = clamp(u - k, 0, 1);
    const e = ease(t);
    const top = standY(B, 0.03, 0.99);
    const bot = 0.07 + B.thigh * 0.96;
    const depth = (a: number) => lerp(top, bot, a);
    const y = s.depth[0] === 1 && s.depth[1] === 1 ? lerp(bot, top, Math.sin(Math.PI * t) * 0.85) : depth(lerp(s.depth[0], s.depth[1], e));
    const hip = V(lerp(s.hip[0], s.hip[1], e), y);
    const lean = 6;
    const sh = torsoAt(B, hip, lean);
    const zOf = (side: "L" | "R") => (side === "L" ? -0.11 : 0.11);
    const plantFoot = lerp(s.plantFoot[0], s.plantFoot[1], clamp((t - 0.4) / 0.6, 0, 1));
    const plant = V(s.plantX, ANKLE_H + 0.02 * (plantFoot / 55), zOf(s.plant));
    const swingFoot = lerp(s.swingFoot, 0, clamp(t / 0.5, 0, 1));
    const swing = V(
      lerp(s.swing[0], s.swing[1], e),
      ANKLE_H + 0.02 * (swingFoot / 55) + 0.1 * Math.sin(Math.PI * t),
      zOf(s.plant === "L" ? "R" : "L"),
    );
    const leg = legMax(B) * 0.99;
    const ankle = (p: Vec, side: "L" | "R") => within(V(hip[0], hip[1], zOf(side)), p, leg);
    const L = s.plant === "L" ? ankle(plant, "L") : ankle(swing, "L");
    const R = s.plant === "R" ? ankle(plant, "R") : ankle(swing, "R");
    const foot = s.plant === "L" ? { L: plantFoot, R: swingFoot } : { L: swingFoot, R: plantFoot };
    const base = { hip, sh, ankle: per(L, R), foot, kneePole: per(V(1, -0.2, -0.1), V(1, -0.2, 0.1)), headBlend: 0.8 };
    if (o.hands === "back") {
      const bar = V(sh[0] - 0.03, sh[1] - 0.03);
      return { ...base, bar, hand: bar, elbowPole: V(-1, -0.7, 0) };
    }
    if (o.hands === "dumbbells") return { ...base, hand: hangHands(B, sh), elbowPole: V(-1, 0, 0.3) };
    return { ...base, hand: V(hip[0] + 0.02, hip[1] + 0.06, B.hipW + 0.13), elbowPole: V(-0.4, 0, 1) };
  };
  // The turn pivots on the spot where the pass ended: the pose is shifted against the yaw so that spot stays put.
  const turnShift = (deg: number): Vec => V(turnC * Math.cos(rad(deg)) - turnC, 0, turnC * Math.sin(rad(deg)));
  const turnOf = (d: number) =>
    d < PASS ? 0 : d < 0.5 ? (d - PASS) / (0.5 - PASS) : d < 0.5 + PASS ? 1 : 1 + (d - 0.5 - PASS) / (0.5 - PASS);
  return {
    phases: rows,
    load: o.hands === "dumbbells" ? "dumbbell" : o.hands === "back" ? "barbell" : "none",
    hold: o.hands === "dumbbells" ? "each" : undefined,
    grip: o.hands === "back" ? 0.34 : undefined,
    stance: 0.11,
    pose(B, d) {
      if (o.forward) return pass(B, d);
      const half = d >= 0.5 ? 0.5 : 0;
      const u = (d - half) / PASS;
      if (u <= 1) return pass(B, u * n);
      const turned = ease(clamp(turnOf(d) - (half ? 1 : 0), 0, 1)) * 180;
      return shiftPose(pass(B, n), turnShift(turned), B, { stance: 0.11, grip: o.hands === "back" ? 0.34 : undefined });
    },
    yaw: o.forward ? undefined : (d) => ease(clamp(turnOf(d) - (d >= 0.5 ? 1 : 0), 0, 1)) * 180 + (d >= 0.5 ? 180 : 0),
  };
}

/**
 * Carioca: travelling sideways to the right, the left foot crossing in front of the right, the right
 * stepping out, the left crossing behind, the right stepping out; then the same steps back. The hips
 * stay facing forward and the arms swing out for balance.
 */
function carioca(): Motion {
  // feet (x, z) before each step, the moving foot lifted between them
  const L: Vec[] = [V(0, 0, -0.12), V(0.12, 0, 0.22), V(0.12, 0, 0.22), V(-0.12, 0, 0.62), V(-0.12, 0, 0.62)];
  const R: Vec[] = [V(0, 0, 0.12), V(0, 0, 0.12), V(0, 0, 0.52), V(0, 0, 0.52), V(0, 0, 0.92)];
  const n = L.length - 1;
  const mid = 0.4;
  return {
    phases: [
      ...Array.from({ length: n }, (_, i): PhaseRow => [
        0.32,
        i / n / 2,
        (i + 1) / n / 2,
        i % 2 ? "Step out" : i === 0 ? "Cross in front" : "Cross behind",
        0.8,
      ]),
      ...Array.from({ length: n }, (_, i): PhaseRow => [0.32, 0.5 + i / n / 2, 0.5 + (i + 1) / n / 2, "Back to the left", 0.8]),
    ],
    load: "none",
    stance: 0.12,
    pose(B, d) {
      const x = (d < 0.5 ? d * 2 : 2 - d * 2) * n;
      const i = Math.min(n - 1, Math.floor(x));
      const t = x - i;
      const at = (feet: Vec[]) => {
        const a = feet[i]!,
          b = feet[i + 1]!;
        const moving = a[2] !== b[2];
        return V(lerp(a[0], b[0], ease(t)), ANKLE_H + (moving ? 0.09 * Math.sin(Math.PI * t) : 0), lerp(a[2], b[2], ease(t)) - mid);
      };
      const l = at(L),
        r = at(R);
      const hip = V(0.03, standY(B, 0.03, 0.95) - 0.02 * Math.sin(Math.PI * t), (l[2] + r[2]) / 2);
      const sh = add(torsoAt(B, V(hip[0], hip[1]), 4), V(0, 0, hip[2]));
      const arm = (sgn: number) => V(sh[0] + 0.05, sh[1] - 0.35, hip[2] + sgn * (B.shW + 0.3));
      return {
        hip,
        sh,
        ankle: per(l, r),
        foot: 10,
        kneePole: per(V(1, 0, -0.3), V(1, 0, 0.3)),
        hand: per(arm(-1), arm(1)),
        elbowPole: per(V(0, -1, -1), V(0, -1, 1)),
        headBlend: 0.9,
      };
    },
  };
}

/** Lateral step-up: the box to the right, the right foot on it, stepping up sideways and lowering back down. */
function lateralStepUp(o: { load?: Load } = {}): Motion {
  const top = 0.4;
  const boxZ = 0.42;
  return {
    phases: TEMPO.liftFirst("Step up · 1s", "Lower · 2s", "Foot on the box", "Stand tall"),
    load: o.load ?? "none",
    hold: o.load ? "each" : undefined,
    stance: 0.12,
    pose(B, d) {
      const R = V(0.03, top + ANKLE_H, boxZ);
      const Lfloor = V(0.03, ANKLE_H, -0.12);
      const Lup = V(0.03, top + ANKLE_H + 0.12, boxZ - 0.24);
      const Lz = lerpV(Lfloor, Lup, ease(clamp((d - 0.45) / 0.55, 0, 1)));
      const hipZ = lerp(0.12, boxZ - 0.11, ease(clamp(d / 0.85, 0, 1)));
      const leg = legMax(B) * 0.99;
      // as high as the left leg allows while it is on the floor, standing tall over the box at the top
      const yR = R[1] + Math.sqrt(Math.max(0.01, leg ** 2 - (hipZ + B.hipW - R[2]) ** 2)) * 0.98;
      const yL = Lz[1] + Math.sqrt(Math.max(0.01, leg ** 2 - (hipZ - B.hipW - Lz[2]) ** 2));
      const hipY = Math.min(yR, yL, lerp(standY(B, 0.03, 0.9), top + standY(B, 0.03, 0.99), ease(d)));
      const hip = V(0.03, hipY, hipZ);
      const sh = add(torsoAt(B, V(hip[0], hip[1]), lerp(12, 4, d)), V(0, 0, hipZ));
      const hh = hangHands(B, sh);
      return {
        hip,
        sh,
        ankle: per(Lz, R),
        foot: { L: d < 0.45 ? lerp(0, 20, d / 0.45) : 10, R: 0 },
        kneePole: per(V(1, 0, -0.3), V(1, 0, 0.4)),
        hand: o.load
          ? per(V(hh[0], hh[1], sh[2] - B.shW - 0.05), V(hh[0], hh[1], sh[2] + B.shW + 0.05))
          : per(V(hip[0] + 0.02, hip[1] + 0.06, hipZ - B.hipW - 0.13), V(hip[0] + 0.02, hip[1] + 0.06, hipZ + B.hipW + 0.13)),
        elbowPole: o.load ? V(-1, 0, 0.3) : V(-0.4, 0, 1),
        headBlend: 0.8,
      };
    },
    props: () => [{ kind: "box", at: V(0.03, top / 2, boxZ + 0.04), size: V(0.5, top, 0.42) }],
  };
}

/** Lateral box jump: the box jump turned to the side, jumping up onto a box to the right and stepping back down. */
function lateralBoxJump(): Motion {
  const bj = boxJump();
  return {
    ...bj,
    pose(B, d) {
      const p = bj.pose(B, d);
      const hip0 = bj.pose(B, 0).hip;
      // the forward travel becomes sideways travel, the body still facing forward
      const t = p.hip[0] - hip0[0];
      return shiftPose(p, V(-t, 0, t), B, { stance: 0.15 });
    },
    props: () => [{ kind: "box", at: V(0.05, 0.225, 0.63), size: V(0.5, 0.45, 0.6) }],
  };
}

/** Lateral burpee: a burpee, then a jump sideways to the right; the next one jumps back to the left. */
function lateralBurpee(): Motion {
  const b = burpee({ top: "none" });
  return {
    phases: [0, 1].flatMap((h): PhaseRow[] => {
      const a = h * 0.5;
      return [
        [0.5, a, a + 0.12, "Hands down", 0.6],
        [0.35, a + 0.12, a + 0.2, "Jump back", 0.9],
        [0.3, a + 0.2, a + 0.2, "Plank", 0.6],
        [0.35, a + 0.2, a + 0.28, "Jump in", 0.9],
        [0.55, a + 0.28, a + 0.36, "Stand up", 1],
        [0.6, a + 0.36, a + 0.5, h ? "Jump to the left" : "Jump to the right", 1],
      ];
    }),
    load: "none",
    stance: 0.12,
    pose(B, d) {
      const h = d >= 0.5 ? 1 : 0;
      const u = d - h * 0.5;
      const side = h ? 0.3 : -0.3;
      if (u < 0.36) {
        // burpee d: stand (1) → hands down (0.5) → plank (0) → back up
        const bd = u < 0.12 ? 1 - u / 0.24 : u < 0.2 ? 0.5 - (u - 0.12) / 0.16 : u < 0.28 ? (u - 0.2) / 0.16 : 0.5 + (u - 0.28) / 0.16;
        return shiftPose(b.pose(B, bd), V(0, 0, side), B);
      }
      // the jump: dip, fly sideways with the arms up, land soft
      const t = (u - 0.36) / 0.14;
      const stand = b.pose(B, 1);
      const air = Math.sin(Math.PI * t);
      const p = shiftPose(stand, V(0, 0.18 * air, lerp(side, -side, ease(t))), B);
      const sh = p.sh;
      const up = V(sh[0] + 0.02, sh[1] + reach(B) * 0.95 * air - 0.45 * (1 - air), sh[2] + B.shW);
      return { ...p, hand: per(V(up[0], up[1], up[2] - 2 * B.shW), up), elbowPole: V(0, -1, 1), foot: 25 * air };
    },
  };
}

// ---------- Olympic lifts and combos (audit batch 7) ----------
/**
 * The jerk from the rack: dip, drive, then drop under the bar, either into a split (front foot
 * forward, back heel up) or a quarter squat (push jerk), recover with the feet together and lower to
 * the rack. d 0 and 1 are the rack; below 0 the lifter is still in the clean's catch dip.
 */
function jerk(o: { split: boolean }): Motion {
  return {
    phases: [
      [0.5, 0, 0, "Rack", 0.35],
      [0.35, 0, 0.15, "Dip", 0.6],
      [0.3, 0.15, 0.3, "Drive", 1],
      [0.3, 0.3, 0.5, o.split ? "Split under" : "Push under", 0.9],
      [0.5, 0.5, 0.5, "Catch", 0.7],
      [0.8, 0.5, 0.7, o.split ? "Front foot back, then back foot in" : "Stand", 0.6],
      [0.4, 0.7, 0.7, "Lockout", 0.5],
      [1, 0.7, 1, "Lower to the rack", 0.5],
    ],
    load: "barbell",
    stance: 0.15,
    grip: 0.24,
    pose(B, d) {
      const seg = (a: number, b: number) => clamp((d - a) / (b - a), 0, 1);
      // how far the bar is from the rack (0) to locked out overhead (1)
      const s =
        d < 0.15 ? 0 : d < 0.3 ? 0.55 * seg(0.15, 0.3) : d < 0.5 ? 0.55 + 0.45 * seg(0.3, 0.5) : d < 0.7 ? 1 : 1 - ease(seg(0.7, 1));
      const catchDrop = o.split ? 0.2 : 0.11;
      const drop =
        d < 0
          ? 0.07 * Math.min(1, -d / 0.1)
          : d < 0.15
            ? 0.08 * ease(seg(0, 0.15))
            : d < 0.3
              ? lerp(0.08, -0.03, seg(0.15, 0.3))
              : d < 0.5
                ? lerp(-0.03, catchDrop, ease(seg(0.3, 0.5)))
                : d < 0.7
                  ? catchDrop * (1 - ease(seg(0.5, 0.7)))
                  : 0;
      const sp = o.split ? (d < 0.3 ? 0 : d < 0.5 ? ease(seg(0.3, 0.5)) : d < 0.55 ? 1 : 1 - ease(seg(0.55, 0.7))) : 0;
      const wide = o.split ? 0 : d < 0.3 ? 0 : d < 0.5 ? seg(0.3, 0.5) : 1 - seg(0.5, 0.7);
      const toes = d > 0.15 && d < 0.3 ? Math.sin(Math.PI * seg(0.15, 0.3)) : 0;
      const hip = V(0.03 - 0.04 * sp, standY(B) - drop);
      const sh = torsoAt(B, hip, -3 + 2 * sp);
      const r = reach(B) * 0.985;
      const bar = V(sh[0] + 0.035 + 0.12 * (1 - Math.pow(s, 4)), sh[1] - 0.01 + r * s, 0);
      const ankleL = V(0.03 - 0.45 * sp, ANKLE_H + 0.02 * toes + 0.05 * sp, -0.12 - 0.06 * wide);
      const ankleR = V(0.03 + 0.36 * sp, ANKLE_H + 0.02 * toes, 0.12 + 0.06 * wide);
      return {
        hip,
        sh,
        bar,
        hand: V(bar[0], bar[1], 0.24),
        ankle: per(
          within(V(hip[0], hip[1], -B.hipW), ankleL, legMax(B) * 0.99),
          within(V(hip[0], hip[1], B.hipW), ankleR, legMax(B) * 0.99),
        ),
        foot: { L: lerp(30 * toes, 55, sp), R: 30 * toes },
        kneePole: per(lerpV(V(1, 0, 0.45), V(0.6, -1, 0.1), sp), V(1, 0, 0.45)),
        elbowPole: V(0.6, -1, 0),
        headBlend: 1,
        headBack: -0.045 * Math.sin(Math.PI * clamp(s * 1.3, 0, 1)),
      };
    },
  };
}

/** Clean and jerk: the power clean from the floor to the rack, stand, then the split jerk, back to the rack and down. */
function cleanAndJerk(): Motion {
  const pc = powerClean();
  const j = jerk({ split: true });
  return {
    phases: [
      [0.6, 3, 3, "Set", 0.35],
      [0.6, 3, 2, "First pull", 0.9],
      [0.4, 2, 1.5, "Jump", 1],
      [0.4, 1.5, 1, "Pull under, rack", 0.9],
      [0.4, 1, 1, "Catch", 0.6],
      [0.4, -0.1, 0, "Stand", 0.5],
      ...j.phases.slice(1),
      [1, 1, 2, "Down to the hips", 0.5],
      [1, 2, 3, "Lower to the floor", 0.5],
    ],
    load: "barbell",
    stance: 0.15,
    grip: 0.23,
    pose(B, d) {
      if (d <= 1) return j.pose(B, d);
      return pc.pose(B, d - 1);
    },
  };
}

/**
 * The snatch: a wide grip, the bar pulled from the hips (or the floor) straight up past the face and
 * caught locked out overhead in a quarter squat (power snatch) or the hang snatch's deeper catch.
 * d 0 is caught overhead standing, 0.5 the catch, 1 the hang, 2 the floor.
 */
function snatch(o: { floor: boolean }): Motion {
  const dl = deadlift();
  const grip = 0.42;
  return {
    phases: [
      ...((o.floor
        ? [
            [0.6, 2, 2, "Set", 0.35],
            [0.6, 2, 1, "First pull", 0.9],
          ]
        : [[0.5, 1, 1, "Hang", 0.4]]) as PhaseRow[]),
      [0.35, 1, 0.75, "Jump", 1],
      [0.35, 0.75, 0.5, "Pull under", 0.9],
      [0.5, 0.5, 0.5, "Catch overhead", 0.7],
      [0.6, 0.5, 0, "Stand", 0.6],
      [0.4, 0, 0, "Lockout", 0.5],
      [1.3, 0, 1, "Lower to the hips", 0.5],
      ...((o.floor ? [[1.2, 1, 2, "Lower to the floor", 0.5]] : []) as PhaseRow[]),
    ],
    load: "barbell",
    stance: 0.17,
    grip,
    pose(B, d) {
      if (d > 1) {
        const p = dl.pose(B, d - 1);
        // the wide grip, kept within reach of the shoulder
        const hand = within(V(p.sh[0], p.sh[1], B.shW), V(p.bar![0], p.bar![1], grip), reach(B) * 0.98);
        return { ...p, bar: V(hand[0], hand[1], 0), hand: V(hand[0], hand[1], grip) };
      }
      const seg = (a: number, b: number) => clamp((d - a) / (b - a), 0, 1);
      // the hang (d 1): hinged a little, bar at the hips
      const h = seg(0.75, 1);
      const catchDrop = o.floor ? 0.14 : 0.2;
      const drop = d < 0.5 ? catchDrop * ease(d / 0.5) : d < 0.75 ? lerp(catchDrop, -0.03, seg(0.5, 0.75)) : lerp(-0.03, 0.07, h);
      const lean = d < 0.75 ? 0 : 28 * h;
      const shX = 0.04 + 0.05 * h;
      const hipX = shX - Math.sin(rad(lean)) * B.torso;
      const hip = V(hipX, standY(B, hipX, 1) - drop);
      const sh = torsoAt(B, hip, lean);
      const r = reach(B) * 0.97;
      const up = Math.sqrt(Math.max(0.01, r * r - (grip - B.shW) ** 2)) * 0.98;
      const over = V(sh[0] - 0.02, sh[1] + up);
      const hang = V(sh[0] + 0.03, sh[1] - up);
      // the bar rises close to the body: hips, chest, past the face, overhead
      const k = d <= 0.5 ? 0 : 1 - seg(0.5, 1);
      const bar = d <= 0.5 ? over : add(lerpV(hang, over, ease(k)), V(0.12 * Math.sin(Math.PI * k), 0, 0));
      return {
        hip,
        sh,
        bar,
        hand: V(bar[0], bar[1], grip),
        ankle: V(0.02, ANKLE_H, (0.15 + 0.05 * clamp(1 - d / 0.75, 0, 1)) * B.s),
        shrug: 0.05 * Math.sin(Math.PI * seg(0.6, 1)),
        elbowPole: k > 0.5 ? V(-1, -0.3, 0.5) : V(-0.3, 1, 0.8),
        kneePole: V(1, 0, 0.45),
        headBlend: 0.8,
      };
    },
  };
}

/** One-arm clean and press: the swing clean to the rack, a press overhead, back to the rack, then hike back. */
function cleanAndPress(o: { load?: Load }): Motion {
  const c = kbFlow({ to: "rack", load: o.load });
  return {
    ...c,
    phases: [
      [0.8, 1, 0, "Clean to the rack", 1],
      [0.4, 0, 0, "Rack", 0.5],
      [0.9, 0, -1, "Press · 1s", 1],
      [0.4, -1, -1, "Lockout", 0.6],
      [1.1, -1, 0, "Lower to the rack", 0.5],
      [0.9, 0, 1, "Hike back", 0.55],
    ],
    pose(B, d) {
      const p = c.pose(B, Math.max(0, d));
      if (d >= 0) return p;
      const k = ease(-d);
      const rack = V(p.sh[0] + 0.1, p.sh[1] - 0.1, 0.08);
      const mid = V(p.sh[0] + 0.07, p.sh[1] + 0.08, B.shW + 0.06);
      const over = V(p.sh[0] + 0.03, p.sh[1] + reach(B) * 0.95, B.shW - 0.02);
      const hand = k < 0.35 ? lerpV(rack, mid, k / 0.35) : lerpV(mid, over, (k - 0.35) / 0.65);
      return { ...p, hand: per((p.hand as { L: Vec }).L, hand), elbowPole: per(V(-1, 0, 0.3), V(0, -1, 1)) };
    },
  };
}

/** One and a half squat: all the way down, halfway up, back down, then stand. */
function oneAndAHalf(m: Motion): Motion {
  return {
    ...m,
    phases: [
      [0.4, 0, 0, "Top", 0.4],
      [1.4, 0, 1, "Lower · 2s", 0.6],
      [0.6, 1, 0.5, "Halfway up", 0.8],
      [0.6, 0.5, 1, "Back down", 0.7],
      [1.1, 1, 0, "Stand · 1s", 1],
    ],
  };
}

/** Hammer curl to press: curl the dumbbells up, press them overhead, and lower both ways back down. */
function curlToPress(): Motion {
  const c = curl({ load: "dumbbell", grip: 0.23 });
  return {
    plates: 0.55,
    phases: [
      [1, 0, 0.5, "Curl · 1s", 0.8],
      [1, 0.5, 1, "Press · 1s", 1],
      [1.5, 1, 0.5, "Lower · 1s", 0.5],
      [1.5, 0.5, 0, "Lower · 1s", 0.5],
    ],
    load: "dumbbell",
    stance: 0.13,
    grip: 0.23,
    pose(B, d) {
      if (d <= 0.5) return c.pose(B, Math.min(1, d * 2));
      const p = c.pose(B, 1);
      const top = p.hand as Vec;
      const shoulder = V(p.sh[0] + 0.06, p.sh[1] + 0.04, B.shW + 0.03);
      const over = V(p.sh[0] + 0.02, p.sh[1] + reach(B) * 0.95, B.shW + 0.05);
      const k = (d - 0.5) * 2;
      const h = k < 0.3 ? lerpV(top, shoulder, k / 0.3) : lerpV(shoulder, over, (k - 0.3) / 0.7);
      return { ...p, hand: h, elbowPole: V(0.1, -1, 0.6) };
    },
  };
}

/**
 * Ring moves leaning back from the straps (feet forward, body straight), like the ring row but with
 * the arms doing something else: a curl to the forehead, a face pull, a Y overhead, or a reverse fly.
 */
function ringLean(o: { move: "curl" | "face" | "y" | "fly" }): Motion {
  const angle = 52;
  return {
    phases: TEMPO.liftFirst(
      o.move === "curl" ? "Curl · 1s" : o.move === "face" ? "Pull · 1s" : o.move === "y" ? "Raise · 1s" : "Open · 1s",
      "Lower · 2s",
      "Arms long",
      "Squeeze",
    ),
    load: "none",
    grip: 0.2,
    stance: 0.12,
    pose(B, d) {
      const ankle = V(0.55, ANKLE_H);
      const body = (th: number) => {
        const dir = V(-Math.cos(rad(th)), Math.sin(rad(th)));
        const hip = add(ankle, mul(dir, legMax(B) * 0.99));
        return { hip, sh: add(hip, mul(dir, B.torso)) };
      };
      const anchorX = body(angle).sh[0] + 0.3;
      const anchor = V(anchorX, 2.3);
      const th = lerp(angle - 18, angle, ease(d));
      const { hip, sh } = body(th);
      const r = reach(B) * 0.96;
      // arms long: straight from the shoulders towards the strap anchor
      const toward = norm(sub(anchor, sh));
      const long = (sgn: number): Vec => add(V(sh[0], sh[1], sgn * B.shW), V(toward[0] * r, toward[1] * r, -sgn * 0.08));
      const end = (sgn: number): Vec => {
        const s = V(sh[0], sh[1], sgn * B.shW);
        if (o.move === "curl") return add(s, V(0.12, 0.3, -sgn * 0.08));
        if (o.move === "face") return add(s, V(0.14, 0.22, sgn * 0.1));
        if (o.move === "y") return add(s, add(mul(toward, r * 0.8), V(0, 0.15, sgn * r * 0.55)));
        return add(s, V(toward[0] * r * 0.35, toward[1] * r * 0.35, sgn * r * 0.9));
      };
      const e = ease(d);
      const hand = (sgn: number) => within(V(sh[0], sh[1], sgn * B.shW), lerpV(long(sgn), end(sgn), e), r * 1.01);
      return {
        hip,
        sh,
        ankle: V(ankle[0], ankle[1], 0.12),
        foot: -(90 - th) * 0.8,
        kneePole: V(0, 1, 0.1),
        hand: per(hand(-1), hand(1)),
        elbowPole: o.move === "curl" ? V(1, 0.4, 0.2) : o.move === "face" ? V(0, 0.2, 1) : V(0, -1, 0.6),
        headBlend: 0,
      };
    },
    props: (B) => {
      const dir = V(-Math.cos(rad(angle)), Math.sin(rad(angle)));
      const x = 0.55 + dir[0] * (legMax(B) * 0.99 + B.torso) + 0.3;
      return [cable(V(x, 2.3, -0.12), "handL"), cable(V(x, 2.3, 0.12), "handR")];
    },
  };
}

/** Band external rotation: elbows pinned at the sides, forearms swinging out against the band. */
function externalRotation(): Motion {
  return {
    phases: TEMPO.liftFirst("Rotate out · 1s", "Return · 2s", "Set", "Squeeze"),
    load: "none",
    stance: 0.13,
    pose(B, d) {
      const hip = V(0.02, standY(B));
      const sh = torsoAt(B, hip, 0);
      const psi = rad(lerp(5, 60, d));
      const elbowY = sh[1] - B.upper * 0.97;
      const at = (sgn: number): Vec =>
        V(sh[0] + 0.02 + Math.cos(psi) * B.fore * 0.97, elbowY + 0.02, sgn * (B.shW + Math.sin(psi) * B.fore * 0.97));
      return { hip, sh, hand: per(at(-1), at(1)), elbowPole: V(-0.2, -1, 0), headBlend: 1 };
    },
    props: () => [cable("handL", "handR")],
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
  "band-pull-apart": () => ({
    ...fly({ posture: "standing", from: 10, to: 86, load: "none", first: "lift" }),
    pose: bandApart,
    props: () => [cable("handL", "handR")],
  }),
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
  "walking-lunge": () => walkingLunge({ hands: "hips" }),
  "reverse-lunge": () => lunge({ step: "back", hands: "hips" }),
  // Program ladder steps and lifts (programs.ts). Close cousins of existing motions until each gets its own.
  "split-squat": () => lunge({ rear: "floor", hands: "hips" }),
  "shrimp-squat": () => skaterSquat({ shrimp: true }),
  "pistol-squat": () => pistol({}),
  "wall-push-up": wallPushUp,
  "pseudo-planche-push-up": () => pushUp({ width: 0.14, planche: true }),
  "negative-dip": () => dip({}),
  "scapular-pull": () => hanging({ grip: 0.34 }),
  "negative-pull-up": () => hanging({ grip: 0.34 }),
  "power-clean": powerClean,
  "barbell-shrug": () => shrug({ load: "barbell" }),
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
  // the bigger library (2026-11-11)
  "kb-deadlift": () => rdl({ load: "kettlebell", hold: "centre" }),
  "kb-sumo-deadlift": () => rdl({ load: "kettlebell", hold: "centre" }),
  "kb-single-swing": kbSwing,
  "kb-clean": () => kbFlow({ to: "rack" }),
  "kb-snatch": () => kbFlow({ to: "overhead" }),
  "kb-press": () => overhead({ load: "kettlebell" }),
  "kb-push-press": () => overhead({ load: "kettlebell" }),
  "kb-front-squat": () => squat({ hold: "goblet", load: "kettlebell", holdKind: "each" }),
  "kb-lunge": () => lunge({ step: "back", hands: "dumbbells" }),
  "kb-turkish-get-up": turkishGetUp,
  "kb-windmill": windmill,
  "kb-halo": halo,
  "kb-floor-press": () => benchPress({ load: "kettlebell" }),
  "kb-gorilla-row": () => bentRow({ load: "kettlebell", lean: 62, oneArm: true, grip: 0.18 }),
  "kb-high-pull": () => kbFlow({ to: "chin" }),
  "kb-rack-carry": () => carry({ hold: "each", load: "kettlebell", at: "rack" }),
  "kb-overhead-carry": () => carry({ hold: "R", load: "kettlebell", at: "overhead" }),
  "kb-goblet-reverse-lunge": () => lunge({ step: "back", hands: "hips" }),
  "kb-thruster": () => thruster({ load: "kettlebell" }),
  "kb-around-the-world": aroundWorld,
  "kb-bottoms-up-press": () => overhead({ load: "kettlebell" }),
  "band-face-pull": facePull,
  "band-row": seatedRow,
  "band-chest-press": machinePress,
  "band-overhead-press": () => overhead({ load: "none" }),
  "band-squat": () => squat({ hold: "arms" }),
  "band-deadlift": () => rdl({ load: "none" }),
  "band-good-morning": () => rdl({ load: "none" }),
  "band-glute-kickback": () => kickback({ band: true }),
  "band-lateral-walk": bandLateralWalk,
  "band-hip-abduction": () => seatedHip({ out: true, band: true }),
  "band-triceps-extension": () => overheadExtension({}),
  "band-hammer-curl": () => curl({ load: "none", grip: 0.2, cable: "band" }),
  "band-lat-pulldown": () => pulldown(),
  "band-straight-arm-pulldown": () => pulldown({ straightArm: true }),
  "band-woodchop": () => woodchop({ load: "handle", anchor: true }),
  "band-external-rotation": externalRotation,
  "band-pallof-press": pallof,
  "band-assisted-dip": () => dip({}),
  "band-pull-through": pullThrough,
  "wide-push-up": () => pushUp({ width: 0.34 }),
  "archer-push-up": () => archerPushUp({}),
  "clap-push-up": clapPushUp,
  "knee-push-up": () => pushUp({ knees: true }),
  "hindu-push-up": hinduPushUp,
  "handstand-push-up": handstandPushUp,
  "pike-push-up-elevated": () => pikePushUp({ feet: 0.45 }),
  "wide-pull-up": () => hanging({ grip: 0.42 }),
  "neutral-grip-pull-up": () => hanging({ grip: 0.22 }),
  "muscle-up": () => muscleUp(),
  "dead-hang": () => hanging({ grip: 0.34 }),
  "hanging-leg-raise": hangingRaise,
  "toes-to-bar": hangingRaise,
  "l-sit": lSit,
  "hollow-hold": () => floorCore({ kind: "hollow" }),
  "v-up": () => floorCore({ kind: "vUp" }),
  crunch: () => floorCore({ kind: "crunch" }),
  "bicycle-crunch": () => floorCore({ kind: "bicycle" }),
  "lying-leg-raise": () => floorCore({ kind: "legRaise" }),
  "mountain-climber": mountainClimber,
  burpee: () => burpee(),
  "jumping-jacks": jumpingJack,
  "high-knees": () => run({ lift: 0.8, lean: 0 }),
  "jump-squat": jumpSquat,
  "box-jump": boxJump,
  "jumping-lunge": jumpingLunge,
  "wall-sit": () => wallSit({}),
  "lateral-lunge": cossack,
  "curtsy-lunge": () => lunge({ step: "back", hands: "hips", curtsy: true }),
  "single-leg-glute-bridge": () => bridge({ single: true }),
  "donkey-kick": () => allFours({ kind: "donkey" }),
  "bird-dog": () => allFours({ kind: "birdDog" }),
  "bear-crawl": bearCrawl,
  "tricep-dip-floor": () => dip({ bench: true }),
  "sissy-squat": sissySquat,
  "reverse-nordic": nordic,
  "cable-row-wide": seatedRow,
  "single-arm-cable-row": seatedRow,
  "close-grip-pulldown": () => pulldown(),
  "reverse-grip-pulldown": () => pulldown(),
  "machine-row": () => chestSupportedRow({ load: "handle" }),
  "cable-face-pull-rope": facePull,
  "cable-rear-delt-fly": () => fly({ posture: "standing", from: 10, to: 86, load: "handle", first: "lift", cable: "side" }),
  "cable-front-raise": () => fly({ posture: "standing", from: 8, to: 84, load: "handle", first: "lift", cable: "low" }),
  "cable-upright-row": () => uprightRow({ load: "handle", cable: true }),
  "cable-overhead-extension": () => overheadExtension({ hold: "cable" }),
  "rope-pushdown": () => pushdown({}),
  "cable-hammer-curl": () => curl({ load: "handle", grip: 0.14, cable: "low" }),
  "preacher-curl": () => curl({ load: "barbell", grip: 0.17, posture: "seatedThighs" }),
  "machine-preacher-curl": () => curl({ load: "handle", grip: 0.17, posture: "seatedThighs" }),
  "hip-abduction": () => seatedHip({ out: true }),
  "hip-adduction": () => seatedHip({ out: false }),
  "seated-leg-curl": () => kneeMachine({ extend: false }),
  "single-leg-press": legPress,
  "calf-press": () => calfRaise({ machine: true, load: "none" }),
  "seated-calf-raise": () => calfRaise({ machine: true, load: "none" }),
  "smith-bench-press": () => benchPress({ load: "barbell" }),
  "smith-incline-press": () => benchPress({ load: "barbell", incline: 30 }),
  "smith-split-squat": () => lunge({ rear: "floor", hands: "hips" }),
  "smith-hip-thrust": () => bridge({ bench: true, bar: true }),
  "smith-calf-raise": () => calfRaise({ machine: true, step: true, load: "none" }),
  "smith-shoulder-press": () => overhead({ load: "barbell", seated: true }),
  "incline-machine-press": () => machinePress({ incline: 30 }),
  "low-cable-fly": () => fly({ posture: "standing", from: 70, to: 10, load: "handle", first: "lift", cable: "low" }),
  "cable-crossover-high": () => fly({ posture: "standing", from: 78, to: 8, load: "handle", first: "lift", cable: "high" }),
  "assisted-pull-up": () => hanging({ grip: 0.34, band: true }),
  "machine-lateral-raise": () => fly({ posture: "seated", from: 8, to: 84, load: "handle", first: "lift" }),
  "cable-woodchop": () => woodchop({ load: "handle", anchor: true }),
  "cable-kickback": () => kickback({}),
  "pendulum-squat": hackSquat,
  "reverse-hack-squat": hackSquat,
  "machine-dip": () => dip({}),
  "sumo-deadlift": () => deadlift(),
  "deficit-deadlift": () => deadlift({ deficit: 0.08 }),
  "rack-pull": () => deadlift(),
  "good-morning": () => rdl({ load: "barbell" }),
  "pendlay-row": () => bentRow({ load: "barbell", lean: 80 }),
  "t-bar-row": () => bentRow({ load: "barbell", lean: 55, grip: 0.08 }),
  "seal-row": () => chestSupportedRow({ load: "seal" }),
  "push-press": () => overhead({ load: "barbell" }),
  "seated-barbell-press": () => overhead({ load: "barbell", seated: true }),
  "landmine-press": () => overhead({ load: "barbell" }),
  "landmine-squat": () => squat({ hold: "goblet", load: "barbell", holdKind: "centre" }),
  "landmine-row": () => bentRow({ load: "barbell", lean: 55, grip: 0.08 }),
  "zercher-squat": () => squat({ hold: "front" }),
  "pause-squat": () => squat({ hold: "back" }),
  "barbell-lunge": () => lunge({ step: "back", hands: "hips" }),
  "barbell-hip-thrust-pause": () => bridge({ bench: true, bar: true }),
  "hang-clean": hangClean,
  "barbell-floor-press": () => benchPress({ load: "barbell" }),
  "decline-bench-press": () => onBench(benchPress({ load: "barbell" }), -18, { press: true }),
  "spoto-press": () => benchPress({ load: "barbell" }),
  "barbell-upright-row": () => uprightRow({ load: "barbell" }),
  "drag-curl": () => curl({ load: "barbell", grip: 0.21 }),
  "reverse-curl": () => curl({ load: "barbell", grip: 0.21 }),
  "jm-press": () => benchPress({ load: "barbell", grip: 0.16, close: true }),
  "barbell-glute-bridge": () => bridge({ bar: true }),
  "barbell-calf-raise": () => calfRaise({ step: true, load: "none" }),
  "snatch-grip-deadlift": () => deadlift(),
  "overhead-squat": overheadSquat,
  "ez-skull-crusher": () => overheadExtension({ lying: true }),
  "db-decline-press": () => onBench(benchPress({ load: "dumbbell" }), -18, { press: true }),
  "db-squeeze-press": () => benchPress({ load: "dumbbell" }),
  "db-pullover": () => pullover({ load: "dumbbell" }),
  "db-arnold-press": () => overhead({ load: "dumbbell", seated: true }),
  "db-front-raise": () => fly({ posture: "standing", from: 8, to: 84, load: "dumbbell", first: "lift" }),
  "db-upright-row": () => uprightRow({ load: "dumbbell" }),
  "db-shrug": shrug,
  "db-y-raise": () => fly({ posture: "facePad", from: 12, to: 88, load: "dumbbell", first: "lift" }),
  "db-chest-supported-row": chestSupportedRow,
  "db-renegade-row": renegadeRow,
  "db-concentration-curl": () => curl({ load: "dumbbell", posture: "seatedThighs" }),
  "db-preacher-curl": () => curl({ load: "dumbbell", posture: "seatedThighs" }),
  "zottman-curl": () => curl({ load: "dumbbell", grip: 0.22 }),
  "db-skull-crusher": () => overheadExtension({ lying: true }),
  "db-kickback": () => tricepsKickback({ load: "dumbbell" }),
  "db-close-press": () => benchPress({ load: "dumbbell" }),
  "db-goblet-squat-heels": () => squat({ hold: "goblet", load: "dumbbell", holdKind: "centre" }),
  "db-front-squat": () => squat({ hold: "goblet", load: "dumbbell", holdKind: "each" }),
  "db-sumo-squat": () => squat({ hold: "goblet", load: "dumbbell", holdKind: "centre" }),
  "db-step-up": stepUp,
  "db-lateral-lunge": cossack,
  "db-hip-thrust": () => bridge({ bench: true, onHips: true }),
  "db-single-leg-rdl": () => rdl({ load: "dumbbell", single: true }),
  "db-suitcase-deadlift": () => rdl({ load: "dumbbell", hold: "R" }),
  "db-snatch": () => kbFlow({ to: "overhead", load: "dumbbell" }),
  "db-thruster": () => thruster({ load: "dumbbell" }),
  "db-farmers-walk-heavy": () => carry({ hold: "each", load: "dumbbell" }),
  "db-reverse-fly-incline": () => fly({ posture: "facePad", from: 12, to: 88, load: "dumbbell", first: "lift" }),
  "db-tate-press": () => overheadExtension({ lying: true }),
  "db-woodchop": () => woodchop({ load: "dumbbell" }),
  "db-overhead-squat-single": () => squat({ hold: "arms" }),
  "treadmill-run": () => run({}),
  "outdoor-run": () => run({}),
  "brisk-walk": () => run({ lift: 0.2, lean: 2 }),
  "incline-walk": () => uphill(walk()),
  "rowing-machine": erg,
  "stationary-bike": bike,
  "outdoor-cycling": bike,
  "air-bike": bike,
  "ski-erg": () => pulldown({ straightArm: true }),
  elliptical,
  "stair-climber": () => run({ lift: 0.45, lean: 10 }),
  "jump-rope": () => hop({ dip: 0.06, air: 0.07, arms: "rope" }),
  "double-unders": () => hop({ dip: 0.1, air: 0.16, arms: "rope", turns: 2 }),
  "battle-ropes": () => battleRopes({ style: "alternating" }),
  "sled-push": sledPush,
  "sled-pull": () => sledPull({ kind: "pull" }),
  "shuttle-run": () => run({ lift: 0.6, lean: 14 }),
  "med-ball-slam": ballSlam,
  "wall-ball": () => ({ ...thruster({ load: "none" }), props: () => [{ kind: "box", at: V(0.95, 1.6), size: V(0.08, 3.2, 1.6) }] }),
  "med-ball-rotational-throw": russianTwist,
  // batch b1 (2026-11-11)
  "db-incline-fly": () => onBench(fly({ posture: "supine", from: 6, to: 78, load: "dumbbell", first: "lower" }), 30),
  "db-floor-press": () => benchPress({ load: "dumbbell" }),
  "db-neutral-press": () => benchPress({ load: "dumbbell", grip: 0.18 }),
  "db-single-arm-bench": () => benchPress({ load: "dumbbell" }),
  "db-low-incline-press": () => benchPress({ load: "dumbbell", incline: 15 }),
  "wide-grip-bench": () => benchPress({ load: "barbell", grip: 0.32 }),
  "paused-bench": () => benchPress({ load: "barbell" }),
  "pin-press": () => benchPress({ load: "barbell" }),
  "incline-cable-fly": () => onBench(fly({ posture: "supine", from: 6, to: 78, load: "handle", first: "lower", cable: "low" }), 30),
  "single-arm-cable-fly": () => fly({ posture: "standing", from: 78, to: 8, load: "handle", first: "lift", cable: "side", oneArm: true }),
  "standing-cable-press": machinePress,
  "band-fly": () => fly({ posture: "standing", from: 78, to: 8, load: "none", first: "lift", cable: "side" }),
  "banded-push-up": () => pushUp({}),
  "deficit-push-up": () => pushUp({ deficit: true }),
  "spiderman-push-up": spidermanPushUp,
  "staggered-push-up": () => pushUp({ width: 0.28, stagger: true }),
  "push-up-rotation": () => pushUp({ rotate: true }),
  "ring-fly": ringFly,
  "ring-dip": () => dip({}),
  "straight-bar-dip": () => dip({}),
  "db-seated-lateral-raise": () => fly({ posture: "seated", from: 8, to: 84, load: "dumbbell", first: "lift" }),
  "lean-away-lateral-raise": () => fly({ posture: "standing", from: 8, to: 84, load: "dumbbell", first: "lift", oneArm: true }),
  "cable-y-raise": () => fly({ posture: "standing", from: 8, to: 88, load: "handle", first: "lift", cable: "low" }),
  "band-front-raise": () => fly({ posture: "standing", from: 8, to: 84, load: "none", first: "lift", cable: "low" }),
  "db-two-hand-front-raise": () => fly({ posture: "standing", from: 8, to: 84, load: "dumbbell", first: "lift" }),
  "db-rotation-press": () => uprightRow({ load: "dumbbell" }),
  "kb-arnold-press": () => overhead({ load: "kettlebell" }),
  "half-kneeling-landmine-press": () => overhead({ load: "barbell" }),
  "floor-seated-press": () => overhead({ load: "barbell", seated: true }),
  "behind-neck-press": () => overhead({ load: "barbell", seated: true, behind: true }),
  "db-single-arm-press": () => overhead({ load: "dumbbell" }),
  "band-upright-row": () => uprightRow({ load: "handle", cable: true }),
  "band-rear-delt-fly": () => fly({ posture: "bent", from: 5, to: 80, load: "none", first: "lift" }),
  "incline-y-raise": () => fly({ posture: "facePad", from: 12, to: 88, load: "dumbbell", first: "lift" }),
  "prone-t-raise": superman,
  "wall-slide": () => ({ ...overhead({ load: "none" }), props: () => [{ kind: "box", at: V(-0.2, 1.2), size: V(0.08, 2.4, 1.6) }] }),
  "kb-bent-press": windmill,
  "cable-shoulder-press": () => overhead({ load: "handle", seated: true, machine: true }),
  "db-overhead-lateral-raise": () => fly({ posture: "standing", from: 8, to: 88, load: "dumbbell", first: "lift" }),
  "kneeling-face-pull": facePull,
  "close-grip-push-up": () => pushUp({ width: 0.12, close: true }),
  "db-overhead-extension-two": () => overheadExtension({}),
  "db-single-arm-extension": () => overheadExtension({}),
  "cable-single-pushdown": () => pushdown({}),
  "reverse-grip-pushdown": () => pushdown({}),
  "cable-cross-extension": () => pushdown({}),
  "kb-skull-crusher": () => overheadExtension({ lying: true }),
  "incline-skull-crusher": () => onBench(overheadExtension({ lying: true }), 30),
  "band-overhead-extension": () => overheadExtension({}),
  "bodyweight-skull-crusher": () => bodyweightSkullCrusher({}),
  "seated-dip-machine": seatedDip,
  "kb-elbows-out-press": () => overheadExtension({ lying: true }),
  "band-kickback": () => tricepsKickback({ load: "none" }),
  "db-crush-press": () => benchPress({ load: "dumbbell", grip: 0.12, close: true }),
  "landmine-one-arm-row": () => bentRow({ load: "barbell", lean: 55, oneArm: true, grip: 0.08 }),
  "db-bent-over-row": () => bentRow({ load: "dumbbell" }),
  "underhand-barbell-row": () => bentRow({ load: "barbell", lean: 45 }),
  "smith-row": () => bentRow({ load: "barbell" }),
  "one-arm-cable-pulldown": () => pulldown(),
  "wide-grip-pulldown": () => pulldown(),
  "neutral-grip-pulldown": () => pulldown(),
  "kneeling-one-arm-row": seatedRow,
  "machine-high-row": () => chestSupportedRow({ load: "handle" }),
  "commando-pull-up": () => hanging({ grip: 0.1 }),
  "flexed-arm-hang": () => hanging({ grip: 0.2, chin: true }),
  "archer-pull-up": () => sidePullUp({}),
  "l-sit-pull-up": () => hanging({ grip: 0.34, knees: true }),
  "ring-pull-up": () => hanging({ grip: 0.3 }),
  "ring-face-pull": () => ringLean({ move: "face" }),
  "feet-up-inverted-row": () => leanRow({ angle: 20, handY: 0.95 }),
  "underhand-inverted-row": () => leanRow({ angle: 32, handY: 0.95 }),
  "band-one-arm-row": seatedRow,
  "band-bent-over-row": () => bentRow({ load: "none" }),
  "reverse-snow-angel": superman,
  "prone-cobra": superman,
  "reverse-hyper-bench": backExtension,
  "barbell-pullover": () => pullover({ load: "barbell" }),
  "kb-pullover": () => pullover({ load: "kettlebell" }),
  "cable-shrug": () => shrug({ load: "cable" }),
  "smith-shrug": () => shrug({ load: "barbell" }),
  "trap-bar-shrug": () => shrug({ load: "trapbar" }),
  "behind-back-shrug": () => behindBack({ move: "shrug" }),
  "towel-pull-up": () => hanging({ grip: 0.3 }),
  "kb-dead-stop-row": () => bentRow({ load: "kettlebell", lean: 62, oneArm: true, grip: 0.18 }),
  "spider-curl": () => curl({ load: "barbell", grip: 0.17 }),
  "db-spider-curl": () => curl({ load: "dumbbell", grip: 0.22 }),
  "db-cross-body-curl": () => curl({ load: "dumbbell", grip: 0.23 }),
  "behind-body-cable-curl": () => curl({ load: "handle", grip: 0.18, cable: "low", behind: true }),
  "high-cable-curl": () => curl({ load: "handle", grip: 0.18, cable: "low" }),
  "rope-hammer-curl": () => curl({ load: "handle", grip: 0.14, cable: "low" }),
  "db-21s": () => curl({ load: "dumbbell", grip: 0.22 }),
  "pinwheel-curl": () => curl({ load: "dumbbell", grip: 0.23 }),
  "band-concentration-curl": () => curl({ load: "none", posture: "seatedThighs" }),
  "chin-up-negative": () => hanging({ grip: 0.2, chin: true }),
  "reverse-db-curl": () => curl({ load: "dumbbell", grip: 0.22 }),
  "reverse-wrist-curl": () => curl({ load: "dumbbell", posture: "seatedThighs" }),
  "barbell-wrist-curl": () => curl({ load: "barbell", posture: "seatedThighs", grip: 0.17 }),
  "db-pinch-hold": () => carry({ hold: "each", load: "dumbbell" }),
  "db-wrist-rotation": () => curl({ load: "dumbbell", posture: "seatedThighs" }),
  "towel-hang": () => hanging({ grip: 0.3 }),
  "kb-bottoms-up-carry": () => carry({ hold: "R", load: "kettlebell" }),
  "band-wrist-extension": () => curl({ load: "none", posture: "seatedThighs" }),
  "kb-hammer-curl": () => curl({ load: "kettlebell", grip: 0.2 }),
  "bodyweight-curl": () => leanRow({ angle: 32, handY: 0.95 }),
  "machine-curl": () => curl({ load: "handle", grip: 0.17, posture: "seatedThighs" }),
  "goblet-box-squat": () => squat({ hold: "goblet", load: "dumbbell", holdKind: "centre", box: true, depth: 0.9 }),
  "tempo-squat": () => squat({ hold: "back" }),
  "pin-squat": () => squat({ hold: "back" }),
  "db-squat": () => squat({ hold: "arms", load: "dumbbell", holdKind: "each" }),
  "db-split-squat": () => lunge({ rear: "floor", hands: "dumbbells" }),
  "front-foot-elevated-split-squat": () => lunge({ rear: "floor", hands: "dumbbells" }),
  "barbell-split-squat": () => lunge({ rear: "floor", hands: "hips" }),
  "barbell-bulgarian-split-squat": () => lunge({ rear: "bench", hands: "hips", lean: 10 }),
  "bw-bulgarian-split-squat": () => lunge({ rear: "bench", hands: "hips", lean: 10 }),
  "db-reverse-lunge": () => lunge({ step: "back", hands: "dumbbells" }),
  "forward-lunge": () => walkingLunge({ hands: "hips", forward: true }),
  "deficit-reverse-lunge": () => lunge({ step: "back", hands: "dumbbells" }),
  "db-lateral-step-up": () => lateralStepUp({ load: "dumbbell" }),
  "box-step-down": stepUp,
  "band-spanish-squat": () => squat({ hold: "arms", depth: 0.8 }),
  "heels-raised-squat": () => squat({ hold: "arms" }),
  "prisoner-squat": () => squat({ hold: "arms" }),
  "skater-squat": () => skaterSquat({}),
  "narrow-leg-press": legPress,
  "wide-leg-press": legPress,
  "single-leg-extension": () => kneeMachine({ extend: true }),
  "smith-reverse-lunge": () => lunge({ step: "back", hands: "hips" }),
  "bw-box-squat": () => squat({ hold: "arms", box: true, depth: 0.9 }),
  "kb-single-leg-rdl": () => rdl({ load: "kettlebell", single: true }),
  "stiff-leg-deadlift": () => rdl({ load: "barbell" }),
  "trap-bar-rdl": () => deadlift({ trap: true }),
  "kickstand-rdl": () => rdl({ load: "dumbbell" }),
  "smith-rdl": () => rdl({ load: "barbell" }),
  "seated-good-morning": () => rdl({ load: "barbell" }),
  "slider-leg-curl": () => bridgeWalkout({ slide: true }),
  "cable-standing-leg-curl": () => cableLeg({ move: "curl" }),
  "band-leg-curl": () => kneeMachine({ extend: false }),
  "db-lying-leg-curl": () => kneeMachine({ extend: false }),
  "single-leg-curl": () => kneeMachine({ extend: false }),
  "frog-pump": () => bridge({}),
  "staggered-hip-thrust": () => bridge({ bench: true, bar: true }),
  "band-hip-thrust": () => bridge({ bench: true }),
  "feet-up-glute-bridge": () => bridge({}),
  "marching-glute-bridge": () => bridge({ single: true }),
  "cable-hip-abduction": () => cableLeg({ move: "out" }),
  "side-lying-leg-raise": () => sideLying("raise"),
  "fire-hydrant": fireHydrant,
  clamshell: () => sidePlank({}),
  "band-monster-walk": bandMonsterWalk,
  "db-swing": kbSwing,
  "hip-airplane": () => rdl({ load: "none", single: true }),
  "db-curtsy-lunge": () => lunge({ step: "back", hands: "dumbbells", curtsy: true }),
  "side-lying-adduction": () => sideLying("adduct"),
  "cable-hip-adduction": () => cableLeg({ move: "in" }),
  "plie-squat": () => squat({ hold: "arms" }),
  "short-copenhagen-plank": () => ({ ...sidePlank({ lift: true }), props: undefined }),
  "single-leg-calf-raise": () => calfRaise({ single: true, load: "none" }),
  "db-seated-calf-raise": () => calfRaise({ load: "dumbbell", hold: "each" }),
  "bent-over-calf-raise": () => calfRaise({ step: true, load: "none" }),
  "pogo-hops": () => hop({ dip: 0.05, air: 0.09, arms: "swing" }),
  "plank-shoulder-tap": () => shoulderTaps(highPlankBase),
  "high-plank": () => fourHold(highPlankBase),
  "side-plank-reach": () => sidePlank({}),
  "side-plank-hip-drop": () => sidePlank({ lift: true }),
  "reverse-crunch": () => floorCore({ kind: "legRaise" }),
  "heel-tap": () => floorCore({ kind: "crunch" }),
  "flutter-kicks": () => floorCore({ kind: "hollow" }),
  "scissor-kicks": () => floorCore({ kind: "hollow" }),
  "hollow-rock": () => floorCore({ kind: "hollow" }),
  "sit-up": () => floorCore({ kind: "crunch" }),
  "decline-sit-up": () => declineSitUp({ full: true }),
  "db-crunch": () => floorCore({ kind: "crunch" }),
  "dragon-flag": () => onFlatBench(floorCore({ kind: "legRaise" })),
  "windshield-wiper": windshieldWiper,
  "hanging-oblique-raise": hangingRaise,
  "parallel-bar-knee-raise": hangingRaise,
  "cable-side-bend": () => sideBend({ load: "handle", cable: true }),
  "db-side-bend": () => sideBend({ load: "dumbbell" }),
  "landmine-rotation": () => woodchop({ load: "handle" }),
  "cable-lift": () => woodchop({ load: "handle", anchor: true }),
  "half-kneeling-pallof": pallof,
  "bear-plank": () => fourHold(bearBase),
  "suitcase-march": () => carry({ hold: "R", load: "kettlebell" }),
  "plank-reach": () => oneHand(forearmPlankBase, (B, p, sgn) => V(p.sh[0] + reach(B) * 0.9, p.sh[1] + 0.02, sgn * 0.16), "Reach"),
  "seated-knee-tuck": () => floorCore({ kind: "vUp" }),
  "oblique-crunch": () => floorCore({ kind: "bicycle" }),
  "ring-rollout": abWheel,
  "barbell-rollout": abWheel,
  "tuck-l-sit": lSit,
  "kb-dead-bug": deadBug,
  "band-pallof-hold": pallof,
  inchworm: pikePushUp,
  "broad-jump": () => hop({ dip: 0.55, air: 0.22, arms: "swing", travel: { x: 0.95 }, walkBack: true, labels: ["Jump forward", ""] }),
  sprint: () => run({ lift: 0.7, lean: 12 }),
  "skater-jumps": () => skater({ dist: 0.42, height: 0.12, label: ["Jump right", "Jump left"] }),
  "tuck-jump": () => hop({ dip: 0.4, air: 0.32, arms: "swing", tuck: true, labels: ["Jump, knees up", "Jump, knees up"] }),
  "squat-thrust": () => burpee({ top: "none" }),
  "star-jump": jumpingJack,
  "lateral-shuffle": lateralShuffle,
  "butt-kicks": buttKicks,
  "plank-jack": plankJack,
  // batch b2 (2026-11-11)
  "smith-close-grip-press": () => benchPress({ load: "barbell", grip: 0.16, close: true }),
  "smith-decline-press": () => onBench(benchPress({ load: "barbell" }), -18, { press: true }),
  "single-arm-machine-press": machinePress,
  "cable-press-around": () => fly({ posture: "standing", from: 78, to: 8, load: "handle", first: "lift", cable: "side", oneArm: true }),
  "kneeling-cable-fly": () => fly({ posture: "standing", from: 78, to: 8, load: "handle", first: "lift", cable: "high" }),
  "db-reverse-grip-press": () => benchPress({ load: "dumbbell" }),
  "db-incline-neutral-press": () => benchPress({ load: "dumbbell", incline: 30, grip: 0.18 }),
  "db-decline-fly": () => onBench(fly({ posture: "supine", from: 6, to: 78, load: "dumbbell", first: "lower" }), -18),
  "db-floor-fly": () => fly({ posture: "supine", from: 6, to: 70, load: "dumbbell", first: "lower" }),
  "kb-single-arm-bench-press": () => benchPress({ load: "kettlebell" }),
  "landmine-chest-press": machinePress,
  "band-incline-press": machinePress,
  "push-up-bottom-hold": () => pushUp({}),
  "hand-release-push-up": handReleasePushUp,
  "one-arm-push-up": oneArmPushUp,
  "typewriter-push-up": typewriterPushUp,
  "ring-support-hold": () => dip({}),
  "parallel-bar-support-hold": () => dip({}),
  "feet-up-bench-dip": () => dip({ bench: true }),
  "kb-half-kneeling-press": () => overhead({ load: "kettlebell" }),
  "kb-waiter-carry": () => carry({ hold: "R", load: "kettlebell", at: "overhead" }),
  "db-push-press": () => overhead({ load: "dumbbell" }),
  "db-scaption": () => fly({ posture: "standing", from: 8, to: 84, load: "dumbbell", first: "lift" }),
  "cable-single-rear-delt": () =>
    fly({ posture: "standing", from: 10, to: 86, load: "handle", first: "lift", cable: "side", oneArm: true }),
  "chest-supported-rear-delt-row": chestSupportedRow,
  "band-overhead-pull-apart": () => fly({ posture: "standing", from: 10, to: 86, load: "none", first: "lift" }),
  "wall-handstand-hold": () => ({ ...fourHold(handstandBase), props: wallBehind }),
  "wall-walk": wallWalk,
  "landmine-lateral-raise": () => fly({ posture: "standing", from: 8, to: 84, load: "handle", first: "lift", oneArm: true }),
  "db-standing-press": () => overhead({ load: "dumbbell" }),
  "db-halo": halo,
  "barbell-high-pull": () => uprightRow({ load: "barbell" }),
  "incline-front-raise": inclineFrontRaise,
  "side-lying-lateral-raise": () => fly({ posture: "standing", from: 8, to: 84, load: "dumbbell", first: "lift", oneArm: true }),
  "cable-external-rotation": externalRotation,
  "db-external-rotation": externalRotation,
  "prone-w-raise": superman,
  "prone-y-raise": superman,
  "incline-t-raise": () => fly({ posture: "facePad", from: 12, to: 88, load: "dumbbell", first: "lift" }),
  "single-arm-pec-deck": () => fly({ posture: "seated", from: 82, to: 10, load: "handle", first: "lift" }),
  "single-arm-reverse-pec-deck": () => fly({ posture: "facePad", from: 12, to: 88, load: "handle", first: "lift" }),
  "deficit-pike-push-up": () => pikePushUp({ deficit: 0.15 }),
  "med-ball-push-up": () => pushUp({ width: 0.08, close: true, hands: 0.2, ball: true }),
  "med-ball-chest-pass": chestPass,
  "med-ball-overhead-throw": () => pulldown({ straightArm: true }),
  "landmine-squeeze-press": machinePress,
  "cable-incline-press": () => benchPress({ load: "handle", incline: 30 }),
  "cable-bench-press": () => benchPress({ load: "handle" }),
  "smith-standing-press": () => overhead({ load: "barbell" }),
  "wide-grip-barbell-row": () => bentRow({ load: "barbell", grip: 0.3 }),
  "paused-barbell-row": () => bentRow({ load: "barbell" }),
  "db-dead-stop-row": () => bentRow({ load: "dumbbell", lean: 80 }),
  "one-arm-incline-row": chestSupportedRow,
  "standing-cable-row": seatedRow,
  "underhand-cable-row": seatedRow,
  "kneeling-lat-pulldown": () => pulldown(),
  "rope-straight-arm-pulldown": () => pulldown({ straightArm: true }),
  "assisted-chin-up-machine": () => hanging({ grip: 0.2, chin: true, band: true }),
  "band-assisted-chin-up": () => hanging({ grip: 0.2, chin: true, band: true }),
  "mixed-grip-pull-up": () => hanging({ grip: 0.3 }),
  "close-grip-pull-up": () => hanging({ grip: 0.14 }),
  "active-hang": () => hanging({ grip: 0.34 }),
  "one-arm-hang": () => hanging({ grip: 0.34 }),
  "ring-y-raise": () => ringLean({ move: "y" }),
  "ring-reverse-fly": () => ringLean({ move: "fly" }),
  "wide-inverted-row": () => leanRow({ angle: 32, handY: 0.95 }),
  "weighted-back-extension": backExtension,
  "back-extension-hold": backExtension,
  "kb-good-morning": () => rdl({ load: "kettlebell", hold: "centre" }),
  "snatch-grip-rdl": () => rdl({ load: "barbell" }),
  "incline-db-shrug": inclineShrug,
  "band-shrug": shrug,
  "wide-grip-barbell-curl": () => curl({ load: "barbell", grip: 0.28 }),
  "close-grip-barbell-curl": () => curl({ load: "barbell", grip: 0.12 }),
  "ez-reverse-curl": () => curl({ load: "barbell", grip: 0.17 }),
  "incline-hammer-curl": () => curl({ load: "dumbbell", grip: 0.25, posture: "incline" }),
  "db-waiter-curl": () => curl({ load: "dumbbell", grip: 0.07, hold: "centre" }),
  "seated-db-curl": () => curl({ load: "dumbbell", grip: 0.22 }),
  "db-drag-curl": () => curl({ load: "dumbbell", grip: 0.22 }),
  "cable-preacher-curl": () => curl({ load: "handle", grip: 0.17, posture: "seatedThighs" }),
  "cable-concentration-curl": () => curl({ load: "handle", grip: 0.18, posture: "seatedThighs" }),
  "cable-drag-curl": () => curl({ load: "handle", grip: 0.18, cable: "low" }),
  "lying-cable-curl": () => curl({ load: "handle", grip: 0.18, cable: "low" }),
  "band-reverse-curl": () => curl({ load: "none", grip: 0.2, cable: "band" }),
  "ring-biceps-curl": () => ringLean({ move: "curl" }),
  "hammer-curl-to-press": curlToPress,
  "db-farmers-hold": () => carry({ hold: "each", load: "dumbbell" }),
  "cable-single-overhead-extension": () => overheadExtension({ hold: "cable" }),
  "kneeling-cable-extension": () => overheadExtension({ hold: "cable" }),
  "v-bar-pushdown": () => pushdown({}),
  "straight-bar-pushdown": () => pushdown({}),
  "db-incline-skull-crusher": () => ({ ...onBench(overheadExtension({ lying: true }), 30), load: "dumbbell", hold: "each", grip: 0.12 }),
  "ez-overhead-extension": () => overheadExtension({ hold: "ez" }),
  "smith-jm-press": () => benchPress({ load: "barbell", grip: 0.16, close: true }),
  "close-grip-floor-press": () => benchPress({ load: "barbell", grip: 0.16, close: true }),
  "kb-overhead-extension": () => overheadExtension({}),
  "ring-triceps-extension": () => bodyweightSkullCrusher({ rings: true }),
  "smith-box-squat": () => squat({ hold: "back", smith: true, box: true, depth: 0.9 }),
  "smith-front-squat": () => squat({ hold: "front", smith: true }),
  "half-squat": () => squat({ hold: "back", depth: 0.55 }),
  "paused-front-squat": () => squat({ hold: "front" }),
  "barbell-step-up": stepUp,
  "barbell-reverse-lunge": () => lunge({ step: "back", hands: "hips" }),
  "barbell-walking-lunge": () => walkingLunge({ hands: "back" }),
  "db-goblet-lateral-lunge": cossack,
  "kb-cossack-squat": cossack,
  "kb-goblet-step-up": stepUp,
  "kb-split-squat": () => lunge({ hands: "dumbbells" }),
  "kb-bulgarian-split-squat": () => lunge({ rear: "bench", hands: "dumbbells" }),
  "kb-sumo-squat": () => squat({ hold: "goblet", load: "kettlebell", holdKind: "centre" }),
  "tempo-goblet-squat": () => squat({ hold: "goblet", load: "dumbbell", holdKind: "centre" }),
  "hack-squat-calf-raise": () => calfRaise({ machine: true, load: "none" }),
  "smith-bulgarian-split-squat": () => lunge({ rear: "bench", hands: "hips" }),
  "smith-good-morning": () => rdl({ load: "barbell" }),
  "paused-deadlift": () => deadlift(),
  "paused-rdl": () => rdl({ load: "barbell" }),
  "db-stiff-leg-deadlift": () => rdl({ load: "dumbbell" }),
  "kb-romanian-deadlift": () => rdl({ load: "kettlebell", hold: "centre" }),
  "kb-suitcase-deadlift": () => rdl({ load: "kettlebell", hold: "R" }),
  "db-glute-bridge": () => bridge({ onHips: true }),
  "kb-hip-thrust": () => bridge({ bench: true, onHips: true }),
  "glute-bridge-hold": () => bridge({}),
  "band-clamshell": () => ({ ...sideLying("clam"), props: kneeBand }),
  "single-leg-wall-sit": () => wallSit({ oneLeg: true }),
  "reverse-lunge-knee-drive": () => lunge({ step: "back", hands: "hips" }),
  "split-squat-hold": () => lunge({ hands: "hips" }),
  "deep-squat-hold": () => squat({ hold: "arms" }),
  "box-pistol-squat": () => pistol({ box: true }),
  "assisted-pistol-squat": () => pistol({ assisted: true }),
  "band-assisted-nordic": nordic,
  "hamstring-walkout": () => bridgeWalkout({}),
  "single-leg-db-calf-raise": () => calfRaise({ single: true, step: true, load: "dumbbell", hold: "R" }),
  "smith-seated-calf-raise": () => calfRaise({ machine: true, load: "none" }),
  "kb-calf-raise": () => calfRaise({ step: true, load: "kettlebell", hold: "each" }),
  "calf-raise-hold": () => calfRaise({ load: "none" }),
  "pogo-jumps": () => hop({ dip: 0.06, air: 0.12, arms: "swing" }),
  "lateral-bound": () => skater({ dist: 0.6, height: 0.2, label: ["Bound right", "Bound left"] }),
  "depth-jump": boxJump,
  "single-leg-hop": () => hop({ dip: 0.2, air: 0.12, arms: "swing", oneLeg: true, labels: ["Hop", "Hop"] }),
  "trap-bar-jump": () => asTrapBar(jumpSquat({ trap: true })),
  "high-handle-trap-bar-deadlift": () => deadlift({ trap: true }),
  "landmine-reverse-lunge": () => lunge({ step: "back", hands: "hips" }),
  "cable-rdl": () => rdl({ load: "none" }),
  "plank-up-down": plankUpDown,
  "side-plank-star": () => sidePlank({ lift: true }),
  "long-lever-plank": plank,
  "full-tension-plank": plank,
  "plank-knee-to-elbow": mountainClimber,
  "side-plank-knee-tuck": () => sidePlank({ lift: true }),
  "reverse-plank": () => fourHold(reversePlankBase),
  "weighted-dead-bug": deadBug,
  "weighted-sit-up": () => floorCore({ kind: "crunch" }),
  "db-russian-twist": russianTwist,
  "med-ball-russian-twist": russianTwist,
  "kb-russian-twist": russianTwist,
  "cable-oblique-crunch": cableCrunch,
  "standing-cable-crunch": cableCrunch,
  "decline-crunch": () => declineSitUp({ full: false }),
  "toe-touch-crunch": () => floorCore({ kind: "vUp" }),
  "v-sit-hold": () => floorCore({ kind: "hollow" }),
  jackknife: () => floorCore({ kind: "vUp" }),
  "single-leg-v-up": () => floorCore({ kind: "vUp" }),
  "hanging-knee-tuck-twist": hangingRaise,
  "bear-plank-shoulder-tap": () => shoulderTaps(bearBase),
  "bird-dog-row": () => onFlatBench(allFours({ kind: "birdDog" }), { to: "knees" }),
  "plank-pull-through": () => oneHand(highPlankBase, (B, p, sgn) => V(p.sh[0] - 0.18, 0.08, -sgn * 0.38), "Pull through", 1),
  "landmine-anti-rotation": () => woodchop({ load: "handle" }),
  "half-kneeling-cable-chop": () => woodchop({ load: "handle", anchor: true }),
  "tall-kneeling-pallof": pallof,
  "pallof-press-overhead": pallof,
  "cable-pallof-hold": pallof,
  "dead-bug-hold": deadBug,
  "bird-dog-hold": () => allFours({ kind: "birdDog" }),
  "superman-hold": superman,
  "prone-leg-lift": superman,
  "knee-plank": () => fourHold(kneePlankBase),
  "incline-plank": () => holdAt(pushUp({ hands: 0.45 }), 0),
  "kneeling-side-plank": () => sidePlank({}),
  "cross-body-mountain-climber": mountainClimber,
  "slow-mountain-climber": mountainClimber,
  "bench-leg-raise": () => onFlatBench(floorCore({ kind: "legRaise" })),
  "bench-reverse-crunch": () => onFlatBench(floorCore({ kind: "legRaise" })),
  "hanging-l-hold": hangingRaise,
  "suitcase-hold": () => carry({ hold: "R", load: "dumbbell" }),
  "db-suitcase-carry": () => carry({ hold: "R", load: "dumbbell" }),
  "db-rack-carry": () => carry({ hold: "each", load: "dumbbell", at: "rack" }),
  "db-overhead-carry": () => carry({ hold: "each", load: "dumbbell", at: "overhead" }),
  "db-farmers-march": () => carry({ hold: "each", load: "dumbbell" }),
  "kb-crossbody-carry": () => carry({ hold: "each", load: "kettlebell", at: "mixed" }),
  "goblet-carry": () => carry({ hold: "centre", load: "dumbbell", at: "goblet" }),
  "kb-goblet-carry": () => carry({ hold: "centre", load: "kettlebell", at: "goblet" }),
  "trap-bar-carry": () => carry({ hold: "each", load: "trapbar" }),
  "med-ball-scoop-toss": kbSwing,
  "med-ball-sit-up-throw": () => floorCore({ kind: "crunch" }),
  "kb-figure-eight": figureEight,
  "bike-sprint": bike,
  "rower-sprint": erg,
  "ski-erg-sprint": () => pulldown({ straightArm: true }),
  "treadmill-sprint": () => run({ lift: 0.7, lean: 12 }),
  "hill-sprint": () => run({ lift: 0.75, lean: 15 }),
  "stair-run": () => run({ lift: 0.45, lean: 10 }),
  "sled-drag": () => sledPull({ kind: "drag" }),
  "battle-rope-slam": () => battleRopes({ style: "slam" }),
  "crab-walk": crabWalk,
  "lateral-bear-crawl": lateralBearCrawl,
  "backward-bear-crawl": backwardBearCrawl,
  sprawl: () => burpee({ top: "none", sprawl: true }),
  "burpee-broad-jump": () => burpee(),
  "burpee-box-jump": boxJump,
  "burpee-pull-up": () => burpee({ top: "pull" }),
  "half-burpee": () => burpee({ top: "none" }),
  "lateral-burpee": lateralBurpee,
  "seal-jack": jumpingJack,
  "cross-jack": jumpingJack,
  "squat-jack": () => hop({ dip: 0.55, air: 0.08, arms: "chest", wide: [0.12, 0.34], labels: ["Jump out", "Jump in"] }),
  "plank-to-squat": () => burpee({ top: "none" }),
  "frog-jump": () =>
    hop({ dip: 0.95, air: 0.18, arms: "floor", travel: { x: 0.7 }, walkBack: true, wide: [0.24, 0.24], labels: ["Jump forward", ""] }),
  "in-and-out-jumps": () => hop({ dip: 0.35, air: 0.1, arms: "swing", wide: [0.1, 0.3], labels: ["Jump out", "Jump in"] }),
  "fast-feet": () => run({ lift: 0.25, lean: 5 }),
  carioca,
  "skipping-drill": () => run({ lift: 0.8, lean: 0 }),
  "power-skip": () => run({ lift: 0.9, lean: 0 }),
  "shadow-boxing": shadowBoxing,
  "jump-rope-high-knees": () => run({ lift: 0.8, lean: 0 }),
  "jump-rope-single-leg": () => hop({ dip: 0.08, air: 0.07, arms: "rope", oneLeg: true, labels: ["Hop", "Hop"] }),
  "recumbent-bike": bike,
  rucking: walk,
  hiking: walk,
  "step-aerobics": stepUp,
  "elliptical-intervals": elliptical,
  "incline-treadmill-run": () => uphill(run({ lift: 0.55, lean: 10 })),
  "treadmill-walk": walk,
  "db-hang-clean": () => kbFlow({ to: "rack", load: "dumbbell" }),
  "db-clean-and-press": () => cleanAndPress({ load: "dumbbell" }),
  "db-devil-press": devilPress,
  "power-snatch": () => snatch({ floor: true }),
  "hang-snatch": () => snatch({ floor: false }),
  "clean-and-jerk": cleanAndJerk,
  "push-jerk": () => jerk({ split: false }),
  "split-jerk": () => jerk({ split: true }),
  "kb-clean-and-press": () => cleanAndPress({}),
  "kb-overhead-lunge": () => lunge({ step: "back", hands: "hips" }),
  "db-overhead-lunge": () => lunge({ step: "walk", hands: "hips" }),
  "ring-muscle-up": () => muscleUp({ rings: true }),
  "tuck-front-lever": tuckFrontLever,
  "skin-the-cat": skinTheCat,
  "planche-lean": () => fourHold(plancheLeanBase),
  "tuck-planche": () => tuckBalance("planche"),
  "frog-stand": () => tuckBalance("frog"),
  "freestanding-handstand": () => fourHold(handstandBase),
  "typewriter-pull-up": () => sidePullUp({ typewriter: true }),
  "scapular-pull-up": () => hanging({ grip: 0.34 }),
  "ring-fallout": abWheel,
  "ring-l-sit": lSit,
  // batch b3 (2026-11-11)
  "db-alternating-shoulder-press": () => overhead({ load: "dumbbell" }),
  "db-incline-alternating-press": () => benchPress({ load: "dumbbell", incline: 30 }),
  "db-alternating-bench-press": () => benchPress({ load: "dumbbell" }),
  "db-one-arm-floor-press": () => benchPress({ load: "dumbbell" }),
  "db-paused-bench-press": () => benchPress({ load: "dumbbell" }),
  "tempo-bench-press": () => benchPress({ load: "barbell" }),
  "close-grip-incline-press": () => benchPress({ load: "barbell", incline: 30, grip: 0.16, close: true }),
  "reverse-grip-bench-press": () => benchPress({ load: "barbell" }),
  "smith-floor-press": () => benchPress({ load: "barbell" }),
  "band-decline-press": () => fly({ posture: "standing", from: 30, to: 0, load: "none", first: "lift", cable: "high" }),
  "band-single-arm-press": () => ({ ...chestPass(), load: "none", hold: undefined }),
  "ring-wide-push-up": () => pushUp({ rings: true, width: 0.32 }),
  "ring-archer-push-up": () => archerPushUp({ rings: true }),
  "pike-shoulder-tap": () => shoulderTaps(pikeBase),
  "wall-handstand-shoulder-tap": () => ({ ...shoulderTaps(handstandBase), props: wallBehind }),
  "shoulder-tap-push-up": shoulderTapPushUp,
  "decline-diamond-push-up": () => pushUp({ feet: 0.42, width: 0.06, close: true }),
  "tempo-push-up": () => pushUp({}),
  "paused-push-up": () => pushUp({}),
  "one-arm-incline-push-up": () => pushUp({ hands: 0.45 }),
  "knuckle-push-up": () => pushUp({}),
  "kb-double-press": () => overhead({ load: "kettlebell" }),
  "kb-seated-press": () => overhead({ load: "kettlebell", seated: true }),
  "kb-see-saw-press": () => overhead({ load: "kettlebell" }),
  "kb-tall-kneeling-press": () => overhead({ load: "kettlebell" }),
  "db-tall-kneeling-press": () => overhead({ load: "dumbbell" }),
  "db-half-kneeling-press": () => overhead({ load: "dumbbell" }),
  "landmine-single-arm-push-press": () => overhead({ load: "barbell" }),
  "tall-kneeling-landmine-press": () => overhead({ load: "barbell" }),
  "barbell-front-raise": () => fly({ posture: "standing", from: 8, to: 84, load: "barbell", first: "lift" }),
  "db-chest-circle": () => fly({ posture: "supine", from: 80, to: 0, load: "dumbbell", first: "lower" }),
  "db-lateral-raise-hold": () => fly({ posture: "standing", from: 8, to: 84, load: "dumbbell", first: "lift" }),
  "db-partial-lateral-raise": () => fly({ posture: "standing", from: 8, to: 50, load: "dumbbell", first: "lift" }),
  "cable-behind-back-lateral-raise": () =>
    fly({ posture: "standing", from: 8, to: 84, load: "handle", first: "lift", cable: "side", oneArm: true }),
  "band-pass-through": () => pulldown({ straightArm: true }),
  "cable-internal-rotation": externalRotation,
  "single-arm-shoulder-press-machine": () => overhead({ load: "handle", seated: true, machine: true }),
  "db-split-stance-row": oneArmBenchRow,
  "db-alternating-bent-over-row": () => bentRow({ load: "dumbbell" }),
  "db-wide-row": () => bentRow({ load: "dumbbell", grip: 0.3 }),
  "db-rear-delt-row": oneArmBenchRow,
  "kneeling-high-cable-row": seatedRow,
  "straight-arm-pulldown": () => pulldown({ straightArm: true }),
  "paused-lat-pulldown": () => pulldown(),
  "ring-single-arm-row": () => leanRow({ angle: 46, handY: 1.0, rings: true }),
  "smith-inverted-row": () => leanRow({ angle: 32, handY: 0.95 }),
  "prone-w-pull": superman,
  "prone-snow-angel": superman,
  "band-high-row": seatedRow,
  "db-seated-rear-delt-raise": () => fly({ posture: "bent", from: 5, to: 80, load: "dumbbell", first: "lift" }),
  "db-shrug-hold": shrug,
  "kb-shrug": shrug,
  "barbell-power-shrug": () => shrug({ load: "barbell" }),
  "bench-reverse-hyper": superman,
  "ez-preacher-curl": () => curl({ load: "barbell", grip: 0.17, posture: "seatedThighs" }),
  "db-alternating-curl": () => curl({ load: "dumbbell", grip: 0.22 }),
  "barbell-21s-curl": () => curl({ load: "barbell", grip: 0.2 }),
  "cable-reverse-curl": () => curl({ load: "handle", grip: 0.18, cable: "low" }),
  "db-biceps-hold": () => curl({ load: "dumbbell", grip: 0.22 }),
  "db-wrist-curl": () => curl({ load: "dumbbell", posture: "seatedThighs" }),
  "cable-wrist-curl": () => curl({ load: "handle", posture: "seatedThighs" }),
  "behind-back-wrist-curl": () => behindBack({ move: "wrists" }),
  "kb-bottoms-up-hold": () => kbFlow({ to: "rack" }),
  "db-floor-skull-crusher": () => overheadExtension({ lying: true }),
  "db-cross-body-extension": () => overheadExtension({ lying: true }),
  "machine-row-single-arm": seatedRow,
  "cable-triceps-kickback": () => tricepsKickback({ load: "handle", cable: true }),
  "kb-counterbalance-squat": () => squat({ hold: "arms", load: "kettlebell" }),
  "db-box-squat": () => squat({ hold: "goblet", load: "dumbbell", box: true }),
  "kb-box-squat": () => squat({ hold: "goblet", load: "kettlebell", box: true }),
  "band-front-squat": () => squat({ hold: "front" }),
  "band-split-squat": () => lunge({ hands: "hips" }),
  "band-reverse-lunge": () => lunge({ step: "back", hands: "hips" }),
  "band-step-up": stepUp,
  "band-sumo-squat": () => squat({ hold: "hips", depth: 0.9 }),
  "band-rdl": () => rdl({ load: "none" }),
  "band-single-leg-rdl": () => rdl({ load: "none", single: true }),
  "band-calf-raise": () => calfRaise({ load: "none" }),
  "band-glute-bridge": () => bridge({}),
  "cable-goblet-squat": () => squat({ hold: "goblet", load: "handle" }),
  "cable-split-squat": () => lunge({ hands: "hips" }),
  "cable-reverse-lunge": () => lunge({ step: "back", hands: "hips" }),
  "smith-step-up": stepUp,
  "smith-sumo-squat": () => squat({ hold: "back", smith: true, depth: 0.9 }),
  "smith-deadlift": deadlift,
  "smith-glute-bridge": () => bridge({}),
  "landmine-rdl": () => rdl({ load: "barbell" }),
  "landmine-single-leg-rdl": () => rdl({ load: "barbell", single: true }),
  "db-walking-lunge": () => walkingLunge({ hands: "dumbbells" }),
  "db-cossack-squat": cossack,
  "db-skater-squat": () => lunge({ hands: "dumbbells", lean: 10 }),
  "db-jump-squat": jumpSquat,
  "db-good-morning": () => rdl({ load: "dumbbell", hold: "centre" }),
  "db-single-leg-hip-thrust": () => bridge({ bench: true, single: true, onHips: true }),
  "db-single-leg-glute-bridge": () => bridge({ single: true, onHips: true }),
  "db-frog-pump": () => bridge({}),
  "kb-walking-lunge": () => walkingLunge({ hands: "dumbbells" }),
  "kb-lateral-lunge": cossack,
  "kb-curtsy-lunge": () => lunge({ step: "back", hands: "hips", curtsy: true }),
  "kb-glute-bridge": () => bridge({ onHips: true }),
  "kb-jump-squat": jumpSquat,
  "barbell-lateral-lunge": cossack,
  "barbell-curtsy-lunge": () => lunge({ step: "back", hands: "hips", curtsy: true }),
  "barbell-jump-squat": jumpSquat,
  "barbell-front-rack-lunge": () => lunge({ hands: "hips" }),
  "box-front-squat": () => squat({ hold: "front", load: "barbell", box: true }),
  "trap-bar-split-squat": () => asTrapBar(lunge({ hands: "dumbbells" })),
  "trap-bar-squat": () => deadlift({ trap: true }),
  "machine-glute-kickback": () => allFours({ kind: "donkey" }),
  "high-foot-leg-press": legPress,
  "low-foot-leg-press": legPress,
  "paused-hack-squat": hackSquat,
  "paused-leg-press": legPress,
  "single-leg-seated-leg-curl": () => kneeMachine({ extend: false }),
  "squat-pulse": () => squat({ hold: "arms", depth: 0.4 }),
  "lunge-pulse": () => lunge({ hands: "hips" }),
  "lateral-squat-walk": lateralSquatWalk,
  "bw-lateral-step-up": () => lateralStepUp(),
  "glute-bridge-walkout": () => bridgeWalkout({}),
  "single-leg-hamstring-bridge": () => bridge({ single: true }),
  "tibialis-raise": () => tibialisRaise({}),
  "band-tibialis-raise": () => tibialisRaise({ band: true }),
  "bent-knee-calf-raise": () => calfRaise({ load: "none" }),
  "deficit-calf-raise": () => calfRaise({ step: true, load: "none" }),
  "smith-single-leg-calf-raise": () => calfRaise({ single: true, step: true, load: "barbell" }),
  "ball-squeeze-bridge": () => bridge({}),
  "adductor-ball-squeeze": () => floorCore({ kind: "crunch" }),
  "band-hip-flexor-march": () => run({ lift: 0.8, lean: 0 }),
  "standing-ab-rollout": abWheel,
  "ab-wheel-side-rollout": abWheel,
  "med-ball-v-up": () => floorCore({ kind: "vUp" }),
  "med-ball-wall-sit-up": () => ({
    ...floorCore({ kind: "crunch" }),
    props: () => [{ kind: "box", at: V(1.25, 1.2), size: V(0.08, 2.4, 1.6) }],
  }),
  "med-ball-crunch": () => floorCore({ kind: "crunch" }),
  "med-ball-dead-bug": deadBug,
  "med-ball-woodchop": () => woodchop({ load: "none" }),
  "med-ball-side-toss": russianTwist,
  "cable-reverse-crunch": () => floorCore({ kind: "legRaise" }),
  "cable-dead-bug": deadBug,
  "kb-side-bend": () => sideBend({ load: "kettlebell" }),
  "kb-plank-drag": () => oneHand(highPlankBase, (B, p, sgn) => V(p.sh[0] - 0.18, 0.08, -sgn * 0.38), "Drag across", 1),
  "db-plank-drag": () => oneHand(highPlankBase, (B, p, sgn) => V(p.sh[0] - 0.18, 0.08, -sgn * 0.38), "Drag across", 1),
  "kb-renegade-row": renegadeRow,
  "db-pullover-crunch": () => floorCore({ kind: "crunch" }),
  "db-hollow-hold": () => floorCore({ kind: "hollow" }),
  "db-overhead-sit-up": () => floorCore({ kind: "crunch" }),
  "plank-hip-twist": plankHipTwist,
  "side-plank-db-row": () => sidePlank({}),
  "spiderman-plank": mountainClimber,
  "plank-saw": plankSaw,
  "plank-leg-lift": plankLegLift,
  "bird-dog-crunch": () => allFours({ kind: "birdDog" }),
  "heel-slide": heelSlide,
  "single-leg-lower": () => floorCore({ kind: "legRaise" }),
  "hip-lift": () => floorCore({ kind: "legRaise" }),
  "sit-up-twist": () => floorCore({ kind: "bicycle" }),
  "butterfly-sit-up": () => floorCore({ kind: "crunch" }),
  "hanging-oblique-knee-raise": hangingRaise,
  "dip-bar-knee-raise": lSit,
  "dip-bar-leg-raise": lSit,
  "ring-knee-tuck": () => plankKneeTuck({ rings: true }),
  "ring-plank": () => fourHold(highPlankBase),
  "body-saw": plankSaw,
  "slider-pike": () => plankToPike({ slide: true }),
  "slider-mountain-climber": mountainClimber,
  "slider-knee-tuck": () => plankKneeTuck({}),
  "standing-oblique-crunch": () => sideBend({ load: "none", crunch: true }),
  "standing-knee-to-elbow": () => sideBend({ load: "none", crunch: true }),
  "plank-to-pike": () => plankToPike({}),
  "band-lift": () => woodchop({ load: "none", anchor: true }),
  "pallof-reverse-lunge": () => pallofHold({ lunge: true }),
  "pallof-squat": () => pallofHold({}),
  "db-dead-bug-pullover": deadBug,
  "kb-mixed-carry": () => carry({ hold: "each", load: "kettlebell", at: "mixed" }),
  "db-mixed-carry": () => carry({ hold: "each", load: "dumbbell", at: "mixed" }),
  "kb-double-swing": kbSwing,
  "kb-dead-clean": () => kbFlow({ to: "rack" }),
  "kb-hand-to-hand-swing": kbSwing,
  "kb-arm-bar": turkishGetUp,
  "kb-half-get-up": turkishGetUp,
  "kb-overhead-swing": kbSwing,
  "sled-row": () => sledPull({ kind: "row" }),
  "sled-lateral-drag": sledLateralDrag,
  "zercher-carry": () => carry({ hold: "centre", load: "barbell", at: "zercher" }),
  "front-rack-barbell-carry": () => carry({ hold: "centre", load: "barbell", at: "rack" }),
  "overhead-barbell-carry": () => carry({ hold: "centre", load: "barbell", at: "overhead" }),
  "med-ball-bear-hug-carry": () => carry({ hold: "centre", load: "none", at: "goblet" }),
  "band-y-raise": () => fly({ posture: "standing", from: 12, to: 88, load: "none", first: "lift" }),
  "scap-push-up": () => pushUp({ scap: true }),
  "landmine-thruster": () => thruster({ load: "barbell" }),
  "landmine-split-squat": () => lunge({ hands: "hips" }),
  "cable-squat-to-row": squatToRow,
  "kb-squat-to-press": () => thruster({ load: "kettlebell" }),
  "db-reverse-lunge-press": () => lunge({ step: "back", hands: "dumbbells" }),
  "band-thruster": () => thruster({ load: "none" }),
  "band-lateral-lunge": cossack,
  "med-ball-goblet-squat": () => squat({ hold: "goblet" }),
  "med-ball-reverse-lunge": () => lunge({ step: "back", hands: "hips" }),
  "med-ball-lateral-lunge": cossack,
  "kb-lunge-pass-through": () => lunge({ hands: "hips" }),
  "kb-goblet-march": () => carry({ hold: "centre", load: "kettlebell", at: "goblet" }),
  "db-suitcase-lunge": () => lunge({ step: "back", hands: "dumbbells" }),
  "db-offset-squat": () => squat({ hold: "goblet", load: "dumbbell" }),
  "kb-front-rack-reverse-lunge": () => lunge({ step: "back", hands: "hips" }),
  "barbell-hack-squat": deadlift,
  "db-suitcase-squat": () => squat({ hold: "hips", load: "dumbbell" }),
  "tempo-split-squat": () => lunge({ hands: "hips" }),
  "one-and-a-half-squat": () => oneAndAHalf(squat({ hold: "back", load: "barbell" })),
  "tempo-rdl": () => rdl({ load: "barbell" }),
  "wall-sit-calf-raise": wallSitCalfRaise,
  "single-leg-box-jump": boxJump,
  "crossover-step-up": stepUp,
  "db-step-up-knee-drive": stepUp,
  "rower-intervals": erg,
  "ski-erg-intervals": () => pulldown({ straightArm: true }),
  "stair-climber-intervals": () => run({ lift: 0.45, lean: 10 }),
  "backward-treadmill-walk": () => backwards(walk(), "Walk backwards"),
  "sled-sprint": sledPush,
  "jump-rope-crossover": () => hop({ dip: 0.08, air: 0.1, arms: "rope", cross: true, labels: ["Cross", "Open"] }),
  "jump-rope-boxer-skip": () => hop({ dip: 0.05, air: 0.04, arms: "rope", skip: true, labels: ["Skip", "Skip"] }),
  "battle-rope-alternating-waves": () => battleRopes({ style: "alternating" }),
  "battle-rope-double-waves": () => battleRopes({ style: "double" }),
  "battle-rope-circles": () => battleRopes({ style: "circles" }),
  "battle-rope-side-slams": () => battleRopes({ style: "side" }),
  "battle-rope-jumping-jack": ropeJack,
  "squat-jump-180": () => hop({ dip: 0.6, air: 0.2, arms: "chest", turn: 180, labels: ["Jump and turn", "Jump and turn"] }),
  "lateral-hop": () => hop({ dip: 0.35, air: 0.15, arms: "swing", travel: { z: 0.45 }, labels: ["Hop right", "Hop left"] }),
  "single-leg-lateral-hop": () =>
    hop({ dip: 0.2, air: 0.1, arms: "swing", oneLeg: true, travel: { z: 0.3 }, labels: ["Hop right", "Hop left"] }),
  "seated-box-jump": boxJump,
  "lateral-box-jump": lateralBoxJump,
  "box-step-over": stepUp,
  "line-hops": () => hop({ dip: 0.08, air: 0.07, arms: "swing", travel: { z: 0.22 }, labels: ["Hop over", "Hop back"] }),
  "lateral-plank-walk": lateralPlankWalk,
  "duck-walk": duckWalk,
  "jog-in-place": () => run({ lift: 0.4, lean: 2 }),
  "march-in-place": () => run({ lift: 0.6, lean: 0 }),
  "step-jack": jumpingJack,
  "boxer-shuffle": () => run({ lift: 0.2, lean: 3 }),
  "treadmill-intervals": run,
  "stair-climber-side-step": () => run({ lift: 0.45, lean: 5 }),
  "elliptical-backward": () => backwards(elliptical(), "Stride backwards"),
  "burpee-tuck-jump": () => burpee({ top: "tuck" }),
  "kb-burpee-deadlift": () => burpee({ top: "none", bells: true }),
  "med-ball-burpee": () => burpee(),
  "med-ball-lunge-twist": () => lunge({ step: "walk", hands: "hips" }),
  "hanging-alternating-knee-raise": hangingRaise,
  "step-up-to-balance": stepUp,
};

function bandApart(B: Body, d: number): Pose {
  const hip = V(0.02, standY(B));
  const sh = torsoAt(B, hip, 0);
  const phi = rad(lerp(8, 84, d));
  const r = reach(B) * 0.95;
  const at = (sgn: number): Vec =>
    V(sh[0] + r * Math.cos(phi), sh[1] - 0.02, sgn * (B.shW * (1 - Math.cos(phi)) * 0.3 + r * Math.sin(phi) * 0.95 + 0.06));
  return { hip, sh, hand: per(at(-1), at(1)), elbowPole: V(-0.4, -1, 0.5), headBlend: 1 };
}

const cache = new Map<string, Motion>();
/** The motion for an exercise id; a relaxed standing pose when there is none (or no id). */
export function motionFor(id?: string | null): Motion {
  const key = id && MOTIONS[id] ? id : "__stand";
  let m = cache.get(key);
  if (!m) {
    if (key === "__stand") m = stand();
    else {
      const base = MOTIONS[key]();
      // tempo and paused lifts play their own tempo (tempoMotion.ts), and every lift holds its own gear
      // (equipmentMotion.ts), so a swap to a cousin never looks like nothing happened
      const e = EXERCISES.find((x) => x.id === key);
      m = withGear(key, withVariant(key, { ...base, phases: tempoPhases(key, base.phases) }, e?.pattern));
    }
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
