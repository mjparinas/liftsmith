import { available, exercise } from "./exercises";
import { planSeconds, restFor, type Plan, type PlanItem } from "./generator";
import { t } from "./i18n";
import { sessionsOf, target } from "./progression";
import { withLinks } from "./superset";
import type { AppEvent, Gym, Profile, SetEvent } from "./types";

// Ghost mode and "same as last time". The ghost is the lifter's own last session of the same exercise:
// its weights, reps and rests, raced live on the rest timer. Everything here is pure.

export interface GhostSet {
  weight: number;
  reps: number;
  /** Seconds rested before this set, when it was captured. */
  restSec?: number;
  /** Seconds from the ghost's first set being logged to this one. */
  offset: number;
}

export interface Ghost {
  sessionId: string;
  at: number;
  sets: GhostSet[];
}

/** The most recent earlier session of this exercise (not the one running now). */
export function ghostFor(events: readonly AppEvent[], exerciseId: string, currentSessionId?: string): Ghost | null {
  const prior = sessionsOf(events, exerciseId).find((list) => list[0].sessionId !== currentSessionId);
  if (!prior) return null;
  const list = [...prior].sort((a, b) => a.at - b.at);
  const t0 = list[0].at;
  return {
    sessionId: list[0].sessionId,
    at: t0,
    sets: list.map((s, i) => ({
      weight: s.weight,
      reps: s.reps,
      restSec: s.restSec ?? restFromGap(list, i),
      offset: Math.round((s.at - t0) / 1000),
    })),
  };
}

/** Older events lack restSec: rebuild it from the gap between sets, minus the set's own duration. */
function restFromGap(list: SetEvent[], i: number): number | undefined {
  if (i === 0) return undefined;
  const s = list[i];
  if (s.startedAt) return Math.max(0, Math.round((s.startedAt - list[i - 1].at) / 1000));
  return undefined;
}

/** The ghost's set at this index (0-based), if the ghost did that many. */
export function ghostSet(g: Ghost | null, index: number): GhostSet | null {
  return g?.sets[index] ?? null;
}

/**
 * Seconds ahead of the ghost (positive) or behind (negative) after `done` sets, measured from each
 * session's first set of the exercise. Null until both have two sets to compare.
 */
export function paceDelta(g: Ghost | null, logged: readonly { at: number }[]): number | null {
  const k = logged.length;
  if (!g || k < 2 || g.sets.length < k) return null;
  const ours = (logged[k - 1].at - logged[0].at) / 1000;
  return Math.round(g.sets[k - 1].offset - ours);
}

/** "0:42 ahead", "1:05 behind", "level". */
export function paceText(delta: number): string {
  if (Math.abs(delta) < 5) return t("ghost.level");
  const a = Math.abs(delta);
  const time = `${Math.floor(a / 60)}:${String(a % 60).padStart(2, "0")}`;
  return t(delta > 0 ? "ghost.ahead" : "ghost.behind", { time });
}

// --- Same as last time -------------------------------------------------------------------------

export interface LastWorkout {
  sessionId: string;
  at: number;
  /** Exercises in the order they were done, with the number of sets. */
  items: { exerciseId: string; sets: number; superset?: string }[];
}

export function lastWorkout(events: readonly AppEvent[], excludeSessionId?: string): LastWorkout | null {
  const sets = events.filter((e): e is SetEvent => e.type === "set" && e.sessionId !== excludeSessionId);
  if (!sets.length) return null;
  const latest = sets.reduce((a, b) => (b.at > a.at ? b : a));
  const own = sets.filter((s) => s.sessionId === latest.sessionId).sort((a, b) => a.at - b.at);
  const order: string[] = [];
  const count = new Map<string, number>();
  const group = new Map<string, string>();
  for (const s of own) {
    if (!count.has(s.exerciseId)) order.push(s.exerciseId);
    count.set(s.exerciseId, (count.get(s.exerciseId) ?? 0) + 1);
    if (s.superset) group.set(s.exerciseId, s.superset);
  }
  return {
    sessionId: latest.sessionId,
    at: own[0].at,
    items: order.map((exerciseId) => ({
      exerciseId,
      sets: count.get(exerciseId)!,
      ...(group.has(exerciseId) ? { superset: group.get(exerciseId) } : {}),
    })),
  };
}

/**
 * Today's plan with the last workout's exercises and set counts, in the same order. Weights and reps
 * still come from progression (so it keeps moving forward), and exercises the gym can't do are left
 * out. Null when nothing from last time can be done here.
 */
export function repeatPlan(base: Plan, events: readonly AppEvent[], profile: Profile, gym: Gym, now: number): Plan | null {
  const last = lastWorkout(events);
  if (!last) return null;
  const can = new Set(available(gym.equipment).map((e) => e.id));
  const kept = last.items.filter((i) => can.has(i.exerciseId));
  const plain: PlanItem[] = kept.map((i) => {
    const ex = exercise(i.exerciseId);
    return {
      exerciseId: ex.id,
      sets: i.sets,
      restSec: restFor(ex, profile.goal, profile.training),
      focus: ex.primary[0],
      target: target(ex, events, profile, gym, now),
    };
  });
  if (!plain.length) return null;
  // Supersets come back as they were, where both exercises are still here and next to each other.
  const items = withLinks(
    plain,
    kept.slice(0, -1).map((k, i) => !!k.superset && k.superset === kept[i + 1].superset),
  );
  const sec = planSeconds(items);
  return { ...base, gymId: gym.id, challenge: false, items, estMinutes: Math.round(sec / 60) };
}

/** The numbers from the same set last time, for the one-tap "same as last time" chip. */
export function sameAsLast(g: Ghost | null, setIndex: number): { weight: number; reps: number } | null {
  const s = ghostSet(g, setIndex) ?? g?.sets.at(-1) ?? null;
  return s ? { weight: s.weight, reps: s.reps } : null;
}
