import { describe, expect, it } from "vitest";

import { DAY, NOW } from "@/test/factories";

import { EXERCISE_BY_ID } from "./exercises";
import {
  activeThirty,
  isRestDay,
  nextTrainingDay,
  THIRTY_BY_ID,
  THIRTY_BY_SLUG,
  THIRTY_CHALLENGES,
  THIRTY_LEVELS,
  thirtyPath,
  thirtyPlan,
  thirtyRuns,
  thirtyToday,
  thirtyTotal,
} from "./thirtyDay";
import type { AppEvent } from "./types";

const squat = THIRTY_BY_ID.get("squat")!;
const join = (id: string, at: number, challenge = "squat", level: "beginner" | "intermediate" | "advanced" = "beginner"): AppEvent => ({
  type: "thirtyJoin",
  id,
  at,
  challenge,
  level,
});
const day = (id: string, joinId: string, n: number, at: number, amount = 10): AppEvent => ({
  type: "thirtyDay",
  id,
  at,
  joinId,
  day: n,
  amount,
});

describe("the challenges", () => {
  it("each has a unique id and slug, a page address people search, and real exercises at every level", () => {
    expect(new Set(THIRTY_CHALLENGES.map((c) => c.id)).size).toBe(THIRTY_CHALLENGES.length);
    expect(new Set(THIRTY_CHALLENGES.map((c) => c.slug)).size).toBe(THIRTY_CHALLENGES.length);
    for (const c of THIRTY_CHALLENGES) {
      expect(c.slug).toMatch(/^30-day-[a-z-]+-challenge$/);
      expect(thirtyPath(c)).toBe(`/challenges/${c.slug}/`);
      expect(THIRTY_BY_SLUG.get(c.slug)).toBe(c);
      for (const l of THIRTY_LEVELS) {
        expect(EXERCISE_BY_ID.has(c.levels[l].exercise), `${c.id} ${l}`).toBe(true);
        expect(c.levels[l].end).toBeGreaterThan(c.levels[l].start);
      }
      // Harder levels start and end higher.
      expect(c.levels.intermediate.end).toBeGreaterThan(c.levels.beginner.end);
      expect(c.levels.advanced.end).toBeGreaterThan(c.levels.intermediate.end);
    }
  });

  it("rests every fourth day, so day 30 is a training day", () => {
    expect([1, 2, 3, 4, 5, 8, 28, 29, 30].map(isRestDay)).toEqual([false, false, false, true, false, true, true, false, false]);
    expect(nextTrainingDay(3)).toBe(5);
    expect(nextTrainingDay(29)).toBe(30);
    expect(nextTrainingDay(30)).toBe(31);
  });
});

describe("thirtyPlan", () => {
  it("starts at the level's day 1, ends at its day 30 and never goes down", () => {
    for (const c of THIRTY_CHALLENGES)
      for (const l of THIRTY_LEVELS) {
        const plan = thirtyPlan(c, l);
        expect(plan).toHaveLength(30);
        expect(plan[0]!.amount).toBe(c.levels[l].start);
        expect(plan[29]!.amount).toBe(c.levels[l].end);
        const train = plan.filter((d) => !d.rest).map((d) => d.amount);
        expect(train).toEqual([...train].sort((a, b) => a - b));
        expect(plan.filter((d) => d.rest).every((d) => d.amount === 0)).toBe(true);
      }
  });

  it("rounds to numbers that read well on a calendar", () => {
    expect(thirtyPlan(squat, "advanced").every((d) => d.amount % 10 === 0)).toBe(true);
    expect(thirtyPlan(THIRTY_BY_ID.get("plank")!, "beginner").every((d) => d.amount % 5 === 0)).toBe(true);
  });

  it("adds up the whole month", () => {
    expect(thirtyTotal(squat, "beginner")).toBe(thirtyPlan(squat, "beginner").reduce((s, d) => s + d.amount, 0));
  });
});

describe("runs from events", () => {
  it("counts days in order, once each, and finishes on day 30", () => {
    const evs: AppEvent[] = [join("j", NOW), day("d1", "j", 1, NOW), day("d1b", "j", 1, NOW + 1000), day("d3", "j", 3, NOW + DAY)];
    const [run] = thirtyRuns(evs);
    // A second device logging day 1 again, and a day out of order, are both ignored.
    expect(run!.done.map((d) => d.day)).toEqual([1]);
    const all: AppEvent[] = [join("j", NOW)];
    let n = 0;
    for (let d = 1; d <= 30; d = nextTrainingDay(d)) all.push(day(`x${d}`, "j", d, NOW + ++n * DAY));
    const done = thirtyRuns(all)[0]!;
    expect(done.finishedAt).toBeDefined();
    expect(activeThirty(all)).toHaveLength(0);
  });

  it("joining a running challenge changes its level and keeps its days", () => {
    const evs = [join("j", NOW), day("d1", "j", 1, NOW), join("j2", NOW + DAY, "squat", "advanced")];
    const runs = thirtyRuns(evs);
    expect(runs).toHaveLength(1);
    expect(runs[0]!.level).toBe("advanced");
    expect(runs[0]!.done).toHaveLength(1);
  });

  it("leaving ends a run and later days don't count; joining again starts fresh", () => {
    const evs: AppEvent[] = [join("j", NOW), { type: "thirtyLeave", id: "l", at: NOW + 1, joinId: "j" }, day("d1", "j", 1, NOW + 2)];
    expect(thirtyRuns(evs)[0]!.leftAt).toBe(NOW + 1);
    expect(thirtyRuns(evs)[0]!.done).toHaveLength(0);
    const again = [...evs, join("j2", NOW + DAY)];
    expect(activeThirty(again).map((r) => r.id)).toEqual(["j2"]);
  });

  it("ignores unknown challenges and levels", () => {
    expect(thirtyRuns([join("j", NOW, "nope")])).toEqual([]);
  });
});

describe("thirtyToday", () => {
  const runAt = (evs: AppEvent[]) => thirtyRuns(evs)[0]!;

  it("day 1 is due the day you join", () => {
    expect(thirtyToday(runAt([join("j", NOW)]), NOW)).toEqual({ state: "due", day: 1, amount: 15 });
  });

  it("after a day is done it waits for tomorrow, then the next day is due", () => {
    const run = runAt([join("j", NOW), day("d1", "j", 1, NOW)]);
    expect(thirtyToday(run, NOW + 3600_000)).toMatchObject({ state: "doneToday", day: 1, nextDay: 2, restFirst: false });
    expect(thirtyToday(run, NOW + DAY)).toMatchObject({ state: "due", day: 2 });
  });

  it("a rest day takes a calendar day of its own", () => {
    const run = runAt([join("j", NOW), day("d1", "j", 1, NOW), day("d2", "j", 2, NOW + DAY), day("d3", "j", 3, NOW + 2 * DAY)]);
    expect(thirtyToday(run, NOW + 2 * DAY)).toMatchObject({ state: "doneToday", day: 3, nextDay: 5, restFirst: true });
    expect(thirtyToday(run, NOW + 3 * DAY)).toMatchObject({ state: "rest", day: 4, nextDay: 5 });
    expect(thirtyToday(run, NOW + 4 * DAY)).toMatchObject({ state: "due", day: 5 });
  });

  it("a missed day waits: a week away picks up on the next day, not the calendar's", () => {
    const run = runAt([join("j", NOW), day("d1", "j", 1, NOW)]);
    expect(thirtyToday(run, NOW + 7 * DAY)).toMatchObject({ state: "due", day: 2 });
  });
});
