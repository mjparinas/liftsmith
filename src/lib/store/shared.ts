import type { StoreApi } from "zustand";

import { planSeconds, type Plan } from "../generator";
import type { Active, State } from "../store";
import { applyLinks } from "../superset";
import type { AppEvent, Gym } from "../types";

// What every slice of the app's state gets, and the helpers they share.

export interface Ctx {
  set: StoreApi<State>["setState"];
  get: () => State;
  /** Appends events: saved to IndexedDB, and the stats recomputed. */
  commit(evs: AppEvent[]): void;
  /** The active gym (else the first). */
  gym(): Gym | undefined;
}

export const ACTIVE_KEY = "liftsmith.active";

/** Re-applies the superset choices made on Today to a rebuilt plan (superset.ts `applyLinks`). */
export function relink(plan: Plan, links: readonly string[]): Plan {
  if (!links.length) return plan;
  const items = applyLinks(plan.items, links);
  return { ...plan, items, estMinutes: Math.round(planSeconds(items) / 60) };
}
export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export function persistActive(a: Active | null) {
  try {
    if (a) localStorage.setItem(ACTIVE_KEY, JSON.stringify(a));
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {}
}

export function setsDone(events: AppEvent[], sessionId: string, exerciseId: string): number {
  // Bonus drop and rest-pause sets aren't planned sets, so they don't count toward the plan's set count.
  return events.filter((e) => e.type === "set" && e.sessionId === sessionId && e.exerciseId === exerciseId && !e.tag).length;
}
