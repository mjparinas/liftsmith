// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { imuSamples, simulateSet } from "@/lib/reps/simulate";

import { useWatchReps } from "./useWatchReps";

type W = { Capacitor?: unknown };
type Cb = (e: unknown) => void;

afterEach(() => {
  delete (window as W).Capacitor;
});

/** A phone whose watch app sends motion batches through the WorkoutSession plugin's "watchMotion" event. */
function phone() {
  const listeners = new Set<Cb>();
  (window as W).Capacitor = {
    isNativePlatform: () => true,
    Plugins: {
      WorkoutSession: {
        addListener: (event: string, cb: Cb) => {
          if (event === "watchMotion") listeners.add(cb);
          return { remove: async () => void listeners.delete(cb) };
        },
      },
    },
  };
  return { send: (b: unknown) => listeners.forEach((cb) => cb(b)), listeners };
}

/** Five simulated squats, packed in batches of 12 readings like the watch apps send. */
function squatBatches() {
  const xs = imuSamples(simulateSet(["full", "full", "full", "full", "full"], 11), 12, { romM: 0.5, downFirst: true });
  const out: { t: number; s: number[] }[] = [];
  for (let i = 0; i < xs.length; i += 12) {
    const part = xs.slice(i, i + 12);
    const t = 1_700_000_000_000 + part[0]!.t;
    out.push({ t, s: part.flatMap((x) => [1_700_000_000_000 + x.t - t, x.up, x.rot]) });
  }
  return out;
}

describe("useWatchReps", () => {
  it("fills in the reps the watch counts during a set", () => {
    const w = phone();
    const onCount = vi.fn();
    const { result } = renderHook(() => useWatchReps({ on: true, exerciseId: "back-squat", pattern: "squat", setKey: "0:0", onCount }));
    expect(result.current).toBeNull();
    act(() => squatBatches().forEach(w.send));
    expect(result.current).toBe(5);
    expect(onCount).toHaveBeenLastCalledWith(5);
  });

  it("starts a fresh count for the next set", () => {
    const w = phone();
    const onCount = vi.fn();
    const { result, rerender } = renderHook(
      ({ setKey }) => useWatchReps({ on: true, exerciseId: "back-squat", pattern: "squat", setKey, onCount }),
      {
        initialProps: { setKey: "0:0" },
      },
    );
    act(() => squatBatches().forEach(w.send));
    rerender({ setKey: "0:1" });
    expect(result.current).toBeNull();
  });

  it("doesn't listen while off, or for a lift the wrist doesn't move in", () => {
    const w = phone();
    renderHook(() => useWatchReps({ on: false, exerciseId: "back-squat", pattern: "squat", setKey: "0", onCount: () => {} }));
    renderHook(() => useWatchReps({ on: true, exerciseId: "pull-up", pattern: "vpull", setKey: "0", onCount: () => {} }));
    expect(w.listeners.size).toBe(0);
  });
});
