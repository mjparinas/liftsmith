import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";

import { deleteAccount } from "./accounts";
import { query, resetDb } from "./db";
import { checkText, hasBlockedWord, hasLink, normalize } from "./moderation";
import { adminReports, checkHandle, handle, HIDE_AFTER, parsePost, resolveReports } from "./social";

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;

const call = (who: string, op: string, b: Record<string, unknown> = {}, now = NOW) => handle(who, { op, ...b }, now);
const join = (who: string, handle: string, extra: Record<string, unknown> = {}) =>
  call(who, "join", { handle, name: handle.toUpperCase(), agree: true, ...extra });
const workout = (id = "s1", at = NOW - 3_600_000) => ({
  workoutId: id,
  at,
  body: {
    seconds: 3000,
    sets: 12,
    volume: 4200,
    prs: 1,
    muscles: ["chest", "triceps"],
    exercises: [{ id: "bench", name: "Bench press", sets: 4, w: 100, r: 5 }],
    heartRate: 150, // never kept
  },
});
async function friends(a = "acc-a", b = "acc-b") {
  await join(a, "alex");
  await join(b, "blair");
  await call(b, "follow", { handle: "alex" });
  await call(a, "answer", { handle: "blair", accept: true });
}
const feedOf = async (who: string) =>
  (await call(who, "feed")).body.posts as { id: string; handle: string; likes: number; comments: number }[];

beforeEach(async () => {
  await resetDb();
});

describe("moderation", () => {
  it("normalizes the usual dodges", () => {
    expect(normalize("HeLLLo")).toBe("helo");
    expect(normalize("Çа")).toBe("c"); // Cyrillic а is not a Latin letter, so it's dropped
    expect(normalize("b4d")).toBe("bad");
  });

  it("refuses words on the list as whole words only", () => {
    const list = new Set([createHash("sha256").update(normalize("badword")).digest("hex").slice(0, 16)]);
    expect(hasBlockedWord("you B4DW0RD", list)).toBe(true);
    expect(hasBlockedWord("so baaadword!", list)).toBe(true);
    expect(hasBlockedWord("notbadwordish", list)).toBe(false);
    expect(hasBlockedWord("Great squat!", list)).toBe(false);
  });

  it("refuses links", () => {
    expect(hasLink("see https://x.y")).toBe(true);
    expect(hasLink("buy at cheap-pills.com")).toBe(true);
    expect(hasLink("www.example")).toBe(true);
    expect(hasLink("Nice. 100 kg × 5")).toBe(false);
    expect(checkText("  ", 10)).toEqual({ ok: false, error: "empty" });
    expect(checkText("Strong   work‮", 280)).toEqual({ ok: true, text: "Strong work" });
  });

  it("checks handles", () => {
    expect(checkHandle("@Alex_99")).toEqual({ ok: true, handle: "alex_99" });
    expect(checkHandle("ab")).toEqual({ ok: false, error: "handle" });
    expect(checkHandle("has space")).toEqual({ ok: false, error: "handle" });
    expect(checkHandle("admin")).toEqual({ ok: false, error: "handleTaken" });
    expect(checkHandle("realliftsmith")).toEqual({ ok: false, error: "handleTaken" });
  });
});

describe("joining", () => {
  it("needs the community rules agreed and a free handle, with private defaults", async () => {
    expect((await call("acc-a", "join", { handle: "alex" })).body.error).toBe("agree");
    const r = await join("acc-a", "alex");
    expect(r.body.profile).toEqual({
      handle: "alex",
      name: "ALEX",
      tagline: "",
      homeGym: null,
      open: false,
      autoPost: false,
      weights: true,
      public: false,
      push: { follows: true, comments: true, sent: true, likes: false, cheers: true, posts: true, checkins: true },
      avatar: "",
      audience: "all",
      showLifts: true,
      lifts: [],
      suggest: true,
      live: true,
      cheers: true,
      level: 0,
      streak: 0,
    });
    expect((await join("acc-b", "Alex")).body.error).toBe("handleTaken");
    expect((await call("acc-c", "feed")).body.error).toBe("notJoined");
  });

  it("keeps links out of names", async () => {
    expect((await join("acc-a", "alex", { name: "visit spam.com" })).body.error).toBe("name.link");
  });
});

describe("following", () => {
  it("asks first by default, and follows at once when the profile is open", async () => {
    await join("acc-a", "alex");
    await join("acc-b", "blair");
    const r = await call("acc-b", "follow", { handle: "alex" }, NOW + 1000);
    expect(r.body.person).toMatchObject({ relation: "requested", canSee: false });
    expect((await call("acc-a", "me")).body).toMatchObject({ requests: 1, unread: 1 });
    await call("acc-a", "answer", { handle: "blair", accept: true });
    expect((await call("acc-b", "lookup", { handle: "alex" })).body.person).toMatchObject({
      relation: "following",
      canSee: true,
      followers: 1,
    });

    await join("acc-c", "casey", { open: true });
    expect((await call("acc-b", "follow", { handle: "casey" })).body.person).toMatchObject({ relation: "following" });
  });

  it("opening a profile lets everyone waiting in", async () => {
    await join("acc-a", "alex");
    await join("acc-b", "blair");
    await call("acc-b", "follow", { handle: "alex" });
    await call("acc-a", "update", { open: true });
    expect((await call("acc-b", "lookup", { handle: "alex" })).body.person).toMatchObject({ relation: "following" });
  });
});

describe("public profiles", () => {
  it("lets anyone see a public profile's workouts, opens it to follows, and closing it makes it private again", async () => {
    await join("acc-a", "alex");
    await call("acc-a", "post", workout());
    await join("acc-c", "casey");
    expect((await call("acc-c", "lookup", { handle: "alex" })).body.person).toMatchObject({ canSee: false, public: false });
    expect((await call("acc-a", "update", { public: true })).body.profile).toMatchObject({ public: true, open: true });
    expect((await call("acc-c", "lookup", { handle: "alex" })).body.person).toMatchObject({ canSee: true, public: true, relation: "none" });
    expect((await call("acc-c", "person", { handle: "alex" })).body.posts).toHaveLength(1);
    // Strangers see it but it isn't in their feed until they follow.
    expect(await feedOf("acc-c")).toHaveLength(0);
    await call("acc-a", "block", { handle: "casey" });
    expect((await call("acc-c", "person", { handle: "alex" })).body.posts).toHaveLength(0);
    await call("acc-a", "unblock", { handle: "casey" });
    expect((await call("acc-a", "update", { open: false })).body.profile).toMatchObject({ public: false, open: false });
    expect((await call("acc-c", "lookup", { handle: "alex" })).body.person).toMatchObject({ canSee: false });
  });
});

describe("sending a workout", () => {
  const code = (name: string) => `r1~${Buffer.from(name).toString("base64url")}~back-squat.4~bench-press.3.s~barbell-row.3`;
  it("goes only to someone who follows each other with the sender, and shows in their activity", async () => {
    await friends(); // blair follows alex
    expect((await call("acc-a", "send", { handle: "blair", code: code("Leg day") })).body.error).toBe("notFriends");
    await call("acc-a", "follow", { handle: "blair" });
    await call("acc-b", "answer", { handle: "alex", accept: true });
    expect((await call("acc-a", "people", { list: "friends" })).body.people).toMatchObject([{ handle: "blair" }]);
    expect((await call("acc-a", "send", { handle: "blair", code: code("Leg day") })).code).toBe(200);
    const items = (await call("acc-b", "activity")).body.items as { kind: string; text?: string; code?: string }[];
    expect(items.find((i) => i.kind === "sent")).toMatchObject({ text: "Leg day", code: code("Leg day") });
  });

  it("refuses junk codes, links in the name and blocked people", async () => {
    await friends();
    await call("acc-a", "follow", { handle: "blair" });
    await call("acc-b", "answer", { handle: "alex", accept: true });
    expect((await call("acc-a", "send", { handle: "blair", code: "<script>" })).body.error).toBe("code");
    expect((await call("acc-a", "send", { handle: "blair", code: code("see spam.com") })).body.error).toBe("name.link");
    await call("acc-b", "block", { handle: "alex" });
    expect((await call("acc-a", "send", { handle: "blair", code: code("Leg day") })).code).toBe(404);
  });
});

describe("posting and the feed", () => {
  it("shows followers the summary only, once per workout", async () => {
    await friends();
    const p = await call("acc-a", "post", workout());
    const again = await call("acc-a", "post", workout());
    expect(again.body.id).toBe(p.body.id);
    const feed = await feedOf("acc-b");
    expect(feed).toHaveLength(1);
    expect(JSON.stringify(feed[0])).not.toContain("heartRate");
    // Someone who doesn't follow sees nothing, and can't open the post.
    await join("acc-c", "casey");
    expect(await feedOf("acc-c")).toHaveLength(0);
    expect((await call("acc-c", "thread", { id: p.body.id })).code).toBe(404);
    expect((await call("acc-c", "like", { id: p.body.id })).code).toBe(404);
  });

  it("answers the whole Friends tab in one request, the same as asking for each part", async () => {
    // Before joining it's the lifter's own state only.
    expect((await call("acc-a", "home")).body).toEqual({ profile: null });
    await friends();
    await call("acc-a", "post", workout());
    await call("acc-b", "live", { sessionId: "s9", exercise: "bench", done: 2, total: 9 });
    const home = (await call("acc-b", "home")).body;
    expect(home.me).toEqual((await call("acc-b", "me")).body);
    expect(home.feed).toEqual((await call("acc-b", "feed")).body);
    expect(home.training).toEqual((await call("acc-b", "training")).body.people);
    expect(home.suggest).toEqual((await call("acc-b", "suggest")).body.people);
    expect((home.feed as { posts: unknown[] }).posts).toHaveLength(1);
  });

  it("refuses workouts that are too old or empty", () => {
    expect(parsePost(workout("s1", NOW - 100 * DAY), NOW)).toEqual({ error: "old" });
    // Every set travels for the whole-workout view, checked, and without weights when the post hides them.
    const logged = (w: number | null) => ({
      ...workout(),
      body: {
        ...workout().body,
        exercises: [{ id: "bench", name: "", sets: 2, w, r: 5, pr: true, log: [{ w: 100, r: 5 }, { w: 9999, r: 5 }, { r: -1 }, "x"] }],
      },
    });
    const kept = parsePost(logged(100), NOW);
    expect("body" in kept && kept.body.exercises[0]).toMatchObject({
      pr: true,
      log: [
        { w: 100, r: 5 },
        { w: null, r: 5 },
      ],
    });
    const hidden = parsePost(logged(null), NOW);
    expect("body" in hidden && hidden.body.exercises[0]!.log).toEqual([
      { w: null, r: 5 },
      { w: null, r: 5 },
    ]);
    expect(parsePost({ ...workout(), body: { ...workout().body, exercises: [] } }, NOW)).toEqual({ error: "empty" });
  });

  it("likes and comments, and the author can delete any comment on their post", async () => {
    await friends();
    const id = (await call("acc-a", "post", workout())).body.id as string;
    expect((await call("acc-b", "like", { id })).body).toEqual({ likes: 1, liked: true });
    const c = await call("acc-b", "comment", { id, text: "Strong!" });
    expect(c.code).toBe(200);
    expect((await call("acc-b", "comment", { id, text: "dm me at spam.com" })).body.error).toBe("comment.link");
    const t = await call("acc-a", "thread", { id });
    expect(t.body.comments).toMatchObject([{ body: "Strong!", canDelete: true, mine: false }]);
    const act = await call("acc-a", "activity");
    expect((act.body.items as { kind: string }[]).map((i) => i.kind).sort()).toEqual(["comment", "follow", "like"]);
    expect((await call("acc-a", "me")).body.unread).toBe(0);
    await call("acc-a", "uncomment", { id: (c.body.comment as { id: string }).id });
    expect((await call("acc-a", "thread", { id })).body.comments).toEqual([]);
  });
});

describe("safety", () => {
  it("blocking removes follows both ways and hides each from the other", async () => {
    await friends();
    await call("acc-a", "follow", { handle: "blair" });
    await call("acc-b", "answer", { handle: "alex", accept: true });
    await call("acc-a", "post", workout());
    await call("acc-a", "block", { handle: "blair" });
    expect(await feedOf("acc-b")).toHaveLength(0);
    expect((await call("acc-b", "lookup", { handle: "alex" })).code).toBe(404);
    expect((await call("acc-b", "follow", { handle: "alex" })).code).toBe(404);
    expect(await query("SELECT * FROM follows")).toHaveLength(0);
    expect((await call("acc-a", "lookup", { handle: "blair" })).body.person).toMatchObject({ relation: "blocked" });
  });

  it(`hides a post after ${HIDE_AFTER} reports, and staff can bring it back or remove it`, async () => {
    await join("acc-a", "alex", { open: true });
    const id = (await call("acc-a", "post", workout())).body.id as string;
    for (const who of ["r1", "r2", "r3"]) {
      await join(who, `rep_${who}`);
      await call(who, "follow", { handle: "alex" });
      await call(who, "report", { kind: "post", id, reason: "spam" });
      await call(who, "report", { kind: "post", id, reason: "spam" }); // twice counts once
    }
    expect(await feedOf("r1")).toHaveLength(0);
    const [g] = await adminReports();
    expect(g).toMatchObject({ kind: "post", targetId: id, reports: 3, reasons: { spam: 3 }, hidden: true, author: { handle: "alex" } });
    await resolveReports("post", id, "dismiss");
    expect(await feedOf("r1")).toHaveLength(1);
    expect(await adminReports()).toEqual([]);
    await call("r1", "report", { kind: "post", id, reason: "abuse" });
    await resolveReports("post", id, "remove");
    expect(await feedOf("r1")).toHaveLength(0);
  });

  it("a suspended profile disappears and can't post, even after leaving and joining again", async () => {
    await friends();
    await call("acc-b", "report", { kind: "profile", id: "alex", reason: "abuse" });
    await resolveReports("profile", "acc-a", "suspend");
    expect((await call("acc-b", "lookup", { handle: "alex" })).code).toBe(404);
    expect((await call("acc-a", "post", workout())).body.error).toBe("suspended");
    await call("acc-a", "leave");
    expect((await join("acc-a", "alex2")).body.suspended).toBe(true);
  });

  it("deleting the account deletes everything on Friends", async () => {
    await friends();
    const id = (await call("acc-a", "post", workout())).body.id as string;
    await call("acc-b", "like", { id });
    await call("acc-b", "comment", { id, text: "Nice" });
    await deleteAccount("acc-b");
    for (const table of ["post_likes", "post_comments", "follows", "sent_workouts"])
      expect(await query(`SELECT * FROM ${table}`)).toHaveLength(0);
    expect(await query("SELECT * FROM social_profiles WHERE account_id = 'acc-b'")).toHaveLength(0);
  });
});

describe("captions, audiences, mutes, avatars and best lifts (stage 3)", () => {
  const ids = async (who: string) => (await feedOf(who)).map((p) => p.id);
  const personOf = async (who: string, handle: string) =>
    (await call(who, "lookup", { handle })).body.person as { avatar: string; muted: boolean; lifts: unknown[]; posts: number };

  it("keeps a caption through the filter, and refuses one with a link", async () => {
    await join("acc-a", "alex");
    expect((await call("acc-a", "post", { ...workout(), caption: "see www.spam.example" })).body.error).toBe("caption.link");
    const id = (await call("acc-a", "post", { ...workout(), caption: "  New squat best!  " })).body.id as string;
    expect((await call("acc-a", "feed")).body.posts).toMatchObject([{ id, caption: "New squat best!", audience: "all" }]);
    expect((await call("acc-a", "editPost", { id, caption: "" })).body).toMatchObject({ caption: "", audience: "all" });
  });

  it("shows a friends-only post only to people who follow each other, and an only-me post to no one else", async () => {
    await friends(); // blair follows alex; alex doesn't follow blair back yet
    await join("acc-c", "casey", { open: true });
    await call("acc-a", "update", { public: true });
    await call("acc-c", "follow", { handle: "alex" });
    const all = (await call("acc-a", "post", workout("s1"))).body.id as string;
    const friendsOnly = (await call("acc-a", "post", { ...workout("s2", NOW - 7_200_000), audience: "friends" })).body.id as string;
    const mine = (await call("acc-a", "post", { ...workout("s3", NOW - 10_800_000), audience: "me" })).body.id as string;
    expect(await ids("acc-a")).toEqual([all, friendsOnly, mine]);
    expect(await ids("acc-b")).toEqual([all]);
    expect((await call("acc-b", "thread", { id: friendsOnly })).code).toBe(404);
    expect((await call("acc-b", "like", { id: mine })).code).toBe(404);

    await call("acc-a", "follow", { handle: "blair" });
    await call("acc-b", "answer", { handle: "alex", accept: true });
    expect(await ids("acc-b")).toEqual([all, friendsOnly]);
    expect(await ids("acc-c")).toEqual([all]); // casey follows alex, alex doesn't follow casey
    expect((await personOf("acc-b", "alex")).posts).toBe(2);

    // The web page shows posts for everyone only.
    const { publicProfile } = await import("./publicProfile");
    expect((await publicProfile("alex"))?.recent).toHaveLength(1);
    expect((await publicProfile("alex"))?.posts).toBe(1);
  });

  it("uses the lifter's usual audience for a post that doesn't pick one", async () => {
    await friends();
    await call("acc-a", "update", { audience: "me" });
    await call("acc-a", "post", workout());
    expect(await ids("acc-b")).toEqual([]);
    expect(((await call("acc-a", "me")).body.profile as { audience: string }).audience).toBe("me");
  });

  it("mutes someone out of the feed without unfollowing, and unmutes", async () => {
    await friends();
    await call("acc-a", "post", workout());
    expect((await call("acc-b", "mute", { handle: "alex" })).body.person).toMatchObject({ muted: true, relation: "following" });
    expect(await ids("acc-b")).toEqual([]);
    expect(((await call("acc-b", "person", { handle: "alex" })).body.posts as unknown[]).length).toBe(1);
    expect((await call("acc-b", "people", { list: "muted" })).body.people).toMatchObject([{ handle: "alex" }]);
    await call("acc-b", "mute", { handle: "alex", on: false });
    expect(await ids("acc-b")).toHaveLength(1);
  });

  it("keeps only known avatars, and shows best lifts only to people who can see the posts", async () => {
    await friends();
    await join("acc-c", "casey");
    const lifts = [
      { id: "back-squat", w: 140, r: 3, at: NOW },
      { id: "bench", w: 100, r: 5, at: NOW },
      { id: "x", w: 9999, r: 1, at: NOW }, // refused
    ];
    await call("acc-a", "update", { avatar: "av-trophy", lifts });
    await call("acc-c", "update", { avatar: "not-an-avatar" });
    expect((await personOf("acc-b", "alex")).avatar).toBe("av-trophy");
    expect((await personOf("acc-b", "casey")).avatar).toBe("");
    expect((await personOf("acc-b", "alex")).lifts).toHaveLength(2);
    expect((await personOf("acc-c", "alex")).lifts).toEqual([]); // casey doesn't follow
    await call("acc-a", "update", { showLifts: false });
    expect((await personOf("acc-b", "alex")).lifts).toEqual([]);
    await call("acc-a", "update", { showLifts: true, weights: false });
    expect((await personOf("acc-b", "alex")).lifts).toEqual([]);
    expect((await call("acc-b", "feed")).body.posts).toEqual([]);
  });
});

describe("invite links and the leaderboard (stage 4)", () => {
  it("makes one reusable code, and accepting it makes two lifters follow each other whatever their settings", async () => {
    await join("acc-a", "alex");
    await join("acc-b", "blair"); // approves follow requests
    const r = await call("acc-a", "invite");
    const code = r.body.code as string;
    expect(code).toMatch(/^[2-9A-HJ-NP-Z]{8}$/);
    expect((await call("acc-a", "invite")).body.code).toBe(code);
    expect((await call("acc-b", "inviteInfo", { code: code.toLowerCase() })).body).toMatchObject({
      inviter: { handle: "alex" },
      self: false,
    });
    expect((await call("acc-a", "acceptInvite", { code })).body.error).toBe("self");
    expect((await call("acc-b", "acceptInvite", { code })).body).toEqual({ handle: "alex" });
    expect((await call("acc-a", "people", { list: "friends" })).body.people).toMatchObject([{ handle: "blair" }]);
    expect((await call("acc-b", "people", { list: "friends" })).body.people).toMatchObject([{ handle: "alex" }]);
  });

  it("refuses an expired, unknown or blocked invite, and one from a suspended lifter", async () => {
    await join("acc-a", "alex");
    await join("acc-b", "blair");
    await join("acc-c", "casey");
    const code = (await call("acc-a", "invite", {}, NOW)).body.code as string;
    expect((await call("acc-b", "acceptInvite", { code: "ZZZZZZZZ" })).body.error).toBe("invite");
    expect((await call("acc-b", "acceptInvite", { code }, NOW + 31 * DAY)).body.error).toBe("invite");
    await call("acc-a", "block", { handle: "casey" });
    expect((await call("acc-c", "inviteInfo", { code })).code).toBe(404);
    await resolveReports("profile", "acc-a", "suspend");
    expect((await call("acc-b", "acceptInvite", { code })).code).toBe(404);
  });

  it("ranks the lifter and everyone they follow by this week's posts they may see", async () => {
    await friends(); // blair follows alex
    await join("acc-c", "casey");
    const from = NOW - 2 * DAY;
    await call("acc-a", "post", workout("s1", NOW - DAY));
    await call("acc-a", "post", workout("s2", NOW - 3 * DAY)); // last week
    await call("acc-a", "post", { ...workout("s3", NOW - DAY / 2), audience: "me" }); // not for blair
    await call("acc-b", "post", workout("b1", NOW - DAY));
    await call("acc-c", "post", workout("c1", NOW - DAY)); // blair doesn't follow casey
    const rows = (await call("acc-b", "board", { from })).body.rows as { handle: string; workouts: number; sets: number; me: boolean }[];
    expect(rows.map((r) => [r.handle, r.workouts, r.me]).sort()).toEqual([
      ["alex", 1, false],
      ["blair", 1, true],
    ]);
    expect(rows.find((r) => r.handle === "alex")).toMatchObject({ sets: 12, minutes: 50, volume: 4200, prs: 1 });
    expect((await call("acc-a", "board", { from })).body.rows as { handle: string; workouts: number }[]).toMatchObject([
      { handle: "alex", workouts: 2 },
    ]);
    expect((await call("acc-b", "board", { from: NOW - 400 * DAY })).code).toBe(400);
  });
});

describe("challenges and training partners (stage 5)", () => {
  async function mutual() {
    await friends();
    await call("acc-a", "follow", { handle: "blair" });
    await call("acc-b", "answer", { handle: "alex", accept: true });
  }
  type Ch = { id: string; status: string; mine: boolean; members: { handle: string; joined: boolean; value: number }[] };
  const list = async (who: string, now = NOW) => (await call(who, "challenges", {}, now)).body.challenges as Ch[];

  it("invites mutual friends only, scores joined members from their posts in the window, and ends when the starter leaves", async () => {
    await mutual();
    await join("acc-c", "casey"); // not a friend of alex
    const bad = await call("acc-a", "challengeCreate", { name: "Most workouts", metric: "workouts", days: 7, handles: ["casey"] });
    expect(bad.body.error).toBe("notFriends");
    expect((await call("acc-a", "challengeCreate", { name: "x", metric: "naps", days: 7, handles: ["blair"] })).code).toBe(400);
    expect((await call("acc-a", "challengeCreate", { name: "x", metric: "sets", days: 9, handles: ["blair"] })).code).toBe(400);
    const r = await call("acc-a", "challengeCreate", { name: "Sets race", metric: "sets", days: 7, handles: ["blair", "casey"] });
    const id = r.body.id as string;
    expect((await list("acc-c")).length).toBe(0);
    const act = (await call("acc-b", "activity")).body.items as { kind: string; text?: string }[];
    expect(act).toContainEqual(expect.objectContaining({ kind: "challenge", text: "Sets race" }));

    await call("acc-a", "post", workout("s1", NOW + DAY));
    await call("acc-b", "post", workout("b1", NOW + DAY));
    await call("acc-b", "post", workout("b0", NOW - DAY)); // before it started
    let [c] = await list("acc-b", NOW + 2 * DAY);
    expect(c).toMatchObject({ id, status: "invited", mine: false });
    expect(c!.members.find((m) => m.handle === "blair")).toMatchObject({ joined: false, value: 0 });

    await call("acc-b", "challengeAnswer", { id, accept: true }, NOW + 2 * DAY);
    await call("acc-b", "post", { ...workout("b2", NOW + 2 * DAY), audience: "me" }); // doesn't count
    [c] = await list("acc-a", NOW + 3 * DAY);
    expect(c!.members.map((m) => [m.handle, m.joined, m.value]).sort()).toEqual([
      ["alex", true, 12],
      ["blair", true, 12],
    ]);
    // Finished challenges stay a while for the result, then go.
    expect((await list("acc-a", NOW + 10 * DAY)).length).toBe(1);
    expect((await list("acc-a", NOW + 30 * DAY)).length).toBe(0);
    expect((await call("acc-b", "challengeAnswer", { id, accept: true }, NOW + 8 * DAY)).code).toBe(404);

    await call("acc-a", "challengeLeave", { id });
    expect(await list("acc-b")).toEqual([]);
  });

  it("declining takes the lifter off; caps running challenges", async () => {
    await mutual();
    const make = () => call("acc-a", "challengeCreate", { name: "Go", metric: "workouts", days: 14, handles: ["blair"] });
    const id = (await make()).body.id as string;
    await call("acc-b", "challengeAnswer", { id, accept: false });
    expect(await list("acc-b")).toEqual([]);
    for (let i = 1; i < 10; i++) await make();
    expect((await make()).body.error).toBe("tooMany");
  });

  it("tags mutual friends on a post, shows them on it, and lets the tagged lifter remove themselves", async () => {
    await mutual();
    await join("acc-c", "casey");
    await call("acc-a", "post", { ...workout("s1"), partners: ["blair", "casey", "@BLAIR"] });
    let [p] = (await call("acc-b", "feed")).body.posts as { id: string; partners: { handle: string }[]; tagged: boolean }[];
    expect(p!.partners.map((x) => x.handle)).toEqual(["blair"]);
    expect(p!.tagged).toBe(true);
    expect((await call("acc-b", "activity")).body.items).toContainEqual(expect.objectContaining({ kind: "tag", handle: "alex" }));
    await call("acc-b", "untag", { id: p!.id });
    [p] = (await call("acc-a", "feed")).body.posts as (typeof p)[];
    expect(p!.partners).toEqual([]);
    // Editing sets them again; a post only the lifter sees has none.
    expect((await call("acc-a", "editPost", { id: p!.id, partners: ["blair"] })).body.partners).toMatchObject([{ handle: "blair" }]);
    expect((await call("acc-a", "editPost", { id: p!.id, audience: "me" })).body.partners).toEqual([]);
  });

  it("deleting an account removes its challenges and tags", async () => {
    await mutual();
    await call("acc-a", "challengeCreate", { name: "Go", metric: "workouts", days: 7, handles: ["blair"] });
    await call("acc-b", "post", { ...workout("b1"), partners: ["alex"] });
    await call("acc-a", "leave");
    for (const t of ["challenges", "challenge_members", "post_partners"]) expect(await query(`SELECT * FROM ${t}`), t).toEqual([]);
  });
});

describe("clubs and gym crews (stage 6)", () => {
  type Club = { id: string; code: string; mine: boolean; members: number; rows: { handle: string; workouts: number; me: boolean }[] };
  const from = NOW - 2 * DAY;
  const open = async (who: string, id: string) => (await call(who, "club", { id, from })).body.club as Club;

  it("starts a club anyone with its code can join, with a weekly board of what members posted", async () => {
    await join("acc-a", "alex");
    await join("acc-b", "blair");
    await join("acc-c", "casey");
    const { id, code } = (await call("acc-a", "clubCreate", { name: "Iron Barn crew" })).body as { id: string; code: string };
    expect(code).toMatch(/^[2-9A-HJ-NP-Z]{8}$/);
    expect((await call("acc-b", "clubInfo", { code: code.toLowerCase() })).body.club).toMatchObject({
      name: "Iron Barn crew",
      members: 1,
      owner: { handle: "alex" },
      joined: false,
    });
    expect((await call("acc-b", "club", { id, from })).code).toBe(404); // not a member yet
    await call("acc-b", "clubJoin", { code });
    await call("acc-b", "clubJoin", { code }); // twice is once
    await call("acc-a", "post", workout("s1", NOW - DAY));
    await call("acc-b", "post", workout("b1", NOW - DAY));
    await call("acc-b", "post", { ...workout("b2", NOW - DAY / 2), audience: "me" }); // never counts
    await call("acc-c", "post", workout("c1", NOW - DAY)); // not in it
    const c = await open("acc-b", id);
    expect(c.members).toBe(2);
    expect(c.rows.map((r) => [r.handle, r.workouts, r.me]).sort()).toEqual([
      ["alex", 1, false],
      ["blair", 1, true],
    ]);
    expect(((await call("acc-b", "clubs")).body.clubs as Club[])[0]).toMatchObject({ id, members: 2, mine: false });
  });

  it("lets the starter remove members and change the code, and deletes the club when they leave", async () => {
    await join("acc-a", "alex");
    await join("acc-b", "blair");
    const { id, code } = (await call("acc-a", "clubCreate", { name: "Crew" })).body as { id: string; code: string };
    await call("acc-b", "clubJoin", { code });
    expect((await call("acc-b", "clubManage", { id, remove: "alex" })).code).toBe(404); // only the starter
    await call("acc-a", "clubManage", { id, remove: "blair" });
    expect((await open("acc-a", id)).members).toBe(1);
    const fresh = (await call("acc-a", "clubManage", { id, newCode: true })).body.code as string;
    expect(fresh).not.toBe(code);
    expect((await call("acc-b", "clubJoin", { code })).body.error).toBe("club");
    await call("acc-b", "clubJoin", { code: fresh });
    await call("acc-b", "clubLeave", { id });
    expect((await open("acc-a", id)).members).toBe(1);
    await call("acc-a", "clubLeave", { id });
    expect(await query("SELECT * FROM clubs")).toEqual([]);
  });

  it("keeps blocked people out, caps clubs per lifter, and deleting the account removes its clubs", async () => {
    await join("acc-a", "alex");
    await join("acc-b", "blair");
    const { code } = (await call("acc-a", "clubCreate", { name: "Crew" })).body as { code: string };
    await call("acc-a", "block", { handle: "blair" });
    expect((await call("acc-b", "clubInfo", { code })).code).toBe(404);
    expect((await call("acc-b", "clubJoin", { code })).body.error).toBe("club");
    expect((await call("acc-a", "clubCreate", { name: "http://spam.example" })).body.error).toBe("name.link");
    for (let i = 0; i < 10; i++) await call("acc-b", "clubCreate", { name: `Crew ${i}` }, NOW + i * DAY);
    expect((await call("acc-b", "clubCreate", { name: "One more" }, NOW + 20 * DAY)).body.error).toBe("clubs");
    await call("acc-a", "leave");
    await call("acc-b", "leave");
    expect(await query("SELECT * FROM clubs")).toEqual([]);
    expect(await query("SELECT * FROM club_members")).toEqual([]);
  });
});
