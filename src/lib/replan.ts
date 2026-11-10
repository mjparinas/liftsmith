import { exercise } from "./exercises";
import { setSeconds, type PlanItem } from "./generator";
import type { Equipment } from "./types";

// Changing the plan mid-workout (Melvin picked it, 2026-11-09). Other apps plan before you start and
// leave you on your own once you're in the gym. Here the lifter can say "I've only got 15 minutes
// left" or "that bench is taken", and the rest of the session is rebuilt around it while keeping the
// sets that matter most: big lifts first, isolation and core work give way first.

/** How much a planned exercise matters when time runs short (higher is kept longer). */
export function priority(item: PlanItem, position: number): number {
  const ex = exercise(item.exerciseId);
  const kind = ex.pattern === "core" || ex.pattern === "carry" ? 0 : ex.compound ? (ex.load === "bodyweight" ? 2 : 3) : 1;
  return kind * 10 - position * 0.1;
}

/** Seconds the rest of the session needs from here, counting only the sets still to do. */
export function remainingSeconds(items: readonly PlanItem[], index: number, doneOnCurrent: number): number {
  let total = 0;
  for (let i = index; i < items.length; i++) {
    const it = items[i]!;
    const left = i === index ? it.sets - doneOnCurrent : it.sets;
    if (left <= 0) continue;
    const ex = exercise(it.exerciseId);
    total += left * setSeconds(ex, it.target.reps) + left * it.restSec + (i === index && doneOnCurrent > 0 ? 0 : 60);
  }
  return total;
}

export interface FitResult {
  items: PlanItem[];
  /** What changed, in plain words, for the confirmation note. */
  changes: string[];
  /** Estimated minutes for what's left. */
  minutes: number;
}

/**
 * Fits the rest of the workout into `minutes`. Sets come off the least important exercises first
 * (down to 2 each, or what's already done on the current one), then whole exercises drop from the
 * end. The current exercise and the ones already done are never removed.
 */
export function fitToTime(items: readonly PlanItem[], index: number, doneOnCurrent: number, minutes: number): FitResult {
  const budget = minutes * 60;
  const next = items.map((i) => ({ ...i }));
  const changes: string[] = [];
  const cut = new Map<string, number>();
  const floor = (i: number) => (i === index ? Math.max(doneOnCurrent + 1, Math.min(2, next[i]!.sets)) : 2);
  const order = () =>
    next
      .map((it, i) => ({ it, i }))
      .filter(({ i }) => i >= index)
      .sort((a, b) => priority(a.it, a.i) - priority(b.it, b.i));

  // 1. Trim sets, least important exercise first.
  let guard = 0;
  while (remainingSeconds(next, index, doneOnCurrent) > budget && guard++ < 100) {
    const c = order().find(({ it, i }) => it.sets > floor(i));
    if (!c) break;
    c.it.sets -= 1;
    cut.set(c.it.exerciseId, (cut.get(c.it.exerciseId) ?? 0) + 1);
  }
  // 2. Drop whole exercises, least important first, never the current one.
  const dropped: string[] = [];
  while (remainingSeconds(next, index, doneOnCurrent) > budget) {
    const c = order().find(({ i }) => i > index);
    if (!c) break;
    dropped.push(c.it.exerciseId);
    next.splice(c.i, 1);
  }
  for (const [id, n] of cut) if (!dropped.includes(id)) changes.push(`${exercise(id).name}: ${n} ${n === 1 ? "set" : "sets"} fewer`);
  for (const id of dropped) changes.push(`${exercise(id).name}: skipped today`);
  if (!changes.length) changes.push("Everything still fits.");
  return { items: next, changes, minutes: Math.ceil(remainingSeconds(next, index, doneOnCurrent) / 60) };
}

/** Moves the current exercise to after the next one (the equipment is busy, come back to it). */
export function doLater(items: readonly PlanItem[], index: number): PlanItem[] {
  if (index >= items.length - 1) return [...items];
  const next = [...items];
  const [cur] = next.splice(index, 1);
  next.splice(index + 1, 0, cur!);
  return next;
}

/** The equipment an exercise needs that someone else could be using (benches, racks, machines, bars). */
export function busyEquipment(exerciseId: string): Equipment[] {
  // Bars, bands and small gear are rarely the hold-up; benches, racks and machines are.
  return exercise(exerciseId).needs.filter((e) => !["barbell", "ezBar", "bands", "abWheel", "box"].includes(e));
}

/** Rough minutes still to go, for the "short on time" options. */
export function minutesLeft(items: readonly PlanItem[], index: number, doneOnCurrent: number): number {
  return Math.ceil(remainingSeconds(items, index, doneOnCurrent) / 60);
}
