"use client";

// A post's comments (docs/decisions/friends.md): replies one level deep, @mentions that link to the person and
// tell them, and the people to mention offered as chips as soon as "@" is typed, so names are tapped, not typed.
// Friends gap list 2, item 5 (Melvin, 2026-11-12).
import { Fragment, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import { threaded } from "@/lib/commentThread";
import { t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { social, socialError } from "@/lib/social";
import { SOCIAL_LIMITS, type FeedComment, type FeedPost, type PersonRow } from "@/lib/socialTypes";

import { Avatar } from "./AvatarFace";
import { ago } from "./format";
import { PersonLine } from "./FriendsFind";
import { Icon } from "./icons";
import { go } from "./router";
import { Button, Sheet, Skeleton } from "./ui";

/** A comment's text with each @handle as a link to that person. */
export function withMentions(body: string): ReactNode[] {
  const parts = body.split(/((?:^|(?<=[^\w@]))@[a-z0-9_]{3,20}(?!\w))/gi);
  return parts.map((part, i) =>
    /^@[a-z0-9_]{3,20}$/i.test(part) ? (
      <button key={i} type="button" className="press font-medium text-accent" onClick={() => go("person", part.slice(1).toLowerCase())}>
        {part}
      </button>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** The word being typed when it starts with @, or null. */
export function mentionQuery(text: string): string | null {
  const m = /(?:^|\s)@([a-z0-9_]{0,20})$/i.exec(text);
  return m ? m[1]!.toLowerCase() : null;
}

export { threaded };

export function CommentsSheet(props: {
  post: FeedPost | null;
  onClose: () => void;
  onCount: (n: number) => void;
  onReport: (commentId: string) => void;
}) {
  return props.post ? <CommentsBody key={props.post.id} {...props} post={props.post} /> : null;
}

function CommentsBody({
  post,
  onClose,
  onCount,
  onReport,
}: {
  post: FeedPost;
  onClose: () => void;
  onCount: (n: number) => void;
  onReport: (commentId: string) => void;
}) {
  const [comments, setComments] = useState<FeedComment[] | null>(null);
  const [friends, setFriends] = useState<PersonRow[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const id = post.id;
  useEffect(() => {
    let live = true;
    social<{ comments: FeedComment[] }>("thread", { id })
      .then((r) => live && setComments(r.comments))
      .catch((e: unknown) => live && (setComments([]), setNote(socialError(e))));
    // People the lifter follows, to offer when they type "@".
    social<{ people: PersonRow[] }>("people", { list: "following" })
      .then((r) => live && setFriends(r.people))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [id]);
  const q = mentionQuery(text);
  const offers = useMemo(() => {
    if (q === null) return [];
    // The poster and everyone in the thread first, then people the lifter follows.
    const seen = new Map<string, PersonRow>();
    for (const p of [{ handle: post.handle, name: post.name, avatar: post.avatar }, ...(comments ?? []), ...friends])
      if (!seen.has(p.handle)) seen.set(p.handle, { handle: p.handle, name: p.name, avatar: p.avatar });
    return [...seen.values()].filter((p) => p.handle.startsWith(q) || p.name.toLowerCase().startsWith(q)).slice(0, 6);
  }, [q, comments, friends, post.handle, post.name, post.avatar]);
  const mention = (p: PersonRow) => {
    haptic("select");
    setText((v) => `${v.replace(/@[a-z0-9_]*$/i, "")}@${p.handle} `);
    document.getElementById("fr-comment")?.focus();
  };
  const reply = (c: FeedComment) => {
    haptic("select");
    setReplyTo(c);
    setText((v) => (v.trim() ? v : c.mine ? "" : `@${c.handle} `));
    document.getElementById("fr-comment")?.focus();
  };
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const r = await social<{ comment: FeedComment }>("comment", { id, text, ...(replyTo ? { replyTo: replyTo.id } : {}) });
      const next = [...(comments ?? []), r.comment];
      setComments(next);
      onCount(next.length);
      setText("");
      setReplyTo(null);
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
          {threaded(comments).map(({ c, reply: isReply }) => (
            <li key={c.id} className={`flex items-start gap-3 ${isReply ? "ml-10" : ""}`}>
              <Avatar name={c.name} avatar={c.avatar} size={isReply ? 28 : 32} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <button type="button" className="press font-semibold" onClick={() => go("person", c.handle)}>
                    {c.name}
                  </button>{" "}
                  <span className="text-xs text-muted">{ago(c.at)}</span>
                </p>
                <p className="break-words text-sm">{withMentions(c.body)}</p>
                <button
                  type="button"
                  onClick={() => reply(c)}
                  aria-label={t("social.replyTo", { name: c.name })}
                  className="press -ml-1 mt-0.5 min-h-11 rounded-lg px-1 text-xs font-medium text-muted hover:text-ink"
                >
                  {t("social.reply")}
                </button>
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
                  onClick={() => onReport(c.id)}
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
      {replyTo && (
        <p className="mt-4 flex items-center justify-between gap-2 text-sm text-muted">
          <span className="min-w-0 truncate">{t("social.replying", { name: replyTo.name })}</span>
          <Button kind="quiet" className="px-3 py-2 text-sm" onClick={() => setReplyTo(null)}>
            {t("social.replyCancel")}
          </Button>
        </p>
      )}
      {offers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t("social.mention")}>
          {offers.map((p) => (
            <button
              key={p.handle}
              type="button"
              onClick={() => mention(p)}
              className="press inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-sm"
            >
              <Avatar name={p.name} avatar={p.avatar} size={28} />
              {p.name}
            </button>
          ))}
        </div>
      )}
      <form className={`${replyTo || offers.length ? "mt-2" : "mt-4"} flex gap-2`} onSubmit={(e) => void send(e)}>
        <label htmlFor="fr-comment" className="sr-only">
          {replyTo ? t("social.replying", { name: replyTo.name }) : t("friends.comments.add")}
        </label>
        <input
          id="fr-comment"
          value={text}
          maxLength={SOCIAL_LIMITS.comment}
          onChange={(e) => setText(e.target.value)}
          placeholder={replyTo ? t("social.reply") : t("friends.comments.add")}
          className="card min-w-0 flex-1 px-4 py-3"
          enterKeyHint="send"
          autoCapitalize="sentences"
        />
        <Button submit disabled={busy || !text.trim()}>
          {t("friends.comments.send")}
        </Button>
      </form>
      <p className="mt-1 px-1 text-xs text-muted">{t("social.mentionHint")}</p>
      {note && (
        <p role="status" className="mt-2 text-sm text-muted">
          {note}
        </p>
      )}
    </Sheet>
  );
}

/** Who liked a post, opened from its like count. */
export function LikersSheet({ postId, onClose }: { postId: string | null; onClose: () => void }) {
  return (
    <Sheet open={!!postId} onClose={onClose} title={t("social.likersTitle")}>
      {postId && <Likers id={postId} />}
    </Sheet>
  );
}

function Likers({ id }: { id: string }) {
  const [rows, setRows] = useState<PersonRow[] | null>(null);
  useEffect(() => {
    let live = true;
    social<{ people: PersonRow[] }>("likers", { id })
      .then((r) => live && setRows(r.people ?? []))
      .catch(() => live && setRows([]));
    return () => {
      live = false;
    };
  }, [id]);
  if (rows === null) return <Skeleton className="h-16" />;
  return (
    <ul className="card divide-y divide-line">
      {rows.map((p) => (
        <PersonLine key={p.handle} p={p} />
      ))}
      {!rows.length && <li className="px-4 py-3 text-sm text-muted">{t("social.listNone")}</li>}
    </ul>
  );
}
