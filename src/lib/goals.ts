import { EXERCISE_BY_ID } from "./exercises";
import { roundLoad } from "./loads";
import { epley, sessionsOf } from "./progression";
import type { AppEvent, Experience, Gym, Profile } from "./types";
import { fmtNum, fromKg } from "./units";

// Goal-date planner (Melvin picked it, 2026-11-09: "it should be realistic"). The lifter sets a one-rep
// max to reach by a date, e.g. a 100 kg bench by March. We forecast where they'll likely be, with a
// range, and say honestly whether the date is realistic. When it isn't, we say when it likely is and
// what's realistic by their date instead.
//
// The forecast blends two things: typical gains for the lifter's experience (strength gains slow down
// as you get stronger, and deload weeks don't add any), and their own recent rate. Neither alone is
// trustworthy: a lucky month overstates the trend, and the averages ignore the person.

const DAY = 86400_000;
const MONTH = 30.44 * DAY;

export interface LiftGoal {
  id: string;
  exerciseId: string;
  /** One-rep max to reach, kg. */
  kg: number;
  /** Date to reach it by (ms). */
  by: number;
  createdAt: number;
  /** Set when the lifter logs it done. */
  doneAt?: number;
}

/** Typical monthly gain in one-rep max (as a share) for a lifter training consistently. */
export const TYPICAL_MONTHLY: Record<Experience, number> = { new: 0.04, intermediate: 0.015, advanced: 0.006 };
/** Gains slow each month (newer lifters slow faster). */
const SLOWDOWN: Record<Experience, number> = { new: 0.93, intermediate: 0.97, advanced: 0.99 };

export interface Forecast {
  /** Current estimated one-rep max, kg (best of the last four weeks, or the latest). */
  now: number;
  /** Forecast one-rep max at the goal date: likely, and the range around it. */
  low: number;
  mid: number;
  high: number;
  /** Monthly gain used for the likely line (share). */
  rate: number;
  /** The lifter's own recent monthly gain (share), when there's enough data. */
  observed: number | null;
  status: "done" | "likely" | "onTrack" | "stretch" | "unlikely" | "noData";
  /** When the likely line reaches the goal (ms), or null past five years. */
  likelyAt: number | null;
  /** What's realistic by the goal date (kg, the likely line). */
  realistic: number;
  /** Plain-words summary. */
  text: string;
}

/** Best estimated one-rep max per session for a lift, oldest first. */
export function e1rmHistory(events: readonly AppEvent[], exerciseId: string): { at: number; e1: number }[] {
  return sessionsOf(events, exerciseId)
    .map((sets) => ({ at: sets[0].at, e1: Math.max(...sets.map((s) => (s.weight > 0 ? epley(s.weight, Math.min(s.reps, 12)) : 0))) }))
    .filter((x) => x.e1 > 0)
    .reverse();
}

/** Monthly gain (share) from a least-squares fit of log one-rep max over the last 12 weeks. */
export function observedRate(hist: { at: number; e1: number }[], now: number): number | null {
  const pts = hist.filter((h) => h.at >= now - 84 * DAY);
  if (pts.length < 4 || pts.at(-1)!.at - pts[0].at < 28 * DAY) return null;
  const xs = pts.map((p) => (p.at - pts[0].at) / MONTH);
  const ys = pts.map((p) => Math.log(p.e1));
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den > 0 ? Math.exp(num / den) - 1 : null;
}

/** One-rep max after `months` at monthly rate `rate`, slowing each month, counting build weeks only. */
export function project(start: number, rate: number, months: number, exp: Experience, buildShare: number): number {
  let v = start;
  let r = rate;
  const m = Math.max(0, months) * buildShare;
  const whole = Math.floor(m);
  for (let i = 0; i < whole; i++) {
    v *= 1 + r;
    r *= SLOWDOWN[exp];
  }
  return v * (1 + r * (m - whole));
}

export function forecast(goal: Pick<LiftGoal, "exerciseId" | "kg" | "by">, events: readonly AppEvent[], profile: Profile, now: number): Forecast {
  const hist = e1rmHistory(events, goal.exerciseId);
  const name = EXERCISE_BY_ID.get(goal.exerciseId)?.name ?? "this lift";
  if (!hist.length) {
    return { now: 0, low: 0, mid: 0, high: 0, rate: 0, observed: null, status: "noData", likelyAt: null, realistic: 0, text: `Log a few sessions of ${name} and the forecast appears here.` };
  }
  const recent = hist.filter((h) => h.at >= now - 28 * DAY);
  const cur = Math.max(...(recent.length ? recent : hist.slice(-1)).map((h) => h.e1));
  const exp = profile.experience;
  const prior = TYPICAL_MONTHLY[exp];
  const observed = observedRate(hist, now);
  // Lean on the lifter's own trend, but never let one good month promise more than twice the typical rate.
  const rate = observed === null ? prior : 0.5 * prior + 0.5 * Math.min(Math.max(observed, 0), prior * 2);
  const build = Math.min(6, Math.max(3, profile.blockWeeks));
  const buildShare = build / (build + 1);
  const months = (goal.by - now) / MONTH;
  const low = project(cur, rate * 0.5, months, exp, buildShare);
  const mid = project(cur, rate, months, exp, buildShare);
  const high = project(cur, rate * 1.5, months, exp, buildShare);

  let likelyAt: number | null = null;
  if (cur >= goal.kg) likelyAt = now;
  else for (let w = 1; w <= 260; w++) if (project(cur, rate, (w * 7 * DAY) / MONTH, exp, buildShare) >= goal.kg) { likelyAt = now + w * 7 * DAY; break; }

  const status: Forecast["status"] = cur >= goal.kg ? "done" : low >= goal.kg ? "likely" : mid >= goal.kg ? "onTrack" : high >= goal.kg ? "stretch" : "unlikely";
  const kg = (v: number) => `${fmtNum(Math.round(fromKg(v, profile.unit) * 2) / 2)} ${profile.unit}`;
  const when = (ms: number) => new Date(ms).toLocaleDateString("en", { month: "long", year: "numeric" });
  const text = {
    done: `Your estimated max is already ${kg(cur)}. Time to test it on a fresh day.`,
    likely: `Very likely. Even at the slow end of the forecast you get there by ${when(goal.by)}.`,
    onTrack: `On track. At your likely pace you'll be around ${kg(mid)} by ${when(goal.by)}.`,
    stretch: `A stretch. It's possible if things go well, but the likely number by then is ${kg(mid)}${likelyAt ? `, with ${kg(goal.kg)} around ${when(likelyAt)}` : ""}.`,
    unlikely: `Not realistic by ${when(goal.by)}. The likely number by then is ${kg(mid)}${likelyAt ? `, and ${kg(goal.kg)} is more likely around ${when(likelyAt)}` : ""}.`,
    noData: "",
  }[status];
  return { now: cur, low, mid, high, rate, observed, status, likelyAt, realistic: mid, text };
}

export interface TestDay {
  /** Days until the goal date. */
  days: number;
  /** Suggested attempts, kg, loadable at the gym. */
  attempts: [number, number, number];
  advice: string;
}

/**
 * In the last two weeks before the date: a taper and three attempts, like a meet. The opener is one
 * you'd make on a bad day; the third is the goal only when the forecast supports it.
 */
export function testDay(goal: LiftGoal, f: Forecast, gym: Gym, now: number): TestDay | null {
  const days = Math.ceil((goal.by - now) / DAY);
  if (days < 0 || days > 14 || f.status === "noData") return null;
  const ex = EXERCISE_BY_ID.get(goal.exerciseId);
  if (!ex) return null;
  const expected = Math.max(f.now, f.mid);
  const r = (kg: number) => roundLoad(kg, ex, gym).kg;
  const third = r(Math.min(Math.max(goal.kg, expected * 0.98), expected * 1.02));
  const attempts: [number, number, number] = [r(expected * 0.9), r(expected * 0.96), third];
  const advice =
    days > 7
      ? "Keep training as planned this week, then go lighter: the last week before the test is about half the sets at your usual weights."
      : "Taper week: about half the sets, same weights, nothing to failure. Rest the two days before the test.";
  return { days, attempts, advice };
}
