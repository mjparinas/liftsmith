import { describe, expect, it } from "vitest";

import { healthAvailable, readHints, strengthKcal } from "./health";
import { chipText, onSessionAction } from "./sessionNotify";

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

  it("keeps the status bar chip short enough to show in full", () => {
    expect(chipText(false, 2, 4)).toBe("2/4");
    expect(chipText(true, 1, 2)).toBe("W1/2");
    // Android shows chip text only when it fits; under 7 characters always does.
    expect(chipText(true, 10, 12).length).toBeLessThan(7);
  });
});
