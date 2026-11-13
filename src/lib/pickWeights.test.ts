import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { DAY, makeProfile, makeSet, makeTestGym, NOW } from "@/test/factories";

import { EXERCISE_BY_ID, EXERCISES } from "./exercises";
import { generate } from "./generator";
import {
  BASE,
  buildWeights,
  CACHE_KEY,
  COMMON,
  draw,
  fade,
  FLOOR,
  LIKE,
  pickWeights,
  popularity,
  STAPLE,
  SWAP_AWAY,
  SWAP_FORGET,
  SWAP_HALF_LIFE,
  SWAP_IN,
  SWAP_IN_MAX,
  SwapCache,
  tasteSwaps,
  type CacheStore,
  type TasteSwap,
} from "./pickWeights";
import { resetPick } from "./training";
import type { AppEvent, SwapEvent, TrainingPrefs } from "./types";

// Per-lifter pick weights (Melvin, 2026-11-13): popular lifts are picked most, likes raise an exercise,
// swaps lower it, and none of it can bring back an exercise a hard filter took out.

let n = 0;
const swap = (from: string, to: string, at = NOW, avoid = false): SwapEvent => ({
  type: "swap",
  id: `sw${++n}`,
  at,
  sessionId: "s1",
  from,
  to,
  avoid,
});
const ts = (from: string, to: string, at = NOW): TasteSwap => ({ from, to, at });

class MapStore implements CacheStore {
  map = new Map<string, string>();
  writes = 0;
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.writes++;
    this.map.set(k, v);
  }
}

describe("popularity", () => {
  it("knows every listed id, and no id is in both lists", () => {
    for (const id of [...STAPLE, ...COMMON]) expect(EXERCISE_BY_ID.has(id), id).toBe(true);
    for (const id of STAPLE) expect(COMMON.has(id), id).toBe(false);
  });

  it("puts the lifts most people program among the staples", () => {
    for (const id of ["bench-press", "db-bench-press", "back-squat", "deadlift", "sumo-deadlift", "barbell-row", "overhead-press"])
      expect(popularity(id), id).toBe("staple");
    for (const id of ["db-curl", "db-concentration-curl", "pinwheel-curl", "barbell-shrug", "walking-lunge", "seated-barbell-press"])
      expect(popularity(id), id).toBe("staple");
    expect(popularity("db-fly")).toBe("common");
    expect(popularity("kb-windmill")).toBe("niche");
    expect(popularity("no-such-lift")).toBe("niche");
  });

  it("starts staples highest and niche moves far lower", () => {
    expect(BASE.staple).toBe(1);
    expect(BASE.common).toBeLessThan(BASE.staple);
    expect(BASE.niche).toBeLessThan(BASE.common / 10);
    const w = buildWeights([], undefined, NOW);
    expect(w.weight("bench-press")).toBe(BASE.staple);
    expect(w.weight("db-fly")).toBe(BASE.common);
    expect(w.weight("kb-windmill")).toBe(BASE.niche);
  });

  it("leaves most exercises niche, so the library can grow without crowding the staples", () => {
    expect(STAPLE.size).toBeGreaterThan(50);
    expect(STAPLE.size + COMMON.size).toBeLessThan(EXERCISES.length / 2);
  });
});

describe("fade", () => {
  it("counts a new swap fully, half after the half-life, and not at all after a year", () => {
    expect(fade(0)).toBe(1);
    expect(fade(-DAY)).toBe(1);
    expect(fade(SWAP_HALF_LIFE)).toBeCloseTo(0.5, 10);
    expect(fade(2 * SWAP_HALF_LIFE)).toBeCloseTo(0.25, 10);
    expect(fade(SWAP_FORGET - 1)).toBeGreaterThan(0);
    expect(fade(SWAP_FORGET)).toBe(0);
    expect(fade(SWAP_FORGET + DAY)).toBe(0);
  });
});

describe("buildWeights", () => {
  it("treats a liked exercise as a staple and raises it by LIKE", () => {
    const w = buildWeights([], { favourites: ["db-fly"] }, NOW);
    expect(w.weight("db-fly")).toBeCloseTo(BASE.staple * LIKE, 10);
    expect(w.taste("db-fly")).toEqual({ liked: true, away: 0, into: 0, factor: LIKE });
    expect(w.taste("bench-press").liked).toBe(false);
  });

  it("lowers an exercise for each swap away and raises the one swapped in, within limits", () => {
    const one = buildWeights([ts("bench-press", "db-bench-press")], undefined, NOW);
    expect(one.weight("bench-press")).toBeCloseTo(SWAP_AWAY, 10);
    expect(one.weight("db-bench-press")).toBeCloseTo(SWAP_IN, 10);
    const two = buildWeights([ts("bench-press", "db-bench-press"), ts("bench-press", "db-bench-press")], undefined, NOW);
    expect(two.weight("bench-press")).toBeCloseTo(SWAP_AWAY ** 2, 10);
    expect(two.weight("db-bench-press")).toBeCloseTo(SWAP_IN ** 2, 10);
    expect(two.taste("bench-press").away).toBeCloseTo(2, 10);
    expect(two.taste("db-bench-press").into).toBeCloseTo(2, 10);
    const many = buildWeights(
      Array.from({ length: 30 }, () => ts("bench-press", "db-bench-press")),
      undefined,
      NOW,
    );
    expect(many.weight("bench-press")).toBeCloseTo(FLOOR, 10);
    expect(many.weight("db-bench-press")).toBeCloseTo(SWAP_IN_MAX, 10);
  });

  it("lets old swaps fade and forgets them after a year", () => {
    const half = buildWeights([ts("bench-press", "db-fly", NOW - SWAP_HALF_LIFE)], undefined, NOW);
    expect(half.taste("bench-press").away).toBeCloseTo(0.5, 10);
    expect(half.weight("bench-press")).toBeCloseTo(SWAP_AWAY ** 0.5, 10);
    const gone = buildWeights([ts("bench-press", "db-fly", NOW - SWAP_FORGET)], undefined, NOW);
    expect(gone.weight("bench-press")).toBe(1);
    expect(gone.weight("db-fly")).toBe(BASE.common);
    expect(gone.lowered()).toEqual([]);
  });

  it("combines a like with swaps", () => {
    const w = buildWeights([ts("db-fly", "cable-fly")], { favourites: ["db-fly"] }, NOW);
    expect(w.weight("db-fly")).toBeCloseTo(BASE.staple * LIKE * SWAP_AWAY, 10);
  });

  it("ignores swaps from before a reset, on that exercise only", () => {
    const swaps = [ts("bench-press", "db-fly", NOW - 2 * DAY), ts("bench-press", "db-fly", NOW - DAY)];
    const reset = resetPick(undefined, "bench-press", NOW - DAY - 1);
    const w = buildWeights(swaps, reset, NOW);
    expect(w.taste("bench-press").away).toBeCloseTo(fade(DAY), 10);
    expect(w.taste("db-fly").into).toBeCloseTo(fade(DAY) + fade(2 * DAY), 10);
    // A reset at the very moment of a swap forgets that swap too.
    expect(buildWeights([ts("bench-press", "db-fly", NOW)], resetPick(undefined, "bench-press", NOW), NOW).weight("bench-press")).toBe(1);
    // Resetting the one swapped in forgets its rise.
    expect(buildWeights(swaps, resetPick(undefined, "db-fly", NOW), NOW).weight("db-fly")).toBe(BASE.common);
  });

  it("lists exercises the swaps lowered, most lowered first, and not ones only nudged a little", () => {
    const w = buildWeights(
      [
        ts("bench-press", "db-fly"),
        ts("bench-press", "db-fly"),
        ts("back-squat", "leg-press"),
        ts("deadlift", "rack-pull", NOW - 3 * SWAP_HALF_LIFE),
      ],
      undefined,
      NOW,
    );
    // deadlift: one swap faded to 1/8, so 0.55^0.125 ≈ 0.93, which isn't worth listing.
    expect(w.lowered()).toEqual(["bench-press", "back-squat"]);
    // A tie goes by id.
    expect(buildWeights([ts("lat-pulldown", "db-fly"), ts("back-squat", "db-fly")], undefined, NOW).lowered()).toEqual([
      "back-squat",
      "lat-pulldown",
    ]);
    // A swap away that a like outweighs isn't listed.
    expect(buildWeights([ts("bench-press", "db-fly")], { favourites: ["bench-press"] }, NOW).lowered()).toEqual([]);
  });

  it("keeps every weight positive and never below the floor share of its popularity", () => {
    const ids = ["bench-press", "db-fly", "kb-windmill", "back-squat"];
    const id = fc.constantFrom(...ids);
    fc.assert(
      fc.property(
        fc.array(fc.record({ from: id, to: id, age: fc.integer({ min: -DAY, max: 2 * SWAP_FORGET }) }), { maxLength: 40 }),
        fc.subarray(ids),
        (raw, favourites) => {
          const w = buildWeights(
            raw.map((r) => ts(r.from, r.to, NOW - r.age)),
            { favourites },
            NOW,
          );
          for (const x of ids) {
            const base = favourites.includes(x) ? BASE.staple : BASE[popularity(x)];
            expect(w.weight(x)).toBeGreaterThanOrEqual(base * FLOOR - 1e-12);
            expect(w.weight(x)).toBeLessThanOrEqual(base * LIKE * SWAP_IN_MAX + 1e-12);
          }
        },
      ),
      { seed: 20261113 },
    );
  });
});

describe("tasteSwaps", () => {
  it("keeps plain swaps and leaves out not-available-here ones, swaps to itself and other events", () => {
    const ev: AppEvent[] = [
      swap("bench-press", "db-fly", NOW - DAY),
      swap("back-squat", "leg-press", NOW, true),
      swap("dip", "dip"),
      makeSet(),
    ];
    expect(tasteSwaps(ev)).toEqual([{ at: NOW - DAY, from: "bench-press", to: "db-fly" }]);
    expect(tasteSwaps(ev, 1)).toEqual([]);
    expect(tasteSwaps([makeSet(), swap("dip", "push-up")], 1)).toEqual([{ at: NOW, from: "dip", to: "push-up" }]);
  });
});

describe("SwapCache", () => {
  const log = (): AppEvent[] => [makeSet(), swap("bench-press", "db-fly"), makeSet()];

  it("reads the log once, then only what was added", () => {
    const store = new MapStore();
    const cache = new SwapCache(store);
    const a = log();
    expect(cache.swaps(a)).toHaveLength(1);
    expect(cache.scanned).toBe(3);
    expect(store.writes).toBe(1);
    // The same array again: nothing read, nothing written.
    expect(cache.swaps(a)).toHaveLength(1);
    expect(cache.scanned).toBe(0);
    expect(store.writes).toBe(1);
    // Two more events: only those are read.
    const b = [...a, swap("back-squat", "leg-press"), makeSet()];
    expect(cache.swaps(b).map((s) => s.from)).toEqual(["bench-press", "back-squat"]);
    expect(cache.scanned).toBe(2);
    expect(store.writes).toBe(2);
    // A copy of the same log reads nothing new and writes nothing.
    expect(cache.swaps([...b])).toHaveLength(2);
    expect(cache.scanned).toBe(0);
    expect(store.writes).toBe(2);
  });

  it("picks up where it left off after the app restarts", () => {
    const store = new MapStore();
    const a = log();
    new SwapCache(store).swaps(a);
    const saved = JSON.parse(store.getItem(CACHE_KEY)!) as { n: number; first: string; last: string };
    expect(saved).toMatchObject({ n: 3, first: a[0]!.id, last: a[2]!.id });
    const next = new SwapCache(store);
    expect(next.swaps([...a, swap("dip", "push-up")]).map((s) => s.from)).toEqual(["bench-press", "dip"]);
    expect(next.scanned).toBe(1);
  });

  it("reads everything again when the log changed underneath", () => {
    const store = new MapStore();
    const cache = new SwapCache(store);
    const a = log();
    cache.swaps(a);
    // Sync merged an older swap in at the start.
    const merged = [swap("deadlift", "rack-pull", NOW - DAY), ...a];
    expect(cache.swaps(merged).map((s) => s.from)).toEqual(["deadlift", "bench-press"]);
    expect(cache.scanned).toBe(4);
    // A workout was deleted: the log is shorter.
    const shorter = merged.slice(0, 2);
    expect(cache.swaps(shorter).map((s) => s.from)).toEqual(["deadlift"]);
    expect(cache.scanned).toBe(2);
    // Same length but a different last event.
    const swapped = [shorter[0]!, swap("dip", "push-up")];
    expect(cache.swaps(swapped).map((s) => s.from)).toEqual(["deadlift", "dip"]);
    expect(cache.scanned).toBe(2);
    // An empty log (signed out, erased).
    expect(cache.swaps([])).toEqual([]);
    expect(cache.swaps(log())).toHaveLength(1);
    expect(cache.scanned).toBe(3);
  });

  it("notices an array changed in place", () => {
    const cache = new SwapCache(new MapStore());
    const a = log();
    cache.swaps(a);
    a.push(swap("dip", "push-up"));
    expect(cache.swaps(a)).toHaveLength(2);
    expect(cache.scanned).toBe(1);
  });

  it("ignores a broken or foreign cache and works without storage", () => {
    const store = new MapStore();
    store.map.set(CACHE_KEY, "{not json");
    expect(new SwapCache(store).swaps(log())).toHaveLength(1);
    store.map.set(CACHE_KEY, JSON.stringify({ n: "3", swaps: [] }));
    const c = new SwapCache(store);
    expect(c.swaps(log())).toHaveLength(1);
    expect(c.scanned).toBe(3);
    store.map.set(CACHE_KEY, JSON.stringify({ n: 3, swaps: "x" }));
    expect(new SwapCache(store).swaps(log())).toHaveLength(1);
    const none = new SwapCache(undefined);
    expect(none.swaps(log())).toHaveLength(1);
    const full: CacheStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(new SwapCache(full).swaps(log())).toHaveLength(1);
  });

  it("a cache from another log with the same length isn't trusted", () => {
    const store = new MapStore();
    new SwapCache(store).swaps(log());
    const other = new SwapCache(store);
    expect(other.swaps(log())).toHaveLength(1);
    expect(other.scanned).toBe(3);
  });
});

describe("pickWeights", () => {
  it("reads swaps from the events and likes from the profile", () => {
    const w = pickWeights([swap("bench-press", "db-fly")], { training: { favourites: ["kb-windmill"] } }, NOW, new SwapCache(undefined));
    expect(w.weight("bench-press")).toBeCloseTo(SWAP_AWAY, 10);
    expect(w.weight("kb-windmill")).toBeCloseTo(BASE.staple * LIKE, 10);
  });
});

describe("draw", () => {
  const items = [
    { item: "a", w: 1 },
    { item: "b", w: 0 },
    { item: "c", w: 3 },
  ];
  it("draws in proportion to weight and never a zero weight", () => {
    expect(draw(items, 0)).toBe("a");
    expect(draw(items, 0.2499)).toBe("a");
    expect(draw(items, 0.25)).toBe("c");
    expect(draw(items, 0.9999)).toBe("c");
    expect(draw([{ item: "a", w: 2 }], 0.5)).toBe("a");
    expect(
      draw(
        [
          { item: "x", w: 0 },
          { item: "y", w: 5 },
        ],
        0,
      ),
    ).toBe("y");
  });
  it("treats negative weights as zero and falls back to the first item when nothing has weight", () => {
    expect(
      draw(
        [
          { item: "a", w: -5 },
          { item: "b", w: 1 },
        ],
        0,
      ),
    ).toBe("b");
    expect(
      draw(
        [
          { item: "a", w: 0 },
          { item: "b", w: 0 },
        ],
        0.7,
      ),
    ).toBe("a");
    expect(draw([], 0.5)).toBeUndefined();
  });
  it("lands on the last weighted item when rounding runs past the end", () => {
    expect(
      draw(
        [
          { item: "a", w: 1 },
          { item: "b", w: 1 },
          { item: "c", w: 0 },
        ],
        1,
      ),
    ).toBe("b");
  });
  it("matches the weights over many draws", () => {
    const counts = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 1000; i++) counts[draw(items, (i + 0.5) / 1000) as "a"]++;
    expect(counts).toEqual({ a: 250, b: 0, c: 750 });
  });
});

describe("the adaptive plan", () => {
  const days = 40;
  const plans = (gymPreset: Parameters<typeof makeTestGym>[0], training?: TrainingPrefs, events: AppEvent[] = []) => {
    const gym = makeTestGym(gymPreset);
    const profile = makeProfile({ activeGymId: gym.id, training });
    return Array.from({ length: days }, (_, d) =>
      generate({ gym, profile, events, minutes: 60, now: NOW + d * DAY, cache: new SwapCache(undefined) }),
    );
  };
  const share = (ps: ReturnType<typeof plans>, tier: string) => {
    const ids = ps.flatMap((p) => p.items.map((i) => i.exerciseId));
    return ids.filter((id) => popularity(id) === tier).length / ids.length;
  };
  const daysWith = (ps: ReturnType<typeof plans>, id: string) => ps.filter((p) => p.items.some((i) => i.exerciseId === id)).length;

  it("is mostly staples in a full gym, with niche moves rare", () => {
    const ps = plans("commercial");
    expect(share(ps, "staple")).toBeGreaterThan(0.5);
    expect(share(ps, "niche")).toBeLessThan(0.12);
  });

  it("picks a liked exercise far more often", () => {
    const before = daysWith(plans("commercial"), "db-fly");
    const after = daysWith(plans("commercial", { favourites: ["db-fly"] }), "db-fly");
    expect(after).toBeGreaterThan(before * 2);
    expect(after).toBeGreaterThan(days / 4);
  });

  it("picks an exercise less often after it was swapped away", () => {
    const events = [
      swap("bench-press", "db-bench-press", NOW - DAY),
      swap("bench-press", "db-bench-press", NOW - DAY),
      swap("bench-press", "db-bench-press", NOW - DAY),
    ];
    const before = daysWith(plans("commercial"), "bench-press");
    const after = daysWith(plans("commercial", undefined, events), "bench-press");
    expect(before).toBeGreaterThan(5);
    expect(after).toBeLessThan(before / 2);
  });

  it("never brings back an exercise a hard filter took out, however much it's liked", () => {
    // Not at a bodyweight gym: no barbell.
    const bw = plans("bodyweight", { favourites: ["bench-press", "back-squat"] });
    expect(bw.flatMap((p) => p.items).some((i) => i.exerciseId === "bench-press" || i.exerciseId === "back-squat")).toBe(false);
    // Marked not available at this gym (a broken machine), even when liked.
    const gym = makeTestGym("commercial");
    const profile = makeProfile({ activeGymId: gym.id, training: { favourites: ["leg-press"] } });
    const events: AppEvent[] = [
      { type: "sessionStart", id: "st1", at: NOW - DAY, sessionId: "s1", gymId: gym.id, minutes: 45 },
      swap("leg-press", "hack-squat", NOW - DAY, true),
    ];
    for (let d = 0; d < 10; d++) {
      const p = generate({ gym, profile, events, minutes: 60, now: NOW + d * DAY, cache: new SwapCache(undefined) });
      expect(p.items.some((i) => i.exerciseId === "leg-press")).toBe(false);
    }
  });
});
