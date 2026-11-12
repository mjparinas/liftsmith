import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { DAY, makeSet, NOW } from "@/test/factories";

import { decodeShare } from "./dashboard";
import { EXERCISES } from "./exercises";
import { decodeGym } from "./gymShare";
import { parseCsv, readImport } from "./importCsv";
import { loadBar, nearestLoads } from "./plates";
import { recovery } from "./recovery";
import { decodeRemix, encodeRemix } from "./remix";
import { decodeRoutine, encodeRoutine } from "./routineShare";
import { withLinks } from "./superset";
import { MUSCLES, type PlateStock } from "./types";
import { fromKg, toKg } from "./units";

// Property tests: rules that must hold for every input, not just the examples we thought of.
// fast-check tries a few hundred generated inputs per rule and, when one fails, shrinks it to the
// smallest input that still breaks the rule. Runs are seeded, so a failure repeats; the seed it
// prints reproduces it with fc.assert(..., { seed }).

const SEED = 20261109;
const run = <T extends unknown[]>(p: fc.IProperty<T>, numRuns = 200) => fc.assert(p, { seed: SEED, numRuns });

/** Plate sets like a real gym's: a few sizes from the usual kg or lb list, 0 to 8 of each. */
const plateSet = fc
  .subarray([25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 45, 35, 2.25], { minLength: 1, maxLength: 6 })
  .chain((sizes) => fc.tuple(...sizes.map((w) => fc.integer({ min: 0, max: 8 }).map((count): PlateStock => ({ weight: w, count })))));
const bar = fc.constantFrom(20, 15, 10, 45 * 0.45359237, 0);
const target = fc.double({ min: 0, max: 400, noNaN: true });

describe("plates", () => {
  it("the bar's total is the bar plus both sides, and never uses plates the gym doesn't own", () => {
    run(
      fc.property(plateSet, bar, target, (plates, b, t) => {
        const l = loadBar(t, b, plates);
        const side = l.perSide.reduce((s, w) => s + w, 0);
        expect(l.total).toBeCloseTo(Math.round(b * 100) / 100 + 2 * side, 6); // works in hundredths
        for (const p of plates) {
          const used = l.perSide.filter((w) => w === p.weight).length;
          expect(used * 2).toBeLessThanOrEqual(p.count);
        }
        expect([...l.perSide].sort((a, z) => z - a)).toEqual(l.perSide);
        if (l.exact) expect(l.total).toBeCloseTo(Math.max(t, b), 1);
      }),
    );
  });

  it("any weight it says is loadable, it can load exactly", () => {
    run(
      fc.property(plateSet, bar, target, (plates, b, t) => {
        const { below, above } = nearestLoads(t, b, plates);
        expect(loadBar(below, b, plates).exact).toBe(true);
        if (above !== null) {
          expect(above).toBeGreaterThan(t);
          expect(loadBar(above, b, plates).exact).toBe(true);
        }
      }),
      100,
    );
  });
});

describe("recovery", () => {
  const set = fc.record({
    exerciseId: fc.constantFrom(...EXERCISES.map((e) => e.id)),
    hoursAgo: fc.double({ min: 0, max: 24 * 10, noNaN: true }),
    rir: fc.integer({ min: 0, max: 5 }),
  });
  const toEvent = (s: { exerciseId: string; hoursAgo: number; rir: number }) =>
    makeSet({ exerciseId: s.exerciseId, at: NOW - s.hoursAgo * 3600_000, rir: s.rir });

  it("every muscle stays between 0 and 100%", () => {
    run(
      fc.property(fc.array(set, { maxLength: 60 }), (sets) => {
        const r = recovery(sets.map(toEvent), NOW);
        for (const m of MUSCLES) {
          expect(r[m]).toBeGreaterThanOrEqual(0);
          expect(r[m]).toBeLessThanOrEqual(100);
        }
      }),
    );
  });

  it("one more set never makes any muscle more recovered, and time never makes it less", () => {
    run(
      fc.property(fc.array(set, { maxLength: 30 }), set, (sets, extra) => {
        const events = sets.map(toEvent);
        const before = recovery(events, NOW);
        const after = recovery([...events, toEvent(extra)], NOW);
        const later = recovery(events, NOW + DAY);
        for (const m of MUSCLES) {
          expect(after[m]).toBeLessThanOrEqual(before[m]);
          expect(later[m]).toBeGreaterThanOrEqual(before[m]);
        }
      }),
    );
  });
});

describe("units", () => {
  it("kg to lb and back gives the same number", () => {
    run(
      fc.property(fc.double({ min: 0, max: 2000, noNaN: true }), fc.constantFrom("kg" as const, "lb" as const), (x, u) => {
        expect(fromKg(toKg(x, u), u)).toBeCloseTo(x, 6);
      }),
    );
  });
});

describe("links and files from outside never crash the app", () => {
  it("remix links: junk gives a list, never an error", () => {
    run(
      fc.property(fc.string({ unit: "binary", maxLength: 300 }), (s) => {
        expect(Array.isArray(decodeRemix(s))).toBe(true);
      }),
      500,
    );
    run(
      fc.property(fc.array(fc.string({ maxLength: 20 }), { maxLength: 30 }), (parts) => {
        expect(Array.isArray(decodeRemix(["1", ...parts].join("~")))).toBe(true);
      }),
      300,
    );
  });

  it("gym links: junk opens nothing or a gym, never an error", () => {
    run(
      fc.property(fc.string({ unit: "binary", maxLength: 300 }), (s) => {
        const g = decodeGym(s);
        expect(g === null || g.unit === "kg" || g.unit === "lb").toBe(true);
      }),
      500,
    );
    run(
      fc.property(fc.jsonValue({ maxDepth: 3 }), (v) => {
        let bin = "";
        for (const b of new TextEncoder().encode(JSON.stringify(v) ?? "null")) bin += String.fromCharCode(b);
        const g = decodeGym(`g1~${btoa(bin)}`);
        expect(g === null || (Array.isArray(g.equipment) && Array.isArray(g.plates))).toBe(true);
      }),
      300,
    );
  });

  it("routine links: junk opens nothing or a routine, never an error", () => {
    run(
      fc.property(fc.string({ unit: "binary", maxLength: 300 }), (s) => {
        const r = decodeRoutine(s);
        expect(r === null || r.items.length > 0).toBe(true);
      }),
      500,
    );
    run(
      fc.property(fc.array(fc.string({ maxLength: 20 }), { maxLength: 30 }), (parts) => {
        const r = decodeRoutine(["r1", ...parts].join("~"));
        expect(r === null || r.items.length > 0).toBe(true);
      }),
      300,
    );
  });

  it("routine links round-trip every valid routine", () => {
    const routine = fc.record({
      name: fc.string({ unit: "grapheme", minLength: 1, maxLength: 40 }).filter((n) => n.trim() === n && !/[\u0000-\u001f\u007f]/.test(n)),
      items: fc.array(fc.record({ exerciseId: fc.constantFrom(...EXERCISES.map((e) => e.id)), sets: fc.integer({ min: 1, max: 10 }) }), {
        minLength: 1,
        maxLength: 20,
      }),
      links: fc.array(fc.boolean(), { maxLength: 19 }),
    });
    run(
      fc.property(routine, ({ name, items, links }) => {
        const linked = withLinks(items, links);
        const back = decodeRoutine(encodeRoutine({ name, items: linked }))!;
        expect(back.items).toEqual(linked);
        expect(back.name).toBe(name.slice(0, 40));
      }),
    );
  });

  it("remix links round-trip every valid workout", () => {
    const item = fc.record({
      exerciseId: fc.constantFrom(...EXERCISES.map((e) => e.id)),
      sets: fc.integer({ min: 1, max: 10 }),
      restSec: fc.integer({ min: 15, max: 600 }),
      target: fc.record({ reps: fc.integer({ min: 1, max: 120 }) }),
    });
    run(
      fc.property(fc.array(item, { maxLength: 20 }), (items) => {
        expect(decodeRemix(encodeRemix(items))).toEqual(
          items.map((i) => ({ exerciseId: i.exerciseId, sets: i.sets, reps: i.target.reps, restSec: i.restSec })),
        );
      }),
    );
  });

  it("share links: junk gives null or a valid card, never an error", () => {
    run(
      fc.property(fc.string({ unit: "binary", maxLength: 500 }), (s) => {
        expect(() => decodeShare(s)).not.toThrow();
      }),
      500,
    );
    const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
    run(
      fc.property(fc.jsonValue(), (v) => {
        expect(() => decodeShare(b64(v))).not.toThrow();
      }),
      500,
    );
    run(
      fc.property(fc.dictionary(fc.constantFrom("v", "n", "u", "xp", "w", "s", "d0", "t", "l", "d"), fc.jsonValue()), (v) => {
        expect(() => decodeShare(b64(v))).not.toThrow();
      }),
      500,
    );
  });

  it("CSV import: any text gives rows or null, never an error", () => {
    run(
      fc.property(fc.string({ unit: "binary", maxLength: 2000 }), (s) => {
        expect(Array.isArray(parseCsv(s))).toBe(true);
        expect(() => readImport(s)).not.toThrow();
      }),
      300,
    );
    const cell = fc.oneof(
      fc.string({ maxLength: 12 }),
      fc.integer().map(String),
      fc.constantFrom("", "2026-11-02 18:30:00", "kg", "lbs", "1,5"),
    );
    const header = fc.constant(["Date", "Workout Name", "Exercise Name", "Set Order", "Weight", "Reps", "Distance", "Seconds"]);
    run(
      fc.property(header, fc.array(fc.array(cell, { minLength: 8, maxLength: 8 }), { maxLength: 20 }), (h, rows) => {
        const text = [h, ...rows].map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(",")).join("\n");
        expect(() => readImport(text)).not.toThrow();
      }),
      300,
    );
  });
});
