// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DAY, NOW } from "@/test/factories";

import {
  CHECK_GAP,
  checkForUpdate,
  dismissUpdate,
  dueCheck,
  offerUpdate,
  updateNow,
  useAppUpdate,
  type UpdateInfo,
} from "./appUpdate";

describe("offerUpdate", () => {
  it("offers a newer version", () => {
    expect(offerUpdate({ available: true, version: "20" }, undefined, NOW)).toBe(true);
  });

  it("offers nothing when the store has nothing newer", () => {
    expect(offerUpdate({ available: false }, undefined, NOW)).toBe(false);
  });

  it("a closed note stays closed for that version for a week", () => {
    const dismissed = { version: "20", at: NOW - 6 * DAY };
    expect(offerUpdate({ available: true, version: "20" }, dismissed, NOW)).toBe(false);
    expect(offerUpdate({ available: true, version: "20" }, { ...dismissed, at: NOW - 7 * DAY }, NOW)).toBe(true);
  });

  it("a newer version than the one closed shows at once", () => {
    expect(offerUpdate({ available: true, version: "21" }, { version: "20", at: NOW }, NOW)).toBe(true);
  });

  it("a downloaded update always offers Restart", () => {
    expect(offerUpdate({ available: true, version: "20", downloaded: true }, { version: "20", at: NOW }, NOW)).toBe(true);
  });
});

describe("dueCheck", () => {
  it("asks again on return only after 12 hours", () => {
    expect(dueCheck(undefined, NOW)).toBe(true);
    expect(dueCheck(NOW - CHECK_GAP + 1, NOW)).toBe(false);
    expect(dueCheck(NOW - CHECK_GAP, NOW)).toBe(true);
  });
});

describe("checking the store", () => {
  let info: UpdateInfo;
  const plugin = {
    check: vi.fn(() => Promise.resolve(info)),
    start: vi.fn(() => Promise.resolve({ started: false })),
    complete: vi.fn(() => Promise.resolve()),
    open: vi.fn(() => Promise.resolve()),
  };
  beforeEach(() => {
    localStorage.clear();
    useAppUpdate.setState({ phase: "none", version: "" });
    (window as unknown as { Capacitor: unknown }).Capacitor = { isNativePlatform: () => true, Plugins: { AppUpdate: plugin } };
  });
  afterEach(() => {
    delete (window as unknown as { Capacitor?: unknown }).Capacitor;
    vi.clearAllMocks();
  });

  it("shows the note when the store has a newer version, and remembers when it asked", async () => {
    info = { available: true, version: "20" };
    expect(await checkForUpdate(NOW)).toBe("available");
    expect(useAppUpdate.getState()).toEqual({ phase: "available", version: "20" });
    expect(JSON.parse(localStorage.getItem("liftsmith.appUpdate")!)).toMatchObject({ checkedAt: NOW });
  });

  it("closing it hides that version on the next check", async () => {
    info = { available: true, version: "20" };
    await checkForUpdate(NOW);
    dismissUpdate(NOW);
    expect(useAppUpdate.getState().phase).toBe("none");
    expect(await checkForUpdate(NOW + DAY)).toBe("upToDate");
    expect(useAppUpdate.getState().phase).toBe("none");
  });

  it("a forced check from Settings still offers a version that was closed", async () => {
    info = { available: true, version: "20" };
    await checkForUpdate(NOW);
    dismissUpdate(NOW);
    expect(await checkForUpdate(NOW + DAY, { force: true })).toBe("available");
    expect(useAppUpdate.getState()).toEqual({ phase: "available", version: "20" });
  });

  it("a downloaded update shows Restart", async () => {
    info = { available: true, version: "20", downloaded: true };
    expect(await checkForUpdate(NOW)).toBe("ready");
    expect(useAppUpdate.getState().phase).toBe("ready");
  });

  it("says up to date when the store has nothing newer", async () => {
    info = { available: false };
    expect(await checkForUpdate(NOW)).toBe("upToDate");
    expect(useAppUpdate.getState().phase).toBe("none");
  });

  it("does nothing in a browser", async () => {
    delete (window as unknown as { Capacitor?: unknown }).Capacitor;
    info = { available: true, version: "20" };
    expect(await checkForUpdate(NOW)).toBe("skipped");
    expect(useAppUpdate.getState().phase).toBe("none");
  });

  it("a store that can't be reached shows nothing", async () => {
    plugin.check.mockImplementationOnce(() => Promise.reject(new Error("offline")));
    expect(await checkForUpdate(NOW)).toBe("error");
    expect(useAppUpdate.getState().phase).toBe("none");
  });

  it("Update opens the store page when the store's own update can't start", async () => {
    await updateNow();
    expect(plugin.start).toHaveBeenCalled();
    expect(plugin.open).toHaveBeenCalled();
  });

  it("Update downloads in the background when Play's flow starts", async () => {
    plugin.start.mockImplementationOnce(() => Promise.resolve({ started: true }));
    await updateNow();
    expect(useAppUpdate.getState().phase).toBe("downloading");
    expect(plugin.open).not.toHaveBeenCalled();
  });
});
