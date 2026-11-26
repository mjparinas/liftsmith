import { motionFor, type Motion } from "./motions";
import {
  add,
  ANKLE_H,
  clamp,
  ik,
  len,
  lerp,
  lerpV,
  mul,
  norm,
  rad,
  sub,
  V,
  type Anchor,
  type Body,
  type PerSide,
  type PhaseRow,
  type Pose,
  type Prop,
  type Side,
  type Vec,
} from "./rig";

// One 3D motion per stretch in the library (src/lib/stretches.ts), drawn on the same figures as the exercise
// demos (Melvin, 2026-11-11: "the stretch library should include 3d examples as well"). Kept apart from the
// exercise motions (motions.ts) so the two libraries grow without touching each other; the demo engine
// asks here first for ids that start "stretch:". A few warm-up drills are the same movement as an exercise
// and reuse its motion. Hands and feet are aimed with `toward`, which stops a target at arm's or leg's
// length, so every pose stays reachable on both bodies (checked by stretchMotions.test.ts).
//
// Frame: x forward, y up, z to the figure's right; the floor is y = 0.

// ---------- helpers ----------
const reach = (B: Body) => B.upper + B.fore;
const legMax = (B: Body) => (B.shin + B.thigh) * 0.995;
/** Hip height with straight legs and the hip `dx` ahead of the ankles. */
const standY = (B: Body, dx = 0.03, bend = 1) => ANKLE_H + Math.sqrt(Math.max(0.01, (legMax(B) * bend) ** 2 - dx * dx));
/** Shoulder centre for a torso leaning `lean` degrees forward from vertical (90 face down, -90 face up). */
const torsoAt = (B: Body, hip: Vec, lean: number): Vec => add(hip, V(Math.sin(rad(lean)) * B.torso, Math.cos(rad(lean)) * B.torso, 0));
const per = (L: Vec, R: Vec) => ({ L, R });
/** A point `max` along the way from `from` to `to`, or `to` itself when it's closer. */
function toward(from: Vec, to: Vec, max: number): Vec {
  const d = sub(to, from);
  const l = len(d);
  return l <= max ? to : add(from, mul(d, max / l));
}
/** Roughly where a shoulder joint sits (sgn -1 left, 1 right). */
function shJ(B: Body, hip: Vec, sh: Vec, sgn: number): Vec {
  const up = norm(sub(sh, hip));
  return add(V(sh[0], sh[1], sh[2] + sgn * B.shW), mul(up, -B.shDrop));
}
const hipJ = (B: Body, hip: Vec, sgn: number): Vec => V(hip[0], hip[1], hip[2] + sgn * B.hipW);
/** A hand aimed at `target`, no further than the arm reaches. */
const arm = (B: Body, hip: Vec, sh: Vec, sgn: number, target: Vec, k = 0.96) => toward(shJ(B, hip, sh, sgn), target, reach(B) * k);
/** An ankle aimed at `target`, no further than the leg reaches. */
const leg = (B: Body, hip: Vec, sgn: number, target: Vec, k = 0.985) => toward(hipJ(B, hip, sgn), target, legMax(B) * k);
/** Hands hanging by the sides. */
const hangL = (B: Body, hip: Vec, sh: Vec, sgn: number) => arm(B, hip, sh, sgn, V(sh[0] + 0.03, sh[1] - reach(B), sgn * (B.shW + 0.04)));
/** Hands resting on the hips. */
const onHips = (B: Body, hip: Vec, sgn: number): Vec => V(hip[0] + 0.02, hip[1] + 0.06, sgn * (B.hipW + 0.13));
/** Where the knee ends up for a hip, ankle and knee pole (the same IK the figure uses). */
const kneeOf = (B: Body, hip: Vec, sgn: number, ankle: Vec, pole: Vec) => ik(hipJ(B, hip, sgn), ankle, B.thigh, B.shin, pole);
/** Upright standing: hips over the feet. */
function upright(B: Body, lean = 0, hipX = 0.02, dx = 0.03) {
  const hip = V(hipX, standY(B, Math.max(0.03, dx)));
  return { hip, sh: torsoAt(B, hip, lean) };
}
const feet = (z = 0.12, x = 0.02): { L: Vec; R: Vec } => per(V(x, ANKLE_H, -z), V(x, ANKLE_H, z));
/** The upper of the two points `r1` from `c1` and `r2` from `c2` (in the x-y plane). */
function meet(c1: Vec, r1: number, c2: Vec, r2: number): Vec {
  const d = Math.max(1e-6, Math.hypot(c2[0] - c1[0], c2[1] - c1[1]));
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const ux = (c2[0] - c1[0]) / d,
    uy = (c2[1] - c1[1]) / d;
  const px = c1[0] + a * ux,
    py = c1[1] + a * uy;
  const p1 = V(px - h * uy, py + h * ux),
    p2 = V(px + h * uy, py - h * ux);
  return p1[1] >= p2[1] ? p1 : p2;
}
/** Kneeling with the knee at `knee` and the thigh `a` degrees back from vertical (negative leans the hips forward). */
function kneelHip(B: Body, knee: Vec, a: number): Vec {
  return add(knee, V(-Math.sin(rad(a)) * B.thigh * 0.99, Math.cos(rad(a)) * B.thigh * 0.99, 0));
}
/** The shin lying on the floor behind a knee, toes pointed back. */
const shinBack = (B: Body, knee: Vec, z: number): Vec => V(knee[0] - B.shin * 0.96, ANKLE_H + 0.01, z);
const wave = (d: number) => Math.sin(d * Math.PI * 2);

// ---------- tempos ----------
/** A static hold: ease in, hold while breathing, ease out. */
const HOLD: PhaseRow[] = [
  [1.4, 0, 1, "", 0.5],
  [3, 1, 1, "", 0.6],
  [1.4, 1, 0, "", 0.4],
];
/** A steady loop (circles, marching): d runs 0 to 1 at an even pace. */
const loop = (sec: number): PhaseRow[] => [[sec, 0, 1, "", 0.7]];
/** There and back. */
const swingPh = (a = 1, b = a): PhaseRow[] => [
  [a, 0, 1, "", 0.8],
  [b, 1, 0, "", 0.6],
];

// ---------- standing moves ----------
function march(o: { kick?: boolean } = {}): Motion {
  return {
    phases: loop(o.kick ? 1 : 1.4),
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B, 4);
      const s = wave(d);
      const lift = (sgn: number): Vec => {
        const k = Math.max(0, sgn * s);
        const hj = hipJ(B, hip, sgn);
        const down = V(0.02, ANKLE_H, sgn * 0.12);
        const up = o.kick ? add(hj, V(-0.2, -0.42, 0)) : add(hj, V(0.3, -0.4, 0));
        return leg(B, hip, sgn, lerpV(down, up, k));
      };
      const handSwing = (sgn: number): Vec => {
        const a = -sgn * s * 35;
        const j = shJ(B, hip, sh, sgn);
        return add(j, V(Math.sin(rad(a)) * 0.42 + 0.08, -Math.cos(rad(a)) * 0.42 + 0.05, sgn * 0.05));
      };
      return {
        hip,
        sh,
        ankle: per(lift(-1), lift(1)),
        foot: { L: o.kick ? 40 * Math.max(0, -s) : 20 * Math.max(0, -s), R: o.kick ? 40 * Math.max(0, s) : 20 * Math.max(0, s) },
        kneePole: o.kick ? V(0.3, -1, 0.1) : V(1, 0.2, 0.2),
        hand: per(handSwing(-1), handSwing(1)),
        elbowPole: V(-1, -0.3, 0.3),
        headBlend: 1,
      };
    },
  };
}

function jacks(): Motion {
  return {
    phases: swingPh(0.5),
    load: "none",
    pose(B, d) {
      const z = lerp(0.12, 0.36, d);
      const hip = V(0.02, ANKLE_H + Math.sqrt(Math.max(0.01, (legMax(B) * 0.985) ** 2 - (z - B.hipW) ** 2)) - 0.01);
      const sh = torsoAt(B, hip, 0);
      const a = lerp(10, 165, d);
      const hand = (sgn: number) =>
        add(shJ(B, hip, sh, sgn), V(0.04, -Math.cos(rad(a)) * reach(B) * 0.94, sgn * Math.sin(rad(a)) * reach(B) * 0.94));
      return {
        hip,
        sh,
        ankle: per(V(0.02, ANKLE_H, -z), V(0.02, ANKLE_H, z)),
        kneePole: per(V(1, 0, -0.4), V(1, 0, 0.4)),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(0, -1, 0.6),
        headBlend: 1,
      };
    },
  };
}

function armCircles(): Motion {
  return {
    phases: loop(1.6),
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B);
      const th = d * Math.PI * 2;
      const hand = (sgn: number) => {
        const j = shJ(B, hip, sh, sgn);
        return add(j, V(0.04 + 0.09 * Math.cos(th), 0.09 * Math.sin(th), sgn * reach(B) * 0.92));
      };
      return { hip, sh, ankle: feet(), hand: per(hand(-1), hand(1)), elbowPole: V(0, -1, 0.3), headBlend: 1 };
    },
  };
}

function shoulderRolls(): Motion {
  return {
    phases: loop(2),
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B);
      const th = d * Math.PI * 2;
      const s = V(sh[0] - 0.02 * Math.cos(th), sh[1], 0);
      const lift = 0.035 * (1 + Math.sin(th));
      const hand = (sgn: number) => add(hangL(B, hip, s, sgn), V(0, lift, 0));
      return {
        hip,
        sh: s,
        shrug: lift,
        ankle: feet(),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(-1, 0, 0.4),
        headBlend: 1,
      };
    },
  };
}

function armSwings(): Motion {
  return {
    phases: swingPh(0.8),
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B);
      const phi = lerp(-18, 88, d);
      const hand = (sgn: number) => {
        const j = shJ(B, hip, sh, sgn);
        const r = reach(B) * 0.93;
        return add(V(j[0], j[1] + 0.03, sgn * B.shW * 0.6), V(Math.cos(rad(phi)) * r, 0, sgn * Math.sin(rad(phi)) * r));
      };
      // Crossed in front, one arm sits a little higher so they pass.
      const L = hand(-1),
        R = hand(1);
      return {
        hip,
        sh,
        ankle: feet(),
        hand: per(add(L, V(0, 0.04, 0)), add(R, V(0, -0.04, 0))),
        elbowPole: V(-0.2, -1, 0.5),
        headBlend: 1,
      };
    },
  };
}

function kneeHug(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B, lerp(4, 14, d));
      const hj = hipJ(B, hip, 1);
      const ankleR = leg(B, hip, 1, lerpV(V(0.02, ANKLE_H, 0.12), add(hj, V(0.3, -0.14, 0.02)), d));
      const pole = V(1, 0.6 * d, 0.1);
      const knee = kneeOf(B, hip, 1, ankleR, pole);
      const grab = lerpV(knee, ankleR, 0.35);
      const handAt = (sgn: number) => arm(B, hip, sh, sgn, lerpV(hangL(B, hip, sh, sgn), add(grab, V(0.03, -0.02, sgn * 0.05)), d));
      return {
        hip,
        sh,
        ankle: per(V(0.02, ANKLE_H, -0.1), ankleR),
        foot: { L: 0, R: 20 * d },
        kneePole: per(V(1, 0, -0.2), pole),
        hand: per(handAt(-1), handAt(1)),
        elbowPole: V(-0.3, -1, 0.6),
        headBlend: 0.8,
      };
    },
  };
}

function toySoldier(): Motion {
  return {
    phases: swingPh(0.9, 0.9),
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B, lerp(2, 10, d));
      const a = lerp(0, 72, d);
      const hj = hipJ(B, hip, 1);
      const ankleR = add(hj, V(Math.sin(rad(a)) * legMax(B) * 0.97, -Math.cos(rad(a)) * legMax(B) * 0.97, 0.03));
      const handL = arm(B, hip, sh, -1, lerpV(hangL(B, hip, sh, -1), add(ankleR, V(0.05, 0.06, -0.06)), d));
      return {
        hip,
        sh,
        ankle: per(V(0.02, ANKLE_H, -0.1), ankleR),
        foot: { L: 0, R: -20 * d },
        kneePole: per(V(1, 0, -0.2), V(1, 0.2, 0.1)),
        hand: per(handL, hangL(B, hip, sh, 1)),
        elbowPole: V(-0.3, -1, 0.4),
        headBlend: 0.9,
      };
    },
  };
}

function legSwings(): Motion {
  return {
    phases: swingPh(0.8),
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B);
      const a = lerp(-28, 50, d);
      const hj = hipJ(B, hip, 1);
      const ankleR = add(hj, V(Math.sin(rad(a)) * legMax(B) * 0.97, -Math.cos(rad(a)) * legMax(B) * 0.97, 0.02));
      const wall = V(0.02, sh[1] - 0.08, -(B.shW + reach(B) * 0.78));
      return {
        hip,
        sh,
        ankle: per(V(0.02, ANKLE_H, -0.1), ankleR),
        foot: { L: 0, R: lerp(-10, 25, 1 - d) },
        kneePole: per(V(1, 0, -0.2), V(1, 0, 0.1)),
        hand: per(arm(B, hip, sh, -1, wall), onHips(B, hip, 1)),
        elbowPole: per(V(0, -1, -0.5), V(-0.4, 0, 1)),
        headBlend: 1,
      };
    },
    props: (B) => [{ kind: "box", at: V(0.02, 0.9, -(B.shW + reach(B) * 0.78 + 0.05)), size: V(0.8, 1.8, 0.06) }],
  };
}

function hipHinge(): Motion {
  return {
    phases: swingPh(1.4, 1.2),
    load: "none",
    pose(B, d) {
      const hip = V(-0.12 * d, standY(B, 0.03 + 0.12 * d, 0.985));
      const sh = torsoAt(B, hip, 72 * d);
      return {
        hip,
        sh,
        ankle: feet(0.13),
        kneePole: V(1, 0, 0.3),
        hand: per(onHips(B, hip, -1), onHips(B, hip, 1)),
        elbowPole: V(-0.6, 0.4, 1),
        headBlend: 0.6,
      };
    },
  };
}

/** Standing with hands to the floor (d 0), walking out to a plank (d 1). Legs stay long. */
function foldToPlank(from: number, to: number, phases: PhaseRow[]): Motion {
  return {
    phases,
    load: "none",
    stance: 0.1,
    pose(B, d0) {
      const d = lerp(from, to, d0);
      const ankle = V(0, ANKLE_H + 0.01 * d);
      const L = legMax(B) * 0.985;
      const arms = reach(B) * 0.95;
      // the hands' reach from the hips: torso plus arm, a little short of straight
      const plankX = Math.sqrt(Math.max(0.1, (L + B.torso) ** 2 - (arms + 0.02) ** 2));
      const hand = V(lerp(0.28, plankX + 0.05, d), 0.04);
      let hip = meet(ankle, L, hand, B.torso + arms - 0.02);
      // standing folds: don't let the hips go further than over the feet
      if (hip[0] < -0.12) hip = V(-0.12, ANKLE_H + Math.sqrt(L * L - 0.0144));
      const dir = norm(sub(hand, hip));
      const sh = add(hip, mul(dir, B.torso));
      return {
        hip,
        sh,
        ankle: per(V(ankle[0], ankle[1], -0.1), V(ankle[0], ankle[1], 0.1)),
        foot: lerp(0, 50, d),
        kneePole: V(1, 0, 0.1),
        hand: per(arm(B, hip, sh, -1, V(hand[0], hand[1], -0.17), 0.98), arm(B, hip, sh, 1, V(hand[0], hand[1], 0.17), 0.98)),
        elbowPole: V(-1, 0, 0.3),
        headBlend: 0,
      };
    },
  };
}

function scapPushUp(): Motion {
  return {
    phases: swingPh(0.9),
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const ankle = V(-0.95, 0.11);
      const shY = 0.04 + reach(B) * 0.93 + B.shDrop - 0.045 * d;
      const Lb = legMax(B) * 0.99 + B.torso;
      const th = Math.asin(clamp((shY - ankle[1]) / Lb, -1, 1));
      const dir = V(Math.cos(th), Math.sin(th));
      const hip = add(ankle, mul(dir, legMax(B) * 0.99));
      const sh = add(ankle, mul(dir, Lb));
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(sh[0] + 0.03, 0.04, sgn * (B.shW + 0.03)), 0.99);
      return {
        hip,
        sh,
        ankle: per(V(ankle[0], ankle[1], -0.1), V(ankle[0], ankle[1], 0.1)),
        foot: 55,
        kneePole: V(0, -1, 0.1),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(-1, 0, 0.3),
        headBlend: 0,
      };
    },
  };
}

function wallCalf(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const rear = V(-0.42, ANKLE_H, -0.1);
      const hx = lerp(-0.02, 0.06, d);
      const hy = ANKLE_H + Math.sqrt(Math.max(0.01, (legMax(B) * 0.98) ** 2 - (hx - rear[0]) ** 2));
      const hip = V(hx, hy);
      const sh = torsoAt(B, hip, lerp(14, 22, d));
      const wallX = 0.78;
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(wallX - 0.04, sh[1] + 0.02, sgn * 0.22), 0.97);
      return {
        hip,
        sh,
        ankle: per(rear, V(0.3, ANKLE_H, 0.11)),
        kneePole: per(V(1, 0, -0.1), V(1, 0, 0.2)),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(0, -1, 0.6),
        headBlend: 0.9,
      };
    },
    props: () => [{ kind: "box", at: V(0.8, 1, 0), size: V(0.06, 2, 1.2) }],
  };
}

function standingQuad(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B, 6);
      const hj = hipJ(B, hip, 1);
      const ankleR = leg(B, hip, 1, lerpV(add(hj, V(-0.12, -0.3, 0.01)), add(hj, V(-0.2, -0.13, 0.01)), d));
      return {
        hip,
        sh,
        ankle: per(V(0.02, ANKLE_H, -0.1), ankleR),
        foot: { L: 0, R: 80 },
        kneePole: per(V(1, 0, -0.2), V(0.15, -1, 0)),
        hand: per(V(sh[0] + 0.3, sh[1] - 0.02, -(B.shW + 0.25)), arm(B, hip, sh, 1, add(ankleR, V(-0.02, 0.03, 0.03)), 0.99)),
        elbowPole: per(V(0, -1, -0.5), V(-1, 0, 0.5)),
        headBlend: 1,
      };
    },
  };
}

function forwardFold(): Motion {
  return foldToPlank(0, 0.05, HOLD);
}

function doorwayChest(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const hipX = lerp(0.02, 0.08, d);
      const { hip, sh } = upright(B, lerp(0, 8, d), hipX, Math.hypot(0.3 - hipX, 0.03) / 0.99);
      const frameX = 0.02;
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(frameX - 0.02, sh[1] + 0.24, sgn * (B.shW + 0.3)));
      return {
        hip,
        sh,
        ankle: per(V(0.02, ANKLE_H, -0.12), V(0.3, ANKLE_H, 0.12)),
        kneePole: V(1, 0, 0.2),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(0, -1, 1),
        headBlend: 1,
      };
    },
    props: (B) => [
      { kind: "rail", at: V(-0.02, 1.05, -(B.shW + 0.36)), length: 2.1, axis: "y" },
      { kind: "rail", at: V(-0.02, 1.05, B.shW + 0.36), length: 2.1, axis: "y" },
    ],
  };
}

function crossBody(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B);
      const jR = shJ(B, hip, sh, 1);
      const handR = arm(B, hip, sh, 1, add(jR, V(0.32 - 0.06 * d, -0.04, -0.42 - 0.06 * d)), 0.97);
      const elbowR = ik(jR, handR, B.upper, B.fore, V(0, -1, 0.3));
      const handL = arm(B, hip, sh, -1, add(lerpV(elbowR, handR, 0.25), V(0.03, -0.03, 0)));
      return { hip, sh, ankle: feet(), hand: per(handL, handR), elbowPole: per(V(0, -1, -0.4), V(0, -1, 0.3)), headBlend: 1 };
    },
  };
}

function overheadTriceps(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B);
      const jR = shJ(B, hip, sh, 1);
      const handR = arm(B, hip, sh, 1, V(sh[0] - 0.12, sh[1] + 0.05 - 0.05 * d, 0.06));
      const poleR = V(0.2, 1, 0.5);
      const elbowR = ik(jR, handR, B.upper, B.fore, poleR);
      const handL = arm(B, hip, sh, -1, add(elbowR, V(0.03, 0.03, -0.03)));
      return { hip, sh, ankle: feet(), hand: per(handL, handR), elbowPole: per(V(0.2, 0.6, -1), poleR), headBlend: 1 };
    },
  };
}

function behindBack(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B, lerp(2, 12, d));
      const at = V(hip[0] - 0.22 - 0.12 * d, hip[1] + 0.02 + 0.14 * d, 0);
      return {
        hip,
        sh,
        ankle: feet(),
        hand: per(arm(B, hip, sh, -1, V(at[0], at[1], -0.03), 0.99), arm(B, hip, sh, 1, V(at[0], at[1], 0.03), 0.99)),
        elbowPole: V(-1, 0, 0.6),
        headBlend: 1,
      };
    },
  };
}

function wristFlexor(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B);
      const jR = shJ(B, hip, sh, 1);
      const handR = add(jR, V(reach(B) * 0.9, -0.02, -0.08));
      const handL = arm(B, hip, sh, -1, add(handR, V(0.05, 0.05 + 0.02 * d, -0.04)), 0.98);
      return { hip, sh, ankle: feet(), hand: per(handL, handR), elbowPole: per(V(0, -1, -0.5), V(0, -1, 0.3)), headBlend: 1 };
    },
  };
}

function neckSide(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B);
      const jR = shJ(B, hip, sh, 1);
      const handR = add(jR, V(0.02, -reach(B) * 0.97, 0.08 + 0.04 * d));
      const handL = arm(B, hip, sh, -1, V(sh[0] + 0.02, sh[1] + B.neck + 0.2, 0.06));
      return {
        hip,
        sh,
        shrug: -0.02 * d,
        ankle: feet(),
        hand: per(handL, handR),
        elbowPole: per(V(0.2, 0.4, -1), V(-1, 0, 0.4)),
        headBlend: 1,
      };
    },
  };
}

// ---------- kneeling and on all fours ----------
/** Hands and knees: knees under the hips (`rock` degrees forward), torso `pitch` degrees past flat. */
function allFours(B: Body, rock = 0, pitch = 0) {
  const knee = V(0, 0.06);
  const hip = kneelHip(B, knee, -rock);
  const sh = torsoAt(B, hip, 90 + pitch);
  return { knee, hip, sh };
}

function catCow(): Motion {
  return {
    phases: swingPh(1.6),
    load: "none",
    stance: 0.11,
    pose(B, d) {
      const { knee, hip, sh } = allFours(B, 0, lerp(-6, 8, d));
      const handX = B.torso + 0.02;
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(handX, 0.04, sgn * (B.shW + 0.02)), 0.99);
      return {
        hip,
        sh,
        ankle: per(shinBack(B, knee, -0.11), shinBack(B, knee, 0.11)),
        foot: 75,
        kneePole: V(0, -1, 0.1),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(-1, 0, 0.3),
        headBlend: lerp(1, 0, d),
      };
    },
  };
}

function wristRocks(): Motion {
  return {
    phases: swingPh(1.2),
    load: "none",
    stance: 0.11,
    pose(B, d) {
      const { knee, hip, sh } = allFours(B, lerp(-8, 14, d), 0);
      const handX = B.torso + 0.02;
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(handX, 0.04, sgn * (B.shW + 0.02)), 0.99);
      return {
        hip,
        sh,
        ankle: per(shinBack(B, knee, -0.11), shinBack(B, knee, 0.11)),
        foot: 75,
        kneePole: V(0, -1, 0.1),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(-1, 0, 0.3),
        headBlend: 0.4,
      };
    },
  };
}

function threadNeedle(): Motion {
  return {
    phases: HOLD,
    load: "none",
    stance: 0.11,
    pose(B, d) {
      const { knee, hip, sh } = allFours(B, 0, lerp(0, 28, d));
      const handX = B.torso + 0.05;
      const handL = arm(B, hip, sh, -1, V(handX, 0.04, -(B.shW + 0.06)), 0.99);
      const handR = arm(B, hip, sh, 1, lerpV(V(handX - 0.02, 0.04, B.shW), V(sh[0] - 0.02, 0.05, -0.38), d), 0.99);
      return {
        hip,
        sh,
        ankle: per(shinBack(B, knee, -0.11), shinBack(B, knee, 0.11)),
        foot: 75,
        kneePole: V(0, -1, 0.1),
        hand: per(handL, handR),
        elbowPole: per(V(-1, 0, -0.3), V(0, 1, 0.2)),
        headBlend: 0,
      };
    },
  };
}

function childsPose(): Motion {
  return {
    phases: HOLD,
    load: "none",
    stance: 0.13,
    pose(B, d) {
      const knee = V(0, 0.06);
      const hip = kneelHip(B, knee, lerp(36, 46, d));
      const sh = torsoAt(B, hip, lerp(100, 108, d));
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(sh[0] + reach(B), 0.04, sgn * 0.16), 0.97);
      return {
        hip,
        sh,
        ankle: per(shinBack(B, knee, -0.08), shinBack(B, knee, 0.08)),
        foot: 80,
        kneePole: V(0.4, -1, 0.15),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(0, 1, 0.3),
        headBlend: 0,
      };
    },
  };
}

function kneelingLat(): Motion {
  const top = 0.45;
  return {
    phases: HOLD,
    load: "none",
    stance: 0.12,
    pose(B, d) {
      const knee = V(0, 0.06);
      const hip = kneelHip(B, knee, lerp(18, 28, d));
      const sh = torsoAt(B, hip, lerp(96, 110, d));
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(0.78, top + 0.03, sgn * 0.12), 0.98);
      return {
        hip,
        sh,
        ankle: per(shinBack(B, knee, -0.11), shinBack(B, knee, 0.11)),
        foot: 75,
        kneePole: V(0.2, -1, 0.1),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(0, 1, 0.3),
        headBlend: 0,
      };
    },
    props: () => [{ kind: "box", at: V(0.78, top / 2), size: V(0.4, top, 0.34) }],
  };
}

/** Half kneeling: left knee down, right foot forward; the hips glide forward by `glide` (0 to 1). */
function halfKneel(B: Body, glide: number) {
  const knee = V(-0.18, 0.06, -0.11);
  const hip0 = kneelHip(B, V(knee[0], knee[1]), -glide * 24);
  const hip = V(hip0[0], hip0[1]);
  return { knee, hip, ankleL: shinBack(B, knee, -0.11), ankleR: V(0.38, ANKLE_H, 0.11) };
}

function kneelingHipFlexor(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, ankleL, ankleR } = halfKneel(B, lerp(0.2, 0.75, d));
      const sh = torsoAt(B, hip, lerp(0, -6, d));
      const up = (sgn: number) => arm(B, hip, sh, sgn, add(shJ(B, hip, sh, sgn), V(-0.02, reach(B), sgn * 0.06)), 0.95);
      return {
        hip,
        sh,
        ankle: per(ankleL, ankleR),
        foot: { L: 75, R: 0 },
        kneePole: per(V(0.2, -1, -0.1), V(1, 0.2, 0.15)),
        hand: per(lerpV(onHips(B, hip, -1), up(-1), d), onHips(B, hip, 1)),
        elbowPole: per(V(-0.2, 0.3, -1), V(-0.4, 0, 1)),
        headBlend: 1,
      };
    },
  };
}

function ankleRocks(): Motion {
  return {
    phases: swingPh(1.1),
    load: "none",
    pose(B, d) {
      const { hip, ankleL } = halfKneel(B, lerp(0.15, 0.85, d));
      const ankleR = V(0.3, ANKLE_H, 0.11);
      const sh = torsoAt(B, hip, 6);
      const knee = kneeOf(B, hip, 1, ankleR, V(1, 0.3, 0.15));
      return {
        hip,
        sh,
        ankle: per(ankleL, ankleR),
        foot: { L: 75, R: 0 },
        kneePole: per(V(0.2, -1, -0.1), V(1, 0.3, 0.15)),
        hand: per(onHips(B, hip, -1), arm(B, hip, sh, 1, add(knee, V(0.02, 0.06, 0.02)))),
        elbowPole: per(V(-0.4, 0, -1), V(-0.4, -1, 0.5)),
        headBlend: 0.8,
      };
    },
  };
}

/** A long low lunge, right foot forward, left hand down; the right arm goes from the floor (0) to the sky (1). */
function lungeReach(B: Body, k: number): Pose {
  const front = V(0.48, ANKLE_H, 0.14);
  const rear = V(-0.62, ANKLE_H + 0.02, -0.12);
  const hip = V(-0.02, 0.44);
  const sh = torsoAt(B, hip, 62);
  const jR = shJ(B, hip, sh, 1);
  const a = lerp(-75, 95, k);
  const up = add(jR, V(Math.cos(rad(a)) * 0.15, Math.sin(rad(a)) * reach(B) * 0.95, 0.1 + 0.1 * Math.max(0, Math.sin(rad(a)))));
  return {
    hip,
    sh,
    ankle: per(leg(B, hip, -1, rear), leg(B, hip, 1, front)),
    foot: { L: 70, R: 0 },
    kneePole: per(V(0.2, -1, -0.1), V(1, 0.4, 0.2)),
    hand: per(arm(B, hip, sh, -1, V(front[0] - 0.05, 0.04, 0.0), 0.99), arm(B, hip, sh, 1, up, 0.97)),
    elbowPole: per(V(-1, 0, -0.3), V(-0.3, 0, 1)),
    headBlend: 0.3 + 0.5 * k,
  };
}

// ---------- on the floor ----------
const FLOOR_HIP = 0.13;

/** Face down: hips on the floor, chest lifted `lift` degrees on straight-ish arms. */
function cobra(): Motion {
  return {
    phases: HOLD,
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const hip = V(0, FLOOR_HIP);
      const e = lerp(14, 40, d);
      const sh = torsoAt(B, hip, 90 - e);
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(sh[0] - 0.02, 0.04, sgn * (B.shW + 0.08)), 0.99);
      const ankle = (sgn: number) => leg(B, hip, sgn, V(-legMax(B), ANKLE_H + 0.01, sgn * 0.12), 0.98);
      return {
        hip,
        sh,
        ankle: per(ankle(-1), ankle(1)),
        foot: 85,
        kneePole: V(0, -1, 0.1),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(-1, 0, 0.5),
        headBlend: 0.6,
      };
    },
  };
}

/** Face up, head toward -x, hips at the origin. Shoulders lift `curl` degrees off the floor. */
function supine(B: Body, curl = 0) {
  const hip = V(0, FLOOR_HIP);
  return { hip, sh: torsoAt(B, hip, -90 + curl) };
}
const armsOut = (B: Body, hip: Vec, sh: Vec, sgn: number) => arm(B, hip, sh, sgn, V(sh[0] + 0.02, 0.05, sgn * (B.shW + reach(B))), 0.97);
const legLong = (B: Body, hip: Vec, sgn: number) => leg(B, hip, sgn, V(legMax(B), ANKLE_H + 0.01, sgn * 0.12), 0.98);

function kneesToChest(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = supine(B, 6 * d);
      const pole = V(-0.6, 1, 0);
      const ankle = (sgn: number) => leg(B, hip, sgn, V(lerp(0.28, 0.16, d), lerp(0.42, 0.3, d), sgn * 0.1));
      const hand = (sgn: number) => {
        const a = ankle(sgn);
        const k = kneeOf(B, hip, sgn, a, pole);
        return arm(B, hip, sh, sgn, add(lerpV(k, a, 0.3), V(0, 0.04, sgn * 0.04)), 0.99);
      };
      return {
        hip,
        sh,
        ankle: per(ankle(-1), ankle(1)),
        foot: -20,
        kneePole: pole,
        hand: per(hand(-1), hand(1)),
        elbowPole: V(0, -1, 0.6),
        headBlend: 0,
      };
    },
  };
}

function figureFour(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = supine(B, 8);
      const poleL = V(-0.4, 1, 0);
      const ankleL = leg(B, hip, -1, V(lerp(0.45, 0.32, d), lerp(0.32, 0.42, d), -0.1));
      const kneeL = kneeOf(B, hip, -1, ankleL, poleL);
      const ankleR = leg(B, hip, 1, add(kneeL, V(0.02, 0.06, 0.06)));
      const thigh = lerpV(hipJ(B, hip, -1), kneeL, 0.75);
      return {
        hip,
        sh,
        ankle: per(ankleL, ankleR),
        foot: { L: -10, R: -30 },
        kneePole: per(poleL, V(0, 0.2, 1)),
        hand: per(arm(B, hip, sh, -1, add(thigh, V(0, -0.02, -0.06)), 0.99), arm(B, hip, sh, 1, add(thigh, V(0, -0.02, 0.06)), 0.99)),
        elbowPole: V(0, -1, 0.6),
        headBlend: 0,
      };
    },
  };
}

function lyingHamstring(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = supine(B, 10);
      const e = lerp(66, 86, d);
      const hj = hipJ(B, hip, 1);
      const ankleR = add(hj, V(Math.cos(rad(e)) * legMax(B) * 0.97, Math.sin(rad(e)) * legMax(B) * 0.97, 0));
      const grab = lerpV(hj, ankleR, 0.42);
      return {
        hip,
        sh,
        ankle: per(legLong(B, hip, -1), ankleR),
        foot: { L: -80, R: -150 },
        kneePole: V(1, 0.3, 0.1),
        hand: per(arm(B, hip, sh, -1, add(grab, V(0, 0, -0.07)), 0.99), arm(B, hip, sh, 1, add(grab, V(0, 0, 0.07)), 0.99)),
        elbowPole: V(0, -1, 0.6),
        headBlend: 0,
      };
    },
  };
}

function supineTwist(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = supine(B);
      // Both knees fall to the same side (the right), so both poles point right: a single mirrored pole would
      // spread the knees apart, one to each side, which looked like both sides at once (Melvin, 2026-11-17).
      const pole = (sgn: number) => lerpV(V(0, 1, sgn * 0.1), V(0.2, 0.15, 1), d);
      const ankle = (sgn: number) => leg(B, hip, sgn, V(0.38, ANKLE_H + 0.02 + 0.06 * d, sgn * 0.1 + 0.22 * d));
      return {
        hip,
        sh,
        ankle: per(ankle(-1), ankle(1)),
        foot: 0,
        kneePole: per(pole(-1), pole(1)),
        hand: per(armsOut(B, hip, sh, -1), armsOut(B, hip, sh, 1)),
        elbowPole: V(0, 1, 0.2),
        headBlend: 0,
      };
    },
  };
}

/** Sitting on the floor, torso leaning `lean` degrees forward from upright. */
function seatedFloor(B: Body, lean: number) {
  const hip = V(0, 0.14);
  return { hip, sh: torsoAt(B, hip, lean) };
}

function seatedFold(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = seatedFloor(B, lerp(28, 58, d));
      const ankle = (sgn: number) => leg(B, hip, sgn, V(legMax(B), ANKLE_H + 0.01, sgn * 0.1), 0.98);
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(legMax(B) * 0.85, 0.12, sgn * 0.12), 0.99);
      return {
        hip,
        sh,
        ankle: per(ankle(-1), ankle(1)),
        foot: -80,
        kneePole: V(0, 1, 0.1),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(0, -1, 0.5),
        headBlend: 0.2,
      };
    },
  };
}

function straddle(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = seatedFloor(B, lerp(12, 45, d));
      const ankle = (sgn: number) => leg(B, hip, sgn, V(legMax(B) * 0.7, ANKLE_H + 0.01, sgn * legMax(B) * 0.72), 0.98);
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(sh[0] + 0.32, 0.04, sgn * 0.2), 0.99);
      return {
        hip,
        sh,
        ankle: per(ankle(-1), ankle(1)),
        foot: -80,
        kneePole: per(V(0, 1, -0.3), V(0, 1, 0.3)),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(0, -1, 0.5),
        headBlend: 0.4,
      };
    },
  };
}

function butterfly(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = seatedFloor(B, lerp(6, 26, d));
      const ankle = (sgn: number): Vec => V(0.34, ANKLE_H + 0.01, sgn * 0.06);
      const pole = (sgn: number) => V(0.4, lerp(0.6, 0.1, d), sgn * 1);
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(0.36, 0.13, sgn * 0.06), 0.99);
      return {
        hip,
        sh,
        ankle: per(ankle(-1), ankle(1)),
        foot: 0,
        kneePole: per(pole(-1), pole(1)),
        hand: per(hand(-1), hand(1)),
        elbowPole: per(V(0, -0.3, -1), V(0, -0.3, 1)),
        headBlend: 0.6,
      };
    },
  };
}

function pigeon(): Motion {
  return {
    phases: HOLD,
    load: "none",
    stance: 0.1,
    pose(B, d) {
      const hip = V(0, 0.22);
      const sh = torsoAt(B, hip, lerp(18, 62, d));
      const front = leg(B, hip, 1, V(0.3, ANKLE_H + 0.01, -0.18));
      const back = leg(B, hip, -1, V(-legMax(B), ANKLE_H + 0.01, -0.12), 0.98);
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(sh[0] + 0.25, 0.04, sgn * 0.22), 0.99);
      return {
        hip,
        sh,
        ankle: per(back, front),
        foot: { L: 85, R: 30 },
        kneePole: per(V(0, -1, 0), V(0.6, -0.4, 1)),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(-1, 0, 0.4),
        headBlend: 0.6,
      };
    },
  };
}

/** Downward dog: hands and feet on the floor, hips high. `pedal` bends one knee and then the other. */
function downDog(pedal: boolean): Motion {
  return {
    phases: pedal ? loop(2.4) : HOLD,
    load: "none",
    stance: 0.11,
    pose(B, d) {
      const L = legMax(B) * 0.985;
      const dx = 0.5 - (pedal ? 0 : 0.04 * d);
      const ankleX = -dx;
      const hip = V(0, ANKLE_H + Math.sqrt(L * L - dx * dx));
      const chain = B.torso + reach(B) * 0.96;
      const cosL = clamp((0.04 - hip[1]) / chain, -1, 1);
      const sinL = Math.sqrt(1 - cosL * cosL);
      const sh = add(hip, V(sinL * B.torso, cosL * B.torso));
      const handAt = add(hip, V(sinL * chain, cosL * chain));
      const s = pedal ? wave(d) : 0;
      const bend = (sgn: number) => Math.max(0, sgn * s);
      const ankle = (sgn: number): Vec => {
        const b = bend(sgn);
        return leg(B, hip, sgn, V(ankleX + 0.06 * b, ANKLE_H + 0.08 * b, sgn * 0.11));
      };
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(handAt[0], 0.04, sgn * (B.shW + 0.03)), 0.99);
      return {
        hip,
        sh,
        ankle: per(ankle(-1), ankle(1)),
        foot: { L: lerp(-6, 45, bend(-1)), R: lerp(-6, 45, bend(1)) },
        kneePole: V(1, 0, 0.1),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(-1, 0, 0.3),
        headBlend: 0,
      };
    },
  };
}

/** Open book: lying on the left side (built standing and rolled), knees bent, the top arm sweeping open. */
function openBook(): Motion {
  return {
    phases: swingPh(1.8, 1.4),
    load: "none",
    stance: 0.06,
    pose(B, d) {
      const hip = V(0, 1);
      const sh = torsoAt(B, hip, 0);
      const knees = (sgn: number) => leg(B, hip, sgn, add(hipJ(B, hip, sgn), V(0.34, -0.38, -sgn * 0.02 + 0.02)));
      const jR = shJ(B, hip, sh, 1);
      const phi = rad(lerp(0, 175, d));
      const r = reach(B) * 0.94;
      const handR = add(jR, V(Math.cos(phi) * r, -0.04, Math.sin(phi) * r - (1 - Math.cos(phi)) * 0.12));
      const handL = arm(B, hip, sh, -1, add(shJ(B, hip, sh, -1), V(r, -0.04, 0)));
      return {
        hip,
        sh,
        ankle: per(knees(-1), knees(1)),
        kneePole: V(1, 0.2, 0.05),
        hand: per(handL, handR),
        elbowPole: per(V(0, -1, -0.3), V(0, -1, 0.3)),
        headBlend: 1,
      };
    },
    roll: () => -90,
  };
}

// ---------- added 2026-11-26 (Melvin picked them from a gap review of the library) ----------
/** 90/90 hip switches: sitting with both knees bent and the feet wide, the knees sweep from one side to the other together. */
function hip9090(): Motion {
  return {
    phases: swingPh(1.3),
    load: "none",
    pose(B, d) {
      const { hip, sh } = seatedFloor(B, -14);
      // Both knees fall the same way, so both poles point the same way (as in the lying twist).
      const z = lerp(-1, 1, d);
      const pole = V(0.25, 0.25 + 0.6 * (1 - Math.abs(z)), z);
      const ankle = (sgn: number) => leg(B, hip, sgn, V(0.36, ANKLE_H + 0.01, sgn * 0.3));
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(hip[0] - 0.24, 0.04, sgn * 0.24), 0.99);
      return {
        hip,
        sh,
        ankle: per(ankle(-1), ankle(1)),
        foot: 10,
        kneePole: per(pole, pole),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(-1, 0, 0.3),
        headBlend: 0.9,
      };
    },
  };
}

/** Standing hip circles: the right knee lifts in front, opens out to the side and comes back down. */
function hipCircles(): Motion {
  return {
    phases: loop(2.6),
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B, 4);
      const hj = hipJ(B, hip, 1);
      const th = d * Math.PI * 2;
      const up = 0.5 - 0.5 * Math.cos(th); // 0 down, 1 at the top of the circle
      const out = Math.max(0, Math.sin(th * 0.5)) ** 2; // opens out to the side through the second half
      const ankleR = leg(B, hip, 1, add(hj, V(lerp(0.02, 0.24, up) - 0.12 * out * up, lerp(-0.86, -0.4, up), 0.02 + 0.22 * out * up)));
      const pole = lerpV(V(1, 0.2, 0.1), V(0.2, 0.2, 1), out);
      return {
        hip,
        sh,
        ankle: per(V(0.02, ANKLE_H, -0.1), ankleR),
        foot: { L: 0, R: 20 * up },
        kneePole: per(V(1, 0, -0.2), pole),
        hand: per(onHips(B, hip, -1), onHips(B, hip, 1)),
        elbowPole: per(V(-0.6, 0.4, -1), V(-0.6, 0.4, 1)),
        headBlend: 1,
      };
    },
  };
}

/** Band pass-throughs: straight arms, a wide grip on a band, from in front of the hips over the head to behind. */
function passThroughs(): Motion {
  return {
    phases: swingPh(1.6, 1.4),
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B);
      const a = lerp(12, 300, d);
      const r = reach(B) * 0.9;
      const hand = (sgn: number) => {
        const j = shJ(B, hip, sh, sgn);
        return arm(B, hip, sh, sgn, add(j, V(Math.sin(rad(a)) * r, -Math.cos(rad(a)) * r, sgn * 0.34)));
      };
      return {
        hip,
        sh,
        ankle: feet(),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(-0.3, -1, 0.8),
        headBlend: 1,
      };
    },
    props: () => [{ kind: "cable", from: "handL", to: "handR" }],
  };
}

/** Chin tucks: standing tall, the head glides straight back (a double chin), two fingers on the chin. */
function chinTucks(): Motion {
  return {
    phases: [
      [0.8, 0, 1, "", 0.6],
      [1, 1, 1, "", 0.6],
      [0.8, 1, 0, "", 0.5],
    ],
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B);
      const back = -0.035 * d;
      const chin = V(sh[0] + 0.1 + back, sh[1] + B.neck + 0.06, 0.02);
      return {
        hip,
        sh,
        ankle: feet(),
        hand: per(hangL(B, hip, sh, -1), arm(B, hip, sh, 1, chin)),
        elbowPole: per(V(-1, 0, -0.4), V(0, -1, 0.6)),
        headBlend: 1,
        headBack: back,
      };
    },
  };
}

/** Couch stretch: the left knee down by a wall with the shin up it, the right foot forward, hips pushing forward. */
function couchStretch(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const knee = V(-0.2, 0.06, -0.11);
      const hip0 = kneelHip(B, V(knee[0], knee[1]), lerp(-8, -20, d));
      const hip = V(hip0[0], hip0[1]);
      const sh = torsoAt(B, hip, lerp(10, -2, d));
      const ankleL = V(knee[0] - 0.07, knee[1] + B.shin * 0.94, -0.11);
      const ankleR = V(0.42, ANKLE_H, 0.12);
      const kneeR = kneeOf(B, hip, 1, ankleR, V(1, 0.3, 0.15));
      const onKnee = (sgn: number) => arm(B, hip, sh, sgn, add(kneeR, V(0.02, 0.05, sgn * 0.05 - 0.02)));
      return {
        hip,
        sh,
        ankle: per(leg(B, hip, -1, ankleL), ankleR),
        foot: { L: -95, R: 0 },
        kneePole: per(V(0.2, -1, -0.1), V(1, 0.3, 0.15)),
        hand: per(onKnee(-1), onKnee(1)),
        elbowPole: per(V(-0.4, -0.6, -1), V(-0.4, -0.6, 1)),
        headBlend: 1,
      };
    },
    props: () => [{ kind: "box", at: V(-0.33, 1, 0), size: V(0.06, 2, 1.2) }],
  };
}

/** Frog stretch: on the forearms, knees wide, shins behind the knees, the hips easing back. */
function frog(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const kz = B.hipW + B.thigh * 0.86;
      const hipY = 0.06 + Math.sqrt(Math.max(0.01, B.thigh ** 2 - (kz - B.hipW) ** 2)) * 0.98;
      const hip = V(lerp(0.02, -0.06, d), hipY);
      const shY = B.upper + 0.06;
      const pitch = Math.asin(clamp((hip[1] - shY) / B.torso, -1, 1)) * (180 / Math.PI);
      const sh = torsoAt(B, hip, 90 + pitch);
      const ankle = (sgn: number) => leg(B, hip, sgn, V(hip[0] - B.shin * 0.9, ANKLE_H + 0.01, sgn * kz));
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(sh[0] + B.fore * 0.95, 0.04, sgn * 0.16), 0.99);
      return {
        hip,
        sh,
        ankle: per(ankle(-1), ankle(1)),
        foot: 75,
        kneePole: per(V(0.1, -0.4, -1), V(0.1, -0.4, 1)),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(0, -1, 0.3),
        headBlend: 0,
      };
    },
  };
}

/** Sleeper stretch: lying on the left side (built standing and rolled), the left arm out in front with the elbow bent,
 * the right hand easing the left forearm down toward the floor. */
function sleeper(): Motion {
  return {
    phases: HOLD,
    load: "none",
    stance: 0.06,
    pose(B, d) {
      const hip = V(0, 1);
      const sh = torsoAt(B, hip, 0);
      const knees = (sgn: number) => leg(B, hip, sgn, add(hipJ(B, hip, sgn), V(0.34, -0.38, -sgn * 0.02 + 0.02)));
      const jL = shJ(B, hip, sh, -1);
      const elbow = add(jL, V(B.upper * 0.98, 0, 0));
      const phi = rad(lerp(5, 55, d));
      const handL = add(elbow, V(0, -Math.sin(phi) * B.fore * 0.98, Math.cos(phi) * B.fore * 0.98));
      const handR = arm(B, hip, sh, 1, add(handL, V(-0.02, 0.03, 0.06)), 0.98);
      return {
        hip,
        sh,
        ankle: per(knees(-1), knees(1)),
        kneePole: V(1, 0.2, 0.05),
        hand: per(handL, handR),
        elbowPole: per(V(1, 0, -0.2), V(0.2, -1, 0.3)),
        headBlend: 1,
      };
    },
    roll: () => -90,
  };
}

/** Standing side bend: the right arm reaches up and over, the body bends to the left, the left hand on the hip. */
function sideBendStretch(): Motion {
  return {
    phases: HOLD,
    load: "none",
    stance: 0.14,
    pose(B, d) {
      const b = rad(-lerp(4, 22, d));
      const hip = V(0.02, standY(B, 0.03, 0.99), -Math.sin(b) * 0.05);
      const sh = add(hip, V(0, Math.cos(b) * B.torso, Math.sin(b) * B.torso));
      const b2 = b * 1.7;
      const jR = add(sh, V(0, 0, B.shW));
      const handR = arm(B, hip, sh, 1, add(jR, V(0.02, Math.cos(b2) * reach(B), Math.sin(b2) * reach(B))), 0.95);
      return {
        hip,
        sh,
        ankle: per(V(0.03, ANKLE_H, -0.14), V(0.03, ANKLE_H, 0.14)),
        kneePole: V(1, 0, 0.4),
        hand: per(onHips(B, hip, -1), handR),
        elbowPole: per(V(-0.6, 0.4, -1), V(-0.2, 0.3, 1)),
        headBlend: 0.6,
      };
    },
  };
}

/** Chin-to-armpit neck stretch: the head turns and drops toward the left armpit, the left hand resting on the back of the head. */
function neckLevator(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B);
      const jR = shJ(B, hip, sh, 1);
      const handR = add(jR, V(0.02, -reach(B) * 0.97, 0.06 + 0.02 * d));
      const handL = arm(B, hip, sh, -1, V(sh[0] - 0.02 + 0.04 * d, sh[1] + B.neck + 0.16 - 0.03 * d, -0.04));
      return {
        hip,
        sh,
        shrug: -0.02 * d,
        ankle: feet(),
        hand: per(handL, handR),
        elbowPole: per(V(0.4, 0.4, -1), V(-1, 0, 0.4)),
        headBlend: 1,
        headTilt: -0.035 * d,
        headBack: 0.05 * d,
      };
    },
  };
}

/** Wrist extensor stretch: the right arm straight out, palm down, the left hand easing the back of the hand down. */
function wristExtensor(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const { hip, sh } = upright(B);
      const jR = shJ(B, hip, sh, 1);
      const handR = add(jR, V(reach(B) * 0.9, -0.02, -0.08));
      const handL = arm(B, hip, sh, -1, add(handR, V(0.06, -0.03 - 0.02 * d, -0.04)), 0.98);
      return { hip, sh, ankle: feet(), hand: per(handL, handR), elbowPole: per(V(0, -1, -0.5), V(0, -1, 0.3)), headBlend: 1 };
    },
  };
}

/** Bent-knee calf stretch (the soleus): like the wall calf stretch with the feet closer and the back knee bending toward the floor. */
function soleus(): Motion {
  return {
    phases: HOLD,
    load: "none",
    pose(B, d) {
      const rear = V(-0.18, ANKLE_H, -0.1);
      const hx = lerp(-0.07, -0.03, d);
      const hy = ANKLE_H + Math.sqrt(Math.max(0.01, (legMax(B) * lerp(0.93, 0.8, d)) ** 2 - (hx - rear[0]) ** 2));
      const hip = V(hx, hy);
      const sh = torsoAt(B, hip, lerp(10, 16, d));
      const wallX = 0.7;
      const hand = (sgn: number) => arm(B, hip, sh, sgn, V(wallX - 0.04, sh[1] + 0.02, sgn * 0.22), 0.97);
      return {
        hip,
        sh,
        ankle: per(rear, V(0.3, ANKLE_H, 0.11)),
        kneePole: per(V(1, 0, -0.1), V(1, 0, 0.2)),
        hand: per(hand(-1), hand(1)),
        elbowPole: V(0, -1, 0.6),
        headBlend: 0.9,
      };
    },
    props: () => [{ kind: "box", at: V(0.72, 1, 0), size: V(0.06, 2, 1.2) }],
  };
}

// ---------- the library ----------
/** Ids are the stretch ids (src/lib/stretches.ts). An exercise id in `REUSE` borrows that exercise's motion. */
const MOTIONS: Record<string, () => Motion> = {
  march: () => march(),
  jacks,
  rower: () => march(),
  "arm-circles": armCircles,
  "scap-pushups": scapPushUp,
  inchworm: () => foldToPlank(0, 1, swingPh(2.2, 1.8)),
  "t-spine": openBook,
  "cat-cow": catCow,
  wrist: wristRocks,
  "leg-swings": legSwings,
  "worlds-greatest": () => ({
    phases: [
      [1.2, 0, 0, "", 0.5],
      [1.4, 0, 1, "", 0.8],
      [0.8, 1, 1, "", 0.7],
      [1.2, 1, 0, "", 0.6],
    ],
    load: "none",
    pose: lungeReach,
  }),
  "hip-hinge": hipHinge,
  "ankle-rocks": ankleRocks,
  "shoulder-rolls": shoulderRolls,
  "arm-swings": armSwings,
  "knee-hug": kneeHug,
  "toy-soldier": toySoldier,
  "butt-kicks": () => march({ kick: true }),
  "dog-pedal": () => downDog(true),
  "doorway-chest": doorwayChest,
  "cross-body": crossBody,
  "overhead-triceps": overheadTriceps,
  "behind-back": behindBack,
  "wrist-flexor": wristFlexor,
  "neck-side": neckSide,
  "kneeling-lat": kneelingLat,
  "childs-pose": childsPose,
  "thread-needle": threadNeedle,
  cobra,
  "supine-twist": supineTwist,
  "knees-to-chest": kneesToChest,
  "figure-four": figureFour,
  pigeon,
  "standing-quad": standingQuad,
  "kneeling-hip-flexor": kneelingHipFlexor,
  "forward-fold": forwardFold,
  "seated-fold": seatedFold,
  "lying-hamstring": lyingHamstring,
  butterfly,
  straddle,
  "wall-calf": wallCalf,
  "down-dog": () => downDog(false),
  "hip-90-90": hip9090,
  "hip-circles": hipCircles,
  "pass-throughs": passThroughs,
  "chin-tucks": chinTucks,
  "couch-stretch": couchStretch,
  frog,
  sleeper,
  "side-bend": sideBendStretch,
  "neck-levator": neckLevator,
  "wrist-extensor": wristExtensor,
  soleus,
};

/** Warm-up drills that are the same movement as an exercise in the library. */
const REUSE: Record<string, string> = {
  "pull-aparts": "band-pull-apart",
  "dead-hang": "scapular-pull",
  "bw-squat": "bodyweight-squat",
  "glute-bridge": "glute-bridge",
  "dead-bug": "dead-bug",
  "lateral-lunge": "cossack-squat",
  "wall-slides": "wall-slide",
  "deep-squat": "deep-squat-hold",
};

const PREFIX = "stretch:";
const cache = new Map<string, Motion>();

/**
 * The side each one-side stretch's motion is drawn on: the side being stretched or worked (the right arm across
 * the chest, the right leg in pigeon, the knees falling to the right in the lying twist). Most are drawn on the
 * right; these on the left. The player mirrors the motion for the other side, so "Left side" shows the left
 * (Melvin, 2026-11-17). Borrowed exercise motions (dead bug, the lateral lunge) already go both ways in one rep.
 */
const DRAWN_LEFT = new Set(["wall-calf", "kneeling-hip-flexor", "couch-stretch", "sleeper", "soleus"]);
export const drawnSide = (id: string): Side => (DRAWN_LEFT.has(id) ? "L" : "R");

const flipZ = (v: Vec): Vec => V(v[0], v[1], -v[2]);
/** A per-side value mirrored left to right: each side takes the other's value with z flipped. A shared value is already symmetric. */
function mirrorPer(v: PerSide<Vec> | undefined): PerSide<Vec> | undefined {
  if (v === undefined || !("L" in (v as object))) return v;
  const p = v as { L: Vec; R: Vec };
  return { L: flipZ(p.R), R: flipZ(p.L) };
}
const SWAP: Partial<Record<string, Anchor>> = {
  handL: "handR",
  handR: "handL",
  ankleL: "ankleR",
  ankleR: "ankleL",
  kneeL: "kneeR",
  kneeR: "kneeL",
};
const mirrorAnchor = (a: Anchor): Anchor => (typeof a === "string" ? (SWAP[a] ?? a) : flipZ(a));
function mirrorProp(p: Prop): Prop {
  switch (p.kind) {
    case "box":
      return { ...p, at: flipZ(p.at), follow: p.follow && mirrorAnchor(p.follow) };
    case "rail":
      return { ...p, at: flipZ(p.at) };
    case "cable":
    case "pole":
      return { ...p, from: mirrorAnchor(p.from), to: mirrorAnchor(p.to) };
    case "rope":
      return { ...p, from: mirrorAnchor(p.from), to: flipZ(p.to), centre: flipZ(p.centre) };
  }
}
/** The same motion done on the other side: every left joint does what the right did, mirrored. */
export function mirrorMotion(m: Motion): Motion {
  const { roll, yaw, props } = m;
  return {
    ...m,
    pose(B, d) {
      const p = m.pose(B, d);
      const foot = p.foot;
      return {
        ...p,
        hip: flipZ(p.hip),
        sh: flipZ(p.sh),
        hand: mirrorPer(p.hand)!,
        ankle: mirrorPer(p.ankle),
        kneePole: mirrorPer(p.kneePole),
        elbowPole: mirrorPer(p.elbowPole),
        foot: foot !== undefined && typeof foot === "object" ? { L: foot.R, R: foot.L } : foot,
        headTilt: p.headTilt && -p.headTilt,
        bar: p.bar && flipZ(p.bar),
      };
    },
    hold: m.hold === "R" ? undefined : m.hold,
    roll: roll && ((d) => -roll(d)),
    yaw: yaw && ((d) => -yaw(d)),
    props: props && ((B) => props(B).map(mirrorProp)),
  };
}

/** The motion for a demo id like "stretch:pigeon" (or "stretch:pigeon@L" for one side), or null when it isn't a stretch. */
export function stretchMotion(demoId?: string | null): Motion | null {
  if (!demoId?.startsWith(PREFIX)) return null;
  const [id = "", side] = demoId.slice(PREFIX.length).split("@");
  if (REUSE[id]) return motionFor(REUSE[id]);
  const make = MOTIONS[id];
  if (!make) return motionFor(null);
  const flip = (side === "L" || side === "R") && side !== drawnSide(id);
  const key = flip ? `${id}@mirror` : id;
  let m = cache.get(key);
  if (!m) {
    m = flip ? mirrorMotion(make()) : make();
    cache.set(key, m);
  }
  return m;
}

// Moves that happen front to back read best from the side; the rest keep the demo's three-quarter view.
const SIDE_ON = new Set([
  "inchworm",
  "cat-cow",
  "hip-hinge",
  "toy-soldier",
  "dog-pedal",
  "down-dog",
  "kneeling-lat",
  "childs-pose",
  "cobra",
  "knees-to-chest",
  "figure-four",
  "lying-hamstring",
  "seated-fold",
  "forward-fold",
  "kneeling-hip-flexor",
  "couch-stretch",
  "frog",
  "soleus",
]);
/** The camera view for a stretch's demo: "side" for moves that read best in profile. */
export const stretchView = (id: string): "side" | undefined => (SIDE_ON.has(id) ? "side" : undefined);

/** Stretch ids with a motion of their own (not borrowed from an exercise). */
export const OWN_MOTIONS: readonly string[] = Object.keys(MOTIONS);
export const hasStretchMotion = (id: string) => id in MOTIONS || id in REUSE;
