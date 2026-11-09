import { dedupe } from "./derive";
import { EXERCISE_BY_ID } from "./exercises";
import { TIMED } from "./progression";
import type { AppEvent, EffortEvent, Profile, SetEvent } from "./types";

// One-rep max estimates for the Progress screen's calculator (Melvin, 2026-11-09: "use the latest research
// and algorithms, use as much existing data as possible").
//
// How a set becomes an estimate:
//  1. Reps to failure = reps done + reps in reserve. The RIR comes from what the lifter said afterwards
//     (an effort event), else from what happened (an AMRAP, challenge or missed set went to failure; extra
//     reps over the target used some of the planned reserve), else the plan's RIR. Imported and web-logged
//     sets have no real RIR, so they get the default and count for less.
//  2. The formula depends on the rep range. Up to 10 reps to failure, Brzycki and Epley are the most
//     accurate of the classic equations (LeSuer 1997, Reynolds 2006); above that Mayhew and Wathan hold up
//     better. Each is averaged with Marzagao's 2026 weight-dependent equation, fitted on 303,494 near-failure
//     sets across 388 exercises, which was 17% more consistent than any classic formula.
//  3. Sets past 20 reps to failure are ignored (every formula drifts badly there), and sets past 12 count
//     for less. So do sets far from failure, because lifters misjudge reserve more the further they are
//     from failure (Refalo 2023).
//  4. Each session's best set is one data point. Today's estimate is a weighted mean of the best three of
//     the last 6 months, weighted for recency (6-week half-life), set quality and reps (closest to a
//     single counts most). Strength holds for about 3 weeks without training and then slowly fades
//     (Bosquet 2013), so older points are marked down about 1% a month after that.
//  5. A max entered at setup is used only while there are no logged sets for that lift.

const DAY = 86400_000;
export const WINDOW_DAYS = 180;
/** Reps to failure past this aren't used at all. */
export const MAX_RTF = 20;
/** Assumed reps in reserve for sets logged without one (web log, CSV import). Same as dashboard.ts's MANUAL_RIR. */
const ASSUMED_RIR = 2;

export type FormulaId = "epley" | "brzycki" | "lombardi" | "mayhew" | "oconner" | "wathan" | "lander" | "marzagao";

export interface Formula {
  id: FormulaId;
  name: string;
  year: number;
  /** Estimated 1RM from weight (kg) and reps to failure. */
  fn: (w: number, r: number) => number;
}

/** Marzagao 2026: k(w) = −2.55 + 4.58 ln(w), in kilograms; floored at 0.5 as in the paper. */
export function marzagao(w: number, r: number): number {
  if (r <= 1 || w <= 0) return w;
  const k = Math.max(0.5, -2.55 + 4.58 * Math.log(w));
  return w * (1 + Math.pow(r - 1, 0.85) / k);
}

export const FORMULAS: readonly Formula[] = [
  { id: "epley", name: "Epley", year: 1985, fn: (w, r) => (r <= 1 ? w : w * (1 + r / 30)) },
  // Brzycki breaks down past 36 reps; the caller never goes past MAX_RTF.
  { id: "brzycki", name: "Brzycki", year: 1993, fn: (w, r) => (r <= 1 ? w : (w * 36) / (37 - Math.min(r, 30))) },
  { id: "lombardi", name: "Lombardi", year: 1989, fn: (w, r) => w * Math.pow(r, 0.1) },
  { id: "mayhew", name: "Mayhew", year: 1992, fn: (w, r) => (r <= 1 ? w : (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r))) },
  { id: "oconner", name: "O'Conner", year: 1989, fn: (w, r) => (r <= 1 ? w : w * (1 + r / 40)) },
  { id: "wathan", name: "Wathan", year: 1994, fn: (w, r) => (r <= 1 ? w : (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r))) },
  { id: "lander", name: "Lander", year: 1985, fn: (w, r) => (r <= 1 ? w : (100 * w) / (101.3 - 2.67123 * r)) },
  { id: "marzagao", name: "Marzagao", year: 2026, fn: marzagao },
];
const BY_ID = new Map(FORMULAS.map((f) => [f.id, f]));

/** The formulas the best estimate averages for a given number of reps to failure. */
export function formulasFor(rtf: number): FormulaId[] {
  return rtf <= 10 ? ["brzycki", "epley", "marzagao"] : ["mayhew", "wathan", "marzagao"];
}

/** Best estimate for one set: weight (kg) and reps to failure. */
export function estimate(weight: number, rtf: number): number {
  if (!(weight > 0) || !(rtf >= 1)) return 0;
  if (rtf <= 1) return weight;
  const ids = formulasFor(rtf);
  return ids.reduce((s, id) => s + BY_ID.get(id)!.fn(weight, rtf), 0) / ids.length;
}

/** Every formula's answer for a set, for the calculator's "how each formula sees it" list. */
export function allFormulas(weight: number, rtf: number): { id: FormulaId; name: string; year: number; e1rm: number; used: boolean }[] {
  const used = new Set(rtf <= 1 ? [] : formulasFor(rtf));
  return FORMULAS.map((f) => ({ id: f.id, name: f.name, year: f.year, e1rm: weight > 0 && rtf >= 1 ? f.fn(weight, rtf) : 0, used: used.has(f.id) }));
}

/** Weight (kg) for `reps` with `rir` in reserve, from a 1RM: the best estimate turned around by bisection. */
export function weightForReps(e1rm: number, reps: number, rir = 0): number {
  const rtf = reps + rir;
  if (!(e1rm > 0)) return 0;
  if (rtf <= 1) return e1rm;
  let lo = 0;
  let hi = e1rm;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (estimate(mid, rtf) > e1rm) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export type RirSource = "reported" | "failure" | "planned" | "assumed";

export interface SetEstimate {
  setId: string;
  sessionId: string;
  at: number;
  weight: number;
  reps: number;
  rir: number;
  rirSource: RirSource;
  rtf: number;
  e1rm: number;
  /** 0 to 1: how much this set's estimate is trusted. */
  quality: number;
}

/** What a logged set says about reps in reserve, and where that came from. */
export function rirOf(s: SetEvent, reported?: number): { rir: number; source: RirSource } {
  if (reported !== undefined) return { rir: Math.max(0, Math.min(4, reported)), source: "reported" };
  if (s.amrap || s.challenge || (s.targetReps > 0 && s.reps < s.targetReps)) return { rir: 0, source: "failure" };
  // Logged live sets carry when they started; web-logged and imported ones don't.
  if (s.startedAt === undefined) return { rir: ASSUMED_RIR, source: "assumed" };
  const extra = Math.max(0, s.reps - s.targetReps);
  return { rir: Math.max(0, Math.min(4, s.rir - extra)), source: "planned" };
}

/** How much a set's estimate is trusted: close to failure, low reps, a known RIR. */
export function qualityOf(rtf: number, rir: number, source: RirSource): number {
  const reps = rtf <= 6 ? 1 : rtf <= 12 ? 1 - (rtf - 6) * 0.05 : 0.7 - (rtf - 12) * 0.06;
  const reserve = 1 / (1 + 0.25 * rir);
  const src = source === "reported" || source === "failure" ? 1 : source === "planned" ? 0.85 : 0.6;
  return Math.max(0.05, reps * reserve * src);
}

/** Sets that can say something about a 1RM: loaded, counted in reps, not done light for an injury. */
function usable(s: SetEvent): boolean {
  const ex = EXERCISE_BY_ID.get(s.exerciseId);
  return !!ex && !TIMED.has(s.exerciseId) && s.weight > 0 && s.reps >= 1 && !s.injuryPct;
}

/** Every usable set of the lifter's history turned into an estimate, oldest first. */
export function setEstimates(events: readonly AppEvent[], exerciseId?: string): SetEstimate[] {
  const all = dedupe(events);
  const effort = new Map<string, number>();
  for (const e of all) if (e.type === "effort") effort.set((e as EffortEvent).setId, (e as EffortEvent).rir);
  const out: SetEstimate[] = [];
  for (const e of all) {
    if (e.type !== "set") continue;
    const s = e as SetEvent;
    if ((exerciseId && s.exerciseId !== exerciseId) || !usable(s)) continue;
    const { rir, source } = rirOf(s, effort.get(s.id));
    const rtf = s.reps + rir;
    if (rtf > MAX_RTF) continue;
    out.push({ setId: s.id, sessionId: s.sessionId, at: s.at, weight: s.weight, reps: s.reps, rir, rirSource: source, rtf, e1rm: estimate(s.weight, rtf), quality: qualityOf(rtf, rir, source) });
  }
  return out.sort((a, b) => a.at - b.at);
}

/** Each session's most trusted high estimate (estimate × quality), oldest first: the trend line. */
export function sessionBests(sets: readonly SetEstimate[]): SetEstimate[] {
  const by = new Map<string, SetEstimate>();
  for (const s of sets) {
    const cur = by.get(s.sessionId);
    if (!cur || s.e1rm * (0.5 + 0.5 * s.quality) > cur.e1rm * (0.5 + 0.5 * cur.quality)) by.set(s.sessionId, s);
  }
  return [...by.values()].sort((a, b) => a.at - b.at);
}

/** Share of strength kept after `days` without that point being refreshed: 1 for 3 weeks, then ~1% a month. */
export function detrain(days: number): number {
  return days <= 21 ? 1 : Math.max(0.85, 1 - ((days - 21) / 30) * 0.01);
}

export interface OneRm {
  exerciseId: string;
  /** Kilograms. */
  e1rm: number;
  /** Likely range, kilograms. */
  low: number;
  high: number;
  /** The set the estimate leans on most. */
  basis?: SetEstimate;
  /** "logged" from sets, "setup" from the max entered at setup. */
  source: "logged" | "setup";
  confidence: "high" | "medium" | "low";
  /** Session points used, for the trend chart. */
  trend: { at: number; e1rm: number }[];
  sessions: number;
}

export function oneRm(events: readonly AppEvent[], exerciseId: string, now: number, profile?: Pick<Profile, "knownMaxes">): OneRm | null {
  const bests = sessionBests(setEstimates(events, exerciseId));
  const trend = bests.map((b) => ({ at: b.at, e1rm: Math.round(b.e1rm * 10) / 10 }));
  const recent = bests.filter((b) => b.at >= now - WINDOW_DAYS * DAY);
  if (!recent.length) {
    const known = profile?.knownMaxes?.[exerciseId];
    if (!known) return null;
    return { exerciseId, e1rm: known, low: known * 0.92, high: known * 1.08, source: "setup", confidence: "low", trend, sessions: 0 };
  }
  const scored = recent.map((b) => {
    const days = Math.max(0, (now - b.at) / DAY);
    return { b, value: b.e1rm * detrain(days), weight: b.quality * Math.pow(0.5, days / 42) };
  });
  // The best three sessions (after detraining), so one easy day doesn't drag the estimate down.
  const top = [...scored].sort((a, b) => b.value - a.value).slice(0, 3);
  const wsum = top.reduce((s, x) => s + x.weight, 0);
  const e1rm = top.reduce((s, x) => s + x.value * x.weight, 0) / wsum;
  const basis = [...top].sort((a, b) => b.weight - a.weight)[0].b;
  // Error grows with reps to failure and with a guessed RIR; agreeing sessions shrink it.
  const base = basis.rtf <= 5 ? 0.03 : basis.rtf <= 10 ? 0.05 : 0.08;
  const guess = basis.rirSource === "assumed" ? 0.03 : basis.rirSource === "planned" ? 0.01 : 0;
  const values = top.map((x) => x.value);
  const spread = top.length > 1 ? (Math.max(...values) - Math.min(...values)) / e1rm / 2 : 0.02;
  const err = Math.min(0.15, base + guess + spread * 0.5);
  const confidence = err <= 0.05 && top.length >= 2 ? "high" : err <= 0.08 ? "medium" : "low";
  return { exerciseId, e1rm, low: e1rm * (1 - err), high: e1rm * (1 + err), basis, source: "logged", confidence, trend, sessions: recent.length };
}

/** Every exercise with a usable estimate, most sessions first. */
export function allOneRms(events: readonly AppEvent[], now: number, profile?: Pick<Profile, "knownMaxes">): OneRm[] {
  const ids = new Set<string>();
  for (const e of events) if (e.type === "set" && usable(e as SetEvent)) ids.add((e as SetEvent).exerciseId);
  for (const id of Object.keys(profile?.knownMaxes ?? {})) if (EXERCISE_BY_ID.has(id)) ids.add(id);
  return [...ids]
    .map((id) => oneRm(events, id, now, profile))
    .filter((x): x is OneRm => !!x)
    .sort((a, b) => b.sessions - a.sessions || b.e1rm - a.e1rm);
}

/** The usual %1RM training table: reps 1 to 12 at 0 RIR. */
export function repTable(e1rm: number, maxReps = 12): { reps: number; weight: number; pct: number }[] {
  return Array.from({ length: maxReps }, (_, i) => {
    const w = weightForReps(e1rm, i + 1);
    return { reps: i + 1, weight: w, pct: Math.round((w / e1rm) * 100) };
  });
}

// --- DOTS (Melvin, 2026-11-09) ---------------------------------------------------------------------------
// The powerlifting total scaled by body weight, so lifters of any size compare. Coefficients are the
// published DOTS polynomial by Tim Konertz (BVDK), checked against OpenPowerlifting's crates/coefficients/src/dots.rs
// (body weight in kg, clamped to 40–210 kg for men and 40–150 kg for women).

const DOTS_COEF = {
  male: [-307.75076, 24.0900756, -0.1918759221, 0.0007391293, -0.000001093],
  female: [-57.96288, 13.6175032, -0.1126655495, 0.0005158568, -0.0000010706],
} as const;

export function dots(totalKg: number, bodyweightKg: number, sex: "male" | "female"): number {
  if (!(totalKg > 0) || !(bodyweightKg > 0)) return 0;
  const bw = Math.min(sex === "male" ? 210 : 150, Math.max(40, bodyweightKg));
  const [a, b, c, d, e] = DOTS_COEF[sex];
  const denom = a + b * bw + c * bw ** 2 + d * bw ** 3 + e * bw ** 4;
  return (totalKg * 500) / denom;
}

/** Rough DOTS levels used by lifters and coaches (not an official scale). */
export function dotsBand(score: number): string {
  if (score >= 500) return "Elite";
  if (score >= 400) return "Advanced";
  if (score >= 300) return "Intermediate";
  if (score >= 200) return "Novice";
  return "Beginner";
}

export const DOTS_LIFTS = { squat: "back-squat", bench: "bench-press", deadlift: "deadlift" } as const;
export type DotsLift = keyof typeof DOTS_LIFTS;

/** The lifter's latest body weight: the newest weigh-in, else the profile's. */
export function latestBodyweight(events: readonly AppEvent[], profile: Pick<Profile, "bodyweight">): number {
  let best: { at: number; kg: number } | null = null;
  for (const e of events) if (e.type === "bodyweight" && (!best || e.at > best.at)) best = { at: e.at, kg: e.kg };
  return best?.kg ?? profile.bodyweight;
}

export interface DotsReport {
  lifts: Record<DotsLift, OneRm | null>;
  total: number;
  bodyweight: number;
  score: number | null;
  sex: "male" | "female";
}

/** DOTS from the lifter's own estimated maxes. Null score until all three lifts have one. */
export function dotsFromData(events: readonly AppEvent[], profile: Pick<Profile, "bodyweight" | "knownMaxes" | "sex">, now: number, sex = profile.sex ?? "male"): DotsReport {
  const lifts = Object.fromEntries((Object.keys(DOTS_LIFTS) as DotsLift[]).map((k) => [k, oneRm(events, DOTS_LIFTS[k], now, profile)])) as Record<DotsLift, OneRm | null>;
  const total = Object.values(lifts).reduce((s, l) => s + (l?.e1rm ?? 0), 0);
  const bodyweight = latestBodyweight(events, profile);
  const complete = Object.values(lifts).every((l) => !!l);
  return { lifts, total, bodyweight, score: complete ? dots(total, bodyweight, sex) : null, sex };
}
