// @vitest-environment jsdom
// Camera rep counting on the workout screen: which exercises offer it, the remembered choices (front camera
// by default), counted reps reaching Log set, flipping the camera, and a refused camera saying why.
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cacheFlags, FLAG_CACHE_KEY } from "@/lib/flags";
import type { Keypoint } from "@/lib/reps/pose";
import { imuSamples, sideSquat, simulateSet } from "@/lib/reps/simulate";
import type { MotionReading, PoseEngine } from "@/lib/reps/sources";

import {
  AutoCount,
  AutoCountButton,
  countable,
  countSource,
  formTip,
  loadCountPrefs,
  pathTip,
  saveCountPrefs,
  shownLean,
  type CountPrefs,
} from "./AutoCount";

const motion: { cb?: (r: MotionReading) => void } = {};
const openCamera = vi.fn();
/** The pose model: none (it can't load in tests) unless a test hands one in. */
const model: { engine?: PoseEngine } = {};
/** What the pose model sees. The stage keeps the first model it loads for the whole run, so every test's model
 *  reads from here rather than from a variable of its own. */
const view: { kps?: Keypoint[] } = {};
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
    view.kps = sideSquat(0, 0);
    model.engine = { detect: () => view.kps, close: () => {} };
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
      view.kps = sideSquat(f, rom);
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

describe("bar path replay (its lab)", () => {
  it("words the cue from where the bar drifted, or says it stayed on line", () => {
    expect(pathTip({ reps: 5, maxCm: 9, issue: { kind: "forwardBottom", hit: 3, of: 5, cm: 8 } })).toEqual({
      text: "The bar drifted about 8 cm forward at the bottom on 3 of 5 reps. Keep it over the middle of your foot: brace hard and stay tight at the bottom.",
      issue: true,
    });
    expect(pathTip({ reps: 1, maxCm: 7, issue: { kind: "back", hit: 1, of: 1, cm: 7 } }).text).toMatch(
      /^The bar drifted about 7 cm back\./,
    );
    expect(pathTip({ reps: 4, maxCm: 0 })).toEqual({
      text: "Bar path: it stayed within 1 cm of where it started on those 4 reps.",
      issue: false,
    });
  });

  it("replays a camera-counted squat once it's logged, and clears for the next set", async () => {
    cacheFlags({ labRepCount: true, labBarPath: true });
    let clock = 0;
    // Side-on squats with the feet in view, so the camera knows where the mid-foot is and which way the lifter faces.
    const withFeet = (k: ReturnType<typeof sideSquat>) => {
      k[29] = { x: 0.46, y: 0.92, visibility: 0.9 };
      k[31] = { x: 0.56, y: 0.92, visibility: 0.9 };
      return k;
    };
    view.kps = withFeet(sideSquat(0, 0));
    model.engine = { detect: () => view.kps, close: () => {} };
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
      view.kps = withFeet(sideSquat(f, rom));
      for (const cb of frames.splice(0)) cb(clock);
    };
    act(() => {
      for (let i = 0; i < 30; i++) frame(0, 0);
      for (let r = 0; r < 3; r++) {
        for (let i = 0; i <= 70; i++) frame(Math.sin((Math.PI * i) / 70), 120);
        for (let i = 0; i < 25; i++) frame(0, 0);
      }
    });
    expect(props.onCount).toHaveBeenLastCalledWith(3);
    expect(screen.queryByTestId("bar-path-replay")).toBeNull();
    rerender(<AutoCount {...props} counting={false} setKey="1" />);
    expect(screen.getByTestId("bar-path-replay")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/bar path|the bar drifted/i);
    expect(screen.getByRole("button", { name: /bar path/i })).toBeInTheDocument();
    rerender(<AutoCount {...props} counting setKey="1" />);
    expect(screen.queryByTestId("bar-path-replay")).toBeNull();
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
