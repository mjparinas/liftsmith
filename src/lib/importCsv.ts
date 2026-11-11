import { MANUAL_RIR } from "./dashboard";
import { englishName, EXERCISE_BY_ID, EXERCISES } from "./exercises";
import { hash } from "./random";
import type {
  AppEvent,
  Exercise,
  LoadKind,
  Muscle,
  SessionEndEvent,
  SessionStartEvent,
  SetEvent,
  SetTag,
  Unit,
  WarmupEvent,
} from "./types";
import { toKg } from "./units";

// CSV import (table stakes, Melvin, 2026-11-09): workouts exported from Strong, Hevy or Liftsmith
// itself become the same events a hand-logged past workout writes (dashboard.ts pastWorkoutEvents):
// a sessionStart marked `source: "manual"`, the sets, and a sessionEnd. Every id is derived from the
// file's own data, so importing the same file twice adds nothing. Everything runs on the device.

export type ImportFormat = "strong" | "hevy" | "liftsmith";

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
  /** Rows left out: cardio, empty sets, or dates that couldn't be read. */
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
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)).getTime();
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

/** Reads a file exported by Strong, Hevy or Liftsmith. Null when it's none of them. */
export function readImport(text: string): ImportFile | null {
  const rows = parseCsv(text);
  if (rows.length < 2) return null;
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => head.findIndex((h) => names.some((n) => h === n || h.startsWith(`${n} (`)));
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  const workouts = new Map<string, ImportWorkout>();
  let skipped = 0;
  const add = (key: string, w: Omit<ImportWorkout, "sets" | "key">, s: ImportSet) => {
    if (!workouts.has(key)) workouts.set(key, { key, ...w, sets: [] });
    workouts.get(key)!.sets.push(s);
  };
  const keep = (reps: number, seconds: number) => reps > 0 || seconds > 0;

  if (col("exercise_title") >= 0 && col("start_time") >= 0) {
    // Hevy: one row per set; weight_kg or weight_lbs says the unit.
    const kg = col("weight_kg");
    const lbs = col("weight_lbs");
    const unit: Unit = kg >= 0 ? "kg" : "lb";
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
      // Cardio (a distance) isn't strength work.
      if (at === null || !get(r, ex) || num(get(r, dist)) > 0 || !keep(n, sec)) {
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
      // Strong writes a "Rest Timer" row between sets on some versions.
      // Strong also writes cardio (a distance), which isn't strength work.
      if (at === null || !get(r, ex) || get(r, order).toLowerCase().startsWith("rest") || num(get(r, dist)) > 0 || !keep(n, sec)) {
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
        },
      );
    }
    return { format: "strong", unit, workouts: [...workouts.values()], skipped };
  }

  if (col("exercise") >= 0 && col("per hand") >= 0 && col("unit") >= 0) {
    // Liftsmith's own "Export sets" file: the unit is on every row.
    const kind = col("type");
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
        },
      );
    }
    return { format: "liftsmith", unit: "kg", workouts: [...workouts.values()], skipped };
  }
  return null;
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

/** Every distinct exercise name in the file, with the best library match as the default. */
export function defaultMapping(file: ImportFile): Mapping {
  const out: Mapping = {};
  for (const w of file.workouts) for (const s of w.sets) if (!(s.name in out)) out[s.name] = matchExercise(s.name)?.id ?? "custom";
  return out;
}

export const customId = (name: string) => `custom-imp-${hash(name.trim().toLowerCase()).toString(36)}`;

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
    const sessionId = `imp-${file.format}-${hash(w.key).toString(36)}-${w.start.toString(36)}`;
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
    const body: AppEvent[] = w.sets.map((s, i) => {
      const exerciseId = mapping[s.name] === "custom" || !mapping[s.name] ? customId(s.name) : mapping[s.name];
      const kg = Math.round(toKg(s.weight, s.unit ?? unit) * 1000) / 1000;
      const reps = s.reps || s.seconds || 0;
      if (s.warmup)
        return { type: "warmup", id: `${sessionId}-w${i}`, at: at(i), sessionId, exerciseId, weight: kg, reps } satisfies WarmupEvent;
      sets++;
      return {
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
      } satisfies SetEvent;
    });
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
