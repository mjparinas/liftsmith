import { describe, expect, it } from "vitest";

import { makeSet, NOW } from "@/test/factories";

import { t } from "./i18n";
import { bandOf, BANDS, recovery } from "./recovery";
import type { AppEvent } from "./types";

// The recovery map's numbers: how much one set takes out of each muscle and how fast it comes back
// (mutation run, 2026-11-13: only checked loosely through other features before).

const H = 3600_000;
const bench = (hoursAgo: number, rir = 2) => makeSet({ exerciseId: "bench-press", rir, at: NOW - hoursAgo * H });
const curl = (hoursAgo: number) => makeSet({ exerciseId: "barbell-curl", rir: 2, at: NOW - hoursAgo * H });

describe("recovery", () => {
  it("takes 13% from the main muscle of a hard set and half that from the helpers", () => {
    const r = recovery([bench(0)], NOW);
    expect(r.chest).toBe(87);
    expect(r.triceps).toBe(94); // 100 − 6.5, rounded
    expect(r.frontDelts).toBe(94);
    expect(r.quads).toBe(100);
  });

  it("counts sets left far from failure for less", () => {
    expect(recovery([bench(0, 2)], NOW).chest).toBe(87);
    expect(recovery([bench(0, 3)], NOW).chest).toBe(90); // 13 × 0.8
    expect(recovery([bench(0, 4)], NOW).chest).toBe(92); // 13 × 0.6
    expect(recovery([bench(0, 5)], NOW).chest).toBe(92);
  });

  it("brings back 90% in 72 hours for big muscles and 48 hours for small ones", () => {
    // Ten sets take 100%: 90% of it is back after 72 h (chest) or 48 h (biceps).
    const tenBench = (h: number) =>
      recovery(
        Array.from({ length: 10 }, () => bench(h)),
        NOW,
      ).chest;
    const tenCurl = (h: number) =>
      recovery(
        Array.from({ length: 10 }, () => curl(h)),
        NOW,
      ).biceps;
    expect(tenBench(72)).toBe(87);
    expect(tenCurl(48)).toBe(87);
    // A big muscle comes back slower than a small one.
    expect(tenBench(48)).toBe(72); // 100 − 130 × 10^(−2/3)
    expect(tenBench(24)).toBe(40);
    expect(tenCurl(24)).toBe(59);
  });

  it("lets the helper muscles recover over time too, and counts easy sets less for them", () => {
    // Ten sets two days ago: the triceps (small) got 65% and are mostly back.
    const ten = Array.from({ length: 10 }, () => bench(48));
    expect(recovery(ten, NOW).triceps).toBe(94); // 100 − 65 × 0.1
    expect(recovery([bench(0, 3)], NOW).triceps).toBe(95); // 100 − 6.5 × 0.8
  });

  it("counts a set from exactly seven days ago, and not one an hour older", () => {
    const at = (h: number) => Array.from({ length: 40 }, () => bench(h));
    expect(recovery(at(7 * 24), NOW).chest).toBe(98);
    expect(recovery(at(7 * 24 + 1), NOW).chest).toBe(100);
  });

  it("never goes below 0 or above 100", () => {
    const many = Array.from({ length: 30 }, () => bench(0));
    expect(recovery(many, NOW).chest).toBe(0);
    expect(recovery([], NOW).chest).toBe(100);
  });

  it("only counts sets from the last 7 days and not after now", () => {
    expect(recovery([bench(7 * 24 + 1)], NOW).chest).toBe(100);
    expect(recovery([bench(7 * 24 - 1)], NOW).chest).toBe(100); // all but gone, but counted
    const thirty = Array.from({ length: 30 }, () => bench(7 * 24 - 1));
    expect(recovery(thirty, NOW).chest).toBeLessThan(100);
    expect(recovery([bench(-1)], NOW).chest).toBe(100);
  });

  it("ignores events that aren't sets and exercises it doesn't know", () => {
    const start: AppEvent = { type: "sessionStart", id: "st", at: NOW, sessionId: "s1", gymId: "g1", minutes: 45 };
    expect(recovery([start, makeSet({ exerciseId: "no-such-lift", at: NOW })], NOW).chest).toBe(100);
  });
});

describe("bandOf", () => {
  it("puts each percentage in its band, with the line itself in the higher band", () => {
    expect([100, 90, 89, 70, 69, 40, 39, 0].map((r) => bandOf(r).band)).toEqual([
      "fresh",
      "fresh",
      "ready",
      "ready",
      "recovering",
      "recovering",
      "fatigued",
      "fatigued",
    ]);
    expect(bandOf(-5).band).toBe("fatigued");
  });

  it("names and explains every band in the app's language", () => {
    for (const b of BANDS) {
      expect(b.label).toBe(t(`band.${b.band}`));
      expect(b.hint).toBe(t(`band.${b.band}.hint`));
    }
    expect(BANDS.map((b) => b.colour)).toEqual([
      "var(--band-fresh)",
      "var(--band-ready)",
      "var(--band-recovering)",
      "var(--band-fatigued)",
    ]);
  });
});
