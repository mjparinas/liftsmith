// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { DemoSettings } from "./engine";

// A phone with WebGL: the demo starts its loop, and every later change goes through loop.update.
const loop = { update: vi.fn<(s: Partial<DemoSettings>) => void>(), dispose: vi.fn() };
const started: DemoSettings[] = [];
vi.mock("@/lib/webgl", () => ({ probeWebGL: () => "gpu" }));
vi.mock("./scene3d", () => ({ createScene3D: () => ({ dispose: vi.fn() }) }));
vi.mock("./engine", () => ({
  startLoop: (_c: unknown, _s: unknown, settings: DemoSettings) => {
    started.push(settings);
    return loop;
  },
}));

beforeAll(() => {
  // detectMode reads "none" under jsdom's own user agent
  Object.defineProperty(navigator, "userAgent", { value: "Mozilla/5.0 (Linux; Android 15) Chrome/140", configurable: true });
});

describe("the demo after a swap", () => {
  afterEach(cleanup);
  it("plays the new exercise as soon as the exercise changes", async () => {
    const { LiftDemo } = await import("./LiftDemo");
    const { rerender, getByRole } = render(<LiftDemo exerciseId="barbell-row" />);
    await waitFor(() => expect(started).toHaveLength(1));
    expect(started[0]!.exerciseId).toBe("barbell-row");
    rerender(<LiftDemo exerciseId="db-row" />);
    expect(loop.update).toHaveBeenLastCalledWith(expect.objectContaining({ exerciseId: "db-row" }));
    expect(getByRole("img").getAttribute("aria-label")).toMatch(/dumbbell row/i);
    // the same loop carries on; nothing restarts
    expect(started).toHaveLength(1);
  });
});
