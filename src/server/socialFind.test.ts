import { beforeEach, describe, expect, it } from "vitest";

import { deleteAccount } from "./accounts";
import { query, resetDb } from "./db";
import { handle } from "./social";

// Friends gap list 2, items 1 and 8 (docs/decisions/friends.md): people you may know, finding public profiles by
// name, and a profile's level, streak, training calendar and follower lists.
const NOW = 1_800_000_000_000;
const DAY = 86_400_000;

const call = (who: string, op: string, b: Record<string, unknown> = {}, now = NOW) => handle(who, { op, ...b }, now);
const join = (who: string, h: string, extra: Record<string, unknown> = {}) =>
  call(who, "join", { handle: h, name: h.charAt(0).toUpperCase() + h.slice(1), agree: true, ...extra });
const workout = (id: string, at: number) => ({
  workoutId: id,
  at,
  body: {
    seconds: 3000,
    sets: 12,
    volume: 4200,
    prs: 0,
    muscles: ["chest"],
    exercises: [{ id: "bench", name: "Bench", sets: 4, w: 100, r: 5 }],
  },
});
const follow = async (a: string, b: string, bHandle: string, aHandle: string) => {
  await call(a, "follow", { handle: bHandle });
  await call(b, "answer", { handle: aHandle, accept: true });
};
type Sugg = { handle: string; reason: string; count?: number; via?: string };
const suggestions = async (who: string) => (await call(who, "suggest")).body.people as Sugg[];

beforeEach(async () => {
  await resetDb();
});

describe("people you may know", () => {
  it("suggests from real ties only, strongest first, and never someone already followed", async () => {
    await join("acc-a", "alex");
    await join("acc-b", "blair");
    await join("acc-c", "casey");
    await join("acc-d", "drew");
    await join("acc-e", "emery");
    await join("acc-f", "finley"); // no tie to anyone
    await follow("acc-a", "acc-b", "blair", "alex"); // alex follows blair
    await follow("acc-b", "acc-c", "casey", "blair"); // blair follows casey: casey is a friend of a friend
    await follow("acc-d", "acc-a", "alex", "drew"); // drew follows alex
    const { code } = (await call("acc-a", "clubCreate", { name: "Barn crew" })).body as { code: string };
    await call("acc-e", "clubJoin", { code });
    const list = await suggestions("acc-a");
    expect(list.map((x) => [x.handle, x.reason])).toEqual([
      ["drew", "followsYou"],
      ["emery", "club"],
      ["casey", "mutual"],
    ]);
    expect(list.find((x) => x.handle === "casey")).toMatchObject({ count: 1, via: "Blair" });
    expect(list.find((x) => x.handle === "emery")).toMatchObject({ via: "Barn crew" });
    // Following (or asking to follow) takes them off; so does Hide.
    await call("acc-a", "follow", { handle: "drew" });
    await call("acc-a", "unsuggest", { handle: "casey" });
    expect((await suggestions("acc-a")).map((x) => x.handle)).toEqual(["emery"]);
  });

  it("leaves out people who turned suggestions off (unless they follow you), blocked and suspended people", async () => {
    await join("acc-a", "alex");
    await join("acc-b", "blair");
    await join("acc-c", "casey", { suggest: false });
    await join("acc-d", "drew");
    await call("acc-c", "update", { suggest: false });
    const { code } = (await call("acc-a", "clubCreate", { name: "Crew" })).body as { code: string };
    await call("acc-b", "clubJoin", { code });
    await call("acc-c", "clubJoin", { code });
    await call("acc-d", "clubJoin", { code });
    await call("acc-d", "block", { handle: "alex" });
    expect((await suggestions("acc-a")).map((x) => x.handle)).toEqual(["blair"]);
    await follow("acc-c", "acc-a", "alex", "casey");
    expect((await suggestions("acc-a")).map((x) => x.handle)).toEqual(["casey", "blair"]);
    await query("UPDATE social_profiles SET suspended = 1 WHERE account_id = 'acc-b'");
    expect((await suggestions("acc-a")).map((x) => x.handle)).toEqual(["casey"]);
  });

  it("suggests training partners", async () => {
    await join("acc-a", "alex", { open: true });
    await join("acc-b", "blair", { open: true });
    await join("acc-c", "casey", { open: true });
    for (const [x, y, hy, hx] of [
      ["acc-a", "acc-b", "blair", "alex"],
      ["acc-b", "acc-a", "alex", "blair"],
      ["acc-b", "acc-c", "casey", "blair"],
      ["acc-c", "acc-b", "blair", "casey"],
    ] as const)
      await follow(x, y, hy, hx);
    await call("acc-b", "post", { ...workout("w1", NOW - DAY), partners: ["alex", "casey"] });
    const list = await suggestions("acc-a");
    expect(list[0]).toMatchObject({ handle: "casey", reason: "partner" });
  });

  it("deleting an account removes its hidden suggestions", async () => {
    await join("acc-a", "alex");
    await join("acc-b", "blair");
    await call("acc-a", "unsuggest", { handle: "blair" });
    await deleteAccount("acc-a");
    expect(await query("SELECT * FROM suggest_hides")).toEqual([]);
  });
});

describe("finding people by name", () => {
  it("finds public profiles by name or handle, and anyone by their exact handle", async () => {
    await join("acc-a", "alex");
    await join("acc-b", "blair_lifts", { name: "Blair Stone" });
    await call("acc-b", "update", { public: true });
    await join("acc-c", "casey", { name: "Casey Stone" }); // private
    const find = async (q: string) => ((await call("acc-a", "search", { q })).body.people as { handle: string }[]).map((p) => p.handle);
    expect(await find("bla")).toEqual(["blair_lifts"]);
    expect(await find("stone")).toEqual(["blair_lifts"]); // a word in the name
    expect(await find("cas")).toEqual([]); // private: not by name
    expect(await find("@casey")).toEqual(["casey"]); // but by exact handle
    expect(await find("b")).toEqual([]); // too short
    expect(await find("%")).toEqual([]);
    await call("acc-b", "block", { handle: "alex" });
    expect(await find("blair")).toEqual([]);
  });
});

describe("richer profiles", () => {
  it("shows level, streak and the training calendar to people who can see the posts", async () => {
    await join("acc-a", "alex");
    await join("acc-b", "blair");
    await call("acc-b", "update", { level: 12, streak: 5 });
    await call("acc-b", "post", workout("w1", NOW - 2 * DAY));
    await call("acc-b", "post", { ...workout("w2", NOW - DAY), audience: "me" });
    await call("acc-b", "post", workout("w3", NOW - 200 * DAY));
    type Card = { level: number; streak: number; trained: number[] };
    const look = async () => (await call("acc-a", "lookup", { handle: "blair" })).body.person as Card;
    expect(await look()).toMatchObject({ level: 0, streak: 0, trained: [] }); // not following yet
    await follow("acc-a", "acc-b", "blair", "alex");
    expect(await look()).toMatchObject({ level: 12, streak: 5, trained: [NOW - 2 * DAY] });
    await call("acc-b", "update", { level: 999, streak: -3 });
    expect(await look()).toMatchObject({ level: 50, streak: 0 });
  });

  it("opens followers and following to people who can see the posts, without blocked people", async () => {
    await join("acc-a", "alex");
    await join("acc-b", "blair");
    await join("acc-c", "casey", { open: true });
    await join("acc-d", "drew", { open: true });
    await call("acc-c", "follow", { handle: "blair" });
    await call("acc-b", "answer", { handle: "casey", accept: true });
    await call("acc-d", "follow", { handle: "blair" });
    await call("acc-b", "answer", { handle: "drew", accept: true });
    const list = (who: string) => call(who, "personPeople", { handle: "blair", list: "followers" });
    expect((await list("acc-a")).code).toBe(403);
    await follow("acc-a", "acc-b", "blair", "alex");
    await call("acc-d", "block", { handle: "alex" });
    const people = (await list("acc-a")).body.people as { handle: string }[];
    expect(people.map((p) => p.handle).sort()).toEqual(["alex", "casey"]);
    await call("acc-b", "follow", { handle: "casey" });
    const following = (await call("acc-a", "personPeople", { handle: "blair", list: "following" })).body.people as { handle: string }[];
    expect(following.map((p) => p.handle)).toEqual(["casey"]);
  });
});
