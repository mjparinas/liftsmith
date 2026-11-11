// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultProfile } from "./defaults";
import { insights } from "./insights";
import { fromCm, lengthUnit, measureSummary, toCm } from "./measure";
import { useApp } from "./store";
import type { AppEvent, MeasureEvent, Profile } from "./types";

// Body measurements (competitor gaps, Melvin 2026-11-11).

const D = 86_400_000;
const W = 7 * D;
const NOW = new Date("2026-11-11T18:00:00").getTime();
const base: Profile = { ...defaultProfile(NOW - 2 * W), onboarded: true, bodyweight: 80 };
let n = 0;
const m = (at: number, cm: number, site: MeasureEvent["site"] = "waist"): MeasureEvent => ({
  type: "measure",
  id: `m${n++}`,
  at,
  site,
  cm,
});

describe("measurements", () => {
  it("shows inches for pound users and round-trips", () => {
    expect(lengthUnit("lb")).toBe("in");
    expect(lengthUnit("kg")).toBe("cm");
    expect(fromCm(2.54, "lb")).toBeCloseTo(1);
    expect(toCm(fromCm(87.3, "lb"), "lb")).toBeCloseTo(87.3);
    expect(fromCm(87.3, "kg")).toBe(87.3);
  });

  it("gives each site's latest number and its change since the first", () => {
    const s = measureSummary([m(NOW - 3 * W, 90), m(NOW - W, 88), m(NOW - 2 * W, 36, "arm")]);
    expect(s[0]).toMatchObject({ site: "waist", change: -2 });
    expect(s[0].last.cm).toBe(88);
    expect(s[1]).toMatchObject({ site: "arm", change: undefined });
  });
});

describe("waist notes", () => {
  const waist = (cms: number[]): AppEvent[] => cms.map((cm, i) => m(NOW - (cms.length - 1 - i) * W, cm));

  it("warns when the waist grows 2 cm or more over a few weeks", () => {
    const note = insights({ events: waist([84, 85, 86, 87]), profile: base, now: NOW }).find((x) => x.id.startsWith("waist-up"));
    expect(note?.tone).toBe("warn");
    expect(note?.why).toMatch(/3 cm/);
  });

  it("speaks in inches for pound users", () => {
    const note = insights({ events: waist([84, 85, 86, 87]), profile: { ...base, unit: "lb" }, now: NOW }).find((x) =>
      x.id.startsWith("waist-up"),
    );
    expect(note?.why).toMatch(/1\.2 in/);
  });

  it("praises a shrinking waist, and says nothing for small changes or too few readings", () => {
    expect(insights({ events: waist([90, 89, 88, 87]), profile: base, now: NOW }).some((x) => x.id.startsWith("waist-down"))).toBe(true);
    expect(insights({ events: waist([85, 85.5, 85, 86]), profile: base, now: NOW }).some((x) => x.id.startsWith("waist"))).toBe(false);
    expect(insights({ events: waist([84, 88]), profile: base, now: NOW }).some((x) => x.id.startsWith("waist"))).toBe(false);
  });
});

describe("logging a measurement", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    localStorage.clear();
    await useApp.getState().reset();
  });
  afterEach(() => vi.useRealTimers());

  it("saves a reading to the event log, rounded to a millimetre, and refuses nonsense", () => {
    useApp.getState().logMeasure("waist", 86.43);
    useApp.getState().logMeasure("waist", 3);
    const logged = useApp.getState().events.filter((e) => e.type === "measure");
    expect(logged).toHaveLength(1);
    expect(logged[0]).toMatchObject({ site: "waist", cm: 86.4 });
  });
});
