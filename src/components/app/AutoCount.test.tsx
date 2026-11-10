// @vitest-environment jsdom
// Camera rep counting on the workout screen: which exercises offer it, the remembered choices (front camera
// by default), counted reps reaching Log set, flipping the camera, and a refused camera saying why.
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cacheFlags, FLAG_CACHE_KEY } from "@/lib/flags";
import { imuSamples, simulateSet } from "@/lib/reps/simulate";
import type { MotionReading } from "@/lib/reps/sources";

import { AutoCount, AutoCountButton, countable, loadCountPrefs, saveCountPrefs, type CountPrefs } from "./AutoCount";

const motion: { cb?: (r: MotionReading) => void } = {};
const openCamera = vi.fn();
vi.mock("@/lib/reps/sources", () => ({
  openCamera: (...a: unknown[]) => openCamera(...a),
  loadPose: () => Promise.reject(new Error("no network in tests")),
  startMotion: async (cb: (r: MotionReading) => void) => {
    motion.cb = cb;
    return () => (motion.cb = undefined);
  },
}));

beforeEach(() => {
  localStorage.clear();
  openCamera.mockReset();
});
afterEach(cleanup);

describe("which exercises can be counted", () => {
  it("counts lifts with a clear joint movement, not holds", () => {
    expect(countable("back-squat", "squat")).toBe(true);
    expect(countable("bench-press", "hpush")).toBe(true);
    expect(countable("plank", "core")).toBe(false);
  });
});

describe("remembered choices", () => {
  it("starts off, with the front camera", () => {
    expect(loadCountPrefs()).toEqual({ on: false, facing: "user", source: "camera" });
    saveCountPrefs({ on: true, facing: "environment", source: "camera" });
    expect(loadCountPrefs()).toEqual({ on: true, facing: "environment", source: "camera" });
  });

  it("only uses phone motion while the repMotion flag is on", () => {
    saveCountPrefs({ on: true, facing: "user", source: "motion" });
    expect(loadCountPrefs().source).toBe("camera");
    cacheFlags({ repMotion: true });
    expect(loadCountPrefs().source).toBe("motion");
    localStorage.removeItem(FLAG_CACHE_KEY);
  });
});

function stage(over: Partial<Parameters<typeof AutoCount>[0]> = {}) {
  const props = {
    exerciseId: "back-squat",
    pattern: "squat" as const,
    body: "male" as const,
    prefs: { on: true, facing: "user", source: "camera" } as CountPrefs,
    onPrefs: vi.fn(),
    counting: true,
    setKey: "0",
    onCount: vi.fn(),
    onClose: vi.fn(),
    ...over,
  };
  return { props, ...render(<AutoCount {...props} />) };
}

describe("the counting stage", () => {
  it("opens the front camera first, and the flip button switches to the back one", async () => {
    openCamera.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    const { props } = stage();
    expect(openCamera).toHaveBeenCalledWith(expect.anything(), "user");
    expect(screen.getByRole("status")).toHaveTextContent("Opening the camera");
    await user.click(screen.getByRole("button", { name: "Use the back camera" }));
    expect(props.onPrefs).toHaveBeenCalledWith({ on: true, facing: "environment", source: "camera" });
    await user.click(screen.getByRole("button", { name: "Stop counting reps" }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("says how to fix a refused camera", async () => {
    openCamera.mockRejectedValue(new DOMException("denied", "NotAllowedError"));
    stage();
    expect(await screen.findByRole("alert")).toHaveTextContent("Camera access is off");
  });

  it("fills in the reps as they're counted (phone motion, behind its flag)", async () => {
    cacheFlags({ repMotion: true });
    const { props } = stage({ prefs: { on: true, facing: "user", source: "motion" } });
    await act(async () => {});
    expect(motion.cb).toBeDefined();
    const sim = simulateSet(["full", "full", "full"], 11);
    act(() => {
      for (const x of imuSamples(sim, 12, { romM: 0.5, downFirst: true }))
        motion.cb!({ t: x.t, fused: { up: x.up, rot: x.rot }, raw: [x.x, x.y, x.z] });
    });
    expect(props.onCount).toHaveBeenLastCalledWith(3);
    expect(screen.getByText("3")).toBeInTheDocument();
    localStorage.removeItem(FLAG_CACHE_KEY);
  });

  it("doesn't count while resting", async () => {
    cacheFlags({ repMotion: true });
    const { props } = stage({ prefs: { on: true, facing: "user", source: "motion" }, counting: false });
    await act(async () => {});
    const sim = simulateSet(["full", "full"], 11);
    act(() => {
      for (const x of imuSamples(sim, 12, { romM: 0.5, downFirst: true }))
        motion.cb!({ t: x.t, fused: { up: x.up, rot: x.rot }, raw: [x.x, x.y, x.z] });
    });
    expect(props.onCount).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Resting");
    localStorage.removeItem(FLAG_CACHE_KEY);
  });
});

describe("the switch", () => {
  it("shows whether counting is on", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<AutoCountButton on={false} onToggle={onToggle} />);
    const b = screen.getByRole("button", { name: "Count reps with the camera" });
    expect(b).toHaveAttribute("aria-pressed", "false");
    await user.click(b);
    expect(onToggle).toHaveBeenCalled();
  });

  it("is marked Pro when locked", () => {
    render(<AutoCountButton on={false} locked onToggle={() => {}} />);
    const b = screen.getByRole("button", { name: "Count reps with the camera, a Pro feature: see Pro" });
    expect(b).not.toHaveAttribute("aria-pressed");
    expect(b).toHaveTextContent("Pro");
  });
});
