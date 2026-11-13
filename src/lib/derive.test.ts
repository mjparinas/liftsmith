import { afterEach, describe, expect, it } from "vitest";

import { DAY, makeSessionEnd, makeSet, NOW } from "@/test/factories";

import { dedupe, derive, setWeekStart, weekOf } from "./derive";
import type { AppEvent } from "./types";

// Stats worked out from the event log: workouts, personal bests, the week streak and sets per muscle
// each week (mutation run, 2026-11-13: several of these rules had no test that would notice a change).

const WEEK = 7 * DAY;
const bench = (sessionId: string, at: number, weight: number, reps = 5) =>
  makeSet({ sessionId, at, exerciseId: "bench-press", weight, reps, targetReps: reps });

afterEach(() => setWeekStart(1));

describe("dedupe", () => {
  it("keeps the first copy of each event, oldest first, ties in id order", () => {
    const a = makeSet({ id: "b", at: 2 });
    const b = makeSet({ id: "a", at: 2 });
    const c = makeSet({ id: "c", at: 1 });
    expect(dedupe([a, b, c, { ...a, weight: 999 }]).map((e) => e.id)).toEqual(["c", "a", "b"]);
  });
});

describe("derive: workouts", () => {
  it("sums each workout and lists them newest first", () => {
    const ev: AppEvent[] = [
      bench("old", NOW - 3 * DAY, 60, 5),
      bench("old", NOW - 3 * DAY + 60_000, 60, 5),
      makeSessionEnd({ sessionId: "old", at: NOW - 3 * DAY + 120_000, seconds: 1800, avgHr: 120, maxHr: 160 }),
      bench("new", NOW - DAY, 70, 3),
      makeSet({ sessionId: "new", at: NOW - DAY + 90_000, exerciseId: "back-squat", weight: 100, reps: 5 }),
    ];
    const s = derive(ev, NOW);
    expect(s.sessions.map((x) => x.sessionId)).toEqual(["new", "old"]);
    const [latest, first] = s.sessions;
    expect(first).toMatchObject({ seconds: 1800, sets: 2, volume: 600, exercises: ["bench-press"], avgHr: 120, maxHr: 160 });
    // No end event: the time from the first set to the last.
    expect(latest).toMatchObject({ seconds: 90, sets: 2, volume: 710, exercises: ["bench-press", "back-squat"] });
    expect(latest!.avgHr).toBeUndefined();
    expect(s.totalSets).toBe(4);
    expect(s.totalVolume).toBe(1310);
    expect(s.totalSeconds).toBe(1890);
  });
});

describe("derive: personal bests", () => {
  it("records a best only when a later workout beats the earlier best", () => {
    const ev = [
      bench("a", NOW - 4 * DAY, 60), // first: no best to beat
      bench("b", NOW - 3 * DAY, 70), // beats 60
      bench("c", NOW - 2 * DAY, 65), // lighter: no best
      bench("d", NOW - DAY, 68), // beats 65 but not 70: no best
    ];
    const s = derive(ev, NOW);
    expect(s.prs.map((p) => [p.at, p.weight])).toEqual([[NOW - 3 * DAY, 70]]);
    expect(s.sessions.find((x) => x.sessionId === "b")!.prs).toBe(1);
    expect(s.sessions.find((x) => x.sessionId === "d")!.prs).toBe(0);
    expect(s.prs[0]).toMatchObject({ exerciseId: "bench-press", reps: 5 });
    expect(s.prs[0]!.e1rm).toBeCloseTo(70 * (1 + 5 / 30), 6);
  });

  it("lists bests newest first and doesn't count a tie", () => {
    const ev = [bench("a", NOW - 4 * DAY, 60), bench("b", NOW - 3 * DAY, 60), bench("c", NOW - 2 * DAY, 62.5), bench("d", NOW - DAY, 65)];
    expect(derive(ev, NOW).prs.map((p) => p.weight)).toEqual([65, 62.5]);
  });

  it("keeps one point a session per lift, from its best set, rounded to 0.1", () => {
    const ev = [bench("a", NOW - 2 * DAY, 61, 5), bench("a", NOW - 2 * DAY + 60_000, 61, 7), bench("b", NOW - DAY, 50, 1)];
    expect(derive(ev, NOW).e1rmSeries.get("bench-press")).toEqual([
      { at: NOW - 2 * DAY + 60_000, e1rm: 75.2 }, // 61 × (1 + 7/30) = 75.23
      { at: NOW - DAY, e1rm: 51.7 },
    ]);
  });

  it("leaves out unloaded sets and timed exercises", () => {
    const ev = [
      makeSet({ sessionId: "a", at: NOW - DAY, exerciseId: "push-up", weight: 0, reps: 20 }),
      makeSet({ sessionId: "a", at: NOW - DAY, exerciseId: "db-shrug-hold", weight: 30, reps: 40 }),
    ];
    expect(derive(ev, NOW).e1rmSeries.size).toBe(0);
  });
});

describe("derive: week streak", () => {
  const thisWeek = weekOf(NOW);
  const inWeek = (weeksAgo: number) => bench(`w${weeksAgo}`, thisWeek - weeksAgo * WEEK + DAY, 60);

  it("counts weeks in a row with a workout, up to this one", () => {
    expect(derive([inWeek(0), inWeek(1), inWeek(2)], NOW).weekStreak).toBe(3);
    expect(derive([inWeek(0), inWeek(2)], NOW).weekStreak).toBe(1);
    expect(derive([], NOW).weekStreak).toBe(0);
  });

  it("doesn't break the streak for a week still in progress", () => {
    expect(derive([inWeek(1), inWeek(2)], NOW).weekStreak).toBe(2);
    expect(derive([inWeek(2)], NOW).weekStreak).toBe(0);
  });

  it("follows the lifter's first day of the week", () => {
    setWeekStart(1);
    const monday = weekOf(NOW);
    setWeekStart(0);
    expect(weekOf(NOW)).toBe(monday - DAY);
  });
});

describe("derive: sets per muscle each week", () => {
  it("gives 8 weeks oldest first, counting main muscles 1 and helpers half", () => {
    const thisWeek = weekOf(NOW);
    const ev = [
      bench("a", thisWeek, 60), // the first moment of this week
      bench("a", thisWeek + DAY, 60),
      bench("b", thisWeek - 1, 60), // the last moment of last week
      bench("c", thisWeek - 8 * WEEK, 60), // too old
      makeSet({ sessionId: "d", at: thisWeek + DAY, exerciseId: "no-such-lift" }),
    ];
    const weeks = derive(ev, NOW).weeklyMuscleSets;
    expect(weeks).toHaveLength(8);
    expect(weeks[7]!.weekStart).toBe(thisWeek);
    expect(weeks[0]!.weekStart).toBe(thisWeek - 7 * WEEK);
    expect(weeks[7]!.sets.chest).toBe(2);
    expect(weeks[7]!.sets.triceps).toBe(1);
    expect(weeks[6]!.sets.chest).toBe(1);
    expect(weeks.slice(0, 6).every((w) => w.sets.chest === 0)).toBe(true);
  });
});
