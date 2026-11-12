import { describe, expect, it } from "vitest";

import { DAY, NOW } from "@/test/factories";

import { shouldAskRating, type RatingMoment } from "./rateApp";

const happy: RatingMoment = { workouts: 5, firstAt: NOW - 10 * DAY, prs: 1, levelUp: false, badges: 0, lastAsked: null, now: NOW };

describe("shouldAskRating", () => {
  it("asks after a new best once the lifter is a week and three workouts in", () => {
    expect(shouldAskRating(happy)).toBe(true);
  });

  it("a level-up or a badge is a happy moment too", () => {
    expect(shouldAskRating({ ...happy, prs: 0, levelUp: true })).toBe(true);
    expect(shouldAskRating({ ...happy, prs: 0, badges: 2 })).toBe(true);
  });

  it("never on an ordinary workout", () => {
    expect(shouldAskRating({ ...happy, prs: 0 })).toBe(false);
  });

  it("not before three workouts or before a week has passed", () => {
    expect(shouldAskRating({ ...happy, workouts: 2 })).toBe(false);
    expect(shouldAskRating({ ...happy, firstAt: NOW - 6 * DAY })).toBe(false);
  });

  it("at most once every 90 days", () => {
    expect(shouldAskRating({ ...happy, lastAsked: NOW - 89 * DAY })).toBe(false);
    expect(shouldAskRating({ ...happy, lastAsked: NOW - 90 * DAY })).toBe(true);
  });
});
