import { exercise } from "./exercises";
import { alternatives, injuredTarget, type PlanItem } from "./generator";
import type { Injury } from "./injury";
import type { PickWeights } from "./pickWeights";
import type { BodyMode } from "./pregnancy";
import { busyEquipment } from "./replan";
import type { Target } from "./progression";
import type { Equipment, Gym } from "./types";

// "Machine taken" (Melvin picked it, 2026-11-26, watch ideas 2): one tap, on the watch or the phone, swaps the
// exercise on screen for the best one that doesn't need the busy equipment. The phone works it out the same way
// everywhere (the watch only shows the name and sends the tap), so the watch, the phone and the web never disagree.

/** How many of the best muscle matches the pick weights choose between. */
export const TAKEN_SHORTLIST = 4;

/** What someone else could be using for this exercise: its benches, racks and machines, else all it needs. */
export function takenEquipment(exerciseId: string): Equipment[] {
  const busy = busyEquipment(exerciseId);
  return busy.length ? busy : [...exercise(exerciseId).needs];
}

/**
 * The swaps when the equipment is taken, best first: the same main muscles at this gym without the busy equipment
 * (alternatives: injuries and pregnancy respected, nothing already in the workout). Of the best TAKEN_SHORTLIST
 * matches, the one the adaptive plan would pick most often (pick weights: staples, stars, swaps) goes first, so a
 * favourite or a familiar lift wins over an odd one that happens to share one more muscle.
 */
export function takenSwaps(
  exerciseId: string,
  gym: Gym,
  skip: readonly string[],
  hurt: readonly Injury[],
  mode: BodyMode | null,
  weights: Pick<PickWeights, "weight">,
): string[] {
  const busy = takenEquipment(exerciseId);
  if (!busy.length) return [];
  const free = { ...gym, equipment: gym.equipment.filter((e) => !busy.includes(e)) };
  const list = alternatives(exerciseId, free, skip, hurt, mode)
    .filter((e) => !e.needs.some((n) => busy.includes(n)))
    .map((e) => e.id);
  const short = list.slice(0, TAKEN_SHORTLIST);
  const best = short.reduce<string | undefined>((b, id) => (b === undefined || weights.weight(id) > weights.weight(b) ? id : b), undefined);
  return best === undefined ? [] : [best, ...list.filter((id) => id !== best)];
}

/** The one-tap pick for the item on screen, or null when nothing fits (bodyweight work, or no free equipment). */
export function takenPick(
  item: PlanItem | undefined,
  planIds: readonly string[],
  gym: Gym,
  hurt: readonly Injury[],
  mode: BodyMode | null,
  weights: Pick<PickWeights, "weight">,
): string | null {
  // A stretch, rehab or cardio part isn't on shared equipment worth waiting for; a timed or cardio item has no swap here.
  if (!item || item.part || exercise(item.exerciseId).cardio) return null;
  return takenSwaps(item.exerciseId, gym, planIds, hurt, mode, weights)[0] ?? null;
}

/** The weight and reps the pick would start at, the same way a swap works it out. */
export function takenTarget(toId: string, base: Target, hurt: readonly Injury[], gym: Gym, mode: BodyMode | null): Target {
  return injuredTarget(exercise(toId), base, hurt, gym, mode).target;
}
