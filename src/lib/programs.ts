import type { MessageKey } from "@/locales/en";

import { blockWeek } from "./block";
import { available, exercise, EXERCISE_BY_ID, LADDER_ONLY } from "./exercises";
import { alternatives, generate, planSeconds, type Plan, type PlanItem, type SetTarget } from "./generator";
import { inSentence, t } from "./i18n";
import { layoff } from "./layoff";
import { roundLoad, stepLoad } from "./loads";
import { epley, sessionsOf, startE1rm, TIMED, weightFor } from "./progression";
import type { Call } from "./readiness";
import { MUSCLES, type AppEvent, type Equipment, type Gym, type Muscle, type PlanSource, type Profile, type SetEvent } from "./types";
import { fmtNum, fromKg, toKg } from "./units";
import { withWarmups } from "./warmup";

// Built-in programs (Melvin, 2026-11-09). Two kinds:
//
// - Fixed programs follow their own rules exactly: the days, sets, reps, percentages and what
//   happens after a hit or a miss. Readiness and RIR blocks don't change them.
// - Splits (push/pull/legs, upper/lower) hand each day's muscles to the adaptive generator, so they
//   keep RIR blocks, deloads, recovery and the push / easy call.
//
// Nothing about a program's progress is stored. The starting weights are frozen when the program is
// picked (PlanSource.start), and every weight after that comes from replaying the logged sets of the
// program's sessions, the same way stats are derived. Each set records the program lift it counts
// for (`slot`), so a swap or a substitute exercise keeps the lift's progress.
//
// Several of the originals are trademarks (Starting Strength, 5/3/1, StrongLifts), so every program
// has a plain descriptive name and credits the original in its info text.

export type ProgramId =
  "classic-5x5" | "ramping-5x5" | "5x5-plus" | "novice-3x5" | "tiered" | "waves" | "calisthenics" | "ppl" | "upper-lower";

export interface ProgramInfo {
  id: ProgramId;
  name: string;
  /** Credit to the original, shown in the info text. */
  basedOn: string;
  /** Names people search for. */
  aka: string[];
  summary: string;
  /** How it works, in plain steps. */
  how: string[];
  daysPerWeek: number;
  level: "Beginner" | "Intermediate" | "Any level";
  /** Melvin, 2026-11-09: fixed programs are free, the adaptive splits are Pro. */
  tier: "free" | "pro";
  kind: "fixed" | "split";
  /** What the main lifts need. Missing accessories are swapped for the closest match. */
  needs: Equipment[];
}

const DATA: (Omit<ProgramInfo, "name" | "basedOn" | "summary" | "how"> & { steps: number })[] = [
  {
    id: "classic-5x5",
    aka: ["5x5", "StrongLifts 5x5", "SL 5x5"],
    steps: 4,
    daysPerWeek: 3,
    level: "Beginner",
    tier: "free",
    kind: "fixed",
    needs: ["barbell", "rack", "bench"],
  },
  {
    id: "novice-3x5",
    aka: ["Starting Strength", "SS", "3x5"],
    steps: 4,
    daysPerWeek: 3,
    level: "Beginner",
    tier: "free",
    kind: "fixed",
    needs: ["barbell", "rack", "bench"],
  },
  {
    id: "5x5-plus",
    aka: ["Ice Cream Fitness", "ICF 5x5", "ICF"],
    steps: 3,
    daysPerWeek: 3,
    level: "Beginner",
    tier: "free",
    kind: "fixed",
    needs: ["barbell", "rack", "bench"],
  },
  {
    id: "ramping-5x5",
    aka: ["Madcow 5x5", "Madcow", "Bill Starr 5x5"],
    steps: 4,
    daysPerWeek: 3,
    level: "Intermediate",
    tier: "free",
    kind: "fixed",
    needs: ["barbell", "rack", "bench"],
  },
  {
    id: "tiered",
    aka: ["GZCLP", "GZCL"],
    steps: 4,
    daysPerWeek: 4,
    level: "Beginner",
    tier: "free",
    kind: "fixed",
    needs: ["barbell", "rack", "bench"],
  },
  {
    id: "waves",
    aka: ["5/3/1", "531", "Wendler", "Boring But Big", "BBB"],
    steps: 4,
    daysPerWeek: 4,
    level: "Intermediate",
    tier: "free",
    kind: "fixed",
    needs: ["barbell", "rack", "bench"],
  },
  {
    id: "calisthenics",
    aka: ["Calisthenics", "Recommended Routine", "BWF RR", "bodyweight fitness"],
    steps: 4,
    daysPerWeek: 3,
    level: "Any level",
    tier: "free",
    kind: "fixed",
    needs: ["pullupBar"],
  },
  {
    id: "ppl",
    aka: ["PPL", "push pull legs"],
    steps: 3,
    daysPerWeek: 6,
    level: "Any level",
    tier: "pro",
    kind: "split",
    needs: [],
  },
  {
    id: "upper-lower",
    aka: ["upper lower split", "UL", "upper/lower"],
    steps: 3,
    daysPerWeek: 4,
    level: "Any level",
    tier: "pro",
    kind: "split",
    needs: [],
  },
];

/** The programs, with their text in the app's language (pgm.<id>.* in src/locales/text/pgm.ts). */
export const PROGRAMS: ProgramInfo[] = DATA.map(({ steps, ...p }) => ({
  ...p,
  get name() {
    return t(`pgm.${p.id}.name` as MessageKey);
  },
  get basedOn() {
    return t(`pgm.${p.id}.basedOn` as MessageKey);
  },
  get summary() {
    return t(`pgm.${p.id}.summary` as MessageKey);
  },
  get how() {
    return Array.from({ length: steps }, (_, i) => t(`pgm.${p.id}.how${i + 1}` as MessageKey));
  },
}));

export const PROGRAM_BY_ID: ReadonlyMap<string, ProgramInfo> = new Map(PROGRAMS.map((p) => [p.id, p]));

/** The order the picker lists programs in: Pro programs first, each group keeping PROGRAMS' order (Melvin, 2026-11-10). */
export const PICKER_ORDER: readonly ProgramInfo[] = [
  ...PROGRAMS.filter((p) => p.tier === "pro"),
  ...PROGRAMS.filter((p) => p.tier !== "pro"),
];

// ---------------------------------------------------------------------------------------------
// Shared pieces

export interface Ctx {
  profile: Profile;
  gym: Gym;
  events: readonly AppEvent[];
  now: number;
}

/** One lift's progress. Each program uses the fields it needs. */
interface Lift {
  /** Working weight, top set or training max (kg). For ladders, the step. */
  w: number;
  fails: number;
  /** Rep scheme stage (tiered). */
  stage: number;
  /** Last weight at the first stage (tiered T2 reset). */
  base: number;
  /** Week within the wave, or reps for ladders and bodyweight assistance. */
  wk: number;
  miss: boolean;
  last?: "up" | "miss" | "reset" | "step" | "same";
}

interface State {
  /** Sessions done. */
  n: number;
  /** Day to do next. */
  next: number;
  lifts: Record<string, Lift>;
}

interface Slot {
  key: string;
  ex: string;
  sets: SetTarget[];
  rest: number;
  scheme: string;
  label?: string;
  note: string;
  rir?: number;
  /** The sets already ramp up from light, so no separate warm-up. */
  ramp?: boolean;
  /** Ladder steps may stand in for each other (calisthenics). */
  ladder?: boolean;
}

interface Day {
  name: string;
  note: string;
  slots: Slot[];
}

interface Engine {
  days: number;
  keys(ctx: Ctx): string[];
  startFor(key: string, ctx: Ctx): number;
  /** Lift state before any session, from the frozen start value. */
  fresh?(start: number, key: string, ctx: Ctx): Lift;
  build(s: State, day: number, lift: (k: string) => Lift, ctx: Ctx): Day;
  apply(s: State, day: number, sets: Map<string, SetEvent[]>, lift: (k: string) => Lift, ctx: Ctx): void;
}

const isLower = (exId: string) => {
  const ex = EXERCISE_BY_ID.get(exId);
  return !!ex && (ex.pattern === "squat" || ex.pattern === "hinge" || ex.pattern === "lunge");
};

/** A program's standard jump: 2.5 kg or 5 lb, 5 kg or 10 lb for big lower-body lifts. */
export function jump(gym: Gym, big: boolean): number {
  return gym.unit === "kg" ? (big ? 5 : 2.5) : toKg(big ? 10 : 5, "lb");
}

/** The next weight up for any kind of load. */
function up(w: number, exId: string, gym: Gym, big: boolean): number {
  const ex = exercise(exId);
  if (ex.load === "bodyweight") return 0;
  if (ex.load === "barbell") return w + jump(gym, big);
  const next = stepLoad(roundLoad(w, ex, gym).kg, 1, ex, gym);
  return next > w + 1e-6 ? next : w + jump(gym, false);
}

/** Best estimated one-rep max: recent logged sets, or the cautious estimate from setup. */
export function e1Of(exId: string, ctx: Ctx): number {
  const ex = exercise(exId);
  const past = sessionsOf(ctx.events, exId).slice(0, 3);
  if (past.length) return Math.max(...past.flat().map((s) => epley(s.weight, s.reps, s.rir ?? 0)));
  return startE1rm(ex, ctx.profile, ctx.now);
}

const W = (exId: string, ctx: Ctx, reps: number, rir: number) =>
  exercise(exId).load === "bodyweight" ? 0 : weightFor(e1Of(exId, ctx), reps, rir);

/** Every working set hit its target. */
function allHit(sets: readonly SetEvent[] | undefined, planned: number): boolean {
  return !!sets && sets.length >= planned && sets.every((s) => s.reps >= s.targetReps);
}

/**
 * The weight the next session builds on. When the lifter lifted what was planned, the exact
 * planned weight (so small jumps the plates can't make yet still add up); when they changed it on
 * the same exercise, what they actually lifted.
 */
function baseOf(l: Lift, sets: readonly SetEvent[], slotEx: string, gym: Gym): number {
  const same = sets.every((s) => s.exerciseId === slotEx);
  const changed = sets.some((s) => s.targetWeight !== undefined && Math.abs(s.weight - s.targetWeight) > 0.05);
  if (same && changed) return Math.min(...sets.map((s) => s.weight));
  // The first session back after a break was planned lighter on purpose: rebuild from there.
  if (same && sets.some((s) => s.comeback)) return Math.min(...sets.map((s) => s.targetWeight ?? s.weight));
  // The plan went well above the exact weight (an empty bar heavier than the start, or the lightest
  // dumbbell): build on what was really lifted, or the lift never moves.
  const planned = Math.min(...sets.map((s) => s.targetWeight ?? l.w));
  return same && planned > l.w + jump(gym, false) * 0.6 ? planned : l.w;
}

/** Linear progression: hit everything and go up; miss `limit` sessions in a row and drop 10%. */
function linear(l: Lift, sets: SetEvent[] | undefined, slotEx: string, planned: number, gym: Gym, big: boolean, limit = 3) {
  if (!sets?.length) return;
  const base = baseOf(l, sets, slotEx, gym);
  if (allHit(sets, planned)) {
    l.w = up(base, slotEx, gym, big);
    l.fails = 0;
    l.last = "up";
  } else if (l.fails + 1 >= limit) {
    l.w = base * 0.9;
    l.fails = 0;
    l.last = "reset";
  } else {
    l.w = base;
    l.fails += 1;
    l.last = "miss";
  }
}

function linearNote(l: Lift, limit = 3): string {
  if (l.last === "up") return t("pgm.lin.up");
  if (l.last === "miss") return t("pgm.lin.miss", { fails: l.fails, limit });
  if (l.last === "reset") return t("pgm.lin.reset");
  return t("pgm.lin.first");
}

const straight = (w: number, sets: number, reps: number, amrapLast = false): SetTarget[] =>
  Array.from({ length: sets }, (_, i) => ({ weight: w, reps, amrap: amrapLast && i === sets - 1 ? true : undefined }));

function linearSlot(key: string, l: Lift, sets: number, reps: number, rest: number, label?: string): Slot {
  return { key, ex: key, sets: straight(l.w, sets, reps), rest, scheme: `${sets} × ${reps}`, note: linearNote(l), label, rir: 2 };
}

// ---------------------------------------------------------------------------------------------
// Linear programs: Classic 5×5, Novice 3×5, 5×5 plus arms

interface LinearDef {
  days: { name: string; lifts: [ex: string, sets: number, reps: number][] }[];
  big: ReadonlySet<string>;
  /** Day index → lifts, when it changes with time (novice power cleans). */
  pick?: (s: State, day: number) => [string, number, number][] | undefined;
  accessories?: ReadonlySet<string>;
}

function linearEngine(def: LinearDef): Engine {
  const all = () => [...new Set(def.days.flatMap((d) => d.lifts.map((l) => l[0])).concat(def.pick ? ["power-clean"] : []))];
  const liftsOf = (s: State, day: number) => def.pick?.(s, day) ?? def.days[day]!.lifts;
  return {
    days: def.days.length,
    keys: all,
    startFor(key, ctx) {
      const acc = def.accessories?.has(key);
      return W(key, ctx, acc ? 8 : 5, 3);
    },
    build(s, day, lift) {
      const d = def.days[day]!;
      return {
        name: d.name,
        note: t("pgm.next", { day: def.days[(day + 1) % def.days.length]!.name }),
        slots: liftsOf(s, day).map(([ex, sets, reps]) =>
          linearSlot(
            ex,
            lift(ex),
            sets,
            reps,
            def.accessories?.has(ex) ? 90 : 180,
            def.accessories?.has(ex) ? t("pgm.accessory") : undefined,
          ),
        ),
      };
    },
    apply(s, day, sets, lift, ctx) {
      for (const [ex, n] of liftsOf(s, day)) {
        const acc = def.accessories?.has(ex);
        linear(lift(ex), sets.get(ex), ex, n, ctx.gym, def.big.has(ex), acc ? 99 : 3);
      }
    },
  };
}

const CLASSIC = linearEngine({
  days: [
    {
      get name() {
        return t("pgm.workoutA");
      },
      lifts: [
        ["back-squat", 5, 5],
        ["bench-press", 5, 5],
        ["barbell-row", 5, 5],
      ],
    },
    {
      get name() {
        return t("pgm.workoutB");
      },
      lifts: [
        ["back-squat", 5, 5],
        ["overhead-press", 5, 5],
        ["deadlift", 1, 5],
      ],
    },
  ],
  big: new Set(["deadlift"]),
});

const NOVICE = linearEngine({
  days: [
    {
      get name() {
        return t("pgm.workoutA");
      },
      lifts: [
        ["back-squat", 3, 5],
        ["bench-press", 3, 5],
        ["deadlift", 1, 5],
      ],
    },
    {
      get name() {
        return t("pgm.workoutB");
      },
      lifts: [
        ["back-squat", 3, 5],
        ["overhead-press", 3, 5],
        ["deadlift", 1, 5],
      ],
    },
  ],
  big: new Set(["back-squat", "deadlift"]),
  // After six sessions, power cleans take the deadlift's place on B.
  pick: (s, day) =>
    day === 1 && s.n >= 6
      ? [
          ["back-squat", 3, 5],
          ["overhead-press", 3, 5],
          ["power-clean", 5, 3],
        ]
      : undefined,
});

const PLUS = linearEngine({
  days: [
    {
      get name() {
        return t("pgm.workoutA");
      },
      lifts: [
        ["back-squat", 5, 5],
        ["bench-press", 5, 5],
        ["barbell-row", 5, 5],
        ["barbell-shrug", 3, 8],
        ["skull-crusher", 3, 8],
        ["barbell-curl", 3, 8],
      ],
    },
    {
      get name() {
        return t("pgm.workoutB");
      },
      lifts: [
        ["back-squat", 5, 5],
        ["deadlift", 1, 5],
        ["overhead-press", 5, 5],
        ["barbell-row", 5, 5],
        ["close-grip-bench", 3, 8],
        ["barbell-curl", 3, 8],
        ["back-extension", 2, 10],
        ["cable-crunch", 3, 10],
      ],
    },
  ],
  big: new Set(["deadlift"]),
  accessories: new Set(["barbell-shrug", "skull-crusher", "barbell-curl", "close-grip-bench", "back-extension", "cable-crunch"]),
});

// ---------------------------------------------------------------------------------------------
// Ramping 5×5

const RAMP5 = [0.5, 0.625, 0.75, 0.875, 1];
const RAMP4 = [0.625, 0.75, 0.875, 1];
const WEEKLY = 1.025;

const RAMPING: Engine = {
  days: 3,
  keys: () => ["back-squat", "bench-press", "barbell-row", "overhead-press", "deadlift"],
  // Start a little under a five-rep max, so the first new best comes in about the fourth week.
  startFor: (key, ctx) => W(key, ctx, 5, 1) * 0.93,
  build(s, day, lift) {
    const ramp = (pcts: number[], reps: number, top: number) => pcts.map((p) => ({ weight: top * p, reps }));
    const slot = (ex: string, sets: SetTarget[], scheme: string, note: string): Slot => ({
      key: ex,
      ex,
      sets,
      rest: 180,
      scheme,
      note,
      ramp: true,
      rir: 1,
    });
    const week = Math.floor(s.n / 3) + 1;
    if (day === 0) {
      return {
        name: t("pgm.heavy"),
        note: t("pgm.week", { n: week }),
        slots: ["back-squat", "bench-press", "barbell-row"].map((ex) =>
          slot(ex, ramp(RAMP5, 5, lift(ex).w), t("pgm.ramp5Scheme"), lift(ex).last === "up" ? t("pgm.topFor5") : t("pgm.ramp12")),
        ),
      };
    }
    if (day === 1) {
      const sq = lift("back-squat").w;
      return {
        name: t("pgm.light"),
        note: t("pgm.week", { n: week }),
        slots: [
          slot(
            "back-squat",
            [0.5, 0.625, 0.75, 0.75].map((p) => ({ weight: sq * p, reps: 5 })),
            t("pgm.lightScheme"),
            t("pgm.lightSquat"),
          ),
          slot("overhead-press", ramp(RAMP4, 5, lift("overhead-press").w), t("pgm.ramp4Scheme"), t("pgm.rampTop")),
          slot("deadlift", ramp(RAMP4, 5, lift("deadlift").w), t("pgm.ramp4Scheme"), t("pgm.rampTop")),
        ],
      };
    }
    return {
      name: t("pgm.top"),
      note: t("pgm.week", { n: week }),
      slots: ["back-squat", "bench-press", "barbell-row"].map((ex) => {
        const top = lift(ex).w;
        return slot(
          ex,
          [...ramp(RAMP5.slice(0, 4), 5, top), { weight: top * WEEKLY, reps: 3 }, { weight: top * 0.75, reps: 8 }],
          t("pgm.topScheme"),
          t("pgm.triple"),
        );
      }),
    };
  },
  apply(s, day, sets, lift) {
    const progress = (ex: string, planned: number) => {
      const got = sets.get(ex);
      if (!got?.length) return;
      const l = lift(ex);
      if (allHit(got, planned)) {
        l.w *= WEEKLY;
        l.last = "up";
      } else l.last = "miss";
    };
    if (day === 1) {
      progress("overhead-press", 4);
      progress("deadlift", 4);
    }
    if (day === 2) for (const ex of ["back-squat", "bench-press", "barbell-row"]) progress(ex, 6);
  },
};

// ---------------------------------------------------------------------------------------------
// Tiered progression

const T1: [sets: number, reps: number][] = [
  [5, 3],
  [6, 2],
  [10, 1],
];
const T2: [sets: number, reps: number][] = [
  [3, 10],
  [3, 8],
  [3, 6],
];
const TIER_DAYS: { t1: string; t2: string; t3: string }[] = [
  { t1: "back-squat", t2: "bench-press", t3: "lat-pulldown" },
  { t1: "overhead-press", t2: "deadlift", t3: "db-row" },
  { t1: "bench-press", t2: "back-squat", t3: "lat-pulldown" },
  { t1: "deadlift", t2: "overhead-press", t3: "db-row" },
];

const TIERED: Engine = {
  days: 4,
  keys: () => [...new Set(TIER_DAYS.flatMap((d) => [`T1:${d.t1}`, `T2:${d.t2}`, `T3:${d.t3}`]))],
  startFor(key, ctx) {
    const [tier, ex] = key.split(":") as [string, string];
    if (tier === "T3") return W(ex, ctx, 15, 5);
    const fiveRm = W(ex, ctx, 5, 0);
    return fiveRm * (tier === "T1" ? 0.85 : 0.65);
  },
  build(_s, day, lift) {
    const d = TIER_DAYS[day]!;
    const l1 = lift(`T1:${d.t1}`);
    const l2 = lift(`T2:${d.t2}`);
    const l3 = lift(`T3:${d.t3}`);
    const [s1, r1] = T1[l1.stage]!;
    const [s2, r2] = T2[l2.stage]!;
    const n1 =
      l1.last === "up"
        ? t("pgm.allUp")
        : l1.last === "step"
          ? t("pgm.stalled", { scheme: `${s1}×${r1}` })
          : l1.last === "reset"
            ? t("pgm.fresh85")
            : t("pgm.lastMax");
    const n2 =
      l2.last === "up"
        ? t("pgm.allUp")
        : l2.last === "step"
          ? t("pgm.stalled", { scheme: `${s2}×${r2}` })
          : l2.last === "reset"
            ? t("pgm.back310")
            : t("pgm.steadyReserve");
    return {
      name: t("pgm.day", { n: day + 1 }),
      note: t("pgm.liftDay", { name: exercise(d.t1).name }),
      slots: [
        {
          key: `T1:${d.t1}`,
          ex: d.t1,
          sets: straight(l1.w, s1, r1, true),
          rest: 180,
          scheme: `${s1} × ${r1}+`,
          label: "T1",
          note: n1,
          rir: 1,
        },
        { key: `T2:${d.t2}`, ex: d.t2, sets: straight(l2.w, s2, r2), rest: 120, scheme: `${s2} × ${r2}`, label: "T2", note: n2, rir: 2 },
        {
          key: `T3:${d.t3}`,
          ex: d.t3,
          sets: straight(l3.w, 3, 15, true),
          rest: 75,
          scheme: "3 × 15+",
          label: "T3",
          note: l3.last === "up" ? t("pgm.t3up") : t("pgm.t3rule"),
          rir: 1,
        },
      ],
    };
  },
  apply(_s, day, sets, lift, ctx) {
    const d = TIER_DAYS[day]!;
    const tier = (key: string, ex: string, schemes: [number, number][], onReset: (l: Lift) => void) => {
      const got = sets.get(key);
      if (!got?.length) return;
      const l = lift(key);
      const base = baseOf(l, got, ex, ctx.gym);
      if (allHit(got, schemes[l.stage]![0])) {
        if (l.stage === 0) l.base = base;
        l.w = up(base, ex, ctx.gym, isLower(ex));
        l.last = "up";
      } else if (l.stage < schemes.length - 1) {
        if (l.stage === 0) l.base = base;
        l.stage += 1;
        l.w = base;
        l.last = "step";
      } else {
        l.stage = 0;
        onReset(l);
        l.last = "reset";
      }
    };
    tier(`T1:${d.t1}`, d.t1, T1, (l) => (l.w *= 0.85));
    tier(`T2:${d.t2}`, d.t2, T2, (l) => (l.w = l.base + (ctx.gym.unit === "kg" ? 7.5 : toKg(15, "lb"))));
    const t3 = sets.get(`T3:${d.t3}`);
    if (t3?.length) {
      const l = lift(`T3:${d.t3}`);
      const last = t3[t3.length - 1]!;
      if (last.reps >= 25) {
        l.w = up(baseOf(l, t3, d.t3, ctx.gym), d.t3, ctx.gym, false);
        l.last = "up";
      } else l.last = "same";
    }
  },
};

// ---------------------------------------------------------------------------------------------
// Training max waves

const WAVE_LIFTS = ["overhead-press", "deadlift", "bench-press", "squat"] as const;
const WAVE_EX: Record<(typeof WAVE_LIFTS)[number], string> = {
  "overhead-press": "overhead-press",
  deadlift: "deadlift",
  "bench-press": "bench-press",
  squat: "back-squat",
};
const WAVE_ASSIST: Record<(typeof WAVE_LIFTS)[number], string> = {
  "overhead-press": "chin-up",
  deadlift: "hanging-knee-raise",
  "bench-press": "db-row",
  squat: "lying-leg-curl",
};
const WAVES: { key: MessageKey; pcts: number[]; reps: number[]; amrap: boolean }[] = [
  { key: "pgm.w5", pcts: [0.65, 0.75, 0.85], reps: [5, 5, 5], amrap: true },
  { key: "pgm.w3", pcts: [0.7, 0.8, 0.9], reps: [3, 3, 3], amrap: true },
  { key: "pgm.w531", pcts: [0.75, 0.85, 0.95], reps: [5, 3, 1], amrap: true },
  { key: "pgm.wDeload", pcts: [0.4, 0.5, 0.6], reps: [5, 5, 5], amrap: false },
];

const WAVE: Engine = {
  days: 4,
  keys: () => WAVE_LIFTS.flatMap((l) => [`tm:${WAVE_EX[l]}`, `acc:${WAVE_ASSIST[l]}`]),
  startFor(key, ctx) {
    const [kind, ex] = key.split(":") as [string, string];
    if (kind === "tm") return 0.9 * e1Of(ex, ctx);
    return exercise(ex).load === "bodyweight" ? 5 : W(ex, ctx, 10, 3);
  },
  fresh(start, key) {
    // Bodyweight assistance keeps its reps in `wk`, starting at 5.
    const bw = key.startsWith("acc:") && exercise(key.slice(4)).load === "bodyweight";
    return { w: bw ? 0 : start, fails: 0, stage: 0, base: start, wk: bw ? Math.round(start) : 0, miss: false };
  },
  build(s, day, lift, ctx) {
    const name = WAVE_LIFTS[day]!;
    const ex = WAVE_EX[name];
    const l = lift(`tm:${ex}`);
    const w = WAVES[l.wk]!;
    const main: SetTarget[] = w.pcts.map((p, i) => ({ weight: l.w * p, reps: w.reps[i]!, amrap: w.amrap && i === 2 ? true : undefined }));
    const deload = l.wk === 3;
    const extra: SetTarget[] = deload ? [] : straight(l.w * 0.5, 5, 10);
    const cycle = Math.floor(s.n / 16) + 1;
    const aEx = WAVE_ASSIST[name];
    const a = lift(`acc:${aEx}`);
    const bw = exercise(aEx).load === "bodyweight";
    return {
      name: t(
        { "overhead-press": "pgm.pressDay", deadlift: "pgm.deadliftDay", "bench-press": "pgm.benchDay", squat: "pgm.squatDay" }[
          name
        ] as MessageKey,
      ),
      note: t("pgm.cycle", { n: cycle, week: t(w.key) }),
      slots: [
        {
          key: `tm:${ex}`,
          ex,
          sets: [...main, ...extra],
          rest: 180,
          scheme: `${w.reps.join(", ")}${w.amrap ? "+" : ""}${extra.length ? " · 5 × 10" : ""}`,
          label: t("pgm.main"),
          note: deload
            ? t("pgm.deloadNote")
            : t(extra.length ? "pgm.tmBbb" : "pgm.tm", { weight: `${fmtNum(Math.round(fromKg(l.w, ctx.gym.unit)))} ${ctx.gym.unit}` }),
          ramp: true,
          rir: 1,
        },
        {
          key: `acc:${aEx}`,
          ex: aEx,
          sets: straight(a.w, deload ? 3 : 5, bw ? a.wk : 10),
          rest: 90,
          scheme: `${deload ? 3 : 5} × ${bw ? a.wk : 10}`,
          label: t("pgm.assist"),
          note: a.last === "up" ? t("pgm.stepUp") : t("pgm.steady"),
          rir: 2,
        },
      ],
    };
  },
  apply(_s, day, sets, lift, ctx) {
    const name = WAVE_LIFTS[day]!;
    const ex = WAVE_EX[name];
    const l = lift(`tm:${ex}`);
    const got = sets.get(`tm:${ex}`) ?? [];
    if (got.some((x) => x.amrap && x.reps < x.targetReps)) l.miss = true;
    l.wk += 1;
    if (l.wk >= 4) {
      l.w = l.miss ? l.w * 0.9 : l.w + jump(ctx.gym, isLower(ex));
      l.last = l.miss ? "reset" : "up";
      l.wk = 0;
      l.miss = false;
    }
    const aEx = WAVE_ASSIST[name];
    const a = lift(`acc:${aEx}`);
    const ag = sets.get(`acc:${aEx}`);
    if (ag?.length && allHit(ag, 5)) {
      if (exercise(aEx).load === "bodyweight") a.wk = Math.min(10, a.wk + 1);
      else a.w = up(baseOf(a, ag, aEx, ctx.gym), aEx, ctx.gym, false);
      a.last = "up";
    }
  },
};

// ---------------------------------------------------------------------------------------------
// Bodyweight skills: ladders of harder versions

export const LADDERS: { key: string; name: string; steps: string[]; timed?: boolean }[] = [
  {
    key: "pull",
    get name() {
      return t("pgm.lad.pull");
    },
    steps: ["scapular-pull", "negative-pull-up", "band-assisted-pull-up", "pull-up"],
  },
  {
    key: "squat",
    get name() {
      return t("pgm.lad.squat");
    },
    steps: ["bodyweight-squat", "split-squat", "bw-split-squat", "shrimp-squat", "pistol-squat"],
  },
  {
    key: "dip",
    get name() {
      return t("pgm.lad.dip");
    },
    steps: ["bench-dip", "negative-dip", "dip"],
  },
  {
    key: "hinge",
    get name() {
      return t("pgm.lad.hinge");
    },
    steps: ["glute-bridge", "single-leg-rdl", "nordic-curl"],
  },
  {
    key: "row",
    get name() {
      return t("pgm.lad.row");
    },
    steps: ["towel-row", "ring-row", "inverted-row"],
  },
  {
    key: "push",
    get name() {
      return t("pgm.lad.push");
    },
    steps: ["wall-push-up", "incline-push-up", "push-up", "diamond-push-up", "pseudo-planche-push-up"],
  },
  {
    key: "core-front",
    get name() {
      return t("pgm.lad.core-front");
    },
    steps: ["plank", "ab-wheel"],
  },
  {
    key: "core-side",
    get name() {
      return t("pgm.lad.core-side");
    },
    steps: ["side-plank"],
  },
  {
    key: "core-back",
    get name() {
      return t("pgm.lad.core-back");
    },
    steps: ["superman", "back-extension"],
  },
];
const LADDER_MIN = 5;
const LADDER_MAX = 8;
/** On the last step, reps keep climbing to here. */
const LADDER_CAP = 15;
const HOLD_MIN = 20;
const HOLD_MAX = 60;

const LADDER: Engine = {
  days: 1,
  keys: () => LADDERS.map((l) => `ladder:${l.key}`),
  startFor(key, ctx) {
    const lad = LADDERS.find((l) => `ladder:${l.key}` === key)!;
    const level = { new: 0, intermediate: 1, advanced: 2 }[ctx.profile.experience];
    return Math.min(lad.steps.length - 1, level);
  },
  fresh(start, key, ctx) {
    const steps = LADDERS.find((l) => `ladder:${l.key}` === key)!.steps;
    // Start on the step the gym can do nearest the one picked for the lifter's level.
    const ex = ladderStep(steps, Math.round(start), ctx.gym) ?? steps[0]!;
    return { w: steps.indexOf(ex), fails: 0, stage: 0, base: 0, wk: TIMED.has(ex) ? HOLD_MIN : LADDER_MIN, miss: false };
  },
  build(_s, _day, lift, ctx) {
    return {
      name: t("pgm.fullBody"),
      note: t("pgm.pairs"),
      slots: LADDERS.flatMap((lad) => {
        const l = lift(`ladder:${lad.key}`);
        const ex = ladderStep(lad.steps, l.w, ctx.gym);
        if (!ex) return [];
        const timed = TIMED.has(ex);
        const top = lad.steps.indexOf(ex) === lad.steps.length - 1;
        const note =
          l.last === "step"
            ? t("pgm.newStep")
            : timed
              ? t("pgm.hold", { s: l.wk })
              : top
                ? t("pgm.topLadder")
                : t("pgm.moveUp", { max: LADDER_MAX });
        return [
          {
            key: `ladder:${lad.key}`,
            ex,
            sets: straight(0, 3, l.wk),
            rest: lad.key.startsWith("core") ? 60 : 90,
            scheme: `3 × ${l.wk}${timed ? " s" : ""}`,
            label: lad.name,
            note,
            ladder: true,
            rir: 2,
          },
        ];
      }),
    };
  },
  apply(_s, _day, sets, lift, ctx) {
    for (const lad of LADDERS) {
      const key = `ladder:${lad.key}`;
      const got = sets.get(key);
      if (!got?.length) continue;
      const l = lift(key);
      // A swap to another step of the same ladder moves the lifter to that step.
      const did = lad.steps.indexOf(got[0]!.exerciseId);
      if (did >= 0 && did !== l.w) {
        l.w = did;
      }
      const ex = lad.steps[l.w]!;
      const timed = TIMED.has(ex);
      if (!allHit(got, 3)) {
        l.last = "same";
        continue;
      }
      const next = nextStep(lad.steps, l.w, ctx.gym);
      if (timed ? l.wk + 5 > HOLD_MAX : l.wk + 1 > LADDER_MAX) {
        if (next !== null) {
          l.w = next;
          l.wk = TIMED.has(lad.steps[next]!) ? HOLD_MIN : LADDER_MIN;
          l.last = "step";
          continue;
        }
        if (timed || l.wk >= LADDER_CAP) {
          l.last = "same";
          continue;
        }
      }
      l.wk += timed ? 5 : 1;
      l.last = "up";
    }
  },
};

/** The step to do: this one if the gym can, else the nearest easier one, else the nearest harder one. */
function ladderStep(steps: string[], at: number, gym: Gym): string | null {
  const ok = (i: number) => available(gym.equipment, [exercise(steps[i]!)]).length > 0;
  for (let i = Math.min(at, steps.length - 1); i >= 0; i--) if (ok(i)) return steps[i]!;
  for (let i = at + 1; i < steps.length; i++) if (ok(i)) return steps[i]!;
  return null;
}

function nextStep(steps: string[], at: number, gym: Gym): number | null {
  for (let i = at + 1; i < steps.length; i++) if (available(gym.equipment, [exercise(steps[i]!)]).length) return i;
  return null;
}

// ---------------------------------------------------------------------------------------------
// Splits

const PUSH: Muscle[] = ["chest", "frontDelts", "sideDelts", "triceps"];
const PULL: Muscle[] = ["lats", "upperBack", "rearDelts", "biceps", "forearms", "traps"];
const LEGS: Muscle[] = ["quads", "hamstrings", "glutes", "calves", "adductors", "abs", "obliques", "lowerBack"];

export const SPLITS: Record<"ppl" | "upper-lower", { name: string; muscles: Muscle[] }[]> = {
  ppl: [
    {
      get name() {
        return t("pgm.pushDay");
      },
      muscles: PUSH,
    },
    {
      get name() {
        return t("pgm.pullDay");
      },
      muscles: PULL,
    },
    {
      get name() {
        return t("pgm.legDay");
      },
      muscles: LEGS,
    },
  ],
  "upper-lower": [
    {
      get name() {
        return t("pgm.upperDay");
      },
      muscles: [...PUSH, ...PULL],
    },
    {
      get name() {
        return t("pgm.lowerDay");
      },
      muscles: LEGS,
    },
  ],
};

const ENGINES: Partial<Record<ProgramId, Engine>> = {
  "classic-5x5": CLASSIC,
  "novice-3x5": NOVICE,
  "5x5-plus": PLUS,
  "ramping-5x5": RAMPING,
  tiered: TIERED,
  waves: WAVE,
  calisthenics: LADDER,
};

// ---------------------------------------------------------------------------------------------
// Replay, planning and picking

/** The program's sessions since it was picked, oldest first, with their sets grouped by program lift. */
export function programSessions(events: readonly AppEvent[], id: string, since: number): { day: number; sets: Map<string, SetEvent[]> }[] {
  const starts = new Map<string, { at: number; day: number }>();
  const sets = new Map<string, SetEvent[]>();
  for (const e of events) {
    if (e.type === "sessionStart" && e.program?.id === id && e.at >= since) starts.set(e.sessionId, { at: e.at, day: e.program.day });
    if (e.type === "set") {
      const list = sets.get(e.sessionId) ?? [];
      list.push(e);
      sets.set(e.sessionId, list);
    }
  }
  return [...starts.entries()]
    .filter(([sid]) => sets.has(sid))
    .sort((a, b) => a[1].at - b[1].at)
    .map(([sid, s]) => {
      const by = new Map<string, SetEvent[]>();
      for (const x of sets.get(sid)!.sort((a, b) => a.at - b.at)) {
        // Sets done lighter for an injury don't move the program lift (injury.ts).
        if (x.injuryPct) continue;
        // Drop and rest-pause sets are bonus work: they aim below the plan's reps, so they'd read as a miss.
        if (x.tag) continue;
        const k = x.slot ?? x.exerciseId;
        by.set(k, [...(by.get(k) ?? []), x]);
      }
      return { day: s.day, sets: by };
    });
}

/** Where the program stands: every logged session replayed from the frozen starting weights. */
export function programState(src: Extract<PlanSource, { kind: "program" }>, ctx: Ctx): State {
  const engine = ENGINES[src.id as ProgramId];
  const s: State = { n: 0, next: 0, lifts: {} };
  if (!engine) return s;
  const lift = (k: string): Lift => {
    if (!s.lifts[k]) {
      const start = src.start[k] ?? engine.startFor(k, ctx);
      s.lifts[k] = engine.fresh?.(start, k, ctx) ?? { w: start, fails: 0, stage: 0, base: start, wk: 0, miss: false };
    }
    return s.lifts[k];
  };
  for (const done of programSessions(ctx.events, src.id, src.startedAt)) {
    const day = done.day % engine.days;
    engine.apply(s, day, done.sets, lift, ctx);
    s.n += 1;
    s.next = (day + 1) % engine.days;
  }
  // Touch every lift so a plan can read any of them.
  for (const k of engine.keys(ctx)) lift(k);
  return s;
}

/** Starting values for every lift, frozen when the program is picked. */
export function pickProgram(id: ProgramId, ctx: Ctx): PlanSource {
  const engine = ENGINES[id];
  const start: Record<string, number> = {};
  if (engine) for (const k of engine.keys(ctx)) start[k] = engine.startFor(k, ctx);
  return { kind: "program", id, startedAt: ctx.now, start };
}

/** Use `exId` at this gym, or the closest exercise it can do that isn't already in the day. */
function resolve(exId: string, gym: Gym, used: ReadonlySet<string>, ladder: boolean): string | null {
  if (!used.has(exId) && available(gym.equipment, [exercise(exId)]).length) return exId;
  const alt = alternatives(exId, gym, [...used]).find((e) => ladder || !LADDER_ONLY.has(e.id));
  return alt?.id ?? null;
}

function toItems(day: Day, gym: Gym): PlanItem[] {
  const used = new Set<string>();
  const items: PlanItem[] = [];
  for (const slot of day.slots) {
    const id = slot.ladder ? slot.ex : resolve(slot.ex, gym, used, false);
    if (!id || used.has(id)) continue;
    used.add(id);
    const ex = exercise(id);
    const orig = exercise(slot.ex);
    // A stand-in exercise starts from the planned weight scaled by how heavy each usually goes.
    const scale = id === slot.ex ? 1 : orig.start > 0 && ex.start > 0 ? ex.start / orig.start : 0;
    const sets = slot.sets.map((t) => ({ ...t, weight: ex.load === "bodyweight" ? 0 : roundLoad(t.weight * scale, ex, gym).kg }));
    const note = id === slot.ex ? slot.note : t("pgm.standIn", { name: orig.name });
    items.push({
      exerciseId: id,
      sets: sets.length,
      restSec: slot.rest,
      focus: ex.primary[0]!,
      target: { weight: sets[0]!.weight, reps: sets[0]!.reps, rir: slot.rir ?? 2, note },
      slot: slot.key,
      setTargets: sets,
      scheme: slot.scheme,
      label: slot.label,
    });
  }
  const ramps = new Set(day.slots.filter((s) => s.ramp).map((s) => s.key));
  return withWarmups(items, gym, exercise)
    .map((i) => (ramps.has(i.slot!) ? { ...i, warmup: i.warmup?.slice(0, 1) } : i))
    .map((i) => (i.warmup?.length ? i : { ...i, warmup: undefined }));
}

export interface ProgramPlanInput extends Ctx {
  src: Extract<PlanSource, { kind: "program" }>;
  call?: Call;
  challenge?: boolean;
  exclude?: readonly string[];
}

/** Today's plan from the lifter's program. */
export function programPlan({
  src,
  profile,
  gym,
  events,
  now,
  call = "normal",
  challenge = false,
  exclude,
}: ProgramPlanInput): Plan | null {
  const info = PROGRAM_BY_ID.get(src.id);
  if (!info) return null;
  const ctx: Ctx = { profile, gym, events, now };
  if (info.kind === "split") {
    const days = SPLITS[info.id as keyof typeof SPLITS];
    const done = programSessions(events, src.id, src.startedAt);
    const day = done.length ? (done[done.length - 1]!.day + 1) % days.length : 0;
    const plan = generate({ gym, profile, events, minutes: profile.minutes, now, call, challenge, exclude, muscles: days[day]!.muscles });
    return {
      ...plan,
      program: {
        id: src.id,
        day,
        dayName: days[day]!.name,
        note: t("pgm.next", { day: inSentence(days[(day + 1) % days.length]!.name, true) }),
        fixed: false,
      },
    };
  }
  const engine = ENGINES[info.id]!;
  const s = programState(src, ctx);
  const day = s.next;
  const lift = (k: string) => s.lifts[k]!;
  const d = engine.build(s, day, lift, ctx);
  const items = toItems(d, gym).map((it) => comebackItem(it, events, gym, now));
  return {
    gymId: gym.id,
    minutes: Math.round(planSeconds(items) / 60),
    estMinutes: Math.round(planSeconds(items) / 60),
    week: blockWeek(profile, now),
    call: "normal",
    challenge: false,
    items,
    program: { id: src.id, day, dayName: d.name, note: d.note, fixed: true },
  };
}

/**
 * The first session back after a break (layoff.ts) is lighter on a fixed program too, like the
 * well-known 5x5 apps do. From there the program's own jumps rebuild it, because the next weight
 * builds on what was planned and lifted; there is no extra ramp on top.
 */
function comebackItem(item: PlanItem, events: readonly AppEvent[], gym: Gym, now: number): PlanItem {
  const ex = exercise(item.exerciseId);
  if (ex.load === "bodyweight" || !item.setTargets) return item;
  const lay = layoff(ex, events, now);
  if (!lay || lay.done > 0) return item;
  const setTargets = item.setTargets.map((st) => ({ ...st, weight: roundLoad(st.weight * (1 - lay.cut), ex, gym).kg, comeback: true }));
  return {
    ...item,
    setTargets,
    target: {
      ...item.target,
      weight: setTargets[0]!.weight,
      note: t("note.comeback", { count: lay.weeks, pct: Math.round(lay.cut * 100) }),
    },
  };
}

/** Hard sets per muscle in a typical week of the program (secondary muscles count half), for the picker. */
export function weeklyPreview(id: ProgramId, ctx: Ctx): Record<Muscle, number> {
  const out = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
  const info = PROGRAM_BY_ID.get(id)!;
  const add = (items: readonly PlanItem[]) => {
    for (const it of items) {
      const ex = exercise(it.exerciseId);
      for (const m of ex.primary) out[m] += it.sets;
      for (const m of ex.secondary) out[m] += it.sets / 2;
    }
  };
  if (info.kind === "split") {
    const days = SPLITS[id as keyof typeof SPLITS];
    for (let i = 0; i < info.daysPerWeek; i++)
      add(
        generate({
          gym: ctx.gym,
          profile: ctx.profile,
          events: [],
          minutes: ctx.profile.minutes,
          now: ctx.now,
          muscles: days[i % days.length]!.muscles,
        }).items,
      );
    return out;
  }
  const engine = ENGINES[id]!;
  const src = pickProgram(id, ctx) as Extract<PlanSource, { kind: "program" }>;
  const s = programState(src, { ...ctx, events: [] });
  for (let i = 0; i < info.daysPerWeek; i++)
    add(
      toItems(
        engine.build(s, i % engine.days, (k) => s.lifts[k]!, ctx),
        ctx.gym,
      ),
    );
  return out;
}

/** The kit a program's main lifts need that this gym doesn't have. */
export function missingFor(id: ProgramId, gym: Gym): Equipment[] {
  const info = PROGRAM_BY_ID.get(id);
  return info ? info.needs.filter((n) => !gym.equipment.includes(n)) : [];
}
