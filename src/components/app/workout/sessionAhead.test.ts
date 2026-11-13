// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { defaultProfile } from "@/lib/defaults";
import { tapTime } from "@/lib/sessionNotify";
import { useApp } from "@/lib/store";

import { aheadSteps, sessionFields } from "./sessionAhead";

// Log set on the lock-screen notification with the app closed (docs/decisions/workout-screen.md): the notification
// steps through sets the app worked out ahead of time, and the app logs the taps when it opens. The two must agree.

const fields = () => {
  const s = useApp.getState();
  const gym = s.gyms[0]!;
  return sessionFields(s.active!, s.events, s.profile.unit, gym);
};

describe("notification look-ahead", () => {
  beforeEach(async () => {
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(Date.now()), onboarded: true, bodyweight: 80, activeGymId: id });
    useApp.getState().replan();
    useApp.setState({ ready: true });
    useApp.getState().start();
  });

  it("predicts exactly what each Log set leads to, through to the end of the workout", () => {
    const s = useApp.getState();
    const steps = aheadSteps(s.active!, s.events, s.profile.unit, s.gyms[0]!, true);
    expect(steps.length).toBeGreaterThan(3);
    expect(steps.at(-1)!.end).toBe(true);
    expect(steps.slice(0, -1).every((x) => !x.end)).toBe(true);
    for (const step of steps) {
      useApp.getState().logSet();
      const a = useApp.getState().active!;
      if (step.end) {
        expect(fields()).toBeNull();
        expect(step.done).toBe(step.total);
        break;
      }
      const f = fields()!;
      expect(step.setLabel).toBe(f.setLabel);
      expect(step.next).toBe(f.next);
      expect(step.plates).toBe(f.plates);
      expect(step.chip).toBe(f.chip);
      expect(step.done).toBe(f.done);
      expect(step.rest).toBe(a.restUntil ? a.restTotal : 0);
    }
  });

  it("gives the same steps with a long history, which it skips for speed, as with none", () => {
    const s = useApp.getState();
    const a = s.active!;
    const exId = a.plan.items[0]!.exerciseId;
    // Two years of other workouts with the same exercises, none of them this workout.
    const history = Array.from({ length: 400 }, (_, i) => ({
      type: "set" as const,
      id: `old-${i}`,
      at: Date.now() - (i + 1) * 3600_000,
      sessionId: `old-s${Math.floor(i / 20)}`,
      exerciseId: i % 2 ? exId : a.plan.items.at(-1)!.exerciseId,
      weight: 50,
      reps: 8,
      targetReps: 8,
      rir: 2,
    }));
    const plain = aheadSteps(a, s.events, s.profile.unit, s.gyms[0]!, true);
    const long = aheadSteps(a, [...history, ...s.events], s.profile.unit, s.gyms[0]!, true);
    expect(long).toEqual(plain);
  });

  it("works it out on a copy: nothing is logged and the workout doesn't move", () => {
    const s = useApp.getState();
    const before = s.active;
    aheadSteps(s.active!, s.events, s.profile.unit, s.gyms[0]!, true);
    expect(useApp.getState().events.some((e) => e.type === "set" || e.type === "warmup")).toBe(false);
    expect(useApp.getState().active).toBe(before);
  });

  it("starts no rest when auto-start rest is off", () => {
    const s = useApp.getState();
    const steps = aheadSteps(s.active!, s.events, s.profile.unit, s.gyms[0]!, false);
    expect(steps.every((x) => x.rest === 0)).toBe(true);
  });

  it("stops at the limit it's given", () => {
    const s = useApp.getState();
    expect(aheadSteps(s.active!, s.events, s.profile.unit, s.gyms[0]!, true, 2)).toHaveLength(2);
  });
});

describe("tapTime", () => {
  const now = 1_800_000_000_000;
  it("keeps a real past tap", () => expect(tapTime(now - 5000, now)).toBe(now - 5000));
  it("ignores junk, the future and taps over a day old", () => {
    expect(tapTime(undefined, now)).toBeUndefined();
    expect(tapTime("1", now)).toBeUndefined();
    expect(tapTime(Number.NaN, now)).toBeUndefined();
    expect(tapTime(now + 10, now)).toBeUndefined();
    expect(tapTime(now - 2 * 86400_000, now)).toBeUndefined();
  });
});
