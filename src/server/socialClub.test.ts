import { beforeEach, describe, expect, it } from "vitest";

import { resetDb } from "./db";
import { handle } from "./social";

// Friends gap list 2, item 6 (docs/decisions/friends.md): a club's feed and its weekly crew goal.
const NOW = 1_800_000_000_000;

const call = (who: string, op: string, b: Record<string, unknown> = {}, now = NOW) => handle(who, { op, ...b }, now);
const join = (who: string, h: string, extra: Record<string, unknown> = {}) =>
  call(who, "join", { handle: h, name: h.charAt(0).toUpperCase() + h.slice(1), agree: true, ...extra });
const post = (who: string, id: string, audience = "all") =>
  call(who, "post", {
    workoutId: id,
    at: NOW - 3_600_000,
    audience,
    body: {
      seconds: 3000,
      sets: 12,
      volume: 4200,
      prs: 0,
      muscles: ["chest"],
      exercises: [{ id: "bench", name: "Bench", sets: 4, w: 100, r: 5 }],
    },
  });
const feed = async (who: string, id: string) => ((await call(who, "clubFeed", { id })).body.posts as { name: string }[]).map((p) => p.name);

let club = "";
beforeEach(async () => {
  await resetDb();
  await join("acc-a", "alex");
  await join("acc-b", "blair");
  await join("acc-c", "casey");
  await join("acc-d", "drew");
  const r = (await call("acc-a", "clubCreate", { name: "Barn crew" })).body as { id: string; code: string };
  club = r.id;
  for (const who of ["acc-b", "acc-c"]) await call(who, "clubJoin", { code: r.code });
});

describe("club feed", () => {
  it("shows members' posts the reader could see anyway, and nobody else's", async () => {
    await call("acc-a", "follow", { handle: "blair" });
    await call("acc-b", "answer", { handle: "alex", accept: true });
    await post("acc-b", "w1"); // followed: shows
    await post("acc-c", "w2"); // private and not followed: joining the club doesn't widen it
    await post("acc-d", "w3"); // not in the club
    await post("acc-a", "w4", "me"); // the reader's own, even just for them
    expect(new Set(await feed("acc-a", club))).toEqual(new Set(["Alex", "Blair"]));
    await call("acc-c", "update", { public: true });
    expect(new Set(await feed("acc-a", club))).toEqual(new Set(["Alex", "Blair", "Casey"]));
    // Only members can read it.
    expect((await call("acc-d", "clubFeed", { id: club })).code).toBe(404);
  });

  it("leaves out blocked and muted members", async () => {
    await call("acc-b", "update", { public: true });
    await post("acc-b", "w1");
    expect(await feed("acc-a", club)).toEqual(["Blair"]);
    await call("acc-a", "mute", { handle: "blair" });
    expect(await feed("acc-a", club)).toEqual([]);
    await call("acc-c", "update", { public: true });
    await post("acc-c", "w2");
    await call("acc-c", "block", { handle: "alex" });
    expect(await feed("acc-a", club)).toEqual([]);
  });
});

describe("crew goal", () => {
  it("is set and cleared by the starter only, and comes with the club", async () => {
    expect((await call("acc-a", "club", { id: club, from: NOW - 86_400_000 })).body.club).toMatchObject({ goal: null });
    expect((await call("acc-b", "clubManage", { id: club, goal: { metric: "workouts", target: 10 } })).code).toBe(404);
    expect((await call("acc-a", "clubManage", { id: club, goal: { metric: "workouts", target: 0 } })).code).toBe(400);
    expect((await call("acc-a", "clubManage", { id: club, goal: { metric: "volume", target: 10 } })).code).toBe(400);
    expect((await call("acc-a", "clubManage", { id: club, goal: { metric: "sets", target: 300 } })).code).toBe(200);
    expect((await call("acc-b", "club", { id: club, from: NOW - 86_400_000 })).body.club).toMatchObject({
      goal: { metric: "sets", target: 300 },
    });
    await call("acc-a", "clubManage", { id: club, goal: null });
    expect((await call("acc-b", "club", { id: club, from: NOW - 86_400_000 })).body.club).toMatchObject({ goal: null });
  });
});
