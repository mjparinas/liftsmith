import { MANUAL_RIR } from "./dashboard";
import { englishName, EXERCISE_BY_ID, EXERCISES } from "./exercises";
import { hash } from "./random";
import { doneItems, routineFrom } from "./routines";
import type {
  AppEvent,
  Exercise,
  LoadKind,
  Muscle,
  Routine,
  SessionEndEvent,
  SessionStartEvent,
  SetEvent,
  SetTag,
  Unit,
  WarmupEvent,
} from "./types";
import { toKg } from "./units";

// CSV import (table stakes, Melvin, 2026-11-09): workouts exported from Strong, Hevy, Fitbod, StrongLifts,
// JEFIT (Melvin, 2026-11-12) or Liftsmith itself become the same events a hand-logged past workout writes (dashboard.ts pastWorkoutEvents):
// a sessionStart marked `source: "manual"`, the sets, and a sessionEnd. Every id is derived from the
// file's own data, so importing the same file twice adds nothing. Everything runs on the device.

export type ImportFormat = "strong" | "hevy" | "fitbod" | "stronglifts" | "jefit" | "fitnotes" | "liftsmith";

/** Units a distance can come in. A cardio set without one is in km, or miles when the file's weights are in pounds. */
export type DistUnit = "m" | "km" | "mi" | "ft" | "yd";
const METRES: Record<DistUnit, number> = { m: 1, km: 1000, mi: 1609.344, ft: 0.3048, yd: 0.9144 };

export interface ImportSet {
  name: string;
  /** Load in the file's unit (per hand for dumbbells, as the apps log it). */
  weight: number;
  reps: number;
  /** Timed sets (planks, holds). */
  seconds?: number;
  warmup: boolean;
  /** The row's own unit, when the file says it per row (Liftsmith's export). */
  unit?: Unit;
  superset?: string;
  /** A drop set (Hevy's "dropset", Strong's "D", Liftsmith's "drop"). */
  tag?: SetTag;
  /** Cardio: the distance covered, in `distUnit` (2026-11-13: cardio comes across too, logged as time and distance). */
  distance?: number;
  distUnit?: DistUnit;
}

export interface ImportWorkout {
  key: string;
  title: string;
  start: number;
  /** Minutes, when the file says. */
  minutes?: number;
  sets: ImportSet[];
}

export interface ImportFile {
  format: ImportFormat;
  /** The weight unit the file states, or null when the lifter has to say (Strong's older export). */
  unit: Unit | null;
  workouts: ImportWorkout[];
  /** Rows left out: rest timers, empty sets, or dates that couldn't be read. */
  skipped: number;
}

/** RFC 4180 CSV with a comma or semicolon delimiter (picked from the header line). */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const nl = src.search(/\r?\n/);
  const first = nl < 0 ? src : src.slice(0, nl);
  const delim = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x !== "")) rows.push(row);
  return rows;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Local time from "2026-11-09 18:05:00", "2026-11-09T18:05", "2026-11-09" + "18:05", or "9 Nov 2026, 18:05". */
export function parseDate(s: string, time = ""): number | null {
  const t = `${s} ${time}`.trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?)?/);
  if (m) {
    const [y, mo, d, h, mi, se] = [+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)];
    // Fitbod writes "2026-11-02 18:05:00 +0000": a time with an offset is that moment, not local time.
    const off = m[7];
    if (!off) return new Date(y, mo, d, h, mi, se).getTime();
    const sign = off[0] === "-" ? -1 : 1;
    const mins = off === "Z" ? 0 : sign * (+off.slice(1, 3) * 60 + +off.slice(-2));
    return Date.UTC(y, mo, d, h, mi, se) - mins * 60_000;
  }
  m = t.match(/^(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4}),? ?(\d{1,2})?:?(\d{2})?/);
  if (m) {
    const mon = MONTHS.indexOf(m[2].toLowerCase());
    if (mon < 0) return null;
    return new Date(+m[3], mon, +m[1], +(m[4] ?? 0), +(m[5] ?? 0)).getTime();
  }
  return null;
}

/** Minutes from Strong's "1h 5m", "45m", "50s" or Hevy's start and end times. */
function minutesOf(s: string): number | undefined {
  const h = +(s.match(/(\d+)\s*h/)?.[1] ?? 0);
  const m = +(s.match(/(\d+)\s*m(?!s)/)?.[1] ?? 0);
  const total = h * 60 + m;
  return total > 0 ? total : undefined;
}

const num = (s: string | undefined) => {
  const n = parseFloat((s ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/** Seconds from FitNotes' "0:30:00", "1:30" or plain seconds. */
function secondsOf(s: string): number {
  const parts = s.trim().split(":").map(Number);
  if (!parts.length || parts.some((n) => !Number.isFinite(n))) return 0;
  return parts.reduce((t, n) => t * 60 + n, 0);
}

const distUnitOf = (s: string): DistUnit | undefined => {
  const u = s.trim().toLowerCase().replace(/s$/, "");
  if (u === "m" || u === "metre" || u === "meter") return "m";
  if (u === "km" || u === "kilometre" || u === "kilometer") return "km";
  if (u === "mi" || u === "mile") return "mi";
  if (u === "ft" || u === "feet" || u === "foot") return "ft";
  if (u === "yd" || u === "yard") return "yd";
  return undefined;
};

/** Reads a file exported by Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes or Liftsmith. Null when it's none of them. */
export function readImport(text: string): ImportFile | null {
  const rows = parseCsv(text);
  if (rows.length < 2) return null;
  const jefit = readJefit(rows);
  if (jefit) return jefit;
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => head.findIndex((h) => names.some((n) => h === n || h.startsWith(`${n} (`)));
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  const workouts = new Map<string, ImportWorkout>();
  let skipped = 0;
  const add = (key: string, w: Omit<ImportWorkout, "sets" | "key">, s: ImportSet) => {
    if (!workouts.has(key)) workouts.set(key, { key, ...w, sets: [] });
    workouts.get(key)!.sets.push(s);
  };
  const keep = (reps: number, seconds: number, distance = 0) => reps > 0 || seconds > 0 || distance > 0;

  if (col("exercise_title") >= 0 && col("start_time") >= 0) {
    // Hevy: one row per set; weight_kg or weight_lbs says the unit.
    const kg = col("weight_kg");
    const lbs = col("weight_lbs");
    const unit: Unit = kg >= 0 ? "kg" : "lb";
    const distUnit: DistUnit = col("distance_km") >= 0 ? "km" : "mi";
    const [title, start, end, ex, ss, type, reps, secs, dist] = [
      col("title"),
      col("start_time"),
      col("end_time"),
      col("exercise_title"),
      col("superset_id"),
      col("set_type"),
      col("reps"),
      col("duration_seconds"),
      col("distance_km", "distance_miles"),
    ];
    for (const r of rows.slice(1)) {
      const at = parseDate(get(r, start));
      const n = num(get(r, reps));
      const sec = num(get(r, secs));
      const d = num(get(r, dist));
      if (at === null || !get(r, ex) || !keep(n, sec, d)) {
        skipped++;
        continue;
      }
      const fin = parseDate(get(r, end));
      add(
        `${at}|${get(r, title)}`,
        { title: get(r, title) || "Workout", start: at, minutes: fin && fin > at ? Math.round((fin - at) / 60000) : undefined },
        {
          name: get(r, ex),
          weight: num(get(r, kg >= 0 ? kg : lbs)),
          reps: n,
          seconds: n ? undefined : sec,
          warmup: get(r, type).toLowerCase() === "warmup",
          tag: get(r, type).toLowerCase() === "dropset" ? "drop" : undefined,
          superset: get(r, ss) || undefined,
          ...(d > 0 ? { distance: d, distUnit } : {}),
        },
      );
    }
    return { format: "hevy", unit, workouts: [...workouts.values()], skipped };
  }

  if (col("exercise name") >= 0 && col("set order") >= 0) {
    // Strong: one row per set; the unit is in the weight header on newer exports, else the lifter says.
    const w = col("weight");
    const unitHead = head[w]?.match(/\((kg|lbs?)\)/)?.[1];
    const unit: Unit | null = unitHead ? (unitHead === "kg" ? "kg" : "lb") : null;
    const [date, title, dur, ex, order, reps, secs, dist] = [
      col("date"),
      col("workout name"),
      col("duration"),
      col("exercise name"),
      col("set order"),
      col("reps"),
      col("seconds"),
      col("distance"),
    ];
    for (const r of rows.slice(1)) {
      const at = parseDate(get(r, date));
      const n = num(get(r, reps));
      const sec = num(get(r, secs));
      const d = num(get(r, dist));
      // Strong writes a "Rest Timer" row between sets on some versions.
      if (at === null || !get(r, ex) || get(r, order).toLowerCase().startsWith("rest") || !keep(n, sec, d)) {
        skipped++;
        continue;
      }
      add(
        `${at}|${get(r, title)}`,
        { title: get(r, title) || "Workout", start: at, minutes: minutesOf(get(r, dur)) },
        {
          name: get(r, ex),
          weight: num(get(r, w)),
          reps: n,
          seconds: n ? undefined : sec,
          warmup: get(r, order).toUpperCase() === "W",
          tag: get(r, order).toUpperCase() === "D" ? "drop" : undefined,
          // Newer files name the distance unit in the header; older ones use the app's (km, or miles with pounds).
          ...(d > 0 ? { distance: d, distUnit: distUnitOf(head[dist]?.match(/\((\w+)\)/)?.[1] ?? "") } : {}),
        },
      );
    }
    return { format: "strong", unit, workouts: [...workouts.values()], skipped };
  }

  if (col("exercise") >= 0 && col("per hand") >= 0 && col("unit") >= 0) {
    // Liftsmith's own "Export sets" file: the unit is on every row.
    const kind = col("type");
    const dist = col("distance", "distance km");
    const [date, time, workout, ex, weight, unit, reps] = [
      col("date"),
      col("time"),
      col("workout"),
      col("exercise"),
      col("weight"),
      col("unit"),
      col("reps"),
    ];
    const firstAt = new Map<string, number>();
    for (const r of rows.slice(1)) {
      const at = parseDate(get(r, date), get(r, time));
      const n = num(get(r, reps));
      const d = num(get(r, dist));
      if (at === null || !get(r, ex) || !keep(n, 0)) {
        skipped++;
        continue;
      }
      const key = get(r, workout) || get(r, date);
      if (!firstAt.has(key)) firstAt.set(key, at);
      add(
        key,
        { title: "Workout", start: firstAt.get(key)! },
        {
          name: get(r, ex),
          weight: num(get(r, weight)),
          reps: n,
          warmup: false,
          unit: get(r, unit) === "lb" ? "lb" : "kg",
          tag: get(r, kind) === "drop" || get(r, kind) === "rest-pause" ? (get(r, kind) === "drop" ? "drop" : "restPause") : undefined,
          // Cardio: reps are the seconds, and the distance is in km.
          ...(d > 0 ? { distance: d, distUnit: "km" as const, seconds: n } : {}),
        },
      );
    }
    return { format: "liftsmith", unit: "kg", workouts: [...workouts.values()], skipped };
  }

  if (col("exercise") >= 0 && col("date") >= 0 && (col("weight(kg)") >= 0 || col("weight(lbs)") >= 0) && col("iswarmup") >= 0) {
    // Fitbod: one row per set with a timestamp, no workout id. Sets less than three hours apart are one workout.
    const w = col("weight(kg)") >= 0 ? col("weight(kg)") : col("weight(lbs)");
    const unit: Unit = col("weight(kg)") >= 0 ? "kg" : "lb";
    const [date, ex, reps, secs, dist, warm] = [
      col("date"),
      col("exercise"),
      col("reps"),
      col("duration(s)"),
      col("distance(m)"),
      col("iswarmup"),
    ];
    const sets: { at: number; set: ImportSet }[] = [];
    for (const r of rows.slice(1)) {
      const at = parseDate(get(r, date));
      const n = num(get(r, reps));
      const sec = num(get(r, secs));
      const d = num(get(r, dist));
      if (at === null || !get(r, ex) || !keep(n, sec, d)) {
        skipped++;
        continue;
      }
      const set: ImportSet = {
        name: get(r, ex),
        weight: num(get(r, w)),
        reps: n,
        seconds: n ? undefined : sec,
        warmup: /^(true|1|yes)$/i.test(get(r, warm)),
        ...(d > 0 ? { distance: d, distUnit: "m" as const } : {}),
      };
      sets.push({ at, set });
    }
    sets.sort((a, b) => a.at - b.at);
    let key = "";
    let last = -Infinity;
    for (const { at, set } of sets) {
      if (at - last > 3 * 3_600_000) key = `${at}`;
      last = at;
      add(key, { title: "Workout", start: +key }, set);
    }
    for (const wk of workouts.values()) {
      const end = sets.filter((x) => x.at >= wk.start && x.at - wk.start < 12 * 3_600_000).at(-1)?.at ?? wk.start;
      if (end > wk.start) wk.minutes = Math.round((end - wk.start) / 60_000) + 2;
    }
    return { format: "fitbod", unit, workouts: [...workouts.values()], skipped };
  }

  const fnKg = head.findIndex((h) => h.startsWith("weight (kg"));
  const fnLb = head.findIndex((h) => h.startsWith("weight (lb"));
  if (col("exercise") >= 0 && col("category") >= 0 && col("date") >= 0 && (fnKg >= 0 || fnLb >= 0)) {
    // FitNotes: one row per set, a day is one workout, and the weight header says the unit. Cardio has
    // a distance with its own unit column and a time ("0:30:00").
    const unit: Unit = fnKg >= 0 ? "kg" : "lb";
    const w = fnKg >= 0 ? fnKg : fnLb;
    const [date, ex, reps, dist, distU, time] = [
      col("date"),
      col("exercise"),
      col("reps"),
      col("distance"),
      col("distance unit"),
      col("time"),
    ];
    for (const r of rows.slice(1)) {
      const day = get(r, date);
      const at = parseDate(day);
      const n = num(get(r, reps));
      const sec = secondsOf(get(r, time));
      const d = num(get(r, dist));
      if (at === null || !get(r, ex) || !keep(n, sec, d)) {
        skipped++;
        continue;
      }
      add(
        day,
        { title: "Workout", start: at },
        {
          name: get(r, ex),
          weight: num(get(r, w)),
          reps: n,
          seconds: n ? undefined : sec,
          warmup: false,
          ...(d > 0 ? { distance: d, distUnit: distUnitOf(get(r, distU)) ?? (unit === "lb" ? "mi" : "km") } : {}),
        },
      );
    }
    // FitNotes has no start time: a workout starts at 6 PM that day, so it lands on the right day in any time zone.
    for (const wk of workouts.values()) wk.start += 18 * 3_600_000;
    return { format: "fitnotes", unit, workouts: [...workouts.values()], skipped };
  }

  const setCols = head.map((h, i) => (/^set ?\d+$/.test(h) ? i : -1)).filter((i) => i >= 0);
  if (col("exercise") >= 0 && col("date") >= 0 && setCols.length) {
    // StrongLifts: one row per exercise, with each set's reps in "Set 1", "Set 2"… The unit is in the weight header.
    const w = col("weight");
    const unitHead = head[w]?.match(/\((kg|lbs?)\)/)?.[1];
    const unit: Unit | null = unitHead ? (unitHead === "kg" ? "kg" : "lb") : null;
    const [date, title, ex, dur] = [col("date"), col("workout", "workout name"), col("exercise"), col("duration")];
    for (const r of rows.slice(1)) {
      const at = parseDate(get(r, date));
      if (at === null || !get(r, ex)) {
        skipped++;
        continue;
      }
      const weight = num(get(r, w));
      let any = false;
      for (const c of setCols) {
        const cell = get(r, c);
        // A cell is the reps ("5"), or weight and reps ("100x5") when the set's weight differs.
        const pair = cell.match(/^(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+)/i);
        const reps = pair ? num(pair[2]) : num(cell);
        if (reps <= 0) continue;
        any = true;
        add(
          `${at}|${get(r, title)}`,
          { title: get(r, title) || "Workout", start: at, minutes: minutesOf(get(r, dur)) },
          { name: get(r, ex), weight: pair ? num(pair[1]) : weight, reps, warmup: false },
        );
      }
      if (!any) skipped++;
    }
    return { format: "stronglifts", unit, workouts: [...workouts.values()], skipped };
  }
  return null;
}

/**
 * JEFIT: a file of sections ("### EXERCISE LOGS ###" and others), each with its own header. The exercise
 * logs have one row per exercise per day with every set in one cell: "135x10,155x8". The unit isn't stated.
 */
function readJefit(rows: string[][]): ImportFile | null {
  const start = rows.findIndex((r) => {
    const h = r.map((x) => x.trim().toLowerCase());
    return h.includes("logs") && (h.includes("ename") || h.includes("exercise name")) && (h.includes("mydate") || h.includes("date"));
  });
  if (start < 0) return null;
  const head = rows[start].map((h) => h.trim().toLowerCase());
  const at = (...names: string[]) => head.findIndex((h) => names.includes(h));
  const [date, ex, logs] = [at("mydate", "date"), at("ename", "exercise name"), at("logs")];
  const workouts = new Map<string, ImportWorkout>();
  let skipped = 0;
  for (const r of rows.slice(start + 1)) {
    if ((r[0] ?? "").trim().startsWith("###")) break;
    const day = (r[date] ?? "").trim();
    const when = parseDate(day);
    const name = (r[ex] ?? "").trim();
    const sets = [...(r[logs] ?? "").matchAll(/(\d+(?:\.\d+)?)\s*x\s*(\d+)/gi)];
    if (when === null || !name || !sets.length) {
      skipped++;
      continue;
    }
    if (!workouts.has(day)) workouts.set(day, { key: day, title: "Workout", start: when, sets: [] });
    for (const s of sets) if (+s[2]! > 0) workouts.get(day)!.sets.push({ name, weight: +s[1]!, reps: +s[2]!, warmup: false });
  }
  return { format: "jefit", unit: null, workouts: [...workouts.values()], skipped };
}

// --- Matching names to the library ---

const SYNONYM: Record<string, string> = {
  db: "dumbbell",
  dumbbells: "dumbbell",
  bb: "barbell",
  kb: "kettlebell",
  kettlebells: "kettlebell",
  cable: "machine",
  cables: "machine",
  smith: "machine",
  lever: "machine",
  pulley: "machine",
  bodyweight: "bodyweight",
  weighted: "",
  assisted: "",
  band: "",
  bands: "",
  pushup: "push up",
  pullup: "pull up",
  chinup: "chin up",
  situp: "sit up",
  pulldown: "pulldown",
  pushdown: "pushdown",
  flye: "fly",
  flyes: "fly",
  flies: "fly",
  raises: "raise",
  curls: "curl",
  rows: "row",
  presses: "press",
  extensions: "extension",
  squats: "squat",
  lunges: "lunge",
  rdl: "romanian deadlift",
  skullcrusher: "skull crusher",
  skullcrushers: "skull crusher",
  seated: "",
  bar: "",
  straight: "",
  ohp: "overhead press",
  tricep: "triceps",
  bicep: "biceps",
};

/** Lowercase word tokens with the synonyms above (equipment folded to our load kinds). */
export function tokens(name: string): Set<string> {
  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const out = new Set<string>();
  for (const w of words) for (const x of (SYNONYM[w] ?? w).split(" ")) if (x && x !== "and" && x !== "the" && x !== "with") out.add(x);
  return out;
}

const LOAD_WORD: Record<LoadKind, string> = {
  barbell: "barbell",
  dumbbell: "dumbbell",
  kettlebell: "kettlebell",
  machine: "machine",
  bodyweight: "bodyweight",
};

function libTokens(e: Exercise): Set<string> {
  const t = tokens(englishName(e));
  t.add(LOAD_WORD[e.load]);
  return t;
}

/** Words that make a different exercise: a name that has one only matches a library exercise that has it too. */
const QUALIFIERS = new Set([
  "incline",
  "decline",
  "front",
  "close",
  "wide",
  "single",
  "one",
  "reverse",
  "romanian",
  "sumo",
  "hammer",
  "preacher",
  "overhead",
  "bulgarian",
  "goblet",
  "hanging",
  "standing",
  "zercher",
  "deficit",
  "pause",
  "paused",
  "pin",
  "jefferson",
  "snatch",
  "clean",
]);
const LOADS = new Set(["barbell", "dumbbell", "kettlebell", "machine", "bodyweight"]);
const weight = (w: string) => (QUALIFIERS.has(w) ? 2 : 1);

/** The library exercise that best matches a name from another app (weighted Dice on word tokens), if any is close. */
export function matchExercise(name: string, list: readonly Exercise[] = EXERCISES): { id: string; score: number } | null {
  const want = tokens(name);
  if (!want.size) return null;
  const wantW = [...want].reduce((n, w) => n + weight(w), 0);
  let best: { id: string; score: number } | null = null;
  for (const e of list) {
    const have = libTokens(e);
    if ([...want].some((w) => QUALIFIERS.has(w) && !have.has(w))) continue;
    let both = 0;
    let named = false;
    for (const w of want)
      if (have.has(w)) {
        both += weight(w);
        if (!LOADS.has(w)) named = true;
      }
    // Sharing only the equipment isn't a match.
    if (!named) continue;
    const score = (2 * both) / (wantW + [...have].reduce((n, w) => n + weight(w), 0));
    if (!best || score > best.score) best = { id: e.id, score };
  }
  return best && best.score >= 0.5 ? best : null;
}

const MUSCLE_WORDS: [RegExp, Muscle][] = [
  [/calf|calves/, "calves"],
  [/lateral raise|side raise|upright/, "sideDelts"],
  [/rear delt|reverse fly|face pull/, "rearDelts"],
  [/shrug/, "traps"],
  [/curl/, "biceps"],
  [/tricep|pushdown|skull|kickback|dip/, "triceps"],
  [/wrist|forearm|grip/, "forearms"],
  [/crunch|sit up|ab |abs|plank|leg raise|hollow/, "abs"],
  [/twist|oblique|side bend|woodchop/, "obliques"],
  [/hamstring|leg curl|nordic|romanian|rdl|good morning/, "hamstrings"],
  [/hip thrust|glute|bridge|kickback/, "glutes"],
  [/adduct/, "adductors"],
  [/squat|leg press|lunge|leg extension|step up|split/, "quads"],
  [/deadlift|back extension|hyperextension/, "lowerBack"],
  [/pulldown|pull up|chin up|pullover|lat/, "lats"],
  [/row/, "upperBack"],
  [/overhead|shoulder|military|arnold/, "frontDelts"],
  [/bench|chest|fly|push up|press/, "chest"],
];

/** A best guess at the main muscle and load kind of an exercise we don't know. */
export function guessExercise(name: string): { primary: Muscle; load: LoadKind; compound: boolean } {
  const n = ` ${[...tokens(name)].join(" ")} `;
  const primary = MUSCLE_WORDS.find(([re]) => re.test(n))?.[1] ?? "abs";
  const load: LoadKind = /barbell|ez/.test(n)
    ? "barbell"
    : /dumbbell/.test(n)
      ? "dumbbell"
      : /kettlebell/.test(n)
        ? "kettlebell"
        : /machine/.test(n)
          ? "machine"
          : "bodyweight";
  const compound = /squat|deadlift|press|row|pull up|chin up|dip|lunge|thrust|clean|snatch/.test(n) && !/leg press calf/.test(n);
  return { primary, load, compound };
}

/** "custom" adds the name as the lifter's own exercise; otherwise a library id. */
export type Mapping = Record<string, string>;

/** Cardio names the other apps use, to the library's cardio exercises. Checked in order, so treadmill beats run. */
const CARDIO_NAMES: [RegExp, string][] = [
  [/treadmill/, "treadmill-run"],
  [/\b(run|running|jog|jogging)\b/, "outdoor-run"],
  [/\b(walk|walking|hike|hiking)\b/, "brisk-walk"],
  [/\b(row|rowing|rower|erg)\b/, "rowing-machine"],
  [/ski/, "ski-erg"],
  [/\b(stationary|spin|spinning|assault|air bike|exercise bike|indoor)\b/, "stationary-bike"],
  [/\b(cycling|cycle|bike|biking)\b/, "outdoor-cycling"],
  [/elliptical|cross ?trainer/, "elliptical"],
  [/stair|step ?mill/, "stair-climber"],
  [/rope|skipping/, "jump-rope"],
];

/** The library's cardio exercise for a cardio name from another app ("Running (Treadmill)", "Cycling"), if one fits. */
export function matchCardio(name: string): string | null {
  const n = name.toLowerCase().replace(/[^a-z ]+/g, " ");
  for (const [re, id] of CARDIO_NAMES) if (re.test(n) && EXERCISE_BY_ID.get(id)?.cardio) return id;
  return null;
}

/** Every distinct exercise name in the file, with the best library match as the default. */
export function defaultMapping(file: ImportFile): Mapping {
  const out: Mapping = {};
  // A name whose sets are all time or distance without reps is cardio, matched to the cardio exercises first.
  const cardio = new Map<string, boolean>();
  for (const w of file.workouts)
    for (const s of w.sets) cardio.set(s.name, (cardio.get(s.name) ?? true) && !s.reps && (!!s.distance || !!s.seconds));
  for (const [name, isCardio] of cardio) out[name] = (isCardio ? matchCardio(name) : null) ?? matchExercise(name)?.id ?? "custom";
  return out;
}

export const customId = (name: string) => `custom-imp-${hash(name.trim().toLowerCase()).toString(36)}`;

const sessionIdOf = (format: ImportFormat, w: ImportWorkout) => `imp-${format}-${hash(w.key).toString(36)}-${w.start.toString(36)}`;

/** Titles that only say "a workout", which make no routine. */
const PLAIN_TITLE =
  /^(workout|untitled|untitled workout|new workout|training|session|my workout|(morning|afternoon|evening|night) workout)$/i;

/** Workouts by name (lower case), for names done at least twice: the routines an import can make. */
export function repeatedTitles(file: ImportFile, now: number): Map<string, ImportWorkout[]> {
  const byTitle = new Map<string, ImportWorkout[]>();
  for (const w of file.workouts) {
    const title = w.title.trim();
    if (!title || PLAIN_TITLE.test(title) || w.start > now || !w.sets.length) continue;
    const key = title.toLowerCase();
    byTitle.set(key, [...(byTitle.get(key) ?? []), w]);
  }
  for (const [k, list] of byTitle) if (list.length < 2) byTitle.delete(k);
  return byTitle;
}

/**
 * Routines from an imported history (2026-11-13): none of the apps put routines in their export, but a
 * workout done under the same name at least twice ("Push day", "Workout A") is one. Its newest time becomes a
 * routine with those exercises, set counts and supersets. Ids come from the name, so importing again changes
 * nothing, and a routine already saved under that id (the lifter may have edited it) is left alone. Call
 * with the events `importEvents` made (custom exercises registered), newest routines first.
 */
export function importRoutines(file: ImportFile, events: readonly AppEvent[], saved: readonly Routine[], now: number): Routine[] {
  const have = new Set(saved.map((r) => r.id));
  const out: { at: number; r: Routine }[] = [];
  for (const [key, list] of repeatedTitles(file, now)) {
    const id = `imp-r-${hash(`${file.format}|${key}`).toString(36)}`;
    if (have.has(id)) continue;
    const latest = list.reduce((a, b) => (b.start > a.start ? b : a));
    const items = doneItems(events, sessionIdOf(file.format, latest));
    if (!items.length) continue;
    const r = routineFrom(items, latest.title, id, now);
    if (r.items.length) out.push({ at: latest.start, r });
  }
  return out.sort((a, b) => b.at - a.at).map((x) => x.r);
}

/**
 * The events for an import. `unit` is the file's unit (asked when the file doesn't say), `gymId` the
 * gym the workouts are filed under. Ids come from the file, so `have` (ids already saved) skips
 * anything imported before. Workouts in the future are left out.
 */
export function importEvents(
  file: ImportFile,
  mapping: Mapping,
  unit: Unit,
  gymId: string,
  now: number,
  have: ReadonlySet<string> = new Set(),
): { events: AppEvent[]; workouts: number; sets: number } {
  const events: AppEvent[] = [];
  const known = new Set(EXERCISE_BY_ID.keys());
  for (const [name, to] of Object.entries(mapping)) {
    if (to !== "custom") continue;
    const id = customId(name);
    if (known.has(id) || have.has(`cx-${id}`)) continue;
    known.add(id);
    const g = guessExercise(name);
    events.push({
      type: "customExercise",
      id: `cx-${id}`,
      at: now,
      exercise: { id, name: name.trim().slice(0, 60), primary: [g.primary], secondary: [], load: g.load, compound: g.compound },
    });
  }
  let workouts = 0;
  let sets = 0;
  for (const w of file.workouts) {
    if (w.start > now || !w.sets.length) continue;
    const sessionId = sessionIdOf(file.format, w);
    if (have.has(`${sessionId}-start`)) continue;
    const minutes = Math.min(600, Math.max(1, w.minutes ?? Math.round(w.sets.length * 2.5)));
    const span = Math.min(now, w.start + minutes * 60_000) - w.start;
    const at = (i: number) => Math.round(w.start + (span * (i + 1)) / (w.sets.length + 1));
    const start: SessionStartEvent = {
      type: "sessionStart",
      id: `${sessionId}-start`,
      at: w.start,
      sessionId,
      gymId,
      minutes,
      source: "manual",
    };
    const body: AppEvent[] = w.sets.flatMap((s, i): AppEvent[] => {
      const exerciseId = mapping[s.name] === "custom" || !mapping[s.name] ? customId(s.name) : mapping[s.name];
      const kg = Math.round(toKg(s.weight, s.unit ?? unit) * 1000) / 1000;
      const cardio = EXERCISE_BY_ID.get(exerciseId)?.cardio;
      // Cardio logs time as its reps (types.ts) and the distance in metres when the exercise takes one.
      const reps = cardio ? s.seconds || s.reps || 0 : s.reps || s.seconds || 0;
      const metres =
        cardio === "distance" && s.distance ? Math.round(s.distance * METRES[s.distUnit ?? (unit === "lb" ? "mi" : "km")]) : undefined;
      // A distance with no time, filed under an exercise that doesn't take one, has nothing to log.
      if (reps <= 0 && !metres) return [];
      if (s.warmup)
        return [{ type: "warmup", id: `${sessionId}-w${i}`, at: at(i), sessionId, exerciseId, weight: kg, reps } satisfies WarmupEvent];
      sets++;
      return [
        {
          type: "set",
          id: `${sessionId}-s${i}`,
          at: at(i),
          sessionId,
          exerciseId,
          weight: kg,
          reps,
          targetReps: reps,
          targetWeight: kg,
          rir: MANUAL_RIR,
          ...(s.superset ? { superset: `${sessionId}-${s.superset}` } : {}),
          ...(s.tag ? { tag: s.tag } : {}),
          ...(metres ? { distanceM: metres } : {}),
        } satisfies SetEvent,
      ];
    });
    if (!body.length) continue;
    const end: SessionEndEvent = {
      type: "sessionEnd",
      id: `${sessionId}-end`,
      at: w.start + span,
      sessionId,
      seconds: Math.round(span / 1000),
    };
    events.push(start, ...body, end);
    workouts++;
  }
  return { events, workouts, sets };
}
