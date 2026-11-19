// Workouts done outside Liftsmith (runs, rides, sports, classes) that other apps save to Health Connect or Apple
// Health, read back when the lifter turns on Settings › Connected apps › Count workouts from other apps
// (`profile.outsideWorkouts`, off by default; Melvin, 2026-11-19, gap item 1: "make this a setting").
// docs/decisions/outside-workouts.md.
//
// Each one becomes an `outside` event (`hw-<when the switch went on>-<Health's own id>`, so a re-read adds nothing). They tire the muscles
// they use in the recovery map (recovery.ts), which moves tomorrow's adaptive plan, and a hard one in the last day
// is a readiness signal with its own reason (readiness.ts). They never count as Liftsmith workouts: no sets,
// bests, XP, streak or weekly goal, because those are about the lifting. One that overlaps a Liftsmith workout is
// the same session seen twice (a watch recording the workout, or a Garmin run that also came in as cardio), so it
// is left out wherever it would count (`countedOutside`).
import { t } from "./i18n";
import type { AppEvent, Muscle, OutsideEvent, OutsideKind } from "./types";

/** Health's workout types (the health plugin's names, both platforms) to our few kinds. Unknown ones are "other". */
const KIND_OF: Record<string, OutsideKind> = {
  running: "run",
  runningTreadmill: "run",
  trackAndField: "run",
  wheelchairRunPace: "run",
  walking: "walk",
  wheelchairWalkPace: "walk",
  hiking: "hike",
  snowshoeing: "hike",
  cycling: "ride",
  bikingStationary: "ride",
  handCycling: "ride",
  swimming: "swim",
  swimmingPool: "swim",
  swimmingOpenWater: "swim",
  waterFitness: "swim",
  waterPolo: "swim",
  rowing: "row",
  rowingMachine: "row",
  paddleSports: "row",
  paddling: "row",
  elliptical: "cardio",
  stairClimbing: "cardio",
  stairClimbingMachine: "cardio",
  stairs: "cardio",
  stepTraining: "cardio",
  mixedCardio: "cardio",
  jumpRope: "cardio",
  cardioDance: "cardio",
  dance: "cardio",
  dancing: "cardio",
  socialDance: "cardio",
  fitnessGaming: "cardio",
  highIntensityIntervalTraining: "hiit",
  crossTraining: "hiit",
  bootCamp: "hiit",
  exerciseClass: "hiit",
  burpee: "hiit",
  functionalStrengthTraining: "strength",
  traditionalStrengthTraining: "strength",
  strengthTraining: "strength",
  weightlifting: "strength",
  coreTraining: "strength",
  calisthenics: "strength",
  gymnastics: "strength",
  americanFootball: "sport",
  australianFootball: "sport",
  badminton: "sport",
  baseball: "sport",
  basketball: "sport",
  cricket: "sport",
  discSports: "sport",
  frisbeedisc: "sport",
  handball: "sport",
  hockey: "sport",
  iceHockey: "sport",
  rollerHockey: "sport",
  lacrosse: "sport",
  pickleball: "sport",
  racquetball: "sport",
  rugby: "sport",
  soccer: "sport",
  softball: "sport",
  squash: "sport",
  tableTennis: "sport",
  tennis: "sport",
  volleyball: "sport",
  boxing: "sport",
  kickboxing: "sport",
  martialArts: "sport",
  wrestling: "sport",
  fencing: "sport",
  climbing: "climb",
  rockClimbing: "climb",
  downhillSkiing: "snow",
  crossCountrySkiing: "snow",
  skiing: "snow",
  snowboarding: "snow",
  snowSports: "snow",
  skating: "snow",
  skatingSports: "snow",
  iceSkating: "snow",
  yoga: "mind",
  pilates: "mind",
  barre: "mind",
  flexibility: "mind",
  stretching: "mind",
  taiChi: "mind",
  mindAndBody: "mind",
  cooldown: "mind",
  preparationAndRecovery: "mind",
};

/** Types that aren't exercise worth counting (fishing, sailing and the like are left out). */
const SKIP = new Set([
  "fishing",
  "hunting",
  "sailing",
  "bowling",
  "curling",
  "golf",
  "archery",
  "equestrianSports",
  "transition",
  "meditation",
  "guidedBreathing",
]);

/** The kind's name in the app's language ("Run", "Sport", "Yoga or Pilates"). */
export const outsideName = (k: OutsideKind): string => t(`conn.outside.kind.${k}`);

export function outsideKind(workoutType: string): OutsideKind | null {
  if (SKIP.has(workoutType)) return null;
  return KIND_OF[workoutType] ?? "other";
}

interface Load {
  primary: readonly Muscle[];
  secondary: readonly Muscle[];
  /** Hard sets' worth of fatigue (recovery.ts PER_SET) every 30 minutes on the primary muscles. */
  per30: number;
}

/**
 * What each kind asks of the body, in hard sets of fatigue. A 45-minute run is about two hard sets for the legs,
 * so the legs read Ready the next day rather than Fresh; a 90-minute football match is about five, so they read
 * Recovering. Yoga, Pilates and stretching add nothing, because they don't tire a muscle the way lifting does.
 */
export const LOAD: Record<OutsideKind, Load> = {
  run: { primary: ["quads", "calves"], secondary: ["hamstrings", "glutes"], per30: 1.5 },
  walk: { primary: ["calves"], secondary: ["quads"], per30: 0.4 },
  hike: { primary: ["quads", "calves", "glutes"], secondary: ["hamstrings"], per30: 1 },
  ride: { primary: ["quads"], secondary: ["glutes", "calves", "hamstrings"], per30: 1.25 },
  swim: { primary: ["lats", "frontDelts"], secondary: ["triceps", "upperBack", "chest"], per30: 1.25 },
  row: { primary: ["lats", "upperBack"], secondary: ["quads", "biceps", "lowerBack"], per30: 1.5 },
  cardio: { primary: ["quads"], secondary: ["calves", "glutes"], per30: 1 },
  hiit: { primary: ["quads", "glutes"], secondary: ["chest", "frontDelts", "abs", "calves"], per30: 2 },
  strength: {
    primary: ["quads", "chest", "lats"],
    secondary: ["glutes", "hamstrings", "upperBack", "frontDelts", "triceps", "biceps"],
    per30: 2,
  },
  sport: { primary: ["quads", "calves"], secondary: ["hamstrings", "glutes", "adductors"], per30: 1.5 },
  climb: { primary: ["lats", "forearms", "biceps"], secondary: ["upperBack", "rearDelts"], per30: 1.75 },
  snow: { primary: ["quads"], secondary: ["glutes", "adductors"], per30: 1.25 },
  mind: { primary: [], secondary: [], per30: 0 },
  other: { primary: ["quads"], secondary: ["glutes"], per30: 0.75 },
};

/** Most hard sets one session adds, however long it ran (an all-day hike isn't a week of leg days). */
export const MAX_SETS = 6;

/** Hard sets' worth of fatigue one outside workout adds to its primary muscles. */
export function outsideSets(e: Pick<OutsideEvent, "kind" | "seconds">): number {
  const minutes = Math.max(0, e.seconds) / 60;
  return Math.min(MAX_SETS, (LOAD[e.kind].per30 * minutes) / 30);
}

/** A workout from Health, as the health plugin reads it (only what we use). */
export interface HealthWorkout {
  workoutType: string;
  duration: number;
  startDate: string;
  endDate: string;
  totalDistance?: number;
  totalEnergyBurned?: number;
  sourceName?: string;
  sourceId?: string;
  platformId?: string;
}

/** Our own app ids: Liftsmith's own workouts in Health are already here as Liftsmith workouts. */
export const OWN_SOURCES = ["com.getliftsmith.app"];

/** Shortest session worth counting, so a mis-tap on a watch doesn't move the plan. */
export const MIN_SECONDS = 5 * 60;

/** Start and end (ms) of every Liftsmith workout in the log. */
export function sessionWindows(events: readonly AppEvent[]): [number, number][] {
  const starts = new Map<string, number>();
  for (const e of events) if (e.type === "sessionStart") starts.set(e.sessionId, e.at);
  const out: [number, number][] = [];
  for (const e of events) {
    if (e.type !== "sessionEnd") continue;
    const s = starts.get(e.sessionId);
    if (s !== undefined) out.push([s, e.at]);
  }
  return out;
}

const overlaps = (a: number, b: number, windows: readonly (readonly [number, number])[]) => windows.some(([s, e]) => a < e && b > s);

/**
 * Health's workouts as `outside` events: ours and very short ones left out, one that overlaps a Liftsmith workout
 * left out, and one already in the log not added again. `now` keeps out anything still running or in the future.
 */
export function outsideEvents(
  workouts: readonly HealthWorkout[],
  have: ReadonlySet<string>,
  windows: readonly (readonly [number, number])[],
  now: number,
  since = 0,
): OutsideEvent[] {
  const out: OutsideEvent[] = [];
  const seen = new Set<string>();
  for (const w of workouts) {
    if (w.sourceId && OWN_SOURCES.includes(w.sourceId)) continue;
    const kind = outsideKind(w.workoutType);
    if (!kind) continue;
    const start = Date.parse(w.startDate);
    const end = Date.parse(w.endDate);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end > now) continue;
    const seconds = Math.round(w.duration > 0 ? Math.min(w.duration, (end - start) / 1000) : (end - start) / 1000);
    if (seconds < MIN_SECONDS) continue;
    const id = `hw-${since.toString(36)}-${w.platformId || `${w.workoutType}-${start}`}`;
    if (have.has(id) || seen.has(id) || overlaps(start, end, windows)) continue;
    seen.add(id);
    out.push({
      type: "outside",
      id,
      at: start,
      kind,
      seconds,
      ...(w.totalDistance && w.totalDistance > 0 ? { distanceM: Math.round(w.totalDistance) } : {}),
      ...(w.totalEnergyBurned && w.totalEnergyBurned > 0 ? { kcal: Math.round(w.totalEnergyBurned) } : {}),
      ...(w.sourceName ? { source: w.sourceName.slice(0, 60) } : {}),
    });
  }
  return out;
}

/**
 * The outside workouts that count: every `outside` event that doesn't overlap a Liftsmith workout (one may have
 * come in from a cloud service after the Health read), oldest first.
 */
export function countedOutside(events: readonly AppEvent[]): OutsideEvent[] {
  const list = events.filter((e): e is OutsideEvent => e.type === "outside");
  if (!list.length) return [];
  const windows = sessionWindows(events);
  return list.filter((e) => !overlaps(e.at, e.at + e.seconds * 1000, windows)).sort((a, b) => a.at - b.at);
}

/** When an outside workout ended (ms): fatigue counts from then. */
export const outsideEnd = (e: Pick<OutsideEvent, "at" | "seconds">) => e.at + e.seconds * 1000;

/**
 * The hardest outside workout that ended in the 24 hours before `now` and asks real work of the body (two hard
 * sets or more), for the readiness signal. Null when there's none.
 */
export function hardOutside(events: readonly AppEvent[], now: number): OutsideEvent | null {
  let best: OutsideEvent | null = null;
  for (const e of countedOutside(events)) {
    const end = outsideEnd(e);
    if (end > now || now - end > 24 * 3600_000 || outsideSets(e) < 2) continue;
    if (!best || outsideSets(e) > outsideSets(best)) best = e;
  }
  return best;
}

/** The outside workouts of the last `days` days, newest first, for the list under the recovery map. */
export function recentOutside(events: readonly AppEvent[], now: number, days = 7): OutsideEvent[] {
  return countedOutside(events)
    .filter((e) => e.at <= now && now - e.at < days * 86_400_000)
    .reverse();
}
