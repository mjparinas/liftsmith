import { describe, expect, it } from "vitest";

import { DAY, makeSet, makeWorkout, NOW } from "@/test/factories";

import { derive } from "./derive";
import { editSet, removeSet, sessionNoteOf, setSessionNote, workoutEventIds, type EventChange } from "./editHistory";
import type { AppEvent, EffortEvent } from "./types";

// Fixing a finished workout: every change is deletes plus new events, never an edit in place.

let n = 0;
const id = () => `new${++n}`;
const apply = (events: AppEvent[], ch: EventChange) => [...events.filter((e) => !ch.remove.includes(e.id)), ...ch.add];

describe("editing a set", () => {
  const workout = makeWorkout("w1", NOW, [
    { weight: 60, reps: 8 },
    { weight: 60, reps: 8 },
  ]);
  const first = workout[1]!;
  const rating: EffortEvent = { type: "effort", id: "eff1", at: NOW + 70_000, setId: first.id, rir: 1 };
  const events = [...workout, rating];

  it("writes the set again under a new id at the same moment, with its rating moved over", () => {
    const ch = editSet(events, first.id, { weight: 62.5, reps: 6 }, id);
    expect(ch.remove).toEqual([first.id, "eff1"]);
    const [set, eff] = ch.add;
    expect(set).toMatchObject({ type: "set", sessionId: "w1", at: first.at, weight: 62.5, reps: 6 });
    expect(set!.id).not.toBe(first.id);
    expect(eff).toMatchObject({ type: "effort", setId: set!.id, rir: 1 });
    expect(eff!.id).not.toBe("eff1");
    // Stats follow: the volume is the new numbers.
    expect(derive(apply(events, ch), NOW).totalVolume).toBe(62.5 * 6 + 60 * 8);
  });

  it("does nothing when the numbers are the same, or the set isn't there", () => {
    expect(editSet(events, first.id, { weight: 60, reps: 8 }, id)).toEqual({ add: [], remove: [] });
    expect(editSet(events, "nope", { weight: 1, reps: 1 }, id)).toEqual({ add: [], remove: [] });
  });

  it("drops per-side reps, since the new reps are for both sides", () => {
    const sided = makeSet({ sessionId: "w2", repsL: 8, repsR: 10, reps: 8 });
    const ch = editSet([sided], sided.id, { weight: 60, reps: 9 }, id);
    expect(ch.add[0]).not.toHaveProperty("repsL");
    expect(ch.add[0]).not.toHaveProperty("repsR");
  });
});

describe("taking out sets and workouts", () => {
  const workout = makeWorkout("w1", NOW, [{ weight: 60 }, { weight: 60 }]);
  const [, a, b] = workout;
  const rating: EffortEvent = { type: "effort", id: "eff1", at: NOW, setId: a!.id, rir: 0 };
  const other = makeWorkout("w2", NOW + DAY, [{ weight: 70 }]);
  const events = [...workout, rating, ...other];

  it("takes out one set and its rating", () => {
    expect(removeSet(events, a!.id).remove).toEqual([a!.id, "eff1"]);
  });

  it("takes out the whole workout with its last set", () => {
    const after = apply(events, removeSet(events, a!.id));
    const ch = removeSet(after, b!.id);
    expect(new Set(ch.remove)).toEqual(new Set(workout.filter((e) => e.id !== a!.id).map((e) => e.id)));
  });

  it("deletes everything a workout logged, and nothing from another", () => {
    const ids = workoutEventIds(events, "w1");
    expect(new Set(ids)).toEqual(new Set([...workout.map((e) => e.id), "eff1"]));
    const left = events.filter((e) => !ids.includes(e.id));
    expect(derive(left, NOW + DAY).sessions.map((s) => s.sessionId)).toEqual(["w2"]);
  });
});

describe("a workout's name and note", () => {
  it("keeps one note per workout, replacing the old one", () => {
    const first = setSessionNote([], "w1", { name: "  Heavy   Friday ", text: "Felt strong " }, NOW, id);
    expect(first.add[0]).toMatchObject({ type: "sessionNote", sessionId: "w1", name: "Heavy Friday", text: "Felt strong" });
    const events = first.add;
    const second = setSessionNote(events, "w1", { name: "Heavy Friday", text: "Felt strong, bar was fast" }, NOW, id);
    expect(second.remove).toEqual([events[0]!.id]);
    expect(sessionNoteOf(apply(events, second), "w1")?.text).toBe("Felt strong, bar was fast");
    // Later even when the clock says the same moment, so the newest wins on every device.
    expect(second.add[0]!.at).toBeGreaterThan(events[0]!.at);
  });

  it("clears with both boxes empty, and does nothing when unchanged", () => {
    const events = setSessionNote([], "w1", { name: "Legs", text: "" }, NOW, id).add;
    expect(setSessionNote(events, "w1", { name: "Legs", text: "" }, NOW, id)).toEqual({ add: [], remove: [] });
    const cleared = setSessionNote(events, "w1", { name: " ", text: "" }, NOW, id);
    expect(cleared).toEqual({ add: [], remove: [events[0]!.id] });
  });

  it("is never counted as a workout", () => {
    const events = setSessionNote([], "w9", { name: "Legs", text: "" }, NOW, id).add;
    expect(derive(events, NOW).sessions).toEqual([]);
  });
});
