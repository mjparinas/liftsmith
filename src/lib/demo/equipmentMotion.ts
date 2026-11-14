// The gear an exercise uses, drawn on the demo. The 1,000 moves share a few dozen pose families,
// so a dumbbell version, a band version and a Smith machine version of a lift often borrowed one
// motion and looked exactly alike, and a swap from one to the other seemed to do nothing (Melvin,
// 2026-11-12: "different exercises with the same animations"). This layer reads the exercise's own
// equipment (`needs`) and puts it in the figure's hands and around it: the weight it holds (a
// barbell on the back, dumbbells, a kettlebell, a medicine ball, or nothing for a bodyweight move),
// bands from the feet, ring straps from overhead and Smith machine rails. The pose itself is the
// family's; only what's held and what's around it change.
import { EXERCISE_BY_ID } from "../exercises";
import { implementsFor, perSide } from "../sides";
import type { Equipment, Exercise } from "../types";
import type { Motion } from "./motions";
import { BODIES, type Anchor, type Body, type Hold, type Load, type Pose, type Prop, type Vec } from "./rig";

const WEIGHTS: Equipment[] = ["barbell", "ezBar", "trapBar", "dumbbells", "kettlebells", "medicineBall"];
const PULLS: Equipment[] = ["cable", "latPulldown", "seatedRow"];
const HAND_LOADS: Load[] = ["barbell", "dumbbell", "kettlebell", "ball", "handle", "none"];

const cable = (from: Anchor, to: Anchor): Prop => ({ kind: "cable", from, to });
const rail = (at: Vec, length: number): Prop => ({ kind: "rail", at, length, axis: "y" });

/** The weight the exercise holds in its hands, from its equipment. */
function heldLoad(e: Exercise): Load | undefined {
  const has = (q: Equipment) => e.needs.includes(q);
  if (has("medicineBall")) return "ball";
  if (has("kettlebells") && !has("dumbbells")) return "kettlebell";
  if (has("dumbbells") && !has("barbell")) return "dumbbell";
  if (has("barbell") || has("ezBar") || has("smith")) return "barbell";
  return undefined;
}

/** Hand positions of a pose, both sides (a single Vec is mirrored, its z the half grip). */
function handsOf(p: Pose, grip: number): [Vec, Vec] {
  const h = p.hand;
  if (Array.isArray(h)) {
    const z = Math.abs(h[2]) || grip;
    return [
      [h[0], h[1], -z],
      [h[0], h[1], z],
    ];
  }
  return [h.L, h.R];
}

/**
 * A landmine move: the hands hold the end of a bar whose other end pivots on the floor ahead, so it
 * draws that bar (a `pole`) instead of a level barbell or a handle, the hands close together on it.
 */
function landmine(m: Motion): Motion {
  const oneHand = m.hold === "R";
  const pose: Motion["pose"] = (B, d) => {
    const p = m.pose(B, d);
    const h = p.hand;
    return { ...p, bar: undefined, hand: Array.isArray(h) ? [h[0], h[1], 0.06] : h };
  };
  return {
    ...m,
    load: "none",
    grip: 0.06,
    pose,
    props: (B) => {
      const [l, r] = handsOf(pose(B, 0), 0.06);
      const x = Math.max(l[0], r[0]);
      const pole: Prop = { kind: "pole", from: [x + 1.4, 0.03, 0], to: oneHand ? "handR" : "hands", past: 0.08 };
      return [...(m.props?.(B) ?? []).filter((q) => q.kind !== "cable"), pole];
    },
  };
}

const hasCableLine = (m: Motion) => {
  const B = BODIES.male;
  return (m.props?.(B) ?? []).some((p) => p.kind === "cable");
};

/** Cables from a pulley to the hands: the pulley sits beyond where the hardest phase starts, along the line it moves. */
function pulleyCables(id: string, m: Motion, pose: Motion["pose"], B: Body, hold: Hold | undefined, load: Load): Prop[] {
  const work = m.phases.reduce((a, p) => (p[4] > a[4] && p[1] !== p[2] ? p : a), m.phases[0]!);
  const grip = m.grip ?? 0.25;
  const [s0, s1] = handsOf(pose(B, work[1]), grip);
  const [c0, c1] = handsOf(pose(B, work[2]), grip);
  const p0 = pose(B, work[1]);
  const standing = Math.max(p0.sh[1], pose(B, work[2]).sh[1]) > 1.2;
  if (/reverse-crunch/.test(id)) {
    // an ankle strap from a low pulley beyond the feet
    const a = p0.ankle;
    const x = a ? (Array.isArray(a) ? a[0] : a.R[0]) : p0.hip[0] + 0.8;
    return [cable([x + 0.7, 0.1, 0], "ankles")];
  }
  if (/dead-bug/.test(id)) {
    // from a low pulley behind the head, held over the chest
    const back = p0.sh[0] < p0.hip[0] ? -1 : 1;
    return [cable([p0.sh[0] + back * 0.9, 0.12, 0], "hands")];
  }
  const pulley = (s: Vec, c: Vec): Vec => {
    const d: Vec = [s[0] - c[0], s[1] - c[1], s[2] - c[2]];
    const l = Math.hypot(d[0], d[1], d[2]);
    // hands that barely move (split squats, holds): a low pulley just ahead
    if (l < 0.12) return [s[0] + 0.7, 0.06, s[2]];
    const k = 0.9 / l;
    const y = Math.min(2.3, Math.max(0.06, s[1] + d[1] * k));
    // standing with the hands pulled straight down: the low pulley stands a step ahead, not underfoot
    const ahead = standing && y < 0.1 && Math.abs(d[0]) < Math.abs(d[1]) * 0.5 ? Math.max(s[0] + d[0] * k, s[0] + 0.6) : s[0] + d[0] * k;
    return [ahead, y, s[2] + d[2] * k * 0.3];
  };
  if (hold === "centre" || (load === "handle" && grip < 0.1)) {
    const s: Vec = [(s0[0] + s1[0]) / 2, (s0[1] + s1[1]) / 2, 0];
    const c: Vec = [(c0[0] + c1[0]) / 2, (c0[1] + c1[1]) / 2, 0];
    return [cable(pulley(s, c), "hands")];
  }
  if (hold === "R") return [cable(pulley(s1, c1), "handR")];
  return [cable(pulley(s0, c0), "handL"), cable(pulley(s1, c1), "handR")];
}

export function withGear(exerciseId: string, m: Motion): Motion {
  const e = EXERCISE_BY_ID.get(exerciseId);
  if (!e || e.custom) return m;
  if (/(^|-)landmine-/.test(exerciseId)) return landmine(m);
  const has = (q: Equipment) => e.needs.includes(q);
  let load = m.load;
  let hold: Hold | undefined = m.hold;
  let pose = m.pose;
  const extra: ((B: Body) => Prop[])[] = [];
  let dropCables = false;
  const grip = m.grip ?? 0.25;

  const want = heldLoad(e);
  const bands = has("bands") && !PULLS.some(has);
  const bodyweight = !WEIGHTS.some(has) && !PULLS.some(has) && !has("bands") && !has("smith");

  if (want && want !== load && HAND_LOADS.includes(load)) {
    if (want === "barbell") {
      // a bodyweight family with a bar: racked across the upper back, hands on it
      if (load === "none" && (e.pattern === "squat" || e.pattern === "lunge" || /calf|step-up|jump/.test(e.id))) {
        const base = pose;
        pose = (B, d) => {
          const p = base(B, d);
          const bar: Vec = [p.sh[0] - 0.03, p.sh[1] - 0.03, 0];
          return { ...p, bar, hand: bar, elbowPole: [-1, -0.7, 0] };
        };
        load = "barbell";
        hold = undefined;
      }
    } else {
      if (load === "handle") dropCables = true;
      load = want;
      if (want === "ball") hold = "centre";
      else if (m.load === "none" || m.load === "barbell" || m.load === "handle")
        hold =
          want === "dumbbell" && implementsFor(e) === 2
            ? "each"
            : perSide(e.id)
              ? "R"
              : want === "kettlebell"
                ? "centre"
                : (hold ?? "each");
    }
  } else if (bodyweight && (load === "barbell" || load === "dumbbell" || load === "kettlebell" || load === "trapbar")) {
    // a bodyweight move holds nothing
    load = "none";
  }

  if (bands) {
    // a band has no bar or handle between the hands
    if (load === "barbell" || load === "dumbbell" || load === "kettlebell" || load === "handle") load = "none";
    const hasCable = (B: Body) => (m.props?.(B) ?? []).some((p) => p.kind === "cable");
    // one band per working hand: a one-arm move's resting hand holds none
    const oneHand = hold === "R";
    // a band for a press wraps around the upper back from hand to hand; other bands run from under the feet
    const from =
      e.pattern === "hpush" && !exerciseId.includes("dip") ? (["upperBack", "upperBack"] as const) : (["ankleL", "ankleR"] as const);
    extra.push((B) => (hasCable(B) ? [] : oneHand ? [cable(from[1], "handR")] : [cable(from[0], "handL"), cable(from[1], "handR")]));
  }
  if (has("cable") && !hasCableLine(m)) {
    // a cable move whose motion draws no cable: run one from a pulley in line with the pull, behind
    // where the working rep starts (so it pulls the hands back the way they came)
    extra.push((B) => pulleyCables(exerciseId, m, pose, B, hold, load));
  }
  if (has("rings")) {
    // straps from overhead to each hand, where the hands start (unless the motion draws its own straps)
    const ownStraps = (B: Body) => (m.props?.(B) ?? []).some((p) => p.kind === "cable");
    extra.push((B) =>
      ownStraps(B) ? [] : handsOf(pose(B, 0), grip).map((h, i) => cable([h[0], Math.max(2.4, h[1] + 0.9), h[2]], i ? "handR" : "handL")),
    );
  }
  if (has("smith")) {
    // two upright rails either side of the bar's path
    extra.push((B) => {
      if (load !== "barbell") return [];
      if ((m.props?.(B) ?? []).some((p) => p.kind === "rail")) return [];
      let x = 0,
        n = 0;
      for (let d = 0; d <= 1; d += 0.25) {
        const b = pose(B, d).bar;
        if (b) {
          x += b[0];
          n++;
        }
      }
      return n ? [rail([x / n, 1.15, 0.62], 2.3), rail([x / n, 1.15, -0.62], 2.3)] : [];
    });
  }

  if (load === m.load && hold === m.hold && pose === m.pose && !extra.length && !dropCables) return m;
  const base = m.props;
  return {
    ...m,
    load,
    hold,
    pose,
    props:
      base || extra.length
        ? (B) => [...(base?.(B) ?? []).filter((p) => !(dropCables && p.kind === "cable")), ...extra.flatMap((f) => f(B))]
        : undefined,
  };
}
