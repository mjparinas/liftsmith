import { describe, expect, it } from "vitest";

import { angleOf, formatTime, hourAt, minuteAt, parseTime, slotOf, slotPoint, uses12h } from "./timeDial";

describe("the clock dial", () => {
  it("reads and writes the stored time", () => {
    expect(parseTime("06:05")).toEqual([6, 5]);
    expect(parseTime("23:59")).toEqual([23, 59]);
    expect(parseTime("24:00")).toEqual([18, 0]);
    expect(parseTime("junk")).toEqual([18, 0]);
    expect(formatTime(7, 5)).toBe("07:05");
  });

  it("knows which regions use AM and PM", () => {
    expect(uses12h("en-US")).toBe(true);
    expect(uses12h("en-CA")).toBe(true);
    expect(uses12h("fr-FR")).toBe(false);
    expect(uses12h("de-DE")).toBe(false);
  });

  it("turns a touch into the nearest number, clockwise from the top", () => {
    expect(slotOf(angleOf(0, -100))).toBe(0); // straight up
    expect(slotOf(angleOf(100, 0))).toBe(3); // right
    expect(slotOf(angleOf(0, 100))).toBe(6); // down
    expect(slotOf(angleOf(-100, 0))).toBe(9); // left
    expect(slotOf(angleOf(-5, -100))).toBe(0); // just left of the top rounds back to 12
  });

  it("picks hours on 12- and 24-hour faces, and minutes in fives", () => {
    expect(hourAt(0, true, false, false)).toBe(0); // 12 AM
    expect(hourAt(0, true, true, false)).toBe(12); // 12 PM
    expect(hourAt(7, true, true, false)).toBe(19);
    expect(hourAt(7, false, false, false)).toBe(7);
    expect(hourAt(7, false, false, true)).toBe(19);
    expect(hourAt(0, false, false, true)).toBe(12);
    expect(minuteAt(6)).toBe(30);
  });

  it("places numbers round the face", () => {
    const p = slotPoint(3, 100);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(0);
  });
});
