import { describe, expect, it } from "vitest";

import { makeSet, NOW } from "@/test/factories";

import { decodeRoutine } from "./routineShare";
import { bestLifts, postRoutineCode, profileChanges } from "./social";
import type { SocialProfile } from "./socialTypes";

const profile = (over: Partial<SocialProfile> = {}): SocialProfile => ({
  handle: "alex",
  name: "Alex",
  open: false,
  autoPost: false,
  weights: true,
  public: false,
  push: { follows: true, comments: true, sent: true, likes: false },
  avatar: "",
  audience: "all",
  showLifts: true,
  lifts: [],
  ...over,
});

describe("best lifts for the profile showcase", () => {
  it("takes the three heaviest by estimated one-rep max, one set each, and skips cardio and injury sets", () => {
    const events = [
      makeSet({ exerciseId: "bench-press", weight: 100, reps: 5 }),
      makeSet({ exerciseId: "bench-press", weight: 90, reps: 10 }), // a higher estimate than 100 × 5
      makeSet({ exerciseId: "back-squat", weight: 140, reps: 3 }),
      makeSet({ exerciseId: "deadlift", weight: 180, reps: 2 }),
      makeSet({ exerciseId: "overhead-press", weight: 50, reps: 5 }),
      makeSet({ exerciseId: "barbell-row", weight: 400, reps: 1, injuryPct: 0.5 }),
      makeSet({ exerciseId: "treadmill-run", weight: 0, reps: 600, distanceM: 2000 }),
    ];
    expect(bestLifts(events)).toEqual([
      { id: "deadlift", w: 180, r: 2, at: NOW },
      { id: "back-squat", w: 140, r: 3, at: NOW },
      { id: "bench-press", w: 90, r: 10, at: NOW },
    ]);
    expect(bestLifts([])).toEqual([]);
  });

  it("sends only what changed", () => {
    const lifts = [{ id: "deadlift", w: 180, r: 2, at: NOW }];
    expect(profileChanges(profile({ avatar: "av-bolt", lifts }), "av-bolt", lifts)).toBeNull();
    expect(profileChanges(profile({ lifts }), "av-bolt", lifts)).toEqual({ avatar: "av-bolt" });
    expect(profileChanges(profile(), "", lifts)).toEqual({ lifts });
  });
});

describe("saving a friend's workout", () => {
  it("turns a post into a routine of its known exercises and set counts", () => {
    const code = postRoutineCode({
      name: "Blair",
      body: {
        v: 1,
        seconds: 3000,
        sets: 8,
        volume: null,
        prs: 0,
        muscles: [],
        exercises: [
          { id: "back-squat", name: "Back squat", sets: 5, w: null, r: 5 },
          { id: "my-own-move", name: "Mystery", sets: 3, w: null, r: 10 },
        ],
      },
    });
    expect(decodeRoutine(code!)).toEqual({ name: "Blair’s workout", items: [{ exerciseId: "back-squat", sets: 5 }] });
    expect(
      postRoutineCode({ name: "B", body: { v: 1, seconds: 1, sets: 1, volume: null, prs: 0, muscles: [], exercises: [] } }),
    ).toBeNull();
  });
});
