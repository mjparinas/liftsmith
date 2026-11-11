// @vitest-environment jsdom
// Reading the health twin's daily values (health.ts readDaily). Health Connect pages oldest first and the plugin
// stops at its limit, so one 45-day read of a ring that writes HRV every few minutes overnight kept only the
// oldest weeks, and the HRV tile said "not connected" with Oura data sitting in Health Connect (Melvin, 2026-11-11).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { localDayKey, readDaily, weekWindows } from "./health";

const DAY = 86_400_000;
const NOW = Date.parse("2026-11-11T12:00:00Z");

// HRV every 5 minutes from 00:00 to 07:00 UTC, every night for 45 days: 84 a night, about 3,800 in all.
const HRV = (() => {
  const out: { value: number; startDate: string; endDate: string }[] = [];
  for (let d = 45; d >= 0; d--) {
    const night = Date.parse(new Date(NOW - d * DAY).toISOString().slice(0, 10) + "T00:00:00Z");
    for (let m = 0; m < 7 * 60; m += 5) {
      const at = new Date(night + m * 60_000).toISOString();
      if (Date.parse(at) <= NOW) out.push({ value: 40 + (d % 7), startDate: at, endDate: at });
    }
  }
  return out;
})();

// Like Health Connect: oldest first within the range, cut at the limit.
const readSamples = vi.fn(async (o: { dataType: string; startDate: string; endDate?: string; limit: number }) => {
  if (o.dataType !== "heartRateVariability") return { samples: [] };
  const a = Date.parse(o.startDate);
  const b = o.endDate ? Date.parse(o.endDate) : NOW;
  return { samples: HRV.filter((s) => Date.parse(s.startDate) >= a && Date.parse(s.startDate) < b).slice(0, o.limit) };
});
vi.mock("@capgo/capacitor-health", () => ({
  Health: { isAvailable: async () => ({ available: true }), readSamples, queryAggregated: async () => ({ samples: [] }) },
}));

beforeEach(() => {
  (window as unknown as { Capacitor: unknown }).Capacitor = { isNativePlatform: () => true, getPlatform: () => "android" };
});
afterEach(() => {
  delete (window as unknown as { Capacitor?: unknown }).Capacitor;
});

describe("reading daily health values", () => {
  it("brings in last night's HRV even when a ring wrote thousands of samples", async () => {
    const r = await readDaily(45, NOW);
    const hrv = r.filter((x) => x.metric === "hrv");
    expect(hrv.map((x) => x.day)).toContain(localDayKey(NOW));
    expect(hrv.length).toBeGreaterThanOrEqual(45);
  });

  it("splits the range into week windows that meet end to end", () => {
    const w = weekWindows(NOW - 45 * DAY, NOW);
    expect(w).toHaveLength(7);
    expect(w[0]![0]).toBe(new Date(NOW - 45 * DAY).toISOString());
    expect(w[w.length - 1]![1]).toBe(new Date(NOW).toISOString());
    for (let i = 1; i < w.length; i++) expect(w[i]![0]).toBe(w[i - 1]![1]);
  });
});
