import type { AppEvent, HrSeriesEvent, PainEvent, PartKind, SessionEndEvent, SessionPart, SessionStartEvent } from "./types";

// Workouts with parts, stage 4 (Melvin, 2026-11-13; docs/decisions/sessions-with-parts.md): the numbers each part
// already records, read per part, only where they lead to something to do. Heart rate per part is cut from the
// workout's stream by each part's start and end, and pain before and after rehab is read from the pain ratings the
// lifter already gives. Nothing new is stored; everything is derived from events every time.

const DAY = 86_400_000;
/** A rating this long before a workout still counts as how it felt going in. */
export const BEFORE_MS = 12 * 3600_000;
/** The end of a cool-down: its last minute. */
const END_MS = 60_000;
/** A cool-down that ends at or above this, and no lower than the lifting, hasn't brought the heart rate down. */
export const COOL_HR_HIGH = 100;

export interface PartHr {
  kind: PartKind;
  avg: number;
  peak: number;
  /** Mean of the part's last minute, when there are readings in it. */
  end?: number;
}

const mean = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Average, peak and last-minute heart rate for each part that has readings in the stream. */
export function hrOfParts(series: HrSeriesEvent, parts: readonly SessionPart[]): PartHr[] {
  const out: PartHr[] = [];
  for (const p of parts) {
    const all: number[] = [];
    const last: number[] = [];
    for (let i = 0; i < series.t.length; i++) {
      const at = series.start + series.t[i]! * 1000;
      const bpm = series.bpm[i]!;
      if (at < p.start || at >= p.end || !(bpm > 0)) continue; // from the part's start up to its end
      all.push(bpm);
      if (at >= p.end - END_MS) last.push(bpm);
    }
    if (!all.length) continue;
    out.push({
      kind: p.kind,
      avg: Math.round(mean(all)),
      peak: Math.max(...all),
      ...(last.length ? { end: Math.round(mean(last)) } : {}),
    });
  }
  return out;
}

export interface SessionPain {
  injuryId: string;
  /** How it felt going in: a rating in the 12 hours before Start, else the first of two or more in the workout. */
  before?: number;
  /** The last rating in the workout (between sets or on Done). */
  after: number;
  at: number;
}

/** Pain before and after a workout, for each injury rated during it. */
export function sessionPain(events: readonly AppEvent[], sessionId: string, start: number): SessionPain[] {
  const pains = events.filter((e): e is PainEvent => e.type === "pain").sort((a, b) => a.at - b.at);
  const ids = new Set(pains.filter((p) => p.sessionId === sessionId).map((p) => p.injuryId));
  const out: SessionPain[] = [];
  for (const injuryId of ids) {
    const inside = pains.filter((p) => p.injuryId === injuryId && p.sessionId === sessionId);
    const ahead = pains.filter((p) => p.injuryId === injuryId && !p.sessionId && p.at <= start && start - p.at <= BEFORE_MS).at(-1);
    const after = inside.at(-1)!;
    const before = ahead?.score ?? (inside.length > 1 ? inside[0]!.score : undefined);
    out.push({ injuryId, ...(before !== undefined ? { before: Math.round(before) } : {}), after: Math.round(after.score), at: after.at });
  }
  return out;
}

export interface PainTrend {
  injuryId: string;
  /** Pain after workouts, start of the window and now (each the mean of two workouts, rounded). */
  from: number;
  to: number;
  /** Workouts it was read from. */
  workouts: number;
  days: number;
  /** The newest workout, so a note about it changes when a new one is rated. */
  last: number;
}

/**
 * How pain after workouts has moved over the last four weeks, per injury still active: three or more rated workouts
 * at least ten days apart, the first two against the last two. Only a change of two points or more counts.
 */
export function rehabPainTrends(events: readonly AppEvent[], now: number): PainTrend[] {
  const healed = new Set(events.filter((e) => e.type === "injuryHealed").map((e) => e.injuryId));
  const starts = new Map(events.filter((e): e is SessionStartEvent => e.type === "sessionStart").map((e) => [e.sessionId, e.at]));
  const byInjury = new Map<string, SessionPain[]>();
  for (const [sessionId, start] of starts) {
    if (now - start > 28 * DAY || start > now) continue;
    for (const p of sessionPain(events, sessionId, start)) {
      if (healed.has(p.injuryId)) continue;
      byInjury.set(p.injuryId, [...(byInjury.get(p.injuryId) ?? []), p]);
    }
  }
  const out: PainTrend[] = [];
  for (const [injuryId, list] of byInjury) {
    const xs = list.sort((a, b) => a.at - b.at);
    if (xs.length < 3) continue;
    const days = Math.round((xs.at(-1)!.at - xs[0]!.at) / DAY);
    if (days < 10) continue;
    const from = Math.round((xs[0]!.after + xs[1]!.after) / 2);
    const to = Math.round((xs.at(-1)!.after + xs.at(-2)!.after) / 2);
    if (Math.abs(to - from) < 2) continue;
    out.push({ injuryId, from, to, workouts: xs.length, days, last: xs.at(-1)!.at });
  }
  return out;
}

export interface CoolHr {
  /** Cool-downs whose heart rate stayed up, of those read. */
  high: number;
  of: number;
  /** The newest cool-down's last-minute heart rate. */
  end: number;
  sessionId: string;
}

/**
 * Whether the heart rate stays up through the cool-down: the last three workouts in three weeks with a cool-down
 * part and a heart rate stream, and in two or more of them the cool-down's last minute was 100 bpm or more and no
 * lower than the lifting's average.
 */
export function coolHrHigh(events: readonly AppEvent[], now: number): CoolHr | null {
  const series = new Map(events.filter((e): e is HrSeriesEvent => e.type === "hrSeries").map((e) => [e.sessionId, e]));
  const read: { sessionId: string; end: number; high: boolean }[] = [];
  const ends = events
    .filter((e): e is SessionEndEvent => e.type === "sessionEnd" && !!e.parts?.some((p) => p.kind === "cool"))
    .filter((e) => e.at <= now && now - e.at <= 21 * DAY)
    .sort((a, b) => b.at - a.at);
  for (const e of ends) {
    const s = series.get(e.sessionId);
    if (!s) continue;
    const hr = hrOfParts(s, e.parts!);
    const cool = hr.find((h) => h.kind === "cool");
    const work = hr.find((h) => h.kind === "lift" || h.kind === "rehab" || h.kind === "cardio");
    if (cool?.end === undefined || !work) continue;
    read.push({ sessionId: e.sessionId, end: cool.end, high: cool.end >= COOL_HR_HIGH && cool.end >= work.avg });
    if (read.length === 3) break;
  }
  const high = read.filter((r) => r.high).length;
  if (high < 2) return null;
  return { high, of: read.length, end: read[0]!.end, sessionId: read[0]!.sessionId };
}

/** The mean speed of a set's full reps (m/s), for `meanSpeed` on the set. Nothing without a scale. */
export function meanFullSpeed(reps: readonly { kind: string; speed: number; speedIsMetres: boolean }[]): number | undefined {
  const xs = reps.filter((r) => r.kind === "full" && r.speedIsMetres && r.speed > 0).map((r) => r.speed);
  return xs.length ? Math.round(mean(xs) * 1000) / 1000 : undefined;
}
