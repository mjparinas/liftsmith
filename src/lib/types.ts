// Core types. Weights are stored in kilograms everywhere; a gym's plates are kept in the gym's
// own unit (so 45 lb plates stay exactly 45 lb) and converted at the edges (src/lib/units.ts).

export type Unit = "kg" | "lb";

export const MUSCLES = [
  "chest",
  "frontDelts",
  "sideDelts",
  "rearDelts",
  "biceps",
  "triceps",
  "forearms",
  "abs",
  "obliques",
  "traps",
  "upperBack",
  "lats",
  "lowerBack",
  "glutes",
  "quads",
  "hamstrings",
  "adductors",
  "calves",
] as const;
export type Muscle = (typeof MUSCLES)[number];

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: "Chest",
  frontDelts: "Front delts",
  sideDelts: "Side delts",
  rearDelts: "Rear delts",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  abs: "Abs",
  obliques: "Obliques",
  traps: "Traps",
  upperBack: "Upper back",
  lats: "Lats",
  lowerBack: "Lower back",
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  adductors: "Adductors",
  calves: "Calves",
};

/** Large muscles take longer to recover (about 72 h against 48 h). */
export const LARGE_MUSCLES: ReadonlySet<Muscle> = new Set(["chest", "lats", "upperBack", "lowerBack", "glutes", "quads", "hamstrings"]);

export const EQUIPMENT = [
  "barbell",
  "ezBar",
  "trapBar",
  "dumbbells",
  "kettlebells",
  "bench",
  "inclineBench",
  "rack",
  "pullupBar",
  "dipBars",
  "cable",
  "latPulldown",
  "seatedRow",
  "legPress",
  "legExtension",
  "legCurl",
  "chestPress",
  "pecDeck",
  "shoulderPress",
  "smith",
  "hackSquat",
  "calfMachine",
  "bands",
  "rings",
  "box",
  "abWheel",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: "Barbell",
  ezBar: "EZ curl bar",
  trapBar: "Trap bar",
  dumbbells: "Dumbbells",
  kettlebells: "Kettlebells",
  bench: "Flat bench",
  inclineBench: "Adjustable bench",
  rack: "Squat rack",
  pullupBar: "Pull-up bar",
  dipBars: "Dip bars",
  cable: "Cable station",
  latPulldown: "Lat pulldown",
  seatedRow: "Seated row",
  legPress: "Leg press",
  legExtension: "Leg extension",
  legCurl: "Leg curl",
  chestPress: "Chest press machine",
  pecDeck: "Pec deck",
  shoulderPress: "Shoulder press machine",
  smith: "Smith machine",
  hackSquat: "Hack squat",
  calfMachine: "Calf raise machine",
  bands: "Resistance bands",
  rings: "Gymnastic rings",
  box: "Box or step",
  abWheel: "Ab wheel",
};

export const EQUIPMENT_GROUPS: { title: string; items: Equipment[] }[] = [
  { title: "Free weights", items: ["barbell", "ezBar", "trapBar", "dumbbells", "kettlebells"] },
  { title: "Benches and racks", items: ["bench", "inclineBench", "rack", "pullupBar", "dipBars", "box"] },
  { title: "Machines", items: ["cable", "latPulldown", "seatedRow", "legPress", "legExtension", "legCurl", "chestPress", "pecDeck", "shoulderPress", "smith", "hackSquat", "calfMachine"] },
  { title: "Small gear", items: ["bands", "rings", "abWheel"] },
];

/** How an exercise is loaded decides how its weight is rounded and drawn. */
export type LoadKind = "barbell" | "dumbbell" | "kettlebell" | "machine" | "bodyweight";

export type Pattern = "squat" | "hinge" | "lunge" | "hpush" | "vpush" | "hpull" | "vpull" | "carry" | "core" | "isolation";

export interface Exercise {
  id: string;
  name: string;
  primary: Muscle[];
  secondary: Muscle[];
  /** Every item is needed. Bodyweight exercises need nothing. */
  needs: Equipment[];
  load: LoadKind;
  pattern: Pattern;
  compound: boolean;
  /** Starting load as a share of body weight for an intermediate lifter (per hand for dumbbells). */
  start: number;
  setup: string;
  cues: string[];
}

export interface Bar {
  id: string;
  name: string;
  /** In the gym's unit. */
  weight: number;
}

export interface PlateStock {
  /** In the gym's unit. */
  weight: number;
  /** Plates owned (not pairs). */
  count: number;
}

export interface Gym {
  id: string;
  name: string;
  unit: Unit;
  equipment: Equipment[];
  bars: Bar[];
  plates: PlateStock[];
  /** Dumbbells owned, per hand, in the gym's unit. */
  dumbbells: number[];
  kettlebells: number[];
  /** Pin-stack step for machines and cables, in the gym's unit. */
  machineStep: number;
  /**
   * Opt-in "pick this gym when I'm here" (Melvin, 2026-11-09). Approximate position only, kept on the
   * device (and in the user's own sync). Rounded to about 100 m when saved.
   */
  place?: { lat: number; lon: number; radiusM: number };
  updatedAt: number;
}

export type Goal = "strength" | "muscle" | "general";
export type Experience = "new" | "intermediate" | "advanced";
export type Variability = "consistent" | "balanced" | "variable";

export interface CalendarPrefs {
  /** Weekdays to train, 0 = Sunday. */
  days: number[];
  /** Local time of day, "HH:MM". */
  time: string;
  /** Training days were written to the device calendar. */
  write: boolean;
  /** The lifter allowed reading busy times (start and end only). */
  read: boolean;
}

export interface Profile {
  name: string;
  goal: Goal;
  experience: Experience;
  daysPerWeek: number;
  unit: Unit;
  /** Kilograms. */
  bodyweight: number;
  minutes: number;
  variability: Variability;
  activeGymId: string;
  /** Day the current training block started (ms). */
  blockStart: number;
  /** Weeks of build before the deload week. */
  blockWeeks: number;
  restSounds: boolean;
  /**
   * Cycle-aware readiness (Melvin, 2026-11-09). Opt-in with its own consent screen; consentAt is when
   * the lifter agreed. Cycle data stays on the device (and the user's own sync), never in analytics or
   * feedback reports.
   */
  cycle?: { enabled: boolean; consentAt: number };
  /**
   * The Pro trial offer at the end of setup (trial.ts). Until native billing lands this only records the
   * choice; billing will read it to start the store trial.
   */
  pro?: { offeredAt: number; plan?: "annual" | "monthly"; trialStartedAt?: number; trialDays?: number; declinedAt?: number };
  /** Calendar (roadmap MVP+2): training days written to the calendar, and busy times read with permission. */
  calendar?: CalendarPrefs;
  /**
   * Optional, asked in setup, only used for first-session starting weights (startLoad in progression.ts).
   * Health Connect has neither, so the app asks on every platform.
   */
  birthYear?: number;
  sex?: "male" | "female";
  /** Estimated one-rep maxes (kg) the lifter entered at setup, keyed by exercise id (KNOWN_LIFTS). */
  knownMaxes?: Partial<Record<string, number>>;
  /**
   * Reminders and lifecycle messages (messages.ts). Each type is on or off per channel; missing means
   * the default (Pro offers off, the rest on). Email needs an address and a confirmed opt-in.
   */
  messages?: {
    push: Partial<Record<"reminder" | "missed" | "streak" | "milestone" | "pro", boolean>>;
    email?: { address: string; consentAt: number; status: "pending" | "confirmed" | "unsubscribed"; kinds: Partial<Record<"reminder" | "missed" | "streak" | "milestone" | "pro", boolean>> };
    /** When reminders were first set up: comebacks count from here until there's a workout. */
    startedAt?: number;
  };
  /**
   * Where Today's plan comes from (programs.ts). Missing means the adaptive generator. A program keeps
   * the starting weights frozen when it was picked (kg, keyed by program slot), so replaying the
   * history always gives the same weights; everything after that is derived from the logged sets.
   * Saved routines plug in as their own kind.
   */
  planSource?: PlanSource;
  onboarded: boolean;
  updatedAt: number;
}

export type PlanSource =
  | { kind: "adaptive" }
  | { kind: "program"; id: string; startedAt: number; start: Record<string, number> }
  | { kind: "routine"; id: string };

// --- Events: everything that happens is appended, and every stat is derived from them. ---

interface EventBase {
  id: string;
  at: number;
}

export interface SetEvent extends EventBase {
  type: "set";
  sessionId: string;
  exerciseId: string;
  /** Kilograms of external load (0 for plain bodyweight). */
  weight: number;
  reps: number;
  /** Reps (or seconds for holds) the plan asked for. */
  targetReps: number;
  /** Reps in reserve the plan aimed for. */
  rir: number;
  // Captured automatically (Melvin, 2026-11-09: "win on data"). Optional so older events still load.
  /** Kilograms the plan suggested, to compare with what was lifted. */
  targetWeight?: number;
  /** When the work started (ms): the end of the rest before it, or the start of the exercise. */
  startedAt?: number;
  /** Seconds from start to Log set. Left out when the gap is too long to be one set. */
  durationSec?: number;
  /** Seconds actually rested before this set (planned rest plus any +30 s or early skip). */
  restSec?: number;
  hrAvg?: number;
  hrMax?: number;
  /** Heart rate at Log set, the peak effort of the set. */
  hrEnd?: number;
  /** Part of a challenge (e.g. as many reps as possible on the last set). */
  challenge?: boolean;
  /** A program's "as many reps as you can" set: targetReps is the minimum. */
  amrap?: boolean;
  /** The program lift this set counts for (programs.ts), kept through swaps. */
  slot?: string;
}

export interface SessionStartEvent extends EventBase {
  type: "sessionStart";
  sessionId: string;
  gymId: string;
  minutes: number;
  /** The day's push / normal / recover call the plan was built with, and its score. */
  call?: "push" | "normal" | "recover";
  readiness?: number;
  /** The lifter changed the call before starting. */
  callOverridden?: boolean;
  challenge?: boolean;
  /** Logged by hand after the fact on the web dashboard, not tracked live (no timing or heart rate). */
  source?: "manual";
  /** The program and day the plan came from (programs.ts). */
  program?: { id: string; day: number };
}

export interface SessionEndEvent extends EventBase {
  type: "sessionEnd";
  sessionId: string;
  seconds: number;
  avgHr?: number;
  maxHr?: number;
  minHr?: number;
  kcal?: number;
  /** Seconds under load (sum of set durations) and resting between sets. */
  workSec?: number;
  restSec?: number;
  /** Ended automatically because the workout was left running (see AUTO_END_MS in store.ts). */
  auto?: boolean;
}

/** The whole heart rate stream of a session, saved once at the end. */
export interface HrSeriesEvent extends EventBase {
  type: "hrSeries";
  sessionId: string;
  /** Session start (ms); t holds whole seconds from it. */
  start: number;
  t: number[];
  bpm: number[];
}

export type Rating = -1 | 0 | 1;

export interface FeedbackEvent extends EventBase {
  type: "feedback";
  sessionId: string;
  exerciseId: string;
  /** -1 too hard, 0 about right, 1 too easy. */
  rating: Rating;
}

export interface SwapEvent extends EventBase {
  type: "swap";
  sessionId: string;
  from: string;
  to: string;
  /** Not available here: the generator avoids it at this gym for two weeks. */
  avoid: boolean;
}

/** The first day of a period, logged by the lifter (cycle-aware readiness). */
export interface CycleEvent extends EventBase {
  type: "cycle";
  /** Local midnight of the day the period started (ms). */
  day: number;
}

/** A warm-up set (warmup.ts). Its own type, so stats, recovery, progression and streaks never count it. */
export interface WarmupEvent extends EventBase {
  type: "warmup";
  sessionId: string;
  exerciseId: string;
  /** Kilograms, per hand for dumbbells. */
  weight: number;
  reps: number;
}

export type AppEvent = SetEvent | SessionStartEvent | SessionEndEvent | FeedbackEvent | SwapEvent | HrSeriesEvent | CycleEvent | WarmupEvent;
