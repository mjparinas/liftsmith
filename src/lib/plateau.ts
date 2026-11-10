import { blockWeek } from "./block";
import { exercise, EXERCISE_BY_ID } from "./exercises";
import { alternatives, restFor, type Plan } from "./generator";
import { t } from "./i18n";
import { roundLoad } from "./loads";
import { epley, repRange, sessionsOf, target, TIMED, weightFor } from "./progression";
import type { AppEvent, Gym, Profile, SetEvent } from "./types";

// Plateau detective (Melvin picked it, 2026-11-09). When a lift's estimated one-rep max hasn't moved
// for three weeks or more, look through the lifter's own data for the likely reason, say what we
// found with the numbers behind it, and offer a three-week fix that changes the plan. Afterwards we
// check whether it worked. Other apps just draw a flat line.

const DAY = 86400_000;
const WEEK = 7 * DAY;
/** A lift counts as stalled after this long without a new best. */
export const STALL_MS = 3 * WEEK;
/** How long a fix runs. */
export const FIX_MS = 3 * WEEK;

export type FixKind = "reset" | "reps" | "volume" | "rest" | "variation";

export interface PlateauFix {
  exerciseId: string;
  kind: FixKind;
  startedAt: number;
  until: number;
  /** Best estimated one-rep max (kg) when the fix started, to check whether it worked. */
  from: number;
  /** For a variation: the exercise used instead. */
  swapTo?: string;
}

export interface Cause {
  kind: "missed" | "volume" | "rest" | "hard" | "readiness" | "sameReps" | "none";
  /** What we saw, with the numbers. */
  text: string;
  fix: FixKind;
}

export interface Plateau {
  exerciseId: string;
  /** Weeks since the last best. */
  weeks: number;
  /** Best estimated one-rep max, kg. */
  best: number;
  bestAt: number;
  causes: Cause[];
  /** The fix we suggest (from the strongest cause). */
  fix: FixKind;
}

/** Each fix's name and what it does, translated on each read. */
const fixText = (k: FixKind) => ({
  get title() {
    return t(`fix.${k}`);
  },
  get what() {
    return t(`fix.${k}.what`);
  },
});
export const FIX_TEXT: Record<FixKind, { title: string; what: string }> = {
  reset: fixText("reset"),
  reps: fixText("reps"),
  volume: fixText("volume"),
  rest: fixText("rest"),
  variation: fixText("variation"),
};

/** Best estimated one-rep max per session for a lift, oldest first (sets with no load are left out). */
function series(events: readonly AppEvent[], exerciseId: string): { at: number; e1: number; sets: SetEvent[] }[] {
  return sessionsOf(events, exerciseId)
    .map((sets) => ({ at: sets[0]!.at, e1: Math.max(...sets.map((s) => (s.weight > 0 ? epley(s.weight, s.reps) : 0))), sets }))
    .filter((s) => s.e1 > 0)
    .reverse();
}

export function findPlateaus(events: readonly AppEvent[], profile: Profile, now: number, fixes: readonly PlateauFix[] = []): Plateau[] {
  const out: Plateau[] = [];
  const ids = new Set(events.filter((e): e is SetEvent => e.type === "set").map((e) => e.exerciseId));
  for (const id of ids) {
    const ex = EXERCISE_BY_ID.get(id);
    if (!ex || ex.load === "bodyweight" || TIMED.has(id)) continue;
    // Already being fixed (or fixed recently): leave it alone.
    if (fixes.some((f) => f.exerciseId === id && now < f.until + WEEK)) continue;
    const s = series(events, id);
    if (s.length < 5) continue;
    const recent = s.filter((x) => x.at >= now - STALL_MS);
    // Still training it: at least 2 sessions in the stall window and one in the last 2 weeks.
    if (recent.length < 2 || recent.at(-1)!.at < now - 2 * WEEK) continue;
    // The last real improvement: the first session that came within 1% of the all-time best.
    const best = Math.max(...s.map((x) => x.e1));
    const bestAt = s.find((x) => x.e1 >= best / 1.01)!.at;
    if (now - bestAt < STALL_MS) continue;
    // A deload week isn't a plateau.
    if (blockWeek(profile, now).deload) continue;
    const since = s.filter((x) => x.at > bestAt);
    if (since.length < 2) continue;
    const causes = diagnose(events, profile, id, since, bestAt, now);
    out.push({ exerciseId: id, weeks: Math.floor((now - bestAt) / WEEK), best, bestAt, causes, fix: causes[0]!.fix });
  }
  return out.sort((a, b) => b.weeks - a.weeks);
}

function diagnose(
  events: readonly AppEvent[],
  profile: Profile,
  id: string,
  since: { at: number; sets: SetEvent[] }[],
  from: number,
  now: number,
): Cause[] {
  const ex = exercise(id);
  const sets = since.flatMap((x) => x.sets);
  const causes: (Cause & { weight: number })[] = [];

  const missed = sets.filter((s) => !s.challenge && s.reps < s.targetReps).length;
  const missShare = missed / Math.max(1, sets.filter((s) => !s.challenge).length);
  if (missShare >= 0.3)
    causes.push({ kind: "missed", fix: "reset", weight: missShare * 3, text: t("cause.missed", { missed, count: sets.length }) });

  const hard = events.filter((e) => e.type === "feedback" && e.exerciseId === id && e.at > from && e.rating < 0).length;
  if (hard >= 2) causes.push({ kind: "hard", fix: "reset", weight: 1 + hard * 0.4, text: t("cause.hard", { count: hard }) });

  // Weekly hard sets for the main muscle against this block's target.
  const weeks = Math.max(1, Math.round((now - from) / WEEK));
  const muscle = ex.primary[0]!;
  let musc = 0;
  for (const e of events) {
    if (e.type !== "set" || e.at <= from) continue;
    const x = EXERCISE_BY_ID.get(e.exerciseId);
    if (x?.primary.includes(muscle)) musc += 1;
    else if (x?.secondary.includes(muscle)) musc += 0.5;
  }
  const perWeek = musc / weeks;
  const want = blockWeek(profile, now).setsPerMuscle;
  if (perWeek < want * 0.7)
    causes.push({
      kind: "volume",
      fix: "volume",
      weight: 1.5 * (1 - perWeek / want) + 0.5,
      text: t("cause.volume", { sets: Math.round(perWeek), want }),
    });

  const rests = sets.map((s) => s.restSec).filter((r): r is number => typeof r === "number" && r > 0);
  const planned = restFor(ex, profile.goal);
  if (rests.length >= 3) {
    const avg = rests.reduce((a, b) => a + b, 0) / rests.length;
    if (avg < planned * 0.75)
      causes.push({ kind: "rest", fix: "rest", weight: 1.2, text: t("cause.rest", { sec: Math.round(avg), planned }) });
  }

  const reads = events
    .filter((e) => e.type === "sessionStart" && e.at > from && typeof e.readiness === "number")
    .map((e) => (e.type === "sessionStart" ? e.readiness! : 0));
  if (reads.length >= 3) {
    const avg = reads.reduce((a, b) => a + b, 0) / reads.length;
    if (avg < 42) causes.push({ kind: "readiness", fix: "reset", weight: 1, text: t("cause.readiness", { avg: Math.round(avg) }) });
  }

  const ranges = new Set(sets.map((s) => s.targetReps));
  const [lo, hi] = repRange(ex, profile.goal);
  if (since.length >= 4 && [...ranges].every((r) => r >= lo && r <= hi))
    causes.push({ kind: "sameReps", fix: "reps", weight: 0.8, text: t("cause.sameReps", { lo, hi }) });

  causes.sort((a, b) => b.weight - a.weight);
  if (!causes.length) return [{ kind: "none", fix: "variation", text: t("cause.none") }];
  return causes.map((c) => ({ kind: c.kind, text: c.text, fix: c.fix }));
}

/** Starts a fix for a plateau. */
export function startFix(p: Plateau, kind: FixKind, gym: Gym | null, now: number): PlateauFix {
  const swapTo = kind === "variation" ? alternatives(p.exerciseId, gym).find((e) => e.load !== "bodyweight")?.id : undefined;
  return { exerciseId: p.exerciseId, kind, startedAt: now, until: now + FIX_MS, from: p.best, swapTo };
}

/** Fixes still running today. */
export function activeFixes(fixes: readonly PlateauFix[] | undefined, now: number): PlateauFix[] {
  return (fixes ?? []).filter((f) => now >= f.startedAt && now < f.until);
}

/** How a finished fix went: the best since it started against where it was. */
export function fixResult(f: PlateauFix, events: readonly AppEvent[]): { gain: number; worked: boolean } | null {
  const after = series(events, f.exerciseId).filter((x) => x.at >= f.startedAt);
  if (!after.length) return null;
  const best = Math.max(...after.map((x) => x.e1));
  const gain = best / f.from - 1;
  return { gain, worked: gain > 0.005 };
}

/**
 * Applies running fixes to a freshly generated plan. Kept outside the generator so the plan logic
 * stays one thing: the generator decides what to train, a fix only adjusts how.
 */
export function applyFixes(
  plan: Plan,
  fixes: readonly PlateauFix[] | undefined,
  events: readonly AppEvent[],
  profile: Profile,
  gym: Gym,
  now: number,
): Plan {
  const live = activeFixes(fixes, now);
  if (!live.length || plan.week.deload) return plan;
  const items = plan.items.map((item) => {
    const f = live.find((x) => x.exerciseId === item.exerciseId);
    if (!f) return item;
    const ex = exercise(item.exerciseId);
    switch (f.kind) {
      case "volume":
        return { ...item, sets: Math.min(5, item.sets + 1), target: { ...item.target, note: `${item.target.note} · ${t("note.fixSet")}` } };
      case "rest":
        return { ...item, restSec: item.restSec + 60, target: { ...item.target, note: `${item.target.note} · ${t("note.fixRest")}` } };
      case "reset": {
        // Only the first session of the fix drops; double progression rebuilds from there.
        const doneSince = sessionsOf(events, ex.id).some((s) => s[0]!.at >= f.startedAt);
        if (doneSince) return item;
        const kg = roundLoad(
          f.from > 0 ? weightFor(f.from * 0.9, item.target.reps, item.target.rir) : item.target.weight * 0.9,
          ex,
          gym,
        ).kg;
        return {
          ...item,
          target: { ...item.target, weight: Math.min(kg, item.target.weight), note: t("note.fixReset") },
        };
      }
      case "reps": {
        const [lo] = repRange(ex, profile.goal);
        const reps = lo <= 6 ? 10 : 5;
        const recent = sessionsOf(events, ex.id)[0];
        const e1 = recent ? Math.max(...recent.map((s) => epley(s.weight, s.reps))) : f.from;
        const kg = roundLoad(weightFor(e1, reps, item.target.rir), ex, gym).kg;
        return { ...item, target: { ...item.target, weight: kg, reps, note: t("note.fixReps", { reps }) } };
      }
      case "variation": {
        if (!f.swapTo || plan.items.some((i) => i.exerciseId === f.swapTo)) return item;
        const alt = EXERCISE_BY_ID.get(f.swapTo);
        if (!alt || !alt.needs.every((n) => gym.equipment.includes(n))) return item;
        const next = target(alt, events, profile, gym, now);
        return { ...item, exerciseId: alt.id, target: { ...next, note: t("note.fixSwap", { name: alt.name, was: ex.name }) } };
      }
    }
  });
  return { ...plan, items };
}
