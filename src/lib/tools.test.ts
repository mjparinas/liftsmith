import { describe, expect, it } from "vitest";

import { dotsLevel } from "@/components/site/DotsCalculator";
import { rpePct } from "@/components/site/RpeChart";

import { EXERCISE_BY_ID } from "./exercises";
import { dots } from "./onerm";
import { liftStanding } from "./strength";

// The public calculators (/tools/): they reuse the app's engine, so these check the parts added for the site.

describe("RPE chart", () => {
  it("is the full max for one rep at RPE 10, and lighter with more reps or more reps in reserve", () => {
    expect(rpePct(1, 10)).toBe(1);
    expect(rpePct(5, 8)).toBeLessThan(rpePct(5, 9));
    expect(rpePct(8, 9)).toBeLessThan(rpePct(5, 9));
    // A set of 5 at RPE 8 is a 7-rep effort.
    expect(rpePct(5, 8)).toBeCloseTo(rpePct(7, 10), 6);
  });
});

describe("strength standards", () => {
  const bench = EXERCISE_BY_ID.get("bench-press")!;

  it("puts the typical intermediate at the 50th percentile, and the steps in order", () => {
    const s = liftStanding(bench, 100, 80, 30, "male");
    expect(liftStanding(bench, s.standard, 80, 30, "male").percentile).toBe(50);
    const steps = s.steps.map((x) => x.e1rm);
    expect([...steps].sort((a, b) => a - b)).toEqual(steps);
    expect(s.steps.find((x) => x.pct === 50)!.e1rm).toBeCloseTo(s.standard, 6);
  });

  it("asks less of older lifters and of women, and more of heavier lifters", () => {
    const base = liftStanding(bench, 100, 80, 30, "male").standard;
    expect(liftStanding(bench, 100, 80, 55, "male").standard).toBeLessThan(base);
    expect(liftStanding(bench, 100, 80, 30, "female").standard).toBeLessThan(base);
    expect(liftStanding(bench, 100, 100, 30, "male").standard).toBeGreaterThan(base);
  });
});

describe("DOTS calculator", () => {
  it("labels scores with the app's levels", () => {
    expect(dotsLevel(150)).toBe("Beginner");
    expect(dotsLevel(350)).toBe("Intermediate");
    expect(dotsLevel(510)).toBe("Elite");
    expect(dots(500, 80, "male")).toBeGreaterThan(300);
  });
});
