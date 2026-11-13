// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api, AuthError, forgetAccount } from "./auth";
import { forgetReads, keepRead, liveRead, MAX_READS, readKept, READS_KEY } from "./liveRead";
import { noteOffline, noteOnline, track, unreachable, useNet, watchNet } from "./net";
import { ACCOUNT_KEY } from "./syncOutbox";

const signIn = (id: string) => localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ id, token: `t-${id}` }));

beforeEach(() => {
  localStorage.clear();
  forgetReads();
  useNet.setState({ busy: 0, offline: false });
  signIn("a");
});
afterEach(() => vi.unstubAllGlobals());

describe("background requests (net.ts)", () => {
  it("counts a request while it's on its way, whether it works or fails", async () => {
    let ok!: () => void;
    let fail!: (e: Error) => void;
    const a = track(new Promise<void>((r) => (ok = r)));
    const b = track(new Promise<void>((_, r) => (fail = r)));
    expect(useNet.getState().busy).toBe(2);
    ok();
    await a;
    expect(useNet.getState().busy).toBe(1);
    fail(new Error("x"));
    await b.catch(() => null);
    expect(useNet.getState().busy).toBe(0);
  });

  it("knows a failure to reach the server from a refusal", () => {
    expect(unreachable(new AuthError("offline"))).toBe(true);
    expect(unreachable(new AuthError("down", 503))).toBe(true);
    expect(unreachable(new AuthError("nope", 403))).toBe(false);
    expect(unreachable(new AuthError("gone", 404))).toBe(false);
    expect(unreachable("offline")).toBe(false);
  });

  it("goes offline when a request can't get out, and back when one gets an answer", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("Failed to fetch")));
    await expect(api("/api/x/")).rejects.toThrow("offline");
    expect(useNet.getState().offline).toBe(true);
    vi.stubGlobal("fetch", () => Promise.resolve(new Response("{}", { status: 500 })));
    await expect(api("/api/x/")).rejects.toThrow();
    expect(useNet.getState().offline).toBe(false);
  });

  it("doesn't wait for a request when the phone says it has no connection", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    await expect(api("/api/x/")).rejects.toThrow("offline");
    expect(fetch).not.toHaveBeenCalled();
    expect(useNet.getState().offline).toBe(true);
    vi.restoreAllMocks();
  });

  it("follows the phone's online and offline events", () => {
    const stop = watchNet();
    window.dispatchEvent(new Event("offline"));
    expect(useNet.getState().offline).toBe(true);
    window.dispatchEvent(new Event("online"));
    expect(useNet.getState().offline).toBe(false);
    stop();
    window.dispatchEvent(new Event("offline"));
    expect(useNet.getState().offline).toBe(false);
    noteOffline();
    noteOnline();
    expect(useNet.getState().offline).toBe(false);
  });
});

describe("a screen's last copy (liveRead)", () => {
  it("shows the kept copy at once, then the server's answer, and keeps that", async () => {
    keepRead("coach.overview", { n: 1 });
    const shown: [unknown, boolean][] = [];
    const going = liveRead(
      "coach.overview",
      () => Promise.resolve({ n: 2 }),
      (d, fresh) => shown.push([d, fresh]),
    );
    expect(shown).toEqual([[{ n: 1 }, false]]);
    expect(useNet.getState().busy).toBe(1);
    await going;
    expect(shown).toEqual([
      [{ n: 1 }, false],
      [{ n: 2 }, true],
    ]);
    expect(readKept("coach.overview")).toEqual({ n: 2 });
    expect(useNet.getState().busy).toBe(0);
  });

  it("keeps showing the copy when the server can't be reached", async () => {
    keepRead("teams", ["kept"]);
    const shown: unknown[] = [];
    await liveRead(
      "teams",
      () => Promise.reject(new AuthError("offline")),
      (d) => shown.push(d),
    );
    expect(shown).toEqual([["kept"]]);
  });

  it("still says so when the server refuses, or when there's no copy to fall back on", async () => {
    keepRead("coach.client.c1", { id: "c1" });
    await expect(
      liveRead(
        "coach.client.c1",
        () => Promise.reject(new AuthError("gone", 404)),
        () => undefined,
      ),
    ).rejects.toThrow("gone");
    await expect(
      liveRead(
        "never",
        () => Promise.reject(new AuthError("offline")),
        () => undefined,
      ),
    ).rejects.toThrow("offline");
  });

  it("keeps each account's copies apart, and forgets them on sign-out", async () => {
    keepRead("share.links", ["a's link"]);
    signIn("b");
    expect(readKept("share.links")).toBeUndefined();
    signIn("a");
    expect(readKept("share.links")).toEqual(["a's link"]);
    forgetAccount();
    expect(localStorage.getItem(READS_KEY)).toBeNull();
    signIn("a");
    expect(readKept("share.links")).toBeUndefined();
  });

  it("doesn't keep an answer for an account that signed out while it was on its way", async () => {
    let answer!: (v: string) => void;
    const going = liveRead(
      "teams",
      () => new Promise<string>((r) => (answer = r)),
      () => undefined,
    );
    localStorage.removeItem(ACCOUNT_KEY);
    answer("late");
    await going;
    signIn("a");
    forgetReads();
    expect(readKept("teams")).toBeUndefined();
  });

  it("keeps only the newest copies", () => {
    for (let i = 0; i < MAX_READS + 5; i++) keepRead(`k${i}`, i, 1000 + i);
    const saved = JSON.parse(localStorage.getItem(READS_KEY) ?? "{}") as { parts: Record<string, unknown> };
    expect(Object.keys(saved.parts)).toHaveLength(MAX_READS);
    expect(saved.parts.k0).toBeUndefined();
    expect(saved.parts[`k${MAX_READS + 4}`]).toBeDefined();
  });

  it("survives a relaunch (the copy is read back from the device)", () => {
    keepRead("gyms.owned", [{ id: "g1" }]);
    forgetReadsInMemoryOnly();
    expect(readKept("gyms.owned")).toEqual([{ id: "g1" }]);
  });
});

/** A relaunch: memory is gone, the device's copy stays. */
function forgetReadsInMemoryOnly() {
  const saved = localStorage.getItem(READS_KEY);
  forgetReads();
  if (saved) localStorage.setItem(READS_KEY, saved);
}
