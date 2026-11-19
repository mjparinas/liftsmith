import { describe, expect, it } from "vitest";

import {
  boardOf,
  firstName,
  nextFor,
  pendingPush,
  planFrom,
  progressOf,
  PUSH_SETS,
  startWeight,
  type TeamSessionState,
} from "./teamSession";

const NOW = Date.UTC(2026, 10, 19, 15);

function session(over: Partial<TeamSessionState> = {}): TeamSessionState {
  return {
    id: "S1",
    team: "T1",
    teamName: "Senior girls",
    name: "Leg day",
    plan: [
      { exerciseId: "back-squat", sets: 2, reps: 5 },
      { exerciseId: "push-up", sets: 1, reps: 12 },
    ],
    roster: [
      { id: "ana", name: "Ana" },
      { id: "bo", name: "Bo" },
      { id: "cy", name: "Cy" },
    ],
    startedAt: NOW,
    sets: [],
    last: {},
    sent: [],
    removed: [],
    ...over,
  };
}
const set = (id: string, athlete: string, exercise: string, weight = 40, reps = 5) => ({
  id,
  athlete,
  exercise,
  weight,
  reps,
  target: 5,
  at: NOW,
});

describe("team session plan", () => {
  it("takes a routine's exercises and sets, aims at the bottom of the rep range and leaves out cardio", () => {
    const plan = planFrom(
      [
        { exerciseId: "back-squat", sets: 3 },
        { exerciseId: "rower-intervals", sets: 1 },
        { exerciseId: "not-an-exercise", sets: 2 },
      ],
      "strength",
    );
    expect(plan).toEqual([{ exerciseId: "back-squat", sets: 3, reps: 4 }]);
  });

  it("shows first names only", () => {
    expect(firstName("  Ana Maria Lopez ")).toBe("Ana");
    expect(firstName("")).toBe("");
  });
});

describe("where each athlete is", () => {
  it("moves through the plan in order, and a set of 0 reps doesn't count as done", () => {
    const st = session({ sets: [set("1", "ana", "back-squat"), set("2", "ana", "back-squat", 40, 0)] });
    expect(nextFor(st, "ana")).toEqual({ item: st.plan[0], setNo: 2 });
    const more = session({ sets: [...st.sets, set("3", "ana", "back-squat"), set("4", "ana", "push-up", 0, 12)] });
    expect(nextFor(more, "ana")).toBeNull();
    expect(progressOf(more, "ana")).toEqual({ done: 3, total: 3 });
  });

  it("starts a set from this session's last weight, then the last session's", () => {
    const st = session({ sets: [set("1", "ana", "back-squat", 42.5, 5)], last: { bo: { "back-squat": { weight: 30, reps: 6 } } } });
    expect(startWeight(st, "ana", "back-squat")).toEqual({ weight: 42.5, reps: 5 });
    expect(startWeight(st, "bo", "back-squat")).toEqual({ weight: 30, reps: 6 });
    expect(startWeight(st, "cy", "back-squat")).toBeNull();
  });

  it("puts the board in order and says who hasn't started", () => {
    const st = session({
      sets: [set("1", "bo", "back-squat"), set("2", "bo", "back-squat"), set("3", "bo", "push-up", 0, 12), set("4", "ana", "back-squat")],
    });
    const b = boardOf(st);
    expect(b.rows.map((r) => [r.name, r.done, r.on])).toEqual([
      ["Bo", 3, ""],
      ["Ana", 1, "back-squat"],
      ["Cy", 0, "back-squat"],
    ]);
    expect(b.notStarted).toBe(1);
    expect(b.finished).toBe(1);
    expect(JSON.stringify(b)).not.toContain("weight");
  });
});

describe("pushing to the server", () => {
  it("sends the session first, then only what the server doesn't have", () => {
    const fresh = session();
    expect(pendingPush(fresh)?.sets).toEqual([]);
    expect(pendingPush({ ...fresh, synced: true })).toBeNull();
    const st = session({ synced: true, sets: [set("a", "ana", "back-squat"), set("b", "ana", "back-squat")], sent: ["a"] });
    expect(pendingPush(st)?.sets).toEqual(["b"]);
    expect(pendingPush(st)?.ends).toBe(false);
  });

  it("sends the end only with the last chunk of sets, and nothing once done", () => {
    const many = Array.from({ length: PUSH_SETS + 5 }, (_, i) => set(`s${i}`, "ana", "back-squat"));
    const st = session({ synced: true, sets: many, endedAt: NOW + 1000 });
    const first = pendingPush(st)!;
    expect(first.sets.length).toBe(PUSH_SETS);
    expect(first.ends).toBe(false);
    const second = pendingPush({ ...st, sent: first.sets })!;
    expect(second.sets.length).toBe(5);
    expect(second.ends).toBe(true);
    expect((second.body.session as { endedAt?: number }).endedAt).toBe(NOW + 1000);
    expect(pendingPush({ ...st, done: true })).toBeNull();
  });

  it("sends a set taken back", () => {
    const st = session({ synced: true, removed: ["gone"] });
    expect(pendingPush(st)?.removed).toEqual(["gone"]);
  });
});
