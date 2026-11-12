import { describe, expect, it } from "vitest";

import { breathAt, breathPattern, clampCustom, patternCounts } from "./breathing";

describe("breathing guide", () => {
  it("is box breathing by default: in, hold, out, hold, 4 s each", () => {
    const box = breathPattern("box");
    expect(patternCounts(box)).toBe("4-4-4-4");
    expect(box.map((p) => p.step)).toEqual(["in", "hold", "out", "holdOut"]);
    expect(breathAt(box, 0)).toMatchObject({ step: "in", index: 0, p: 0, left: 4, size: 0 });
    expect(breathAt(box, 3.5)).toMatchObject({ step: "in", left: 1 });
    expect(breathAt(box, 4)).toMatchObject({ step: "hold", left: 4, size: 1, cycle: 0.25 });
    expect(breathAt(box, 10)).toMatchObject({ step: "out", size: 0.5 });
    expect(breathAt(box, 13)).toMatchObject({ step: "holdOut", size: 0 });
    expect(breathAt(box, 16)).toMatchObject({ step: "in", index: 0, p: 0 });
  });

  it("has the other patterns", () => {
    expect(patternCounts(breathPattern("relax"))).toBe("4-7-8");
    expect(patternCounts(breathPattern("slow"))).toBe("4-6");
    const sigh = breathPattern("sigh");
    expect(sigh.map((p) => p.step)).toEqual(["in", "sip", "out"]);
    // The first breath fills the lungs most of the way; the sip tops them up.
    expect(breathAt(sigh, 2).size).toBe(0.75);
    expect(breathAt(sigh, 3)).toMatchObject({ step: "out", size: 1 });
  });

  it("keeps the lifter's own pattern in range and leaves out holds of 0", () => {
    expect(clampCustom({ in: 0, hold: -3, out: 40, holdOut: 2.4 })).toEqual({ in: 1, hold: 0, out: 12, holdOut: 2 });
    expect(clampCustom(undefined)).toEqual({ in: 4, hold: 4, out: 4, holdOut: 4 });
    expect(patternCounts(breathPattern("custom", { in: 5, hold: 0, out: 7, holdOut: 0 }))).toBe("5-7");
  });

  it("never runs off the pattern, whatever the time", () => {
    const box = breathPattern("box");
    for (const s of [-1, 15.999999, 1e9, 0.1]) {
      const m = breathAt(box, s);
      expect(m.size).toBeGreaterThanOrEqual(0);
      expect(m.size).toBeLessThanOrEqual(1);
      expect(m.left).toBeGreaterThanOrEqual(1);
    }
  });
});
