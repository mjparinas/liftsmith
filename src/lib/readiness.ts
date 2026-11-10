import { blockWeek } from "./block";
import { cycleSignal, cycleState } from "./cycle";
import { t } from "./i18n";
import { dayKey, hash, rng } from "./random";
import { recovery } from "./recovery";
import type { AppEvent, Muscle, Profile, SessionEndEvent, SetEvent } from "./types";

// "Rest or push today?" (Melvin, 2026-11-09). Everything here comes from the lifter's own
// logged data, on the device: how recovered the big muscles are, how many target reps they hit
// lately, how sets felt, how long reps took compared with their own history, and whether heart
// rate ran high for the same work. Health data (sleep, HRV, resting HR, breathing rate) comes in as
// `external` from the health twin (twin.ts healthExternal), for Pro. The lifter can always override the call.

export type Call = "push" | "normal" | "recover";

export interface Signal {
  /** Points added to the 50-point baseline (negative means take it easier). */
  points: number;
  text: string;
}

export interface Readiness {
  call: Call;
  /** 0 to 100. */
  score: number;
  signals: Signal[];
  /** Offer a challenge today (only on push days outside a deload). */
  challenge: boolean;
}

export interface ExternalSignals {
  /** Last night's sleep in hours. */
  sleepHours?: number;
  /** HRV against its 30-day baseline, as a fraction (−0.1 is 10% below). */
  hrvDelta?: number;
  /** Resting heart rate against its 30-day baseline, in bpm. */
  restingHrDelta?: number;
  /** Overnight breathing rate against its 30-day baseline, in breaths a minute. */
  breathingDelta?: number;
  /** Pre-workout check-in, −1 (low) to 1 (great). */
  checkIn?: -1 | 0 | 1;
  /** Use logged periods (only when the lifter opted in to cycle-aware readiness). */
  cycle?: boolean;
}

const DAY = 86_400_000;
const BIG: Muscle[] = ["chest", "lats", "upperBack", "quads", "hamstrings", "glutes"];
export const PUSH_AT = 65;
export const RECOVER_AT = 35;
const CHALLENGE_ODDS = 0.3;
const CHALLENGE_GAP = 7 * DAY;

const median = (xs: number[]) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

/** Sessions with at least one set, newest first, each with its sets. */
function recentSessions(events: readonly AppEvent[]): { id: string; at: number; sets: SetEvent[] }[] {
  const by = new Map<string, SetEvent[]>();
  for (const e of events) if (e.type === "set") by.set(e.sessionId, [...(by.get(e.sessionId) ?? []), e]);
  return [...by.entries()].map(([id, sets]) => ({ id, at: sets[sets.length - 1]!.at, sets })).sort((a, b) => b.at - a.at);
}

/** Seconds per rep for one exercise in each past session, newest first. */
function paceHistory(events: readonly AppEvent[], exerciseId: string): number[] {
  const out: number[] = [];
  for (const s of recentSessions(events)) {
    const paces = s.sets.filter((x) => x.exerciseId === exerciseId && x.durationSec && x.reps > 0).map((x) => x.durationSec! / x.reps);
    if (paces.length) out.push(median(paces));
  }
  return out;
}

export function readiness(events: readonly AppEvent[], profile: Profile, now: number, external: ExternalSignals = {}): Readiness {
  const signals: Signal[] = [];
  const add = (points: number, text: string) => {
    if (points) signals.push({ points, text });
  };
  const sessions = recentSessions(events);
  const week = blockWeek(profile, now);

  if (!sessions.length) {
    const c = external.cycle ? cycleSignal(cycleState(events, now)) : null;
    return { call: "normal", score: 50, signals: [{ points: 0, text: t("sig.firstWorkout") }, ...(c ? [c] : [])], challenge: false };
  }

  // 1. Recovery of the big muscles.
  const rec = recovery(events, now);
  const big = BIG.reduce((s, m) => s + rec[m], 0) / BIG.length;
  if (big >= 90) add(10, t("sig.bigRecovered"));
  else if (big < 60) add(-15, t("sig.bigRecovering"));

  // 2. Days since the last workout, and how many in a row.
  const gap = (now - sessions[0]!.at) / DAY;
  const streak = sessions.filter((s) => now - s.at < 3 * DAY).length;
  if (gap >= 2 && gap < 10) add(8, t("sig.rested"));
  if (gap >= 10) add(-5, t("sig.longGap"));
  if (streak >= 3) add(-10, t("sig.threeInRow"));

  // 3. Target reps hit in the last two workouts.
  const lastTwo = sessions
    .slice(0, 2)
    .flatMap((s) => s.sets)
    .filter((s) => !s.challenge);
  if (lastTwo.length >= 4) {
    const hit = lastTwo.filter((s) => s.reps >= s.targetReps).length / lastTwo.length;
    if (hit >= 0.95) add(12, t("sig.hitAll"));
    else if (hit < 0.7) add(-12, t("sig.missed"));
  }

  // 4. How the last workout felt.
  const lastId = sessions[0]!.id;
  const ratings = events.filter((e) => e.type === "feedback" && e.sessionId === lastId).map((e) => (e.type === "feedback" ? e.rating : 0));
  const hard = ratings.filter((r) => r < 0).length;
  const easy = ratings.filter((r) => r > 0).length;
  if (hard >= 2) add(-10, t("sig.feltHard"));
  else if (easy >= 2 && hard === 0) add(8, t("sig.feltEasy"));

  // 5. Rep speed: slower reps than usual at the same exercises means fatigue.
  const slowdowns: number[] = [];
  for (const ex of new Set(sessions[0]!.sets.map((s) => s.exerciseId))) {
    const h = paceHistory(events, ex);
    if (h.length >= 3) slowdowns.push(h[0]! / median(h.slice(1, 6)));
  }
  if (slowdowns.length) {
    const slow = median(slowdowns);
    if (slow > 1.15) add(-8, t("sig.slowReps"));
    else if (slow < 0.92) add(5, t("sig.quickReps"));
  }

  // 6. Heart rate for the work: a higher average than usual hints at fatigue or illness.
  const ends = events.filter((e): e is SessionEndEvent => e.type === "sessionEnd" && !!e.avgHr).sort((a, b) => b.at - a.at);
  if (ends.length >= 4) {
    const usual = median(ends.slice(1, 8).map((e) => e.avgHr!));
    const d = ends[0]!.avgHr! - usual;
    if (d > 8) add(-8, t("sig.hrHigh"));
    else if (d < -6) add(4, t("sig.hrLow"));
  }

  // 7. Health data (the health twin, twin.ts) and the check-in, when connected.
  for (const x of healthSignals(external)) add(x.points, x.text);
  if (external.checkIn === -1) add(-15, t("sig.low"));
  if (external.checkIn === 1) add(8, t("sig.great"));
  if (external.cycle) {
    const c = cycleSignal(cycleState(events, now));
    if (c) signals.push(c);
  }

  const score = Math.max(0, Math.min(100, Math.round(50 + signals.reduce((s, x) => s + x.points, 0))));
  let call: Call = score >= PUSH_AT ? "push" : score <= RECOVER_AT ? "recover" : "normal";
  if (week.deload && call === "push") call = "normal";

  // Challenges: now and then on a push day, never two in a week, never in a deload.
  const lastChallenge = events.reduce((t, e) => (e.type === "sessionStart" && e.challenge ? Math.max(t, e.at) : t), 0);
  const roll = rng(hash(dayKey(now) + "challenge"))();
  const challenge = call === "push" && !week.deload && now - lastChallenge > CHALLENGE_GAP && roll < CHALLENGE_ODDS;

  return { call, score, signals: signals.sort((a, b) => Math.abs(b.points) - Math.abs(a.points)), challenge };
}

/**
 * What sleep, HRV, resting heart rate and breathing rate add to the score. Shared with the health twin
 * (twin.ts), so the twin says exactly what the call counted.
 */
export function healthSignals(external: ExternalSignals): Signal[] {
  const out: Signal[] = [];
  const add = (points: number, text: string) => out.push({ points, text });
  if (external.sleepHours !== undefined) {
    if (external.sleepHours < 6) add(-12, t("sig.shortSleep"));
    else if (external.sleepHours >= 8) add(5, t("sig.goodSleep"));
  }
  if (external.hrvDelta !== undefined) {
    if (external.hrvDelta < -0.1) add(-10, t("sig.hrvLow"));
    else if (external.hrvDelta > 0.05) add(5, t("sig.hrvHigh"));
  }
  if (external.restingHrDelta !== undefined && external.restingHrDelta > 5) add(-8, t("sig.restingUp"));
  if (external.breathingDelta !== undefined && external.breathingDelta >= 2) add(-8, t("sig.breathingUp"));
  return out;
}

/** The call's label and one-line blurb, translated on each read. */
const callText = (c: Call) => ({
  get label() {
    return t(`callText.${c}`);
  },
  get blurb() {
    return t(`callText.${c}.blurb`);
  },
});
export const CALL_TEXT: Record<Call, { label: string; blurb: string }> = {
  push: callText("push"),
  normal: callText("normal"),
  recover: callText("recover"),
};
