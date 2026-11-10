import { EXERCISE_BY_ID } from "./exercises";
import { relative, t } from "./i18n";
import { bandOf, recovery, type Band } from "./recovery";
import type { AppEvent, Muscle } from "./types";

// What to do about one muscle, for a tap on the recovery map (action over stats: the map answers
// "what should I do?" before "what happened?"). Built from the same recovery model and weekly set
// counts the generator plans with, so the advice matches what Today will actually do.

/** Recovery the generator needs before it makes a muscle the day's focus (`generator.ts`). */
const READY = 70;

export interface MuscleAdvice {
  muscle: Muscle;
  pct: number;
  band: Band;
  /** When the muscle reaches Ready (70%), or null when it already has. */
  readyAt: number | null;
  /** The last working set that hit it (primary or secondary), or null in the last week. */
  lastAt: number | null;
  done: number;
  goal: number;
  /** One line: what to do. */
  call: string;
  /** One line: why, from the numbers. */
  why: string;
  /** Offer to make it a priority (more weekly sets, picked first when recovered). */
  offerPriority: boolean;
}

/** When `m` climbs back to `target`% given the sets logged so far, to the nearest quarter hour. Null if it's there. */
export function readyAt(events: readonly AppEvent[], m: Muscle, now: number, target = READY): number | null {
  if (recovery(events, now)[m] >= target) return null;
  let lo = 0,
    hi = 8 * 24 * 4; // quarter hours; fatigue only fades, so a binary search is exact
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (recovery(events, now + mid * 900_000)[m] >= target) hi = mid;
    else lo = mid + 1;
  }
  return now + lo * 900_000;
}

/** The last working set in the past week that worked `m`. */
export function lastWorked(events: readonly AppEvent[], m: Muscle, now: number): number | null {
  let last: number | null = null;
  for (const e of events) {
    if (e.type !== "set" || e.at > now || e.at < now - 7 * 24 * 3600_000) continue;
    const ex = EXERCISE_BY_ID.get(e.exerciseId);
    if (ex && (ex.primary.includes(m) || ex.secondary.includes(m)) && (last === null || e.at > last)) last = e.at;
  }
  return last;
}

/** "in 14 hours", "in 2 days". */
export function whenText(at: number, now: number): string {
  const min = Math.round((at - now) / 60_000);
  if (min < 60) return relative(Math.max(1, Math.ceil(min / 15) * 15), "minute");
  const h = Math.round((at - now) / 3600_000);
  return h < 36 ? relative(h, "hour") : relative(Math.round(h / 24), "day");
}

export function muscleAdvice(input: {
  muscle: Muscle;
  events: readonly AppEvent[];
  now: number;
  rec: Record<Muscle, number>;
  done: number;
  goal: number;
  priorities?: readonly Muscle[];
}): MuscleAdvice {
  const { muscle, events, now, rec, goal } = input;
  const pct = rec[muscle];
  const band = bandOf(pct).band;
  const done = Math.round(input.done);
  const left = Math.max(0, goal - done);
  const ready = pct >= READY ? null : readyAt(events, muscle, now);
  const last = lastWorked(events, muscle, now);
  let call: string, why: string;
  if (ready !== null) {
    call = t(band === "fatigued" ? "advice.rest" : "advice.easy", { when: whenText(ready, now) });
    why = t(band === "fatigued" ? "advice.rest.why" : "advice.easy.why", { pct });
  } else if (left > 0) {
    call = t("advice.train", { count: left, goal });
    why = t("advice.train.why", { pct, done, goal });
  } else {
    call = t("advice.done");
    why = t("advice.done.why", { done, goal });
  }
  if (last !== null) why += " " + t("advice.last", { when: relativeAgo(last, now) });
  // A muscle well short of its weekly sets can be made a priority; offer it only when it can use the sets.
  const offerPriority = !(input.priorities ?? []).includes(muscle) && left >= Math.ceil(goal / 2);
  return { muscle, pct, band, readyAt: ready, lastAt: last, done, goal, call, why, offerPriority };
}

/** "2 hours ago", "yesterday". */
function relativeAgo(at: number, now: number): string {
  const min = Math.round((now - at) / 60_000);
  if (min < 60) return relative(-Math.max(1, min), "minute");
  const h = Math.round((now - at) / 3600_000);
  return h < 36 ? relative(-h, "hour") : relative(-Math.round(h / 24), "day");
}
