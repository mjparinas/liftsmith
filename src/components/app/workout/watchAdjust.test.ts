// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { defaultProfile } from "@/lib/defaults";
import { tapData } from "@/lib/sessionNotify";
import { useApp } from "@/lib/store";

import { aheadSteps } from "./sessionAhead";
import { ladder, LADDER_STEPS, runWatchTap, setKey, watchAdj, watchAsk, watchRating, watchValues } from "./watchAdjust";

// Adjust and rate a set on the watch (docs/decisions/watch-apps.md "Adjust and rate a set").

const plates = (kg: number, dir: 1 | -1) => kg + dir * 2.5;

describe("the weight ladder", () => {
  it("goes LADDER_STEPS each way, lightest first, with the set's own weight at i", () => {
    const l = ladder(100, plates);
    expect(l.kg).toHaveLength(2 * LADDER_STEPS + 1);
    expect(l.kg[l.i]).toBe(100);
    expect(l.kg[0]).toBe(80);
    expect(l.kg.at(-1)).toBe(120);
  });

  it("stops where the rack, the stack or zero ends", () => {
    const rack = [10, 12.5, 15];
    const step = (kg: number, dir: 1 | -1) =>
      dir > 0 ? (rack.find((x) => x > kg) ?? kg) : ([...rack].reverse().find((x) => x < kg) ?? kg);
    expect(ladder(12.5, step)).toEqual({ kg: [10, 12.5, 15], i: 1 });
    expect(ladder(5, (kg, dir) => Math.max(0, kg + dir * 2.5))).toEqual({
      kg: [0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25],
      i: 2,
    });
  });
});

describe("what the watch sends back", () => {
  it("takes a weight and whole reps for the set it was shown", () => {
    expect(watchValues({ key: "s:3", kg: 102.5, reps: 6 }, "s:3")).toEqual({ kg: 102.5, reps: 6 });
    expect(watchValues({ key: "s:3", reps: 12 }, "s:3")).toEqual({ reps: 12 });
  });

  it("ignores another set's values and anything unbelievable", () => {
    expect(watchValues({ key: "s:2", kg: 100, reps: 6 }, "s:3")).toBeNull();
    expect(watchValues({ key: "s:3", kg: -5, reps: 6 }, "s:3")).toBeNull();
    expect(watchValues({ key: "s:3", kg: 2000, reps: 6 }, "s:3")).toBeNull();
    expect(watchValues({ key: "s:3", kg: 100, reps: 0 }, "s:3")).toBeNull();
    expect(watchValues({ key: "s:3", kg: 100, reps: 5.5 }, "s:3")).toBeNull();
    expect(watchValues(undefined, "s:3")).toBeNull();
  });

  it("takes a rating only for the exercise being asked about", () => {
    expect(watchRating({ ex: "bench-press", v: -1 }, "bench-press")).toBe(-1);
    expect(watchRating({ ex: "bench-press", v: 0 }, "bench-press")).toBe(0);
    expect(watchRating({ ex: "back-squat", v: 1 }, "bench-press")).toBeNull();
    expect(watchRating({ ex: "bench-press", v: 2 }, "bench-press")).toBeNull();
    expect(watchRating({ ex: "bench-press", v: 1 }, null)).toBeNull();
  });

  it("reads a tap's data from Android's text and iOS's object alike, and nothing else", () => {
    expect(tapData('{"key":"s:1","kg":60,"reps":8}')).toEqual({ key: "s:1", kg: 60, reps: 8, ex: undefined, v: undefined });
    expect(tapData({ ex: "row", v: 1 })).toEqual({ key: undefined, kg: undefined, reps: undefined, ex: "row", v: 1 });
    expect(tapData("not json")).toBeUndefined();
    expect(tapData({ kg: "60" })).toBeUndefined();
    expect(tapData(undefined)).toBeUndefined();
    expect(tapData("x".repeat(600))).toBeUndefined();
  });
});

describe("on the workout", () => {
  beforeEach(async () => {
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(Date.now()), onboarded: true, bodyweight: 80, activeGymId: id });
    useApp.getState().replan();
    useApp.setState({ ready: true });
    useApp.getState().start();
  });

  const state = () => {
    const s = useApp.getState();
    return { s, a: s.active!, gym: s.gyms[0]! };
  };

  it("offers the set's own weight and reps, with the phone's own steps around it", () => {
    const { s, a, gym } = state();
    const adj = watchAdj(a, s.events, s.profile.unit, gym);
    if (!adj) return; // a cardio or timed first exercise: nothing to change on the wrist
    expect(adj.reps).toBe(a.reps);
    expect(adj.key).toBe(setKey(a, s.events));
    if (adj.kg.length) {
      expect(adj.kg[adj.i]).toBeCloseTo(a.weight, 3);
      expect(adj.w).toHaveLength(adj.kg.length);
      for (let k = 1; k < adj.kg.length; k++) expect(adj.kg[k]!).toBeGreaterThan(adj.kg[k - 1]!);
    }
  });

  it("logs the weight and reps chosen on the watch, and only for that set", () => {
    // Straight to the first working set, so the tap logs a set of its own.
    const first = useApp.getState().active!;
    useApp.setState({ active: { ...first, warm: first.plan.items[first.index]?.warmup?.length ?? 0 } });
    const { s, a } = state();
    const key = setKey(a, s.events);
    expect(runWatchTap("log", undefined, { key, kg: a.weight + 5, reps: a.reps + 2 })).toBe(true);
    const set = useApp
      .getState()
      .events.filter((e) => e.type === "set")
      .at(-1);
    expect(set && set.type === "set" && set.weight).toBeCloseTo(a.weight + 5, 3);
    expect(set && set.type === "set" && set.reps).toBe(a.reps + 2);
    // The same key again now names a set already logged: logged as planned, the stale values ignored.
    const b = useApp.getState().active!;
    runWatchTap("log", undefined, { key, kg: 1, reps: 1 });
    const next = useApp
      .getState()
      .events.filter((e) => e.type === "set")
      .at(-1);
    expect(next && next.type === "set" && next.reps).toBe(b.reps);
  });

  it("changes the set without logging it on adjust", () => {
    const { s, a } = state();
    const before = s.events.length;
    runWatchTap("adjust", undefined, { key: setKey(a, s.events), kg: a.weight, reps: a.reps + 3 });
    expect(useApp.getState().active!.reps).toBe(a.reps + 3);
    expect(useApp.getState().events.length).toBe(before);
  });

  it("hands a plain tap back to the shortcuts, as before", () => {
    expect(runWatchTap("log", undefined, undefined)).toBe(false);
    expect(runWatchTap("add30", undefined, undefined)).toBe(false);
  });

  it("answers How did it feel? from the watch", () => {
    useApp.setState({ active: { ...useApp.getState().active!, askFeedback: "bench-press" } });
    const ask = watchAsk(useApp.getState().active!)!;
    expect(ask.o).toHaveLength(3);
    expect(ask.v).toEqual([1, 0, -1]);
    runWatchTap("rate", undefined, { ex: "bench-press", v: -1 });
    expect(useApp.getState().active!.askFeedback).toBeNull();
    const fb = useApp.getState().events.find((e) => e.type === "feedback");
    expect(fb && fb.type === "feedback" && fb.rating).toBe(-1);
  });

  it("gives the steps ahead the key the app works out when it replays the taps", () => {
    const { s, a, gym } = state();
    const steps = aheadSteps(a, s.events, s.profile.unit, gym, true);
    for (const step of steps.slice(0, 4)) {
      useApp.getState().logSet();
      const n = useApp.getState();
      if (step.end || !n.active) break;
      if (step.adj) expect(step.adj.key).toBe(setKey(n.active, n.events));
    }
  });
});
