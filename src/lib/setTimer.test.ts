import { describe, expect, it } from "vitest";

import { timerSegmentAt } from "./sessionNotify";
import { cueKey, LEAD_SEC, SWITCH_SEC, timerAt, timerHeld, timerLength, timerPhases, type TimerSpec } from "./setTimer";

// The set timer for holds, carries, hangs and cardio: a lead-in, then a countdown (each side in turn) or a count-up.

const plank: TimerSpec = { target: 30, sides: 1, up: false };
const suitcase: TimerSpec = { target: 20, sides: 2, up: false };
const row: TimerSpec = { target: 600, sides: 1, up: true };
const s = (n: number) => n * 1000;

describe("timerAt", () => {
  it("gives a lead-in to get into position", () => {
    expect(timerAt(plank, 0)).toEqual({ phase: "lead", left: LEAD_SEC });
    expect(timerAt(plank, s(4.2))).toEqual({ phase: "lead", left: 1 });
  });

  it("then counts the hold down and ends", () => {
    expect(timerAt(plank, s(LEAD_SEC))).toEqual({ phase: "work", side: 1, held: 0, left: 30, over: false });
    expect(timerAt(plank, s(LEAD_SEC + 20.5))).toEqual({ phase: "work", side: 1, held: 20, left: 10, over: false });
    expect(timerAt(plank, s(LEAD_SEC + 30))).toEqual({ phase: "done", at: s(LEAD_SEC + 30) });
    expect(timerLength(plank)).toBe(s(LEAD_SEC + 30));
  });

  it("counts each side of a one-sided hold, with time to switch between", () => {
    expect(timerAt(suitcase, s(LEAD_SEC + 19.9)).phase).toBe("work");
    expect(timerAt(suitcase, s(LEAD_SEC + 20))).toEqual({ phase: "switch", left: SWITCH_SEC });
    expect(timerAt(suitcase, s(LEAD_SEC + 20 + SWITCH_SEC + 3))).toEqual({ phase: "work", side: 2, held: 3, left: 17, over: false });
    const end = s(LEAD_SEC + 40 + SWITCH_SEC);
    expect(timerAt(suitcase, end)).toEqual({ phase: "done", at: end });
    expect(timerLength(suitcase)).toBe(end);
  });

  it("counts cardio up past its target and never ends by itself", () => {
    expect(timerAt(row, s(LEAD_SEC + 599))).toMatchObject({ phase: "work", held: 599, left: 1, over: false });
    expect(timerAt(row, s(LEAD_SEC + 700))).toMatchObject({ phase: "work", held: 700, left: -100, over: true });
    expect(timerLength(row)).toBeNull();
  });
});

describe("timerHeld", () => {
  it("logs the plan during the lead-in, and the seconds held after it", () => {
    expect(timerHeld(plank, timerAt(plank, s(2)))).toBeNull();
    expect(timerHeld(plank, timerAt(plank, s(LEAD_SEC + 22.7)))).toEqual({ reps: 22 });
    // Never zero: a set logged right at the start still saves a second.
    expect(timerHeld(plank, timerAt(plank, s(LEAD_SEC)))).toEqual({ reps: 1 });
    expect(timerHeld(plank, timerAt(plank, s(99)))).toEqual({ reps: 30 });
    expect(timerHeld(row, timerAt(row, s(LEAD_SEC + 754)))).toEqual({ reps: 754 });
  });

  it("keeps the first side's full time when the second side stops early", () => {
    expect(timerHeld(suitcase, timerAt(suitcase, s(LEAD_SEC + 22)))).toEqual({ reps: 20 });
    expect(timerHeld(suitcase, timerAt(suitcase, s(LEAD_SEC + 20 + SWITCH_SEC + 12.4)))).toEqual({ reps: 20, repsR: 12 });
  });
});

describe("cueKey", () => {
  it("changes once a second, so each beep plays once", () => {
    expect(cueKey(timerAt(plank, s(LEAD_SEC + 1.1)))).toBe(cueKey(timerAt(plank, s(LEAD_SEC + 1.9))));
    expect(cueKey(timerAt(plank, s(LEAD_SEC + 1.1)))).not.toBe(cueKey(timerAt(plank, s(LEAD_SEC + 2.1))));
  });
});

describe("timerPhases", () => {
  it("lays the timer out in wall-clock time for the lock screen and the watches", () => {
    const t0 = 1_800_000_000_000;
    expect(timerPhases(plank, t0)).toEqual([
      { phase: "lead", from: t0, to: t0 + s(LEAD_SEC) },
      { phase: "work", side: 1, from: t0 + s(LEAD_SEC), to: t0 + s(LEAD_SEC + 30) },
    ]);
    const sides = timerPhases(suitcase, t0);
    expect(sides.map((x) => x.phase)).toEqual(["lead", "work", "switch", "work"]);
    expect(sides.at(-1)).toEqual({ phase: "work", side: 2, from: t0 + s(LEAD_SEC + 20 + SWITCH_SEC), to: t0 + timerLength(suitcase)! });
    expect(timerPhases(row, t0).at(-1)).toEqual({ phase: "work", side: 1, from: t0 + s(LEAD_SEC) });
  });

  it("agrees with the app's own clock at every second", () => {
    const t0 = 1_800_000_000_000;
    const segs = timerPhases(suitcase, t0).map((x) => ({ ...x, label: x.phase }));
    for (let ms = 0; ms < timerLength(suitcase)!; ms += 500) {
      const here = timerAt(suitcase, ms);
      expect(timerSegmentAt(segs, t0 + ms)?.label).toBe(here.phase);
    }
    expect(timerSegmentAt(segs, t0 + timerLength(suitcase)!)).toBeNull();
    expect(timerSegmentAt(segs, t0 - 1)).toBeNull();
    expect(timerSegmentAt(undefined, t0)).toBeNull();
  });
});
