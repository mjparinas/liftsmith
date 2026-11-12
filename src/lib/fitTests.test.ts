import { describe, expect, it } from "vitest";

import { DAY, nextId, NOW } from "@/test/factories";

import { cleanResult, nextGoal, reference, resultsOf, summarize, verdict } from "./fitTests";
import type { FitTestEvent } from "./types";

// Fitness tests (Melvin asked, 2026-11-11; docs/decisions/fitness-tests.md).

const r = (test: FitTestEvent["test"], value: number, at = NOW, eyes?: "open" | "closed"): FitTestEvent => ({
  type: "fitTest",
  id: nextId("ft"),
  at,
  test,
  value,
  ...(eyes ? { eyes } : {}),
});
const year = new Date(NOW).getFullYear();
const aged = (age: number, sex?: "male" | "female") => ({ birthYear: year - age, sex });

describe("references", () => {
  it("compares the dead hang with the one small adult study, by sex, and only for adult working ages", () => {
    expect(reference("hang", 35, "male")).toMatchObject({ source: "stepan", mean: 77.7 });
    expect(reference("hang", 35, "female")?.mean).toBe(44.4);
    expect(reference("hang", null, undefined)?.mean).toBe(61.1);
    expect(reference("hang", 75, "male")).toBeNull();
  });

  it("uses Springer's age group and eye setting for the one-leg stand, and needs an age", () => {
    const open = reference("balance", 65, "female", "open")!;
    expect(open).toMatchObject({ source: "springer", ages: [60, 69], mean: 30.4 });
    expect(open.low).toBeCloseTo(22.2);
    expect(open.high).toBeCloseTo(38.6);
    expect(reference("balance", 30, "male", "closed")?.mean).toBe(16.9);
    // Never above the test's 45-second limit.
    expect(reference("balance", 25, "female", "open")!.high).toBeLessThanOrEqual(45);
    expect(reference("balance", null, "male")).toBeNull();
  });

  it("has chair-stand references for 18 to 35 and 60 to 94 only", () => {
    expect(reference("chair", 25, undefined)).toMatchObject({ source: "lein", low: 30.3, high: 35.7 });
    expect(reference("chair", 45, "male")).toBeNull();
    expect(reference("chair", 72, "female")).toMatchObject({ source: "rikli", low: 10, high: 15, ages: [70, 74] });
    // Rikli and Jones split by sex, so older lifters need one.
    expect(reference("chair", 72, undefined)).toBeNull();
  });
});

describe("verdicts", () => {
  it("places a result against the typical range", () => {
    const ref = reference("chair", 72, "male")!; // 12 to 17
    expect(verdict("chair", 11, ref)).toBe("below");
    expect(verdict("chair", 12, ref)).toBe("typical");
    expect(verdict("chair", 17, ref)).toBe("typical");
    expect(verdict("chair", 18, ref)).toBe("above");
  });

  it("calls a full 45-second one-leg stand topped, whatever the age", () => {
    expect(verdict("balance", 45, reference("balance", 25, "male")!)).toBe("topped");
    expect(verdict("balance", 45, reference("balance", 85, "male")!)).toBe("topped");
  });
});

describe("summaries", () => {
  it("gives the last result, the best, the change and when to retest", () => {
    const events = [r("hang", 40, NOW - 60 * DAY), r("hang", 55, NOW - 30 * DAY), r("hang", 50, NOW - 10 * DAY)];
    const s = summarize(events, "hang", aged(35, "male"), NOW)!;
    expect(s).toMatchObject({ best: 55, change: -5, dueIn: 18, count: 3, verdict: "below", goal: 65 });
    expect(s.last.value).toBe(50);
    expect(summarize(events, "hang", aged(35, "male"), NOW + 20 * DAY)!.dueIn).toBeLessThanOrEqual(0);
    expect(summarize(events, "chair", aged(35), NOW)).toBeNull();
    // A result saved a moment after the screen's clock last ticked is still four weeks away, not 29 days.
    expect(summarize([r("hang", 40, NOW + 30_000)], "hang", aged(35), NOW)!.dueIn).toBe(28);
  });

  it("keeps eyes-open and eyes-closed one-leg stands apart, showing the newest setting", () => {
    const events = [r("balance", 45, NOW - 5 * DAY, "open"), r("balance", 12, NOW - DAY, "closed")];
    expect(resultsOf(events, "balance", "open")).toHaveLength(1);
    const s = summarize(events, "balance", aged(30, "female"), NOW)!;
    expect(s).toMatchObject({ eyes: "closed", best: 12, verdict: "typical" });
    expect(summarize(events, "balance", aged(30, "female"), NOW, "open")).toMatchObject({ verdict: "topped", goal: null });
  });

  it("aims a little past the best", () => {
    expect(nextGoal("hang", 52)).toBe(65);
    expect(nextGoal("chair", 14)).toBe(16);
    expect(nextGoal("balance", 31)).toBe(40);
    expect(nextGoal("balance", 43)).toBe(45);
  });
});

describe("cleanResult", () => {
  it("rounds and keeps only plausible results", () => {
    expect(cleanResult("hang", 52.4)).toBe(52);
    expect(cleanResult("hang", 0)).toBeNull();
    expect(cleanResult("balance", 46)).toBeNull();
    expect(cleanResult("chair", 0)).toBe(0);
    expect(cleanResult("chair", Number.NaN)).toBeNull();
  });
});
