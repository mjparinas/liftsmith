import { describe, expect, it } from "vitest";

import { setWeekStart } from "./derive";
import { freeAdaptiveLeft, wasAdaptive } from "./freeAdaptive";
import type { AppEvent } from "./types";

// One free adaptive workout a week without Pro (Melvin, 2026-11-12; docs/decisions/money.md).

// A Wednesday at noon.
const NOW = new Date("2026-11-11T12:00:00").getTime();
const DAY = 86_400_000;
const start = (at: number, extra: Partial<Extract<AppEvent, { type: "sessionStart" }>> = {}): AppEvent => ({
  type: "sessionStart",
  id: `s${at}`,
  at,
  sessionId: `s${at}`,
  gymId: "g",
  minutes: 45,
  ...extra,
});

describe("one free adaptive workout a week", () => {
  it("counts only adaptive workouts: not a program day, a routine or one logged by hand", () => {
    expect(wasAdaptive(start(NOW))).toBe(true);
    expect(wasAdaptive(start(NOW, { program: { id: "classic-5x5", day: 0 } }))).toBe(false);
    expect(wasAdaptive(start(NOW, { routine: "r1" }))).toBe(false);
    expect(wasAdaptive(start(NOW, { source: "manual" }))).toBe(false);
  });

  it("is there until an adaptive workout this week, and comes back next week", () => {
    setWeekStart(1);
    expect(freeAdaptiveLeft([], NOW)).toBe(true);
    expect(freeAdaptiveLeft([start(NOW - DAY, { program: { id: "classic-5x5", day: 0 } })], NOW)).toBe(true);
    const used = [start(NOW - DAY)];
    expect(freeAdaptiveLeft(used, NOW)).toBe(false);
    // Monday of the same week still counts; the Sunday before doesn't.
    expect(freeAdaptiveLeft([start(new Date("2026-11-09T07:00:00").getTime())], NOW)).toBe(false);
    expect(freeAdaptiveLeft([start(new Date("2026-11-08T20:00:00").getTime())], NOW)).toBe(true);
    expect(freeAdaptiveLeft(used, NOW + 6 * DAY)).toBe(true);
  });

  it("follows a week that starts on Sunday", () => {
    setWeekStart(0);
    expect(freeAdaptiveLeft([start(new Date("2026-11-08T20:00:00").getTime())], NOW)).toBe(false);
    setWeekStart(1);
  });
});
