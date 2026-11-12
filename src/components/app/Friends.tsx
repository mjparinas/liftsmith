"use client";

// Friends and the workout feed (Melvin, 2026-11-11; docs/decisions/friends.md). One screen (#/friends) with the
// feed, activity and people, a person's page (#/person/<handle>), a post's comments in a sheet, and the post
// button on Done. Opened from the people button on Today's header (Melvin chose it over a sixth tab).
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";

import { SECTION_LABEL } from "@/components/titles";
import { achName, TIER_LABEL } from "@/lib/achievements";
import { track } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import { challengeNudge, daysLeft, isOver, standings, winners } from "@/lib/challenge";
import type { SessionSummary } from "@/lib/derive";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { badgeForItem, COSMETICS, levelForItem } from "@/lib/game";
import { list as fmtList, inSentence, t } from "@/lib/i18n";
import {
  acceptPending,
  boardNudge,
  cleanInvite,
  clubUrl,
  inviteUrl,
  pendingInvite,
  playInviteUrl,
  rankBoard,
  savePendingInvite,
  weekStart,
} from "@/lib/invite";
import { haptic, isNative, oops, sound } from "@/lib/juice";
import { estimate } from "@/lib/onerm";
import { startPush, stopPush } from "@/lib/push";
import { copyText, shareUrl } from "@/lib/shareLinks";
import {
  bestLifts,
  postRoutineCode,
  postWorkout,
  profileChanges,
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
  AUDIENCES,
  BOARD_METRICS,
  CHALLENGE_DAYS,
  cleanHandle,
  HANDLE_RE,
  REPORT_REASONS,
  SOCIAL_LIMITS,
  type ActivityItem,
  type Audience,
  type BoardMetric,
  type BoardRow,
  type Challenge,
  type ChallengeDays,
  type ClubDetail,
  type ClubPreview,
  type ClubSummary,
  type FeedComment,
  type FeedPost,
  type Inviter,
  type Partner,
  type PersonCard,
  type PushPrefs,
  type ReportKind,
  type ReportReason,
  type SocialProfile,
} from "@/lib/socialTypes";
import { useApp } from "@/lib/store";
import { MUSCLE_LABEL, MUSCLES, type Muscle, type Unit } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";
import type { MessageKey } from "@/locales/en";

import { useGame } from "./Achievements";
import { Avatar } from "./AvatarFace";
import { ago, clock, repsText, setText } from "./format";
import { Icon } from "./icons";
import { go, goBack } from "./router";
import { Button, Chip, EmptyState, ScreenHeader, Section, Sheet, Skeleton, SwitchRow } from "./ui";

// --- Small pieces ---

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

/** Who can see a post, in words. */
const AUDIENCE_LABEL: Record<Audience, MessageKey> = { all: "friends.aud.all", friends: "friends.aud.friends", me: "friends.aud.me" };
const AUDIENCE_HINT: Record<Audience, MessageKey> = {
  all: "friends.aud.allHint",
  friends: "friends.aud.friendsHint",
  me: "friends.aud.meHint",
};

function AudienceChips({ value, onChange, publicProfile }: { value: Audience; onChange: (a: Audience) => void; publicProfile: boolean }) {
  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("friends.aud.title")}>
        {AUDIENCES.map((a) => (
          <Chip key={a} active={value === a} onClick={() => onChange(a)}>
            {t(AUDIENCE_LABEL[a])}
          </Chip>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">{t(value === "all" && publicProfile ? "friends.aud.allPublicHint" : AUDIENCE_HINT[value])}</p>
    </>
  );
}

/** What the compose sheet sends: the caption, who sees it and the handles of the friends trained with. */
export type ComposeValue = { caption: string; audience: Audience; partners: string[] };

/** The lifter's mutual friends, for tagging and challenges; loaded once per sheet. */
function useFriendList(on = true): Person[] | null {
  const [list, setList] = useState<Person[] | null>(null);
  useEffect(() => {
    if (!on) return;
    let live = true;
    social<{ people: Person[] }>("people", { list: "friends" })
      .then((r) => live && setList(r.people))
      .catch(() => live && setList([]));
    return () => {
      live = false;
    };
  }, [on]);
  return list;
}

/** Friends to pick as chips, up to `max`. Nothing shows without friends. */
function FriendPicker({
  label,
  hint,
  friends,
  value,
  onChange,
  max,
}: {
  label: string;
  hint: string;
  friends: Person[] | null;
  value: string[];
  onChange: (v: string[]) => void;
  max: number;
}) {
  if (!friends?.length) return null;
  const toggle = (h: string) => onChange(value.includes(h) ? value.filter((x) => x !== h) : value.length < max ? [...value, h] : value);
  return (
    <>
      <p className={`mb-1 mt-4 ${SECTION_LABEL}`}>{label}</p>
      <p className="mb-2 text-xs text-muted">{hint}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {friends.map((f) => (
          <Chip key={f.handle} active={value.includes(f.handle)} onClick={() => toggle(f.handle)}>
            {value.includes(f.handle) && <Icon name="check" size={14} />}
            {f.name}
          </Chip>
        ))}
      </div>
    </>
  );
}

/**
 * Writing a post: an optional caption, who sees it and who the lifter trained with. Done's "Post to friends" and
 * a post's "Edit post" both open it. Mounted only while open, so it starts from what's saved each time.
 */
export function ComposeSheet(props: {
  open: boolean;
  onClose: () => void;
  title: string;
  submit: string;
  caption: string;
  audience: Audience;
  partners: string[];
  onSubmit: (v: ComposeValue) => Promise<string | null>;
}) {
  return props.open ? <ComposeBody {...props} /> : null;
}

function ComposeBody({
  onClose,
  title,
  submit,
  caption: initialCaption,
  audience: initialAudience,
  partners: initialPartners,
  onSubmit,
}: Parameters<typeof ComposeSheet>[0]) {
  const me = useSocial((st) => st.me);
  const [caption, setCaption] = useState(initialCaption);
  const [audience, setAudience] = useState<Audience>(initialAudience);
  const [partners, setPartners] = useState<string[]>(initialPartners);
  const friends = useFriendList();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const err = await onSubmit({ caption: caption.trim(), audience, partners: audience === "me" ? [] : partners });
    setBusy(false);
    if (err) {
      oops();
      setError(err);
    } else {
      haptic("success");
      onClose();
    }
  };
  return (
    <Sheet open onClose={onClose} title={title}>
      <form onSubmit={(e) => void send(e)}>
        <label htmlFor="fr-caption" className="block text-sm text-muted">
          {t("friends.caption")}
        </label>
        <textarea
          id="fr-caption"
          value={caption}
          maxLength={SOCIAL_LIMITS.caption}
          rows={3}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={t("friends.captionHint")}
          className="card mt-1 w-full resize-none px-4 py-3"
        />
        <p className={`mb-4 mt-1 ${SECTION_LABEL}`}>{t("friends.aud.title")}</p>
        <AudienceChips value={audience} onChange={setAudience} publicProfile={!!me?.profile?.public} />
        {audience !== "me" && (
          <FriendPicker
            label={t("friends.partners")}
            hint={t("friends.partnersHint", { count: SOCIAL_LIMITS.partners })}
            friends={friends}
            value={partners}
            onChange={setPartners}
            max={SOCIAL_LIMITS.partners}
          />
        )}
        <Button submit className="mt-5 w-full" disabled={busy}>
          {submit}
        </Button>
        {error && (
          <p role="alert" className="mt-2 text-sm text-bad">
            {error}
          </p>
        )}
      </form>
    </Sheet>
  );
}

function PostCard({ post, onChange, onOpen }: { post: FeedPost; onChange: (p: FeedPost | null) => void; onOpen?: () => void }) {
  const { profile } = useApp();
  const myHandle = useSocial((st) => st.me?.profile?.handle);
  const unit = profile.unit;
  const b = post.body;
  const [more, setMore] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const routine = postRoutineCode(post);
  const edit = async (v: ComposeValue) => {
    try {
      const r = await social<{ caption: string; audience: Audience; partners: Partner[] }>("editPost", { id: post.id, ...v });
      onChange({ ...post, caption: r.caption, audience: r.audience, partners: r.partners });
      return null;
    } catch (e) {
      return socialError(e);
    }
  };
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
  const untag = async () => {
    setMore(false);
    try {
      await social("untag", { id: post.id });
      onChange({ ...post, tagged: false, partners: post.partners.filter((x) => x.handle !== myHandle) });
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
          <Avatar name={post.name} avatar={post.avatar} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{post.name}</span>
            <span className="block truncate text-xs text-muted">
              @{post.handle} · {ago(post.at)}
              {post.mine && post.audience !== "all" ? ` · ${t(AUDIENCE_LABEL[post.audience])}` : ""}
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
      {post.partners.length > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <Icon name="people" size={16} className="shrink-0" />
          <span className="min-w-0">{t("friends.with", { names: fmtList(post.partners.map((x) => x.name)) })}</span>
        </p>
      )}
      {post.caption && <p className="mt-3 whitespace-pre-wrap break-words">{post.caption}</p>}
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
          {routine && (
            <Button
              kind="ghost"
              icon="layers"
              className="w-full"
              onClick={() => {
                setMore(false);
                track("feature", { name: "social_save_workout" });
                go("routine", routine);
              }}
            >
              {t("friends.post.save")}
            </Button>
          )}
          {post.mine ? (
            <>
              <Button
                kind="ghost"
                className="w-full"
                onClick={() => {
                  setMore(false);
                  setEditing(true);
                }}
              >
                {t("friends.post.edit")}
              </Button>
              <Button kind="danger" icon="trash" className="w-full" onClick={() => void remove()}>
                {t("friends.post.delete")}
              </Button>
            </>
          ) : (
            <>
              {post.tagged && (
                <Button kind="ghost" className="w-full" onClick={() => void untag()}>
                  {t("friends.untag")}
                </Button>
              )}
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
            </>
          )}
        </div>
      </Sheet>
      <ReportSheet open={reporting} onClose={() => setReporting(false)} kind="post" id={post.id} />
      <ComposeSheet
        open={editing}
        onClose={() => setEditing(false)}
        title={t("friends.post.edit")}
        submit={t("friends.save")}
        caption={post.caption}
        audience={post.audience}
        partners={post.partners.map((x) => x.handle)}
        onSubmit={edit}
      />
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
              <Avatar name={c.name} avatar={c.avatar} size={32} />
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

function Join({ onJoined }: { onJoined?: () => void } = {}) {
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
      void startPush(true);
      haptic("celebrate");
      sound.done();
      track("feature", { name: "social_join", detail: open ? "open" : "approve" });
      onJoined?.();
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
  joined,
  set,
}: {
  open: boolean;
  autoPost: boolean;
  weights: boolean;
  /** Public profile, offered once joined (undefined while joining, which always starts private). */
  pub?: boolean;
  /** Once joined: who sees new posts and the best lifts switch. */
  joined?: Pick<SocialProfile, "audience" | "showLifts">;
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
      {joined && (
        <>
          <SwitchRow
            label={t("friends.showLifts")}
            hint={t(weights ? "friends.showLiftsHint" : "friends.showLiftsNoWeights")}
            on={joined.showLifts && weights}
            onChange={(v) => set({ showLifts: v, ...(v ? { weights: true } : {}) })}
          />
          <p className={`mb-2 mt-4 px-1 ${SECTION_LABEL}`}>{t("friends.aud.default")}</p>
          <AudienceChips value={joined.audience} onChange={(a) => set({ audience: a })} publicProfile={!!pub} />
        </>
      )}
      <p className="mt-2 px-1 text-xs text-muted">{t("friends.never")}</p>
    </Section>
  );
}

function Notifications({ prefs, set }: { prefs: PushPrefs; set: (p: Partial<PushPrefs>) => void }) {
  const [blocked, setBlocked] = useState(false);
  const change = async (key: keyof PushPrefs, on: boolean) => {
    set({ [key]: on });
    if (on) setBlocked(!(await startPush(true)));
  };
  const rows: [keyof PushPrefs, MessageKey][] = [
    ["follows", "friends.notify.follows"],
    ["comments", "friends.notify.comments"],
    ["sent", "friends.notify.sent"],
    ["likes", "friends.notify.likes"],
  ];
  return (
    <Section title={t("friends.notify")}>
      {rows.map(([key, label]) => (
        <SwitchRow key={key} label={t(label)} on={prefs[key]} onChange={(v) => void change(key, v)} />
      ))}
      {blocked && (
        <p role="status" className="mt-2 px-1 text-xs text-muted">
          {t("friends.notify.blocked")}
        </p>
      )}
    </Section>
  );
}

/**
 * Friends settings › Avatar: the four everyone has, then the ones levels and badges bring (the same items as the
 * Locker on Awards, so picking in either place is one setting, profile.cosmetics.avatar). A locked one says how to
 * get it.
 */
function AvatarPicker() {
  const { profile, setProfile } = useApp();
  const g = useGame();
  const me = useSocial((st) => st.me);
  const [hint, setHint] = useState<string | null>(null);
  const current = profile.cosmetics?.avatar ?? "";
  const avatars = COSMETICS.filter((c) => c.kind === "avatar");
  const name = me?.profile?.name ?? "";
  const pick = (id: string) => {
    haptic("select");
    setProfile({ cosmetics: { ...(profile.cosmetics ?? {}), avatar: id } });
  };
  const locked = avatars.find((c) => c.id === hint);
  const how = (id: string) => {
    const badge = badgeForItem(id);
    if (badge) return t("friends.avatar.badge", { badge: achName(badge.badge), tier: TIER_LABEL[badge.tier] });
    return t("friends.avatar.level", { level: levelForItem(id) ?? 1 });
  };
  return (
    <Section title={t("friends.avatar")}>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("friends.avatar")}>
        <button
          type="button"
          aria-pressed={!current}
          aria-label={t("friends.avatar.letter")}
          onClick={() => pick("")}
          className={`press grid h-14 w-14 place-items-center rounded-full border-2 ${!current ? "border-accent" : "border-transparent"}`}
        >
          <Avatar name={name} size={44} />
        </button>
        {avatars.map((c) => {
          const mine = g.owned.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={mine ? current === c.id : undefined}
              aria-expanded={mine ? undefined : hint === c.id}
              aria-label={mine ? c.name : `${c.name}, ${t("awards.locker.locked")}`}
              onClick={() => (mine ? pick(c.id) : setHint(hint === c.id ? null : c.id))}
              className={`press relative grid h-14 w-14 place-items-center rounded-full border-2 ${current === c.id ? "border-accent" : "border-transparent"}`}
            >
              <Avatar name={name} avatar={c.id} size={44} dim={!mine} />
              {!mine && (
                <span aria-hidden className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full bg-raised text-muted">
                  <Icon name="lock" size={12} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="mt-2 px-1 text-xs text-muted">
        {locked ? `${locked.name}: ${how(locked.id)}` : t("friends.avatar.hint")}
      </p>
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
      await stopPush();
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
      <AvatarPicker />
      <Privacy open={p.open} autoPost={p.autoPost} weights={p.weights} pub={p.public} joined={p} set={(c) => void save(c)} />
      {isNative() && <Notifications prefs={p.push} set={(push) => void save({ push })} />}
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

function Activity({ onPeople, onBoard }: { onPeople: () => void; onBoard: () => void }) {
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
          : i.kind === "sent"
            ? t("friends.act.sent", { name: i.name, workout: i.text || t("rt.defaultName") })
            : i.kind === "challenge"
              ? t("friends.act.challenge", { name: i.name, challenge: i.text ?? "" })
              : i.kind === "tag"
                ? t("friends.act.tag", { name: i.name })
                : t("friends.act.comment", { name: i.name, text: i.text ?? "" });
  return (
    <>
      {items.length ? (
        <ul className="card divide-y divide-line">
          {items.map((i, n) => (
            <li key={`${i.kind}-${i.handle}-${i.at}-${n}`}>
              <button
                type="button"
                onClick={() =>
                  i.kind === "request"
                    ? onPeople()
                    : i.kind === "challenge"
                      ? onBoard()
                      : i.kind === "sent" && i.code
                        ? go("routine", i.code)
                        : go("person", i.handle)
                }
                className="press flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <Avatar name={i.name} avatar={i.avatar} size={36} />
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

type Person = { handle: string; name: string; avatar: string; at: number };
type ListName = "requests" | "following" | "followers" | "muted" | "blocked";

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
  if (rows === null || (!rows.length && (list === "requests" || list === "muted"))) return null;
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
              <Avatar name={p.name} avatar={p.avatar} size={36} />
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
            {list === "muted" && (
              <Button kind="quiet" className="px-3 py-2 text-sm" onClick={() => void act(p, "mute", { on: false })}>
                {t("friends.unmute")}
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

/** People › Invite a friend: shares the lifter's invite link. Whoever accepts it and the lifter follow each other. */
function InviteButton() {
  const [note, setNote] = useState<string | null>(null);
  const share = async () => {
    haptic("tick");
    try {
      const r = await social<{ code: string }>("invite");
      const url = inviteUrl(r.code);
      track("feature", { name: "social_invite" });
      if (await shareUrl(url, t("friends.invite.shareTitle"))) return;
      setNote((await copyText(url)) ? t("link.copied") : url);
    } catch (e) {
      oops();
      setNote(socialError(e));
    }
  };
  return (
    <>
      <Button kind="primary" icon="people" className="mt-3 w-full" onClick={() => void share()}>
        {t("friends.invite")}
      </Button>
      <p className="mt-1 px-1 text-xs text-muted">{t("friends.inviteHint")}</p>
      <Note text={note} />
    </>
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
      <InviteButton />
      <Button kind="ghost" icon="share" className="mt-2 w-full" onClick={() => void share()}>
        {t("friends.shareMe", { handle })}
      </Button>
      <Note text={note} />
      <PeopleList list="requests" reload={version} onChanged={changed} />
      <PeopleList list="following" reload={version} onChanged={changed} />
      <PeopleList list="followers" reload={version} onChanged={changed} />
      <PeopleList list="muted" reload={version} onChanged={changed} />
      <PeopleList list="blocked" reload={version} onChanged={changed} />
    </>
  );
}

// --- The leaderboard ---

const METRIC_LABEL: Record<BoardMetric, MessageKey> = {
  workouts: "friends.board.workouts",
  sets: "friends.board.sets",
  minutes: "friends.board.minutes",
  volume: "friends.board.volume",
};

function metricText(metric: BoardMetric, v: number, unit: Unit): string {
  if (metric === "volume") return `${fmtNum(Math.round(fromKg(v, unit)))} ${unit}`;
  if (metric === "minutes") return t("friends.board.min", { n: fmtNum(v) });
  return fmtNum(v);
}

/**
 * Friends › Board: this week (or last) for the lifter and everyone they follow, from workouts posted to Friends.
 * One line says what to do about it: how much more passes the person just above.
 */
function Board({ onPeople }: { onPeople: () => void }) {
  const { profile } = useApp();
  const unit = profile.unit;
  const [week, setWeek] = useState<0 | 1>(0);
  const [metric, setMetric] = useState<BoardMetric>("workouts");
  const [data, setData] = useState<{ week: number; rows: BoardRow[] } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    social<{ rows: BoardRow[] }>("board", { from: weekStart(Date.now(), week) })
      .then((r) => live && setData({ week, rows: r.rows }))
      .catch((e: unknown) => live && (setData({ week, rows: [] }), setNote(socialError(e))));
    return () => {
      live = false;
    };
  }, [week]);
  const rows = data?.week === week ? data.rows : null;
  if (rows === null) return <Skeleton className="h-48" />;
  if (rows.length < 2)
    return (
      <EmptyState
        icon="trophy"
        title={t("friends.board.none")}
        body={t("friends.board.noneBody")}
        action={<Button onClick={onPeople}>{t("friends.feed.find")}</Button>}
      />
    );
  const ranked = rankBoard(rows, metric);
  const nudge = week === 0 ? boardNudge(rows, metric) : null;
  const what = inSentence(t(METRIC_LABEL[metric]));
  const nudgeText = !nudge
    ? week === 0
      ? t("friends.board.start")
      : null
    : nudge.kind === "lead"
      ? t("friends.board.lead", { by: metricText(metric, nudge.by, unit), what })
      : nudge.kind === "tied"
        ? t("friends.board.tied", { name: nudge.name })
        : t("friends.board.chase", { gap: metricText(metric, nudge.gap, unit), what, name: nudge.name });
  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("friends.board.week")}>
        <Chip active={week === 0} onClick={() => setWeek(0)}>
          {t("friends.board.thisWeek")}
        </Chip>
        <Chip active={week === 1} onClick={() => setWeek(1)}>
          {t("friends.board.lastWeek")}
        </Chip>
      </div>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t("friends.board.by")}>
        {BOARD_METRICS.map((m) => (
          <Chip key={m} active={metric === m} onClick={() => setMetric(m)}>
            {t(METRIC_LABEL[m])}
          </Chip>
        ))}
      </div>
      {nudgeText && (
        <p className="card card-tint mt-4 p-4 text-sm font-medium" style={{ "--tint": "var(--color-ember)" } as CSSProperties}>
          {nudgeText}
        </p>
      )}
      <ol className="card mt-3 divide-y divide-line" aria-label={t("friends.board.title")}>
        {ranked.map((r) => (
          <li key={r.handle} className={`flex items-center gap-3 px-4 py-2.5 ${r.me ? "bg-accent/10" : ""}`}>
            <span className="num w-6 shrink-0 text-center font-bold text-muted">{r.place}</span>
            <button
              type="button"
              onClick={() => go("person", r.handle)}
              className="press flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
            >
              <Avatar name={r.name} avatar={r.avatar} size={36} />
              <span className="min-w-0 truncate font-medium">{r.me ? t("friends.board.you", { name: r.name }) : r.name}</span>
            </button>
            <span className="num shrink-0 font-bold">{metricText(metric, r[metric], unit)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 px-1 text-xs text-muted">{t("friends.board.hint")}</p>
      <Note text={note} />
    </>
  );
}

// --- Challenges ---

const CHALLENGE_LEN: Record<ChallengeDays, MessageKey> = { 7: "friends.ch.len7", 14: "friends.ch.len14", 28: "friends.ch.len28" };
const CHALLENGE_NAME: Record<BoardMetric, MessageKey> = {
  workouts: "friends.ch.name.workouts",
  sets: "friends.ch.name.sets",
  minutes: "friends.ch.name.minutes",
  volume: "friends.ch.name.volume",
};

/**
 * Friends › Board, above the board: the lifter's challenges. Invitations to answer, running ones with what to do
 * to move up, and finished ones with who won. "Start a challenge" picks a measure, a length and friends.
 */
function Challenges() {
  const [list, setList] = useState<Challenge[] | null>(null);
  const [reload, setReload] = useState(0);
  const [starting, setStarting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    social<{ challenges: Challenge[] }>("challenges")
      .then((r) => live && setList(r.challenges))
      .catch((e: unknown) => live && (setList([]), setNote(socialError(e))));
    return () => {
      live = false;
    };
  }, [reload]);
  const changed = () => setReload((r) => r + 1);
  return (
    <div className="mb-6">
      <Section
        title={t("friends.ch.title")}
        icon="flag"
        right={
          <Button kind="quiet" className="px-3 py-2 text-sm" onClick={() => setStarting(true)}>
            {t("friends.ch.start")}
          </Button>
        }
      >
        {list === null ? (
          <Skeleton className="h-24" />
        ) : list.length ? (
          <ul className="space-y-3">
            {list.map((c) => (
              <ChallengeCard key={c.id} c={c} onChanged={changed} />
            ))}
          </ul>
        ) : (
          <p className="card p-4 text-sm text-muted">{t("friends.ch.none")}</p>
        )}
        <Note text={note} />
      </Section>
      <StartChallenge open={starting} onClose={() => setStarting(false)} onStarted={changed} />
    </div>
  );
}

function ChallengeCard({ c, onChanged }: { c: Challenge; onChanged: () => void }) {
  const { profile } = useApp();
  const unit = profile.unit;
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());
  const over = isOver(c, now);
  const ranked = standings(c);
  const waiting = c.members.filter((m) => !m.joined).length;
  const won = over ? winners(c) : [];
  const nudge = over ? null : challengeNudge(c);
  const what = inSentence(t(METRIC_LABEL[c.metric]));
  const nudgeText = !nudge
    ? null
    : nudge.kind === "lead"
      ? t("friends.board.lead", { by: metricText(c.metric, nudge.by, unit), what })
      : nudge.kind === "tied"
        ? t("friends.board.tied", { name: nudge.name })
        : t("friends.board.chase", { gap: metricText(c.metric, nudge.gap, unit), what, name: nudge.name });
  const act = async (op: "challengeAnswer" | "challengeLeave", b: Record<string, unknown>) => {
    if (busy) return;
    setBusy(true);
    try {
      await social(op, { id: c.id, ...b });
      haptic(op === "challengeAnswer" && b.accept ? "success" : "select");
      if (op === "challengeAnswer" && b.accept) track("feature", { name: "social_challenge_join" });
      onChanged();
    } catch (e) {
      oops();
      setNote(socialError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <li className="card p-4" aria-label={c.name}>
      <p className="font-semibold">{c.name}</p>
      <p className="text-xs text-muted">
        {t(METRIC_LABEL[c.metric])} ·{" "}
        {over
          ? won.length
            ? t("friends.ch.won", { names: fmtList(won), count: won.length })
            : t("friends.ch.ended")
          : t("friends.ch.left", { count: daysLeft(c, now) })}
        {c.mine ? "" : ` · ${t("friends.ch.by", { name: c.owner.name })}`}
      </p>
      {c.status === "invited" && !over && (
        <div className="mt-3">
          <p className="text-sm">{t("friends.ch.invited", { name: c.owner.name })}</p>
          <p className="mt-1 text-xs text-muted">{t("friends.ch.joinNote")}</p>
          <div className="mt-2 flex gap-2">
            <Button
              kind="ghost"
              icon="check"
              className="flex-1"
              disabled={busy}
              onClick={() => void act("challengeAnswer", { accept: true })}
            >
              {t("friends.ch.join")}
            </Button>
            <Button kind="quiet" disabled={busy} onClick={() => void act("challengeAnswer", { accept: false })}>
              {t("friends.ch.decline")}
            </Button>
          </div>
        </div>
      )}
      {nudgeText && <p className="mt-3 text-sm font-medium">{nudgeText}</p>}
      <ol className="mt-2 divide-y divide-line" aria-label={t("friends.ch.standings")}>
        {ranked.map((r) => (
          <li key={r.handle} className={`flex items-center gap-3 py-2 ${r.me ? "font-semibold" : ""}`}>
            <span className="num w-6 shrink-0 text-center font-bold text-muted">{r.place}</span>
            <Avatar name={r.name} avatar={r.avatar} size={32} />
            <span className="min-w-0 flex-1 truncate">{r.me ? t("friends.board.you", { name: r.name }) : r.name}</span>
            <span className="num shrink-0 font-bold">{metricText(c.metric, r[c.metric], unit)}</span>
          </li>
        ))}
      </ol>
      {waiting > 0 && !over && <p className="mt-1 text-xs text-muted">{t("friends.ch.waiting", { count: waiting })}</p>}
      {c.status === "joined" && (
        <Button kind="quiet" className="mt-2 px-3 py-2 text-sm" disabled={busy} onClick={() => void act("challengeLeave", {})}>
          {c.mine ? (over ? t("friends.ch.clear") : t("friends.ch.end")) : t("friends.ch.leave")}
        </Button>
      )}
      <Note text={note} />
    </li>
  );
}

function StartChallenge(props: { open: boolean; onClose: () => void; onStarted: () => void }) {
  return props.open ? <StartChallengeBody {...props} /> : null;
}

function StartChallengeBody({ onClose, onStarted }: { onClose: () => void; onStarted: () => void }) {
  const friends = useFriendList();
  const [metric, setMetric] = useState<BoardMetric>("workouts");
  const [days, setDays] = useState<ChallengeDays>(7);
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fallback = t(CHALLENGE_NAME[metric]);
  const start = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !picked.length) return;
    setBusy(true);
    try {
      await social("challengeCreate", { name: name.trim() || fallback, metric, days, handles: picked });
      haptic("success");
      sound.done();
      track("feature", { name: "social_challenge_start", detail: metric });
      onStarted();
      onClose();
    } catch (err) {
      oops();
      setError(socialError(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open onClose={onClose} title={t("friends.ch.start")}>
      <form onSubmit={(e) => void start(e)}>
        <label htmlFor="fr-ch-name" className="block text-sm text-muted">
          {t("friends.ch.nameLabel")}
        </label>
        <input
          id="fr-ch-name"
          value={name}
          maxLength={SOCIAL_LIMITS.challengeName}
          onChange={(e) => setName(e.target.value)}
          placeholder={fallback}
          className="card mt-1 w-full px-4 py-3"
        />
        <p className={`mb-2 mt-4 ${SECTION_LABEL}`}>{t("friends.ch.measure")}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("friends.ch.measure")}>
          {BOARD_METRICS.map((m) => (
            <Chip key={m} active={metric === m} onClick={() => setMetric(m)}>
              {t(METRIC_LABEL[m])}
            </Chip>
          ))}
        </div>
        <p className={`mb-2 mt-4 ${SECTION_LABEL}`}>{t("friends.ch.length")}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("friends.ch.length")}>
          {CHALLENGE_DAYS.map((d) => (
            <Chip key={d} active={days === d} onClick={() => setDays(d)}>
              {t(CHALLENGE_LEN[d])}
            </Chip>
          ))}
        </div>
        {friends === null ? (
          <Skeleton className="mt-4 h-12" />
        ) : friends.length ? (
          <FriendPicker
            label={t("friends.ch.who")}
            hint={t("friends.ch.whoHint")}
            friends={friends}
            value={picked}
            onChange={setPicked}
            max={SOCIAL_LIMITS.challengeMembers - 1}
          />
        ) : (
          <p className="mt-4 text-sm text-muted">{t("friends.ch.noFriends")}</p>
        )}
        <Button submit className="mt-5 w-full" disabled={busy || !picked.length}>
          {t("friends.ch.go")}
        </Button>
        {error && (
          <p role="alert" className="mt-2 text-sm text-bad">
            {error}
          </p>
        )}
      </form>
    </Sheet>
  );
}

// --- Clubs and gym crews ---

/**
 * Friends › Clubs: the lifter's clubs and gym crews. Each opens to this week's board of its members, the join
 * link to share and, for the starter, removing members and a new link. Start one, or join with a code.
 */
function Clubs() {
  const [list, setList] = useState<ClubSummary[] | null>(null);
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [code, setCode] = useState("");
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    social<{ clubs: ClubSummary[] }>("clubs")
      .then((r) => live && setList(r.clubs))
      .catch((e: unknown) => live && (setList([]), setNote(socialError(e))));
    return () => {
      live = false;
    };
  }, [reload]);
  const changed = () => setReload((r) => r + 1);
  const joinCode = (e: FormEvent) => {
    e.preventDefault();
    const c = cleanInvite(code);
    if (!c) {
      oops();
      setNote(t("friends.err.club"));
      return;
    }
    go("club", c);
  };
  if (list === null) return <Skeleton className="h-40" />;
  return (
    <>
      {list.length ? (
        <ul className="card divide-y divide-line">
          {list.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setOpen(c.id)} className="press flex w-full items-center gap-3 px-4 py-3 text-left">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-raised text-accent">
                  <Icon name="people" size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c.name}</span>
                  <span className="block text-xs text-muted">
                    {t("friends.club.members", { count: c.members })}
                    {c.mine ? ` · ${t("friends.club.yours")}` : ""}
                  </span>
                </span>
                <Icon name="chevronRight" size={18} className="text-faint" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="people" title={t("friends.club.none")} body={t("friends.club.noneBody")} />
      )}
      <Button kind={list.length ? "ghost" : "primary"} icon="plus" className="mt-3 w-full" onClick={() => setStarting(true)}>
        {t("friends.club.start")}
      </Button>
      <form onSubmit={joinCode} className="mt-4">
        <label htmlFor="fr-club-code" className="block text-sm text-muted">
          {t("friends.club.haveCode")}
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="fr-club-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={12}
            placeholder="ABCD2345"
            className="card min-w-0 flex-1 px-4 py-3 uppercase"
          />
          <Button submit kind="ghost" disabled={!code.trim()}>
            {t("friends.club.join")}
          </Button>
        </div>
      </form>
      <Note text={note} />
      <StartClub open={starting} onClose={() => setStarting(false)} onStarted={(id) => (changed(), setOpen(id))} />
      <ClubSheet id={open} onClose={() => setOpen(null)} onChanged={changed} />
    </>
  );
}

function StartClub(props: { open: boolean; onClose: () => void; onStarted: (id: string) => void }) {
  return props.open ? <StartClubBody {...props} /> : null;
}

function StartClubBody({ onClose, onStarted }: { onClose: () => void; onStarted: (id: string) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !name.trim()) return;
    setBusy(true);
    try {
      const r = await social<{ id: string }>("clubCreate", { name: name.trim() });
      haptic("success");
      sound.done();
      track("feature", { name: "social_club_start" });
      onClose();
      onStarted(r.id);
    } catch (err) {
      oops();
      setError(socialError(err));
      setBusy(false);
    }
  };
  return (
    <Sheet open onClose={onClose} title={t("friends.club.start")}>
      <form onSubmit={(e) => void start(e)}>
        <label htmlFor="fr-club-name" className="block text-sm text-muted">
          {t("friends.club.name")}
        </label>
        <input
          id="fr-club-name"
          value={name}
          maxLength={SOCIAL_LIMITS.clubName}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("friends.club.namePlaceholder")}
          className="card mt-1 w-full px-4 py-3"
        />
        <p className="mt-2 text-xs text-muted">{t("friends.club.startHint")}</p>
        <Button submit className="mt-5 w-full" disabled={busy || !name.trim()}>
          {t("friends.club.create")}
        </Button>
        {error && (
          <p role="alert" className="mt-2 text-sm text-bad">
            {error}
          </p>
        )}
      </form>
    </Sheet>
  );
}

function ClubSheet({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  return id ? <ClubBody key={id} id={id} onClose={onClose} onChanged={onChanged} /> : null;
}

function ClubBody({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { profile } = useApp();
  const unit = profile.unit;
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [metric, setMetric] = useState<BoardMetric>("workouts");
  const [reload, setReload] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    social<{ club: ClubDetail }>("club", { id, from: weekStart(Date.now()) })
      .then((r) => live && setClub(r.club))
      .catch((e: unknown) => live && setNote(socialError(e)));
    return () => {
      live = false;
    };
  }, [id, reload]);
  const act = async (b: Record<string, unknown>, op: "clubManage" | "clubLeave") => {
    try {
      const r = await social<{ code?: string }>(op, { id, ...b });
      haptic("select");
      if (op === "clubLeave") {
        onChanged();
        onClose();
        return;
      }
      if (r.code) setNote(t("friends.club.newCodeDone"));
      setReload((x) => x + 1);
      onChanged();
    } catch (e) {
      oops();
      setNote(socialError(e));
    }
  };
  const share = async () => {
    if (!club) return;
    haptic("tick");
    const url = clubUrl(club.code);
    track("feature", { name: "social_club_invite" });
    if (await shareUrl(url, t("friends.club.shareTitle", { name: club.name }))) return;
    setNote((await copyText(url)) ? t("link.copied") : url);
  };
  const ranked = club ? rankBoard(club.rows, metric) : [];
  const nudge = club ? boardNudge(club.rows, metric) : null;
  const what = inSentence(t(METRIC_LABEL[metric]));
  const nudgeText = !nudge
    ? club && club.rows.length > 1
      ? t("friends.board.start")
      : null
    : nudge.kind === "lead"
      ? t("friends.board.lead", { by: metricText(metric, nudge.by, unit), what })
      : nudge.kind === "tied"
        ? t("friends.board.tied", { name: nudge.name })
        : t("friends.board.chase", { gap: metricText(metric, nudge.gap, unit), what, name: nudge.name });
  return (
    <Sheet open onClose={onClose} title={club?.name ?? t("friends.tab.clubs")}>
      {!club ? (
        note ? (
          <Note text={note} />
        ) : (
          <Skeleton className="h-48" />
        )
      ) : (
        <>
          <p className="text-sm text-muted">
            {t("friends.club.members", { count: club.members })} ·{" "}
            {club.mine ? t("friends.club.yours") : t("friends.club.by", { name: club.owner.name })}
          </p>
          <Button icon="people" className="mt-3 w-full" onClick={() => void share()}>
            {t("friends.club.invite")}
          </Button>
          <p className="mt-1 px-1 text-xs text-muted">{t("friends.club.inviteHint", { code: club.code })}</p>
          <p className={`mb-2 mt-5 ${SECTION_LABEL}`}>{t("friends.club.thisWeek")}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("friends.board.by")}>
            {BOARD_METRICS.map((m) => (
              <Chip key={m} active={metric === m} onClick={() => setMetric(m)}>
                {t(METRIC_LABEL[m])}
              </Chip>
            ))}
          </div>
          {nudgeText && <p className="mt-3 text-sm font-medium">{nudgeText}</p>}
          <ol className="card mt-3 divide-y divide-line" aria-label={t("friends.club.thisWeek")}>
            {ranked.map((r) => (
              <li key={r.handle} className={`flex items-center gap-3 px-4 py-2 ${r.me ? "bg-accent/10" : ""}`}>
                <span className="num w-6 shrink-0 text-center font-bold text-muted">{r.place}</span>
                <Avatar name={r.name} avatar={r.avatar} size={32} />
                <span className="min-w-0 flex-1 truncate">{r.me ? t("friends.board.you", { name: r.name }) : r.name}</span>
                <span className="num shrink-0 font-bold">{metricText(metric, r[metric], unit)}</span>
                {club.mine && !r.me && (
                  <button
                    type="button"
                    aria-label={t("friends.club.remove", { name: r.name })}
                    onClick={() => void act({ remove: r.handle }, "clubManage")}
                    className="press grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:text-ink"
                  >
                    <Icon name="trash" size={18} />
                  </button>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-2 px-1 text-xs text-muted">{t("friends.club.hint")}</p>
          <div className="mt-4 space-y-2">
            {club.mine && (
              <Button kind="ghost" className="w-full" onClick={() => void act({ newCode: true }, "clubManage")}>
                {t("friends.club.newCode")}
              </Button>
            )}
            <Button kind={club.mine ? "danger" : "ghost"} className="w-full" onClick={() => void act({}, "clubLeave")}>
              {club.mine ? t("friends.club.delete") : t("friends.club.leave")}
            </Button>
          </div>
          <Note text={note} />
        </>
      )}
    </Sheet>
  );
}

/**
 * #/club/<code>: a club's join link. Signed out, it asks to sign in; not yet in Friends, the join form is right
 * there and joining also joins the club; in Friends, one tap joins and opens Friends › Clubs.
 */
export function ClubScreen({ code: raw }: { code: string }) {
  const { account, me } = useSocialLoaded();
  const code = cleanInvite(raw);
  const [club, setClub] = useState<ClubPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!account || !code) return;
    let live = true;
    social<{ club: ClubPreview }>("clubInfo", { code })
      .then((r) => live && setClub(r.club))
      .catch((e: unknown) => live && setError(socialError(e)));
    return () => {
      live = false;
    };
  }, [account?.id, code]); // eslint-disable-line react-hooks/exhaustive-deps
  const joinClub = async () => {
    setBusy(true);
    try {
      await social("clubJoin", { code });
      haptic("celebrate");
      sound.done();
      track("feature", { name: "social_club_join" });
      go("friends", "clubs");
    } catch (e) {
      oops();
      setError(socialError(e));
      setBusy(false);
    }
  };
  const header = <ScreenHeader title={t("friends.club.title")} back={{ label: t("friends.back"), onClick: goBack }} />;
  if (!code || error)
    return (
      <div className="pb-8">
        {header}
        <EmptyState icon="people" title={error ?? t("friends.err.club")} />
      </div>
    );
  if (!account)
    return (
      <div className="pb-8">
        {header}
        <EmptyState
          icon="people"
          mascot="cheer"
          title={t("friends.club.signedOut")}
          body={t("friends.club.signedOutBody")}
          action={<Button onClick={() => go("account")}>{t("friends.signIn.go")}</Button>}
        />
      </div>
    );
  return (
    <div className="pb-8">
      {header}
      {club ? (
        <div className="card card-tint mt-4 p-4" style={{ "--tint": "var(--color-ember)" } as CSSProperties}>
          <p className="text-lg font-bold">{club.name}</p>
          <p className="text-sm text-muted">
            {t("friends.club.members", { count: club.members })} · {t("friends.club.by", { name: club.owner.name })}
          </p>
          <p className="mt-2 text-sm">{t("friends.club.joinNote")}</p>
        </div>
      ) : (
        <Skeleton className="mt-4 h-28" />
      )}
      {club?.joined ? (
        <Button className="mt-4 w-full" onClick={() => go("friends", "clubs")}>
          {t("friends.club.open")}
        </Button>
      ) : me?.profile ? (
        <Button className="mt-4 w-full" disabled={busy || !club || !!me.suspended} onClick={() => void joinClub()}>
          {t("friends.club.joinIt")}
        </Button>
      ) : me ? (
        <div className="mt-6">
          <Join onJoined={() => void joinClub()} />
        </div>
      ) : (
        <Skeleton className="mt-4 h-48" />
      )}
    </div>
  );
}

// --- Invites ---

/**
 * #/invite/<code>: someone's invite. Signed out, it asks to sign in (and on the web offers the app); not yet in
 * Friends, it shows who invited them and the join form, and joining accepts it; in Friends, one tap accepts. The
 * code waits on the device meanwhile (invite.ts), so signing in on another screen doesn't lose it.
 */
export function InviteScreen({ code: raw }: { code: string }) {
  const { account, me } = useSocialLoaded();
  const code = cleanInvite(raw);
  const [who, setWho] = useState<{ inviter: Inviter; self: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (code) savePendingInvite(code);
  }, [code]);
  useEffect(() => {
    if (!account || !code) return;
    let live = true;
    social<{ inviter: Inviter; self: boolean }>("inviteInfo", { code })
      .then((r) => live && setWho(r))
      .catch((e: unknown) => {
        if (!live) return;
        setError(socialError(e));
        savePendingInvite("");
      });
    return () => {
      live = false;
    };
  }, [account?.id, code]); // eslint-disable-line react-hooks/exhaustive-deps
  const accept = async () => {
    setBusy(true);
    const handle = await acceptPending();
    setBusy(false);
    if (handle) {
      haptic("celebrate");
      sound.done();
      track("feature", { name: "social_invite_accept" });
      void refreshSocial();
      go("person", handle);
    } else {
      oops();
      setError(t("friends.err.failed"));
    }
  };
  const header = <ScreenHeader title={t("friends.invite.title")} back={{ label: t("friends.back"), onClick: goBack }} />;
  if (!code || error)
    return (
      <div className="pb-8">
        {header}
        <EmptyState icon="people" title={error ?? t("friends.err.invite")} />
      </div>
    );
  if (!account)
    return (
      <div className="pb-8">
        {header}
        <EmptyState
          icon="people"
          mascot="cheer"
          title={t("friends.invite.signedOut")}
          body={t("friends.invite.signedOutBody")}
          action={<Button onClick={() => go("account")}>{t("friends.signIn.go")}</Button>}
        />
        {!isNative() && (
          <Section title={t("friends.invite.getApp")}>
            <a href={playInviteUrl(code)} className="press card flex min-h-11 items-center justify-between px-4 py-3 text-sm">
              <span>{t("friends.invite.play")}</span>
              <span aria-hidden className="text-muted">
                ›
              </span>
            </a>
            <p className="mt-2 px-1 text-xs text-muted">{t("friends.invite.iphone")}</p>
          </Section>
        )}
      </div>
    );
  const inviter = who?.inviter;
  return (
    <div className="pb-8">
      {header}
      {inviter ? (
        <div className="card mt-4 flex items-center gap-4 p-4">
          <Avatar name={inviter.name} avatar={inviter.avatar} size={56} />
          <p className="min-w-0">
            <span className="block font-semibold">{t("friends.invite.from", { name: inviter.name })}</span>
            <span className="block text-sm text-muted">{t("friends.invite.body")}</span>
          </p>
        </div>
      ) : (
        <Skeleton className="mt-4 h-24" />
      )}
      {who?.self ? (
        <p className="mt-4 px-1 text-sm text-muted">{t("friends.invite.self")}</p>
      ) : me?.profile ? (
        <Button className="mt-4 w-full" disabled={busy || !inviter || !!me.suspended} onClick={() => void accept()}>
          {t("friends.invite.accept")}
        </Button>
      ) : me ? (
        <div className="mt-6">
          <Join onJoined={() => void accept()} />
        </div>
      ) : (
        <Skeleton className="mt-4 h-48" />
      )}
    </div>
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

const TABS = ["feed", "board", "clubs", "activity", "people"] as const;
type Tab = (typeof TABS)[number];

export function Friends({ tab: start }: { tab?: string } = {}) {
  const { account, me, error } = useSocialLoaded();
  useProfileSync();
  const [tab, setTab] = useState<Tab>(TABS.find((x) => x === start) ?? "feed");
  const [settings, setSettings] = useState(false);
  const header = (
    <div className="flex items-end justify-between gap-2">
      <ScreenHeader title={t("friends.title")} />
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
        <Chip active={tab === "board"} onClick={() => setTab("board")}>
          {t("friends.tab.board")}
        </Chip>
        <Chip active={tab === "clubs"} onClick={() => setTab("clubs")}>
          {t("friends.tab.clubs")}
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
        {tab === "board" && (
          <>
            <Challenges />
            <Board onPeople={() => setTab("people")} />
          </>
        )}
        {tab === "clubs" && <Clubs />}
        {tab === "activity" && <Activity onPeople={() => setTab("people")} onBoard={() => setTab("board")} />}
        {tab === "people" && <People />}
      </div>
      <span className="sr-only" aria-live="polite">
        {waiting ? t("friends.waiting", { count: waiting }) : ""}
      </span>
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
    </div>
  );
}

/** A profile's best lifts: the exercise, the set and its estimated one-rep max, in the reader's units. */
function Showcase({ person }: { person: PersonCard }) {
  const { profile } = useApp();
  if (!person.lifts.length) return null;
  const unit = profile.unit;
  return (
    <Section title={t("friends.lifts")} info="e1rm">
      <ul className="card divide-y divide-line">
        {person.lifts.map((l) => {
          const ex = EXERCISE_BY_ID.get(l.id);
          return (
            <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block truncate font-medium">{ex?.name ?? l.id}</span>
                <span className="num block text-xs text-muted">
                  {ex ? setText(ex, l.w, l.r, unit) : `${fmtNum(fromKg(l.w, unit))} ${unit} × ${l.r}`}
                </span>
              </span>
              <span className="num shrink-0 text-right">
                <span className="block font-bold">
                  {fmtNum(Math.round(fromKg(estimate(l.w, l.r), unit)))} {unit}
                </span>
                <span className="block text-xs text-muted">{t("friends.liftsE1rm")}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Section>
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
  const act = async (op: string, extra: Record<string, unknown> = {}) => {
    haptic("tick");
    try {
      const r = await social<{ person?: PersonCard }>(op, { handle: h, ...extra });
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
        <Avatar name={person.name} avatar={person.avatar} size={56} />
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
      {person.muted && <p className="mt-2 px-1 text-sm text-muted">{t("friends.person.muted")}</p>}
      <Showcase person={person} />
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
            <>
              <Button kind="ghost" icon="moon" className="w-full" onClick={() => void act("mute", { on: !person.muted })}>
                {person.muted ? t("friends.unmute") : t("friends.mute")}
              </Button>
              {!person.muted && <p className="text-xs text-muted">{t("friends.muteHint")}</p>}
              <Button kind="danger" icon="ban" className="w-full" onClick={() => void act("block")}>
                {t("friends.block")}
              </Button>
            </>
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

let lastSent = "";
/**
 * Keeps the server's copy of the avatar (picked in the Locker or Friends settings) and the best lifts in step with
 * this device, which works both out. Sends only a change, and never the same change twice.
 */
function useProfileSync() {
  const me = useSocial((st) => st.me);
  const { events, profile } = useApp();
  const p = me?.profile;
  const avatar = profile.cosmetics?.avatar ?? "";
  const lifts = useMemo(() => bestLifts(events), [events]);
  const suspended = !!me?.suspended;
  const joinedNow = !!p;
  useEffect(() => {
    if (!joinedNow || suspended || !pendingInvite() || location.hash.startsWith("#/invite/")) return;
    void acceptPending().then((handle) => (handle ? refreshSocial() : undefined));
  }, [joinedNow, suspended]);
  useEffect(() => {
    if (!p || suspended) return;
    const change = profileChanges(p, avatar, p.showLifts && p.weights ? lifts : []);
    const key = JSON.stringify(change);
    if (!change || key === lastSent) return;
    lastSent = key;
    social<SocialMe>("update", change)
      .then((m) => m.profile && useSocial.setState({ me: m }))
      .catch(() => undefined);
  }, [p, avatar, lifts, suspended]);
}

/**
 * The Friends tab's badge (App.tsx): how many follows, requests, likes and comments are waiting. It also keeps the
 * social state fresh for the signed-in account and, once joined with notifications allowed, this phone's push token
 * current (no prompt here). 0 while Friends is switched off.
 */
export function useFriendsWaiting(): number {
  const account = useAccount((s) => s.account);
  const me = useSocial((s) => s.me);
  useProfileSync();
  useEffect(() => {
    void refreshSocial();
  }, [account?.id]);
  const joinedNow = !!me?.profile;
  useEffect(() => {
    if (joinedNow) void startPush(false);
  }, [joinedNow]);
  if (!socialOn()) return 0;
  return (me?.unread ?? 0) + (me?.requests ?? 0);
}

/**
 * Done: "Post to friends" opens the compose sheet (caption and who sees it), then shows "Posted" with Edit and
 * Remove. With "Post every workout" on it posts straight away, to the lifter's usual audience.
 */
export function PostToFriends({ summary }: { summary: SessionSummary }) {
  const { events } = useApp();
  const me = useSocial((s) => s.me);
  const [postId, setPostId] = useState<string | null>(null);
  const [details, setDetails] = useState<(Omit<ComposeValue, "partners"> & { partners?: string[] }) | null>(null);
  const [compose, setCompose] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const p = me?.profile;
  const post = useCallback(
    async (extra: Partial<ComposeValue> = {}): Promise<string | null> => {
      if (!p) return null;
      try {
        setPostId(await postWorkout(events, summary, p.weights, extra));
        setDetails({ caption: extra.caption ?? "", audience: extra.audience ?? p.audience, partners: extra.partners ?? [] });
        setNote(null);
        track("feature", { name: "social_post", detail: p.autoPost ? "auto" : "tap" });
        return null;
      } catch (e) {
        return socialError(e);
      }
    },
    [events, summary, p],
  );
  // Already posted (from another device, or before a reload)? Ask once.
  useEffect(() => {
    if (!p) return;
    let live = true;
    social<{ posted: Record<string, string>; details?: Record<string, ComposeValue> }>("posted", {
      workoutIds: [summary.sessionId],
    })
      .then(async (r) => {
        if (!live) return;
        const id = r.posted[summary.sessionId];
        if (id) {
          setPostId(id);
          setDetails(r.details?.[summary.sessionId] ?? null);
        } else if (p.autoPost && !me?.suspended) {
          const err = await post();
          if (err && live) setNote(err);
        }
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
      setDetails(null);
    } catch (e) {
      oops();
      setNote(socialError(e));
    }
  };
  const edit = async (v: ComposeValue) => {
    try {
      const r = await social<{ caption: string; audience: Audience; partners: Partner[] }>("editPost", {
        workoutId: summary.sessionId,
        ...v,
      });
      setDetails({ caption: r.caption, audience: r.audience, partners: r.partners.map((x) => x.handle) });
      return null;
    } catch (e) {
      return socialError(e);
    }
  };
  return (
    <div className="mt-3">
      {postId ? (
        <div className="card flex items-center justify-between gap-2 py-1 pl-4 pr-1 text-left">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <Icon name="check" size={18} className="shrink-0 text-good" />
            <span className="min-w-0">
              {t("friends.posted")}
              {details && details.audience !== "all" ? ` · ${t(AUDIENCE_LABEL[details.audience])}` : ""}
            </span>
          </span>
          <span className="flex shrink-0">
            <Button kind="quiet" className="px-3 py-2 text-sm" onClick={() => setCompose(true)}>
              {t("friends.edit")}
            </Button>
            <Button kind="quiet" className="px-3 py-2 text-sm" onClick={() => void unpost()}>
              {t("friends.unpost")}
            </Button>
          </span>
        </div>
      ) : (
        <Button kind="ghost" icon="people" className="w-full" onClick={() => setCompose(true)}>
          {t("friends.postIt")}
        </Button>
      )}
      <Note text={note} />
      <ComposeSheet
        open={compose}
        onClose={() => setCompose(false)}
        title={postId ? t("friends.post.edit") : t("friends.postIt")}
        submit={postId ? t("friends.save") : t("friends.post.send")}
        caption={details?.caption ?? ""}
        audience={details?.audience ?? p.audience}
        partners={details?.partners ?? []}
        onSubmit={(v) => (postId ? edit(v) : post(v))}
      />
    </div>
  );
}
