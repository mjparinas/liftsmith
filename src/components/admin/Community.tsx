"use client";

// Admin › Community (docs/decisions/community.md): every idea and bug lifters posted, newest first. Staff move a post
// through its statuses with a note (its followers get a push; "Shipped" puts it in the changelog), merge a duplicate
// into the post it repeats, answer as the Liftsmith team, hide or remove a post or comment, and block an account from
// posting. Reports on posts and comments also come to the Reports tab with the rest. Support staff can read; only
// admins act. Web only, English.
import { useCallback, useEffect, useMemo, useState } from "react";

import { STAFF_STATUSES, type Status } from "@/lib/community";
import type { AdminPost } from "@/server/community";

import { Card } from "./charts";
import { Loading, RowBones } from "./Skeletons";
import { ago } from "./time";

const STATUS_NAME: Record<Status, string> = {
  review: "Under review",
  planned: "Planned",
  progress: "In progress",
  shipped: "Shipped",
  wont: "Won't do",
  merged: "Merged",
};
const box = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm";
const btn = "press rounded-lg border border-line px-3 py-1.5 text-sm text-muted";
const danger = "press rounded-lg border border-bad/40 px-3 py-1.5 text-sm text-bad";

type Comment = {
  id: string;
  body: string;
  name: string;
  handle: string;
  staff: boolean;
  at: number;
  accountId: string;
  hidden: boolean;
  teen: boolean;
};
type Detail = { comments: Comment[]; updates: { status: Status; note: string; at: number }[] };

async function send(body: object): Promise<string | null> {
  const r = await fetch("/api/admin/community/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.ok ? null : (((await r.json().catch(() => ({}))) as { error?: string }).error ?? "That didn't work.");
}

export function Community({ admin }: { admin: boolean }) {
  const [posts, setPosts] = useState<AdminPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [filter, setFilter] = useState<Status | "all" | "hidden">("review");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/community/")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const j = (await r.json()) as { posts: AdminPost[] };
        if (live) setPosts(j.posts);
      })
      .catch(() => live && setError("The community didn't load."));
    return () => {
      live = false;
    };
  }, [version]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: posts?.length ?? 0, hidden: 0 };
    for (const p of posts ?? []) {
      c[p.status] = (c[p.status] ?? 0) + 1;
      if (p.hiddenBy) c.hidden!++;
    }
    return c;
  }, [posts]);
  const needle = q.trim().toLowerCase();
  const shown = (posts ?? [])
    .filter((p) => (filter === "all" ? true : filter === "hidden" ? !!p.hiddenBy : p.status === filter))
    .filter((p) => !needle || `${p.title} ${p.body} ${p.name} ${p.id}`.toLowerCase().includes(needle));

  return (
    <Card title="Community: ideas and bugs">
      <p className="text-sm text-muted">
        What lifters posted in the app&apos;s community, with their votes. Set a status with a note to tell everyone following it (Shipped
        adds it to the changelog on the website), merge a duplicate into the post it repeats (votes and followers move over), answer as the
        Liftsmith team, or hide, remove and block. Reports on posts and comments are on the Reports tab too. Screenshots are only ever seen
        by their author and staff; an under-18&apos;s posts never show on the website.
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {(["review", "planned", "progress", "shipped", "wont", "merged", "hidden", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`${btn} ${filter === f ? "border-accent text-ink" : ""}`}
          >
            {f === "all" ? "All" : f === "hidden" ? "Hidden" : STATUS_NAME[f]} ({counts[f] ?? 0})
          </button>
        ))}
      </div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search titles, details, names or ids"
        aria-label="Search posts"
        className={`${box} mt-3`}
      />
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}
      {posts === null ? (
        !error && (
          <Loading label="Loading the community" className="mt-3">
            <RowBones n={4} />
          </Loading>
        )
      ) : shown.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing here.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {shown.slice(0, 200).map((p) => (
            <li key={p.id} className="py-3">
              <button
                type="button"
                onClick={() => setOpen(open === p.id ? null : p.id)}
                aria-expanded={open === p.id}
                className="press w-full text-left"
              >
                <p className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-line px-2 py-0.5 text-xs text-muted">{p.kind}</span>
                  <span className="break-words font-semibold">{p.title}</span>
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {STATUS_NAME[p.status]} · {p.votes} {p.votes === 1 ? "vote" : "votes"} · {p.comments}{" "}
                  {p.comments === 1 ? "comment" : "comments"} · {p.name || "no name"}
                  {p.teen ? " (under 18)" : ""} · {ago(p.createdAt)}
                  {p.platform ? ` · ${p.platform} ${p.version}` : ""}
                  {p.hasShot ? " · screenshot" : ""}
                  {p.reports ? ` · ${p.reports} open ${p.reports === 1 ? "report" : "reports"}` : ""}
                  {p.hiddenBy ? ` · hidden by ${p.hiddenBy}` : ""}
                </p>
              </button>
              {open === p.id && <PostDetail post={p} posts={posts} admin={admin} onChange={reload} />}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function PostDetail({ post, posts, admin, onChange }: { post: AdminPost; posts: AdminPost[]; admin: boolean; onChange: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [status, setStatus] = useState<Status>(post.status === "merged" ? "review" : post.status);
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [into, setInto] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    let live = true;
    fetch(`/api/admin/community/?id=${encodeURIComponent(post.id)}`)
      .then(async (r) => (r.ok ? ((await r.json()) as Detail) : null))
      .then((d) => live && setDetail(d))
      .catch(() => live && setDetail(null));
    return () => {
      live = false;
    };
  }, [post.id, v]);
  const act = async (body: object, done: string) => {
    const e = await send(body);
    setMsg(e ?? done);
    if (!e) {
      setV((x) => x + 1);
      onChange();
    }
  };
  const targets = posts.filter((p) => p.id !== post.id && p.status !== "merged");
  const needle = into.trim().toLowerCase();
  const matches = needle ? targets.filter((p) => `${p.title} ${p.id}`.toLowerCase().includes(needle)).slice(0, 6) : [];

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-line p-3">
      {post.body && <p className="whitespace-pre-wrap break-words text-sm">{post.body}</p>}
      <p className="text-xs text-muted">
        Id {post.id} · account {post.accountId || "deleted"} ·{" "}
        <a className="underline" href={`/community/${post.id}/`} target="_blank" rel="noreferrer">
          website page
        </a>
      </p>
      {post.hasShot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/admin/community/?shot=${encodeURIComponent(post.id)}`}
          alt="The lifter's screenshot"
          className="max-h-96 rounded-lg border border-line"
        />
      )}
      {msg && (
        <p role="status" className="text-sm text-muted">
          {msg}
        </p>
      )}
      {admin && post.status !== "merged" && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Status</p>
          <div className="flex flex-wrap gap-2">
            {STAFF_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={`${btn} ${status === s ? "border-accent text-ink" : ""}`}
              >
                {STATUS_NAME[s]}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={600}
            rows={2}
            placeholder="A note on its timeline (optional; shows in the changelog when shipped)"
            aria-label="Note"
            className={box}
          />
          <button
            type="button"
            className={btn}
            disabled={status === post.status && !note.trim()}
            onClick={() =>
              void act(
                { op: "status", id: post.id, status, note },
                status === post.status ? "Note added." : "Status changed. Followers are being told.",
              )
            }
          >
            {status === post.status ? "Add the note" : `Set to ${STATUS_NAME[status]}`}
          </button>
        </div>
      )}
      {admin && post.status !== "merged" && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Merge this duplicate into…</p>
          <input
            value={into}
            onChange={(e) => setInto(e.target.value)}
            placeholder="Search the post it repeats"
            aria-label="Post to merge into"
            className={box}
          />
          {matches.length > 0 && (
            <ul className="space-y-1">
              {matches.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 break-words">
                    {m.title}{" "}
                    <span className="text-muted">
                      ({m.votes} votes, {STATUS_NAME[m.status]})
                    </span>
                  </span>
                  <button
                    type="button"
                    className={btn}
                    onClick={() => void act({ op: "merge", id: post.id, into: m.id }, `Merged into “${m.title}”.`)}
                  >
                    Merge into this
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {detail && detail.updates.length > 0 && (
        <div>
          <p className="text-sm font-semibold">Timeline</p>
          <ul className="mt-1 space-y-1 text-sm text-muted">
            {detail.updates.map((u) => (
              <li key={`${u.status}-${u.at}`}>
                {ago(u.at)}: {STATUS_NAME[u.status]}
                {u.note ? ` · ${u.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="text-sm font-semibold">Comments</p>
        {!detail ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : detail.comments.length === 0 ? (
          <p className="text-sm text-muted">None yet.</p>
        ) : (
          <ul className="mt-1 divide-y divide-line">
            {detail.comments.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start gap-2 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="text-muted">
                    {c.staff ? "Liftsmith team" : c.name || "no name"}
                    {c.handle ? ` @${c.handle}` : ""}
                    {c.teen ? " (under 18)" : ""} · {ago(c.at)}
                    {c.hidden ? " · hidden" : ""}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{c.body}</p>
                </div>
                {admin && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={btn}
                      onClick={() => void act({ op: c.hidden ? "show" : "hide", comment: c.id }, c.hidden ? "Shown again." : "Hidden.")}
                    >
                      {c.hidden ? "Show" : "Hide"}
                    </button>
                    <button type="button" className={danger} onClick={() => void act({ op: "remove", comment: c.id }, "Comment removed.")}>
                      Remove
                    </button>
                    {!c.staff && (
                      <button
                        type="button"
                        className={danger}
                        onClick={() => void act({ op: "block", account: c.accountId }, "Blocked from the community.")}
                      >
                        Block
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {admin && post.status !== "merged" && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Reply as the Liftsmith team</p>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={1000}
            rows={3}
            aria-label="Reply as the Liftsmith team"
            className={box}
          />
          <button
            type="button"
            className={btn}
            disabled={!reply.trim()}
            onClick={() => void act({ op: "reply", id: post.id, body: reply }, "Reply posted.").then(() => setReply(""))}
          >
            Post the reply
          </button>
        </div>
      )}
      {admin && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btn}
            onClick={() => void act({ op: post.hiddenBy ? "show" : "hide", post: post.id }, post.hiddenBy ? "Shown again." : "Hidden.")}
          >
            {post.hiddenBy ? "Show the post" : "Hide the post"}
          </button>
          <button type="button" className={danger} onClick={() => void act({ op: "remove", post: post.id }, "Post removed.")}>
            Remove the post
          </button>
          {post.accountId && (
            <>
              <button
                type="button"
                className={danger}
                onClick={() => void act({ op: "block", account: post.accountId }, "The author is blocked from the community.")}
              >
                Block the author
              </button>
              <button
                type="button"
                className={btn}
                onClick={() => void act({ op: "unblock", account: post.accountId }, "The author can post again.")}
              >
                Unblock
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
