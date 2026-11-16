import { describe, expect, it } from "vitest";

import { DEMO_HR_PERIOD, demoHeartRate } from "./heroProgram";

describe("the home page demo's heart rate", () => {
  it("rests at 98 bpm, peaks at 124 mid-set and settles again", () => {
    expect(demoHeartRate(0)).toBe(98);
    expect(demoHeartRate(DEMO_HR_PERIOD / 2)).toBe(124);
    expect(demoHeartRate(DEMO_HR_PERIOD)).toBe(98);
  });

  it("stays within a lifter's range and moves gently", () => {
    let prev = demoHeartRate(0);
    for (let s = 2; s <= DEMO_HR_PERIOD * 3; s += 2) {
      const bpm = demoHeartRate(s);
      expect(bpm).toBeGreaterThanOrEqual(98);
      expect(bpm).toBeLessThanOrEqual(124);
      expect(Math.abs(bpm - prev)).toBeLessThanOrEqual(5);
      prev = bpm;
    }
  });
});
