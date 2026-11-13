import { describe, expect, it } from "vitest";

import { DAY, makeProfile, makeWorkout, NOW } from "@/test/factories";

import { EXERCISE_BY_ID } from "./exercises";
import { liftSessions } from "./liftPage";
import {
  DEFAULT_RANGE,
  liftComparison,
  liftKind,
  liftMax,
  liftSeries,
  liftTotals,
  metricsFor,
  RANGE_DAYS,
  seriesChange,
} from "./liftStats";
import type { AppEvent } from "./types";

const squat = EXERCISE_BY_ID.get("back-squat")!;
const pushUp = EXERCISE_BY_ID.get("push-up")!;

/** One squat session a week for `weeks` weeks up to NOW, 2.5 kg heavier each week, three sets of 5. */
function squats(weeks: number, from = 80): AppEvent[] {
  return Array.from({ length: weeks }, (_, i) => {
    const at = NOW - (weeks - 1 - i) * 7 * DAY;
    const w = from + i * 2.5;
    return makeWorkout(`sq${i}`, at, [
      { exerciseId: "back-squat", weight: w, reps: 5 },
      { exerciseId: "back-squat", weight: w, reps: 5 },
      { exerciseId: "back-squat", weight: w, reps: 5 },
    ]);
  }).flat();
}

describe("lift kinds and metrics", () => {
  it("charts loaded lifts by estimated max, volume and heaviest set", () => {
    expect(liftKind(squat)).toBe("loaded");
    expect(metricsFor(squat)).toEqual(["e1rm", "volume", "top"]);
  });
  it("charts bodyweight lifts by reps", () => {
    expect(liftKind(pushUp)).toBe("bodyweight");
    expect(metricsFor(pushUp)[0]).toBe("reps");
  });
  it("defaults to three months", () => {
    expect(DEFAULT_RANGE).toBe("3m");
    expect(RANGE_DAYS["1w"]).toBe(7);
    expect(RANGE_DAYS["1y"]).toBe(365);
  });
});

describe("liftTotals", () => {
  it("counts sessions, sets, reps and lifetime volume", () => {
    const events = squats(2);
    const t = liftTotals(liftSessions(events, "back-squat"), squat);
    expect(t.sessions).toBe(2);
    expect(t.sets).toBe(6);
    expect(t.reps).toBe(30);
    // 3 × 5 × 80 + 3 × 5 × 82.5
    expect(t.volumeKg).toBe(1200 + 1237.5);
    expect(t.firstAt).toBe(NOW - 7 * DAY + 60_000);
  });
  it("is empty for a lift never done", () => {
    expect(liftTotals([], squat)).toEqual({ sessions: 0, sets: 0, reps: 0, volumeKg: 0, seconds: 0, firstAt: null });
  });
});

describe("liftSeries", () => {
  const events = squats(20);
  const sessions = liftSessions(events, "back-squat");
  const now = NOW + DAY;
  it("keeps only sessions inside the range, oldest first", () => {
    expect(liftSeries(sessions, "top", "1w", now).map((p) => p.value)).toEqual([127.5]);
    expect(liftSeries(sessions, "top", "1m", now).map((p) => p.value)).toEqual([117.5, 120, 122.5, 125, 127.5]);
    const year = liftSeries(sessions, "top", "1y", now);
    expect(year).toHaveLength(20);
    expect(year[0]!.value).toBe(80);
  });
  it("leaves out sessions after now", () => {
    expect(liftSeries(sessions, "top", "1m", NOW - DAY).at(-1)!.value).toBe(125);
  });
  it("adds up each session's volume", () => {
    expect(liftSeries(sessions, "volume", "1m", now)[0]!.value).toBe(15 * 117.5);
  });
  it("takes the estimated max from the 1RM estimator's own points", () => {
    const max = liftMax(events, squat, NOW + DAY);
    const pts = liftSeries(sessions, "e1rm", "3m", NOW + DAY, max);
    expect(pts.length).toBeGreaterThan(5);
    expect(pts.at(-1)!.value).toBeGreaterThan(pts[0]!.value);
  });
});

describe("seriesChange", () => {
  it("compares the last three points with the first three", () => {
    const pts = [100, 100, 100, 110, 110, 110].map((value, i) => ({ at: i, value }));
    expect(seriesChange(pts)).toBe(10);
  });
  it("needs four points", () => {
    expect(seriesChange([1, 2, 3].map((value, i) => ({ at: i, value })))).toBeNull();
  });
  it("uses fewer points on a short line", () => {
    const pts = [100, 200, 50, 90].map((value, i) => ({ at: i, value }));
    expect(seriesChange(pts)).toBe(-53);
  });
});

describe("liftComparison", () => {
  const events = squats(8);
  const max = liftMax(events, squat, NOW + DAY);
  it("compares a logged max with the standard for the lifter's weight, age and sex", () => {
    const c = liftComparison(squat, max, events, makeProfile({ bodyweight: 80, birthYear: 1990, sex: "male" }), NOW)!;
    expect(c.bodyweightKg).toBe(80);
    expect(c.age).toBe(36);
    expect(c.percentile).toBeGreaterThan(0);
    expect(c.percentile).toBeLessThan(100);
    expect(c.ratio).toBeCloseTo(max!.e1rm / 80, 5);
    expect(c.steps.map((s) => s.pct)).toEqual([25, 50, 75, 90, 95]);
    // The next rung is above today's percentile and needs more on the max.
    expect(c.next!.pct).toBeGreaterThan(c.percentile);
    expect(c.next!.moreKg).toBeGreaterThan(0);
  });
  it("uses the newest weigh-in over the profile's weight", () => {
    const weighed: AppEvent[] = [...events, { type: "bodyweight", id: "bw1", at: NOW, kg: 100 }];
    const c = liftComparison(squat, max, weighed, makeProfile({ bodyweight: 80 }), NOW)!;
    expect(c.bodyweightKg).toBe(100);
  });
  it("ranks a woman's lift higher than the same lift by a man of the same weight", () => {
    const m = liftComparison(squat, max, events, makeProfile({ bodyweight: 70, sex: "male" }), NOW)!;
    const f = liftComparison(squat, max, events, makeProfile({ bodyweight: 70, sex: "female" }), NOW)!;
    expect(f.percentile).toBeGreaterThan(m.percentile);
  });
  it("says nothing for a max typed at setup, a bodyweight lift or no max", () => {
    const p = makeProfile({ bodyweight: 80 });
    expect(liftComparison(squat, { e1rm: 140, source: "setup" }, [], p, NOW)).toBeNull();
    expect(liftComparison(pushUp, max, events, p, NOW)).toBeNull();
    expect(liftComparison(squat, null, events, p, NOW)).toBeNull();
  });
  it("has no next rung past the 95th percentile", () => {
    const c = liftComparison(squat, { e1rm: 400, source: "logged" }, events, makeProfile({ bodyweight: 80 }), NOW)!;
    expect(c.next).toBeNull();
  });
});
