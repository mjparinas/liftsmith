// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { saveWorkout } from "./health";

// The health plugin and Capacitor, as on a phone.
const saveSample = vi.fn(async () => undefined);
vi.mock("@capgo/capacitor-health", () => ({
  Health: { isAvailable: async () => ({ available: true }), saveSample },
}));
let os = "android";
vi.mock("@capacitor/core", () => ({ Capacitor: { getPlatform: () => os } }));

const save = vi.fn(async (_o: unknown) => ({ saved: true }));
const W = {
  id: "s1",
  start: 1_000_000,
  end: 1_000_000 + 45 * 60_000,
  bodyweightKg: 80,
  avgHr: 120,
  title: "Strength training",
  notes: "Bench",
};

beforeEach(() => {
  saveSample.mockClear();
  save.mockClear();
  (window as unknown as { Capacitor: unknown }).Capacitor = {
    isNativePlatform: () => true,
    getPlatform: () => os,
    Plugins: { HealthWorkout: { save, status: async () => ({ granted: true }), request: async () => ({ granted: true }) } },
  };
});
afterEach(() => {
  delete (window as unknown as { Capacitor?: unknown }).Capacitor;
});

describe("saving a finished workout to Health", () => {
  it("Android: an exercise session, plus calories and heart rate as their own records", async () => {
    os = "android";
    await saveWorkout(W);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "s1", title: "Strength training", notes: "Bench", kcal: 300, avgHr: 120 }),
    );
    expect(saveSample.mock.calls.map((c) => (c as unknown as [{ dataType: string }])[0].dataType)).toEqual(["calories", "heartRate"]);
  });

  it("iOS: calories and heart rate go inside the workout, so they aren't counted twice", async () => {
    os = "ios";
    await saveWorkout(W);
    expect(save).toHaveBeenCalledOnce();
    expect(saveSample).not.toHaveBeenCalled();
  });

  it("without the workout permission, still writes calories and heart rate", async () => {
    os = "ios";
    save.mockResolvedValueOnce({ saved: false });
    await saveWorkout(W);
    expect(saveSample).toHaveBeenCalledTimes(2);
  });
});
