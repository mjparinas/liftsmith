import { describe, expect, it } from "vitest";

import { cleanClass, cleanOff, endTime, nextDates, nextStart, schedule, timetable, type GymClass } from "./gymClasses";

// A gym's weekly class schedule (docs/decisions/gyms.md "Class schedules").
const spin = (over: Partial<GymClass> = {}): GymClass => ({
  id: "a1",
  name: "Spin",
  kind: "cycling",
  days: [1, 3],
  start: "18:00",
  minutes: 45,
  coach: "",
  room: "",
  note: "",
  off: [],
  ...over,
});
// Tuesday 17 November 2026, 10:00 on this machine's clock.
const TUE = new Date(2026, 10, 17, 10, 0).getTime();

describe("tidying a class", () => {
  it("keeps known days in order, a real time and a length in range, and falls back to Other for an unknown type", () => {
    expect(
      cleanClass({
        name: "  Morning   yoga ",
        kind: "sumo",
        days: [5, 1, 1, 9],
        start: "07:30",
        minutes: "60",
        off: ["2026-12-24", "nope"],
      }),
    ).toEqual({
      name: "Morning yoga",
      kind: "other",
      days: [1, 5],
      start: "07:30",
      minutes: 60,
      coach: "",
      room: "",
      note: "",
      off: ["2026-12-24"],
    });
  });

  it("refuses a class without a name, a day, a real time or a sensible length", () => {
    const ok = { name: "Spin", days: [1], start: "18:00", minutes: 45 };
    expect(cleanClass(ok)).not.toBeNull();
    expect(cleanClass({ ...ok, name: " " })).toBeNull();
    expect(cleanClass({ ...ok, days: [] })).toBeNull();
    expect(cleanClass({ ...ok, start: "25:00" })).toBeNull();
    expect(cleanClass({ ...ok, minutes: 5 })).toBeNull();
    expect(cleanClass({ ...ok, minutes: 300 })).toBeNull();
    expect(cleanClass("Spin")).toBeNull();
  });

  it("keeps at most twenty dates off, the latest ones", () => {
    const many = Array.from({ length: 25 }, (_, i) => `2027-01-${String(i + 1).padStart(2, "0")}`);
    const kept = cleanOff(many);
    expect(kept).toHaveLength(20);
    expect(kept[0]).toBe("2027-01-06");
  });
});

describe("the week ahead", () => {
  it("lists today first, each day's classes by start time, and marks a date the gym took off", () => {
    const yoga = spin({ id: "b2", name: "Yoga", kind: "yoga", days: [3], start: "07:00", minutes: 60 });
    const week = schedule([spin({ off: ["2026-11-18"] }), yoga], TUE);
    expect(week).toHaveLength(7);
    expect(week[0]).toMatchObject({ key: "2026-11-17", weekday: 2, classes: [] });
    expect(week[1]!.key).toBe("2026-11-18");
    expect(week[1]!.classes.map((c) => [c.cls.name, c.off])).toEqual([
      ["Yoga", false],
      ["Spin", true],
    ]);
    expect(week[6]!.classes.map((c) => c.cls.name)).toEqual(["Spin"]);
  });

  it("finds the next start, skipping a date off and today's class once it has started", () => {
    // Wednesday 18:00 is off, so the next one is Monday 23 November.
    expect(new Date(nextStart(spin({ off: ["2026-11-18"] }), TUE)!)).toEqual(new Date(2026, 10, 23, 18, 0));
    expect(new Date(nextStart(spin({ days: [2] }), TUE)!)).toEqual(new Date(2026, 10, 17, 18, 0));
    expect(new Date(nextStart(spin({ days: [2], start: "09:00" }), TUE)!)).toEqual(new Date(2026, 10, 24, 9, 0));
    expect(nextStart(spin({ days: [] }), TUE)).toBeNull();
  });

  it("offers the next dates a class runs, for marking one off", () => {
    expect(nextDates(spin(), TUE, 4)).toEqual(["2026-11-18", "2026-11-23", "2026-11-25", "2026-11-30"]);
  });

  it("works out the end time, past midnight too", () => {
    expect(endTime("18:30", 45)).toBe("19:15");
    expect(endTime("23:30", 45)).toBe("00:15");
  });

  it("lays out a whole week Monday first, or Sunday first, leaving out days with no classes", () => {
    const sun = spin({ id: "c3", name: "Sunday stretch", days: [0], start: "10:00" });
    expect(timetable([spin(), sun]).map((d) => d.weekday)).toEqual([1, 3, 0]);
    expect(timetable([spin(), sun], true).map((d) => d.weekday)).toEqual([0, 1, 3]);
  });
});
