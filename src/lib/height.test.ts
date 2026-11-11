import { describe, expect, it } from "vitest";

import { cmToFtIn, fmtHeight, ftInToCm } from "./units";

describe("height in feet and inches", () => {
  it("converts both ways, to the nearest inch", () => {
    expect(cmToFtIn(177.8)).toEqual({ ft: 5, inch: 10 });
    expect(cmToFtIn(182.5)).toEqual({ ft: 6, inch: 0 });
    expect(ftInToCm(5, 10)).toBe(177.8);
    for (let inches = 48; inches <= 90; inches++) {
      const { ft, inch } = cmToFtIn(ftInToCm(Math.floor(inches / 12), inches % 12));
      expect(ft * 12 + inch).toBe(inches);
    }
  });
  it("shows centimetres with kilograms and feet and inches with pounds", () => {
    expect(fmtHeight(177.4, "kg")).toBe("177 cm");
    expect(fmtHeight(177.8, "lb")).toBe("5′ 10″");
  });
});
