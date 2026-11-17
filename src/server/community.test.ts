import { beforeEach, describe, expect, it, vi } from "vitest";

import { postPath, similarPosts } from "@/lib/community";
import { MSG_LANGS } from "@/lib/messageText";

import {
  board,
  changelog,
  comment,
  communityCleanup,
  createPost,
  deleteComment,
  deletePost,
  handle,
  merge,
  notifyFollowers,
  readShot,
  report,
  setFollow,
  setHidden,
  setStatus,
  shotFor,
  STAFF_ACCOUNT,
  thread,
  vote,
} from "./community";
import {
  communityEntries,
  communityIndexHtml,
  indexable,
  postHtml,
  postIdOf,
  publicBoard,
  publicThread,
  roadmapHtml,
} from "./communityPage";
import { batch, query, resetDb, run } from "./db";
import { notifyPlain } from "./push";
import { adminReports, resolveReports } from "./social";

// The Liftsmith community: ideas and bugs, votes, comments and the roadmap (docs/decisions/community.md).
vi.mock("./push", async (real) => ({ ...(await real<typeof import("./push")>()), notifyPlain: vi.fn(async () => 0) }));
const pushed = vi.mocked(notifyPlain);

const NOW = Date.UTC(2026, 10, 17);
const JPEG = `data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString("base64")}`;

async function lifter(id: string, name: string, birthYear = 1990, handle?: string) {
  await run("INSERT OR REPLACE INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'profile', ?, ?)", [
    id,
    JSON.stringify({ name, birthYear }),
    NOW,
  ]);
  if (handle)
    await run("INSERT INTO social_profiles (account_id, handle, name, agreed_at, created_at, suspended) VALUES (?, ?, ?, ?, ?, 0)", [
      id,
      handle,
      name,
      NOW,
      NOW,
    ]);
}
async function idea(by: string, title = "Rest timer on my watch face", extra: Record<string, unknown> = {}) {
  const r = await createPost(
    by,
    { kind: "idea", title, body: "So I can see it mid set.", platform: "android", version: "0.1.0", ...extra },
    NOW,
  );
  if ("error" in r) throw new Error(r.error);
  return r.post;
}

beforeEach(async () => {
  await resetDb();
  pushed.mockClear();
  await lifter("ana", "Ana Smith", 1990, "ana_lifts");
  await lifter("ben", "Ben Jones");
  await lifter("teen", "Tia Young", 2011);
});

describe("posting", () => {
  it("posts an idea with the author's vote and follow, and shows the Friends name", async () => {
    const p = await idea("ana");
    expect(p).toMatchObject({ kind: "idea", status: "review", votes: 1, name: "Ana Smith", handle: "ana_lifts", mine: true });
    expect(await query("SELECT * FROM community_follows WHERE post_id = ?", [p.id])).toHaveLength(1);
  });

  it("shows someone outside Friends by first name and last initial", async () => {
    expect((await idea("ben")).name).toBe("Ben J.");
  });

  it("refuses short titles, links and words the filter catches", async () => {
    expect(await createPost("ana", { kind: "idea", title: "Timer" }, NOW)).toEqual({ error: "short" });
    expect(await createPost("ana", { kind: "idea", title: "Look at example.com for this" }, NOW)).toEqual({ error: "link" });
    expect(await createPost("ana", { kind: "nope", title: "Rest timer on my watch" }, NOW)).toEqual({ error: "short" });
  });

  it("keeps five posts a day per account", async () => {
    for (let i = 0; i < 5; i++) await idea("ana", `Idea number ${i} for the app`);
    expect(await createPost("ana", { kind: "idea", title: "One more idea for the app" }, NOW)).toEqual({ error: "slow" });
  });

  it("keeps a screenshot for its author and staff only", async () => {
    const p = await idea("ana", "Rest timer stops on lock", { kind: "bug", shot: JPEG });
    expect(p.shot).toBe(true);
    expect(await shotFor(p.id, "ana")).not.toBeNull();
    expect(await shotFor(p.id, "staff")).not.toBeNull();
    expect(await shotFor(p.id, "ben")).toBeNull();
    expect((await thread(p.id, "ben"))!.post.shot).toBeUndefined();
    expect(readShot("data:image/png;base64,AAAA")).toBe("bad");
    expect(await createPost("ana", { kind: "bug", title: "Another bug report here", shot: "data:image/jpeg;base64,AAAA" }, NOW)).toEqual({
      error: "image",
    });
  });

  it("never shows an under-18's name, and keeps their posts off the website", async () => {
    const p = await idea("teen", "Plate math in kilos please");
    expect(p).toMatchObject({ name: "", handle: "" });
    expect((await board(null)).posts.map((x) => x.id)).toContain(p.id);
    expect((await publicBoard()).posts.map((x) => x.id)).not.toContain(p.id);
    expect(await publicThread(p.id)).toBeNull();
  });

  it("lets a blocked account read but not post", async () => {
    await run("INSERT INTO community_bans (account_id, at) VALUES ('ben', ?)", [NOW]);
    expect(await createPost("ben", { kind: "idea", title: "Rest timer on my watch" }, NOW)).toEqual({ error: "blocked" });
  });
});

describe("votes and follows", () => {
  it("counts one vote per account and follows the post", async () => {
    const p = await idea("ana");
    expect(await vote("ben", p.id, true, NOW)).toEqual({ votes: 2 });
    expect(await vote("ben", p.id, true, NOW)).toEqual({ votes: 2 });
    const b = await board("ben");
    expect(b.voted).toEqual([p.id]);
    expect(b.following).toEqual([p.id]);
    expect(await vote("ben", p.id, false, NOW)).toEqual({ votes: 1 });
  });

  it("a vote doesn't turn updates back on after they were turned off", async () => {
    const p = await idea("ana");
    await setFollow("ben", p.id, false);
    await vote("ben", p.id, true, NOW);
    expect((await board("ben")).following).toEqual([]);
  });
});

describe("comments and mentions", () => {
  it("tells the author about a reply, and a mention reaches only people already in the post", async () => {
    await lifter("cy", "Cy Stranger", 1990, "cy_stranger");
    await lifter("di", "Di Voter", 1990, "di_votes");
    const p = await idea("ben");
    await vote("di", p.id, true, NOW);
    const r = await comment("ana", p.id, "Yes please, @di_votes and @cy_stranger would love this", NOW);
    expect("comment" in r && r.comment.name).toBe("Ana Smith");
    const to = pushed.mock.calls.map((c) => [c[0], c[1]]);
    expect(to).toContainEqual(["ben", "communityComment"]);
    expect(to).toContainEqual(["di", "communityMention"]);
    expect(to.map((x) => x[0])).not.toContain("cy");
    // Commenting follows the post.
    expect((await board("ana")).following).toContain(p.id);
  });

  it("lets the writer delete their own comment, and the count follows", async () => {
    const p = await idea("ben");
    const r = await comment("ana", p.id, "Same here", NOW);
    if (!("comment" in r)) throw new Error();
    expect(await deleteComment("ben", r.comment.id)).toBe(false);
    expect(await deleteComment("ana", r.comment.id)).toBe(true);
    expect((await thread(p.id, null))!.post.comments).toBe(0);
  });

  it("answers from staff show as the Liftsmith team", async () => {
    const p = await idea("ben");
    const r = await comment(STAFF_ACCOUNT, p.id, "Thanks, we're looking at it", NOW, true);
    expect("comment" in r && r.comment).toMatchObject({ staff: true, name: "Liftsmith" });
    expect(pushed.mock.calls.map((c) => c[1])).toContain("communityTeam");
  });
});

describe("statuses, the roadmap and the changelog", () => {
  it("tells followers when an idea ships and puts it in the changelog", async () => {
    const p = await idea("ana");
    await vote("ben", p.id, true, NOW);
    const r = await setStatus(p.id, "shipped", "In version 0.2: the rest timer shows on the watch face.", NOW + 1000);
    expect(r).toEqual({ post: { id: p.id, title: p.title, kind: "idea" }, push: "communityShipped" });
    expect(await notifyFollowers(p.id, r!.push!, p.title)).toBe(2);
    expect(pushed.mock.calls.map((c) => [c[0], c[1]])).toEqual([
      ["ana", "communityShipped"],
      ["ben", "communityShipped"],
    ]);
    const log = await changelog();
    expect(log).toEqual([expect.objectContaining({ postId: p.id, status: "shipped", title: p.title, kind: "idea" })]);
    expect((await thread(p.id, null))!.updates).toHaveLength(1);
  });

  it("a note alone adds to the timeline without a push", async () => {
    const p = await idea("ana");
    expect(await setStatus(p.id, "review", "", NOW)).toBeNull();
    expect((await setStatus(p.id, "review", "We'd like more detail", NOW))!.push).toBeNull();
  });

  it("only lets the author delete a post while it's under review", async () => {
    const p = await idea("ana");
    expect(await deletePost("ben", p.id)).toBe(false);
    await setStatus(p.id, "planned", "", NOW);
    expect(await deletePost("ana", p.id)).toBe(false);
    const q = await idea("ana", "Dark mode for the watch");
    expect(await deletePost("ana", q.id)).toBe(true);
    expect(await thread(q.id, "ana")).toBeNull();
  });
});

describe("merging duplicates", () => {
  it("moves votes and followers over, each counted once", async () => {
    const a = await idea("ana", "Rest timer on my watch face");
    const b = await idea("ben", "Show rest time on the watch");
    await vote("ana", b.id, true, NOW);
    expect(await merge(b.id, a.id, NOW)).toBe(true);
    const t = await thread(a.id, null);
    expect(t!.post.votes).toBe(2);
    const old = await thread(b.id, null);
    expect(old!.post.status).toBe("merged");
    expect(old!.merged).toEqual({ id: a.id, title: a.title });
    // A merged post leaves the board and can't be merged again.
    expect((await board(null)).posts.map((p) => p.id)).not.toContain(b.id);
    expect(await merge(b.id, a.id, NOW)).toBe(false);
    expect(await vote("teen", b.id, true, NOW)).toEqual({ error: "gone" });
  });
});

describe("reports", () => {
  it("three people hide a post, and the Reports tab handles it", async () => {
    await lifter("cy", "Cy", 1990);
    await lifter("di", "Di", 1990);
    const p = await idea("ana");
    for (const who of ["ben", "cy", "di"]) expect(await report(who, { post: p.id, reason: "spam" }, NOW)).toEqual({ ok: true });
    expect(await report("ana", { post: p.id, reason: "spam" }, NOW)).toEqual({ error: "gone" });
    expect((await board(null)).posts).toHaveLength(0);
    // The author still sees it, marked.
    expect((await board("ana")).posts[0]).toMatchObject({ id: p.id, hidden: true });
    const group = (await adminReports()).find((g) => g.kind === "feedback");
    expect(group).toMatchObject({ targetId: `p:${p.id}`, reports: 3, hidden: true, content: `Community post: ${p.title}` });
    expect(await resolveReports("feedback", `p:${p.id}`, "dismiss")).toBe(true);
    expect((await board(null)).posts).toHaveLength(1);
    expect(await resolveReports("feedback", `p:${p.id}`, "suspend")).toBe(true);
    expect(await createPost("ana", { kind: "idea", title: "Another good idea here" }, NOW)).toEqual({ error: "blocked" });
  });

  it("staff can hide and show a comment", async () => {
    const p = await idea("ben");
    const r = await comment("ana", p.id, "Same here", NOW);
    if (!("comment" in r)) throw new Error();
    expect(await setHidden({ comment: r.comment.id }, true)).toBe(true);
    expect((await thread(p.id, "ben"))!.comments).toHaveLength(0);
    expect((await thread(p.id, "ana"))!.comments).toHaveLength(1);
  });
});

describe("the app's one route", () => {
  it("answers each op with a status the app reads", async () => {
    expect(await handle("ana", { op: "nope" })).toEqual({ status: 400, body: { error: "Bad request." } });
    const made = await handle("ana", { op: "create", kind: "bug", title: "Rest timer stops on lock" }, NOW);
    expect(made.status).toBe(200);
    const id = (made.body as { post: { id: string } }).post.id;
    expect(await handle("ben", { op: "vote", id }, NOW)).toEqual({ status: 200, body: { votes: 2 } });
    expect(await handle("ben", { op: "vote", id: "AAAAAAAAAAAA" }, NOW)).toMatchObject({ status: 404 });
  });
});

describe("deleting an account", () => {
  it("takes its votes off, deletes posts under review and keeps answered ones without a name", async () => {
    const open = await idea("ana", "Rest timer on my watch face");
    const planned = await idea("ana", "Plate math for kilos");
    await setStatus(planned.id, "planned", "", NOW);
    const other = await idea("ben", "Dark mode on the watch");
    await vote("ana", other.id, true, NOW);
    await batch(communityCleanup("ana"));
    expect(await thread(open.id, null)).toBeNull();
    expect((await thread(planned.id, null))!.post).toMatchObject({ name: "", handle: "" });
    expect((await thread(other.id, null))!.post.votes).toBe(1);
  });
});

describe("the website's pages", () => {
  it("draws the index, roadmap and a post in every language, with nothing an under-18 wrote", async () => {
    const p = await idea("ana");
    await setStatus(p.id, "planned", "Coming soon", NOW);
    await comment("teen", p.id, "I want this too", NOW);
    await comment("ben", p.id, "Same, @ana_lifts", NOW);
    const { posts, shipped } = await publicBoard();
    const t = (await publicThread(p.id))!;
    expect(t.comments.map((c) => c.body)).toEqual(["Same, @ana_lifts"]);
    for (const lang of MSG_LANGS) {
      expect(communityIndexHtml(lang, posts, shipped)).toContain(p.title);
      expect(roadmapHtml(lang, posts, shipped)).toContain(postPath(p));
      const html = postHtml(lang, t.post, t.comments, t.updates);
      expect(html).toContain('<span class="mention">@ana_lifts</span>');
      expect(html).not.toContain("<script>");
    }
  });

  it("indexes posts with votes or an answer, and finds a post from its address", async () => {
    const p = await idea("ana");
    expect(indexable(p)).toBe(false);
    await setStatus(p.id, "planned", "", NOW);
    const { posts, shipped } = await publicBoard();
    expect(communityEntries(posts, shipped).map((e) => e.path)).toEqual(["/community/", "/community/roadmap/", postPath(p)]);
    expect(postIdOf(postPath(p).split("/")[2]!)).toBe(p.id);
    expect(postIdOf("no-id")).toBeNull();
  });
});

describe("duplicate suggestions", () => {
  it("finds posts sharing the title's words, best first", async () => {
    const a = await idea("ana", "Rest timer on my watch face");
    const b = await idea("ben", "Plate calculator in kilos");
    const { posts } = await board(null);
    expect(similarPosts("watch rest timer", posts).map((p) => p.id)).toEqual([a.id]);
    expect(similarPosts("kilos plate", posts).map((p) => p.id)).toEqual([b.id]);
    expect(similarPosts("squat depth", posts)).toEqual([]);
  });
});
