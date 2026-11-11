import { describe, expect, it } from "vitest";

import { exercise } from "@/lib/exercises";

import { setText } from "./format";

// The one-line next set on the lock-screen notification, the watches and the rest-over alert.
describe("setText", () => {
  it("shows weight and reps for strength work", () => {
    expect(setText(exercise("back-squat"), 100, 5, "kg")).toBe("100 kg × 5 reps");
  });

  it("shows time, and distance where it means something, for cardio, with no weight", () => {
    expect(setText(exercise("treadmill-run"), 0, 1200, "kg", 3000)).toBe("20:00 · 3 km");
    expect(setText(exercise("treadmill-run"), 0, 1200, "kg")).toBe("20:00");
  });
});
