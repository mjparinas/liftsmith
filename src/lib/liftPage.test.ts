import { describe, expect, it } from "vitest";

import { DAY, makeWorkout, NOW } from "@/test/factories";

import { liftSessions, liftTrend, repBests } from "./liftPage";

// One page per exercise: past sessions, rep records and which way the lift is going.

const WEEK = 7 * DAY;
const squat = (sessionId: string, at: number, weight: number, reps = 5) =>
  makeWorkout(sessionId, at, [{ exerciseId: "back-squat", weight, reps }]);

describe("an exercise's sessions", () => {
  it("lists every session of the lift, newest first, and leaves other lifts out", () => {
    const events = [
      ...squat("a", NOW - 2 * WEEK, 100),
      ...squat("b", NOW - WEEK, 105),
      ...makeWorkout("c", NOW, [{ exerciseId: "bench-press", weight: 80 }]),
    ];
    const list = liftSessions(events, "back-squat");
    expect(list.map((s) => s.sessionId)).toEqual(["b", "a"]);
    expect(list[0]!.e1rm).toBeGreaterThan(list[1]!.e1rm);
  });
});

describe("rep records", () => {
  it("shows the heaviest weight for at least each rep count, only where it says something new", () => {
    const events = [...squat("a", NOW - WEEK, 140, 1), ...squat("b", NOW, 120, 5), ...squat("c", NOW + 1, 100, 10)];
    const bests = repBests(liftSessions(events, "back-squat"), "back-squat");
    expect(bests.map((b) => [b.reps, b.weight])).toEqual([
      [1, 140],
      [5, 120],
      [10, 100],
    ]);
  });

  it("has none for timed work", () => {
    const events = makeWorkout("a", NOW, [{ exerciseId: "plank", weight: 10, reps: 60 }]);
    expect(repBests(liftSessions(events, "plank"), "plank")).toEqual([]);
  });
});

describe("which way the lift is going", () => {
  it("needs two loaded sessions first", () => {
    expect(liftTrend(liftSessions(squat("a", NOW, 100), "back-squat"), NOW)).toEqual({ kind: "new" });
  });

  it("is up when the last six weeks beat the six before", () => {
    const events = [...squat("a", NOW - 8 * WEEK, 100), ...squat("b", NOW - WEEK, 110)];
    expect(liftTrend(liftSessions(events, "back-squat"), NOW)).toEqual({ kind: "up", pct: 10 });
  });

  it("is down when they fall short", () => {
    const events = [...squat("a", NOW - 8 * WEEK, 110), ...squat("b", NOW - WEEK, 100)];
    expect(liftTrend(liftSessions(events, "back-squat"), NOW)).toEqual({ kind: "down", pct: 9 });
  });

  it("is stalled when the best is three or more weeks old and nothing beats it", () => {
    const events = [...squat("a", NOW - 7 * WEEK - DAY, 100), ...squat("b", NOW - 4 * WEEK, 100), ...squat("c", NOW - WEEK, 100)];
    expect(liftTrend(liftSessions(events, "back-squat"), NOW)).toEqual({ kind: "stalled", weeks: 7 });
  });

  it("is steady when it's level and the best is recent", () => {
    const events = [...squat("a", NOW - 7 * WEEK, 100), ...squat("b", NOW - DAY, 100.4)];
    expect(liftTrend(liftSessions(events, "back-squat"), NOW)).toEqual({ kind: "steady" });
  });
});
