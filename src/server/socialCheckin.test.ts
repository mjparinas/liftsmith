import { beforeEach, describe, expect, it } from "vitest";

import { query, resetDb, run } from "./db";
import { CHECKIN_FOR, handle } from "./social";

// Check in on Today (Melvin, 2026-11-14; docs/decisions/friends.md "Check in"): "I'm at the gym" to mutual friends, a
// push and a toast until they close it, never from or to anyone under 18.
const NOW = 1_800_000_000_000;

const call = (who: string, op: string, b: Record<string, unknown> = {}, now = NOW) => handle(who, { op, ...b }, now);
const join = (who: string, h: string) => call(who, "join", { handle: h, name: h.charAt(0).toUpperCase() + h.slice(1), agree: true });
const follow = async (a: string, b: string, bHandle: string, aHandle: string) => {
  await call(a, "follow", { handle: bHandle });
  await call(b, "answer", { handle: aHandle, accept: true });
};
const mutual = async (a: string, ah: string, b: string, bh: string) => {
  await follow(a, b, bh, ah);
  await follow(b, a, ah, bh);
};
const born = (who: string, year: number) =>
  run("INSERT INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'profile', ?, ?)", [
    who,
    JSON.stringify({ birthYear: year }),
    NOW,
  ]);
const inbox = async (who: string, now = NOW + 1) =>
  (await call(who, "checkins", {}, now)).body.checkins as { id: string; handle: string; gym: string; focus: string[] }[];

beforeEach(async () => {
  await resetDb();
  await join("acc-a", "alex");
  await join("acc-b", "blair");
  await join("acc-c", "casey");
  await mutual("acc-a", "alex", "acc-b", "blair");
});

describe("check in", () => {
  it("reaches picked mutual friends only, as a toast until it's closed", async () => {
    await follow("acc-a", "acc-c", "casey", "alex"); // alex follows casey, casey doesn't follow back
    const r = await call("acc-a", "checkIn", { handles: ["blair", "casey"], gym: "Iron Den", focus: ["chest", "upperBack", "<b>"] });
    expect(r.body).toMatchObject({ sent: 1 });
    expect(await inbox("acc-b")).toMatchObject([{ handle: "alex", gym: "Iron Den", focus: ["chest", "upperBack"] }]);
    expect(await inbox("acc-c")).toEqual([]);
    const [k] = await inbox("acc-b");
    // Someone else can't close it; the friend can.
    await call("acc-a", "checkinDismiss", { id: k!.id });
    expect(await inbox("acc-b")).toHaveLength(1);
    await call("acc-b", "checkinDismiss", { id: k!.id });
    expect(await inbox("acc-b")).toEqual([]);
  });

  it("goes stale after a day and stops for blocks", async () => {
    await call("acc-a", "checkIn", { handles: ["blair"] });
    expect(await inbox("acc-b", NOW + CHECKIN_FOR + 1)).toEqual([]);
    await call("acc-b", "block", { handle: "alex" });
    expect(await inbox("acc-b")).toEqual([]);
    expect((await call("acc-a", "checkIn", { handles: ["blair"] })).code).toBe(403);
  });

  it("is never from or to anyone under 18", async () => {
    await born("acc-a", new Date(NOW).getFullYear() - 16);
    expect((await call("acc-a", "checkIn", { handles: ["blair"] })).body).toMatchObject({ error: "minor" });
    await mutual("acc-c", "casey", "acc-a", "alex");
    await mutual("acc-c", "casey", "acc-b", "blair");
    expect((await call("acc-c", "checkIn", { handles: ["alex", "blair"] })).body).toMatchObject({ sent: 1 });
    expect(await inbox("acc-a")).toEqual([]);
    expect(await inbox("acc-b")).toHaveLength(1);
  });

  it("is rate-limited and goes with the account", async () => {
    for (let i = 0; i < 10; i++) expect((await call("acc-a", "checkIn", { handles: ["blair"] }, NOW + i)).code).toBe(200);
    expect((await call("acc-a", "checkIn", { handles: ["blair"] }, NOW + 11)).code).toBe(429);
    await call("acc-b", "leave");
    expect(await query("SELECT * FROM friend_checkins WHERE to_id = 'acc-b'")).toEqual([]);
  });
});
