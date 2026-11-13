import { describe, expect, it } from "vitest";

import { DAY, makeProfile, makeSessionStart, makeTestGym, NOW } from "@/test/factories";

import { EXERCISE_BY_ID } from "./exercises";
import { avoided, generate, planSeconds } from "./generator";
import { t } from "./i18n";
import type { SwapEvent } from "./types";

// Parts of the daily plan the engine tests didn't reach (mutation run, 2026-11-13): exercises the
// lifter marked as not available at this gym, an easy day on bodyweight work, and trimming sets to
// fit the time asked for.

const profile = makeProfile();
const swap = (sessionId: string, from: string, at: number, avoid = true): SwapEvent => ({
  type: "swap",
  id: `swap-${sessionId}-${from}`,
  at,
  sessionId,
  from,
  to: "db-bench-press",
  avoid,
});

describe("avoided", () => {
  const start = (sessionId: string, gymId: string) => makeSessionStart({ sessionId, gymId, at: NOW - 3 * DAY });

  it("keeps exercises marked not available at this gym for two weeks", () => {
    const ev = [start("a", "g1"), swap("a", "bench-press", NOW - 3 * DAY)];
    expect([...avoided(ev, "g1", NOW)]).toEqual(["bench-press"]);
    expect(avoided([start("a", "g1"), swap("a", "bench-press", NOW - 14 * DAY + 60_000)], "g1", NOW).has("bench-press")).toBe(true);
    expect(avoided([start("a", "g1"), swap("a", "bench-press", NOW - 14 * DAY)], "g1", NOW).size).toBe(0);
  });

  it("ignores plain swaps and swaps at other gyms", () => {
    expect(avoided([start("a", "g1"), swap("a", "bench-press", NOW - DAY, false)], "g1", NOW).size).toBe(0);
    expect(avoided([start("a", "g2"), swap("a", "bench-press", NOW - DAY)], "g1", NOW).size).toBe(0);
    expect(avoided([swap("a", "bench-press", NOW - DAY)], "g1", NOW).size).toBe(0);
  });
});

describe("generate", () => {
  it("never plans an exercise marked not available at this gym", () => {
    const gym = makeTestGym();
    const before = generate({ gym, profile, events: [], minutes: 60, now: NOW });
    const first = before.items[0]!.exerciseId;
    const ev = [makeSessionStart({ sessionId: "a", gymId: gym.id, at: NOW - DAY }), swap("a", first, NOW - DAY)];
    const after = generate({ gym, profile, events: ev, minutes: 60, now: NOW });
    expect(after.items.map((i) => i.exerciseId)).not.toContain(first);
  });

  it("on an easy day, bodyweight work drops a set and two reps and sits further from failure", () => {
    const gym = makeTestGym("bodyweight");
    const normal = generate({ gym, profile, events: [], minutes: 45, now: NOW });
    const easy = generate({ gym, profile, events: [], minutes: 45, now: NOW, call: "recover" });
    const reps = normal.items.find((i) => EXERCISE_BY_ID.get(i.exerciseId)?.load === "bodyweight" && i.target.reps >= 8);
    expect(reps).toBeDefined();
    const same = easy.items.find((i) => i.exerciseId === reps!.exerciseId)!;
    expect(same.target.reps).toBe(Math.max(3, reps!.target.reps - 2));
    expect(same.target.rir).toBe(reps!.target.rir + 1);
    expect(same.target.note).toBe(t("note.easyReps"));
    expect(same.sets).toBeLessThanOrEqual(Math.max(2, reps!.sets - 1));
    expect(same.sets).toBeGreaterThanOrEqual(2);
  });

  it("fits the time asked for, and keeps at least two sets of each exercise", () => {
    const gym = makeTestGym();
    for (const minutes of [20, 30, 45, 60, 90]) {
      const plan = generate({ gym, profile, events: [], minutes, now: NOW });
      expect(plan.items.every((i) => i.sets >= 2)).toBe(true);
      if (plan.items.some((i) => i.sets > 2)) expect(planSeconds(plan.items)).toBeLessThanOrEqual(minutes * 60);
      expect(plan.estMinutes).toBe(Math.round(planSeconds(plan.items) / 60));
    }
  });
});
