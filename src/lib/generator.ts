import { blockWeek, weekStart, type BlockWeek } from "./block";
import { available, EXERCISE_BY_ID, EXERCISES, LADDER_ONLY } from "./exercises";
import { t } from "./i18n";
import { activeInjuries, effectFor, lighten, skippedIds, type Injury } from "./injury";
import { stepLoad } from "./loads";
import { target, TIMED, type Target } from "./progression";
import { dayKey, hash, rng } from "./random";
import type { Call } from "./readiness";
import { recovery } from "./recovery";
import { groupedSeconds } from "./superset";
import { PRIORITY_VOLUME } from "./training";
import { MUSCLES, type AppEvent, type Exercise, type Gym, type Muscle, type Profile } from "./types";
import { WARMUP_REST, warmupFor, withWarmups, type WarmupSet } from "./warmup";

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
  /** Challenge: the last set is as many good reps as possible at the target weight. */
  challenge?: boolean;
  /** Kept lighter for an injury, at this share of the usual load (injury.ts). */
  injuryPct?: number;
  /** Lighter sets before the working sets (warmup.ts). */
  warmup?: WarmupSet[];
  // ---- Set by a program (programs.ts); the adaptive plan leaves them out.
  /** The program lift these sets count for, saved on each set so a swap keeps its progress. */
  slot?: string;
  /** A target for each working set, when they differ (ramps, percentages, a last set for max reps). */
  setTargets?: SetTarget[];
  /** Short scheme for lists, such as "5 × 5" or "5, 5, 5+". */
  scheme?: string;
  /** Tier or role, such as "T1" or "Main lift". */
  label?: string;
  /** Superset: neighbours with the same group are done back to back (superset.ts). */
  group?: string;
}

export interface SetTarget {
  /** Kilograms (per hand for dumbbells). */
  weight: number;
  /** Reps, or the minimum when `amrap`. Seconds for holds. */
  reps: number;
  /** As many good reps as possible. */
  amrap?: boolean;
  /** Lighter for the first session back after a break (layoff.ts); the program rebuilds from it. */
  comeback?: boolean;
}

export interface Plan {
  gymId: string;
  minutes: number;
  estMinutes: number;
  week: BlockWeek;
  /** The day's call the plan was built with (readiness.ts). */
  call: Call;
  challenge: boolean;
  items: PlanItem[];
  /** Set when a program built the plan: which program, which day of it, and a line for Today. */
  program?: { id: string; day: number; dayName: string; note: string; fixed: boolean };
  /** Set when the plan is a saved routine instead of the adaptive plan (routines.ts). */
  routineId?: string;
}

export interface GenerateInput {
  gym: Gym;
  profile: Profile;
  events: readonly AppEvent[];
  minutes: number;
  now: number;
  /** Exercises to leave out (e.g. swapped away this session). */
  exclude?: readonly string[];
  /** Today's push / normal / recover call, after any override by the lifter. */
  call?: Call;
  challenge?: boolean;
  /** A split day (programs.ts): only these muscles, and only exercises whose main muscles are all in it. */
  muscles?: readonly Muscle[];
}

const KEEP = { consistent: 0.75, balanced: 0.5, variable: 0.25 } as const;

/** Rest between sets: the lifter's time for this exercise, then their compound or isolation default, then by goal. */
export function restFor(ex: Exercise, goal: Profile["goal"], training?: Profile["training"]): number {
  const own = training?.exercises?.[ex.id]?.rest;
  if (own) return own;
  const kind = ex.compound ? training?.rest?.compound : training?.rest?.isolation;
  if (kind) return kind;
  if (ex.load === "bodyweight" && !ex.compound) return 45;
  if (!ex.compound) return 75;
  if (ex.load === "bodyweight") return 75;
  return goal === "strength" ? 180 : 120;
}

export function setSeconds(ex: Exercise, reps: number): number {
  return TIMED.has(ex.id) ? reps + 15 : 25 + reps * 3.5;
}

/** How long one exercise takes: setup, warm-up sets and their rests, working sets and the rests between them. */
export function itemSeconds(item: Pick<PlanItem, "exerciseId" | "sets" | "restSec" | "target" | "warmup">): number {
  const ex = EXERCISE_BY_ID.get(item.exerciseId)!;
  const warm = (item.warmup ?? []).reduce((s, w) => s + setSeconds(ex, w.reps) + WARMUP_REST, 0);
  return 60 + warm + item.sets * setSeconds(ex, item.target.reps) + (item.sets - 1) * item.restSec; // 60 s to set up
}

/** The whole plan: every exercise plus the rest before each one after the first. */
export function planSeconds(items: readonly Pick<PlanItem, "exerciseId" | "sets" | "restSec" | "target" | "warmup" | "group">[]): number {
  return groupedSeconds(items, (n) => itemSeconds(items[n]!));
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
    const e = events[i]!;
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

export function generate({
  gym,
  profile,
  events,
  minutes,
  now,
  exclude = [],
  call = "normal",
  challenge = false,
  muscles,
}: GenerateInput): Plan {
  const day = muscles ? new Set(muscles) : null;
  const week = blockWeek(profile, now);
  const rec = recovery(events, now);
  const done = weeklySets(events, weekStart(profile, now));
  const hurt = activeInjuries(events, now);
  const skip = new Set([...exclude, ...avoided(events, gym.id, now), ...skippedIds(EXERCISES, hurt)]);
  const pool = available(gym.equipment).filter(
    (e) => !skip.has(e.id) && !e.custom && !LADDER_ONLY.has(e.id) && (!day || e.primary.every((m) => day.has(m))),
  );
  const random = rng(hash(dayKey(now) + gym.id));
  const training = profile.training;
  const favs = new Set(training?.favourites ?? []);
  const prio = new Set(training?.priorities ?? []);
  const recent = recentFor(events);
  const budget = minutes * 60;

  // Muscles ranked by how ready they are and how much of this week's target is left.
  // A split day trains its muscles unless they're actually fatigued (40%), not only when fresh.
  const ranked = MUSCLES.filter((m) => (day ? day.has(m) && rec[m] >= 40 : rec[m] >= 55))
    .map((m) => {
      // Priority muscles (Settings) aim for a third more sets this week and rank ahead.
      const goal = week.setsPerMuscle * (prio.has(m) ? PRIORITY_VOLUME : 1);
      const left = Math.max(0, goal - done[m]) / week.setsPerMuscle;
      const big = ["chest", "lats", "upperBack", "quads", "hamstrings", "glutes"].includes(m)
        ? 1.25
        : m === "forearms" || m === "adductors"
          ? 0.6
          : 1;
      return { m, score: (rec[m] / 100) * (0.25 + left) * big * (prio.has(m) ? 1.5 : 1) + random() * 0.05 };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.m);

  const items: PlanItem[] = [];
  const used = new Set<string>();
  let total = 0;
  const warmed = new Set<Muscle>();

  const pick = (m: Muscle, compoundFirst: boolean): Exercise | undefined => {
    const cands = pool.filter((e) => e.primary.includes(m) && !used.has(e.id) && e.primary.every((p) => rec[p] >= 40));
    if (!cands.length) return undefined;
    const prev = (recent.get(m) ?? []).map((id) => cands.find((c) => c.id === id)).find(Boolean);
    // A favourite that fits beats keeping last time's exercise, unless last time's was a favourite too.
    const favHere = cands.some((c) => favs.has(c.id));
    if (prev && (!favHere || favs.has(prev.id)) && random() < KEEP[profile.variability]) return prev;
    const weighted = cands.map((c) => ({
      c,
      w:
        (compoundFirst && c.compound ? (c.load === "barbell" ? 4 : 3) : 1) *
        (c.load === "bodyweight" && gym.equipment.length > 4 ? 0.5 : 1) *
        (favs.has(c.id) ? 6 : 1) *
        (0.5 + random()),
    }));
    weighted.sort((a, b) => b.w - a.w);
    return weighted[0]!.c;
  };

  const tryAdd = (m: Muscle, compoundFirst: boolean): boolean => {
    const ex = pick(m, compoundFirst);
    if (!ex) return false;
    const t = injuredTarget(ex, target(ex, events, profile, gym, now), hurt, gym);
    // The lifter's set count (for this exercise, then for every exercise) replaces the automatic one.
    const chosen = training?.exercises?.[ex.id]?.sets ?? training?.sets;
    const baseSets = chosen ?? (ex.compound && items.length < 2 && minutes >= 45 ? 4 : 3);
    const sets = week.deload ? Math.max(2, Math.round(baseSets * week.volume)) : baseSets;
    const warmup = warmupFor(ex, t.target.weight, gym, warmed);
    const item: PlanItem = {
      exerciseId: ex.id,
      sets,
      restSec: restFor(ex, profile.goal, training),
      focus: m,
      target: t.target,
      injuryPct: t.injuryPct,
      warmup: warmup.length ? warmup : undefined,
    };
    const cost = itemSeconds(item) + (items.length ? item.restSec : 0);
    if (total + cost > budget) return false;
    total += cost;
    for (const p of ex.primary) warmed.add(p);
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

  // Leftover time: an extra set on the earliest exercises, priority muscles first. A set count the
  // lifter chose is kept as it is.
  const fixed = (id: string) => (training?.exercises?.[id]?.sets ?? training?.sets) !== undefined;
  for (const item of [...items].sort((a, b) => Number(prio.has(b.focus)) - Number(prio.has(a.focus)))) {
    if (fixed(item.exerciseId)) continue;
    const ex = EXERCISE_BY_ID.get(item.exerciseId)!;
    const extra = setSeconds(ex, item.target.reps) + item.restSec;
    if (item.sets < 5 && !week.deload && call !== "recover" && !item.injuryPct && total + extra <= budget) {
      item.sets += 1;
      total += extra;
    }
  }

  items.sort((a, b) => order(EXERCISE_BY_ID.get(a.exerciseId)!, EXERCISE_BY_ID.get(b.exerciseId)!));
  applyCall(items, call, challenge && call === "push" && !week.deload, gym);
  // Sorting and the day's call change which lift comes first and its weight, so the warm-ups are
  // worked out again in the final order. If that tips the plan over the time asked for, extra
  // sets come off the end first.
  const final = withWarmups(items, gym, (id) => EXERCISE_BY_ID.get(id)!);
  for (let i = final.length - 1; i >= 0 && planSeconds(final) > budget;) {
    if (final[i]!.sets > 2) final[i] = { ...final[i]!, sets: final[i]!.sets - 1 };
    else i--;
  }
  const est = planSeconds(final);
  return { gymId: gym.id, minutes, estMinutes: Math.round(est / 60), week, call, challenge: final.some((i) => i.challenge), items: final };
}

/** Today's target for an exercise after any injury: the usual one, or lighter when the lifter chose that. */
export function injuredTarget(ex: Exercise, t: Target, hurt: readonly Injury[], gym: Gym): { target: Target; injuryPct?: number } {
  const eff = effectFor(ex, hurt);
  if (eff?.action !== "light") return { target: t };
  return { target: lighten(t, ex, eff.pct, gym), injuryPct: eff.pct };
}

/**
 * Injuries on a plan built elsewhere (a fixed program day or a saved routine): exercises an injury
 * skips are swapped for the closest one that isn't skipped (keeping the program lift's sets and reps),
 * or dropped; lighter ones are scaled, set by set. The adaptive plan does this as it picks.
 */
export function injuryPass(plan: Plan, events: readonly AppEvent[], profile: Profile, gym: Gym, now: number): Plan {
  const hurt = activeInjuries(events, now);
  if (!hurt.length) return plan;
  const items: PlanItem[] = [];
  for (const item of plan.items) {
    let ex = EXERCISE_BY_ID.get(item.exerciseId)!;
    let next: PlanItem = item;
    if (effectFor(ex, hurt)?.action === "skip") {
      const alt = alternatives(
        ex.id,
        gym,
        [...items, ...plan.items].map((i) => i.exerciseId),
        hurt,
      ).find((e) => !LADDER_ONLY.has(e.id));
      if (!alt) continue;
      ex = alt;
      const t = target(alt, events, profile, gym, now);
      next = {
        ...item,
        exerciseId: alt.id,
        target: { ...t, reps: item.target.reps, note: item.target.note },
        warmup: undefined,
        setTargets: item.setTargets?.map((x) => ({ ...x, weight: t.weight })),
      };
    }
    const eff = effectFor(ex, hurt);
    if (eff?.action === "light") {
      const lit = (w: number, reps: number) => lighten({ weight: w, reps, rir: next.target.rir, note: "" }, ex, eff.pct, gym);
      next = {
        ...next,
        target: lighten(next.target, ex, eff.pct, gym),
        setTargets: next.setTargets?.map((x) => ({
          ...x,
          weight: lit(x.weight, x.reps).weight,
          reps: lit(x.weight, x.reps).reps,
          amrap: undefined,
        })),
        injuryPct: eff.pct,
        challenge: undefined,
        warmup: undefined,
      };
    }
    items.push(next);
  }
  return { ...plan, items, challenge: items.some((i) => i.challenge) };
}

/** Turns the day's call into the plan: easy days drop a set and a step of load, push days go one rep closer to failure on the first lift. */
function applyCall(items: PlanItem[], call: Call, challenge: boolean, gym: Gym) {
  if (call === "recover") {
    for (const item of items) {
      const ex = EXERCISE_BY_ID.get(item.exerciseId)!;
      item.sets = Math.max(2, item.sets - 1);
      if (item.injuryPct) continue; // already lighter for the injury
      if (ex.load === "bodyweight" || TIMED.has(ex.id))
        item.target = { ...item.target, reps: Math.max(3, item.target.reps - 2), rir: item.target.rir + 1, note: t("note.easyReps") };
      else
        item.target = {
          ...item.target,
          weight: stepLoad(item.target.weight, -1, ex, gym),
          rir: item.target.rir + 1,
          note: t("note.easyLighter"),
        };
    }
    return;
  }
  if (call !== "push") return;
  // Never push or challenge an exercise kept lighter for an injury.
  const first = items.find((i) => EXERCISE_BY_ID.get(i.exerciseId)!.compound && !TIMED.has(i.exerciseId) && !i.injuryPct);
  if (!first) return;
  if (first.target.rir > 0) first.target = { ...first.target, rir: first.target.rir - 1, note: `${first.target.note} · ${t("note.push")}` };
  if (challenge) {
    first.challenge = true;
    first.target = { ...first.target, note: t("note.challenge") };
  }
}

/**
 * Swaps for an exercise: same main muscles, doable at this gym, best match first. With active injuries,
 * exercises they skip are left out and ones that avoid the injured area come first.
 */
export function alternatives(exerciseId: string, gym: Gym | null, skip: readonly string[] = [], hurt: readonly Injury[] = []): Exercise[] {
  const ex = EXERCISE_BY_ID.get(exerciseId);
  if (!ex) return [];
  const pool = gym ? available(gym.equipment) : [...EXERCISE_BY_ID.values()];
  const eff = (e: Exercise) => effectFor(e, hurt);
  return pool
    .filter((e) => e.id !== ex.id && !skip.includes(e.id) && e.primary.some((m) => ex.primary.includes(m)) && eff(e)?.action !== "skip")
    .map((e) => {
      const shared =
        e.primary.filter((m) => ex.primary.includes(m)).length * 3 + e.secondary.filter((m) => ex.secondary.includes(m)).length;
      const clear = hurt.length && !eff(e) ? 10 : 0;
      return { e, s: shared + (e.pattern === ex.pattern ? 2 : 0) + (e.compound === ex.compound ? 1 : 0) + clear };
    })
    .sort((a, b) => b.s - a.s || a.e.name.localeCompare(b.e.name))
    .map((x) => x.e);
}
