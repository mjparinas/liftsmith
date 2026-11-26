import { describe, expect, it } from "vitest";

import { cueId, SETTLE_MS, START_REPS, startsEarly, watchingRest, withCarry } from "./watchAuto";

describe("hands-free watch sets", () => {
  it("ignores the first part of rest", () => {
    expect(watchingRest(undefined, 100_000)).toBe(false);
    expect(watchingRest(100_000, 100_000 + SETTLE_MS - 1)).toBe(false);
    expect(watchingRest(100_000, 100_000 + SETTLE_MS)).toBe(true);
  });

  it("needs three reps in rest before the set starts", () => {
    expect(START_REPS).toBe(3);
    expect(startsEarly(0)).toBe(false);
    expect(startsEarly(2)).toBe(false);
    expect(startsEarly(3)).toBe(true);
    expect(startsEarly(5)).toBe(true);
  });

  it("carries the reps from rest into the set they started, and only that set", () => {
    expect(withCarry(null, "1:2", 4)).toBe(4);
    expect(withCarry({ key: "1:2", n: 3 }, "1:2", 0)).toBe(3);
    expect(withCarry({ key: "1:2", n: 3 }, "1:2", 5)).toBe(8);
    expect(withCarry({ key: "1:2", n: 3 }, "1:3", 5)).toBe(5);
  });

  it("gives every cue its own id", () => {
    expect(cueId("go", 1)).toBe("go:1");
    expect(cueId("logged", 1)).not.toBe(cueId("go", 1));
    expect(cueId("logged", 2)).not.toBe(cueId("logged", 1));
  });
});
