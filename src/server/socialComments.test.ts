import { beforeEach, describe, expect, it } from "vitest";

import { deleteAccount } from "./accounts";
import { query, resetDb } from "./db";
import { handle, mentionsIn } from "./social";

// Friends gap list 2, item 5 (docs/decisions/friends.md): replies, @mentions and who liked.
const NOW = 1_800_000_000_000;
const DAY = 86_400_000;
const call = (who: string, op: string, b: Record<string, unknown> = {}, now = NOW) => handle(who, { op, ...b }, now);
const join = (who: string, h: string) =>
  call(who, "join", { handle: h, name: h.charAt(0).toUpperCase() + h.slice(1), agree: true, open: true });
const workout = {
  workoutId: "w1",
  at: NOW - DAY,
  body: { seconds: 60, sets: 1, volume: 100, prs: 0, muscles: [], exercises: [{ id: "bench", name: "", sets: 1, w: 100, r: 1 }] },
};
type Item = { kind: string; handle: string; text?: string };
const activity = async (who: string) => (await call(who, "activity")).body.items as Item[];

beforeEach(async () => {
  await resetDb();
  await join("acc-a", "alex");
  await join("acc-b", "blair");
  await join("acc-c", "casey");
  await join("acc-d", "drew");
  for (const who of ["acc-b", "acc-c"]) await call(who, "follow", { handle: "alex" }); // drew doesn't follow alex
});

describe("mentions", () => {
  it("finds handles named with @, each once, at most five", () => {
    expect(mentionsIn("nice @Blair and @blair, mail me@x.com @ab")).toEqual(["blair"]);
    expect(mentionsIn("@aaa @bbb @ccc @ddd @eee @fff")).toHaveLength(5);
  });

  it("tells people named who can see the post, not people who can't, and never twice", async () => {
    const { id } = (await call("acc-a", "post", workout)).body as { id: string };
    await call("acc-b", "comment", { id, text: "Go @casey look at this @drew @alex @nobody" });
    expect((await activity("acc-c")).map((i) => [i.kind, i.handle])).toContainEqual(["mention", "blair"]);
    expect((await activity("acc-d")).some((i) => i.kind === "mention")).toBe(false); // can't see the post
    expect((await activity("acc-a")).filter((i) => i.handle === "blair" && i.kind !== "follow").map((i) => i.kind)).toEqual(["comment"]); // the poster once
    await call("acc-c", "block", { handle: "blair" });
    expect((await activity("acc-c")).some((i) => i.kind === "mention")).toBe(false);
  });
});

describe("replies", () => {
  it("sit one level deep and tell the comment's author", async () => {
    const { id } = (await call("acc-a", "post", workout)).body as { id: string };
    const top = ((await call("acc-b", "comment", { id, text: "Strong" })).body.comment as { id: string }).id;
    const r1 = (await call("acc-c", "comment", { id, text: "Agreed", replyTo: top }, NOW + 1)).body.comment as {
      id: string;
      replyTo: string;
    };
    expect(r1.replyTo).toBe(top);
    const r2 = (await call("acc-a", "comment", { id, text: "Thanks", replyTo: r1.id }, NOW + 2)).body.comment as { replyTo: string };
    expect(r2.replyTo).toBe(top); // a reply to a reply joins the same top comment
    expect((await activity("acc-b")).map((i) => [i.kind, i.handle])).toEqual([
      ["reply", "alex"],
      ["reply", "casey"],
    ]);
    const thread = (await call("acc-a", "thread", { id })).body.comments as { replyTo?: string }[];
    expect(thread.map((c) => c.replyTo ?? "")).toEqual(["", top, top]);
    expect((await call("acc-c", "comment", { id, text: "x", replyTo: "nope" })).code).toBe(404);
  });
});

describe("who liked", () => {
  it("lists likers for people who can see the post, without blocked people", async () => {
    const { id } = (await call("acc-a", "post", workout)).body as { id: string };
    await call("acc-b", "like", { id });
    await call("acc-c", "like", { id });
    const list = async (who: string) => await call(who, "likers", { id });
    expect(((await list("acc-a")).body.people as { handle: string }[]).map((p) => p.handle)).toEqual(
      ["blair", "casey"].sort().reverse().sort(),
    );
    expect((await list("acc-d")).code).toBe(404);
    await call("acc-c", "block", { handle: "blair" });
    expect(((await list("acc-b")).body.people as { handle: string }[]).map((p) => p.handle)).toEqual(["blair"]);
  });

  it("deleting an account removes its mentions", async () => {
    const { id } = (await call("acc-a", "post", workout)).body as { id: string };
    await call("acc-b", "comment", { id, text: "@casey" });
    await deleteAccount("acc-b");
    expect(await query("SELECT * FROM comment_mentions")).toEqual([]);
  });
});
