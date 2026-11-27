import { track } from "./analytics";
import { exercise } from "./exercises";
import { t } from "./i18n";
import { haptic } from "./juice";
import { TIMED } from "./progression";
import type { TimerOffer } from "./sessionNotify";
import { timerAt, timerHeld, type TimerSpec } from "./setTimer";
import { perSide } from "./sides";
import { warmingUp, type Active } from "./store/workout";
import type { AppEvent } from "./types";

// The running set timer (setTimer.ts), kept outside any screen so going to Today and back mid-hold doesn't lose the
// clock, and so a watch can start it and Log set from a watch or the lock screen saves the seconds actually held
// (docs/decisions/set-timer.md "Started from the watch"). It belongs to one set (`key`): once that set is logged the key
// moves on and the timer is gone. The workout screen draws it (workout/SetTimer.tsx).

export interface TimerRun {
  key: string;
  startAt: number;
  spec: TimerSpec;
}

/** Seconds held so far, for Log set: null when no timer is running (or it's still in the lead-in). */
export type Held = { reps: number; repsR?: number } | null;

let saved: TimerRun | null = null;
const listeners = new Set<() => void>();
export const putTimer = (r: TimerRun | null) => {
  saved = r;
  listeners.forEach((l) => l());
};
export const subscribeTimer = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
export const timerSnapshot = () => saved;

/** Starts the timer for this set, now or at `at` (a watch's tap, replayed when the app wakes). */
export function startTimer(key: string, spec: TimerSpec, at = Date.now(), from: "phone" | "watch" = "phone") {
  putTimer({ key, startAt: at, spec });
  if (from === "phone") haptic("tick");
  track("feature", {
    name: "set_timer",
    detail: `${spec.up ? "up" : spec.sides === 2 ? "sides" : "down"}${from === "watch" ? "_watch" : ""}`,
  });
}

export function cancelTimer() {
  putTimer(null);
}

/** What Log set saves for this set at `at` (null when no timer runs for it), and stops the timer. */
export function takeTimer(key: string, at = Date.now()): Held {
  if (saved?.key !== key) return null;
  const r = saved;
  putTimer(null);
  return timerHeld(r.spec, timerAt(r.spec, Math.max(0, at - r.startAt)));
}

/**
 * The set timer the set on screen offers, with the key its run belongs to: a timed hold, carry or cardio set while
 * lifting (not resting, not a warm-up). The workout screen and a watch's Start timer both read it, so they agree.
 */
export function timerOffer(a: Active | null, events: readonly AppEvent[], now: number): { key: string; spec: TimerSpec } | null {
  const item = a?.plan.items[a.index];
  if (!a || !item) return null;
  const ex = exercise(item.exerciseId);
  if (!TIMED.has(ex.id) || warmingUp(a) || (!!a.restUntil && a.restUntil > now)) return null;
  const doneSets = events.filter(
    (e) => e.type === "set" && e.sessionId === a.sessionId && e.exerciseId === item.exerciseId && !e.tag,
  ).length;
  return {
    key: `${a.sessionId}:${a.index}:${doneSets}:${a.tag ?? ""}`,
    spec: { target: a.reps, sides: perSide(ex.id) && !ex.cardio ? 2 : 1, up: !!ex.cardio },
  };
}

/** "Start timer · 0:40" (or "· 0:20 a side", or "Start the clock" for cardio), as the workout screen's button says it. */
export function startLabel(spec: TimerSpec, clock: (s: number) => string): string {
  const time = clock(Math.max(1, Math.round(spec.target)));
  return spec.up ? t("timer.startUp") : spec.sides === 2 ? t("timer.startSides", { time }) : t("timer.start", { time });
}

/** What the watches need to start this set's timer themselves (sessionNotify.ts TimerOffer). */
export function watchTimerOffer(offer: { key: string; spec: TimerSpec }, clock: (s: number) => string): TimerOffer {
  const { key, spec } = offer;
  const target = Math.max(1, Math.round(spec.target));
  const work = spec.sides === 2 ? t("timer.side1") : spec.up ? t("timer.target", { time: clock(target) }) : t("timer.left");
  return {
    key,
    s: target,
    d: spec.sides,
    ...(spec.up ? { u: 1 as const } : {}),
    l: startLabel(spec, clock),
    lb: [t("timer.getSet"), work, t("timer.switch"), t("timer.side2")],
    o: t("timer.over"),
  };
}

/**
 * Start timer from a watch: starts this set's timer at the moment of the tap, when the tap is for the set on screen
 * (its key) and no timer runs for it yet. Returns whether it started.
 */
export function startFromWatch(a: Active | null, events: readonly AppEvent[], key: string | undefined, at = Date.now()): boolean {
  const offer = timerOffer(a, events, at);
  if (!offer || !key || offer.key !== key || saved?.key === key) return false;
  startTimer(key, offer.spec, at, "watch");
  return true;
}

/** Log set from a watch or the lock screen while the timer runs: the seconds held at the tap, and the timer stopped. */
export function takeForLog(a: Active | null, events: readonly AppEvent[], at = Date.now()): Held {
  const offer = timerOffer(a, events, at);
  return offer ? takeTimer(offer.key, at) : null;
}

/** Tests only. */
export function resetTimerRun() {
  saved = null;
}

/** The part of the store Log set needs here. */
interface LogStore {
  active: Active | null;
  events: AppEvent[];
  adjust(weight: number, reps: number): void;
  adjustRight(reps: number | undefined): void;
}

/**
 * Before a Log set from a watch or the lock screen: when this set's timer runs, the set takes the seconds held at the
 * tap (as the workout screen's own Log set does), so a plank stopped early on the wrist is logged as held.
 */
export function holdForLog(s: LogStore, at = Date.now()) {
  const held = takeForLog(s.active, s.events, at);
  if (!held || !s.active) return;
  s.adjust(s.active.weight, held.reps);
  if (held.repsR !== undefined) s.adjustRight(held.repsR);
}
