import { describe, expect, it } from "vitest";

import { due, FASTEST, HOLD_DELAY, repeatGap, repeatSize, SLOWEST } from "./holdRepeat";

describe("hold-to-repeat timing", () => {
  it("waits long enough that a tap never repeats", () => {
    expect(HOLD_DELAY).toBeGreaterThanOrEqual(400);
    expect(HOLD_DELAY).toBeLessThanOrEqual(500);
  });

  it("starts slow and speeds up smoothly to a cap", () => {
    expect(repeatGap(1)).toBe(SLOWEST);
    for (let n = 1; n < 60; n++) expect(repeatGap(n + 1)).toBeLessThanOrEqual(repeatGap(n));
    expect(repeatGap(5)).toBeLessThan(repeatGap(1));
    expect(repeatGap(100)).toBe(FASTEST);
    // Top speed within about two and a half seconds of holding.
    let t = HOLD_DELAY;
    let n = 1;
    while (repeatGap(n) > FASTEST) t += repeatGap(n++);
    expect(t).toBeLessThan(2500);
  });

  it("moves one step at a time at first, then bigger steps on a long hold", () => {
    expect(repeatSize(1)).toBe(1);
    expect(repeatSize(20)).toBe(1);
    expect(repeatSize(21)).toBe(2);
    expect(repeatSize(41)).toBe(5);
  });

  it("thins out feedback by the gap", () => {
    expect(due(null, 0, 100)).toBe(true);
    expect(due(1000, 1050, 100)).toBe(false);
    expect(due(1000, 1100, 100)).toBe(true);
  });
});
