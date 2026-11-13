import { beforeEach, describe, expect, it } from "vitest";

import { deleteAccount } from "./accounts";
import { query, resetDb } from "./db";
import { CHEER_GAP, handle, LIVE_FOR } from "./social";

// Friends gap list 2, item 4 (docs/decisions/friends.md): "Training now" for mutual friends, and cheers that show on
// the lifter's workout screen.
const NOW = 1_800_000_000_000;

const call = (who: string, op: string, b: Record<string, unknown> = {}, now = NOW) => handle(who, { op, ...b }, now);
const join = (who: string, h: string, extra: Record<string, unknown> = {}) =>
  call(who, "join", { handle: h, name: h.charAt(0).toUpperCase() + h.slice(1), agree: true, ...extra });
const follow = async (a: string, b: string, bHandle: string, aHandle: string) => {
  await call(a, "follow", { handle: bHandle });
  await call(b, "answer", { handle: aHandle, accept: true });
};
const friends = async () => {
  await join("acc-a", "alex");
  await join("acc-b", "blair");
  await follow("acc-a", "acc-b", "blair", "alex");
  await follow("acc-b", "acc-a", "alex", "blair");
};
const training = async (who: string, now = NOW) =>
  (await call(who, "training", {}, now)).body.people as { handle: string; exercise: string; done: number; total: number }[];

beforeEach(async () => {
  await resetDb();
});

describe("training now", () => {
  it("is on for a new profile unless turned off when joining, and shows only to mutual friends", async () => {
    await friends();
    await join("acc-c", "casey");
    await follow("acc-c", "acc-b", "blair", "casey"); // casey follows blair, blair doesn't follow back
    expect((await call("acc-b", "me")).body).toMatchObject({ profile: { live: true } });
    await join("acc-d", "drew", { live: false });
    expect((await call("acc-d", "me")).body).toMatchObject({ profile: { live: false } });
    expect((await call("acc-d", "live", { sessionId: "s1", exercise: "bench", done: 2, total: 12 })).body).toMatchObject({ live: false });
    await call("acc-b", "live", { sessionId: "s1", exercise: "bench", done: 2, total: 12 });
    expect(await training("acc-a")).toMatchObject([{ handle: "blair", exercise: "bench", done: 2, total: 12 }]);
    expect(await training("acc-c")).toEqual([]);
  });

  it("goes away when the workout ends, when it goes quiet, and when the switch goes off", async () => {
    await friends();
    await call("acc-b", "update", { live: true });
    await call("acc-b", "live", { sessionId: "s1", done: 0, total: 10 });
    expect(await training("acc-a", NOW + LIVE_FOR + 1)).toEqual([]);
    expect(await training("acc-a")).toHaveLength(1);
    await call("acc-b", "live", { on: false });
    expect(await training("acc-a")).toEqual([]);
    await call("acc-b", "live", { sessionId: "s2", done: 1, total: 10 });
    await call("acc-b", "update", { live: false });
    expect(await training("acc-a")).toEqual([]);
  });

  it("hides blocked and suspended people", async () => {
    await friends();
    await call("acc-b", "update", { live: true });
    await call("acc-b", "live", { sessionId: "s1", done: 1, total: 10 });
    await query("UPDATE social_profiles SET suspended = 1 WHERE account_id = 'acc-b'");
    expect(await training("acc-a")).toEqual([]);
    await query("UPDATE social_profiles SET suspended = 0 WHERE account_id = 'acc-b'");
    await call("acc-a", "block", { handle: "blair" });
    expect(await training("acc-a")).toEqual([]);
  });
});

describe("cheers", () => {
  it("reaches a training friend's workout, once every few seconds, with an Activity line", async () => {
    await friends();
    await call("acc-b", "update", { live: true });
    await call("acc-b", "live", { sessionId: "s1", done: 1, total: 10 });
    expect((await call("acc-a", "cheer", { handle: "blair", emoji: "🔥" })).code).toBe(200);
    expect((await call("acc-a", "cheer", { handle: "blair", emoji: "💪" }, NOW + 1000)).code).toBe(429);
    expect((await call("acc-a", "cheer", { handle: "blair", emoji: "💪" }, NOW + CHEER_GAP + 1)).code).toBe(200);
    const got = (await call("acc-b", "cheers", { sessionId: "s1", since: 0 }, NOW + CHEER_GAP + 2)).body.cheers as {
      handle: string;
      emoji: string;
    }[];
    expect(got.map((c) => [c.handle, c.emoji])).toEqual([
      ["alex", "🔥"],
      ["alex", "💪"],
    ]);
    // Only cheers after `since`, and only for this workout.
    expect(((await call("acc-b", "cheers", { sessionId: "s1", since: NOW }, NOW + CHEER_GAP + 2)).body.cheers as unknown[]).length).toBe(1);
    expect(((await call("acc-b", "cheers", { sessionId: "s2", since: 0 }, NOW + CHEER_GAP + 2)).body.cheers as unknown[]).length).toBe(0);
    const items = (await call("acc-b", "activity", {}, NOW + CHEER_GAP + 2)).body.items as { kind: string }[];
    expect(items.filter((i) => i.kind === "cheer")).toHaveLength(2);
  });

  it("refuses an emoji not on the list, someone not training and someone who isn't a mutual friend", async () => {
    await friends();
    await join("acc-c", "casey");
    await follow("acc-c", "acc-b", "blair", "casey");
    expect((await call("acc-a", "cheer", { handle: "blair", emoji: "🔥" })).code).toBe(404);
    await call("acc-b", "update", { live: true });
    await call("acc-b", "live", { sessionId: "s1", done: 1, total: 10 });
    expect((await call("acc-a", "cheer", { handle: "blair", emoji: "💩" })).code).toBe(404);
    expect((await call("acc-c", "cheer", { handle: "blair", emoji: "🔥" })).code).toBe(403);
    expect((await call("acc-b", "cheer", { handle: "blair", emoji: "🔥" })).code).toBe(403);
  });

  it("stop when the lifter turns cheers off, and the cheer buttons go with them", async () => {
    await friends();
    await call("acc-b", "update", { live: true });
    await call("acc-b", "live", { sessionId: "s1", done: 1, total: 10 });
    expect(await training("acc-a")).toMatchObject([{ handle: "blair", cheers: true }]);
    await call("acc-a", "cheer", { handle: "blair", emoji: "🔥" });
    await call("acc-b", "update", { cheers: false });
    expect((await call("acc-b", "me")).body).toMatchObject({ profile: { cheers: false, live: true } });
    expect(await training("acc-a")).toMatchObject([{ handle: "blair", cheers: false }]);
    expect((await call("acc-a", "cheer", { handle: "blair", emoji: "💪" }, NOW + CHEER_GAP + 1)).body).toMatchObject({
      error: "cheersOff",
    });
    // The workout screen reads none, not even the one sent before.
    expect((await call("acc-b", "cheers", { sessionId: "s1", since: 0 })).body.cheers).toEqual([]);
    await call("acc-b", "update", { cheers: true });
    expect((await call("acc-a", "cheer", { handle: "blair", emoji: "💪" }, NOW + CHEER_GAP + 1)).code).toBe(200);
  });

  it("are deleted with the account", async () => {
    await friends();
    await call("acc-b", "update", { live: true });
    await call("acc-b", "live", { sessionId: "s1", done: 1, total: 10 });
    await call("acc-a", "cheer", { handle: "blair", emoji: "🎉" });
    await deleteAccount("acc-a");
    expect(await query("SELECT * FROM cheers")).toEqual([]);
    await deleteAccount("acc-b");
    expect(await query("SELECT * FROM live_sessions")).toEqual([]);
  });
});

describe("friend nudges", () => {
  it("lists mutual friends who trained regularly and went quiet, with the week's board and running challenges", async () => {
    const DAY = 86_400_000;
    await friends();
    await join("acc-c", "casey");
    await follow("acc-a", "acc-c", "casey", "alex"); // one way only: never listed
    const body = {
      seconds: 3000,
      sets: 12,
      volume: 4200,
      prs: 0,
      muscles: ["chest"],
      exercises: [{ id: "bench", name: "Bench", sets: 4, w: 100, r: 5 }],
    };
    for (let i = 0; i < 5; i++) {
      await call("acc-b", "post", { workoutId: `b${i}`, at: NOW - (15 + i * 5) * DAY, body }, NOW - (15 + i * 5) * DAY);
      await call("acc-c", "post", { workoutId: `c${i}`, at: NOW - (15 + i * 5) * DAY, body }, NOW - (15 + i * 5) * DAY);
    }
    const r = (await call("acc-a", "nudges", { from: NOW - 2 * DAY })).body as {
      quiet: { handle: string; before: number }[];
      week: unknown[];
    };
    expect(r.quiet).toMatchObject([{ handle: "blair", before: 5 }]);
    expect(r.week.length).toBe(3);
    // A fresh post means they're back.
    await call("acc-b", "post", { workoutId: "b9", at: NOW - DAY, body }, NOW - DAY);
    expect(((await call("acc-a", "nudges", { from: NOW - 2 * DAY })).body.quiet as unknown[]).length).toBe(0);
  });
});
