// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetDb } from "@/server/db";
import { sync as serverSync, type SyncRequest } from "@/server/sync";

import { forgetAccount, methods, useAccount } from "./auth";
import { defaultProfile, makeGym } from "./defaults";
import { useApp } from "./store";
import { localRecords, mergeRecords, pickBatch, syncNow } from "./sync";
import { ACCOUNT_KEY, emptySync, noteEvents, readSync, writeSync } from "./syncOutbox";
import type { AppEvent, Gym } from "./types";

const profile = (over = {}) => ({ ...defaultProfile(1000), onboarded: true, activeGymId: "g1", updatedAt: 1000, ...over });
const gym = (id: string, updatedAt = 1000): Gym => ({ ...makeGym("commercial", "kg", id), updatedAt });
const set = (id: string, at = 5000): AppEvent => ({
  type: "set",
  id,
  at,
  sessionId: "s",
  exerciseId: "back-squat",
  weight: 100,
  reps: 5,
  targetReps: 5,
  rir: 2,
});

describe("merging records", () => {
  it("takes the newer profile, and the account's on a first sync", () => {
    expect(
      mergeRecords(profile(), [], [{ key: "profile", value: profile({ name: "Old", updatedAt: 500 }), updatedAt: 500 }], false).profile,
    ).toBeNull();
    expect(
      mergeRecords(profile(), [], [{ key: "profile", value: profile({ name: "Old", updatedAt: 500 }), updatedAt: 500 }], true).profile
        ?.name,
    ).toBe("Old");
    expect(
      mergeRecords(profile(), [], [{ key: "profile", value: profile({ name: "New", updatedAt: 2000 }), updatedAt: 2000 }], false).profile
        ?.name,
    ).toBe("New");
  });

  it("never lets an account profile that skipped setup replace a set-up one, and never sends one", () => {
    const half = { key: "profile", value: profile({ name: "Half", onboarded: false, updatedAt: 9000 }), updatedAt: 9000 };
    expect(mergeRecords(profile(), [], [half], true).profile).toBeNull();
    expect(mergeRecords(profile({ onboarded: false }), [], [half], true).profile?.name).toBe("Half");
    expect(localRecords(profile({ onboarded: false }), [gym("g1")], [], 1).map((r) => r.key)).toEqual(["gym:g1"]);
  });

  it("gives a device stuck in setup the account's set-up profile, even when its own half-made one is newer", () => {
    const real = { key: "profile", value: profile({ name: "Real", updatedAt: 1000 }), updatedAt: 1000 };
    expect(mergeRecords(profile({ onboarded: false, updatedAt: 9000 }), [], [real], false).profile?.name).toBe("Real");
  });

  it("adds, updates and removes gyms, and keeps the active gym real", () => {
    const p = profile({ activeGymId: "g1" });
    const r = mergeRecords(
      p,
      [gym("g1"), gym("g2")],
      [
        { key: "gym:g1", value: null, updatedAt: 3000 },
        { key: "gym:g2", value: { ...gym("g2"), name: "Renamed" }, updatedAt: 3000 },
        { key: "gym:g3", value: gym("g3"), updatedAt: 1 },
      ],
      false,
      9000,
    );
    expect(r.gyms?.map((g) => g.id)).toEqual(["g2", "g3"]);
    expect(r.gyms?.[0].name).toBe("Renamed");
    expect(r.known).toEqual(["g2", "g3"]);
    expect(r.profile?.activeGymId).toBe("g2");
    expect(r.fixed).toBe(true);
  });

  it("sends a removal for a gym the account had and this device dropped", () => {
    const recs = localRecords(profile(), [gym("g2")], ["g1", "g2"], 7000);
    expect(recs.map((r) => [r.key, r.value === null])).toEqual([
      ["profile", false],
      ["gym:g2", false],
      ["gym:g1", true],
    ]);
  });

  it("batches the outbox and skips events deleted since", () => {
    const evs = Array.from({ length: 600 }, (_, i) => set(`e${i}`));
    const b = pickBatch(["gone", ...evs.map((e) => e.id)], evs);
    expect(b.send.length).toBe(500);
    expect(b.ids[0]).toBe("gone");
  });
});

describe("which sign-in buttons show", () => {
  it("offers Apple on iOS always and on the web with a Services ID; Google with its client ids; email everywhere", () => {
    const none = { googleWeb: "", googleIos: "", appleServices: "" };
    const all = { googleWeb: "w", googleIos: "i", appleServices: "s" };
    expect(methods("android", none)).toEqual(["email"]);
    expect(methods("android", all)).toEqual(["google", "email"]);
    expect(methods("ios", none)).toEqual(["apple", "email"]);
    expect(methods("ios", all)).toEqual(["apple", "google", "email"]);
    expect(methods("web", all)).toEqual(["apple", "google", "email"]);
  });
});

describe("syncing the app with the server", () => {
  let session = "this-device";
  beforeEach(async () => {
    await resetDb();
    localStorage.clear();
    forgetAccount();
    session = "this-device";
    // The app's fetch goes straight to the server's sync, as this device.
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as SyncRequest;
      return new Response(JSON.stringify(await serverSync("acc", session, body)), { status: 200 });
    });
    useApp.setState({ ready: true, events: [], profile: profile(), gyms: [gym("g1")] });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("queues nothing while signed out", () => {
    noteEvents(["x"]);
    expect(readSync().out).toEqual([]);
  });

  it("pushes this device's events and profile, and pulls another device's", async () => {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ token: "t", id: "acc", email: null, providers: [], via: "email" }));
    useAccount.setState({ account: { token: "t", id: "acc", email: null, providers: [], via: "email" } });
    writeSync({ ...emptySync(), out: ["mine"] });
    useApp.setState({ events: [set("mine")] });
    await syncNow();
    expect(readSync().out).toEqual([]);
    expect(readSync().first).toBe(false);
    // Another device logs a set and deletes nothing; this one pulls it.
    await serverSync("acc", "phone", {
      cursor: 0,
      events: [set("theirs") as never],
      deleted: [],
      records: [{ key: "profile", value: profile({ name: "Melvin", updatedAt: 9000 }), updatedAt: 9000 }],
      first: false,
    });
    await syncNow();
    expect(
      useApp
        .getState()
        .events.map((e) => e.id)
        .sort(),
    ).toEqual(["mine", "theirs"]);
    expect(useApp.getState().profile.name).toBe("Melvin");
    // A change pulled from elsewhere isn't queued to go back.
    expect(readSync().out).toEqual([]);
    // A delete there removes it here.
    await serverSync("acc", "phone", { cursor: 0, events: [], deleted: ["theirs"], records: [], first: false });
    await syncNow();
    expect(useApp.getState().events.map((e) => e.id)).toEqual(["mine"]);
  });

  it("pushes workouts logged before signing in, once", async () => {
    // Logged while signed out: nothing is queued.
    useApp.setState({ events: [set("before-1"), set("before-2")] });
    noteEvents(["before-1", "before-2"]);
    // Signing in starts sync from scratch (as signedInAs does).
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ token: "t", id: "acc", email: null, providers: [], via: "email" }));
    writeSync(emptySync());
    await syncNow();
    expect(readSync().out).toEqual([]);
    const other = await serverSync("acc", "web", { cursor: 0, events: [], deleted: [], records: [], first: true });
    expect(other.events.map((e) => (e as AppEvent).id).sort()).toEqual(["before-1", "before-2"]);
    // A second sync doesn't send them again.
    let sent = 0;
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as SyncRequest;
      sent += body.events.length;
      return new Response(JSON.stringify(await serverSync("acc", session, body)), { status: 200 });
    });
    await syncNow();
    expect(sent).toBe(0);
  });

  it("pushes the whole history once from a device that signed in before history was queued", async () => {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ token: "t", id: "acc", email: null, providers: [], via: "email" }));
    // Sync state saved by an older app: already synced, no `seeded` field.
    const old: Partial<ReturnType<typeof emptySync>> = { ...emptySync(), first: false };
    delete old.seeded;
    localStorage.setItem("liftsmith.sync", JSON.stringify(old));
    useApp.setState({ events: [set("old-1")] });
    await syncNow();
    const other = await serverSync("acc", "web", { cursor: 0, events: [], deleted: [], records: [], first: true });
    expect(other.events.map((e) => (e as AppEvent).id)).toEqual(["old-1"]);
  });

  it("keeps the account's set-up profile when a new install signs in before setup, even from an older app", async () => {
    await serverSync("acc", "phone", {
      cursor: 0,
      events: [],
      deleted: [],
      records: [{ key: "profile", value: profile({ name: "Melvin", updatedAt: 1000 }), updatedAt: 1000 }],
      first: true,
    });
    // An older app pushed its welcome-screen profile (not set up, newer) as an ordinary record: the server drops it.
    await serverSync("acc", "web", {
      cursor: 0,
      events: [],
      deleted: [],
      records: [{ key: "profile", value: profile({ onboarded: false, updatedAt: 5000 }), updatedAt: 5000 }],
      first: false,
    });
    const back = await serverSync("acc", "web", { cursor: 0, events: [], deleted: [], records: [], first: false });
    expect(back.records.find((r) => r.key === "profile")?.value).toMatchObject({ name: "Melvin", onboarded: true });
  });

  it("signs out on this device, keeping the data, when the server says the session ended", async () => {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ token: "t", id: "acc", email: null, providers: [], via: "email" }));
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ error: "Signed out", signedOut: true }), { status: 401 }));
    useApp.setState({ events: [set("mine")] });
    await syncNow();
    expect(localStorage.getItem(ACCOUNT_KEY)).toBeNull();
    expect(useAccount.getState().error).toBe("signedOut");
    expect(useApp.getState().events.length).toBe(1);
  });

  it.each([
    ["the database is down", 503, { error: "Couldn't check your sign-in. Try again in a moment." }],
    ["a 401 from something other than our server", 401, {}],
    ["a server error", 500, { error: "boom" }],
  ])("stays signed in when %s", async (_why, status, body) => {
    const account = { token: "t", id: "acc", email: null, providers: [], via: "google" };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    useAccount.setState({ account: account as never, error: null });
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify(body), { status }));
    useApp.setState({ events: [set("mine")] });
    await syncNow();
    expect(localStorage.getItem(ACCOUNT_KEY)).not.toBeNull();
    expect(useAccount.getState().account).not.toBeNull();
    expect(useAccount.getState().error).toBeNull();
  });
});
