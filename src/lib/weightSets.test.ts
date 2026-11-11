import { describe, expect, it } from "vitest";

import { cleanWeights, stepRange, toggleWeight, usualStep, weightPresets } from "./weightSets";

describe("dumbbell and kettlebell sets", () => {
  it("fills a range with both ends and no float noise", () => {
    expect(stepRange(2.5, 10, 2.5)).toEqual([2.5, 5, 7.5, 10]);
    expect(stepRange(1.1, 1.5, 0.1)).toEqual([1.1, 1.2, 1.3, 1.4, 1.5]);
    expect(stepRange(2, 7, 2)).toEqual([2, 4, 6]);
  });

  it("gives nothing for a bad range and caps a huge one", () => {
    expect(stepRange(10, 2, 2)).toEqual([]);
    expect(stepRange(0, 10, 2)).toEqual([]);
    expect(stepRange(2, 10, 0)).toEqual([]);
    expect(stepRange(1, 1000, 0.5)).toHaveLength(200);
  });

  it("toggles one weight in and out, kept sorted", () => {
    expect(toggleWeight([2, 6], 4)).toEqual([2, 4, 6]);
    expect(toggleWeight([2, 4, 6], 4)).toEqual([2, 6]);
    expect(cleanWeights([6, 2, 2, 0, -1, 4])).toEqual([2, 4, 6]);
  });

  it("finds the usual jump, falling back to the unit's default", () => {
    expect(usualStep([2, 4, 6, 8, 10, 12.5], "kg")).toBe(2);
    expect(usualStep([], "kg")).toBe(2);
    expect(usualStep([20], "lb")).toBe(5);
  });

  it("offers adjustable dumbbells in both units", () => {
    expect(
      weightPresets("dumbbells", "kg")
        .find((p) => p.id === "adjustable")
        ?.weights.at(-1),
    ).toBe(24);
    expect(
      weightPresets("dumbbells", "lb")
        .find((p) => p.id === "adjustable")
        ?.weights.at(-1),
    ).toBe(52.5);
    expect(weightPresets("kettlebells", "kg")[0]?.weights).toEqual([8, 12, 16, 20, 24, 28, 32]);
  });
});
