import { describe, expect, it } from "vitest";

import { makeSet, NOW } from "@/test/factories";

import { compareBest, lastTimes } from "./postDetail";

describe("your last time on a friend's exercises", () => {
  it("takes the best set of the reader's most recent workout with that exercise", () => {
    const events = [
      makeSet({ exerciseId: "back-squat", sessionId: "old", weight: 140, reps: 5, at: NOW - 20 * 86_400_000 }),
      makeSet({ exerciseId: "back-squat", sessionId: "new", weight: 100, reps: 5, at: NOW - 86_400_000 }),
      makeSet({ exerciseId: "back-squat", sessionId: "new", weight: 110, reps: 3, at: NOW - 86_000_000 }),
    ];
    const m = lastTimes(events, ["back-squat", "bench-press"]);
    expect(m.get("back-squat")).toMatchObject({ w: 110, r: 3 });
    expect(m.has("bench-press")).toBe(false);
  });

  it("compares estimated one-rep maxes as a whole percentage", () => {
    expect(compareBest({ w: 110, r: 5 }, { at: 0, w: 100, r: 5 })).toBe(10);
    expect(compareBest({ w: null, r: 5 }, { at: 0, w: 100, r: 5 })).toBeNull();
    expect(compareBest({ w: 100, r: 5 }, undefined)).toBeNull();
  });
});

describe("the post for a finished workout", () => {
  it("carries every set and marks the exercises with a new best, and drops weights when they're hidden", async () => {
    const { postBodyFor } = await import("./social");
    const events = [
      makeSet({ exerciseId: "back-squat", sessionId: "old", weight: 100, reps: 5, at: NOW - 7 * 86_400_000 }),
      makeSet({ exerciseId: "bench-press", sessionId: "old", weight: 80, reps: 5, at: NOW - 7 * 86_400_000 }),
      makeSet({ exerciseId: "back-squat", sessionId: "s1", weight: 100, reps: 5, at: NOW }),
      makeSet({ exerciseId: "back-squat", sessionId: "s1", weight: 105, reps: 5, at: NOW + 1 }),
      makeSet({ exerciseId: "bench-press", sessionId: "s1", weight: 70, reps: 5, at: NOW + 2 }),
    ];
    const summary = { sessionId: "s1", start: NOW, seconds: 1800, sets: 3, volume: 1375, exercises: ["back-squat", "bench-press"], prs: 1 };
    const body = postBodyFor(events, summary, true);
    expect(body.exercises[0]).toMatchObject({
      id: "back-squat",
      sets: 2,
      w: 105,
      pr: true,
      log: [
        { w: 100, r: 5 },
        { w: 105, r: 5 },
      ],
    });
    expect(body.exercises[1]!.pr).toBeUndefined();
    expect(postBodyFor(events, summary, false).exercises[0]!.log).toEqual([
      { w: null, r: 5 },
      { w: null, r: 5 },
    ]);
  });
});
