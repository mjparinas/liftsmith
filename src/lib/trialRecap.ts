import { wasAdaptive } from "./freeAdaptive";
import { gradedSet } from "./progression";
import type { AppEvent, Profile, SessionStartEvent, SetEvent } from "./types";

// What Pro did during the lifter's trial (Melvin, 2026-11-12, "the first two weeks, trial to paid";
// docs/decisions/money.md). The trial is where Pro has to prove itself, so instead of telling the lifter
// what Pro could do, we show what it did for them: the adaptive workouts it planned, the weights it raised
// and the days it changed the plan for their recovery. Counted from the event log like every other number
// (nothing stored), so it's the same on every device and after a restore.
//
// The moments (shown in the app, text in trl.*): a line on the end-of-workout screen after each adaptive
// workout in the trial, a coach's note at the halfway point, one in the last two days, one for two weeks
// after a trial that lapsed, and the same numbers at the top of the paywall.

const DAY = 86_400_000;
/** The "ending" note shows in the trial's last two days. */
export const ENDING_MS = 2 * DAY;
/** After a trial lapses, its note and the paywall recap stay this long. */
export const AFTER_MS = 14 * DAY;

export interface TrialWindow {
  start: number;
  end: number;
}

/**
 * The trial's start and end. The start is what the app recorded when the trial began (profile.pro, written by
 * the paywall, setup's last step and the web's return from Stripe); the store's own expiry wins for the end
 * while the store still calls it a trial. Null when the lifter never started one.
 */
export function trialWindow(pro: Profile["pro"], store?: { trial: boolean; expiresAt: number | null } | null): TrialWindow | null {
  if (!pro?.trialStartedAt) return null;
  const start = pro.trialStartedAt;
  const end = store?.trial && store.expiresAt ? store.expiresAt : pro.trialDays ? start + pro.trialDays * DAY : null;
  return end && end > start ? { start, end } : null;
}

export type TrialStage = "running" | "halfway" | "ending" | "ended";

/**
 * Where the lifter is in the trial. `pro` is whether they have Pro now and `trial` whether that Pro is still the
 * trial: Pro that isn't a trial means they paid (or have Pro another way), and nothing more is shown. Null outside
 * the trial and its two weeks after.
 */
export function trialStage(win: TrialWindow | null, now: number, access: { pro: boolean; trial: boolean }): TrialStage | null {
  if (!win || now < win.start) return null;
  if (access.pro && !access.trial) return null;
  if (now < win.end && access.pro) {
    if (win.end - now <= ENDING_MS) return "ending";
    return now >= win.start + (win.end - win.start) / 2 ? "halfway" : "running";
  }
  // The trial is over (or Pro stopped early, a refund): two weeks of "here's what you had".
  return now < win.end + AFTER_MS ? "ended" : null;
}

export interface LiftJump {
  exerciseId: string;
  /** Kilograms planned the time before the trial's first raise, and the last planned in the trial. */
  from: number;
  to: number;
}

export interface ProImpact {
  /** Adaptive workouts started. */
  workouts: number;
  /** Times a lift's planned weight went up from the time before. */
  raised: number;
  /** Lifts whose weight went up (exercise ids, most raised first). */
  lifts: string[];
  /** Adaptive workouts made easier (a "go easy" call) or harder (a "push" call) for the lifter's recovery. */
  eased: number;
  pushed: number;
  /** The biggest jump in planned weight, as a share of where it started. */
  top?: LiftJump;
}

/** The heaviest planned weight of a session's working sets on one lift (kg), or 0 for bodyweight work. */
function topPlanned(sets: readonly SetEvent[]): number {
  let top = 0;
  for (const s of sets) if (gradedSet(s) && !s.injuryPct && !s.comeback) top = Math.max(top, s.targetWeight ?? s.weight);
  return top;
}

/** What Pro did over the adaptive workouts that started inside `win` (or only the one session, `only`). */
export function proImpact(events: readonly AppEvent[], win: TrialWindow, only?: string): ProImpact {
  const starts = events.filter(
    (e): e is SessionStartEvent =>
      wasAdaptive(e) && e.type === "sessionStart" && e.at >= win.start && e.at < win.end && (!only || e.sessionId === only),
  );
  const ours = new Set(starts.map((s) => s.sessionId));
  // Each lift's sessions in order: [sessionId, top planned weight].
  const byLift = new Map<string, Map<string, { at: number; sets: SetEvent[] }>>();
  for (const e of events) {
    if (e.type !== "set") continue;
    const lift = byLift.get(e.exerciseId) ?? new Map<string, { at: number; sets: SetEvent[] }>();
    const sess = lift.get(e.sessionId) ?? { at: e.at, sets: [] };
    sess.at = Math.min(sess.at, e.at);
    sess.sets.push(e);
    lift.set(e.sessionId, sess);
    byLift.set(e.exerciseId, lift);
  }
  let raised = 0;
  const counts = new Map<string, number>();
  let top: (LiftJump & { gain: number }) | undefined;
  for (const [exerciseId, sessions] of byLift) {
    const list = [...sessions.entries()]
      .map(([id, s]) => ({ id, at: s.at, top: topPlanned(s.sets) }))
      .filter((s) => s.top > 0)
      .sort((a, b) => a.at - b.at);
    let from: number | undefined;
    let last: number | undefined;
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1]!;
      const cur = list[i]!;
      if (!ours.has(cur.id)) continue;
      last = cur.top;
      if (cur.top > prev.top + 0.01) {
        raised++;
        counts.set(exerciseId, (counts.get(exerciseId) ?? 0) + 1);
        from ??= prev.top;
      }
    }
    if (from != null && last != null && last > from) {
      const gain = (last - from) / from;
      if (!top || gain > top.gain) top = { exerciseId, from, to: last, gain };
    }
  }
  const called = starts.filter((s) => !s.callOverridden);
  return {
    workouts: starts.length,
    raised,
    lifts: [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id),
    eased: called.filter((s) => s.call === "recover").length,
    pushed: called.filter((s) => s.call === "push").length,
    top: top && { exerciseId: top.exerciseId, from: top.from, to: top.to },
  };
}

/** Days adjusted for recovery, either way. */
export const adjusted = (i: Pick<ProImpact, "eased" | "pushed">) => i.eased + i.pushed;

/** Whole days left in the trial (at least 1 while it runs). */
export function daysLeft(win: TrialWindow, now: number): number {
  return Math.max(1, Math.ceil((win.end - now) / DAY));
}
