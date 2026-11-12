import { beforeEach, describe, expect, it } from "vitest";

import { resetDb } from "./db";
import { DISCOVER_DAYS, handle } from "./social";

// Discover (docs/decisions/friends.md, gap list 3 item 6): public workouts from people the lifter doesn't follow.
const NOW = 1_800_000_000_000;
const DAY = 86_400_000;
const call = (who: string, op: string, b: Record<string, unknown> = {}, now = NOW) => handle(who, { op, ...b }, now);
const join = (who: string, h: string, extra: Record<string, unknown> = {}) =>
  call(who, "join", { handle: h, name: h.charAt(0).toUpperCase() + h.slice(1), agree: true, ...extra });
const post = (who: string, id: string, at = NOW - 3_600_000, audience?: string) =>
  call(who, "post", {
    workoutId: id,
    at,
    ...(audience ? { audience } : {}),
    body: { seconds: 3000, sets: 12, volume: 4200, prs: 0, muscles: ["chest"], exercises: [{ id: "bench-press", sets: 4, w: 100, r: 5 }] },
  });
const discover = async (who = "acc-a") =>
  ((await call(who, "discover")).body.posts as { handle: string; id: string }[]).map((p) => p.handle);

beforeEach(async () => {
  await resetDb();
  await join("acc-a", "alex");
  await join("acc-b", "blair", { open: true });
  await call("acc-b", "update", { public: true });
  await join("acc-c", "casey");
});

describe("discover", () => {
  it("shows public profiles' workouts for everyone, never a private profile's or the lifter's own", async () => {
    await post("acc-b", "b1");
    await post("acc-c", "c1");
    await call("acc-a", "update", { public: true });
    // An hour older than Blair's, so the order doesn't hang on a tie.
    await post("acc-a", "a1", NOW - 7_200_000);
    expect(await discover()).toEqual(["blair"]);
    // A friends-only or only-me post from a public profile stays out.
    await post("acc-b", "b2", NOW - 1_000, "friends");
    await post("acc-b", "b3", NOW - 500, "me");
    expect(await discover("acc-c")).toEqual(["blair", "alex"]);
  });

  it("shows each person's newest workout once, from the last few weeks", async () => {
    await post("acc-b", "old", NOW - 2 * 3_600_000);
    await post("acc-b", "new");
    const r = (await call("acc-a", "discover")).body.posts as { id: string }[];
    expect(r).toHaveLength(1);
    expect((await call("acc-a", "discover", {}, NOW + (DISCOVER_DAYS + 1) * DAY)).body.posts).toEqual([]);
  });

  it("leaves out people the lifter follows, mutes or blocks", async () => {
    await post("acc-b", "b1");
    await call("acc-a", "follow", { handle: "blair" });
    expect(await discover()).toEqual([]);
    await call("acc-a", "unfollow", { handle: "blair" });
    await call("acc-a", "mute", { handle: "blair" });
    expect(await discover()).toEqual([]);
    await call("acc-a", "mute", { handle: "blair", on: false });
    await call("acc-b", "block", { handle: "alex" });
    expect(await discover()).toEqual([]);
    expect(await discover("acc-c")).toEqual(["blair"]);
  });

  it("needs the lifter to be in Friends", async () => {
    expect((await call("acc-z", "discover")).code).toBe(403);
  });
});
