import { describe, expect, it } from "vitest";
import { defaultDays, fitLength, freeMinutes, nextStart, trainingIcs } from "./calendar";

// Calendar (MVP+2): training days written out, and workouts fitted around busy times.
const MIN = 60_000;
const mon = new Date(2026, 10, 9, 12, 0).getTime(); // Monday 9 Nov 2026, noon local

describe("calendar", () => {
  it("spreads the weekly goal across the week", () => {
    expect(defaultDays(3)).toEqual([1, 3, 5]);
    expect(defaultDays(2)).toEqual([1, 4]);
    expect(defaultDays(0)).toEqual([1]);
    expect(defaultDays(9)).toHaveLength(7);
  });

  it("finds the next session, today if it's still ahead", () => {
    expect(new Date(nextStart([1, 3], "18:00", mon)!).getDay()).toBe(1);
    expect(new Date(nextStart([1, 3], "18:00", mon)!).getHours()).toBe(18);
    const wed = new Date(nextStart([1, 3], "07:30", mon)!);
    expect([wed.getDay(), wed.getHours(), wed.getMinutes()]).toEqual([3, 7, 30]);
    expect(nextStart([], "18:00", mon)).toBeNull();
  });

  it("writes one weekly repeating event", () => {
    const ics = trainingIcs({ days: [5, 1, 3], time: "18:00" }, 45, mon);
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR");
    expect(ics).toContain("DTSTART:20261109T180000");
    expect(ics).toContain("DTEND:20261109T184500");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });

  it("measures free time until the next busy block", () => {
    const busy = [{ start: mon + 50 * MIN, end: mon + 80 * MIN }, { start: mon + 200 * MIN, end: mon + 260 * MIN }];
    expect(freeMinutes(busy, mon)).toEqual({ minutes: 50, until: mon + 50 * MIN });
    expect(freeMinutes(busy, mon + 60 * MIN).minutes).toBe(0);
    expect(freeMinutes([], mon)).toEqual({ minutes: 180, until: null });
    expect(freeMinutes([{ start: mon - 60 * MIN, end: mon - 30 * MIN }], mon).minutes).toBe(180);
  });

  it("offers a shorter workout only when the plan doesn't fit and a useful one does", () => {
    expect(fitLength(60, 45)).toBeNull(); // fits with time to spare
    expect(fitLength(50, 45)).toBe(40);
    expect(fitLength(42, 60)).toBe(30);
    expect(fitLength(20, 45)).toBeNull(); // nothing worth doing
    expect(fitLength(0, 45)).toBeNull();
  });
});
