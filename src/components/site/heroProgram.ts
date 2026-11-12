// The home page hero's script and the maths it shows, kept apart from HeroLift.tsx (a client component) so the
// server page can read it too, and free of the language catalogues so the home page doesn't load them.
import type { View } from "@/components/demo/engine";
import { add, cross, lerpV, mul, norm, sub, type BodyKey, type Joints, type Vec } from "@/lib/demo/rig";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import type { Muscle } from "@/lib/types";

interface Step {
  id: string;
  body: BodyKey;
  kg: number;
  reps: number;
  view: View;
}
export const HERO_PROGRAM: Step[] = [
  { id: "back-squat", body: "male", kg: 100, reps: 5, view: "three" },
  { id: "deadlift", body: "female", kg: 100, reps: 5, view: "side" },
  { id: "bench-press", body: "male", kg: 80, reps: 5, view: "three" },
  { id: "overhead-press", body: "female", kg: 35, reps: 5, view: "three" },
];

/** The muscles to label: the primary ones first, then secondary, at most four. */
export function labelled(id: string): Muscle[] {
  const e = EXERCISE_BY_ID.get(id);
  return e ? [...e.primary, ...e.secondary].slice(0, 4) : [];
}

export const epley = (kg: number, reps: number) => (reps <= 0 ? 0 : kg * (1 + reps / 30));

/** A point on the body for each muscle's label, in the figure's frame (x forward, y up, z to the right). */
export function muscleAnchor(m: Muscle, J: Joints): Vec {
  const up = norm(sub(J.shC, J.hipC));
  const fwd = norm(cross(up, [0, 0, 1])); // the chest's facing direction
  const torso = (t: number, f: number, z = 0): Vec => add(add(lerpV(J.hipC, J.shC, t), mul(fwd, f)), [0, 0, z]);
  const limb = (a: Vec, b: Vec, t: number, f: number, z = 0): Vec => {
    const front = mul(norm(cross(norm(sub(b, a)), [0, 0, 1])), -1);
    return add(add(lerpV(a, b, t), mul(front, f)), [0, 0, z]);
  };
  switch (m) {
    case "quads":
      return limb(J.hipR, J.kneeR, 0.45, 0.07);
    case "hamstrings":
      return limb(J.hipR, J.kneeR, 0.45, -0.07);
    case "adductors":
      return limb(J.hipR, J.kneeR, 0.3, 0, -0.06);
    case "calves":
      return limb(J.kneeR, J.ankleR, 0.3, -0.05);
    case "glutes":
      return torso(-0.04, -0.13, 0.06);
    case "lowerBack":
      return torso(0.3, -0.11);
    case "upperBack":
      return torso(0.75, -0.12);
    case "lats":
      return torso(0.62, -0.05, 0.13);
    case "traps":
      return add(lerpV(J.shC, J.neck, 0.6), mul(fwd, -0.03));
    case "chest":
      return torso(0.78, 0.12, 0.06);
    case "abs":
      return torso(0.45, 0.11);
    case "obliques":
      return torso(0.42, 0.05, 0.13);
    case "frontDelts":
      return add(J.shR, mul(fwd, 0.04));
    case "sideDelts":
      return add(J.shR, [0, 0, 0.05]);
    case "rearDelts":
      return add(J.shR, mul(fwd, -0.04));
    case "biceps":
      return limb(J.shR, J.elbowR, 0.55, 0.04);
    case "triceps":
      return limb(J.shR, J.elbowR, 0.55, -0.04);
    case "forearms":
      return lerpV(J.elbowR, J.handR, 0.5);
  }
}

/** The lifts the home page's 3D demo picker offers. Here rather than in the client DemoPicker, so the server can read it. */
export const DEMO_LIFTS = ["back-squat", "deadlift", "bench-press", "overhead-press", "pull-up", "romanian-deadlift"].filter((id) =>
  EXERCISE_BY_ID.has(id),
);
