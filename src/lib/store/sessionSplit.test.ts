// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { defaultProfile } from "@/lib/defaults";
import { useApp } from "@/lib/store";

// The length slider is the whole workout (Melvin, 2026-11-14): parts picked on Today take their minutes out of the
// lifting, the adaptive plan is sized to what's left, and a cut cardio is what Start runs.

describe("workout length covers every part", () => {
  beforeEach(async () => {
    localStorage.clear();
    await useApp.getState().reset();
    useApp.setState({ partPicks: {} });
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(Date.now()), onboarded: true, bodyweight: 80, activeGymId: id, minutes: 45 });
    useApp.setState({ ready: true });
  });

  it("gives lifting the whole slider with no other parts", () => {
    expect(useApp.getState().split).toMatchObject({ total: 45, lift: 45, warm: 0, cardio: 0, cool: 0 });
    expect(useApp.getState().preview?.minutes).toBe(45);
  });

  it("sizes the plan to what the warm-up, cardio and cool-down leave", () => {
    const s = useApp.getState();
    s.pickPart("warm", true);
    s.pickPart("cool", true);
    s.pickCardio({ exerciseId: "stationary-bike", minutes: 10 });
    expect(useApp.getState().split).toMatchObject({ total: 45, warm: 5, lift: 25, cardio: 10, cool: 5, cardioCut: 0 });
    expect(useApp.getState().preview?.minutes).toBe(25);
    expect(useApp.getState().preview!.estMinutes).toBeLessThanOrEqual(27);
  });

  it("cuts the cardio so lifting keeps 15 minutes, and Start runs the cut cardio", () => {
    useApp.getState().setProfile({ minutes: 30 });
    useApp.getState().pickCardio({ exerciseId: "stationary-bike", minutes: 30 });
    expect(useApp.getState().split).toMatchObject({ lift: 15, cardio: 15, cardioCut: 15, over: 0 });
    useApp.getState().start();
    const a = useApp.getState().active!;
    expect(a.plan.items.at(-1)).toMatchObject({ exerciseId: "stationary-bike", part: "cardio" });
    expect(a.plan.items.at(-1)!.target.reps).toBe(15 * 60);
  });

  it("gives the time back to lifting when a part is switched off", () => {
    useApp.getState().pickCardio({ exerciseId: "stationary-bike", minutes: 20 });
    expect(useApp.getState().split?.lift).toBe(25);
    useApp.getState().pickPart("cardio", false);
    expect(useApp.getState().split?.lift).toBe(45);
    expect(useApp.getState().preview?.minutes).toBe(45);
  });

  it("doesn't size a saved routine by the slider", () => {
    const now = Date.now();
    useApp.getState().saveRoutine({
      id: "r",
      name: "Mine",
      items: [{ exerciseId: "goblet-squat", sets: 3 }],
      createdAt: now,
      updatedAt: now,
    });
    useApp.getState().pickRoutine("r");
    expect(useApp.getState().split).toBeNull();
  });
});
