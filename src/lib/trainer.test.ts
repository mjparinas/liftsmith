import { describe, expect, it } from "vitest";

import { DAY, makeWorkout, NOW } from "@/test/factories";

import { cleanEvents, clientReport, codeFrom, inviteUrl, showCode } from "./trainer";

describe("invite codes on the phone", () => {
  it("shows a code in two halves and reads it back from a typed code or a link", () => {
    expect(showCode("ABCD2345")).toBe("ABCD-2345");
    expect(codeFrom(" abcd-2345 ")).toBe("ABCD2345");
    expect(codeFrom(inviteUrl("ABCD2345"))).toBe("ABCD2345");
    expect(codeFrom("ABCD-234O")).toBe("");
    expect(codeFrom("hello")).toBe("");
  });
});

describe("a coach's report on a client", () => {
  const view = (events: unknown[], daysPerWeek: number | null = 3) => ({ name: "Alex", daysPerWeek, events });

  it("drops anything malformed from another person's phone", () => {
    const { events, names } = cleanEvents([
      null,
      { id: "a", at: 1, type: "set", sessionId: "s", exerciseId: "bench-press", weight: "heavy", reps: 5, targetReps: 5 },
      { id: "b", at: 1, type: "sessionEnd", sessionId: "s" },
      { id: "c", at: 1, type: "customExercise", exercise: { id: "custom-sled", name: "Sled drag" } },
      { id: "d", at: 1, type: "set", sessionId: "s", exerciseId: "bench-press", weight: 60, reps: 5, targetReps: 5 },
    ]);
    expect(events.map((e) => e.id)).toEqual(["d"]);
    expect(names.get("custom-sled")).toBe("Sled drag");
  });

  it("says when there are no workouts yet", () => {
    expect(clientReport(view([]), NOW).flags).toEqual([{ kind: "new" }]);
  });

  it("flags a client who has gone quiet", () => {
    const r = clientReport(view(makeWorkout("w1", NOW - 10 * DAY, [{}, {}])), NOW);
    expect(r.flags[0]).toEqual({ kind: "quiet", days: 9 });
  });

  it("flags missed reps three workouts running", () => {
    const missed = [
      { reps: 5, targetReps: 8 },
      { reps: 5, targetReps: 8 },
    ];
    const events = [1, 3, 5].flatMap((d) => makeWorkout(`w${d}`, NOW - d * DAY, missed));
    const r = clientReport(view(events, null), NOW);
    expect(r.flags).toContainEqual({ kind: "missing", pct: 0 });
    expect(r.sessions).toHaveLength(3);
  });

  it("says on track when nothing needs doing, and counts the weeks", () => {
    // Getting stronger every week, so nothing is stalled.
    const events = [0, 7, 14, 21].flatMap((d) => makeWorkout(`w${d}`, NOW - d * DAY - 3600_000, [{ weight: 80 - d }, { weight: 80 - d }]));
    const r = clientReport(view(events, 1), NOW);
    expect(r.weeks.map((w) => w.count)).toEqual([1, 1, 1, 1]);
    expect(r.flags.at(-1)).toEqual({ kind: "onTrack", done: 1, goal: 1 });
  });
});
