import { describe, expect, it } from "vitest";

import { DAY, makeProfile, makeSet, makeTestGym, NOW } from "@/test/factories";

import { blockWeek } from "./block";
import { EXERCISE_BY_ID } from "./exercises";
import { t } from "./i18n";
import { ageFactor, repRange, target } from "./progression";
import type { AppEvent, FeedbackEvent, SetEvent } from "./types";

// Today's target for one exercise: double progression on loaded lifts, one more rep on bodyweight
// work, the lifter's "too hard" / "too easy" feedback, and the deload week (mutation run, 2026-11-13:
// bodyweight progression and the deload weight were never reached by a test).

const ex = (id: string) => {
  const e = EXERCISE_BY_ID.get(id);
  if (!e) throw new Error(`no exercise ${id}`);
  return e;
};
const gym = makeTestGym();
const profile = makeProfile({ goal: "muscle" }); // compound lifts 6 to 10 reps, bodyweight compounds 6 to 15
const build = Math.min(6, Math.max(3, profile.blockWeeks));
const deload = { ...profile, blockStart: NOW - build * 7 * DAY - DAY };

/** One session of `reps.length` sets of `exerciseId` at `weight`, aiming for `targetReps`, `daysAgo` days ago. */
function session(id: string, daysAgo: number, exerciseId: string, weight: number, targetReps: number, reps: number[]): SetEvent[] {
  return reps.map((r, i) => makeSet({ sessionId: id, exerciseId, weight, targetReps, reps: r, at: NOW - daysAgo * DAY + i * 60_000 }));
}
const rate = (sessionId: string, exerciseId: string, rating: -1 | 1): FeedbackEvent => ({
  type: "feedback",
  id: `fb-${sessionId}-${exerciseId}-${rating}`,
  at: NOW - 2 * DAY,
  sessionId,
  exerciseId,
  rating,
});

describe("repRange", () => {
  it("follows the goal for loaded lifts, and gives bodyweight work its own wider range", () => {
    expect(repRange(ex("bench-press"), "strength")).toEqual([4, 6]);
    expect(repRange(ex("bench-press"), "muscle")).toEqual([6, 10]);
    expect(repRange(ex("bench-press"), "general")).toEqual([8, 12]);
    expect(repRange(ex("db-fly"), "strength")).toEqual([8, 12]);
    expect(repRange(ex("db-fly"), "muscle")).toEqual([10, 15]);
    expect(repRange(ex("push-up"), "strength")).toEqual([6, 15]);
  });

  it("uses the lifter's own range for loaded lifts only", () => {
    const training = { reps: { compound: [3, 5] as [number, number], isolation: [12, 20] as [number, number] } };
    expect(repRange(ex("bench-press"), "muscle", training)).toEqual([3, 5]);
    expect(repRange(ex("db-fly"), "muscle", training)).toEqual([12, 20]);
    expect(repRange(ex("push-up"), "muscle", training)).toEqual([6, 15]);
  });
});

describe("ageFactor", () => {
  const at = (age: number) => ageFactor(2026 - age, NOW);
  it("starts lighter for teens and past 40, in steps by decade", () => {
    expect(ageFactor(undefined, NOW)).toBe(1);
    expect([at(17), at(18), at(39), at(40), at(49), at(50), at(59), at(60), at(69), at(70)]).toEqual([
      0.8, 1, 1, 0.92, 0.92, 0.84, 0.84, 0.75, 0.75, 0.65,
    ]);
  });
});

describe("target: bodyweight exercises", () => {
  const pushUps = ex("push-up");
  const after = (events: AppEvent[], p = profile) => target(pushUps, events, p, gym, NOW);

  it("starts at the bottom of the range", () => {
    expect(after([])).toMatchObject({ weight: 0, reps: 6, note: t("note.firstLevel") });
  });

  it("adds a rep after every target was hit, and repeats it after a miss", () => {
    expect(after(session("a", 2, "push-up", 0, 10, [10, 11, 10]))).toMatchObject({ reps: 11, note: t("note.oneMoreRep") });
    expect(after(session("a", 2, "push-up", 0, 10, [10, 8, 9]))).toMatchObject({ reps: 10, note: t("note.sameAgain") });
  });

  it("adds another rep when it felt easy, and takes two off when it felt hard", () => {
    const hit = session("a", 2, "push-up", 0, 10, [10, 10]);
    expect(after([...hit, rate("a", "push-up", 1)]).reps).toBe(12);
    expect(after([...hit, rate("a", "push-up", -1)]).reps).toBe(9);
    // Never below the bottom of the range.
    expect(after([...session("a", 2, "push-up", 0, 7, [5, 5]), rate("a", "push-up", -1)]).reps).toBe(6);
  });

  it("only counts feedback on this exercise from the last session", () => {
    const hit = [...session("old", 5, "push-up", 0, 9, [9]), ...session("a", 2, "push-up", 0, 10, [10, 10])];
    expect(after([...hit, rate("old", "push-up", -1)]).reps).toBe(11);
    expect(after([...hit, rate("a", "bench-press", -1)]).reps).toBe(11);
  });

  it("goes past the top of the range only one rep beyond the lifter's best", () => {
    const top = session("a", 2, "push-up", 0, 15, [15, 15]);
    expect(after([...top, rate("a", "push-up", 1)]).reps).toBe(16);
    expect(after(session("a", 2, "push-up", 0, 15, [20, 15]))).toMatchObject({ reps: 16 });
  });

  it("goes back to the bottom of the range in a deload week", () => {
    expect(blockWeek(deload, NOW).deload).toBe(true);
    expect(after(session("a", 2, "push-up", 0, 12, [12, 12]), deload)).toMatchObject({ reps: 6, note: t("note.deloadEasy") });
  });
});

describe("target: loaded lifts", () => {
  const bench = ex("bench-press");
  // Two earlier sessions, so the first-session calibration is out of the way.
  const history = (targetReps: number, reps: number[], weight = 80) => [
    ...session("first", 5, "bench-press", weight, targetReps, [targetReps, targetReps]),
    ...session("last", 2, "bench-press", weight, targetReps, reps),
  ];
  const after = (events: AppEvent[], p = profile) => target(bench, events, p, gym, NOW);

  it("adds a rep within the range after every target was hit", () => {
    expect(after(history(8, [8, 8, 9]))).toMatchObject({ weight: 80, reps: 9, note: t("note.oneMoreRep") });
  });

  it("adds weight and starts the range again at the top of the range", () => {
    expect(after(history(10, [10, 10]))).toMatchObject({ weight: 82.5, reps: 6, note: t("note.topOfRange") });
  });

  it("adds weight early when it felt easy", () => {
    expect(after([...history(8, [8, 8]), rate("last", "bench-press", 1)])).toMatchObject({
      weight: 82.5,
      reps: 6,
      note: t("note.feltEasy"),
    });
  });

  it("repeats the same weight and reps after a small miss", () => {
    expect(after(history(8, [8, 7]))).toMatchObject({ weight: 80, reps: 8, note: t("note.sameAgain") });
  });

  it("drops a step after missing by two reps, or when it felt too hard", () => {
    expect(after(history(8, [8, 6]))).toMatchObject({ weight: 77.5, reps: 6, note: t("note.missedTwo") });
    expect(after([...history(8, [8, 8]), rate("last", "bench-press", -1)])).toMatchObject({
      weight: 77.5,
      reps: 6,
      note: t("note.tooHard"),
    });
  });

  it("takes the heaviest set as the last weight", () => {
    const mixed = [
      ...session("first", 5, "bench-press", 80, 8, [8]),
      ...session("last", 2, "bench-press", 80, 8, [8]),
      ...session("last", 2, "bench-press", 75, 8, [8]),
    ];
    expect(after(mixed)).toMatchObject({ weight: 80, reps: 9 });
  });

  it("goes about 10% lighter at the bottom of the range in a deload week", () => {
    expect(after(history(8, [8, 8]), deload)).toMatchObject({ weight: 72.5, reps: 6, note: t("note.deloadLighter") });
  });
});
