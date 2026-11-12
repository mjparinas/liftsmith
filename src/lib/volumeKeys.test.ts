// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { onVolumePress, PRESS_GAP_MS, takePress, volumeKeysSupported } from "./volumeKeys";

type Cb = (d: { from?: string }) => void;

function fakePlugin(android = true) {
  let cb: Cb | null = null;
  const remove = vi.fn();
  const p = {
    enable: vi.fn(() => Promise.resolve()),
    disable: vi.fn(() => Promise.resolve()),
    // Android's bridge hands back the handle itself, iOS a promise of it (nativeListen.ts).
    addListener: vi.fn((_e: string, f: Cb) => {
      cb = f;
      return android ? { remove } : Promise.resolve({ remove });
    }),
  };
  (window as unknown as { Capacitor: unknown }).Capacitor = { isNativePlatform: () => true, Plugins: { VolumeKeys: p } };
  return { p, remove, press: () => cb?.({ from: "phone" }) };
}

afterEach(() => {
  delete (window as unknown as { Capacitor?: unknown }).Capacitor;
});

describe("takePress", () => {
  it("takes the first press and ones after the gap, not ones inside it", () => {
    expect(takePress(1000, null)).toBe(true);
    expect(takePress(1000 + PRESS_GAP_MS - 1, 1000)).toBe(false);
    expect(takePress(1000 + PRESS_GAP_MS, 1000)).toBe(true);
  });
});

describe("onVolumePress", () => {
  it("does nothing on the web", () => {
    expect(volumeKeysSupported()).toBe(false);
    const off = onVolumePress(() => {});
    expect(() => off()).not.toThrow();
  });

  it("enables the plugin, passes presses on once per gap, and hands the key back when stopped", async () => {
    const { p, remove, press } = fakePlugin();
    let now = 5000;
    const cb = vi.fn();
    const off = onVolumePress(cb, () => now);
    expect(volumeKeysSupported()).toBe(true);
    expect(p.enable).toHaveBeenCalledOnce();
    press();
    now += 200;
    press(); // the same press, seen twice
    now += PRESS_GAP_MS;
    press();
    expect(cb).toHaveBeenCalledTimes(2);
    off();
    await Promise.resolve();
    await Promise.resolve();
    expect(remove).toHaveBeenCalledOnce();
    expect(p.disable).toHaveBeenCalledOnce();
  });

  it("unsubscribes from a promised handle too (iOS)", async () => {
    const { remove } = fakePlugin(false);
    const off = onVolumePress(() => {});
    off();
    await new Promise((r) => setTimeout(r, 0));
    expect(remove).toHaveBeenCalledOnce();
  });
});
