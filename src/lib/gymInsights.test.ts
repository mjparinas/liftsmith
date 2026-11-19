import { describe, expect, it } from "vitest";

import { cleanVisit, insightStep, MIN_LIFTERS, openHours, quietHour, summarize, type GymInsights, type VisitRow } from "./gymInsights";

// Owner insights (docs/decisions/gyms.md "Owner insights"): totals and shares from anonymous visits, one step to take.
const NOW = 1_800_000_000_000;
const TODAY = Math.floor(NOW / 86_400_000);
const row = (who: string, over: Partial<VisitRow> = {}): VisitRow => ({
  who,
  date: TODAY - 1,
  day: 1,
  hour: 18,
  minutes: 60,
  gear: "barbell,rack",
  ...over,
});
const lifters = (n: number, over: Partial<VisitRow> = {}) => Array.from({ length: n }, (_, i) => row(`w${i}`, over));

describe("summarize", () => {
  it("shows only the lifter count and open problems until enough lifters trained there", () => {
    const ins = summarize(lifters(MIN_LIFTERS - 1), TODAY, [{ at: NOW - 3 * 86_400_000 }], NOW);
    expect(ins).toMatchObject({
      ready: false,
      lifters: MIN_LIFTERS - 1,
      workouts: 0,
      hours: [],
      gear: [],
      peak: null,
      issues: 1,
      oldestIssueDays: 3,
    });
  });

  it("counts lifters once, compares with the four weeks before and gives shares, never counts", () => {
    const rows = [
      ...lifters(5),
      row("w0", { hour: 7, day: 3, gear: "dumbbells", minutes: 40 }),
      // The window before: two workouts by one lifter. Older than 8 weeks is ignored.
      row("old", { date: TODAY - 30 }),
      row("old", { date: TODAY - 40 }),
      row("older", { date: TODAY - 70 }),
    ];
    const ins = summarize(rows, TODAY, [], NOW);
    expect(ins.ready).toBe(true);
    expect([ins.lifters, ins.liftersBefore, ins.workouts, ins.workoutsBefore]).toEqual([5, 1, 6, 2]);
    expect(ins.minutes).toBe(60);
    expect(ins.hours[18]).toBe(83);
    expect(ins.hours[7]).toBe(17);
    expect(ins.days[1]).toBe(83);
    expect(ins.peak).toEqual({ day: 1, hour: 18 });
    expect(ins.gear).toEqual([
      { equipment: "barbell", share: 83 },
      { equipment: "rack", share: 83 },
      { equipment: "dumbbells", share: 17 },
    ]);
  });

  it("names no busiest hour when no hour has a few visits", () => {
    const rows = Array.from({ length: 6 }, (_, i) => row(`w${i}`, { hour: 6 + i }));
    expect(summarize(rows, TODAY, [], NOW).peak).toBeNull();
  });

  it("drops equipment it doesn't know", () => {
    expect(summarize(lifters(5, { gear: "barbell,laser" }), TODAY, [], NOW).gear.map((g) => g.equipment)).toEqual(["barbell"]);
  });
});

describe("cleanVisit", () => {
  const ok = { session: "s-123456", place: "abc", day: 2, hour: 7, at: NOW - 1000, minutes: 45, gear: ["barbell", "barbell", "laser"] };
  it("keeps a good visit, with each kind of equipment once", () => {
    expect(cleanVisit(ok, NOW)).toEqual({ ...ok, gear: ["barbell"] });
  });
  it("refuses bad hours, days, lengths and times", () => {
    for (const bad of [
      { hour: 24 },
      { day: 7 },
      { minutes: 0 },
      { at: NOW - 20 * 86_400_000 },
      { at: NOW + 7_200_000 },
      { session: "x" },
      { hour: 1.5 },
    ])
      expect(cleanVisit({ ...ok, ...bad }, NOW)).toBeNull();
    expect(cleanVisit(null, NOW)).toBeNull();
  });
});

describe("the quiet hour", () => {
  it("is an hour open on most weekdays, between 6 AM and 9 PM", () => {
    // Open 08:00 to 20:00 Monday to Friday, closed at weekends.
    const week = [...Array.from({ length: 5 }, () => ["08:00-20:00"]), [], []];
    expect(openHours(week)).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    expect(openHours(null)).toHaveLength(15);
  });
  it("is the hour with the smallest share, the earliest on a tie", () => {
    const hours = Array.from({ length: 24 }, (_, h) => (h === 14 ? 1 : h === 10 ? 1 : 5));
    expect(quietHour({ hours }, [9, 10, 14, 18])).toBe(10);
    expect(quietHour({ hours }, [])).toBeNull();
  });
});

describe("the one thing to do", () => {
  const base: GymInsights = {
    ready: true,
    lifters: 8,
    liftersBefore: 8,
    workouts: 30,
    workoutsBefore: 30,
    minutes: 55,
    hours: Array.from({ length: 24 }, (_, h) => (h === 18 ? 30 : h === 14 ? 1 : 3)),
    days: [],
    peak: { day: 1, hour: 18 },
    gear: [{ equipment: "barbell", share: 80 }],
    issues: 0,
    oldestIssueDays: 0,
  };
  it("puts open problem reports first, even before the gym has enough lifters", () => {
    expect(insightStep({ ...base, ready: false, issues: 2, oldestIssueDays: 4 }, [], [])).toEqual({ kind: "issues", count: 2, days: 4 });
  });
  it("says how many more lifters the insights need", () => {
    expect(insightStep({ ...base, ready: false, lifters: 2 }, [], [])).toEqual({ kind: "wait", more: MIN_LIFTERS - 2 });
  });
  it("points at equipment in the gym's setup nobody used, once there are enough workouts", () => {
    expect(insightStep(base, ["barbell", "legPress"], [14])).toEqual({ kind: "unused", equipment: "legPress" });
    expect(insightStep({ ...base, workouts: 10, workoutsBefore: 10 }, ["barbell", "legPress"], [14]).kind).toBe("quiet");
  });
  it("names a drop of a fifth or more in workouts", () => {
    expect(insightStep({ ...base, workouts: 20 }, ["barbell"], [14])).toEqual({ kind: "down", pct: 33 });
    expect(insightStep({ ...base, workouts: 25 }, ["barbell"], [14]).kind).toBe("quiet");
  });
  it("else suggests telling members the quiet hour, with the busiest beside it", () => {
    expect(insightStep(base, ["barbell"], [9, 14, 18])).toEqual({ kind: "quiet", hour: 14, peak: { day: 1, hour: 18 } });
    expect(insightStep(base, ["barbell"], [])).toEqual({ kind: "keep" });
  });
});
