"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { track } from "@/lib/analytics";
import { t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { cueKey, SWITCH_SEC, timerAt, timerHeld, type TimerSpec, type TimerState } from "@/lib/setTimer";
import { restCue, say } from "@/lib/voice";

import { clock } from "../format";
import { Icon } from "../icons";

// The set timer (setTimer.ts) on the workout screen, for holds, carries, hangs and cardio. Start sits above
// Log set; once running, a big clock takes its place there. A countdown that runs out logs the set by itself
// (the rest timer then starts, as after any set), so a plank needs one tap, not two. Log set while it runs
// saves the seconds actually held. Cancel stops it without logging, and Undo takes back a set it logged.
// Beeps on the last three seconds of the lead-in and of each side, a chime on go, the voice coach (when it's
// on) says "Ten seconds" and "Switch sides". Pure web code, so Android, iOS and the web app get it together.

export interface TimerRun {
  key: string;
  startAt: number;
  spec: TimerSpec;
}

/** Seconds held so far, for Log set: null when no timer is running (or it's still in the lead-in). */
export type Held = { reps: number; repsR?: number } | null;

// The running timer lives outside the screen, so going to Today and back mid-hold doesn't lose the clock.
// It belongs to one set (`key`): once that set is logged the key moves on and the timer is gone.
let saved: TimerRun | null = null;
const listeners = new Set<() => void>();
const put = (r: TimerRun | null) => {
  saved = r;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
const snapshot = () => saved;

/** The timer running for this set, if any. */
export function useTimerRun(key: string): TimerRun | null {
  const r = useSyncExternalStore(subscribe, snapshot, () => null);
  return r?.key === key ? r : null;
}

export function startTimer(key: string, spec: TimerSpec) {
  put({ key, startAt: Date.now(), spec });
  haptic("tick");
  track("feature", { name: "set_timer", detail: spec.up ? "up" : spec.sides === 2 ? "sides" : "down" });
}

export function cancelTimer() {
  put(null);
}

/** What Log set saves for this set now (null when no timer runs for it), and stops the timer. */
export function takeTimer(key: string, at = Date.now()): Held {
  if (saved?.key !== key) return null;
  const r = saved;
  put(null);
  return timerHeld(r.spec, timerAt(r.spec, Math.max(0, at - r.startAt)));
}

/** Each beep and cue once; logs the set when a countdown runs out. Rendered only while a timer runs. */
function useCues(run: TimerRun, state: TimerState, now: number, onDone: (at: number, held: Held) => void) {
  // A jump in the clock (the app was away) skips the sounds but still logs a countdown that ran out, at the
  // moment it did.
  const cue = useRef({ key: "", at: run.startAt });
  const k = cueKey(state);
  useEffect(() => {
    if (k === cue.current.key) return;
    const fresh = now - cue.current.at < 2000;
    cue.current = { key: k, at: now };
    if (state.phase === "done") {
      const held = timerHeld(run.spec, state);
      put(null);
      onDone(run.startAt + state.at, held);
      return;
    }
    if (state.phase === "switch") {
      // The voice coach, when it's on, says when to switch sides.
      if (state.left === SWITCH_SEC && fresh) say(t("timer.vc.switch"));
      else if (state.left <= 3 && fresh) beep();
      return;
    }
    if (!fresh) return;
    if (state.phase === "lead") {
      if (state.left <= 3) beep();
      return;
    }
    if (state.held === 0) {
      sound.restEnd();
      haptic("thud");
      return;
    }
    if (run.spec.up) {
      if (state.held === run.spec.target) {
        sound.done();
        haptic("double");
      }
      return;
    }
    if (state.left <= 3) beep();
    else if (state.left === 10 && run.spec.target >= 20) say(restCue.ten);
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
}

function beep() {
  sound.countdown();
  haptic("select");
}

/** The Start button above Log set. */
export function SetTimerStart({ spec, onStart }: { spec: TimerSpec; onStart: () => void }) {
  const time = clock(spec.target);
  return (
    <button
      type="button"
      onClick={onStart}
      className="press inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface/90 px-4 text-sm font-semibold text-muted backdrop-blur hover:text-ink"
      data-testid="set-timer-start"
    >
      <Icon name="play" size={16} className="text-accent" />
      {spec.up ? t("timer.startUp") : spec.sides === 2 ? t("timer.startSides", { time }) : t("timer.start", { time })}
    </button>
  );
}

/** The running clock, in Start's place. */
export function SetTimerClock({ run, now, onDone }: { run: TimerRun; now: number; onDone: (at: number, held: Held) => void }) {
  const spec = run.spec;
  const state = timerAt(spec, Math.max(0, now - run.startAt));
  useCues(run, state, now, onDone);
  if (state.phase === "done") return null;
  const target = Math.max(1, Math.round(spec.target));
  const label =
    state.phase === "lead"
      ? t("timer.getSet")
      : state.phase === "switch"
        ? t("timer.switch")
        : spec.sides === 2
          ? t(state.side === 1 ? "timer.side1" : "timer.side2")
          : spec.up
            ? t("timer.target", { time: clock(target) })
            : t("timer.left");
  const big = state.phase === "work" ? (spec.up ? clock(state.held) : clock(Math.max(0, state.left))) : String(state.left);
  // How far through this side (or past the target, for a count-up).
  const pct = state.phase === "work" ? Math.min(100, (state.held / target) * 100) : 0;
  const note = state.phase === "work" ? t("timer.logNote", { time: clock(state.held) }) : t("timer.logPlan");
  return (
    <div className="card w-full px-4 py-3 text-center" data-testid="set-timer">
      <p className="text-sm font-semibold text-accent" aria-live="polite">
        {label}
      </p>
      <div
        role="timer"
        aria-label={label}
        className={`display mt-1 text-[3.5rem] leading-none ${state.phase === "work" && state.over ? "text-good" : ""}`}
      >
        {big}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="min-w-0 text-left text-xs text-muted tabular-nums" data-testid="set-timer-note">
          {note}
        </p>
        <button
          type="button"
          onClick={() => {
            cancelTimer();
            haptic("tick");
          }}
          className="press -mr-2 inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm text-muted hover:text-ink"
          aria-label={t("timer.cancelLabel")}
        >
          {t("timer.cancel")}
        </button>
      </div>
    </div>
  );
}
