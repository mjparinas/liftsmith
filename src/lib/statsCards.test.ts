import { describe, expect, it } from "vitest";

import { DAY, makeSet, makeWorkout, NOW } from "@/test/factories";

import { takeShot } from "./screenshots";
import type { ShareContext } from "./shareCards";
import { familySplit, hasStats, spanPeriod, SPANS, statsShares, wholePercents } from "./statsCards";

const ctx: ShareContext = {
  unit: "kg",
  game: { level: { level: 12, title: "Iron", into: 0, span: 1, next: null }, streak: { weeks: 8 } as ShareContext["game"]["streak"] },
};

// Two workouts in the last month: bench (push) and squats (legs), the second one a heavier bench.
const events = [
  ...makeWorkout("a", NOW - 10 * DAY, [
    { exerciseId: "bench-press", weight: 60 },
    { exerciseId: "bench-press", weight: 60 },
    { exerciseId: "back-squat", weight: 80 },
  ]),
  ...makeWorkout("b", NOW - 3 * DAY, [
    { exerciseId: "bench-press", weight: 70 },
    { exerciseId: "back-squat", weight: 90 },
  ]),
];

describe("stats share cards", () => {
  it("covers each span, and All starts on the first set's day", () => {
    expect(SPANS).toEqual(["1m", "3m", "6m", "1y", "all"]);
    const m = spanPeriod("1m", events, NOW);
    expect(m.end - m.start).toBe(30 * DAY);
    const all = spanPeriod("all", events, NOW);
    expect(all.start).toBeLessThanOrEqual(NOW - 10 * DAY);
    expect(all.start).toBeGreaterThan(NOW - 12 * DAY);
  });

  it("only offers cards once there's a set", () => {
    expect(hasStats([])).toBe(false);
    expect(hasStats(events)).toBe(true);
  });

  it("splits sets by muscle family, biggest first", () => {
    const split = familySplit(events.filter((e) => e.type === "set") as ReturnType<typeof makeSet>[]);
    expect(split.map((f) => f.family)).toEqual(["push", "legs"]);
    expect(split[0]!.share).toBeCloseTo(0.6);
    expect(familySplit([])).toEqual([]);
  });

  it("rounds percentages so they always add up to 100", () => {
    expect(wholePercents([1 / 3, 1 / 3, 1 / 3])).toEqual([34, 33, 33]);
    expect(wholePercents([0.6, 0.4])).toEqual([60, 40]);
    expect(wholePercents([0.125, 0.125, 0.75]).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("makes the totals, split and best lifts cards", () => {
    const items = statsShares(events, "1m", ctx, NOW);
    expect(items.map((i) => i.id)).toEqual(["stats-totals", "stats-split", "stats-lifts"]);
    const totals = items[0]!.card({ weights: true, name: null });
    expect(totals.headline).toMatch(/2/);
    const split = items[1]!.card({ weights: true, name: null });
    expect(split.split?.reduce((a, s) => a + s.percent, 0)).toBe(100);
  });

  it("shows no weights when they're hidden", () => {
    for (const item of statsShares(events, "3m", ctx, NOW)) {
      const card = item.card({ weights: false, name: null });
      const text = JSON.stringify(card);
      expect(text).not.toMatch(/\bkg\b/);
      expect(text).not.toMatch(/\bt\b/);
    }
  });

  it("has nothing to share for a span with no workouts", () => {
    const old = makeWorkout("old", NOW - 200 * DAY, [{ exerciseId: "bench-press" }]);
    expect(statsShares(old, "1m", ctx, NOW)).toEqual([]);
    expect(statsShares(old, "1y", ctx, NOW).length).toBeGreaterThan(0);
  });

  it("opens once for screenshots taken in quick succession", () => {
    expect(takeShot(1000, null)).toBe(true);
    expect(takeShot(5000, 1000)).toBe(false);
    expect(takeShot(30_000, 1000)).toBe(true);
  });
});
