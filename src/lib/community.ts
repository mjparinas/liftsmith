// The Liftsmith community (Melvin, 2026-11-17: "a community for the app itself. like voting for features that are
// missing, adding comments, mentioning bugs"; docs/decisions/community.md). Lifters post ideas and bugs, vote on them,
// comment and @mention, and staff move each one through its statuses on Admin › Community. The shared types and the
// app's calls; the server is src/server/community.ts.
import { api, AuthError, readAccount } from "./auth";
import { flag } from "./flags";

/** The admin panel's switch (flags.ts `community`): off hides the Settings row and stops new posts. */
export const communityOn = () => flag("community") !== false;

export const POST_KINDS = ["idea", "bug"] as const;
export type PostKind = (typeof POST_KINDS)[number];

/** Where an idea or bug is. "merged" means it was a duplicate of another one (`mergedInto`). */
export const STATUSES = ["review", "planned", "progress", "shipped", "wont", "merged"] as const;
export type Status = (typeof STATUSES)[number];
/** The statuses staff pick on Admin › Community (merging has its own button). */
export const STAFF_STATUSES = ["review", "planned", "progress", "shipped", "wont"] as const satisfies readonly Status[];
/** Still being decided or worked on: the board's default view. */
export const OPEN_STATUSES: readonly Status[] = ["review", "planned", "progress"];

export const COMMUNITY_LIMITS = {
  title: 100,
  /** The shortest title worth posting. */
  titleMin: 8,
  body: 2000,
  comment: 1000,
  /** Ideas and bugs one account can post a day. */
  postsPerDay: 5,
  commentsPerDay: 60,
  votesPerDay: 300,
  /** One screenshot, a JPEG of at most this many bytes, shrunk on the device first. */
  shot: 450_000,
  /** Posts the board sends at once (the app sorts and searches them on the device). */
  board: 300,
  /** Reports from different people that hide a post or comment until staff look. */
  hideAfter: 3,
} as const;

export interface CommunityPost {
  id: string;
  kind: PostKind;
  title: string;
  body: string;
  status: Status;
  votes: number;
  comments: number;
  /** The author's name as others see it, "" for "A Liftsmith lifter" (under 18, or no name). */
  name: string;
  /** Their Friends handle, for an @mention; "" when they have none or are under 18. */
  handle: string;
  createdAt: number;
  statusAt: number;
  /** For "merged": the one it went into. */
  mergedInto?: string;
  /** The author's own post (only in answers to them). */
  mine?: boolean;
  /** The author attached a screenshot; only the author and staff ever see it. */
  shot?: boolean;
  /** Hidden after reports, until staff look: only its author sees it, with this mark. */
  hidden?: boolean;
}

export interface CommunityComment {
  id: string;
  body: string;
  name: string;
  handle: string;
  /** Written by the Liftsmith team. */
  staff: boolean;
  at: number;
  mine?: boolean;
}

/** A status change, with the team's note: the post's timeline and, for "shipped", the changelog. */
export interface CommunityUpdate {
  postId: string;
  status: Status;
  note: string;
  at: number;
  /** In the changelog: the post's title and kind. */
  title?: string;
  kind?: PostKind;
}

export interface CommunityBoard {
  posts: CommunityPost[];
  /** For a signed-in lifter: what they voted for and which posts they get updates on. */
  voted?: string[];
  following?: string[];
}

export interface CommunityThread {
  post: CommunityPost;
  comments: CommunityComment[];
  updates: CommunityUpdate[];
  /** The post it was merged into, when it was (title and id), to link to. */
  merged?: { id: string; title: string } | null;
  voted?: boolean;
  following?: boolean;
}

export type CommunityError = "slow" | "link" | "words" | "short" | "gone" | "blocked" | "image" | "signedOut" | "offline" | "off";

const token = () => readAccount()?.token;
const mustToken = () => {
  const t = token();
  if (!t) throw new AuthError("signedOut", 401);
  return t;
};
const post = <T>(body: Record<string, unknown>) => api<T>("/api/community/", { token: mustToken(), body });

export const loadBoard = () => api<CommunityBoard>("/api/community/", { token: token() });
export const loadThread = (id: string) => api<CommunityThread>(`/api/community/?id=${encodeURIComponent(id)}`, { token: token() });
export const loadChangelog = () => api<{ updates: CommunityUpdate[] }>("/api/community/?changelog=1");

export const createPost = async (p: { kind: PostKind; title: string; body: string; shot?: string; platform: string; version: string }) =>
  (await post<{ post: CommunityPost }>({ op: "create", ...p })).post;
export const vote = (id: string, on: boolean) => post<{ votes: number }>({ op: on ? "vote" : "unvote", id });
export const follow = (id: string, on: boolean) => post<{ ok: true }>({ op: "follow", id, on });
export const addComment = async (id: string, body: string) =>
  (await post<{ comment: CommunityComment }>({ op: "comment", id, body })).comment;
export const deleteComment = (id: string) => post<{ ok: true }>({ op: "uncomment", id });
export const deletePost = (id: string) => post<{ ok: true }>({ op: "delete", id });
export const reportCommunity = (target: { post?: string; comment?: string }, reason: string, note: string) =>
  post<{ ok: true }>({ op: "report", ...target, reason, note });

/** The author's own screenshot, as an object URL (the picture needs the sign-in, so an image tag can't load it by address). */
export async function loadShot(postId: string): Promise<string | null> {
  const t = token();
  if (!t) return null;
  const { apiUrl } = await import("./auth");
  const r = await fetch(apiUrl(`/api/community/shot/?post=${encodeURIComponent(postId)}`), {
    headers: { Authorization: `Bearer ${t}` },
  }).catch(() => null);
  if (!r?.ok) return null;
  return URL.createObjectURL(await r.blob());
}

/** The error code from a refusal, for the words around the form. */
export function communityError(e: unknown): CommunityError | "other" {
  const code = e instanceof AuthError ? e.message : "";
  if (e instanceof AuthError && e.status === 401) return "signedOut";
  return (["slow", "link", "words", "short", "gone", "blocked", "image", "offline", "off"] as const).find((c) => c === code) ?? "other";
}

/** Lowercase words of three letters or more, for matching a new title against what's already posted. */
const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length >= 3),
  );

/**
 * Posts that look like the one being written (shared words in the title), best match first: shown under the title box
 * so a lifter votes for an idea that's already there instead of posting it twice. Works on the board the app already has.
 */
export function similarPosts(title: string, posts: readonly CommunityPost[], max = 3): CommunityPost[] {
  const mine = words(title);
  if (mine.size < 1) return [];
  return posts
    .filter((p) => p.status !== "merged")
    .map((p) => {
      const theirs = words(p.title);
      let shared = 0;
      for (const w of mine) if (theirs.has(w)) shared++;
      return { p, score: shared / Math.max(1, Math.min(mine.size, theirs.size)) };
    })
    .filter((x) => x.score >= 0.5)
    .sort((a, b) => b.score - a.score || b.p.votes - a.p.votes)
    .slice(0, max)
    .map((x) => x.p);
}

/** Search the board on the device: every word typed appears in the title or details. */
export function searchPosts(q: string, posts: readonly CommunityPost[]): CommunityPost[] {
  const want = [...words(q)];
  if (!want.length) return [...posts];
  return posts.filter((p) => {
    const have = `${p.title} ${p.body}`.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
    return want.every((w) => have.includes(w));
  });
}

export type Sort = "top" | "new";
export const sortPosts = (posts: readonly CommunityPost[], sort: Sort) =>
  [...posts].sort((a, b) => (sort === "top" ? b.votes - a.votes || b.createdAt - a.createdAt : b.createdAt - a.createdAt));

/** The @handles named in a comment, lowercased, at most five. */
export function mentionsIn(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/(?:^|[^\w@])@([a-z0-9_]{3,20})\b/gi)) out.add(m[1]!.toLowerCase());
  return [...out].slice(0, 5);
}

/** Splits a comment into plain text and @mentions, for drawing the mentions in the accent colour. */
export function mentionParts(text: string): { text: string; mention: boolean }[] {
  const out: { text: string; mention: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(/(^|[^\w@])(@[a-z0-9_]{3,20})\b/gi)) {
    const start = m.index + m[1]!.length;
    if (start > last) out.push({ text: text.slice(last, start), mention: false });
    out.push({ text: m[2]!, mention: true });
    last = start + m[2]!.length;
  }
  if (last < text.length) out.push({ text: text.slice(last), mention: false });
  return out;
}

/** The page on the website for a post: /community/<slug>-<id>/ (src/server/communityPage.ts). */
export function postSlug(title: string): string {
  const s = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return s || "post";
}
export const postPath = (p?: Pick<CommunityPost, "id" | "title">) => (p ? `/community/${postSlug(p.title)}-${p.id}/` : "/community/");

/** The posts a lifter follows whose status changed since they last looked: "shipped for you" on the board. */
export function newsFor(board: CommunityBoard, seenAt: number): CommunityPost[] {
  const following = new Set(board.following ?? []);
  return board.posts
    .filter((p) => following.has(p.id) && p.statusAt > seenAt && p.status !== "review" && p.status !== "merged")
    .sort((a, b) => b.statusAt - a.statusAt)
    .slice(0, 5);
}

/** When this device last opened the board, so the updates card shows only what's new (wiped with the other liftsmith.* keys). */
export const SEEN_KEY = "liftsmith.community.seen";
export function seenAt(): number {
  try {
    return Number(localStorage.getItem(SEEN_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}
export function markSeen(now = Date.now()) {
  try {
    localStorage.setItem(SEEN_KEY, String(now));
  } catch {}
}
