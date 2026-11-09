import { blockWeek, weekStart, type BlockWeek } from "./block";
import { available, EXERCISE_BY_ID } from "./exercises";
import { target, TIMED, type Target } from "./progression";
import { dayKey, hash, rng } from "./random";
import { recovery } from "./recovery";
import { MUSCLES, type AppEvent, type Exercise, type Gym, type Muscle, type Profile } from "./types";

// Builds today's workout: only exercises this gym can do, aimed at the muscles that are both
// recovered and furthest below this week's set target, sized to fit the minutes asked for.
// The same day and gym always give the same order, so moving the length slider adds or drops
// exercises at the end instead of reshuffling the whole plan.

export interface PlanItem {
  exerciseId: string;
  sets: number;
  restSec: number;
  focus: Muscle;
  target: Target;
}

export interface Plan {
  gymId: string;
  minutes: number;
  estMinutes: number;
  week: BlockWeek;
  items: PlanItem[];
}

export interface GenerateInput {
  gym: Gym;
  profile: Profile;
  events: readonly AppEvent[];
  minutes: number;
  now: number;
  /** Exercises to leave out (e.g. swapped away this session). */
  exclude?: readonly string[];
}

const KEEP = { consistent: 0.75, balanced: 0.5, variable: 0.25 } as const;
const WARMUP_SEC = 240;

export function restFor(ex: Exercise, goal: Profile["goal"]): number {
  if (ex.load === "bodyweight" && !ex.compound) return 45;
  if (!ex.compound) return 75;
  if (ex.load === "bodyweight") return 75;
  return goal === "strength" ? 180 : 120;
}

export function setSeconds(ex: Exercise, reps: number): number {
  return TIMED.has(ex.id) ? reps + 15 : 25 + reps * 3.5;
}

export function itemSeconds(item: Pick<PlanItem, "exerciseId" | "sets" | "restSec" | "target">): number {
  const ex = EXERCISE_BY_ID.get(item.exerciseId)!;
  return item.sets * setSeconds(ex, item.target.reps) + (item.sets - 1) * item.restSec + 60; // 60 s to set up
}

/** Hard sets per muscle since the start of this block week (secondary muscles count half). */
export function weeklySets(events: readonly AppEvent[], since: number): Record<Muscle, number> {
  const out = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
  for (const e of events) {
    if (e.type !== "set" || e.at < since) continue;
    const ex = EXERCISE_BY_ID.get(e.exerciseId);
    if (!ex) continue;
    for (const m of ex.primary) out[m] += 1;
    for (const m of ex.secondary) out[m] += 0.5;
  }
  return out;
}

/** Exercises swapped away as "not available here" in the last two weeks at this gym. */
export function avoided(events: readonly AppEvent[], gymId: string, now: number): Set<string> {
  const gymOf = new Map<string, string>();
  const out = new Set<string>();
  for (const e of events) {
    if (e.type === "sessionStart") gymOf.set(e.sessionId, e.gymId);
    if (e.type === "swap" && e.avoid && gymOf.get(e.sessionId) === gymId && now - e.at < 14 * 86400_000) out.add(e.from);
  }
  return out;
}

/** The exercises used most recently for each muscle, newest first. */
function recentFor(events: readonly AppEvent[]): Map<Muscle, string[]> {
  const out = new Map<Muscle, string[]>();
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.type !== "set") continue;
    const ex = EXERCISE_BY_ID.get(e.exerciseId);
    if (!ex) continue;
    for (const m of ex.primary) {
      const list = out.get(m) ?? [];
      if (!list.includes(ex.id)) list.push(ex.id);
      out.set(m, list);
    }
  }
  return out;
}

function order(a: Exercise, b: Exercise): number {
  const rank = (e: Exercise) => (e.pattern === "core" || e.pattern === "carry" ? 3 : e.compound ? (e.load === "bodyweight" ? 1 : 0) : 2);
  return rank(a) - rank(b);
}

export function generate({ gym, profile, events, minutes, now, exclude = [] }: GenerateInput): Plan {
  const week = blockWeek(profile, now);
  const rec = recovery(events, now);
  const done = weeklySets(events, weekStart(profile, now));
  const skip = new Set([...exclude, ...avoided(events, gym.id, now)]);
  const pool = available(gym.equipment).filter((e) => !skip.has(e.id));
  const random = rng(hash(dayKey(now) + gym.id));
  const recent = recentFor(events);
  const budget = minutes * 60;

  // Muscles ranked by how ready they are and how much of this week's target is left.
  const ranked = MUSCLES.filter((m) => rec[m] >= 55)
    .map((m) => {
      const left = Math.max(0, week.setsPerMuscle - done[m]) / week.setsPerMuscle;
      const big = ["chest", "lats", "upperBack", "quads", "hamstrings", "glutes"].includes(m) ? 1.25 : m === "forearms" || m === "adductors" ? 0.6 : 1;
      return { m, score: (rec[m] / 100) * (0.25 + left) * big + random() * 0.05 };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.m);

  const items: PlanItem[] = [];
  const used = new Set<string>();
  let total = 0;
  let firstBarbell = true;

  const pick = (m: Muscle, compoundFirst: boolean): Exercise | undefined => {
    const cands = pool.filter((e) => e.primary.includes(m) && !used.has(e.id) && e.primary.every((p) => rec[p] >= 40));
    if (!cands.length) return undefined;
    const prev = (recent.get(m) ?? []).map((id) => cands.find((c) => c.id === id)).find(Boolean);
    if (prev && random() < KEEP[profile.variability]) return prev;
    const weighted = cands.map((c) => ({ c, w: (compoundFirst && c.compound ? (c.load === "barbell" ? 4 : 3) : 1) * (c.load === "bodyweight" && gym.equipment.length > 4 ? 0.5 : 1) * (0.5 + random()) }));
    weighted.sort((a, b) => b.w - a.w);
    return weighted[0].c;
  };

  const tryAdd = (m: Muscle, compoundFirst: boolean): boolean => {
    const ex = pick(m, compoundFirst);
    if (!ex) return false;
    const t = target(ex, events, profile, gym, now);
    const baseSets = ex.compound && items.length < 2 && minutes >= 45 ? 4 : 3;
    const sets = week.deload ? Math.max(2, Math.round(baseSets * week.volume)) : baseSets;
    const item: PlanItem = { exerciseId: ex.id, sets, restSec: restFor(ex, profile.goal), focus: m, target: t };
    const warm = ex.load === "barbell" && firstBarbell ? WARMUP_SEC : 0;
    const cost = itemSeconds(item) + warm + (items.length ? item.restSec : 0);
    if (total + cost > budget) return false;
    total += cost;
    if (warm) firstBarbell = false;
    used.add(ex.id);
    items.push(item);
    return true;
  };

  // Round one: one exercise per ranked muscle, compounds favoured. Round two: second exercises.
  for (const round of [true, false]) {
    for (const m of ranked) {
      if (budget - total < 240) break;
      const covered = items.some((i) => EXERCISE_BY_ID.get(i.exerciseId)!.primary.includes(m));
      if (round && covered) continue;
      tryAdd(m, round);
    }
  }

  // Leftover time: an extra set on the earliest exercises.
  for (const item of items) {
    const ex = EXERCISE_BY_ID.get(item.exerciseId)!;
    const extra = setSeconds(ex, item.target.reps) + item.restSec;
    if (item.sets < 5 && !week.deload && total + extra <= budget) {
      item.sets += 1;
      total += extra;
    }
  }

  items.sort((a, b) => order(EXERCISE_BY_ID.get(a.exerciseId)!, EXERCISE_BY_ID.get(b.exerciseId)!));
  return { gymId: gym.id, minutes, estMinutes: Math.round(total / 60), week, items };
}

/** Swaps for an exercise: same main muscles, doable at this gym, best match first. */
export function alternatives(exerciseId: string, gym: Gym | null, skip: readonly string[] = []): Exercise[] {
  const ex = EXERCISE_BY_ID.get(exerciseId);
  if (!ex) return [];
  const pool = gym ? available(gym.equipment) : [...EXERCISE_BY_ID.values()];
  return pool
    .filter((e) => e.id !== ex.id && !skip.includes(e.id) && e.primary.some((m) => ex.primary.includes(m)))
    .map((e) => {
      const shared = e.primary.filter((m) => ex.primary.includes(m)).length * 3 + e.secondary.filter((m) => ex.secondary.includes(m)).length;
      return { e, s: shared + (e.pattern === ex.pattern ? 2 : 0) + (e.compound === ex.compound ? 1 : 0) };
    })
    .sort((a, b) => b.s - a.s || a.e.name.localeCompare(b.e.name))
    .map((x) => x.e);
}
