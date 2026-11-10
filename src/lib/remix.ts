import { blockWeek } from "./block";
import { available, EXERCISE_BY_ID } from "./exercises";
import { alternatives, itemSeconds, restFor, type Plan, type PlanItem } from "./generator";
import { roundLoad } from "./loads";
import { epley, target, TIMED, weightFor } from "./progression";
import { APP_PATH, SITE_URL } from "./site";
import type { AppEvent, Gym, Profile } from "./types";

// Workout remix links (Melvin picked it, 2026-11-09). A lifter shares a workout as a link; whoever
// opens it gets the same session rebuilt for their own gym, plates and strength: exercises they can't
// do there are swapped for the closest match, and every weight comes from their own history. Only the
// exercise list, sets, reps and rest travel in the link: no weights, names or anything personal.

export interface SharedItem {
  exerciseId: string;
  sets: number;
  reps: number;
  restSec: number;
}

const VERSION = "1";
const MAX_ITEMS = 20;

export function encodeRemix(items: readonly { exerciseId: string; sets: number; restSec: number; target: { reps: number } }[]): string {
  const parts = items.slice(0, MAX_ITEMS).map((i) => `${i.exerciseId}.${i.sets}.${i.target.reps}.${i.restSec}`);
  return [VERSION, ...parts].join("~");
}

/** Reads a remix code. Unknown exercises and bad numbers are dropped, so an old or damaged link still opens. */
export function decodeRemix(code: string): SharedItem[] {
  let raw = code;
  try {
    raw = decodeURIComponent(code);
  } catch {}
  const [v, ...parts] = raw.split("~");
  if (v !== VERSION) return [];
  const out: SharedItem[] = [];
  for (const p of parts.slice(0, MAX_ITEMS)) {
    const [exerciseId, s, r, rest] = p.split(".");
    const sets = Number(s);
    const reps = Number(r);
    const restSec = Number(rest);
    if (!EXERCISE_BY_ID.has(exerciseId)) continue;
    if (!Number.isInteger(sets) || sets < 1 || sets > 10) continue;
    if (!Number.isInteger(reps) || reps < 1 || reps > 120) continue;
    out.push({ exerciseId, sets, reps, restSec: Number.isFinite(restSec) ? Math.min(600, Math.max(15, Math.round(restSec))) : 90 });
  }
  return out;
}

export function remixUrl(code: string, base = SITE_URL): string {
  return `${base.replace(/\/$/, "")}${APP_PATH}#/remix/${code}`;
}

export interface Remixed {
  plan: Plan;
  /** Exercises swapped for this gym: from → to. */
  swapped: { from: string; to: string }[];
  /** Exercises with no match at this gym, left out. */
  missing: string[];
}

/** Rebuilds a shared workout for this lifter's gym and strength. */
export function adaptRemix(shared: readonly SharedItem[], gym: Gym, profile: Profile, events: readonly AppEvent[], now: number): Remixed {
  const can = new Set(available(gym.equipment).map((e) => e.id));
  const used = new Set<string>();
  const swapped: Remixed["swapped"] = [];
  const missing: string[] = [];
  const items: PlanItem[] = [];
  for (const s of shared) {
    let id: string | undefined = s.exerciseId;
    if (!can.has(id) || used.has(id)) {
      id = alternatives(s.exerciseId, gym, [...used]).find((e) => !used.has(e.id))?.id;
      if (id) swapped.push({ from: s.exerciseId, to: id });
    }
    if (!id) {
      missing.push(s.exerciseId);
      continue;
    }
    used.add(id);
    const ex = EXERCISE_BY_ID.get(id)!;
    const t = target(ex, events, profile, gym, now);
    // Their reps, our weight: the same effort worked out from this lifter's own strength.
    const reps = id === s.exerciseId || TIMED.has(id) === TIMED.has(s.exerciseId) ? s.reps : t.reps;
    let weight = t.weight;
    if (ex.load !== "bodyweight" && reps !== t.reps && t.weight > 0)
      weight = roundLoad(weightFor(epley(t.weight, t.reps, t.rir), reps, t.rir), ex, gym).kg;
    const note =
      id === s.exerciseId
        ? "From a shared workout, at your weights"
        : `Swapped in for ${EXERCISE_BY_ID.get(s.exerciseId)!.name} at this gym`;
    items.push({ exerciseId: id, sets: s.sets, restSec: s.restSec, focus: ex.primary[0], target: { weight, reps, rir: t.rir, note } });
  }
  const est = items.reduce((sum, i, n) => sum + itemSeconds(i) + (n ? i.restSec : 0), 0);
  const minutes = Math.max(15, Math.round(est / 60));
  return {
    plan: { gymId: gym.id, minutes, estMinutes: minutes, week: blockWeek(profile, now), call: "normal", challenge: false, items },
    swapped,
    missing,
  };
}

/** A finished session as shareable items: exercises in the order done, sets done, the reps aimed for. */
export function sharedFromSession(events: readonly AppEvent[], sessionId: string, goal: Profile["goal"]): SharedItem[] {
  const order: string[] = [];
  const by = new Map<string, { sets: number; reps: number }>();
  for (const e of events) {
    if (e.type !== "set" || e.sessionId !== sessionId) continue;
    const cur = by.get(e.exerciseId);
    if (!cur) {
      order.push(e.exerciseId);
      by.set(e.exerciseId, { sets: 1, reps: e.targetReps || e.reps });
    } else cur.sets += 1;
  }
  return order
    .filter((id) => EXERCISE_BY_ID.has(id))
    .map((id) => ({ exerciseId: id, sets: by.get(id)!.sets, reps: by.get(id)!.reps, restSec: restFor(EXERCISE_BY_ID.get(id)!, goal) }));
}

/** Code for shared items (same format as encodeRemix). */
export function encodeShared(items: readonly SharedItem[]): string {
  return encodeRemix(items.map((i) => ({ exerciseId: i.exerciseId, sets: i.sets, restSec: i.restSec, target: { reps: i.reps } })));
}
