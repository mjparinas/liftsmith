import { describe, expect, it } from "vitest";

import { healthAvailable, readHints, strengthKcal } from "./health";
import { onSessionAction } from "./sessionNotify";

describe("native wrappers on the web", () => {
  it("estimates strength-training calories at about 5 METs", () => {
    expect(strengthKcal(3600, 80)).toBe(400);
    expect(strengthKcal(1800, 70)).toBe(175);
    expect(strengthKcal(0, 80)).toBe(0);
  });

  it("treats Health as unavailable outside the native shell", async () => {
    expect(await healthAvailable()).toBe(false);
    expect(await readHints()).toEqual({});
  });

  it("returns a harmless unsubscribe when there is no native notification", () => {
    const off = onSessionAction(() => {});
    expect(off).toBeTypeOf("function");
    expect(() => off()).not.toThrow();
  });
});
