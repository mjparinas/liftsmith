import { describe, expect, it } from "vitest";

import { setWeekStart } from "./derive";
import { BONUS_WEEK_MAX, bonusDayCheck, bonusDayEvent, bonusToday, freeAdaptiveLeft, wasAdaptive } from "./freeAdaptive";
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

// The streak flame easter egg (Melvin, 2026-11-16): seven taps give a free lifter an extra adaptive day, one a day,
// three a week.
describe("bonus days from the streak flame", () => {
  it("makes the whole day adaptive, without using up the week's free workout", () => {
    setWeekStart(1);
    const bonus = bonusDayEvent(NOW - 2 * 3_600_000);
    expect(bonus.id).toBe(`bonus-day-${bonus.day}`);
    expect(bonusToday([bonus], NOW)).toBe(true);
    expect(bonusToday([bonus], NOW + DAY)).toBe(false);
    // Two adaptive workouts on the bonus day: still adaptive today, and the week's free one is still there tomorrow.
    const events = [bonus, start(NOW - 3_600_000), start(NOW - 1_000)];
    expect(freeAdaptiveLeft(events, NOW)).toBe(true);
    expect(freeAdaptiveLeft(events, NOW + DAY)).toBe(true);
    // An adaptive workout on an ordinary day still uses it.
    expect(freeAdaptiveLeft([...events, start(NOW + DAY)], NOW + DAY + 1_000)).toBe(false);
  });

  it("allows one a day and three a week, and starts again next week", () => {
    setWeekStart(1);
    // Monday 9 November to Sunday 15 November 2026.
    const mon = new Date("2026-11-09T09:00:00").getTime();
    expect(bonusDayCheck([], mon)).toBe("ok");
    const days = [bonusDayEvent(mon)];
    expect(bonusDayCheck(days, mon + 3_600_000)).toBe("today");
    expect(bonusDayCheck(days, mon + DAY)).toBe("ok");
    for (let i = 1; i < BONUS_WEEK_MAX; i++) days.push(bonusDayEvent(mon + i * DAY));
    expect(BONUS_WEEK_MAX).toBe(3);
    expect(bonusDayCheck(days, mon + 3 * DAY)).toBe("week");
    expect(bonusDayCheck(days, mon + 6 * DAY)).toBe("week");
    // The next Monday is a new week.
    expect(bonusDayCheck(days, mon + 7 * DAY)).toBe("ok");
  });
});
