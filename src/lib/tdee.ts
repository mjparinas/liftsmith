// TDEE: total daily energy expenditure, the calories a day that hold body weight steady (Tools › TDEE).
//
// Resting burn (BMR) uses Mifflin-St Jeor, or Katch-McArdle when a body fat reading is known (it counts
// lean mass, which suits lifters). BMR times an activity factor gives TDEE. The activity level is read
// from the lifter's own workouts (training days a week over the last four weeks), from the days-a-week
// goal until there's two weeks of history, or picked by hand.
//
// Snapshots: whenever an input that matters changes (weight, age, height, sex, body fat, activity), a
// `tdee` event records the new value with what changed, so the history and the graph survive edits to
// the profile. The current value is always computed fresh; events are the record of the past.
import type { SessionSummary } from "./derive";
import { t } from "./i18n";
import type { AppEvent, Profile, TdeeEvent } from "./types";

export type Activity = "sedentary" | "light" | "moderate" | "heavy" | "athlete";
export const ACTIVITIES: Activity[] = ["sedentary", "light", "moderate", "heavy", "athlete"];

/** The standard activity factors (Harris-Benedict / Mifflin convention). */
const FACTOR: Record<Activity, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, heavy: 1.725, athlete: 1.9 };
export const ACTIVITY: Record<Activity, { factor: number; label: string; detail: string }> = Object.fromEntries(
  ACTIVITIES.map((a) => [
    a,
    {
      factor: FACTOR[a],
      get label() {
        return t(`activity.${a}`);
      },
      get detail() {
        return t(`activity.${a}.detail`);
      },
    },
  ]),
) as Record<Activity, { factor: number; label: string; detail: string }>;

export type Sex = "male" | "female";
export type Formula = "mifflin" | "katch";

export interface TdeeInputs {
  kg: number;
  cm: number;
  age: number;
  sex: Sex;
  activity: Activity;
  /** Percent, 3 to 60. With it, Katch-McArdle is used. */
  bodyFat?: number;
}

export interface TdeeResult {
  bmr: number;
  tdee: number;
  formula: Formula;
  /** TDEE at each activity level, for the comparison table. */
  levels: Record<Activity, number>;
  bmi: number;
  /** About 0.5 kg a week down, never below BMR... */
  cut: number;
  /** ...and a lean bulk of about 0.25 kg a week up. */
  bulk: number;
  /** Grams a day: 1.6 to 2.2 g per kg, the range most research supports for lifters. */
  protein: [number, number];
}

export const bmrMifflin = (i: Pick<TdeeInputs, "kg" | "cm" | "age" | "sex">) =>
  10 * i.kg + 6.25 * i.cm - 5 * i.age + (i.sex === "male" ? 5 : -161);
export const bmrKatch = (kg: number, bodyFat: number) => 370 + 21.6 * kg * (1 - bodyFat / 100);

export function validInputs(i: Partial<TdeeInputs>): i is TdeeInputs {
  return (
    !!i.sex &&
    !!i.activity &&
    inRange(i.kg, 25, 350) &&
    inRange(i.cm, 100, 250) &&
    inRange(i.age, 13, 100) &&
    (i.bodyFat === undefined || inRange(i.bodyFat, 3, 60))
  );
}
const inRange = (n: number | undefined, lo: number, hi: number) => typeof n === "number" && Number.isFinite(n) && n >= lo && n <= hi;

export function calcTdee(i: TdeeInputs): TdeeResult {
  const formula: Formula = i.bodyFat !== undefined ? "katch" : "mifflin";
  const bmr = Math.round(formula === "katch" ? bmrKatch(i.kg, i.bodyFat!) : bmrMifflin(i));
  const levels = Object.fromEntries(ACTIVITIES.map((a) => [a, Math.round(bmr * ACTIVITY[a].factor)])) as Record<Activity, number>;
  const tdee = levels[i.activity];
  const m = i.cm / 100;
  return {
    bmr,
    tdee,
    formula,
    levels,
    bmi: Math.round((i.kg / (m * m)) * 10) / 10,
    cut: Math.max(bmr, tdee - 500),
    bulk: tdee + 250,
    protein: [Math.round(i.kg * 1.6), Math.round(i.kg * 2.2)],
  };
}

export type BmiCategory = "under" | "healthy" | "over" | "obese";

/** The standard adult BMI bands: under 18.5, 18.5 to 25, 25 to 30, 30 and over. */
export const BMI_CUTS = [18.5, 25, 30] as const;

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "under";
  if (bmi < 25) return "healthy";
  if (bmi < 30) return "over";
  return "obese";
}

export function bmiBand(bmi: number): string {
  return t(`bmi.${bmiCategory(bmi)}`);
}

// --- Activity from the lifter's own training ---

const DAY = 86_400_000;
const WINDOW_DAYS = 28;

export interface ActivityRead {
  activity: Activity;
  source: "workouts" | "steps" | "plan";
  /** Training days a week behind the read (average over the window, or the goal). */
  perWeek: number;
  /** Average steps a day over the last week, when the level comes from steps. */
  steps?: number;
}

const LEVELS: Activity[] = ["sedentary", "light", "moderate", "heavy", "athlete"];

/**
 * Steps a day to an activity level (the common pedometer bands: under 5,000 sedentary, 5,000 light,
 * 7,500 moderate, 10,000 heavy).
 */
export function activityForSteps(steps: number): Activity {
  if (steps < 5000) return "sedentary";
  if (steps < 7500) return "light";
  if (steps < 10000) return "moderate";
  return "heavy";
}

/**
 * The activity level from steps and training together (the health twin, 2026-11-09): the higher of the
 * two, one level up when both say active (7,500+ steps and 3+ training days a week), because steps
 * barely count lifting and training days don't count the rest of the day. Athlete stays a
 * two-a-day training level.
 */
export function withSteps(training: ActivityRead, steps: number): ActivityRead {
  const s = LEVELS.indexOf(activityForSteps(steps)),
    t = LEVELS.indexOf(training.activity);
  let i = Math.max(s, t);
  if (steps >= 7500 && training.perWeek >= 3 && i < 3) i += 1;
  if (training.activity === "athlete") i = 4;
  return { activity: LEVELS[i], source: "steps", perWeek: training.perWeek, steps: Math.round(steps / 100) * 100 };
}

/** Average steps a day over the last 7 finished days, when Health gave at least 5 of them. */
export function recentSteps(events: readonly AppEvent[], now: number): number | undefined {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const from = today.getTime() - 7 * DAY;
  const by = new Map<string, { at: number; v: number }>();
  for (const e of events) {
    if (e.type !== "health" || e.metric !== "steps") continue;
    const t = new Date(`${e.day}T12:00:00`).getTime();
    if (t < from || t >= today.getTime()) continue;
    const cur = by.get(e.day);
    if (!cur || e.at >= cur.at) by.set(e.day, { at: e.at, v: e.value });
  }
  if (by.size < 5) return undefined;
  return [...by.values()].reduce((s, x) => s + x.v, 0) / by.size;
}

/** Training days a week to an activity level: 0 sedentary, 1–2 light, 3–5 moderate, 6–7 heavy, two a day athlete. */
export function activityForDays(days: number, sessionsPerWeek = days): Activity {
  if (sessionsPerWeek >= 10) return "athlete";
  const d = Math.round(days);
  if (d <= 0) return "sedentary";
  if (d <= 2) return "light";
  if (d <= 5) return "moderate";
  return "heavy";
}

/**
 * Reads the activity level from finished workouts in the last four weeks. With less than two weeks
 * since the first workout, the days-a-week goal stands in, because a few early sessions say little.
 */
export function inferActivity(sessions: Pick<SessionSummary, "start">[], daysPerWeek: number, now: number): ActivityRead {
  const first = sessions.reduce((m, s) => Math.min(m, s.start), Infinity);
  if (!Number.isFinite(first) || now - first < 14 * DAY)
    return { activity: activityForDays(daysPerWeek), source: "plan", perWeek: daysPerWeek };
  const from = now - WINDOW_DAYS * DAY;
  const recent = sessions.filter((s) => s.start >= from && s.start <= now);
  // Whole weeks since the window opened (or the first workout), so a weekly lifter whose first workout
  // was 22 days ago reads 1 a week, not 1.3.
  const weeks = Math.max(1, Math.ceil(Math.min(WINDOW_DAYS, (now - Math.max(first, from)) / DAY) / 7 - 0.01));
  const days = new Set(recent.map((s) => localDay(s.start))).size / weeks;
  const perWeek = Math.round(days * 10) / 10;
  return { activity: activityForDays(days, recent.length / weeks), source: "workouts", perWeek };
}

const localDay = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

// --- Current inputs from everything the app knows ---

export function ageAt(birthYear: number | undefined, now: number): number | undefined {
  return birthYear ? new Date(now).getFullYear() - birthYear : undefined;
}

/** Latest weigh-in, or the profile's body weight. */
/** The newest weigh-in (kg), by when it was measured, or undefined before the first one. */
export function lastWeighInKg(events: readonly AppEvent[]): number | undefined {
  let last: { at: number; kg: number } | undefined;
  for (const e of events) if (e.type === "bodyweight" && (!last || e.at > last.at)) last = e;
  return last?.kg;
}

/**
 * The lifter's body weight now (kg): the newest weigh-in, else the weight from setup. Every screen that shows
 * or uses "your weight" reads this, so they can't disagree (the store keeps `profile.bodyweight` equal to it).
 */
export function currentKg(events: readonly AppEvent[], profile: Pick<Profile, "bodyweight">): number {
  return lastWeighInKg(events) ?? profile.bodyweight;
}

export interface CurrentTdee {
  inputs: Partial<TdeeInputs>;
  activity: ActivityRead | { activity: Activity; source: "manual"; perWeek?: undefined; steps?: undefined };
  /** Which inputs are still missing, in the order the screen asks for them. */
  missing: ("sex" | "age" | "height")[];
  result?: TdeeResult;
}

export function currentTdee(events: AppEvent[], sessions: Pick<SessionSummary, "start">[], profile: Profile, now: number): CurrentTdee {
  const manual = profile.tdee?.activity;
  const steps = manual ? undefined : recentSteps(events, now);
  const training = manual ? undefined : inferActivity(sessions, profile.daysPerWeek, now);
  const activity = manual ? { activity: manual, source: "manual" as const } : steps !== undefined ? withSteps(training!, steps) : training!;
  const inputs: Partial<TdeeInputs> = {
    kg: Math.round(currentKg(events, profile) * 10) / 10,
    cm: profile.heightCm,
    age: ageAt(profile.birthYear, now),
    sex: profile.sex,
    activity: activity.activity,
    bodyFat: profile.tdee?.useBodyFat === false ? undefined : currentBodyFat(events, profile),
  };
  const missing = (
    [
      ["sex", inputs.sex],
      ["age", inputs.age],
      ["height", inputs.cm],
    ] as const
  )
    .filter(([, v]) => v === undefined)
    .map(([k]) => k);
  return { inputs, activity, missing, result: validInputs(inputs) ? calcTdee(inputs) : undefined };
}

// --- Snapshots ---

export type TdeeChange = TdeeEvent["changes"][number];

/** What changed since the last snapshot, using thresholds that matter to the number (0.5 kg, 1% fat). */
export function changesSince(prev: TdeeEvent | undefined, i: TdeeInputs): TdeeChange[] {
  if (!prev) return ["first"];
  const c: TdeeChange[] = [];
  if (Math.abs(prev.kg - i.kg) >= 0.5) c.push("weight");
  if (prev.age !== i.age) c.push("age");
  if (Math.abs(prev.cm - i.cm) >= 1) c.push("height");
  if (prev.sex !== i.sex) c.push("sex");
  if (prev.activity !== i.activity) c.push("activity");
  if ((prev.bodyFat === undefined) !== (i.bodyFat === undefined) || Math.abs((prev.bodyFat ?? 0) - (i.bodyFat ?? 0)) >= 1)
    c.push("bodyFat");
  return c;
}

export function lastSnapshot(events: AppEvent[]): TdeeEvent | undefined {
  let last: TdeeEvent | undefined;
  for (const e of events) if (e.type === "tdee" && (!last || e.at > last.at)) last = e;
  return last;
}

/** A new snapshot when the inputs are complete and something that matters changed since the last one. */
export function snapshotDue(
  cur: CurrentTdee,
  events: AppEvent[],
  now: number,
  id: string,
  trigger: TdeeEvent["trigger"] = "auto",
): TdeeEvent | null {
  if (!cur.result || !validInputs(cur.inputs)) return null;
  const changes = changesSince(lastSnapshot(events), cur.inputs);
  if (!changes.length && trigger === "auto") return null;
  const i = cur.inputs;
  return {
    type: "tdee",
    id,
    at: now,
    kcal: cur.result.tdee,
    bmr: cur.result.bmr,
    kg: i.kg,
    cm: i.cm,
    age: i.age,
    sex: i.sex,
    activity: i.activity,
    activitySource: cur.activity.source,
    ...(cur.activity.perWeek !== undefined ? { perWeek: cur.activity.perWeek } : {}),
    ...(cur.activity.steps !== undefined ? { steps: cur.activity.steps } : {}),
    ...(i.bodyFat !== undefined ? { bodyFat: i.bodyFat } : {}),
    formula: cur.result.formula,
    trigger,
    changes: changes.length ? changes : ["recheck"],
  };
}

/** Every snapshot, oldest first, with sync duplicates removed: the list of changes. */
export function tdeeLog(events: AppEvent[]): TdeeEvent[] {
  const byId = new Map<string, TdeeEvent>();
  for (const e of events) if (e.type === "tdee") byId.set(e.id, e);
  return [...byId.values()].sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
}

/** One point a day (the day's last snapshot), oldest first, for the graph. Duplicates from sync collapse. */
export function tdeeHistory(events: AppEvent[]): TdeeEvent[] {
  const byDay = new Map<string, TdeeEvent>();
  for (const e of events) {
    if (e.type !== "tdee") continue;
    const k = localDay(e.at);
    const had = byDay.get(k);
    if (!had || e.at > had.at || (e.at === had.at && e.id > had.id)) byDay.set(k, e);
  }
  return [...byDay.values()].sort((a, b) => a.at - b.at);
}

// --- Autofill from Health Connect / Apple Health ---

export interface BodyReadings {
  height?: { value: number; at: number };
  /** Apple Health only (Health Connect stores neither). */
  sex?: "male" | "female";
  birthYear?: number;
}

/**
 * What a health reading changes: a new height goes to the profile, unless the lifter typed a height after it
 * was measured. Sex and birth year fill in only when Your stats has none, so what the lifter set wins.
 * Weigh-ins and body fat come in as bodyweight events through the store's importHealthBody (one per day,
 * `health-bw-<day>`), so there is one import path for them. Out-of-range readings are ignored.
 */
export function bodyUpdates(r: BodyReadings, profile: Profile, now = Date.now()): Partial<Profile> {
  const p: Partial<Profile> = {};
  if (
    r.height &&
    inRange(r.height.value, 100, 250) &&
    Math.abs((profile.heightCm ?? 0) - r.height.value) >= 1 &&
    !(profile.heightCm && profile.heightAt && profile.heightAt > r.height.at)
  )
    p.heightCm = Math.round(r.height.value);
  if (r.sex && !profile.sex) p.sex = r.sex;
  const year = new Date(now).getFullYear();
  if (r.birthYear && !profile.birthYear && inRange(year - r.birthYear, 13, 100)) p.birthYear = r.birthYear;
  return p;
}

/** Body fat for TDEE: the newer of the latest weigh-in that carries one and the value entered by hand. */
export function currentBodyFat(events: AppEvent[], profile: Profile): number | undefined {
  let last: { pct: number; at: number } | undefined = profile.bodyFat;
  for (const e of events)
    if (e.type === "bodyweight" && e.bodyFat !== undefined && (!last || e.at > last.at)) last = { pct: e.bodyFat, at: e.at };
  return last ? Math.round(last.pct * 10) / 10 : undefined;
}

/** Body fat entered by hand: a percentage from 3 to 60, rounded to 0.1, or undefined when empty or out of range. */
export function parseBodyFat(text: string): number | undefined {
  const n = Number(text.trim().replace(",", "."));
  if (!text.trim() || !Number.isFinite(n) || n < 3 || n > 60) return undefined;
  return Math.round(n * 10) / 10;
}
