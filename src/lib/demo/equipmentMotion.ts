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
import type { Anchor, Body, Hold, Load, Pose, Prop, Vec } from "./rig";

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

export function withGear(exerciseId: string, m: Motion): Motion {
  const e = EXERCISE_BY_ID.get(exerciseId);
  if (!e || e.custom) return m;
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
