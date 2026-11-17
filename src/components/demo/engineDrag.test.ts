import { describe, expect, it } from "vitest";

import { decaySpin, flingSpeed, releaseSpin, turnPerPx } from "./engine";

describe("drag to rotate", () => {
  it("turns about 300° across the figure, within limits", () => {
    expect(turnPerPx(300)).toBe(1);
    expect(turnPerPx(600)).toBe(0.5);
    expect(turnPerPx(2000)).toBe(0.35);
    expect(turnPerPx(100)).toBe(1);
    expect(turnPerPx(0)).toBe(1);
  });

  it("smooths the drag speed over the last moves", () => {
    // 10° in 16 ms is 625°/s; one move only moves the estimate part of the way
    const v = flingSpeed(0, 10, 16);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(625);
    // a long gap trusts the newest move fully
    expect(flingSpeed(100, 10, 100)).toBe(100);
    // no time passed: unchanged
    expect(flingSpeed(42, 10, 0)).toBe(42);
  });

  it("flings only when the finger was still moving as it lifted", () => {
    expect(releaseSpin(400, 10)).toBe(400);
    expect(releaseSpin(-400, 10)).toBe(-400);
    expect(releaseSpin(400, 120)).toBe(0);
    expect(releaseSpin(10, 10)).toBe(0);
    expect(releaseSpin(5000, 10)).toBe(720);
    expect(releaseSpin(-5000, 10)).toBe(-720);
  });

  it("slows a fling down and stops it", () => {
    let v = 600;
    let t = 0;
    let turned = 0;
    while (v !== 0 && t < 10) {
      turned += v / 60;
      v = decaySpin(v, 1 / 60);
      t += 1 / 60;
    }
    expect(v).toBe(0);
    expect(t).toBeLessThan(2);
    // a 600°/s flick carries on for a bit under 200°
    expect(turned).toBeGreaterThan(150);
    expect(turned).toBeLessThan(200);
    expect(Math.abs(decaySpin(-300, 1 / 60))).toBeLessThan(300);
    expect(decaySpin(-300, 1 / 60)).toBeLessThan(0);
  });
});
