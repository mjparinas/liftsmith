import { describe, expect, it } from "vitest";

import { exercise } from "@/lib/exercises";

import { loadText, repsText, setText } from "./format";

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

// Melvin, 2026-11-12: make it clear which moves are done one side, then the other.
describe("one side at a time", () => {
  it("says the reps or the hold are per side, everywhere the set is written out", () => {
    expect(repsText(exercise("split-squat"), 8)).toBe("8 reps each side");
    expect(repsText(exercise("side-plank-star"), 30)).toBe("30 s each side");
    expect(setText(exercise("db-row"), 30, 10, "kg")).toBe("30 kg × 10 reps each side");
    expect(repsText(exercise("back-squat"), 5)).toBe("5 reps");
  });

  it("shows both sides of a set whose sides differed", () => {
    expect(setText(exercise("db-row"), 30, 8, "kg", undefined, { repsL: 10, repsR: 8 })).toBe("30 kg × 10 left · 8 right");
    expect(setText(exercise("db-row"), 30, 8, "kg", undefined, {})).toBe("30 kg × 8 reps each side");
  });

  it("says per hand only for a pair of dumbbells", () => {
    expect(loadText(exercise("db-bench-press"), 20, "kg")).toBe("20 kg per hand");
    expect(loadText(exercise("db-row"), 30, "kg")).toBe("30 kg");
  });
});
