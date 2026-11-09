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
  updatedAt: number;
}

export type Goal = "strength" | "muscle" | "general";
export type Experience = "new" | "intermediate" | "advanced";
export type Variability = "consistent" | "balanced" | "variable";

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
  onboarded: boolean;
  updatedAt: number;
}

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
}

export interface SessionStartEvent extends EventBase {
  type: "sessionStart";
  sessionId: string;
  gymId: string;
  minutes: number;
}

export interface SessionEndEvent extends EventBase {
  type: "sessionEnd";
  sessionId: string;
  seconds: number;
  avgHr?: number;
  maxHr?: number;
  kcal?: number;
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

export type AppEvent = SetEvent | SessionStartEvent | SessionEndEvent | FeedbackEvent | SwapEvent;
