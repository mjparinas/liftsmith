// @vitest-environment jsdom
// Camera rep counting on the workout screen: which exercises offer it, the remembered choices (front camera
// by default), counted reps reaching Log set, flipping the camera, and a refused camera saying why.
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cacheFlags, FLAG_CACHE_KEY } from "@/lib/flags";
import { imuSamples, sideSquat, simulateSet } from "@/lib/reps/simulate";
import type { MotionReading, PoseEngine } from "@/lib/reps/sources";

import {
  AutoCount,
  AutoCountButton,
  countable,
  countSource,
  formTip,
  loadCountPrefs,
  saveCountPrefs,
  shownLean,
  type CountPrefs,
} from "./AutoCount";

const motion: { cb?: (r: MotionReading) => void } = {};
const openCamera = vi.fn();
/** The pose model: none (it can't load in tests) unless a test hands one in. */
const model: { engine?: PoseEngine } = {};
vi.mock("@/lib/reps/sources", () => ({
  openCamera: (...a: unknown[]) => openCamera(...a),
  loadPose: () => (model.engine ? Promise.resolve(model.engine) : Promise.reject(new Error("no network in tests"))),
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

  it("only uses phone motion while the phone motion lab is on", () => {
    saveCountPrefs({ on: true, facing: "user", source: "motion" });
    expect(loadCountPrefs().source).toBe("camera");
    cacheFlags({ labRepCount: true, repMotion: true });
    expect(loadCountPrefs().source).toBe("motion");
    localStorage.removeItem(FLAG_CACHE_KEY);
  });

  it("counts with phone motion on its own, without the camera lab", () => {
    expect(countSource("camera")).toBeNull();
    cacheFlags({ repMotion: true });
    expect(countSource("camera")).toBe("motion");
    saveCountPrefs({ on: true, facing: "user", source: "camera" });
    expect(loadCountPrefs().source).toBe("motion");
    cacheFlags({ labRepCount: true, repMotion: false });
    expect(countSource("motion")).toBe("camera");
    cacheFlags({ labRepCount: true, repMotion: true });
    expect(countSource("camera")).toBe("camera");
    expect(countSource("motion")).toBe("motion");
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
    cacheFlags({ labRepCount: true, repMotion: true });
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

  it("shows bar speed and when to end the set (camera bar speed lab)", async () => {
    cacheFlags({ labRepCount: true, repMotion: true, labBarSpeed: true });
    stage({ prefs: { on: true, facing: "user", source: "motion" } });
    await act(async () => {});
    expect(screen.getByTestId("bar-speed")).toHaveTextContent("–");
    const sim = simulateSet(["full", "full", "full", "full"], 11);
    act(() => {
      for (const x of imuSamples(sim, 12, { romM: 0.5, downFirst: true }))
        motion.cb!({ t: x.t, fused: { up: x.up, rot: x.rot }, raw: [x.x, x.y, x.z] });
    });
    expect(screen.getByTestId("bar-speed")).toHaveTextContent(/m\/s|% of best/);
    expect(screen.getByRole("status")).toHaveTextContent(/end the set|left in the tank/);
    expect(screen.getByRole("button", { name: /bar speed/i })).toBeInTheDocument();
    localStorage.removeItem(FLAG_CACHE_KEY);
  });

  it("shows no bar speed without its lab", async () => {
    cacheFlags({ labRepCount: true, repMotion: true });
    stage({ prefs: { on: true, facing: "user", source: "motion" } });
    await act(async () => {});
    expect(screen.queryByTestId("bar-speed")).toBeNull();
    localStorage.removeItem(FLAG_CACHE_KEY);
  });

  it("doesn't count while resting", async () => {
    cacheFlags({ labRepCount: true, repMotion: true });
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

describe("camera form check (its lab)", () => {
  it("words the tip from the set's main issue, or says the set was clean", () => {
    expect(formTip({ reps: 5, issues: [{ kind: "depth", hit: 3, of: 5, reach: 0.7 }] }).text).toBe(
      "3 of 5 reps stopped above parallel. Sit until your hips are level with your knees, and lighten the bar if you need to.",
    );
    expect(formTip({ reps: 1, issues: [{ kind: "depth", hit: 1, of: 1 }] }).text).toMatch(/^Your rep stopped above parallel/);
    expect(formTip({ reps: 4, issues: [{ kind: "lean", hit: 2, of: 4, side: "left", deg: 9 }] }).text).toMatch(
      /^You leaned about 9° to your left on 2 of 4 reps/,
    );
    expect(formTip({ reps: 4, issues: [] })).toEqual({ text: "Form check: nothing to fix on those 4 reps." });
  });

  it("tips the figure the way the lifter leaned, enough to see", () => {
    expect(shownLean({ kind: "lean", hit: 2, of: 4, side: "left", deg: 4 })).toBe(-8);
    expect(shownLean({ kind: "lean", hit: 2, of: 4, side: "right", deg: 30 })).toBe(15);
    expect(shownLean({ kind: "depth", hit: 2, of: 4 })).toBe(0);
    expect(shownLean(undefined)).toBe(0);
  });

  it("watches a set of squats through the camera and gives the tip once it's logged", async () => {
    cacheFlags({ labRepCount: true, labFormCheck: true });
    // A camera that plays, a pose model that sees a side-on squat, and frames that run when the test says.
    let clock = 0;
    let kps = sideSquat(0, 0);
    model.engine = { detect: () => kps, close: () => {} };
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => frames.push(cb));
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    vi.spyOn(performance, "now").mockImplementation(() => clock);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    openCamera.mockImplementation(async (v: HTMLVideoElement) => {
      Object.defineProperties(v, {
        readyState: { get: () => 4 },
        currentTime: { get: () => clock },
        videoWidth: { get: () => 480 },
        videoHeight: { get: () => 480 },
      });
      return { getTracks: () => [] };
    });
    const { props, rerender } = stage();
    await act(async () => {});
    const frame = (f: number, rom: number) => {
      clock += 33;
      kps = sideSquat(f, rom);
      for (const cb of frames.splice(0)) cb(clock);
    };
    act(() => {
      for (let i = 0; i < 30; i++) frame(0, 0);
      for (const rom of [120, 75, 75, 120]) {
        for (let i = 0; i <= 70; i++) frame(Math.sin((Math.PI * i) / 70), rom);
        for (let i = 0; i < 25; i++) frame(0, 0);
      }
    });
    // The two shallow ones are short of the set's deepest, so they don't count as full reps either.
    expect(props.onCount).toHaveBeenLastCalledWith(2);
    rerender(<AutoCount {...props} counting={false} setKey="1" />);
    expect(screen.getByRole("status")).toHaveTextContent("2 of 4 reps stopped above parallel");
    expect(screen.getByRole("button", { name: /form check/i })).toBeInTheDocument();
    // The next set starts clean.
    rerender(<AutoCount {...props} counting setKey="1" />);
    expect(screen.getByRole("status")).not.toHaveTextContent("parallel");
    model.engine = undefined;
    vi.restoreAllMocks();
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
});
