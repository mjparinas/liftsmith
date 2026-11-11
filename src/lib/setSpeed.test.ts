// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultProfile } from "./defaults";
import { useApp } from "./store";
import type { SetEvent } from "./types";

// Today's max lab learns each lifter's own threshold (Labs idea 6, 2026-11-11): what the camera saw on a
// working set is saved with that set at Log set, and only with that set.

const NOW = new Date("2026-11-11T18:00:00").getTime();
const profile = { ...defaultProfile(NOW - 3 * 86400_000), onboarded: true, bodyweight: 80 };
const sets = () => useApp.getState().events.filter((e): e is SetEvent => e.type === "set");

describe("end-of-set speed on logged sets", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...profile, activeGymId: id });
    useApp.getState().replan();
  });
  afterEach(() => vi.useRealTimers());

  /** A workout whose first exercise is a three-set back squat with one warm-up. */
  function onSquat() {
    const s = useApp.getState;
    s().start();
    const a = s().active!;
    const first = {
      ...a.plan.items[0],
      exerciseId: "back-squat",
      sets: 3,
      warmup: [{ weight: 60, reps: 5 }],
      setTargets: undefined,
      slot: undefined,
      group: undefined,
      target: { ...a.plan.items[0].target, weight: 100, reps: 5 },
    };
    useApp.setState({
      active: { ...a, index: 0, plan: { ...a.plan, items: [first, ...a.plan.items.slice(1)] }, warm: 0, weight: 60, reps: 5 },
    });
    return s;
  }

  it("ignores warm-ups, saves a working set's speed and failed rep, and clears it for the next set", () => {
    const s = onSquat();
    s().noteSetSpeed("back-squat", 0.9, false);
    expect(s().active!.setSpeed).toBeUndefined();
    s().logSet();
    s().noteSetSpeed("back-squat", 0.3141, true);
    s().logSet();
    s().logSet();
    const [first, second] = sets();
    expect(first.endSpeed).toBe(0.314);
    expect(first.failedRep).toBe(true);
    expect(second.endSpeed).toBeUndefined();
    expect(second.failedRep).toBeUndefined();
  });

  it("doesn't put one exercise's speed on another's set", () => {
    const s = onSquat();
    s().logSet();
    s().noteSetSpeed("bench-press", 0.4, false);
    s().logSet();
    expect(sets()[0].endSpeed).toBeUndefined();
  });
});
