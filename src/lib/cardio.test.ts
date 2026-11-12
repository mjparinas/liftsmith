// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeProfile, makeSet, makeTestGym, NOW } from "../test/factories";
import { bumpDistance, distanceText, fromMetres, startDistance } from "./cardio";
import { defaultProfile } from "./defaults";
import { exercise, EXERCISES } from "./exercises";
import { generate } from "./generator";
import { target, TIMED } from "./progression";
import { useApp } from "./store";
import { loadItem } from "./store/workout";
import type { SetEvent } from "./types";

// Cardio logging (competitor gaps, Melvin 2026-11-11): time in seconds, distance in metres where it
// means something, never picked by the generator.

describe("cardio exercises", () => {
  it("are timed, have the cardio pattern and are never planned", () => {
    const cardio = EXERCISES.filter((e) => e.cardio);
    expect(cardio.length).toBeGreaterThanOrEqual(15);
    for (const e of cardio) {
      expect(e.pattern).toBe("cardio");
      expect(TIMED.has(e.id)).toBe(true);
    }
    for (const e of EXERCISES.filter((x) => x.pattern === "cardio")) expect(e.cardio).toBeDefined();
    const gym = makeTestGym("commercial");
    for (let d = 0; d < 14; d++) {
      const plan = generate({ events: [], profile: makeProfile(), gym, now: NOW + d * 86400_000, minutes: 60 });
      expect(plan.items.some((i) => exercise(i.exerciseId).cardio)).toBe(false);
    }
  });

  it("start at 20 minutes, then repeat what was done last time", () => {
    const run = exercise("treadmill-run");
    const gym = makeTestGym("commercial");
    expect(target(run, [], makeProfile(), gym, NOW).reps).toBe(20 * 60);
    const last = makeSet({ exerciseId: run.id, weight: 0, reps: 1500, targetReps: 1200, distanceM: 4200, at: NOW - 86400_000 });
    expect(target(run, [last], makeProfile(), gym, NOW).reps).toBe(1500);
    expect(startDistance(run, [last])).toBe(4200);
    expect(startDistance(run, [])).toBe(3000);
    expect(startDistance(exercise("jump-rope"), [last])).toBeUndefined();
  });

  it("bumps distance by a tenth of a km or mile, 10 m on a sled", () => {
    const run = exercise("outdoor-run");
    expect(bumpDistance(3000, 1, run, "km")).toBe(3100);
    expect(bumpDistance(3040, -1, run, "km")).toBe(2900);
    expect(fromMetres(bumpDistance(1609, 1, run, "mi"), "mi")).toBe(1.1);
    expect(bumpDistance(50, 1, exercise("sled-push"), "km")).toBe(60);
    expect(bumpDistance(0, -1, run, "km")).toBe(0);
    expect(distanceText(5000, "kg")).toBe("5 km");
    expect(distanceText(1609.344 * 3, "lb")).toBe("3 mi");
  });
});

describe("logging cardio in a workout", () => {
  const T = new Date("2026-11-11T18:00:00").getTime();
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(T);
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(T - 3 * 86400_000), onboarded: true, activeGymId: id });
    useApp.getState().replan();
  });
  afterEach(() => vi.useRealTimers());

  it("saves the time and the distance on the set", () => {
    const s = useApp.getState;
    s().start();
    const a = s().active!;
    const row = {
      ...a.plan.items[0]!,
      exerciseId: "rowing-machine",
      sets: 1,
      warmup: undefined,
      setTargets: undefined,
      target: { weight: 0, reps: 1200, rir: 2, note: "" },
    };
    const plan = { ...a.plan, items: [row, ...a.plan.items] };
    useApp.setState({ active: loadItem(s().events, { ...a, plan, warm: undefined }, 0) });
    expect(s().active!.distanceM).toBe(2000);
    s().adjust(0, 480);
    s().adjustDistance(2100);
    s().logSet();
    const set = s().events.find((e): e is SetEvent => e.type === "set")!;
    expect(set.exerciseId).toBe("rowing-machine");
    expect(set.reps).toBe(480);
    expect(set.distanceM).toBe(2100);
  });

  it("takes time, distance and average power from a Bluetooth gym machine (Labs)", () => {
    const s = useApp.getState;
    s().start();
    const a = s().active!;
    const row = { ...a.plan.items[0]!, exerciseId: "rowing-machine", sets: 2, warmup: undefined, setTargets: undefined };
    const plan = { ...a.plan, items: [row, ...a.plan.items] };
    useApp.setState({ active: loadItem(s().events, { ...a, plan, warm: undefined }, 0) });
    s().machineSet({ seconds: 301.4, distanceM: 1250.6, powerW: 182 });
    expect(s().active).toMatchObject({ reps: 301, distanceM: 1251, powerW: 182 });
    s().logSet();
    const set = s().events.find((e): e is SetEvent => e.type === "set")!;
    expect(set).toMatchObject({ reps: 301, distanceM: 1251, powerW: 182 });
    // The next set starts with no power until the machine sends some.
    expect(s().active!.powerW).toBeUndefined();
  });

  it("leaves a strength set alone if a machine reading arrives", () => {
    const s = useApp.getState;
    s().start();
    const before = s().active!;
    expect(exercise(before.plan.items[before.index]!.exerciseId).cardio).toBeUndefined();
    s().machineSet({ seconds: 600, distanceM: 3000, powerW: 200 });
    expect(s().active).toEqual(before);
  });
});
