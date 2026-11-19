import { t } from "./i18n";
import { lighten } from "./injury";
import type { Target } from "./progression";
import type { Exercise, Gym, Profile } from "./types";

// Pregnancy and postpartum mode (Melvin, 2026-11-19, gap analysis item 10). Like injury mode, it changes the plan
// rather than adding a screen: some exercises are left out, loads come down and every set stays well short of
// failure, by the week of pregnancy or the weeks since birth. The rules follow the 2019 Canadian guideline for
// physical activity in pregnancy (SOGC/CSEP), ACOG's Committee Opinion 804 (2020) and the 2019 return-to-running
// guidance after birth: keep training if you were, no lying flat on your back or on your belly once the bump grows,
// no jumping later in pregnancy, no all-out sets, and a gradual return after birth with no running or jumping
// before about 12 weeks. None of it is medical advice, and every screen says so. docs/decisions/pregnancy.md.

const DAY = 86_400_000;
export const WEEK = 7 * DAY;
/** Weeks from the start of pregnancy (last period) to the due date. */
export const TERM_WEEKS = 40;
/** A due date this many weeks past with no birth logged counts as a birth on the due date. */
const LATE_WEEKS = 2;

/** What a phase leaves out: lying on the back, lying on the belly, jumps, running, and crunch-style core work. */
export type Avoid = "back" | "belly" | "jump" | "run" | "crunch";

export type Phase = "early" | "middle" | "late" | "rest" | "rebuild" | "build" | "settle";

export interface BodyMode {
  kind: "pregnant" | "postpartum";
  /** Week of pregnancy (from the last period, as a midwife counts it) or whole weeks since birth. */
  week: number;
  phase: Phase;
  /** Share of the usual load (100 keeps it, with more reps in reserve). */
  pct: number;
  /** Fewest reps left in the tank on every set. */
  minRir: number;
  /** Most working sets per exercise. */
  maxSets: number;
  avoid: readonly Avoid[];
  /** Week the next phase starts (same counting as `week`), or undefined in the last one. */
  nextAt?: number;
}

type PhaseRule = Omit<BodyMode, "kind" | "week" | "nextAt"> & { until: number };

const ALL: readonly Avoid[] = ["back", "belly", "jump", "crunch"];

/** Pregnancy, by week. A new phase starts at `until`. */
const PREGNANT: readonly PhaseRule[] = [
  { phase: "early", until: 14, pct: 100, minRir: 2, maxSets: 4, avoid: [] },
  { phase: "middle", until: 28, pct: 90, minRir: 3, maxSets: 3, avoid: ALL },
  { phase: "late", until: Infinity, pct: 80, minRir: 3, maxSets: 3, avoid: ALL },
];

/** After birth, by weeks since. A C-section adds two weeks to the first two phases. */
function postpartumRules(csection: boolean): PhaseRule[] {
  const add = csection ? 2 : 0;
  return [
    { phase: "rest", until: 6 + add, pct: 50, minRir: 4, maxSets: 2, avoid: ["jump", "run", "crunch"] },
    { phase: "rebuild", until: 12 + add, pct: 70, minRir: 3, maxSets: 3, avoid: ["jump", "run", "crunch"] },
    { phase: "build", until: 16 + add, pct: 85, minRir: 2, maxSets: 4, avoid: [] },
    { phase: "settle", until: Infinity, pct: 90, minRir: 2, maxSets: 5, avoid: [] },
  ];
}

/** The saved setting: when it was agreed to, the due date, and the birth once the baby's here (all ms, start of a day). */
export type PregnancySetting = NonNullable<Profile["pregnancy"]>;

/** Where the lifter is now, or null with the mode off. A due date long past counts as a birth on that date. */
export function bodyMode(profile: Pick<Profile, "pregnancy">, now: number): BodyMode | null {
  const p = profile.pregnancy;
  if (!p?.consentAt) return null;
  const birth = p.birth ?? (p.due !== undefined && now >= p.due + LATE_WEEKS * WEEK ? p.due : undefined);
  if (birth !== undefined) {
    const week = Math.max(0, Math.floor((now - birth) / WEEK));
    return pick("postpartum", week, postpartumRules(!!p.csection));
  }
  if (p.due === undefined) return null;
  const week = Math.max(1, Math.floor((now - (p.due - TERM_WEEKS * WEEK)) / WEEK));
  return pick("pregnant", week, PREGNANT);
}

function pick(kind: BodyMode["kind"], week: number, rules: readonly PhaseRule[]): BodyMode {
  const i = rules.findIndex((r) => week < r.until);
  const r = rules[i]!;
  const { until, ...rest } = r;
  return { kind, week, ...rest, nextAt: Number.isFinite(until) ? until : undefined };
}

/** The due date for "this many weeks along", today. */
export function dueFromWeeks(weeks: number, today: number): number {
  return today + (TERM_WEEKS - weeks) * WEEK;
}

/** The birth date for "this many weeks since birth", today. */
export function birthFromWeeks(weeks: number, today: number): number {
  return today - weeks * WEEK;
}

// ---- Which exercises each kind of avoid covers. Lists by id, so an exercise's English text never decides it;
// pregnancy.test.ts checks every exercise whose setup says it's done lying on the back or face down is listed.

/** Lying flat on the back (benches, the floor). Inclines, side-lying and hip thrusts with the upper back on a bench stay. */
export const ON_BACK: ReadonlySet<string> = new Set([
  "bench-press",
  "close-grip-bench",
  "db-bench-press",
  "skull-crusher",
  "glute-bridge",
  "dead-bug",
  "kb-turkish-get-up",
  "kb-floor-press",
  "hollow-hold",
  "v-up",
  "crunch",
  "bicycle-crunch",
  "lying-leg-raise",
  "single-leg-glute-bridge",
  "smith-bench-press",
  "barbell-floor-press",
  "decline-bench-press",
  "spoto-press",
  "barbell-glute-bridge",
  "ez-skull-crusher",
  "db-pullover",
  "db-skull-crusher",
  "db-floor-press",
  "db-neutral-press",
  "db-single-arm-bench",
  "wide-grip-bench",
  "paused-bench",
  "kb-skull-crusher",
  "db-crush-press",
  "barbell-pullover",
  "kb-pullover",
  "slider-leg-curl",
  "frog-pump",
  "feet-up-glute-bridge",
  "marching-glute-bridge",
  "reverse-crunch",
  "heel-tap",
  "flutter-kicks",
  "scissor-kicks",
  "sit-up",
  "db-crunch",
  "oblique-crunch",
  "kb-dead-bug",
  "db-reverse-grip-press",
  "kb-single-arm-bench-press",
  "cable-bench-press",
  "lying-cable-curl",
  "close-grip-floor-press",
  "db-glute-bridge",
  "glute-bridge-hold",
  "hamstring-walkout",
  "weighted-dead-bug",
  "toe-touch-crunch",
  "jackknife",
  "single-leg-v-up",
  "dead-bug-hold",
  "med-ball-sit-up-throw",
  "db-alternating-bench-press",
  "db-one-arm-floor-press",
  "db-paused-bench-press",
  "tempo-bench-press",
  "reverse-grip-bench-press",
  "smith-floor-press",
  "db-chest-circle",
  "db-floor-skull-crusher",
  "db-cross-body-extension",
  "band-glute-bridge",
  "smith-glute-bridge",
  "db-single-leg-glute-bridge",
  "db-frog-pump",
  "kb-glute-bridge",
  "glute-bridge-walkout",
  "single-leg-hamstring-bridge",
  "ball-squeeze-bridge",
  "adductor-ball-squeeze",
  "med-ball-v-up",
  "med-ball-crunch",
  "med-ball-dead-bug",
  "db-pullover-crunch",
  "db-hollow-hold",
  "db-overhead-sit-up",
  "heel-slide",
  "single-leg-lower",
  "hip-lift",
  "sit-up-twist",
  "db-dead-bug-pullover",
  "kb-arm-bar",
  "kb-half-get-up",
  "hollow-rock",
  "dragon-flag",
  "bench-leg-raise",
  "bench-reverse-crunch",
  "butterfly-sit-up",
  "weighted-sit-up",
]);

/** Lying on the belly, on the floor or on a bench or pad. */
export const ON_BELLY: ReadonlySet<string> = new Set([
  "lying-leg-curl",
  "chest-supported-row",
  "back-extension",
  "superman",
  "seal-row",
  "db-y-raise",
  "db-chest-supported-row",
  "db-reverse-fly-incline",
  "incline-y-raise",
  "prone-t-raise",
  "reverse-snow-angel",
  "prone-cobra",
  "reverse-hyper-bench",
  "spider-curl",
  "db-spider-curl",
  "band-leg-curl",
  "db-lying-leg-curl",
  "chest-supported-rear-delt-row",
  "prone-w-raise",
  "prone-y-raise",
  "incline-t-raise",
  "one-arm-incline-row",
  "incline-db-shrug",
  "superman-hold",
  "prone-leg-lift",
  "prone-w-pull",
  "prone-snow-angel",
  "bench-reverse-hyper",
]);

/** Jumps, hops, bounds and burpees: both feet leave the floor and land. */
export const JUMPS: ReadonlySet<string> = new Set([
  "clap-push-up",
  "burpee",
  "jumping-jacks",
  "jump-squat",
  "box-jump",
  "jumping-lunge",
  "jump-rope",
  "double-unders",
  "pogo-hops",
  "broad-jump",
  "skater-jumps",
  "tuck-jump",
  "star-jump",
  "plank-jack",
  "pogo-jumps",
  "lateral-bound",
  "depth-jump",
  "single-leg-hop",
  "trap-bar-jump",
  "burpee-broad-jump",
  "burpee-box-jump",
  "burpee-pull-up",
  "half-burpee",
  "lateral-burpee",
  "seal-jack",
  "cross-jack",
  "squat-jack",
  "plank-to-squat",
  "frog-jump",
  "in-and-out-jumps",
  "jump-rope-high-knees",
  "jump-rope-single-leg",
  "db-devil-press",
  "db-jump-squat",
  "kb-jump-squat",
  "barbell-jump-squat",
  "single-leg-box-jump",
  "jump-rope-crossover",
  "jump-rope-boxer-skip",
  "battle-rope-jumping-jack",
  "squat-jump-180",
  "lateral-hop",
  "single-leg-lateral-hop",
  "seated-box-jump",
  "lateral-box-jump",
  "line-hops",
  "burpee-tuck-jump",
  "kb-burpee-deadlift",
  "med-ball-burpee",
  "squat-thrust",
  "sprawl",
  "power-skip",
]);

/** Running and sprinting (walking, cycling, rowing and the cross trainer stay). */
export const RUNS: ReadonlySet<string> = new Set([
  "treadmill-run",
  "outdoor-run",
  "shuttle-run",
  "sprint",
  "treadmill-sprint",
  "hill-sprint",
  "stair-run",
  "sled-sprint",
  "incline-treadmill-run",
  "jog-in-place",
  "treadmill-intervals",
  "high-knees",
  "butt-kicks",
  "skipping-drill",
  "fast-feet",
]);

/** Crunches, sit-ups, leg raises, rollouts and levers: core work that bulges the belly forward. Planks and dead bugs stay. */
export const CRUNCHES: ReadonlySet<string> = new Set([
  "cable-crunch",
  "ab-wheel",
  "hanging-leg-raise",
  "toes-to-bar",
  "hollow-hold",
  "v-up",
  "crunch",
  "bicycle-crunch",
  "lying-leg-raise",
  "reverse-crunch",
  "hollow-rock",
  "sit-up",
  "decline-sit-up",
  "db-crunch",
  "oblique-crunch",
  "ring-rollout",
  "barbell-rollout",
  "weighted-sit-up",
  "cable-oblique-crunch",
  "standing-cable-crunch",
  "decline-crunch",
  "toe-touch-crunch",
  "jackknife",
  "single-leg-v-up",
  "bench-leg-raise",
  "bench-reverse-crunch",
  "med-ball-sit-up-throw",
  "ring-fallout",
  "standing-ab-rollout",
  "ab-wheel-side-rollout",
  "med-ball-v-up",
  "med-ball-wall-sit-up",
  "med-ball-crunch",
  "cable-reverse-crunch",
  "db-pullover-crunch",
  "db-hollow-hold",
  "db-overhead-sit-up",
  "sit-up-twist",
  "butterfly-sit-up",
  "dip-bar-leg-raise",
  "flutter-kicks",
  "scissor-kicks",
  "heel-tap",
  "single-leg-lower",
  "hip-lift",
  "dragon-flag",
  "l-sit",
  "tuck-l-sit",
  "ring-l-sit",
  "l-sit-pull-up",
  "body-saw",
  "slider-pike",
  "plank-to-pike",
  "ring-knee-tuck",
  "slider-knee-tuck",
]);

const LISTS: Record<Avoid, ReadonlySet<string>> = { back: ON_BACK, belly: ON_BELLY, jump: JUMPS, run: RUNS, crunch: CRUNCHES };

/** Why the mode leaves this exercise out today, or null when it stays. */
export function modeAvoids(ex: Pick<Exercise, "id">, mode: BodyMode | null): Avoid | null {
  if (!mode) return null;
  return mode.avoid.find((a) => LISTS[a].has(ex.id)) ?? null;
}

/** Exercise ids the mode leaves out today. */
export function modeSkipped(exercises: readonly Exercise[], mode: BodyMode | null): Set<string> {
  if (!mode?.avoid.length) return new Set();
  return new Set(exercises.filter((e) => modeAvoids(e, mode)).map((e) => e.id));
}

/**
 * Today's target in the mode: the load at the phase's share (rounded down to one the gym can make, reps for bodyweight
 * and timed work) with at least the phase's reps in reserve, and a note that says why. `pct` is set when the load came
 * down, so progression and new bests leave those sets out, as they do for an injury.
 */
export function modeTarget(tg: Target, ex: Exercise, mode: BodyMode, gym: Gym, shown = mode.pct): { target: Target; pct?: number } {
  const vars = { week: mode.week, pct: shown, rir: mode.minRir };
  const note = t(mode.kind === "pregnant" ? (mode.pct < 100 ? "preg.note.pregnant" : "preg.note.early") : "preg.note.postpartum", vars);
  if (mode.pct >= 100) return { target: { ...tg, rir: Math.max(tg.rir, mode.minRir), note } };
  const lit = lighten(tg, ex, mode.pct, gym);
  return { target: { ...lit, rir: Math.max(lit.rir, mode.minRir), note }, pct: mode.pct };
}
