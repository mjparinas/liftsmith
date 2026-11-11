import { t, translated } from "./i18n";

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

/** Muscle names in the current language (src/locales, keys `muscle.*`). */
export const MUSCLE_LABEL: Record<Muscle, string> = translated(MUSCLES, (m) => `muscle.${m}`);

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
  "hipMachine",
  "preacher",
  "assistedPullup",
  "bands",
  "rings",
  "box",
  "abWheel",
  "medicineBall",
  "jumpRope",
  "treadmill",
  "rower",
  "bike",
  "elliptical",
  "stairClimber",
  "skiErg",
  "sled",
  "battleRopes",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const EQUIPMENT_LABEL: Record<Equipment, string> = translated(EQUIPMENT, (e) => `equipment.${e}`);

export const EQUIPMENT_GROUPS: { title: string; items: Equipment[] }[] = [
  {
    get title() {
      return t("equipment.group.free");
    },
    items: ["barbell", "ezBar", "trapBar", "dumbbells", "kettlebells"],
  },
  {
    get title() {
      return t("equipment.group.benches");
    },
    items: ["bench", "inclineBench", "rack", "pullupBar", "dipBars", "box"],
  },
  {
    get title() {
      return t("equipment.group.machines");
    },
    items: [
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
      "hipMachine",
      "preacher",
      "assistedPullup",
    ],
  },
  {
    get title() {
      return t("equipment.group.small");
    },
    items: ["bands", "rings", "abWheel", "medicineBall", "jumpRope"],
  },
  {
    get title() {
      return t("equipment.group.cardio");
    },
    items: ["treadmill", "rower", "bike", "elliptical", "stairClimber", "skiErg", "sled", "battleRopes"],
  },
];

/** How an exercise is loaded decides how its weight is rounded and drawn. */
export type LoadKind = "barbell" | "dumbbell" | "kettlebell" | "machine" | "bodyweight";

export type Pattern = "squat" | "hinge" | "lunge" | "hpush" | "vpush" | "hpull" | "vpull" | "carry" | "core" | "isolation" | "cardio";

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
  /** The lifter made it. Used in swaps and logging, not picked by the generator. */
  custom?: boolean;
  /**
   * Cardio (pattern "cardio"): logged as time (reps are seconds), plus distance for "distance". Never
   * picked by the generator; added to a routine or a workout by the lifter.
   */
  cardio?: "distance" | "time";
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
  /** Machine settings per exercise ("Seat 4", "Back pad 2"), machineSettings.ts. */
  settings?: Record<string, { label: string; value: string }[]>;
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
  /** App sounds, including the rest-over chime (Settings › Sounds). */
  restSounds: boolean;
  /** Vibration on taps and at the end of rest. Missing means on. */
  haptics?: boolean;
  /** The daily quote on Today (Melvin, 2026-11-09). Missing means on. */
  quotes?: boolean;
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
  pro?: {
    offeredAt: number;
    plan?: "annual" | "monthly";
    trialStartedAt?: number;
    trialDays?: number;
    declinedAt?: number;
    subscribed?: boolean;
  };
  /** The plan source a lifter had while Pro, kept while they're on the free plan so Pro brings it back (store.applyAccess). */
  proPlan?: PlanSource;
  /** Calendar (roadmap MVP+2): training days written to the calendar, and busy times read with permission. */
  calendar?: CalendarPrefs;
  /** Lean mode: no confetti, celebration sounds or pop-ups (Settings). */
  lean?: boolean;
  /** Equipped cosmetics, won from crates (game.ts COSMETICS ids). */
  cosmetics?: { accent?: string; sound?: string; plates?: string; avatar?: string };
  /**
   * Your stats (Settings › Body and units, BodyStats.tsx): the one place for age, sex and height, which
   * TDEE, fitness age, DOTS, strength scores and starting weights all read. Also asked in setup. Apple Health
   * fills age and sex (HealthWorkoutPlugin.swift `characteristics`); Health Connect has neither.
   */
  birthYear?: number;
  sex?: "male" | "female";
  /** Centimetres. From Health Connect or Apple Health when allowed, or entered in Your stats. */
  heightCm?: number;
  /** When height was entered by hand (ms), so an older health reading doesn't replace it. */
  heightAt?: number;
  /** Latest body fat reading (percent) from Health Connect or Apple Health, or entered by hand. */
  bodyFat?: { pct: number; at: number };
  /** TDEE settings (tdee.ts). Missing activity means it's read from the lifter's workouts. */
  tdee?: { activity?: "sedentary" | "light" | "moderate" | "heavy" | "athlete"; useBodyFat?: boolean };
  /** Estimated one-rep maxes (kg) the lifter entered at setup, keyed by exercise id (KNOWN_LIFTS). */
  knownMaxes?: Partial<Record<string, number>>;
  /**
   * Reminders and lifecycle messages (messages.ts). Each type is on or off per channel; missing means
   * the default (Pro offers off, the rest on). Email needs an address and a confirmed opt-in.
   */
  messages?: {
    push: Partial<Record<"reminder" | "missed" | "streak" | "milestone" | "pro", boolean>>;
    email?: {
      address: string;
      consentAt: number;
      status: "pending" | "confirmed" | "unsubscribed";
      kinds: Partial<Record<"reminder" | "missed" | "streak" | "milestone" | "pro", boolean>>;
    };
    /** When reminders were first set up: comebacks count from here until there's a workout. */
    startedAt?: number;
  };
  /** One-rep max goals with a date (goals.ts). */
  goals?: import("./goals").LiftGoal[];
  /** Three-week fixes started from the plateau detective (plateau.ts). */
  plateauFixes?: import("./plateau").PlateauFix[];
  /**
   * Where Today's plan comes from (programs.ts). Missing means the adaptive generator. A program keeps
   * the starting weights frozen when it was picked (kg, keyed by program slot), so replaying the
   * history always gives the same weights; everything after that is derived from the logged sets.
   * Saved routines plug in as their own kind.
   */
  planSource?: PlanSource;
  /** Appearance: dark (default), light, or follow the system (theme.ts). */
  theme?: "dark" | "light" | "system";
  /** Accessibility: text size, colour-blind safe colours, contrast (a11y.ts). */
  a11y?: import("./a11y").A11y;
  /** Language: follow the phone, or a chosen one (i18n.ts). */
  language?: import("./i18n").LangPref;
  /** Delightful extras (moments, themes, voice coach, ghost mode...). See "Delightful extras" in AGENTS.md. */
  delight?: DelightPrefs;
  /** Saved routines, newest first (routines.ts). */
  routines?: Routine[];
  /**
   * Connected apps (connections.ts): the music app the playlist link on Today opens (missing means no
   * link), and whether finished workouts go to Strava once it's connected (missing means yes).
   */
  connections?: { music?: MusicApp; stravaPost?: boolean };
  /** Workout preferences (Settings › Workout preferences, training.ts). Missing fields mean the automatic default. */
  training?: TrainingPrefs;
  /** The local day (random.ts dayKey) the length slider was last moved, so the default length comes back the next day. */
  minutesDay?: string;
  onboarded: boolean;
  updatedAt: number;
}

/** A music app the playlist link opens (connections.ts MUSIC). */
export type MusicApp = "spotify" | "apple" | "youtube";

/** How effort is shown: reps in reserve, or RPE (10 minus reps in reserve). Stored as RIR either way. */
export type EffortScale = "rir" | "rpe";
/** The rest-over alert: sound, vibration, both, or neither (the timer still shows). */
export type RestAlert = "both" | "sound" | "vibrate" | "silent";

/** One exercise's own rest, rep range and working sets, set by the lifter. */
export interface ExercisePrefs {
  /** Seconds. */
  rest?: number;
  /** Lowest and highest reps for double progression. */
  reps?: [number, number];
  sets?: number;
}

/**
 * Workout preferences (Melvin, 2026-11-09). Every field is optional; missing means the automatic
 * choice (by goal, by the block, or the old default), so older profiles load unchanged.
 */
export interface TrainingPrefs {
  /** Default rest in seconds for compound lifts and for isolation work. */
  rest?: { compound?: number; isolation?: number };
  /** Preferred rep ranges for compound lifts and for isolation work. */
  reps?: { compound?: [number, number]; isolation?: [number, number] };
  /** Working sets per exercise. Missing is automatic (3, 4 on the first big lifts, more when time allows). */
  sets?: number;
  /** Per-exercise overrides, keyed by exercise id. They win over everything above. */
  exercises?: Record<string, ExercisePrefs>;
  effort?: EffortScale;
  /** Start the rest timer by itself after Log set. Missing means on. */
  autoRest?: boolean;
  /** Missing means it follows Sounds and Vibration. */
  restAlert?: RestAlert;
  /** Keep the screen on during a workout. Missing means on. */
  keepAwake?: boolean;
  /** Start opens the day's warm-up stretches first (Stretch.tsx; skippable). Missing means off. */
  warmFirst?: boolean;
  /** Done offers cool-down stretches for the muscles just trained. Missing means on. */
  coolDown?: boolean;
  /** Exercises the planner picks first when they fit. */
  favourites?: string[];
  /** Muscles that get more weekly sets and go first in the plan. */
  priorities?: Muscle[];
  /** Default workout length (minutes) the slider goes back to each day. Missing means it stays where it was left. */
  minutes?: number;
  /** 1 Monday (default) or 0 Sunday: streaks, quests and weekly stats. */
  weekStart?: 0 | 1;
}

export type PlanSource =
  | { kind: "adaptive" }
  | { kind: "program"; id: string; startedAt: number; start: Record<string, number> }
  | { kind: "routine"; id: string };
/** A saved routine (routines.ts): exercises, set counts and supersets, in order. */
export interface RoutineItem {
  exerciseId: string;
  sets: number;
  /** Superset: neighbours with the same group are done back to back. */
  group?: string;
}

export interface Routine {
  id: string;
  name: string;
  items: RoutineItem[];
  createdAt: number;
  updatedAt: number;
}

export interface DelightPrefs {
  /** Spoken cues between sets. Off by default. */
  voice?: boolean;
  /** Race last time's pace on the rest timer. On unless turned off. */
  ghost?: boolean;
  /** Show only the plates to add or take off between sets. On unless turned off. */
  plateMemory?: boolean;
  /** A breathing guide or a mini-game on the rest timer. Off by default. */
  restExtra?: "breathe" | "game" | "off";
  /** Earned theme picked in Settings (themes.ts). */
  theme?: string;
  /** Earned app icon picked in Settings (native only). */
  icon?: string;
  /** Themes the lifter has already been told about, for the "new theme" moment. */
  seenThemes?: string[];
  /** Strength score adjusted for age (needs a birth year). On unless turned off. */
  ageAdjust?: boolean;
  /** Gym buddies for check-ins: names only, kept on the device and in the user's own sync. */
  buddies?: { id: string; name: string }[];
  /** Moments already shown on Today, so each appears once. */
  seenMoments?: string[];
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
  /** Metres covered, for cardio logged with distance (reps are then the seconds it took). */
  distanceM?: number;
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
  /** Done lighter for an injury, at this share of the usual load (injury.ts). Progression skips these sets. */
  injuryPct?: number;
  /** A program's "as many reps as you can" set: targetReps is the minimum. */
  amrap?: boolean;
  /** Planned lighter for the first session back after a break (layoff.ts); a program builds on it. */
  comeback?: boolean;
  /** The program lift this set counts for (programs.ts), kept through swaps. */
  slot?: string;
  /** Superset group, shared by the exercises done back to back with this one. */
  superset?: string;
  /**
   * Dumbbells or kettlebells held (1 or 2), recorded when the set is logged so a later change to the
   * exercise never rewrites history. `weight` is per implement. Missing on older sets: sides.ts
   * fills it from the exercise.
   */
  implements?: 1 | 2;
  /** Per-side exercises (sides.ts) when the two sides differ: reps on each. `reps` is then the lower. */
  repsL?: number;
  repsR?: number;
  /**
   * A bonus set added between sets (set types, 2026-11-11): a drop set (lighter, straight after the one
   * before) or a rest-pause set (same weight after a short pause). Counted in volume and stats; progression,
   * ghost mode and plateaus read only the planned sets (progression.ts sessionsOf).
   */
  tag?: SetTag;
}

/** Set types the lifter adds between sets. Failure is the reps-left rating of 0 (EffortEvent). */
export type SetTag = "drop" | "restPause";

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
  /** The saved routine the workout came from, if any. */
  routine?: string;
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

/**
 * A month the lifter had Pro (billing.ts proMember), logged once per calendar month the app sees it, with the id
 * "pro-YYYY-MM" so every device writes the same one and a repeat is a no-op. The Pro achievement counts them,
 * so the badge and its rewards stay earned after a subscription ends.
 */
export interface ProEvent extends EventBase {
  type: "pro";
  /** "YYYY-MM", local time. */
  month: string;
}

/** A body weight weigh-in (progress photos screen). Kilograms. */
export interface BodyweightEvent extends EventBase {
  type: "bodyweight";
  kg: number;
  /** Body fat percentage, when a scale or Health Connect / Apple Health gave one (insights.ts). */
  bodyFat?: number;
}

/** Body measurements (competitor gaps, Melvin 2026-11-11), tape-measure sites on the Body and photos screen. */
export const MEASURE_SITES = ["waist", "hips", "chest", "shoulders", "neck", "arm", "forearm", "thigh", "calf"] as const;
export type MeasureSite = (typeof MEASURE_SITES)[number];

/** One tape measurement, in centimetres (shown in inches when the lifter uses pounds). */
export interface MeasureEvent extends EventBase {
  type: "measure";
  site: MeasureSite;
  cm: number;
}

/** A health measure the twin reads from Health Connect / Apple Health (health.ts readDaily, twin.ts). */
export type HealthMetric = "sleep" | "hrv" | "restingHr" | "steps" | "vo2max" | "breathing" | "kcalIn" | "protein";

/**
 * One day's reading of a health measure from Health Connect or Apple Health (the health twin, twin.ts):
 * hours asleep for the night that ended that day, the day's average HRV (ms), resting heart rate (bpm),
 * steps, VO2 max (mL/kg/min), overnight breathing rate (breaths a minute), or calories (`kcalIn`) and grams of
 * protein eaten that day, from a food app (finished days only; the food coach's notes, insights.ts). The id holds the metric,
 * day and value, so a re-import of the same number adds nothing; when a day's number changes (more
 * samples came in), the reading with the latest `at` wins. Health data: it stays on the device (and the
 * lifter's own sync), never analytics, feedback or share links.
 */
export interface HealthEvent extends EventBase {
  type: "health";
  metric: HealthMetric;
  /** Local day, YYYY-MM-DD. */
  day: string;
  value: number;
}

/**
 * A TDEE snapshot (tdee.ts), recorded whenever an input that matters changes, so the history and graph
 * keep the past even after the profile moves on. Calories a day.
 */
export interface TdeeEvent extends EventBase {
  type: "tdee";
  kcal: number;
  bmr: number;
  kg: number;
  cm: number;
  age: number;
  sex: "male" | "female";
  activity: "sedentary" | "light" | "moderate" | "heavy" | "athlete";
  /** Where the activity level came from: the lifter's workouts, the days-a-week goal, or picked by hand. */
  activitySource: "workouts" | "steps" | "plan" | "manual";
  /** Training days a week behind an automatic activity level. */
  perWeek?: number;
  /** Average steps a day behind a steps-based activity level. */
  steps?: number;
  bodyFat?: number;
  formula: "mifflin" | "katch";
  /** Recorded on its own when an input changed, or saved from the calculator. */
  trigger: "auto" | "manual";
  changes: ("first" | "weight" | "age" | "height" | "sex" | "activity" | "bodyFat" | "recheck")[];
}

/**
 * "I'm at the gym" sent to gym buddies through the share sheet. Accounts don't link lifters to each other, so
 * nothing is delivered in the app. Buddy names only, never contact details.
 */
/**
 * Stretches done (src/lib/stretches.ts): the warm-up before a workout, the cool-down after one, a rest-day
 * stretch, or ones the lifter picked from the library. Stretch ids; `seconds` is how long it took.
 */
export interface StretchEvent extends EventBase {
  type: "stretch";
  moment: "warm" | "cool" | "rest" | "pick";
  ids: string[];
  seconds: number;
}

export interface CheckinEvent extends EventBase {
  type: "checkin";
  gymId?: string;
  buddies: string[];
}

/**
 * The pre-workout check-in on Today: how the lifter feels, in three taps at most. The newest one from today
 * moves today's call (readiness.ts); older ones are history. Kept and synced like any other event.
 */
export interface FeelEvent extends EventBase {
  type: "feel";
  /** −1 low, 0 okay, 1 great. */
  energy: -1 | 0 | 1;
  /** Sore from the last workout. */
  sore?: boolean;
  /** Feeling ill: today becomes an easy day whatever else the data says. */
  unwell?: boolean;
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

/** A note the lifter wrote on an exercise during a workout. The latest one shows next time. */
export interface NoteEvent extends EventBase {
  type: "note";
  sessionId: string;
  exerciseId: string;
  text: string;
}

/** How a logged set actually felt: reps the lifter says they had left (0 = failure, 4 = four or more). */
export interface EffortEvent extends EventBase {
  type: "effort";
  setId: string;
  rir: number;
}

/** The lifter's own exercise (table stakes, 2026-11-09). Registered into the library on load. */
export interface CustomExerciseEvent extends EventBase {
  type: "customExercise";
  exercise: Pick<Exercise, "id" | "name" | "primary" | "secondary" | "load" | "compound">;
}

// --- Injury mode (Melvin, 2026-11-09; injury.ts). Kept on the device, never in analytics or reports. ---

export const BODY_PARTS = [
  "neck",
  "shoulder",
  "elbow",
  "wrist",
  "chest",
  "upperBack",
  "lowerBack",
  "abs",
  "hip",
  "groin",
  "quad",
  "hamstring",
  "knee",
  "calf",
  "ankle",
] as const;
export type BodyPart = (typeof BODY_PARTS)[number];

/** The lifter logged an injury or a sore spot. Affected exercises are skipped until it's marked healed. */
export interface InjuryEvent extends EventBase {
  type: "injury";
  injuryId: string;
  part: BodyPart;
}

/** What to do with exercises an injury affects: one exercise, or every one when exerciseId is left out. */
export interface InjuryRuleEvent extends EventBase {
  type: "injuryRule";
  injuryId: string;
  exerciseId?: string;
  /** skip: leave it out. light: keep it at pct% of the usual load. ok: the lifter says it doesn't hurt. */
  action: "skip" | "light" | "ok";
  pct?: number;
  /** The lifter read and accepted the risk warning before choosing to train it. */
  ack?: boolean;
}

export interface InjuryHealedEvent extends EventBase {
  type: "injuryHealed";
  injuryId: string;
}

/** A 0–10 pain rating for an injury: when it's logged, between sets, after a workout, or any day. */
export interface PainEvent extends EventBase {
  type: "pain";
  injuryId: string;
  /** 0 no pain, 10 the worst imaginable. */
  score: number;
  sessionId?: string;
  exerciseId?: string;
}

/** The lifter chose a graded return (after reading the risks): skipped exercises come back lighter, step by step. */
export interface InjuryReturnEvent extends EventBase {
  type: "injuryReturn";
  injuryId: string;
  ack: true;
}

// Every event kind, one per line so two changes adding an event don't touch the same line.
export type AppEvent =
  | ProEvent
  | BodyweightEvent
  | MeasureEvent
  | HealthEvent
  | TdeeEvent
  | CheckinEvent
  | StretchEvent
  | FeelEvent
  | SetEvent
  | SessionStartEvent
  | SessionEndEvent
  | FeedbackEvent
  | SwapEvent
  | HrSeriesEvent
  | CycleEvent
  | WarmupEvent
  | NoteEvent
  | EffortEvent
  | CustomExerciseEvent
  | InjuryEvent
  | InjuryRuleEvent
  | InjuryHealedEvent
  | PainEvent
  | InjuryReturnEvent;
