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
import type { AppEvent, Profile, TdeeEvent } from "./types";
import type { SessionSummary } from "./derive";

export type Activity = "sedentary" | "light" | "moderate" | "heavy" | "athlete";
export const ACTIVITIES: Activity[] = ["sedentary", "light", "moderate", "heavy", "athlete"];

/** The standard activity factors (Harris-Benedict / Mifflin convention). */
export const ACTIVITY: Record<Activity, { factor: number; label: string; detail: string }> = {
  sedentary: { factor: 1.2, label: "Sedentary", detail: "Desk job, little or no exercise" },
  light: { factor: 1.375, label: "Light exercise", detail: "1 to 2 days a week" },
  moderate: { factor: 1.55, label: "Moderate exercise", detail: "3 to 5 days a week" },
  heavy: { factor: 1.725, label: "Heavy exercise", detail: "6 to 7 days a week" },
  athlete: { factor: 1.9, label: "Athlete", detail: "Twice a day, or a physical job plus training" },
};

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

export const bmrMifflin = (i: Pick<TdeeInputs, "kg" | "cm" | "age" | "sex">) => 10 * i.kg + 6.25 * i.cm - 5 * i.age + (i.sex === "male" ? 5 : -161);
export const bmrKatch = (kg: number, bodyFat: number) => 370 + 21.6 * kg * (1 - bodyFat / 100);

export function validInputs(i: Partial<TdeeInputs>): i is TdeeInputs {
  return !!i.sex && !!i.activity && inRange(i.kg, 25, 350) && inRange(i.cm, 100, 250) && inRange(i.age, 13, 100) && (i.bodyFat === undefined || inRange(i.bodyFat, 3, 60));
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

export function bmiBand(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy range";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

// --- Activity from the lifter's own training ---

const DAY = 86_400_000;
const WINDOW_DAYS = 28;

export interface ActivityRead {
  activity: Activity;
  source: "workouts" | "plan";
  /** Training days a week behind the read (average over the window, or the goal). */
  perWeek: number;
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
  if (!Number.isFinite(first) || now - first < 14 * DAY) return { activity: activityForDays(daysPerWeek), source: "plan", perWeek: daysPerWeek };
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
export function currentKg(events: AppEvent[], profile: Pick<Profile, "bodyweight">): number {
  let last: { at: number; kg: number } | undefined;
  for (const e of events) if (e.type === "bodyweight" && (!last || e.at > last.at)) last = e;
  return last?.kg ?? profile.bodyweight;
}

export interface CurrentTdee {
  inputs: Partial<TdeeInputs>;
  activity: ActivityRead | { activity: Activity; source: "manual"; perWeek?: undefined };
  /** Which inputs are still missing, in the order the screen asks for them. */
  missing: ("sex" | "age" | "height")[];
  result?: TdeeResult;
}

export function currentTdee(events: AppEvent[], sessions: Pick<SessionSummary, "start">[], profile: Profile, now: number): CurrentTdee {
  const manual = profile.tdee?.activity;
  const activity = manual ? { activity: manual, source: "manual" as const } : inferActivity(sessions, profile.daysPerWeek, now);
  const inputs: Partial<TdeeInputs> = {
    kg: Math.round(currentKg(events, profile) * 10) / 10,
    cm: profile.heightCm,
    age: ageAt(profile.birthYear, now),
    sex: profile.sex,
    activity: activity.activity,
    bodyFat: profile.tdee?.useBodyFat === false ? undefined : profile.bodyFat?.pct,
  };
  const missing = ([["sex", inputs.sex], ["age", inputs.age], ["height", inputs.cm]] as const).filter(([, v]) => v === undefined).map(([k]) => k);
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
  if ((prev.bodyFat === undefined) !== (i.bodyFat === undefined) || Math.abs((prev.bodyFat ?? 0) - (i.bodyFat ?? 0)) >= 1) c.push("bodyFat");
  return c;
}

export function lastSnapshot(events: AppEvent[]): TdeeEvent | undefined {
  let last: TdeeEvent | undefined;
  for (const e of events) if (e.type === "tdee" && (!last || e.at > last.at)) last = e;
  return last;
}

/** A new snapshot when the inputs are complete and something that matters changed since the last one. */
export function snapshotDue(cur: CurrentTdee, events: AppEvent[], now: number, id: string, trigger: TdeeEvent["trigger"] = "auto"): TdeeEvent | null {
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
  weight?: { value: number; at: number };
  height?: { value: number; at: number };
  bodyFat?: { value: number; at: number };
}

/**
 * What a health reading changes: a newer weight becomes a weigh-in (its id comes from the measurement
 * time, so reading it again on every open never duplicates it), a new height or body fat goes to the profile.
 * Readings older than what the app already has, or out of range, are ignored.
 */
export function bodyUpdates(r: BodyReadings, events: AppEvent[], profile: Profile): { events: AppEvent[]; profile: Partial<Profile> } {
  const out: AppEvent[] = [];
  const p: Partial<Profile> = {};
  const w = r.weight;
  if (w && inRange(w.value, 25, 350)) {
    const id = `health-weight-${w.at}`;
    let newest = -Infinity;
    for (const e of events) if (e.type === "bodyweight") newest = Math.max(newest, e.at);
    if (w.at > newest && !events.some((e) => e.id === id)) {
      out.push({ type: "bodyweight", id, at: w.at, kg: Math.round(w.value * 10) / 10 });
      p.bodyweight = Math.round(w.value * 10) / 10;
    }
  }
  if (r.height && inRange(r.height.value, 100, 250) && Math.abs((profile.heightCm ?? 0) - r.height.value) >= 1) p.heightCm = Math.round(r.height.value);
  if (r.bodyFat && inRange(r.bodyFat.value, 3, 60) && r.bodyFat.at > (profile.bodyFat?.at ?? 0)) p.bodyFat = { pct: Math.round(r.bodyFat.value * 10) / 10, at: r.bodyFat.at };
  return { events: out, profile: p };
}
