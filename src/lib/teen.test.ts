import { describe, expect, it } from "vitest";

import { ageOf, bodyCompOn, isTeen, MIN_AGE, tooYoung } from "./teen";

const NOW = new Date(2026, 10, 13).getTime();

describe("teen-safe defaults", () => {
  it("nobody under 13 sets the app up; an empty age is fine", () => {
    expect(MIN_AGE).toBe(13);
    expect(tooYoung("12")).toBe(true);
    expect(tooYoung("13")).toBe(false);
    expect(tooYoung("")).toBe(false);
    expect(tooYoung(40)).toBe(false);
  });

  it("body composition is off for under 18s until they turn it on", () => {
    expect(ageOf(2010, NOW)).toBe(16);
    expect(isTeen({ birthYear: 2010 }, NOW)).toBe(true);
    expect(isTeen({ birthYear: 2008 }, NOW)).toBe(false);
    expect(isTeen({}, NOW)).toBe(false);
    expect(bodyCompOn({ birthYear: 2010 }, NOW)).toBe(false);
    expect(bodyCompOn({ birthYear: 2010, bodyComp: true }, NOW)).toBe(true);
    expect(bodyCompOn({ birthYear: 1990 }, NOW)).toBe(true);
  });
});
