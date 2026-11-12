import { describe, expect, it } from "vitest";

import { DAY, makeProfile, makeSessionStart, makeWorkout, NOW } from "@/test/factories";

import { setLanguage } from "./i18n";
import { doneLines, impactLine, trialNote } from "./trialNotes";
import { adjusted, AFTER_MS, daysLeft, proImpact, trialStage, trialWindow } from "./trialRecap";
import type { AppEvent, SessionStartEvent } from "./types";

// What Pro did in the trial (docs/decisions/money.md "The first two weeks").

const START = NOW - 10 * DAY;
const win = { start: START, end: START + 14 * DAY };

/** A workout of bench and squat at the given planned weights. */
function workout(id: string, at: number, bench: number, squat: number, start: Partial<SessionStartEvent> = {}): AppEvent[] {
  const [s, ...rest] = makeWorkout(id, at, [
    { exerciseId: "bench-press", weight: bench, targetWeight: bench },
    { exerciseId: "bench-press", weight: bench, targetWeight: bench },
    { exerciseId: "back-squat", weight: squat, targetWeight: squat },
  ]);
  return [{ ...(s as SessionStartEvent), ...start }, ...rest];
}

describe("the trial window", () => {
  it("starts when the app recorded the trial, and the store's expiry wins for the end", () => {
    const pro = makeProfile({ pro: { offeredAt: START, plan: "annual", trialStartedAt: START, trialDays: 14 } }).pro;
    expect(trialWindow(pro)).toEqual(win);
    expect(trialWindow(pro, { trial: true, expiresAt: START + 15 * DAY })).toEqual({ start: START, end: START + 15 * DAY });
    // After the trial the store no longer calls it one: the recorded length decides.
    expect(trialWindow(pro, { trial: false, expiresAt: START + 45 * DAY })).toEqual(win);
    expect(trialWindow(undefined)).toBeNull();
    expect(trialWindow({ offeredAt: START, declinedAt: START, trialDays: 14 })).toBeNull();
  });

  it("goes running, halfway, ending, then ended for two weeks, and stops once paid", () => {
    const inTrial = { pro: true, trial: true };
    expect(trialStage(win, START + DAY, inTrial)).toBe("running");
    expect(trialStage(win, START + 7 * DAY, inTrial)).toBe("halfway");
    expect(trialStage(win, START + 12.5 * DAY, inTrial)).toBe("ending");
    expect(trialStage(win, START + 15 * DAY, { pro: false, trial: false })).toBe("ended");
    expect(trialStage(win, win.end + AFTER_MS + 1, { pro: false, trial: false })).toBeNull();
    // Paid (Pro that isn't the trial): nothing more.
    expect(trialStage(win, START + 15 * DAY, { pro: true, trial: false })).toBeNull();
    expect(trialStage(win, START + 7 * DAY, { pro: true, trial: false })).toBeNull();
    // Pro stopped early (a refund): ended.
    expect(trialStage(win, START + 5 * DAY, { pro: false, trial: false })).toBe("ended");
    expect(trialStage(null, NOW, inTrial)).toBeNull();
    expect(daysLeft(win, START + 12.5 * DAY)).toBe(2);
  });
});

describe("what Pro did", () => {
  const events: AppEvent[] = [
    // Before the trial: the base the first raise starts from.
    ...workout("a", START - 3 * DAY, 60, 80),
    ...workout("b", START + DAY, 62.5, 80),
    ...workout("c", START + 3 * DAY, 65, 85, { call: "recover" }),
    ...workout("d", START + 5 * DAY, 65, 90, { call: "push" }),
    // The lifter's own call doesn't count as Pro adjusting the day.
    ...workout("e", START + 7 * DAY, 65, 90, { call: "push", callOverridden: true }),
    // A program day isn't Pro's doing, even when its weights go up.
    ...workout("f", START + 9 * DAY, 70, 95, { program: { id: "classic-5x5", day: 0 } }),
    // After the trial.
    ...workout("g", START + 20 * DAY, 75, 100),
  ];

  it("counts adaptive workouts, raised weights and days adjusted for recovery inside the trial", () => {
    const i = proImpact(events, win);
    expect(i.workouts).toBe(4);
    // bench 60→62.5→65, squat 80→85→90
    expect(i.raised).toBe(4);
    expect(i.lifts.sort()).toEqual(["back-squat", "bench-press"]);
    expect(i.eased).toBe(1);
    expect(i.pushed).toBe(1);
    expect(adjusted(i)).toBe(2);
    // Bench went 60 → 65 (8%), squat 80 → 90 (12.5%): squat is the biggest jump.
    expect(i.top).toEqual({ exerciseId: "back-squat", from: 80, to: 90 });
  });

  it("can look at one workout", () => {
    const i = proImpact(events, win, "c");
    expect(i).toMatchObject({ workouts: 1, raised: 2, eased: 1, pushed: 0 });
    expect(proImpact(events, win, "e").raised).toBe(0);
  });

  it("is empty with no adaptive workouts", () => {
    expect(proImpact([makeSessionStart({ at: START + DAY, routine: "r1" })], win)).toMatchObject({ workouts: 0, raised: 0, eased: 0 });
  });
});

describe("the trial's notes", () => {
  setLanguage("en");
  const impact = {
    workouts: 6,
    raised: 8,
    lifts: ["back-squat"],
    eased: 1,
    pushed: 1,
    top: { exerciseId: "back-squat", from: 80, to: 90 },
  };
  const base = { win, impact, renews: true, unit: "kg" as const, now: START + 12.5 * DAY };

  it("says what Pro did, with the numbers", () => {
    expect(impactLine(impact, false)).toBe(
      "So far Pro has planned 6 adaptive workouts for you, raised 8 weights and adjusted 2 days to how recovered you were.",
    );
    expect(impactLine({ ...impact, workouts: 1, raised: 1, eased: 0, pushed: 0 }, true)).toBe(
      "In your trial Pro planned 1 adaptive workout for you and raised 1 weight.",
    );
  });

  it("shows nothing while the trial is young, then a note per stage with its own id", () => {
    expect(trialNote({ ...base, stage: "running" })).toBeNull();
    const half = trialNote({ ...base, stage: "halfway", now: START + 7 * DAY })!;
    expect(half.title).toBe("Halfway through your Pro trial");
    expect(half.action).toMatchObject({ kind: "go", route: "pro/trial" });
    expect(half.why).toContain("Biggest jump: Back squat, from 80 kg to 90 kg.");
  });

  it("asks nothing of a trial that will renew, and offers to keep a cancelled one", () => {
    const renews = trialNote({ ...base, stage: "ending" })!;
    expect(renews.title).toBe("Your Pro trial ends in 2 days");
    expect(renews.action).toBeUndefined();
    const stops = trialNote({ ...base, stage: "ending", renews: false })!;
    expect(stops.action).toMatchObject({ route: "pro/trialEnd", label: "Keep Pro" });
    // Cancelling brings the note back (a new id), even after "Got it" on the renewing one.
    expect(stops.id).not.toBe(renews.id);
    const ended = trialNote({ ...base, stage: "ended", now: win.end + DAY })!;
    expect(ended.action).toMatchObject({ route: "pro/trialEnded", pro: true });
    expect(ended.why).toMatch(/^In your trial Pro planned 6/);
  });

  it("asks for a first adaptive workout when there wasn't one", () => {
    const n = trialNote({ ...base, stage: "halfway", impact: { workouts: 0, raised: 0, lifts: [], eased: 0, pushed: 0 } })!;
    expect(n.why).toMatch(/haven't done an adaptive workout yet/);
  });

  it("names the lifts raised in a workout", () => {
    expect(doneLines({ ...impact, lifts: ["back-squat", "bench-press"], eased: 0, pushed: 1 })).toEqual([
      "Pro raised back squat and barbell bench press today.",
      "It pushed today because you were well recovered.",
    ]);
    expect(doneLines({ workouts: 1, raised: 0, lifts: [], eased: 0, pushed: 0 })).toEqual([]);
  });
});
