// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultProfile } from "@/lib/defaults";
import { useApp } from "@/lib/store";

import { VolumeLog } from "./VolumeLog";

// Volume up logs a set (a lab): a press from the phone's plugin logs through the real store.

type Cb = () => void;
let press: Cb = () => {};
const plugin = {
  enable: vi.fn(() => Promise.resolve()),
  disable: vi.fn(() => Promise.resolve()),
  addListener: vi.fn((_e: string, cb: Cb) => {
    press = cb;
    return { remove: () => {} };
  }),
};

describe("VolumeLog", () => {
  beforeEach(async () => {
    (window as unknown as { Capacitor: unknown }).Capacitor = { isNativePlatform: () => true, Plugins: { VolumeKeys: plugin } };
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(Date.now()), onboarded: true, activeGymId: id });
    useApp.getState().start();
    useApp.getState().skipWarmup();
  });
  afterEach(() => {
    delete (window as unknown as { Capacitor?: unknown }).Capacitor;
    vi.useRealTimers();
  });

  const sets = () => useApp.getState().events.filter((e) => e.type === "set");
  const log = () => useApp.getState().logSet();

  it("logs the set on a press, and the next one when pressed during rest", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-12T18:00:00"));
    const { rerender } = render(<VolumeLog setKey="0:0" onLog={log} paused={false} />);
    act(() => press());
    expect(sets()).toHaveLength(1);
    expect(useApp.getState().active?.restUntil).toBeGreaterThan(Date.now());
    rerender(<VolumeLog setKey="0:1" onLog={log} paused={false} />);
    vi.setSystemTime(new Date("2026-11-12T18:00:05"));
    act(() => press());
    expect(sets()).toHaveLength(2);
  });

  it("hands the key back while paused", () => {
    plugin.disable.mockClear();
    const { rerender } = render(<VolumeLog setKey="0:0" onLog={log} paused={false} />);
    rerender(<VolumeLog setKey="0:0" onLog={log} paused />);
    expect(plugin.disable).toHaveBeenCalled();
  });
});
