import { describe, expect, it } from "vitest";

import { lastWorked, muscleAdvice, readyAt } from "./muscleAdvice";
import { recovery } from "./recovery";
import type { SetEvent } from "./types";

const H = 3600_000;
const NOW = Date.UTC(2026, 10, 9, 18);
let n = 0;
const set = (exerciseId: string, at: number): SetEvent => ({
  type: "set",
  id: `e${n++}`,
  at,
  sessionId: "s1",
  exerciseId,
  weight: 100,
  reps: 5,
  targetReps: 5,
  rir: 1,
});
const squats = Array.from({ length: 6 }, (_, i) => set("back-squat", NOW - 2 * H + i * 60_000));

describe("muscle advice", () => {
  it("finds when a tired muscle is ready again, to the quarter hour", () => {
    const at = readyAt(squats, "quads", NOW)!;
    expect(at).toBeGreaterThan(NOW);
    expect(recovery(squats, at).quads).toBeGreaterThanOrEqual(70);
    expect(recovery(squats, at - 900_000).quads).toBeLessThan(70);
    expect(readyAt(squats, "biceps", NOW)).toBeNull();
  });

  it("says rest a fatigued muscle, with when it's ready and why", () => {
    const rec = recovery(squats, NOW);
    expect(rec.quads).toBeLessThan(40);
    const a = muscleAdvice({ muscle: "quads", events: squats, now: NOW, rec, done: 6, goal: 12 });
    expect(a.band).toBe("fatigued");
    expect(a.call).toMatch(/^Rest it\. It's ready in \d+ hours\.$/);
    expect(a.why).toContain(`${rec.quads}% recovered`);
    expect(a.why).toContain("Last worked 2 hours ago.");
    expect(a.lastAt).toBe(squats[5].at);
  });

  it("says how many sets are left on a recovered muscle, and offers a priority when it's well short", () => {
    const rec = recovery(squats, NOW);
    const a = muscleAdvice({ muscle: "chest", events: squats, now: NOW, rec, done: 2, goal: 12 });
    expect(a.readyAt).toBeNull();
    expect(a.call).toBe("Good to train. 10 more sets reach this week's 12.");
    expect(a.offerPriority).toBe(true);
    expect(muscleAdvice({ muscle: "chest", events: squats, now: NOW, rec, done: 2, goal: 12, priorities: ["chest"] }).offerPriority).toBe(
      false,
    );
    expect(muscleAdvice({ muscle: "chest", events: squats, now: NOW, rec, done: 9, goal: 12 }).offerPriority).toBe(false);
  });

  it("says the week is done once the sets are in", () => {
    const rec = recovery([], NOW);
    const a = muscleAdvice({ muscle: "biceps", events: [], now: NOW, rec, done: 12.4, goal: 12 });
    expect(a.call).toBe("This week's sets are done. Let it recover for next week.");
    expect(a.why).toBe("12 of 12 sets done this week, so more won't add much.");
  });

  it("only counts the past week's sets that worked the muscle", () => {
    expect(lastWorked([set("back-squat", NOW - 8 * 24 * H)], "quads", NOW)).toBeNull();
    expect(lastWorked(squats, "biceps", NOW)).toBeNull();
  });
});
