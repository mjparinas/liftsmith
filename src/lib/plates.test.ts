import { describe, expect, it } from "vitest";

import { loadBar, nearestLoads, plateStyle } from "./plates";

// Loading the bar and drawing each plate (mutation run, 2026-11-13: the plate picture and some of the
// solver's tie rules weren't checked).

describe("loadBar", () => {
  it("uses only whole pairs, and ignores plates with no weight", () => {
    // Three 20s are one pair; a 0 kg "plate" is ignored.
    const r = loadBar(100, 20, [
      { weight: 20, count: 3 },
      { weight: 0, count: 10 },
    ]);
    expect(r).toEqual({ total: 60, perSide: [20], exact: false });
  });

  it("uses the fewest plates, heaviest first", () => {
    const plates = [
      { weight: 20, count: 2 },
      { weight: 10, count: 4 },
      { weight: 5, count: 8 },
    ];
    expect(loadBar(60, 20, plates).perSide).toEqual([20]);
    expect(loadBar(80, 20, plates).perSide).toEqual([20, 10]);
    expect(loadBar(70, 20, plates).perSide).toEqual([20, 5]);
  });

  it("picks the heavier first plate when two loadings use as many plates", () => {
    // 30 a side: 25 + 5 or 15 + 15, both two plates.
    const r = loadBar(80, 20, [
      { weight: 25, count: 2 },
      { weight: 15, count: 4 },
      { weight: 5, count: 2 },
    ]);
    expect(r.perSide).toEqual([25, 5]);
  });

  it("goes to the nearest load it can make, the lighter on a tie", () => {
    const fives = [{ weight: 5, count: 8 }];
    expect(loadBar(32, 20, fives)).toEqual({ total: 30, perSide: [5], exact: false }); // 30 is 2 away, 40 is 8
    expect(loadBar(35, 20, fives).total).toBe(30); // 30 and 40 are both 5 away
    expect(loadBar(38, 20, fives).total).toBe(40);
    expect(loadBar(40, 20, fives).exact).toBe(true);
    expect(loadBar(500, 20, fives).total).toBe(60); // everything on
    expect(loadBar(10, 20, fives)).toEqual({ total: 20, perSide: [], exact: true }); // never below the empty bar
  });
});

describe("nearestLoads", () => {
  const plates = [
    { weight: 10, count: 2 },
    { weight: 5, count: 2 },
  ];
  it("gives the nearest loads at or below and above a target", () => {
    expect(nearestLoads(35, 20, plates)).toEqual({ below: 30, above: 40 });
    expect(nearestLoads(40, 20, plates)).toEqual({ below: 40, above: 50 });
    expect(nearestLoads(50, 20, plates)).toEqual({ below: 50, above: null });
  });
});

describe("plateStyle", () => {
  it("gives each competition plate its colour and the ink that reads on it", () => {
    expect(plateStyle(25, "kg")).toMatchObject({ hue: "red", fill: "var(--plate-red)", text: "var(--plate-ink-light)" });
    expect(plateStyle(15, "kg")).toMatchObject({ hue: "yellow", text: "var(--plate-ink-dark)" });
    expect(plateStyle(45, "lb")).toMatchObject({ hue: "blue" });
  });

  it("draws black plates with their own rim and the rest with their fill", () => {
    expect(plateStyle(2.5, "kg")).toMatchObject({ hue: "black", rim: "var(--plate-rim-black)" });
    expect(plateStyle(20, "kg").rim).toBe("var(--plate-blue)");
  });

  it("colours an odd size like the nearest size below it, and anything tiny silver", () => {
    expect(plateStyle(12, "kg").hue).toBe("green"); // like 10
    expect(plateStyle(30, "kg").hue).toBe("red"); // like 25
    expect(plateStyle(0.25, "kg").hue).toBe("silver");
  });

  it("sizes plates by their weight in kilograms: taller up to 25 kg, three widths", () => {
    expect(plateStyle(25, "kg")).toMatchObject({ height: 100, width: 14 });
    expect(plateStyle(50, "kg").height).toBe(100);
    expect(plateStyle(0, "kg").height).toBe(34);
    expect(plateStyle(10, "kg")).toMatchObject({ height: 34 + Math.round(0.4 * 66), width: 11 });
    expect(plateStyle(15, "kg").width).toBe(14);
    expect(plateStyle(14.9, "kg").width).toBe(11);
    expect(plateStyle(5, "kg").width).toBe(11);
    expect(plateStyle(4.9, "kg").width).toBe(8);
    // 35 lb is 15.9 kg, 10 lb is 4.5 kg.
    expect(plateStyle(35, "lb").width).toBe(14);
    expect(plateStyle(10, "lb").width).toBe(8);
    expect(plateStyle(55, "lb").height).toBe(100);
    expect(plateStyle(25, "lb").height).toBe(34 + Math.round(((25 * 0.45359237) / 25) * 66));
  });
});
