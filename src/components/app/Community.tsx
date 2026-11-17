"use client";

// The Liftsmith community (Settings › Help › Community, #/community; docs/decisions/community.md): ideas
// and bugs about the app itself, with votes, comments, @mentions, a roadmap and a changelog. #/community/new opens the
// form (#/community/new-bug starts on a bug), #/community/<id> one post. Anyone can read; posting, voting and
// commenting need an account. The board loads once and is sorted and searched on the device.
import { useEffect, useMemo, useState } from "react";

import { useAccount } from "@/lib/auth";
import {
  addComment,
  COMMUNITY_LIMITS,
  communityError,
  createPost,
  deleteComment,
  deletePost,
  follow,
  loadBoard,
  loadChangelog,
  loadShot,
  loadThread,
  markSeen,
  mentionParts,
  newsFor,
  OPEN_STATUSES,
  postPath,
  reportCommunity,
  searchPosts,
  seenAt,
  similarPosts,
  sortPosts,
  vote,
  type CommunityBoard,
  type CommunityComment,
  type CommunityPost,
  type CommunityThread,
  type CommunityUpdate,
  type PostKind,
  type Sort,
  type Status,
} from "@/lib/community";
import { diagnostics } from "@/lib/diag";
import { shrinkImage } from "@/lib/feedback";
import { date, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { liveRead } from "@/lib/liveRead";
import { useNet } from "@/lib/net";
import { SITE_URL } from "@/lib/site";
import { REASONS_FOR, REPORT_NOTE_MAX, type ReportReason } from "@/lib/socialTypes";
import { useApp } from "@/lib/store";
import { isTeen } from "@/lib/teen";

import { Icon } from "./icons";
import { go } from "./router";
import { Button, Chip, EmptyState, InlineSwitch, ScreenHeader, Section, Sheet, Skeleton } from "./ui";

type Tab = "ideas" | "bugs" | "roadmap";
const TABS: readonly Tab[] = ["ideas", "bugs", "roadmap"];

/** Each status's hue: a dot beside the words (the words stay in the ink colour). */
const STATUS_HUE: Record<Status, string> = {
  review: "var(--color-faint)",
  planned: "var(--color-violet)",
  progress: "var(--color-cyan)",
  shipped: "var(--color-mint)",
  wont: "var(--color-faint)",
  merged: "var(--color-faint)",
};

export const statusLabel = (status: Status, kind: PostKind) =>
  t(status === "shipped" && kind === "bug" ? "cmty.status.fixed" : `cmty.status.${status}`);
const day = (ms: number) => date(ms, { month: "short", day: "numeric", year: "numeric" });

export function Community({ arg }: { arg?: string }) {
  if (arg === "new" || arg === "new-bug") return <PostForm key={arg} kind={arg === "new-bug" ? "bug" : "idea"} />;
  if (arg && /^[0-9A-Za-z]{12}$/.test(arg)) return <PostView key={arg} id={arg} />;
  return <Board tab={(TABS as readonly string[]).includes(arg ?? "") ? (arg as Tab) : "ideas"} />;
}

/** The board, kept on the device so it opens at once (liveRead) and shared by the form's duplicate check. */
let lastBoard: CommunityBoard | null = null;
function useBoard() {
  const [board, setBoard] = useState<CommunityBoard | null>(lastBoard);
  const [failed, setFailed] = useState(false);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    let live = true;
    liveRead("community:board", loadBoard, (b) => {
      lastBoard = b;
      if (live) setBoard(b);
    }).catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [tries]);
  return {
    board,
    failed: failed && !board,
    retry: () => {
      setFailed(false);
      setTries((n) => n + 1);
    },
    setBoard: (b: CommunityBoard) => {
      lastBoard = b;
      setBoard(b);
    },
  };
}

function Board({ tab: start }: { tab: Tab }) {
  const signedIn = !!useAccount((s) => s.account);
  const offline = useNet((s) => s.offline);
  const { board, failed, retry, setBoard } = useBoard();
  const [tab, setTab] = useState<Tab>(start);
  const [sort, setSort] = useState<Sort>("top");
  const [done, setDone] = useState(false);
  const [q, setQ] = useState("");
  const [seen] = useState(seenAt);
  const [newsHidden, setNewsHidden] = useState(false);
  const news = board && !newsHidden ? newsFor(board, seen) : [];
  const voted = useMemo(() => new Set(board?.voted ?? []), [board]);

  const onVote = async (p: CommunityPost) => {
    if (!board) return;
    if (!signedIn) return go("account");
    const on = !voted.has(p.id);
    haptic(on ? "tap" : "select");
    const apply = (votes: number, isOn: boolean) =>
      setBoard({
        ...board,
        posts: board.posts.map((x) => (x.id === p.id ? { ...x, votes } : x)),
        voted: isOn ? [...voted, p.id] : [...voted].filter((v) => v !== p.id),
        following: isOn ? [...new Set([...(board.following ?? []), p.id])] : board.following,
      });
    apply(p.votes + (on ? 1 : -1), on);
    try {
      apply((await vote(p.id, on)).votes, on);
    } catch {
      oops();
      apply(p.votes, !on);
    }
  };

  const kind: PostKind = tab === "bugs" ? "bug" : "idea";
  const list = board
    ? sortPosts(
        searchPosts(
          q,
          board.posts.filter((p) => p.kind === kind && (done ? !OPEN_STATUSES.includes(p.status) : OPEN_STATUSES.includes(p.status))),
        ),
        sort,
      )
    : [];

  return (
    <div className="pb-8">
      <ScreenHeader back={{ label: t("train.back"), onClick: () => go("settings") }} title={t("cmty.title")} />
      <p className="mt-2 text-muted">{t("cmty.lead")}</p>
      {offline && board && (
        <p role="status" className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Icon name="offline" size={16} aria-hidden /> {t("cmty.offline")}
        </p>
      )}
      {!signedIn && (
        <div className="card mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm">{t("cmty.signIn")}</p>
          <Button kind="ghost" onClick={() => go("account")}>
            {t("cmty.signInBtn")}
          </Button>
        </div>
      )}
      {news.length > 0 && (
        <section
          className="card card-tint mt-4 px-4 py-3"
          style={{ ["--tint" as string]: "var(--color-mint)" }}
          aria-labelledby="cmty-news"
        >
          <h2 id="cmty-news" className="font-semibold">
            {t("cmty.news")}
          </h2>
          <ul className="mt-2 space-y-1">
            {news.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="press flex min-h-11 w-full items-center gap-2 text-left"
                  onClick={() => go("community", p.id)}
                >
                  <StatusPill status={p.status} kind={p.kind} />
                  <span className="min-w-0 flex-1 truncate">{p.title}</span>
                </button>
              </li>
            ))}
          </ul>
          <Button
            kind="quiet"
            className="mt-1 -ml-3"
            onClick={() => {
              markSeen();
              setNewsHidden(true);
            }}
          >
            {t("cmty.newsGot")}
          </Button>
        </section>
      )}
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={t("cmty.tabs")}>
        {TABS.map((x) => (
          <Chip key={x} active={tab === x} onClick={() => setTab(x)}>
            {t(`cmty.tab.${x}`)}
          </Chip>
        ))}
      </div>
      {failed ? (
        <EmptyState
          icon="offline"
          title={t("cmty.loadFail")}
          action={
            <Button kind="ghost" onClick={retry}>
              {t("cmty.retry")}
            </Button>
          }
        />
      ) : !board ? (
        <div className="mt-4 space-y-3" aria-hidden>
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : tab === "roadmap" ? (
        <Roadmap board={board} />
      ) : (
        <>
          <Button
            className="mt-4 w-full"
            icon={tab === "bugs" ? "flag" : "lightbulb"}
            onClick={() => go("community", tab === "bugs" ? "new-bug" : "new")}
          >
            {t(tab === "bugs" ? "cmty.new.bug" : "cmty.new.idea")}
          </Button>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("cmty.search")}
            aria-label={t("cmty.search")}
            className="card mt-4 w-full px-4 py-3"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex gap-2" role="group" aria-label={t("cmty.sort")}>
              {(["top", "new"] as const).map((x) => (
                <Chip key={x} active={sort === x} onClick={() => setSort(x)}>
                  {t(`cmty.sort.${x}`)}
                </Chip>
              ))}
            </div>
            <div className="flex gap-2" role="group" aria-label={t("cmty.tabs")}>
              <Chip active={!done} onClick={() => setDone(false)}>
                {t("cmty.show.open")}
              </Chip>
              <Chip active={done} onClick={() => setDone(true)}>
                {t("cmty.show.done")}
              </Chip>
            </div>
          </div>
          {list.length ? (
            <ul className="mt-4 space-y-3">
              {list.map((p) => (
                <li key={p.id}>
                  <PostRow post={p} voted={voted.has(p.id)} onVote={() => void onVote(p)} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={tab === "bugs" ? "flag" : "lightbulb"}
              title={q ? t("cmty.noMatch") : t("cmty.empty")}
              body={q ? undefined : t("cmty.emptyBody")}
            />
          )}
        </>
      )}
    </div>
  );
}

export function StatusPill({ status, kind }: { status: Status; kind: PostKind }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs font-semibold text-muted">
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: STATUS_HUE[status] }} />
      {statusLabel(status, kind)}
    </span>
  );
}

function VoteButton({ post, voted, onVote }: { post: CommunityPost; voted: boolean; onVote: () => void }) {
  const closed = post.status === "merged";
  return (
    <button
      type="button"
      aria-pressed={voted}
      disabled={closed}
      aria-label={`${t("cmty.votes", { count: post.votes })}. ${t(voted ? "cmty.unvote" : "cmty.vote", { title: post.title })}`}
      onClick={onVote}
      className={`press flex min-h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border disabled:opacity-40 ${
        voted ? "border-accent bg-accent/15 text-accent" : "border-line bg-raised text-ink"
      }`}
    >
      <Icon name="chevronUp" size={20} strokeWidth={2.6} aria-hidden />
      <span className="display text-sm tabular-nums">{post.votes}</span>
    </button>
  );
}

function PostRow({ post, voted, onVote }: { post: CommunityPost; voted: boolean; onVote: () => void }) {
  return (
    <div className="card flex items-start gap-3 p-3">
      <VoteButton post={post} voted={voted} onVote={onVote} />
      <button type="button" className="press min-h-14 min-w-0 flex-1 text-left" onClick={() => go("community", post.id)}>
        <span className="block font-semibold [overflow-wrap:anywhere]">{post.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
          <StatusPill status={post.status} kind={post.kind} />
          <span>{t("cmty.comments", { count: post.comments })}</span>
          {post.hidden && <span>{t("cmty.hiddenMine")}</span>}
        </span>
      </button>
    </div>
  );
}

function Roadmap({ board }: { board: CommunityBoard }) {
  const [log, setLog] = useState<CommunityUpdate[] | null>(null);
  useEffect(() => {
    let live = true;
    liveRead("community:changelog", loadChangelog, (r) => live && setLog(r.updates)).catch(() => live && setLog([]));
    return () => {
      live = false;
    };
  }, []);
  const column = (status: Status) =>
    sortPosts(
      board.posts.filter((p) => p.status === status),
      "top",
    );
  return (
    <>
      {(["progress", "planned"] as const).map((status) => {
        const posts = column(status);
        return (
          <Section key={status} title={t(`cmty.road.${status}`)}>
            {posts.length ? (
              <ul className="space-y-2">
                {posts.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="press card flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left"
                      onClick={() => go("community", p.id)}
                    >
                      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{p.title}</span>
                      <span className="shrink-0 text-xs text-muted">{t("cmty.votes", { count: p.votes })}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-1 text-sm text-muted">{t("cmty.road.none")}</p>
            )}
          </Section>
        );
      })}
      <Section title={t("cmty.changelog")}>
        {!log ? (
          <Skeleton className="h-16" />
        ) : log.length ? (
          <ul className="space-y-2">
            {log.map((u) => (
              <li key={`${u.postId}-${u.at}`}>
                <button type="button" className="press card w-full px-4 py-3 text-left" onClick={() => go("community", u.postId)}>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <StatusPill status="shipped" kind={u.kind ?? "idea"} />
                    {day(u.at)}
                  </span>
                  <span className="mt-1 block font-semibold [overflow-wrap:anywhere]">{u.title}</span>
                  {u.note && <span className="mt-1 block text-sm text-muted [overflow-wrap:anywhere]">{u.note}</span>}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-1 text-sm text-muted">{t("cmty.road.none")}</p>
        )}
      </Section>
      <a
        href={`${SITE_URL}/community/roadmap/`}
        target="_blank"
        rel="noreferrer"
        className="press mt-6 inline-flex min-h-11 items-center text-sm text-muted underline"
      >
        {t("cmty.web")}
      </a>
    </>
  );
}

function errText(e: unknown) {
  const code = communityError(e);
  return code === "signedOut" ? t("cmty.signIn") : code === "offline" ? t("cmty.offline") : t(`cmty.err.${code}`);
}

function PostForm({ kind: start }: { kind: PostKind }) {
  const signedIn = !!useAccount((s) => s.account);
  const teen = useApp((s) => isTeen(s.profile));
  const { board } = useBoard();
  const [kind, setKind] = useState<PostKind>(start);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [shot, setShot] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const similar = title.trim().length >= 4 && board ? similarPosts(title, board.posts) : [];
  const back = { label: t("cmty.back"), onClick: () => go("community") };

  if (!signedIn)
    return (
      <div className="pb-8">
        <ScreenHeader back={back} title={t(kind === "bug" ? "cmty.new.bug" : "cmty.new.idea")} />
        <EmptyState icon="lock" title={t("cmty.signIn")} action={<Button onClick={() => go("account")}>{t("cmty.signInBtn")}</Button>} />
      </div>
    );

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const d = diagnostics();
      const p = await createPost({ kind, title, body, shot: kind === "bug" ? shot : undefined, platform: d.platform, version: d.version });
      haptic("success");
      go("community", p.id);
    } catch (e) {
      oops();
      setError(errText(e));
      setBusy(false);
    }
  };

  return (
    <div className="pb-8">
      <ScreenHeader back={back} title={t(kind === "bug" ? "cmty.new.bug" : "cmty.new.idea")} />
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("cmty.form.what")}>
        {(["idea", "bug"] as const).map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
            {t(`cmty.kind.${k}`)}
          </Chip>
        ))}
      </div>
      <Section title={t("cmty.form.titleLabel")}>
        <input
          value={title}
          maxLength={COMMUNITY_LIMITS.title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t(kind === "bug" ? "cmty.form.titleBug" : "cmty.form.titleIdea")}
          aria-label={t("cmty.form.titleLabel")}
          className="card w-full px-4 py-3"
        />
        {similar.length > 0 && (
          <div className="mt-3" role="status">
            <p className="px-1 text-sm text-muted">{t("cmty.form.similar")}</p>
            <ul className="mt-2 space-y-2">
              {similar.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="press card flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left"
                    onClick={() => go("community", p.id)}
                  >
                    <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{p.title}</span>
                    <span className="shrink-0 text-xs text-muted">{t("cmty.votes", { count: p.votes })}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>
      <Section title={t("cmty.form.bodyLabel")}>
        <textarea
          value={body}
          maxLength={COMMUNITY_LIMITS.body}
          rows={5}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t(kind === "bug" ? "cmty.form.bodyBug" : "cmty.form.bodyIdea")}
          aria-label={t("cmty.form.bodyLabel")}
          className="card w-full resize-y px-4 py-3"
        />
      </Section>
      {kind === "bug" && (
        <Section title={t("cmty.form.shot")}>
          {shot ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shot} alt={t("cmty.form.shotAlt")} className="h-24 rounded-xl border border-line" />
              <Button kind="quiet" onClick={() => setShot(undefined)}>
                {t("cmty.form.shotRemove")}
              </Button>
            </div>
          ) : (
            <label className="press card flex min-h-11 cursor-pointer items-center justify-center px-4 py-3 text-sm font-semibold">
              {t("cmty.form.shotAttach")}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setShot(await shrinkImage(f));
                }}
              />
            </label>
          )}
          <p className="mt-2 px-1 text-xs text-muted">{t("cmty.form.shotPrivate")}</p>
        </Section>
      )}
      <p className="mt-6 px-1 text-xs text-muted">{t(teen ? "cmty.form.publicTeen" : "cmty.form.public")}</p>
      {kind === "bug" && <p className="mt-1 px-1 text-xs text-muted">{t("cmty.form.device")}</p>}
      {error && (
        <p role="alert" className="mt-3 text-sm text-bad">
          {error}
        </p>
      )}
      <Button
        className="mt-4 w-full py-4 text-lg"
        disabled={busy || title.trim().length < COMMUNITY_LIMITS.titleMin}
        onClick={() => void submit()}
      >
        {busy ? t("cmty.form.posting") : t("cmty.form.post")}
      </Button>
    </div>
  );
}

/** A comment's words, with @mentions in the accent colour. */
function Mentions({ text }: { text: string }) {
  return (
    <>
      {mentionParts(text).map((part, i) =>
        part.mention ? (
          <span key={i} className="font-semibold text-accent">
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

const byName = (x: { name: string }) => x.name || t("cmty.anon");

function PostView({ id }: { id: string }) {
  const signedIn = !!useAccount((s) => s.account);
  const [data, setData] = useState<CommunityThread | null>(null);
  const [gone, setGone] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const [reporting, setReporting] = useState<{ post?: string; comment?: string } | null>(null);
  useEffect(() => {
    let live = true;
    liveRead(
      `community:${id}`,
      () => loadThread(id),
      (d) => live && setData(d),
    ).catch(() => live && setGone(true));
    return () => {
      live = false;
    };
  }, [id]);
  useEffect(() => {
    if (!data?.post.mine || !data.post.shot) return;
    let url: string | null = null;
    void loadShot(id).then((u) => {
      url = u;
      setShotUrl(u);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, data?.post.mine, data?.post.shot]);

  const back = { label: t("cmty.back"), onClick: () => go("community") };
  if (gone && !data)
    return (
      <div className="pb-8">
        <ScreenHeader back={back} title={t("cmty.title")} />
        <EmptyState icon="flag" title={t("cmty.err.gone")} />
      </div>
    );
  if (!data)
    return (
      <div className="pb-8">
        <ScreenHeader back={back} title={t("cmty.title")} />
        <div className="mt-4 space-y-3" aria-hidden>
          <Skeleton className="h-24" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );

  const { post } = data;
  const needSignIn = () => {
    go("account");
  };
  const onVote = async () => {
    if (!signedIn) return needSignIn();
    const on = !data.voted;
    haptic(on ? "tap" : "select");
    setData({ ...data, voted: on, following: on || data.following, post: { ...post, votes: post.votes + (on ? 1 : -1) } });
    try {
      const r = await vote(post.id, on);
      setData((d) => d && { ...d, post: { ...d.post, votes: r.votes } });
    } catch {
      oops();
      setData(data);
    }
  };
  const onFollow = async (on: boolean) => {
    if (!signedIn) return needSignIn();
    setData({ ...data, following: on });
    try {
      await follow(post.id, on);
    } catch {
      oops();
      setData(data);
    }
  };
  const send = async () => {
    setBusy(true);
    setError("");
    try {
      const c = await addComment(post.id, text);
      haptic("success");
      setText("");
      setData((d) => d && { ...d, following: true, comments: [...d.comments, c], post: { ...d.post, comments: d.post.comments + 1 } });
    } catch (e) {
      oops();
      setError(errText(e));
    }
    setBusy(false);
  };
  const removeComment = async (c: CommunityComment) => {
    try {
      await deleteComment(c.id);
      setData(
        (d) =>
          d && { ...d, comments: d.comments.filter((x) => x.id !== c.id), post: { ...d.post, comments: Math.max(0, d.post.comments - 1) } },
      );
    } catch {
      oops();
    }
  };
  const removePost = async () => {
    try {
      await deletePost(post.id);
      go("community");
    } catch (e) {
      oops();
      setError(errText(e));
    }
  };
  const reply = (c: CommunityComment) => {
    if (c.handle) setText((x) => `${x ? `${x.trimEnd()} ` : ""}@${c.handle} `);
    document.getElementById("cmty-comment")?.focus();
  };

  return (
    <div className="pb-8">
      <ScreenHeader
        back={back}
        kicker={t(`cmty.kind.${post.kind}`)}
        title={<span className="[overflow-wrap:anywhere]">{post.title}</span>}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
        <StatusPill status={post.status} kind={post.kind} />
        <span>
          {byName(post)} · {day(post.createdAt)}
        </span>
      </div>
      {post.hidden && <p className="mt-3 text-sm text-warn">{t("cmty.hiddenMine")}</p>}
      {data.merged && (
        <div className="card mt-4 px-4 py-3">
          <p className="text-sm">{t("cmty.merged", { title: data.merged.title })}</p>
          <Button kind="ghost" className="mt-2" onClick={() => go("community", data.merged!.id)}>
            {t("cmty.mergedOpen")}
          </Button>
        </div>
      )}
      <div className="mt-4 flex items-start gap-3">
        <VoteButton post={post} voted={!!data.voted} onVote={() => void onVote()} />
        {post.body ? (
          <p className="min-w-0 flex-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{post.body}</p>
        ) : (
          <span className="flex-1" />
        )}
      </div>
      {shotUrl && (
        <figure className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shotUrl} alt={t("cmty.form.shotAlt")} className="max-h-80 rounded-xl border border-line" />
          <figcaption className="mt-1 text-xs text-muted">{t("cmty.yourShot")}</figcaption>
        </figure>
      )}
      {signedIn && post.status !== "merged" && (
        <div className="card mt-4 px-4 py-2">
          <InlineSwitch label={t("cmty.follow")} hint={t("cmty.followHint")} on={!!data.following} onChange={(on) => void onFollow(on)} />
        </div>
      )}
      {data.updates.length > 0 && (
        <Section title={t("cmty.timeline")}>
          <ol className="space-y-2">
            {data.updates.map((u) => (
              <li key={`${u.status}-${u.at}`} className="card px-4 py-3">
                <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <StatusPill status={u.status} kind={post.kind} />
                  {day(u.at)}
                </span>
                {u.note && u.status !== "merged" && <p className="mt-1 text-sm [overflow-wrap:anywhere]">{u.note}</p>}
              </li>
            ))}
          </ol>
        </Section>
      )}
      <Section title={t("cmty.commentsTitle")}>
        {data.comments.length ? (
          <ul className="space-y-2">
            {data.comments.map((c) => (
              <li key={c.id} className="card px-4 py-3">
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <span className={c.staff ? "font-semibold text-accent" : "font-semibold text-ink"}>
                    {c.staff ? t("cmty.team") : byName(c)}
                  </span>
                  {c.handle && !c.staff && <span>@{c.handle}</span>}
                  <span>{day(c.at)}</span>
                </p>
                <p className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">
                  <Mentions text={c.body} />
                </p>
                {signedIn && (
                  <div className="-ml-3 mt-1 flex flex-wrap">
                    {c.handle && !c.mine && (
                      <Button
                        kind="quiet"
                        className="min-h-11 px-3 py-1 text-sm"
                        label={t("cmty.reply", { name: byName(c) })}
                        onClick={() => reply(c)}
                      >
                        {t("cmty.replyShort")}
                      </Button>
                    )}
                    {c.mine ? (
                      <Button kind="quiet" className="min-h-11 px-3 py-1 text-sm" onClick={() => void removeComment(c)}>
                        {t("cmty.delete")}
                      </Button>
                    ) : (
                      !c.staff && (
                        <Button
                          kind="quiet"
                          className="min-h-11 px-3 py-1 text-sm"
                          label={t("cmty.reportComment")}
                          onClick={() => setReporting({ comment: c.id })}
                        >
                          {t("cmty.report")}
                        </Button>
                      )
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-1 text-sm text-muted">{t("cmty.noComments")}</p>
        )}
        {signedIn && post.status !== "merged" ? (
          <div className="mt-3">
            <label htmlFor="cmty-comment" className="sr-only">
              {t("cmty.commentLabel")}
            </label>
            <textarea
              id="cmty-comment"
              value={text}
              maxLength={COMMUNITY_LIMITS.comment}
              rows={3}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("cmty.commentHint")}
              className="card w-full resize-y px-4 py-3"
            />
            {error && (
              <p role="alert" className="mt-2 text-sm text-bad">
                {error}
              </p>
            )}
            <Button kind="ghost" className="mt-2 w-full" icon="send" disabled={busy || !text.trim()} onClick={() => void send()}>
              {t("cmty.commentSend")}
            </Button>
          </div>
        ) : (
          !signedIn && (
            <div className="card mt-3 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <p className="text-sm">{t("cmty.signIn")}</p>
              <Button kind="ghost" onClick={() => go("account")}>
                {t("cmty.signInBtn")}
              </Button>
            </div>
          )
        )}
      </Section>
      <div className="mt-6 flex flex-wrap gap-2">
        {post.mine && post.status === "review" && (
          <Button kind="danger" onClick={() => void removePost()}>
            {t("cmty.deletePost")}
          </Button>
        )}
        {signedIn && !post.mine && (
          <Button kind="quiet" icon="flag" onClick={() => setReporting({ post: post.id })}>
            {t("cmty.reportPost")}
          </Button>
        )}
        <a
          href={`${SITE_URL}${postPath(post)}`}
          target="_blank"
          rel="noreferrer"
          className="press inline-flex min-h-11 items-center px-2 text-sm text-muted underline"
        >
          {t("cmty.web")}
        </a>
      </div>
      {reporting && <ReportSheet target={reporting} onClose={() => setReporting(null)} />}
    </div>
  );
}

/** Report a post or comment: one tap on a reason, then Send (the same reasons and words as Friends). */
function ReportSheet({ target, onClose }: { target: { post?: string; comment?: string }; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const send = async () => {
    if (!reason) return;
    try {
      await reportCommunity(target, reason, reason === "other" ? note : "");
      haptic("success");
      setDone(t("cmty.reported"));
    } catch (e) {
      oops();
      setDone(errText(e));
    }
  };
  return (
    <Sheet open onClose={onClose} title={t(target.post ? "cmty.reportPost" : "cmty.reportComment")}>
      {done ? (
        <>
          <p role="status">{done}</p>
          <Button kind="ghost" className="mt-4 w-full" onClick={onClose}>
            {t("friends.done")}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">{t("friends.report.why")}</p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t("friends.report.why")}>
            {REASONS_FOR.feedback.map((r) => (
              <Chip key={r} active={reason === r} onClick={() => setReason(r)}>
                {t(`friends.reason.${r}`)}
              </Chip>
            ))}
          </div>
          {reason === "other" && (
            <>
              <label htmlFor="cmty-report-note" className="mt-3 block text-sm text-muted">
                {t("friends.report.note")}
              </label>
              <textarea
                id="cmty-report-note"
                value={note}
                maxLength={REPORT_NOTE_MAX}
                rows={2}
                onChange={(e) => setNote(e.target.value)}
                className="card mt-1 w-full resize-none px-4 py-3"
              />
            </>
          )}
          <p className="mt-3 text-xs text-muted">{t("friends.report.hint")}</p>
          <Button className="mt-4 w-full" disabled={!reason} onClick={() => void send()}>
            {t("friends.report.send")}
          </Button>
        </>
      )}
    </Sheet>
  );
}
