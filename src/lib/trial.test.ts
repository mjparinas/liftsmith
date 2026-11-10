// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { cacheFlags, flag, FLAG_CACHE_KEY, variant } from "./flags";
import { declineTrial, startTrial, trialDaysLeft } from "./trial";

// Pro trial offer at the end of setup (Melvin, 2026-11-09): 14 days, behind the trialDays flag.
const DAY = 86_400_000;
const NOW = new Date("2026-11-09T12:00:00Z").getTime();

describe("trialDays flag", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to 14 days", () => {
    expect(flag("trialDays")).toBe(14);
  });

  it("takes an allowed value from the server cache and ignores anything else", () => {
    cacheFlags({ trialDays: 7 });
    expect(flag("trialDays")).toBe(7);
    cacheFlags({ trialDays: 30, unknown: true });
    expect(flag("trialDays")).toBe(7);
    localStorage.setItem(FLAG_CACHE_KEY, "not json");
    expect(flag("trialDays")).toBe(14);
  });

  it("gives a device a stable A/B variant", () => {
    expect(variant("trialDays", "device-a")).toBe(variant("trialDays", "device-a"));
    const seen = new Set(Array.from({ length: 40 }, (_, i) => variant("trialDays", `d${i}`)));
    expect([...seen].sort((a, b) => a - b)).toEqual([7, 14]);
  });
});

describe("trial", () => {
  it("counts down the days left and ends", () => {
    const pro = startTrial("annual", 14, NOW);
    expect(pro).toMatchObject({ plan: "annual", trialDays: 14, trialStartedAt: NOW, offeredAt: NOW });
    expect(trialDaysLeft(pro, NOW)).toBe(14);
    expect(trialDaysLeft(pro, NOW + 13.5 * DAY)).toBe(1);
    expect(trialDaysLeft(pro, NOW + 14 * DAY)).toBeNull();
  });

  it("records a decline with no trial", () => {
    const pro = declineTrial(14, NOW);
    expect(pro.declinedAt).toBe(NOW);
    expect(trialDaysLeft(pro, NOW)).toBeNull();
    expect(trialDaysLeft(undefined, NOW)).toBeNull();
  });
});
