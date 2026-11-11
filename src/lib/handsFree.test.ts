import { describe, expect, it } from "vitest";

import { DONE_MS, msLeft, nextCount, PAUSE_MS, waitFor } from "./handsFree";

describe("hands-free sets", () => {
  it("waits a little once the planned reps are in, longer while short of them", () => {
    expect(waitFor(8, 8)).toBe(DONE_MS);
    expect(waitFor(9, 8)).toBe(DONE_MS);
    expect(waitFor(5, 8)).toBe(PAUSE_MS);
  });

  it("always waits the longer time on sets for as many reps as possible", () => {
    expect(waitFor(20, undefined)).toBe(PAUSE_MS);
  });

  it("counts down from the last rep, not the first", () => {
    let c = nextCount(null, "s1", 1, 0);
    c = nextCount(c, "s1", 2, 2000);
    c = nextCount(c, "s1", 2, 3000);
    expect(c).toEqual({ key: "s1", n: 2, at: 2000 });
    expect(msLeft(c, "s1", 2, 2000 + DONE_MS - 1)).toBe(1);
    expect(msLeft(c, "s1", 2, 2000 + DONE_MS)).toBe(0);
  });

  it("never logs before a rep is counted, or for another set", () => {
    expect(msLeft(null, "s1", 5, 99_999)).toBeNull();
    expect(nextCount(null, "s1", 0, 0)).toBeNull();
    const c = nextCount(null, "s1", 3, 0);
    expect(msLeft(c, "s2", 5, 99_999)).toBeNull();
  });

  it("starts fresh on the next set", () => {
    const c = nextCount({ key: "s1", n: 8, at: 0 }, "s2", 1, 5000);
    expect(c).toEqual({ key: "s2", n: 1, at: 5000 });
  });
});
