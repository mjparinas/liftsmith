// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { unlisten } from "./nativeListen";
import { onSessionAction, onWatchHeartRate } from "./sessionNotify";

type W = { Capacitor?: unknown };

afterEach(() => {
  delete (window as W).Capacitor;
});

/** A phone's WorkoutSession plugin whose addListener returns what Android's bridge returns: the handle itself. */
function androidPlugin() {
  const remove = vi.fn(async () => {});
  (window as W).Capacitor = {
    isNativePlatform: () => true,
    Plugins: { WorkoutSession: { addListener: vi.fn(() => ({ remove })) } },
  };
  return remove;
}

describe("native listeners unsubscribe on Android and iOS alike", () => {
  it("leaving the workout screen on Android doesn't throw 'then is not a function' (the Today crash)", async () => {
    const remove = androidPlugin();
    const offHr = onWatchHeartRate(() => {});
    const offAction = onSessionAction(() => {});
    expect(() => {
      offHr();
      offAction();
    }).not.toThrow();
    await vi.waitFor(() => expect(remove).toHaveBeenCalledTimes(2));
  });

  it("removes a handle given as a promise (iOS, registerPlugin) too", async () => {
    const remove = vi.fn(async () => {});
    unlisten(Promise.resolve({ remove }))();
    await vi.waitFor(() => expect(remove).toHaveBeenCalledOnce());
  });

  it("does nothing when there was no listener", () => {
    expect(() => unlisten(undefined)()).not.toThrow();
  });
});
