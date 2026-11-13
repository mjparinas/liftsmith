import { describe, expect, it } from "vitest";

import { DAY, makeProfile, makeSessionStart, makeSet, makeTestGym, NOW } from "@/test/factories";

import { EXERCISE_BY_ID } from "./exercises";
import { alternatives, avoided, generate, itemSeconds, planSeconds, restFor, setSeconds, weeklySets } from "./generator";
import { t } from "./i18n";
import type { Exercise, SwapEvent } from "./types";

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

const ex = (id: string): Exercise => {
  const e = EXERCISE_BY_ID.get(id);
  if (!e) throw new Error(`no exercise ${id}`);
  return e;
};

describe("restFor", () => {
  it("rests longest on loaded compounds, by goal, and least on bodyweight isolation work", () => {
    expect(restFor(ex("bench-press"), "strength")).toBe(180);
    expect(restFor(ex("bench-press"), "muscle")).toBe(120);
    expect(restFor(ex("db-fly"), "strength")).toBe(75);
    expect(restFor(ex("push-up"), "strength")).toBe(75);
    expect(restFor(ex("plank"), "muscle")).toBe(45);
  });

  it("uses the lifter's own rest for the exercise, then for its kind", () => {
    const training = { rest: { compound: 150, isolation: 60 }, exercises: { "bench-press": { rest: 200 } } };
    expect(restFor(ex("bench-press"), "muscle", training)).toBe(200);
    expect(restFor(ex("back-squat"), "muscle", training)).toBe(150);
    expect(restFor(ex("db-fly"), "muscle", training)).toBe(60);
  });
});

describe("timing", () => {
  it("gives a set 25 s plus 3.5 s a rep, and a hold its seconds plus 15", () => {
    expect(setSeconds(ex("bench-press"), 8)).toBe(53);
    expect(setSeconds(ex("db-shrug-hold"), 30)).toBe(45);
  });

  it("adds setup, warm-ups, working sets and the rests between them", () => {
    const item = { exerciseId: "bench-press", sets: 3, restSec: 120, target: { weight: 60, reps: 8, rir: 2, note: "" } };
    expect(itemSeconds(item)).toBe(60 + 3 * 53 + 2 * 120);
    const warm = { ...item, warmup: [{ weight: 20, reps: 10 }] };
    expect(itemSeconds(warm)).toBe(60 + (25 + 35 + 60) + 3 * 53 + 2 * 120);
    // The plan adds the rest before each exercise after the first.
    expect(planSeconds([item, item])).toBe(2 * itemSeconds(item) + 120);
  });
});

describe("weeklySets", () => {
  it("counts each set once for its main muscles and half for helpers, from the given moment", () => {
    const ev = [
      makeSet({ at: NOW, exerciseId: "bench-press" }),
      makeSet({ at: NOW - DAY, exerciseId: "bench-press" }),
      makeSet({ at: NOW, exerciseId: "nope" }),
    ];
    const w = weeklySets(ev, NOW - 1);
    expect(w.chest).toBe(1);
    expect(w.triceps).toBe(0.5);
    expect(weeklySets(ev, NOW - DAY).chest).toBe(2);
  });
});

describe("the day's call in the plan", () => {
  const gym = makeTestGym();
  const plan = (call: "normal" | "push" | "recover", challenge = false) =>
    generate({ gym, profile, events: [], minutes: 60, now: NOW, call, challenge });

  it("on a push day takes the first compound lift one rep closer to failure", () => {
    const normal = plan("normal");
    const push = plan("push");
    const first = normal.items.findIndex((i) => EXERCISE_BY_ID.get(i.exerciseId)!.compound);
    expect(push.items[first]!.exerciseId).toBe(normal.items[first]!.exerciseId);
    expect(push.items[first]!.target.rir).toBe(Math.max(0, normal.items[first]!.target.rir - 1));
    expect(push.items[first]!.target.note).toContain(t("note.push"));
    expect(push.challenge).toBe(false);
    expect(push.items.slice(first + 1).every((i, n) => i.target.rir === normal.items[first + 1 + n]!.target.rir)).toBe(true);
  });

  it("turns the first compound lift into a challenge only on a push day", () => {
    const ch = plan("push", true);
    expect(ch.challenge).toBe(true);
    expect(ch.items.filter((i) => i.challenge)).toHaveLength(1);
    expect(ch.items.find((i) => i.challenge)!.target.note).toBe(t("note.challenge"));
    expect(plan("normal", true).challenge).toBe(false);
  });

  it("on an easy day drops a step of load and a set from loaded lifts", () => {
    const normal = plan("normal");
    const easy = plan("recover");
    const lift = easy.items.find((i) => EXERCISE_BY_ID.get(i.exerciseId)!.load === "barbell")!;
    const before = normal.items.find((i) => i.exerciseId === lift.exerciseId)!;
    expect(lift.target.weight).toBeLessThan(before.target.weight);
    expect(lift.target.rir).toBe(before.target.rir + 1);
    expect(lift.target.note).toBe(t("note.easyLighter"));
    expect(easy.items.every((i) => i.sets >= 2)).toBe(true);
  });

  it("puts loaded compounds first and core and carries last", () => {
    const rank = (id: string) => {
      const e = EXERCISE_BY_ID.get(id)!;
      return e.pattern === "core" || e.pattern === "carry" ? 3 : e.compound ? (e.load === "bodyweight" ? 1 : 0) : 2;
    };
    for (const minutes of [30, 60, 90]) {
      const ranks = generate({ gym, profile, events: [], minutes, now: NOW }).items.map((i) => rank(i.exerciseId));
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    }
  });

  it("gives a deload week fewer sets", () => {
    const build = Math.min(6, Math.max(3, profile.blockWeeks));
    const deload = { ...profile, blockStart: NOW - build * 7 * DAY - DAY };
    const normal = generate({ gym, profile, events: [], minutes: 60, now: NOW });
    const light = generate({ gym, profile: deload, events: [], minutes: 60, now: NOW });
    const sets = (p: typeof normal) => p.items.reduce((n, i) => n + i.sets, 0) / p.items.length;
    expect(sets(light)).toBeLessThan(sets(normal));
    expect(light.week.deload).toBe(true);
  });
});

describe("alternatives", () => {
  it("offers exercises for the same main muscles, closest match first, never the same one", () => {
    const alts = alternatives("bench-press", makeTestGym());
    expect(alts.length).toBeGreaterThan(3);
    expect(alts.map((e) => e.id)).not.toContain("bench-press");
    expect(alts.every((e) => e.primary.includes("chest"))).toBe(true);
    expect(alts.every((e) => !e.cardio)).toBe(true);
    // A pressing compound beats an isolation fly.
    const ids = alts.map((e) => e.id);
    expect(ids.indexOf("db-bench-press")).toBeLessThan(ids.indexOf("db-fly"));
  });

  it("leaves out skipped exercises and ones the gym can't do, and knows nothing about unknown ids", () => {
    expect(alternatives("bench-press", makeTestGym(), ["db-bench-press"]).map((e) => e.id)).not.toContain("db-bench-press");
    expect(alternatives("bench-press", makeTestGym("bodyweight")).every((e) => e.load === "bodyweight")).toBe(true);
    expect(alternatives("no-such-lift", makeTestGym())).toEqual([]);
    expect(alternatives("bench-press", null).length).toBeGreaterThanOrEqual(alternatives("bench-press", makeTestGym()).length);
  });
});
