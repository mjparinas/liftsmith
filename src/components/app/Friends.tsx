"use client";

// Friends and the workout feed (Melvin, 2026-11-11; docs/decisions/friends.md). One screen (#/friends) with the
// feed, activity and people, a person's page (#/person/<handle>), a post's comments in a sheet, and the post
// button on Done. Opened from the people button on Today's header (Melvin chose it over a sixth tab).
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";

import { SECTION_LABEL } from "@/components/titles";
import { track } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import type { SessionSummary } from "@/lib/derive";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { list as fmtList, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { copyText, shareUrl } from "@/lib/shareLinks";
import {
  postWorkout,
  profileUrl,
  publicPageUrl,
  refreshSocial,
  social,
  socialError,
  socialOn,
  useSocial,
  type SocialMe,
} from "@/lib/social";
import {
  cleanHandle,
  HANDLE_RE,
  REPORT_REASONS,
  SOCIAL_LIMITS,
  type ActivityItem,
  type FeedComment,
  type FeedPost,
  type PersonCard,
  type ReportKind,
  type ReportReason,
  type SocialProfile,
} from "@/lib/socialTypes";
import { useApp } from "@/lib/store";
import { MUSCLE_LABEL, MUSCLES, type Muscle, type Unit } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";

import { ago, clock, repsText, setText } from "./format";
import { Icon } from "./icons";
import { go, goBack } from "./router";
import { Button, Chip, EmptyState, ScreenHeader, Section, Sheet, Skeleton, SwitchRow } from "./ui";

// --- Small pieces ---

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const letter = [...(name.trim() || "?")][0]!.toLocaleUpperCase();
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--grad-a) 30%, transparent), color-mix(in srgb, var(--grad-c) 30%, transparent))",
        color: "var(--color-ink)",
      }}
    >
      {letter}
    </span>
  );
}

function Note({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="status" className="mt-2 text-sm text-muted">
      {text}
    </p>
  );
}

const MUSCLE_SET = new Set<string>(MUSCLES);

/** One exercise's best set, in the reader's own units and language. */
function bestSet(e: FeedPost["body"]["exercises"][number], unit: Unit): string {
  const ex = EXERCISE_BY_ID.get(e.id);
  if (!ex) return e.w ? `${fmtNum(fromKg(e.w, unit))} ${unit} × ${e.r}` : `× ${e.r}`;
  if (ex.cardio) return setText(ex, 0, e.r, unit, e.d);
  if (e.w === null) return `× ${repsText(ex, e.r)}`;
  return setText(ex, e.w, e.r, unit, e.d);
}

// --- A post ---

function PostCard({ post, onChange, onOpen }: { post: FeedPost; onChange: (p: FeedPost | null) => void; onOpen?: () => void }) {
  const { profile } = useApp();
  const unit = profile.unit;
  const b = post.body;
  const [more, setMore] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const like = async () => {
    const on = !post.liked;
    haptic(on ? "tap" : "select");
    if (on) sound.toggle(true);
    onChange({ ...post, liked: on, likes: post.likes + (on ? 1 : -1) });
    try {
      await social("like", { id: post.id, on });
    } catch (e) {
      oops();
      onChange(post);
      setNote(socialError(e));
    }
  };
  const remove = async () => {
    try {
      await social("unpost", { id: post.id });
      onChange(null);
    } catch (e) {
      oops();
      setNote(socialError(e));
    }
  };
  const muscles = b.muscles.filter((m): m is Muscle => MUSCLE_SET.has(m));
  return (
    <article className="card p-4" aria-label={t("friends.post.label", { name: post.name })}>
      <header className="flex items-center gap-3">
        <button type="button" onClick={() => go("person", post.handle)} className="press flex min-w-0 flex-1 items-center gap-3 text-left">
          <Avatar name={post.name} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{post.name}</span>
            <span className="block truncate text-xs text-muted">
              @{post.handle} · {ago(post.at)}
            </span>
          </span>
        </button>
        <button
          type="button"
          aria-label={t("friends.post.more")}
          onClick={() => setMore(true)}
          className="press grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:text-ink"
        >
          <Icon name="more" size={22} strokeWidth={3} />
        </button>
      </header>
      <p className="mt-3 text-lg font-bold">{b.prs ? t("friends.post.prs", { count: b.prs }) : t("friends.post.workout")}</p>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
        {[
          [t("done.time"), clock(b.seconds)],
          [t("done.sets"), fmtNum(b.sets)],
          ...(b.volume !== null ? [[t("done.volume"), `${fmtNum(Math.round(fromKg(b.volume, unit)))} ${unit}`]] : []),
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-raised px-2 py-2">
            <dt className="text-xs uppercase tracking-wider text-faint">{k}</dt>
            <dd className="num font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-3 space-y-1 text-sm">
        {b.exercises.slice(0, 5).map((e) => (
          <li key={e.id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              {e.sets} × {EXERCISE_BY_ID.get(e.id)?.name ?? (e.name || e.id)}
            </span>
            <span className="num shrink-0 text-muted">{bestSet(e, unit)}</span>
          </li>
        ))}
        {b.exercises.length > 5 && <li className="text-muted">{t("friends.post.moreExercises", { count: b.exercises.length - 5 })}</li>}
      </ul>
      {muscles.length > 0 && <p className="mt-2 text-xs text-muted">{fmtList(muscles.map((m) => MUSCLE_LABEL[m]))}</p>}
      <div className="mt-3 flex items-center gap-2 border-t border-line pt-2">
        <button
          type="button"
          aria-pressed={post.liked}
          aria-label={t("friends.post.like", { count: post.likes })}
          onClick={() => void like()}
          className={`press inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 ${post.liked ? "text-bad" : "text-muted hover:text-ink"}`}
        >
          <Icon name="heart" size={20} filled={post.liked} />
          <span className="num text-sm">{fmtNum(post.likes)}</span>
        </button>
        {onOpen && (
          <button
            type="button"
            aria-label={t("friends.post.comments", { count: post.comments })}
            onClick={onOpen}
            className="press inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-muted hover:text-ink"
          >
            <Icon name="chat" size={20} />
            <span className="num text-sm">{fmtNum(post.comments)}</span>
          </button>
        )}
      </div>
      <Note text={note} />
      <Sheet open={more} onClose={() => setMore(false)} title={t("friends.post.more")}>
        <div className="space-y-2">
          {post.mine ? (
            <Button kind="danger" icon="trash" className="w-full" onClick={() => void remove()}>
              {t("friends.post.delete")}
            </Button>
          ) : (
            <Button
              kind="ghost"
              icon="flag"
              className="w-full"
              onClick={() => {
                setMore(false);
                setReporting(true);
              }}
            >
              {t("friends.report.post")}
            </Button>
          )}
        </div>
      </Sheet>
      <ReportSheet open={reporting} onClose={() => setReporting(false)} kind="post" id={post.id} />
    </article>
  );
}

/** A post's comments, and the box to add one. */
function CommentsSheet(props: { post: FeedPost | null; onClose: () => void; onCount: (n: number) => void }) {
  return props.post ? <CommentsBody key={props.post.id} {...props} post={props.post} /> : null;
}

function CommentsBody({ post, onClose, onCount }: { post: FeedPost; onClose: () => void; onCount: (n: number) => void }) {
  const [comments, setComments] = useState<FeedComment[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);
  const id = post.id;
  useEffect(() => {
    let live = true;
    social<{ comments: FeedComment[] }>("thread", { id })
      .then((r) => live && setComments(r.comments))
      .catch((e: unknown) => live && (setComments([]), setNote(socialError(e))));
    return () => {
      live = false;
    };
  }, [id]);
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const r = await social<{ comment: FeedComment }>("comment", { id, text });
      const next = [...(comments ?? []), r.comment];
      setComments(next);
      onCount(next.length);
      setText("");
      setNote(null);
      haptic("success");
    } catch (err) {
      oops();
      setNote(socialError(err));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (c: FeedComment) => {
    try {
      await social("uncomment", { id: c.id });
      const next = (comments ?? []).filter((x) => x.id !== c.id);
      setComments(next);
      onCount(next.length);
    } catch (err) {
      oops();
      setNote(socialError(err));
    }
  };
  return (
    <Sheet open onClose={onClose} title={t("friends.comments.title")}>
      {comments === null ? (
        <Skeleton className="h-16" />
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-3">
              <Avatar name={c.name} size={32} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <button type="button" className="press font-semibold" onClick={() => go("person", c.handle)}>
                    {c.name}
                  </button>{" "}
                  <span className="text-xs text-muted">{ago(c.at)}</span>
                </p>
                <p className="break-words text-sm">{c.body}</p>
              </div>
              {c.canDelete ? (
                <button
                  type="button"
                  aria-label={t("friends.comments.delete")}
                  onClick={() => void remove(c)}
                  className="press grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:text-ink"
                >
                  <Icon name="trash" size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label={t("friends.report.comment")}
                  onClick={() => setReporting(c.id)}
                  className="press grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:text-ink"
                >
                  <Icon name="flag" size={18} />
                </button>
              )}
            </li>
          ))}
          {!comments.length && <li className="text-sm text-muted">{t("friends.comments.none")}</li>}
        </ul>
      )}
      <form className="mt-4 flex gap-2" onSubmit={(e) => void send(e)}>
        <label htmlFor="fr-comment" className="sr-only">
          {t("friends.comments.add")}
        </label>
        <input
          id="fr-comment"
          value={text}
          maxLength={SOCIAL_LIMITS.comment}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("friends.comments.add")}
          className="card min-w-0 flex-1 px-4 py-3"
          enterKeyHint="send"
        />
        <Button submit disabled={busy || !text.trim()}>
          {t("friends.comments.send")}
        </Button>
      </form>
      <Note text={note} />
      <ReportSheet open={!!reporting} onClose={() => setReporting(null)} kind="comment" id={reporting ?? ""} />
    </Sheet>
  );
}

/** Report a post, comment or profile: one tap on a reason, then Send. */
export function ReportSheet(props: { open: boolean; onClose: () => void; kind: ReportKind; id: string }) {
  // Mounted only while open, so every report starts fresh.
  return props.open ? <ReportBody {...props} /> : null;
}

function ReportBody({ open, onClose, kind, id }: { open: boolean; onClose: () => void; kind: ReportKind; id: string }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const send = async () => {
    if (!reason) return;
    try {
      await social("report", { kind, id, reason });
      haptic("success");
      setDone(t("friends.report.thanks"));
      track("feature", { name: "social_report", detail: `${kind}:${reason}` });
    } catch (e) {
      oops();
      setDone(socialError(e));
    }
  };
  return (
    <Sheet open={open} onClose={onClose} title={t(`friends.report.${kind}`)}>
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
          <div className="mt-3 flex flex-wrap gap-2">
            {REPORT_REASONS.map((r) => (
              <Chip key={r} active={reason === r} onClick={() => setReason(r)}>
                {t(`friends.reason.${r}`)}
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">{t("friends.report.hint")}</p>
          <Button className="mt-4 w-full" disabled={!reason} onClick={() => void send()}>
            {t("friends.report.send")}
          </Button>
        </>
      )}
    </Sheet>
  );
}

/** A list of posts with comments and "Load more". `op` is feed or person. */
function Posts({ op, handle, empty }: { op: "feed" | "person"; handle?: string; empty: ReactNode }) {
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [more, setMore] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState<FeedPost | null>(null);
  const load = useCallback(
    async (before: number) => {
      try {
        const r = await social<{ posts: FeedPost[]; more: boolean }>(op, { handle, before });
        setPosts((p) => [...(p ?? []), ...r.posts]);
        setMore(r.more);
        setNote(null);
      } catch (e) {
        setPosts((p) => p ?? []);
        setNote(socialError(e));
      }
    },
    [op, handle],
  );
  useEffect(() => {
    let live = true;
    social<{ posts: FeedPost[]; more: boolean }>(op, { handle })
      .then((r) => {
        if (!live) return;
        setPosts(r.posts);
        setMore(r.more);
      })
      .catch((e: unknown) => {
        if (!live) return;
        setPosts([]);
        setNote(socialError(e));
      });
    return () => {
      live = false;
    };
  }, [op, handle]);
  const change = (id: string) => (p: FeedPost | null) => setPosts((ps) => (ps ?? []).flatMap((x) => (x.id !== id ? [x] : p ? [p] : [])));
  if (posts === null)
    return (
      <div className="space-y-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} onChange={change(p.id)} onOpen={() => setOpen(p)} />
      ))}
      {!posts.length && !note && empty}
      {more && (
        <Button kind="ghost" className="w-full" onClick={() => void load(posts.at(-1)?.at ?? Date.now())}>
          {t("friends.loadMore")}
        </Button>
      )}
      <Note text={note} />
      <CommentsSheet
        post={open}
        onClose={() => setOpen(null)}
        onCount={(n) => open && setPosts((ps) => (ps ?? []).map((x) => (x.id === open.id ? { ...x, comments: n } : x)))}
      />
    </div>
  );
}

// --- Joining and settings ---

const RULES = ["friends.rules.1", "friends.rules.2", "friends.rules.3", "friends.rules.4"] as const;

function Rules() {
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
      {RULES.map((k) => (
        <li key={k}>{t(k)}</li>
      ))}
    </ul>
  );
}

function suggestHandle(name: string) {
  const h = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  return h.length >= 3 ? h : "";
}

function Join() {
  const { profile } = useApp();
  const [handle, setHandle] = useState(() => suggestHandle(profile.name ?? ""));
  const [name, setName] = useState(profile.name ?? "");
  const [open, setOpen] = useState(false);
  const [autoPost, setAutoPost] = useState(false);
  const [weights, setWeights] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const h = cleanHandle(handle);
  const valid = HANDLE_RE.test(h);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      const me = await social<SocialMe>("join", { handle: h, name, open, autoPost, weights, agree: true });
      useSocial.setState({ me, error: null });
      haptic("celebrate");
      sound.done();
      track("feature", { name: "social_join", detail: open ? "open" : "approve" });
    } catch (err) {
      oops();
      setError(socialError(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={(e) => void submit(e)}>
      <EmptyState icon="people" title={t("friends.join.title")} body={t("friends.join.body")} />
      <label htmlFor="fr-handle" className="block text-sm text-muted">
        {t("friends.handle")}
      </label>
      <div className="card mt-1 flex items-center px-4">
        <span aria-hidden className="text-muted">
          @
        </span>
        <input
          id="fr-handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value.replace(/\s/g, "_").toLowerCase().slice(0, 20))}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent py-3 pl-1 outline-none"
          aria-describedby="fr-handle-hint"
        />
      </div>
      <p id="fr-handle-hint" className="mt-1 text-xs text-muted">
        {t("friends.handleHint")}
      </p>
      <label htmlFor="fr-name" className="mt-4 block text-sm text-muted">
        {t("friends.name")}
      </label>
      <input
        id="fr-name"
        value={name}
        maxLength={SOCIAL_LIMITS.name}
        onChange={(e) => setName(e.target.value)}
        className="card mt-1 w-full px-4 py-3"
        autoComplete="nickname"
      />
      <Privacy
        open={open}
        autoPost={autoPost}
        weights={weights}
        set={(p) => {
          if (p.open !== undefined) setOpen(p.open);
          if (p.autoPost !== undefined) setAutoPost(p.autoPost);
          if (p.weights !== undefined) setWeights(p.weights);
        }}
      />
      <Section title={t("friends.rules.title")}>
        <Rules />
      </Section>
      <Button submit className="mt-6 w-full" disabled={!valid || busy}>
        {t("friends.join.agree")}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-bad">
          {error}
        </p>
      )}
    </form>
  );
}

function Privacy({
  open,
  autoPost,
  weights,
  pub,
  set,
}: {
  open: boolean;
  autoPost: boolean;
  weights: boolean;
  /** Public profile, offered once joined (undefined while joining, which always starts private). */
  pub?: boolean;
  set: (p: Partial<SocialProfile>) => void;
}) {
  return (
    <Section title={t("friends.privacy")}>
      {pub !== undefined && (
        <SwitchRow
          label={t("friends.public")}
          hint={t(pub ? "friends.publicOn" : "friends.publicOff")}
          on={pub}
          onChange={(v) => set({ public: v })}
        />
      )}
      <SwitchRow
        label={t("friends.open")}
        hint={t(open ? "friends.openOn" : "friends.openOff")}
        on={open}
        onChange={(v) => set({ open: v })}
      />
      <SwitchRow label={t("friends.autoPost")} hint={t("friends.autoPostHint")} on={autoPost} onChange={(v) => set({ autoPost: v })} />
      <SwitchRow label={t("friends.weights")} hint={t("friends.weightsHint")} on={weights} onChange={(v) => set({ weights: v })} />
      <p className="mt-2 px-1 text-xs text-muted">{t("friends.never")}</p>
    </Section>
  );
}

function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <SettingsBody onClose={onClose} /> : null;
}

function SettingsBody({ onClose }: { onClose: () => void }) {
  const me = useSocial((s) => s.me);
  const p = me?.profile;
  const [name, setName] = useState(p?.name ?? "");
  const [handle, setHandle] = useState(p?.handle ?? "");
  const [note, setNote] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  if (!p) return null;
  const save = async (change: Record<string, unknown>) => {
    try {
      useSocial.setState({ me: await social<SocialMe>("update", change), error: null });
      setNote(t("friends.saved"));
    } catch (e) {
      oops();
      setNote(socialError(e));
    }
  };
  const leave = async () => {
    try {
      await social("leave");
      useSocial.setState({ me: { profile: null } });
      track("feature", { name: "social_leave" });
      onClose();
    } catch (e) {
      oops();
      setNote(socialError(e));
    }
  };
  return (
    <Sheet open onClose={onClose} title={t("friends.settings")}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save({ name, handle: cleanHandle(handle) });
        }}
      >
        <label htmlFor="fr-set-name" className="block text-sm text-muted">
          {t("friends.name")}
        </label>
        <input
          id="fr-set-name"
          value={name}
          maxLength={SOCIAL_LIMITS.name}
          onChange={(e) => setName(e.target.value)}
          className="card mt-1 w-full px-4 py-3"
        />
        <label htmlFor="fr-set-handle" className="mt-3 block text-sm text-muted">
          {t("friends.handle")}
        </label>
        <input
          id="fr-set-handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value.replace(/\s/g, "_").toLowerCase().slice(0, 20))}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="card mt-1 w-full px-4 py-3"
        />
        <Button submit kind="ghost" className="mt-3 w-full" disabled={!HANDLE_RE.test(cleanHandle(handle))}>
          {t("friends.save")}
        </Button>
      </form>
      <Note text={note} />
      <Privacy open={p.open} autoPost={p.autoPost} weights={p.weights} pub={p.public} set={(c) => void save(c)} />
      {p.public && (
        <a
          href={publicPageUrl(p.handle)}
          target="_blank"
          rel="noopener"
          className="press card mt-2 flex min-h-11 items-center justify-between px-4 py-3 text-sm"
        >
          <span>{t("friends.publicPage")}</span>
          <span aria-hidden className="text-muted">
            ›
          </span>
        </a>
      )}
      <Section title={t("friends.rules.title")}>
        <Rules />
      </Section>
      <Section title={t("friends.leave")}>
        {leaving ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">{t("friends.leaveWarn")}</p>
            <Button kind="danger" className="w-full" onClick={() => void leave()}>
              {t("friends.leaveConfirm")}
            </Button>
          </div>
        ) : (
          <Button kind="quiet" className="w-full" onClick={() => setLeaving(true)}>
            {t("friends.leave")}
          </Button>
        )}
      </Section>
    </Sheet>
  );
}

// --- Activity and people ---

function Activity({ onPeople }: { onPeople: () => void }) {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    social<{ items: ActivityItem[] }>("activity")
      .then((r) => {
        if (!live) return;
        setItems(r.items);
        useSocial.setState((s) => (s.me ? { me: { ...s.me, unread: 0 } } : s));
      })
      .catch((e: unknown) => live && (setItems([]), setNote(socialError(e))));
    return () => {
      live = false;
    };
  }, []);
  if (items === null) return <Skeleton className="h-40" />;
  const line = (i: ActivityItem) =>
    i.kind === "follow"
      ? t("friends.act.follow", { name: i.name })
      : i.kind === "request"
        ? t("friends.act.request", { name: i.name })
        : i.kind === "like"
          ? t("friends.act.like", { name: i.name })
          : t("friends.act.comment", { name: i.name, text: i.text ?? "" });
  return (
    <>
      {items.length ? (
        <ul className="card divide-y divide-line">
          {items.map((i, n) => (
            <li key={`${i.kind}-${i.handle}-${i.at}-${n}`}>
              <button
                type="button"
                onClick={() => (i.kind === "request" ? onPeople() : go("person", i.handle))}
                className="press flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <Avatar name={i.name} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm">{line(i)}</span>
                  <span className="block text-xs text-muted">{ago(i.at)}</span>
                </span>
                <Icon name="chevronRight" size={18} className="text-faint" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !note && <EmptyState icon="bolt" title={t("friends.act.none")} body={t("friends.act.noneBody")} />
      )}
      <Note text={note} />
    </>
  );
}

type Person = { handle: string; name: string; at: number };
type ListName = "requests" | "following" | "followers" | "blocked";

function PeopleList({ list, reload, onChanged }: { list: ListName; reload: number; onChanged: () => void }) {
  const [rows, setRows] = useState<Person[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    social<{ people: Person[] }>("people", { list })
      .then((r) => live && setRows(r.people))
      .catch((e: unknown) => live && (setRows([]), setNote(socialError(e))));
    return () => {
      live = false;
    };
  }, [list, reload]);
  const act = async (p: Person, op: string, extra: Record<string, unknown> = {}) => {
    haptic("tick");
    try {
      await social(op, { handle: p.handle, ...extra });
      setRows((r) => (r ?? []).filter((x) => x.handle !== p.handle));
      onChanged();
      void refreshSocial();
    } catch (e) {
      oops();
      setNote(socialError(e));
    }
  };
  if (rows === null || (!rows.length && list === "requests")) return null;
  return (
    <Section title={t(`friends.list.${list}`)}>
      <ul className="card divide-y divide-line">
        {rows.map((p) => (
          <li key={p.handle} className="flex items-center gap-2 py-1.5 pl-4 pr-1">
            <button
              type="button"
              onClick={() => go("person", p.handle)}
              className="press flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
            >
              <Avatar name={p.name} size={36} />
              <span className="min-w-0">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="block truncate text-xs text-muted">@{p.handle}</span>
              </span>
            </button>
            {list === "requests" && (
              <>
                <Button kind="primary" className="px-3 py-2 text-sm" onClick={() => void act(p, "answer", { accept: true })}>
                  {t("friends.accept")}
                </Button>
                <Button kind="quiet" className="px-3 py-2 text-sm" onClick={() => void act(p, "answer", { accept: false })}>
                  {t("friends.decline")}
                </Button>
              </>
            )}
            {list === "followers" && (
              <Button
                kind="quiet"
                className="px-3 py-2 text-sm"
                label={t("friends.removeNamed", { name: p.name })}
                onClick={() => void act(p, "answer", { accept: false })}
              >
                {t("friends.remove")}
              </Button>
            )}
            {list === "blocked" && (
              <Button kind="quiet" className="px-3 py-2 text-sm" onClick={() => void act(p, "unblock")}>
                {t("friends.unblock")}
              </Button>
            )}
          </li>
        ))}
        {!rows.length && <li className="px-4 py-3 text-sm text-muted">{t(`friends.list.${list}None`)}</li>}
      </ul>
      <Note text={note} />
    </Section>
  );
}

function People() {
  const me = useSocial((s) => s.me);
  const [q, setQ] = useState("");
  // Accepting a request adds a follower, so every list reloads after a change.
  const [version, setVersion] = useState(0);
  const changed = () => setVersion((v) => v + 1);
  const [note, setNote] = useState<string | null>(null);
  const handle = me?.profile?.handle ?? "";
  const find = (e: FormEvent) => {
    e.preventDefault();
    const h = cleanHandle(q);
    if (!HANDLE_RE.test(h)) return setNote(t("friends.err.handle"));
    go("person", h);
  };
  const share = async () => {
    const url = profileUrl(handle, !!me?.profile?.public);
    if (await shareUrl(url, t("friends.shareTitle"))) return;
    setNote((await copyText(url)) ? t("link.copied") : url);
  };
  return (
    <>
      <form onSubmit={find}>
        <label htmlFor="fr-find" className={`mb-2 block px-1 ${SECTION_LABEL}`}>
          {t("friends.find")}
        </label>
        <div className="flex gap-2">
          <div className="card flex min-w-0 flex-1 items-center px-4">
            <span aria-hidden className="text-muted">
              @
            </span>
            <input
              id="fr-find"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              placeholder={t("friends.findHint")}
              className="min-w-0 flex-1 bg-transparent py-3 pl-1 outline-none"
            />
          </div>
          <Button submit>{t("friends.findGo")}</Button>
        </div>
      </form>
      <Button kind="ghost" icon="share" className="mt-3 w-full" onClick={() => void share()}>
        {t("friends.shareMe", { handle })}
      </Button>
      <Note text={note} />
      <PeopleList list="requests" reload={version} onChanged={changed} />
      <PeopleList list="following" reload={version} onChanged={changed} />
      <PeopleList list="followers" reload={version} onChanged={changed} />
      <PeopleList list="blocked" reload={version} onChanged={changed} />
    </>
  );
}

// --- Screens ---

function useSocialLoaded() {
  const account = useAccount((s) => s.account);
  const { me, error } = useSocial();
  useEffect(() => {
    void refreshSocial();
  }, [account?.id]);
  return { account, me, error };
}

type Tab = "feed" | "activity" | "people";

export function Friends() {
  const { account, me, error } = useSocialLoaded();
  const [tab, setTab] = useState<Tab>("feed");
  const [settings, setSettings] = useState(false);
  const header = (
    <div className="flex items-end justify-between gap-2">
      <ScreenHeader title={t("friends.title")} back={{ label: t("friends.back"), onClick: goBack }} />
      {me?.profile && (
        <button
          type="button"
          aria-label={t("friends.settings")}
          onClick={() => setSettings(true)}
          className="press grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted hover:text-ink"
        >
          <Icon name="settings" size={18} />
        </button>
      )}
    </div>
  );
  if (!socialOn())
    return (
      <div className="pb-8">
        {header}
        <EmptyState icon="people" title={t("friends.err.off")} />
      </div>
    );
  if (!account)
    return (
      <div className="pb-8">
        {header}
        <EmptyState
          icon="people"
          title={t("friends.signIn.title")}
          body={t("friends.signIn.body")}
          action={<Button onClick={() => go("account")}>{t("friends.signIn.go")}</Button>}
        />
      </div>
    );
  if (!me)
    return (
      <div className="pb-8">
        {header}
        {error ? (
          <EmptyState icon="people" title={error} action={<Button onClick={() => void refreshSocial()}>{t("friends.retry")}</Button>} />
        ) : (
          <Skeleton className="mt-4 h-48" />
        )}
      </div>
    );
  if (!me.profile)
    return (
      <div className="pb-8">
        {header}
        <Join />
      </div>
    );
  const waiting = (me.unread ?? 0) + (me.requests ?? 0);
  return (
    <div className="pb-8">
      {header}
      {me.suspended && <p className="card mt-3 border-bad/40 p-3 text-sm text-bad">{t("friends.err.suspended")}</p>}
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("friends.title")}>
        <Chip active={tab === "feed"} onClick={() => setTab("feed")}>
          {t("friends.tab.feed")}
        </Chip>
        <Chip active={tab === "activity"} onClick={() => setTab("activity")}>
          {me.unread ? t("friends.tab.activityN", { n: fmtNum(me.unread) }) : t("friends.tab.activity")}
        </Chip>
        <Chip active={tab === "people"} onClick={() => setTab("people")}>
          {me.requests ? t("friends.tab.peopleN", { n: fmtNum(me.requests) }) : t("friends.tab.people")}
        </Chip>
      </div>
      <div className="mt-4">
        {tab === "feed" && (
          <Posts
            op="feed"
            empty={
              <EmptyState
                icon="people"
                mascot="curious"
                title={t("friends.feed.none")}
                body={t("friends.feed.noneBody")}
                action={<Button onClick={() => setTab("people")}>{t("friends.feed.find")}</Button>}
              />
            }
          />
        )}
        {tab === "activity" && <Activity onPeople={() => setTab("people")} />}
        {tab === "people" && <People />}
      </div>
      <span className="sr-only" aria-live="polite">
        {waiting ? t("friends.waiting", { count: waiting }) : ""}
      </span>
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
    </div>
  );
}

/** #/person/<handle>: someone's profile, follow, their posts, block and report. */
export function PersonScreen({ handle }: { handle: string }) {
  const { account, me } = useSocialLoaded();
  const [person, setPerson] = useState<PersonCard | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const joined = !!me?.profile;
  const h = cleanHandle(handle);
  useEffect(() => {
    if (!joined) return;
    let live = true;
    social<{ person: PersonCard }>("lookup", { handle: h })
      .then((r) => live && setPerson(r.person))
      .catch((e: unknown) => live && setMissing(socialError(e)));
    return () => {
      live = false;
    };
  }, [h, joined]);
  const act = async (op: string) => {
    haptic("tick");
    try {
      const r = await social<{ person?: PersonCard }>(op, { handle: h });
      if (r.person) setPerson(r.person);
      else {
        const again = await social<{ person: PersonCard }>("lookup", { handle: h }).catch(() => null);
        setPerson(again?.person ?? null);
      }
      if (op === "follow") track("feature", { name: "social_follow" });
      setMenu(false);
      void refreshSocial();
    } catch (e) {
      oops();
      setNote(socialError(e));
    }
  };
  const back = { label: t("friends.backPerson"), onClick: goBack };
  if (!account || !joined)
    return (
      <div className="pb-8">
        <ScreenHeader title={`@${h}`} back={back} />
        <EmptyState
          icon="people"
          title={t("friends.person.joinFirst")}
          body={t("friends.join.body")}
          action={<Button onClick={() => go("friends")}>{t("friends.person.openFriends")}</Button>}
        />
      </div>
    );
  if (missing)
    return (
      <div className="pb-8">
        <ScreenHeader title={`@${h}`} back={back} />
        <EmptyState icon="people" title={missing} />
      </div>
    );
  if (!person)
    return (
      <div className="pb-8">
        <ScreenHeader title={`@${h}`} back={back} />
        <Skeleton className="mt-4 h-40" />
      </div>
    );
  const self = person.relation === "self";
  return (
    <div className="pb-8">
      <div className="flex items-end justify-between gap-2">
        <ScreenHeader
          title={person.name}
          kicker={person.public ? `@${person.handle} · ${t("friends.person.public")}` : `@${person.handle}`}
          back={back}
        />
        {!self && (
          <button
            type="button"
            aria-label={t("friends.person.menu", { name: person.name })}
            onClick={() => setMenu(true)}
            className="press grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted hover:text-ink"
          >
            <Icon name="more" size={20} strokeWidth={3} />
          </button>
        )}
      </div>
      <div className="card mt-4 flex items-center gap-4 p-4">
        <Avatar name={person.name} size={56} />
        <dl className="grid flex-1 grid-cols-3 text-center">
          {[
            [t("friends.person.posts"), person.posts],
            [t("friends.person.followers"), person.followers],
            [t("friends.person.following"), person.following],
          ].map(([k, v]) => (
            <div key={String(k)}>
              <dd className="num text-lg font-bold">{fmtNum(Number(v))}</dd>
              <dt className="text-xs text-muted">{k}</dt>
            </div>
          ))}
        </dl>
      </div>
      {person.followsYou && !self && <p className="mt-2 px-1 text-sm text-muted">{t("friends.person.followsYou")}</p>}
      {!self && person.relation !== "blocked" && (
        <Button
          kind={person.relation === "none" ? "primary" : "ghost"}
          className="mt-3 w-full"
          onClick={() => void act(person.relation === "none" ? "follow" : "unfollow")}
        >
          {person.relation === "none"
            ? person.open
              ? t("friends.follow")
              : t("friends.requestFollow")
            : person.relation === "requested"
              ? t("friends.requested")
              : t("friends.unfollow")}
        </Button>
      )}
      {person.relation === "blocked" && (
        <Button kind="ghost" className="mt-3 w-full" onClick={() => void act("unblock")}>
          {t("friends.unblock")}
        </Button>
      )}
      <Note text={note} />
      <div className="mt-5">
        {person.canSee ? (
          <Posts op="person" handle={person.handle} empty={<EmptyState icon="dumbbell" title={t("friends.person.noPosts")} />} />
        ) : (
          person.relation !== "blocked" && (
            <EmptyState
              icon="lock"
              title={t("friends.person.private")}
              body={person.relation === "requested" ? t("friends.person.waiting") : t("friends.person.privateBody")}
            />
          )
        )}
      </div>
      <Sheet open={menu} onClose={() => setMenu(false)} title={person.name}>
        <div className="space-y-2">
          {person.relation !== "blocked" && (
            <Button kind="danger" icon="ban" className="w-full" onClick={() => void act("block")}>
              {t("friends.block")}
            </Button>
          )}
          <p className="text-xs text-muted">{t("friends.blockHint")}</p>
          <Button
            kind="ghost"
            icon="flag"
            className="w-full"
            onClick={() => {
              setMenu(false);
              setReporting(true);
            }}
          >
            {t("friends.report.profile")}
          </Button>
        </div>
      </Sheet>
      <ReportSheet open={reporting} onClose={() => setReporting(false)} kind="profile" id={person.handle} />
    </div>
  );
}

/** The people button on Today's header, with a dot when someone followed, asked, liked or commented. */
export function FriendsButton() {
  const account = useAccount((s) => s.account);
  const me = useSocial((s) => s.me);
  useEffect(() => {
    void refreshSocial();
  }, [account?.id]);
  if (!socialOn()) return null;
  const waiting = (me?.unread ?? 0) + (me?.requests ?? 0);
  return (
    <button
      type="button"
      aria-label={waiting ? t("friends.openWaiting", { count: waiting }) : t("friends.openFriends")}
      onClick={() => go("friends")}
      className="press relative grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted hover:text-ink"
    >
      <Icon name="people" size={18} />
      {waiting > 0 && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-bg bg-accent" />}
    </button>
  );
}

/** Done: "Post to friends", or "Posted" once it's out (straight away when the lifter posts every workout). */
export function PostToFriends({ summary }: { summary: SessionSummary }) {
  const { events } = useApp();
  const me = useSocial((s) => s.me);
  const [postId, setPostId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const p = me?.profile;
  const post = useCallback(async () => {
    if (!p) return;
    setBusy(true);
    try {
      setPostId(await postWorkout(events, summary, p.weights));
      setNote(null);
      track("feature", { name: "social_post", detail: p.autoPost ? "auto" : "tap" });
    } catch (e) {
      setNote(socialError(e));
    } finally {
      setBusy(false);
    }
  }, [events, summary, p]);
  // Already posted (from another device, or before a reload)? Ask once.
  useEffect(() => {
    if (!p) return;
    let live = true;
    social<{ posted: Record<string, string> }>("posted", { workoutIds: [summary.sessionId] })
      .then((r) => {
        if (!live) return;
        const id = r.posted[summary.sessionId];
        if (id) setPostId(id);
        else if (p.autoPost && !me?.suspended) void post();
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [summary.sessionId, !!p]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!socialOn() || !p || me?.suspended) return null;
  const unpost = async () => {
    try {
      await social("unpost", { workoutId: summary.sessionId });
      setPostId(null);
    } catch (e) {
      oops();
      setNote(socialError(e));
    }
  };
  return (
    <div className="mt-3">
      {postId ? (
        <div className="card flex items-center justify-between gap-3 px-4 py-2 text-left">
          <span className="flex items-center gap-2 text-sm">
            <Icon name="check" size={18} className="text-good" /> {t("friends.posted")}
          </span>
          <Button kind="quiet" className="px-3 py-2 text-sm" onClick={() => void unpost()}>
            {t("friends.unpost")}
          </Button>
        </div>
      ) : (
        <Button kind="ghost" icon="people" className="w-full" disabled={busy} onClick={() => void post()}>
          {t("friends.postIt")}
        </Button>
      )}
      <Note text={note} />
    </div>
  );
}
