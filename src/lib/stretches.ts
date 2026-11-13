import type { MessageKey } from "@/locales/en";

import { fold } from "./exerciseSearch";
import { english, inSentence, list, t } from "./i18n";
import { dayKey, hash, rng } from "./random";
import { MUSCLE_LABEL, MUSCLES, type Equipment, type Muscle } from "./types";

// The stretch library (Melvin, 2026-11-11: "all kinds of different stretches, before or after the workout").
// Two kinds: "warm" moves (dynamic stretches and drills that raise the pulse and take joints through their
// range, for before lifting) and "cool" holds (static stretches for after, or any day). Every muscle in the
// app has at least one of each (checked by a test). Today offers a warm-up built from the day's plan, Done
// offers a cool-down for the muscles just trained, a rest day offers holds for what trained recently, and
// the library (#/stretch) lets the lifter pick any and run them on any day. All optional: nothing here ever
// blocks starting or finishing a workout. Every stretch has a 3D demo (src/lib/demo/stretchMotions.ts).
//
// Text: the first group (the general warm-up's drills, which this replaced) keeps its warm.<id> keys; the
// rest are str.<id> and str.<id>.how (src/locales/text/str.ts).

export type StretchKind = "warm" | "cool";

export interface Stretch {
  id: string;
  kind: StretchKind;
  /** In the app's language. */
  readonly name: string;
  /** How to do it, in the app's language. */
  readonly how: string;
  /** Seconds to hold (per side when `eachSide`), or 0 when it's counted in `reps`. */
  seconds: number;
  reps?: number;
  /** Done on each side: the hold or the reps count twice. */
  eachSide?: boolean;
  /** The muscles it stretches or readies. */
  for: Muscle[];
  needs?: Equipment[];
  /** Raises the heart rate: a warm-up starts with one. */
  pulse?: boolean;
  /** Its name's catalogue key (warm.<id> or str.<id>). */
  textKey: string;
}

type Row = Omit<Stretch, "name" | "how" | "textKey"> & { text?: "warm" };

// prettier-ignore
const ROWS: Row[] = [
  // ---- Warm-up: the general warm-up's drills (text in warm.*)
  { id: "march", kind: "warm", seconds: 60, for: [], pulse: true, text: "warm" },
  { id: "jacks", kind: "warm", seconds: 45, for: ["calves", "sideDelts"], pulse: true, text: "warm" },
  { id: "rower", kind: "warm", seconds: 120, for: [], pulse: true, text: "warm" },
  { id: "arm-circles", kind: "warm", seconds: 30, for: ["frontDelts", "sideDelts", "rearDelts"], text: "warm" },
  { id: "pull-aparts", kind: "warm", seconds: 0, reps: 15, for: ["rearDelts", "upperBack"], needs: ["bands"], text: "warm" },
  { id: "scap-pushups", kind: "warm", seconds: 0, reps: 10, for: ["chest", "upperBack"], text: "warm" },
  { id: "inchworm", kind: "warm", seconds: 0, reps: 5, for: ["hamstrings", "abs", "chest"], text: "warm" },
  { id: "t-spine", kind: "warm", seconds: 0, reps: 8, eachSide: true, for: ["upperBack", "obliques", "lats"], text: "warm" },
  { id: "cat-cow", kind: "warm", seconds: 0, reps: 8, for: ["lowerBack", "abs"], text: "warm" },
  { id: "dead-hang", kind: "warm", seconds: 20, for: ["lats", "forearms"], needs: ["pullupBar"], text: "warm" },
  { id: "wrist", kind: "warm", seconds: 30, for: ["forearms", "biceps", "triceps"], text: "warm" },
  { id: "bw-squat", kind: "warm", seconds: 0, reps: 10, for: ["quads", "glutes", "adductors"], text: "warm" },
  { id: "leg-swings", kind: "warm", seconds: 0, reps: 10, eachSide: true, for: ["hamstrings", "adductors", "glutes"], text: "warm" },
  { id: "worlds-greatest", kind: "warm", seconds: 0, reps: 5, eachSide: true, for: ["glutes", "quads", "hamstrings", "upperBack"], text: "warm" },
  { id: "glute-bridge", kind: "warm", seconds: 0, reps: 12, for: ["glutes", "hamstrings"], text: "warm" },
  { id: "hip-hinge", kind: "warm", seconds: 0, reps: 10, for: ["hamstrings", "lowerBack", "glutes"], text: "warm" },
  { id: "ankle-rocks", kind: "warm", seconds: 0, reps: 10, eachSide: true, for: ["calves", "quads"], text: "warm" },
  { id: "dead-bug", kind: "warm", seconds: 0, reps: 8, eachSide: true, for: ["abs", "obliques"], text: "warm" },
  // ---- Warm-up: dynamic stretches
  { id: "shoulder-rolls", kind: "warm", seconds: 0, reps: 10, for: ["traps", "upperBack"] },
  { id: "arm-swings", kind: "warm", seconds: 0, reps: 12, for: ["chest", "upperBack", "frontDelts"] },
  { id: "knee-hug", kind: "warm", seconds: 0, reps: 6, eachSide: true, for: ["glutes", "lowerBack"] },
  { id: "toy-soldier", kind: "warm", seconds: 0, reps: 6, eachSide: true, for: ["hamstrings", "calves"] },
  { id: "butt-kicks", kind: "warm", seconds: 30, for: ["quads", "calves"], pulse: true },
  { id: "lateral-lunge", kind: "warm", seconds: 0, reps: 6, eachSide: true, for: ["adductors", "glutes", "quads"] },
  { id: "dog-pedal", kind: "warm", seconds: 30, for: ["calves", "hamstrings", "lats"] },
  // ---- Cool-down: static holds
  { id: "doorway-chest", kind: "cool", seconds: 30, for: ["chest", "frontDelts"] },
  { id: "cross-body", kind: "cool", seconds: 30, eachSide: true, for: ["rearDelts", "sideDelts", "upperBack"] },
  { id: "overhead-triceps", kind: "cool", seconds: 30, eachSide: true, for: ["triceps", "lats"] },
  { id: "behind-back", kind: "cool", seconds: 30, for: ["biceps", "frontDelts", "chest"] },
  { id: "wrist-flexor", kind: "cool", seconds: 30, eachSide: true, for: ["forearms"] },
  { id: "neck-side", kind: "cool", seconds: 30, eachSide: true, for: ["traps"] },
  { id: "kneeling-lat", kind: "cool", seconds: 30, for: ["lats", "triceps"], needs: ["bench"] },
  { id: "childs-pose", kind: "cool", seconds: 45, for: ["lats", "lowerBack", "upperBack"] },
  { id: "thread-needle", kind: "cool", seconds: 30, eachSide: true, for: ["upperBack", "rearDelts"] },
  { id: "cobra", kind: "cool", seconds: 30, for: ["abs"] },
  { id: "supine-twist", kind: "cool", seconds: 30, eachSide: true, for: ["obliques", "lowerBack", "glutes"] },
  { id: "knees-to-chest", kind: "cool", seconds: 30, for: ["lowerBack", "glutes"] },
  { id: "figure-four", kind: "cool", seconds: 30, eachSide: true, for: ["glutes"] },
  { id: "pigeon", kind: "cool", seconds: 45, eachSide: true, for: ["glutes", "adductors"] },
  { id: "standing-quad", kind: "cool", seconds: 30, eachSide: true, for: ["quads"] },
  { id: "kneeling-hip-flexor", kind: "cool", seconds: 30, eachSide: true, for: ["quads", "abs"] },
  { id: "forward-fold", kind: "cool", seconds: 30, for: ["hamstrings", "lowerBack", "calves"] },
  { id: "seated-fold", kind: "cool", seconds: 45, for: ["hamstrings", "lowerBack"] },
  { id: "lying-hamstring", kind: "cool", seconds: 30, eachSide: true, for: ["hamstrings"] },
  { id: "butterfly", kind: "cool", seconds: 45, for: ["adductors"] },
  { id: "straddle", kind: "cool", seconds: 45, for: ["adductors", "hamstrings"] },
  { id: "wall-calf", kind: "cool", seconds: 30, eachSide: true, for: ["calves"] },
  { id: "down-dog", kind: "cool", seconds: 30, for: ["calves", "hamstrings", "lats"] },
];

export const STRETCHES: Stretch[] = ROWS.map(({ text, ...r }) => {
  const key = `${text ?? "str"}.${r.id}`;
  return {
    ...r,
    textKey: key,
    get name() {
      return t(key as MessageKey);
    },
    get how() {
      return t(`${key}.how` as MessageKey);
    },
  };
});

const BY_ID = new Map(STRETCHES.map((s) => [s.id, s]));
export function stretch(id: string): Stretch | undefined {
  return BY_ID.get(id);
}

/**
 * The library's filter: a kind, a muscle, and words typed (every word must match the name, in the app's
 * language or English, or a muscle it's for; accents don't matter, as in the exercise browser).
 */
export function searchStretches(q: { text?: string; kind?: StretchKind | "all"; muscle?: Muscle | "all" }): Stretch[] {
  const words = fold(q.text ?? "")
    .split(/\s+/)
    .filter(Boolean);
  return STRETCHES.filter((s) => {
    if (q.kind && q.kind !== "all" && s.kind !== q.kind) return false;
    if (q.muscle && q.muscle !== "all" && !s.for.includes(q.muscle)) return false;
    if (!words.length) return true;
    const hay = fold([s.name, english(s.textKey as MessageKey), ...s.for.map((m) => MUSCLE_LABEL[m])].join(" "));
    return words.every((w) => hay.includes(w));
  });
}

/** The id the 3D demo knows a stretch by (kept apart from exercise ids: "glute-bridge" is both). */
export const demoId = (id: string) => `stretch:${id}`;

/** Rough time for a stretch: the hold, or reps at about 3 seconds each, twice when it's done on each side. */
export function stretchSeconds(s: Stretch): number {
  const one = s.reps ? s.reps * 3 : s.seconds;
  return one * (s.eachSide ? 2 : 1);
}

export function routineSeconds(list: readonly Stretch[]): number {
  return list.reduce((sum, s) => sum + stretchSeconds(s), 0);
}

/** What a suggestion is for: before today's workout, after the one just done, or on a rest day. */
export type StretchMoment = "warm" | "cool" | "rest";

/**
 * About `minutes` of stretching for `muscles`. A warm-up starts with one pulse raiser, then the moves that
 * cover the most of those muscles; a cool-down or rest day uses holds only. Varied a little by day, and
 * only what the gym's equipment allows. With no muscles (a rest day with nothing trained lately), the
 * whole body.
 */
export function suggest(
  moment: StretchMoment,
  muscles: readonly Muscle[],
  equipment: readonly Equipment[],
  now: number,
  minutes = 5,
): Stretch[] {
  const kind: StretchKind = moment === "warm" ? "warm" : "cool";
  const have = new Set(equipment);
  const can = STRETCHES.filter((s) => s.kind === kind && (s.needs ?? []).every((n) => have.has(n)));
  const r = rng(hash(`stretch:${moment}:${dayKey(now)}`));
  const out: Stretch[] = [];
  if (kind === "warm") {
    const pulses = can.filter((s) => s.pulse && (s.id !== "rower" || minutes >= 6));
    out.push(pulses[Math.floor(r() * pulses.length)]!);
  }
  const want = new Set<Muscle>(muscles.length ? muscles : MUSCLES);
  const budget = minutes * 60;
  let used = routineSeconds(out);
  const covered = new Set<Muscle>();
  const pool = can.filter((s) => !out.includes(s) && !(kind === "warm" && s.pulse)).map((s) => ({ s, jitter: r() }));
  const score = (s: Stretch) => s.for.reduce((sum, m) => sum + (want.has(m) ? (covered.has(m) ? 0.5 : 2) : 0), 0);
  while (used < budget && pool.length) {
    pool.sort((a, b) => score(b.s) - score(a.s) || b.jitter - a.jitter);
    const { s } = pool.shift()!;
    if (score(s) <= 0 && out.length >= 3) break;
    if (used + stretchSeconds(s) > budget + 20) continue;
    out.push(s);
    used += stretchSeconds(s);
    s.for.forEach((m) => covered.add(m));
  }
  return out;
}

/**
 * The short reason shown under a suggested stretch (AGENTS.md "Every recommendation says why"): which of
 * the day's muscles it's for, or that it raises the pulse.
 */
export function stretchWhy(s: Stretch, moment: StretchMoment | "pick", muscles: readonly Muscle[]): string {
  if (moment === "warm" && s.pulse) return t("str.why.pulse");
  const mine = s.for.filter((m) => muscles.includes(m)).slice(0, 3);
  if (moment === "pick" || !mine.length) {
    const names = s.for.slice(0, 3).map((m) => inSentence(MUSCLE_LABEL[m], true));
    return names.length ? t("str.why.for", { muscles: list(names) }) : t("str.why.pulse");
  }
  const names = list(mine.map((m) => inSentence(MUSCLE_LABEL[m], true)));
  return t(moment === "warm" ? "str.why.warm" : moment === "cool" ? "str.why.cool" : "str.why.rest", { muscles: names });
}
