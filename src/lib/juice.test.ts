import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { feel, haptic, oops, sound } from "./juice";

type Call = [string, unknown];

function fakeNative() {
  const calls: Call[] = [];
  const rec = (name: string) => (a?: unknown) => {
    calls.push([name, a]);
    return Promise.resolve();
  };
  vi.stubGlobal("window", {
    Capacitor: {
      isNativePlatform: () => true,
      Plugins: { Haptics: { impact: rec("impact"), notification: rec("notification"), selectionChanged: rec("selection") } },
    },
  });
  return calls;
}

beforeEach(() => {
  vi.useFakeTimers();
  feel.haptics = true;
  feel.sound = true;
  feel.calm = false;
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("haptic vocabulary", () => {
  it("maps each kind to the native haptic it promises", () => {
    const calls = fakeNative();
    haptic("select");
    haptic("tick");
    haptic("toggle");
    haptic("thud");
    haptic("error");
    expect(calls).toEqual([
      ["selection", undefined],
      ["impact", { style: "LIGHT" }],
      ["impact", { style: "MEDIUM" }],
      ["impact", { style: "HEAVY" }],
      ["notification", { type: "ERROR" }],
    ]);
  });

  it("a double tap is two crisp taps, and celebrate adds a success after it", () => {
    const calls = fakeNative();
    haptic("celebrate");
    vi.runAllTimers();
    expect(calls).toEqual([
      ["impact", { style: "MEDIUM" }],
      ["impact", { style: "MEDIUM" }],
      ["notification", { type: "SUCCESS" }],
    ]);
  });

  it("does nothing with Vibration off", () => {
    const calls = fakeNative();
    feel.haptics = false;
    haptic("toggle");
    oops();
    vi.runAllTimers();
    expect(calls).toEqual([]);
  });

  it("falls back to navigator.vibrate on the web", () => {
    const vibrate = vi.fn();
    vi.stubGlobal("navigator", { vibrate });
    haptic("double");
    haptic("toggle");
    expect(vibrate).toHaveBeenNthCalledWith(1, [22, 70, 22]);
    expect(vibrate).toHaveBeenNthCalledWith(2, 14);
  });
});

describe("new sounds", () => {
  it("never throw without Web Audio", () => {
    expect(() => {
      sound.toggle(true);
      sound.toggle(false);
      sound.pop();
      sound.error();
      sound.done();
    }).not.toThrow();
  });
});
