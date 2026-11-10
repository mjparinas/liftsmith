import { describe, expect, it } from "vitest";

import { TREND_SAMPLES, trendPath, trendPoints } from "./hrTrend";

describe("heart rate trend line", () => {
  it("draws nothing until there are two readings", () => {
    expect(trendPoints([], 44, 14)).toEqual([]);
    expect(trendPoints([120], 44, 14)).toEqual([]);
    expect(trendPath([])).toBe("");
  });

  it("spans the width, with higher bpm higher up", () => {
    const pts = trendPoints([100, 140, 120], 44, 14);
    expect(pts.map((p) => p[0])).toEqual([0, 22, 44]);
    expect(pts[1]![1]).toBeLessThan(pts[2]![1]);
    expect(pts[2]![1]).toBeLessThan(pts[0]![1]);
    expect(pts[1]![1]).toBe(1.5);
    expect(pts[0]![1]).toBe(12.5);
  });

  it("keeps a steady heart rate near the middle instead of magnifying noise", () => {
    const pts = trendPoints([130, 131, 130, 131], 44, 14);
    for (const [, y] of pts) expect(Math.abs(y - 7)).toBeLessThan(1.5);
  });

  it("shows only the last couple of minutes and skips bad readings", () => {
    const long = Array.from({ length: TREND_SAMPLES + 30 }, (_, i) => 100 + (i % 20));
    expect(trendPoints(long, 44, 14)).toHaveLength(TREND_SAMPLES);
    expect(trendPoints([120, 0, Number.NaN, 130], 44, 14)).toHaveLength(2);
  });

  it("makes one smooth path that ends on the latest reading", () => {
    const d = trendPath(trendPoints([110, 120, 115, 125], 44, 14));
    expect(d).toMatch(/^M0 [\d.]+( Q[\d. ]+)+ L44 [\d.]+$/);
  });
});
