// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetDb } from "@/server/db";
import { sync as serverSync, type SyncRequest } from "@/server/sync";

import { forgetAccount, readAccount, useAccount, verifyEmailCode } from "./auth";
import { defaultProfile, makeGym } from "./defaults";
import { appendEvents, load } from "./localdb";
import { listPhotos, savePhoto } from "./photos";
import { signOutDevice, unsynced } from "./signOutDevice";
import { useApp } from "./store";
import { ACCOUNT_KEY, emptySync, readSync, writeSync } from "./syncOutbox";
import type { AppEvent } from "./types";
import { clearPersonalKeys, OWNER_KEY, personal, readOwner, restartApp } from "./wipe";

vi.mock("./wipe", async (orig) => ({ ...(await orig<typeof import("./wipe")>()), restartApp: vi.fn() }));

const set = (id: string): AppEvent => ({
  type: "set",
  id,
  at: 5000,
  sessionId: "s",
  exerciseId: "back-squat",
  weight: 100,
  reps: 5,
  targetReps: 5,
  rir: 2,
});
const profile = () => ({ ...defaultProfile(1000), onboarded: true, name: "Alex", activeGymId: "g1", updatedAt: 1000 });

function signIn(id = "acc") {
  const a = { token: "t", id, email: "alex@example.com", providers: ["email"], via: "email" as const };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a));
  localStorage.setItem(OWNER_KEY, id);
  useAccount.setState({ account: a });
}

async function withData() {
  const events = [set("a"), set("b")];
  await appendEvents(events);
  useApp.setState({ ready: true, events, profile: profile(), gyms: [{ ...makeGym("commercial", "kg", "g1"), updatedAt: 1000 }] });
}

let online = true;
beforeEach(async () => {
  await resetDb();
  localStorage.clear();
  sessionStorage.clear();
  forgetAccount();
  await useApp.getState().wipeLocal();
  vi.mocked(restartApp).mockClear();
  online = true;
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    if (!online) throw new TypeError("Failed to fetch");
    if (url === "/api/auth/logout/") return Response.json({ ok: true });
    if (url === "/api/auth/email/verify/")
      return Response.json({ token: "t2", account: { id: "someone-else", email: "sam@example.com", providers: ["email"] } });
    return Response.json(await serverSync("acc", "web", JSON.parse(String(init.body)) as SyncRequest));
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("signing out wipes the device", () => {
  it("pushes what's waiting, then erases the lifter's data and starts the app again", async () => {
    signIn();
    await withData();
    await savePhoto({ id: "p1", at: 1, pose: "front", blob: new Blob(["x"]), w: 1, h: 1 });
    localStorage.setItem("liftsmith.friendsCache", "{}");
    localStorage.setItem("ls.sonos", "{}");
    localStorage.setItem("liftsmith.theme", "light");
    localStorage.setItem("liftsmith.installId", "install-1");
    sessionStorage.setItem("ls.resumed", "1");

    expect(await signOutDevice()).toEqual({ ok: true });

    // Everything reached the account first.
    const there = await serverSync("acc", "phone", { cursor: 0, events: [], deleted: [], records: [], first: false });
    expect((there.events as AppEvent[]).map((e) => e.id).sort()).toEqual(["a", "b"]);
    // Then nothing of the lifter is left here.
    expect(readAccount()).toBeNull();
    expect(useApp.getState().events).toEqual([]);
    expect(useApp.getState().profile.name).not.toBe("Alex");
    expect((await load()).events).toEqual([]);
    expect(await listPhotos()).toEqual([]);
    for (const k of ["liftsmith.friendsCache", "ls.sonos", OWNER_KEY]) expect(localStorage.getItem(k)).toBeNull();
    expect(sessionStorage.getItem("ls.resumed")).toBeNull();
    // The device's own settings stay.
    expect(localStorage.getItem("liftsmith.theme")).toBe("light");
    expect(localStorage.getItem("liftsmith.installId")).toBe("install-1");
    expect(restartApp).toHaveBeenCalledOnce();
  });

  it("keeps everything and says how much is waiting when the push fails, until the lifter signs out anyway", async () => {
    signIn();
    await withData();
    writeSync({ ...emptySync(), seeded: true, out: ["a", "b"], sentRev: 1 });
    online = false;

    expect(await signOutDevice()).toEqual({ ok: false, waiting: 2 });
    expect(readAccount()?.id).toBe("acc");
    expect(useApp.getState().events).toHaveLength(2);
    expect(restartApp).not.toHaveBeenCalled();

    expect(await signOutDevice({ force: true })).toEqual({ ok: true });
    expect(readAccount()).toBeNull();
    expect(useApp.getState().events).toEqual([]);
    expect((await load()).events).toEqual([]);
  });

  it("counts the whole history as waiting until it has been pushed once", () => {
    expect(unsynced({ ...emptySync(), seeded: false }, 7)).toBe(7);
    expect(unsynced({ ...emptySync(), seeded: true, out: ["a"], del: ["b"], rev: 2, sentRev: 1 }, 7)).toBe(3);
    expect(unsynced({ ...emptySync(), seeded: true, rev: 1, sentRev: 1 }, 7)).toBe(0);
  });
});

describe("signing in as someone else never mixes data", () => {
  it("wipes another account's data before signing in", async () => {
    // Alex's session was ended by the server: the data stayed, still marked as Alex's.
    signIn("acc");
    await withData();
    forgetAccount();
    expect(readOwner()).toBe("acc");

    await verifyEmailCode("sam@example.com", "123456");
    expect(readAccount()?.id).toBe("someone-else");
    expect(readOwner()).toBe("someone-else");
    expect(useApp.getState().events).toEqual([]);
    expect((await load()).events).toEqual([]);
    expect(readSync().out).toEqual([]);
    expect(restartApp).toHaveBeenCalledOnce();
  });

  it("brings along data logged before ever signing in, and keeps the same account's own", async () => {
    await withData();
    expect(readOwner()).toBeNull();
    await verifyEmailCode("sam@example.com", "123456");
    expect(useApp.getState().events).toHaveLength(2);
    expect(restartApp).not.toHaveBeenCalled();

    forgetAccount();
    await verifyEmailCode("sam@example.com", "123456");
    expect(useApp.getState().events).toHaveLength(2);
    expect(restartApp).not.toHaveBeenCalled();
  });
});

describe("which saved keys are the lifter's", () => {
  it("takes our keys except the device's own settings, and leaves other sites' keys alone", () => {
    expect(personal("liftsmith.sync")).toBe(true);
    expect(personal("ls.health.last")).toBe(true);
    expect(personal("liftsmith.theme")).toBe(false);
    expect(personal("liftsmith.installId")).toBe(false);
    expect(personal("something.else")).toBe(false);
    localStorage.setItem("something.else", "1");
    localStorage.setItem("liftsmith.coachNotes", "x");
    expect(clearPersonalKeys()).toEqual(["liftsmith.coachNotes"]);
    expect(localStorage.getItem("something.else")).toBe("1");
  });
});
