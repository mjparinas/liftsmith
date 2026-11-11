import { CARDIO_START_M } from "./exercises";
import type { AppEvent, Exercise, SetEvent, Unit } from "./types";

// Cardio logging (Melvin, 2026-11-11): time in seconds (a set's reps) and, where it means something,
// distance in metres. Distance shows in km with kg and in miles with lb.

export type DistUnit = "km" | "mi";
const MILE = 1609.344;

export const distUnit = (unit: Unit): DistUnit => (unit === "lb" ? "mi" : "km");

/** Metres as km or miles, to two decimals. */
export function fromMetres(m: number, unit: DistUnit): number {
  return Math.round((m / (unit === "mi" ? MILE : 1000)) * 100) / 100;
}

/** One stepper bump: 0.1 km or 0.1 mi, or 10 m on a sled (short pushes). */
export function distanceStep(ex: Pick<Exercise, "id">, unit: DistUnit): number {
  if ((CARDIO_START_M[ex.id] ?? 1000) < 500) return 10;
  return unit === "mi" ? MILE / 10 : 100;
}

/** Bumps a distance by one step, landing on the step's grid so repeated bumps stay round. */
export function bumpDistance(m: number, dir: 1 | -1, ex: Pick<Exercise, "id">, unit: DistUnit): number {
  const step = distanceStep(ex, unit);
  const at = Math.round(m / step);
  return Math.max(0, Math.round((at + dir) * step));
}

/** The distance to pre-fill: the last one logged for this exercise, or its first-session start. */
export function startDistance(ex: Pick<Exercise, "id" | "cardio">, events: readonly AppEvent[]): number | undefined {
  if (ex.cardio !== "distance") return undefined;
  let last: SetEvent | undefined;
  for (const e of events)
    if (e.type === "set" && e.exerciseId === ex.id && e.distanceM !== undefined && (!last || e.at > last.at)) last = e;
  return last?.distanceM ?? CARDIO_START_M[ex.id] ?? 1000;
}

/** Distance and time as text, for the set list and the export: "5.2 km". */
export function distanceText(m: number, unit: Unit): string {
  const u = distUnit(unit);
  return `${fromMetres(m, u)} ${u}`;
}
