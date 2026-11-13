"use client";

// The admin Inbox tab (as in Gradelings): mail Resend received for getliftsmith.com, read live from Resend. A message
// opens in a sandboxed frame with remote images blocked until asked for, or as plain text; it can be answered as a
// plain-text reply (from a saved reply, or a first draft by Claude that only fills the box), marked done or
// archived. Support staff can read; only admins change anything.
import { useEffect, useState } from "react";

import { fillReply, type SavedReply } from "@/lib/savedReplies";
import type { InboxItem, InboxMessage } from "@/server/inbox";

import { Card } from "./charts";
import { SavedReplies } from "./SavedReplies";
import { InboxBones, LineBones, Loading } from "./Skeletons";
import { ago, when } from "./time";

type List = { configured: boolean; items: InboxItem[]; next: string | null; error?: string };
const post = async (body: Record<string, unknown>) => {
  const r = await fetch("/api/admin/inbox/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  return r.ok ? null : (j.error ?? "That didn't work.");
};
const waiting = (m: InboxItem) => !m.handledAt && !m.repliedAt && !m.archivedAt;
/** True while the person is typing in a field, so single-letter keys are left alone. */
const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
type Folder = "waiting" | "inbox" | "archived";
const FOLDER_LABEL: Record<Folder, string> = { waiting: "Waiting", inbox: "Everything", archived: "Archived" };
/** Mail in a folder that matches a search on the sender or subject. */
export function inFolder(items: InboxItem[], folder: Folder, search: string): InboxItem[] {
  const q = search.trim().toLowerCase();
  return items.filter(
    (m) =>
      (folder === "archived" ? !!m.archivedAt : folder === "waiting" ? waiting(m) : !m.archivedAt) &&
      (!q || `${m.from} ${m.fromEmail} ${m.subject}`.toLowerCase().includes(q)),
  );
}

function Message({
  id,
  admin,
  onChange,
  onClose,
  onNext,
}: {
  id: string;
  admin: boolean;
  onChange: () => void;
  onClose: () => void;
  /** Opens the next message in the list, after "Archive and next" or "Done and next". */
  onNext?: () => void;
}) {
  const [m, setM] = useState<InboxMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plain, setPlain] = useState(false);
  const [images, setImages] = useState(false);
  const [reply, setReply] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [canDraft, setCanDraft] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [replies, setReplies] = useState<SavedReply[]>([]);
  useEffect(() => {
    if (!admin) return;
    let live = true;
    fetch("/api/admin/replies/")
      .then(async (r) => r.ok && live && setReplies(((await r.json()) as { replies: SavedReply[] }).replies))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [admin]);
  useEffect(() => {
    let live = true;
    fetch(`/api/admin/inbox/?id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as { message?: InboxMessage; canDraft?: boolean; error?: string };
        if (!live) return;
        setCanDraft(j.canDraft === true);
        if (j.message) setM(j.message);
        else setError(j.error ?? "The message didn't load.");
      })
      .catch(() => live && setError("The message didn't load."));
    return () => {
      live = false;
    };
  }, [id, version]);

  const act = async (body: Record<string, unknown>, done: string) => {
    setMsg("Working…");
    const err = await post({ id, ...body });
    setMsg(err ?? done);
    if (!err) {
      setVersion((v) => v + 1);
      onChange();
    }
    return !err;
  };
  const thenNext = async (body: Record<string, unknown>, done: string) => {
    if ((await act(body, done)) && onNext) onNext();
  };
  // Keys while reading (not while typing): e archives and opens the next, d marks done and opens the next,
  // r jumps to the reply box.
  useEffect(() => {
    if (!m) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      if (admin && e.key === "e" && !m.archivedAt) {
        e.preventDefault();
        void thenNext({ action: "archive", archived: true }, "Archived.");
      } else if (admin && e.key === "d" && !m.handledAt) {
        e.preventDefault();
        void thenNext({ action: "handled", handled: true }, "Marked as done.");
      } else if (admin && e.key === "r") {
        e.preventDefault();
        document.getElementById("inbox-reply")?.focus();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });
  const draft = async () => {
    setDrafting(true);
    setMsg("Drafting…");
    const r = await fetch("/api/admin/inbox/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "draft", id }),
    }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { draft?: string; error?: string } | undefined;
    setDrafting(false);
    if (r?.ok && j?.draft) {
      setReply(j.draft);
      setMsg("Draft ready. Read it and change anything before sending.");
    } else setMsg(j?.error ?? "The draft didn't work.");
  };
  const insert = (rid: string) => {
    const r = replies.find((x) => x.id === rid);
    if (r) setReply((cur) => (cur.trim() ? `${cur.trimEnd()}\n\n${fillReply(r.body)}` : fillReply(r.body)));
  };
  const send = async () => {
    await act({ action: "reply", text: reply }, "Reply sent.");
    setReply("");
  };

  if (error)
    return (
      <Card title="Message">
        <p className="text-sm text-bad">{error}</p>
      </Card>
    );
  if (!m)
    return (
      <Card title="Message">
        <Loading label="Loading message">
          <LineBones n={6} />
        </Loading>
      </Card>
    );
  return (
    <Card
      title={m.subject}
      subtitle={`${m.from} · ${when(m.receivedAt)}${m.to.length ? ` · to ${m.to.join(", ")}` : ""}`}
      right={
        <button type="button" onClick={onClose} className="press text-sm text-muted underline">
          Close
        </button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2 text-sm">
        {m.hasHtml && (
          <button
            type="button"
            aria-pressed={plain}
            onClick={() => setPlain(!plain)}
            className="press rounded-lg border border-line px-3 py-1.5"
          >
            {plain ? "Show formatted" : "Plain text"}
          </button>
        )}
        {m.hasHtml && !plain && m.remoteImages && !images && (
          <button type="button" onClick={() => setImages(true)} className="press rounded-lg border border-line px-3 py-1.5">
            Load images
          </button>
        )}
        {admin && (
          <>
            {!m.archivedAt && onNext && (
              <button
                type="button"
                title="Key: e"
                onClick={() => void thenNext({ action: "archive", archived: true }, "Archived.")}
                className="press rounded-lg bg-accent px-3 py-1.5 font-semibold text-accent-ink"
              >
                Archive and next
              </button>
            )}
            {!m.handledAt && onNext && (
              <button
                type="button"
                title="Key: d"
                onClick={() => void thenNext({ action: "handled", handled: true }, "Marked as done.")}
                className="press rounded-lg border border-line px-3 py-1.5"
              >
                Done and next
              </button>
            )}
            <button
              type="button"
              onClick={() => void act({ action: "handled", handled: !m.handledAt }, m.handledAt ? "Marked as waiting." : "Marked as done.")}
              className="press rounded-lg border border-line px-3 py-1.5"
            >
              {m.handledAt ? "Mark as waiting" : "Mark as done"}
            </button>
            <button
              type="button"
              onClick={() =>
                void act({ action: "archive", archived: !m.archivedAt }, m.archivedAt ? "Moved back to the inbox." : "Archived.")
              }
              className="press rounded-lg border border-line px-3 py-1.5"
            >
              {m.archivedAt ? "Move to inbox" : "Archive"}
            </button>
          </>
        )}
      </div>
      {m.remoteImages && !images && !plain && (
        <p className="mb-2 text-xs text-muted">Images from the internet are blocked, so the sender can&apos;t tell the mail was opened.</p>
      )}
      {m.hasHtml && !plain ? (
        <iframe
          key={`${id}-${images}`}
          title={`Message: ${m.subject}`}
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          src={`/api/admin/inbox/view/?id=${encodeURIComponent(id)}${images ? "&images=1" : ""}`}
          className="h-[28rem] w-full rounded-xl border border-line bg-white"
        />
      ) : (
        <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl border border-line p-3 font-sans text-sm">
          {m.text || "(No text.)"}
        </pre>
      )}
      {m.attachmentNames.length > 0 && (
        <p className="mt-2 text-xs text-muted">Attachments (open them in Resend): {m.attachmentNames.join(", ")}</p>
      )}
      {m.repliedAt && (
        <p className="mt-2 text-xs text-good">
          Answered by {m.repliedBy} {ago(m.repliedAt)}.
        </p>
      )}
      {admin && (
        <div className="mt-4">
          <label htmlFor="inbox-reply" className="text-sm font-semibold">
            Reply to {m.replyTo}
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            {replies.length > 0 && (
              <select aria-label="Insert a saved reply" value="" onChange={(e) => insert(e.target.value)} className="card px-2 py-1.5">
                <option value="">Insert a saved reply…</option>
                {replies.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            )}
            {canDraft && (
              <button
                type="button"
                disabled={drafting}
                onClick={() => void draft()}
                className="press rounded-lg border border-line px-3 py-1.5 disabled:opacity-50"
              >
                Draft with AI
              </button>
            )}
          </div>
          <textarea
            id="inbox-reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={6}
            className="card mt-1 w-full px-3 py-2 text-sm"
            placeholder="Plain text. A blank line starts a new paragraph."
          />
          <button
            type="button"
            disabled={!reply.trim()}
            onClick={() => void send()}
            className="press mt-2 rounded-xl bg-accent px-4 py-2 font-semibold text-accent-ink disabled:opacity-50"
          >
            Send reply
          </button>
        </div>
      )}
      {msg && (
        <p role="status" className="mt-2 text-sm text-muted">
          {msg}
        </p>
      )}
    </Card>
  );
}

export function Inbox({
  admin,
  onCount,
  open = null,
  setOpen = () => {},
}: {
  admin: boolean;
  onCount?: (n: number) => void;
  /** The open message, kept in the address (?tab=Inbox&open=<id>) so a link or a reload lands on it. */
  open?: string | null;
  setOpen?: (id: string | null) => void;
}) {
  const [view, setView] = useState<Folder>("waiting");
  const [search, setSearch] = useState("");
  const [list, setList] = useState<List | null>(null);
  const [more, setMore] = useState<InboxItem[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    fetch("/api/admin/inbox/")
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as List;
        if (!live) return;
        if (!r.ok) return setList({ configured: true, items: [], next: null, error: j.error ?? "The inbox didn't load." });
        setList(j);
        setMore([]);
        setNext(j.next);
      })
      .catch(() => live && setList({ configured: true, items: [], next: null, error: "The inbox didn't load." }));
    return () => {
      live = false;
    };
  }, [version]);
  const all = [...(list?.items ?? []), ...more];
  const waitingCount = all.filter(waiting).length;
  const configured = list?.configured;
  useEffect(() => {
    if (configured) onCount?.(waitingCount);
  }, [configured, waitingCount, onCount]);
  const loadMore = async () => {
    if (!next) return;
    const r = await fetch(`/api/admin/inbox/?after=${encodeURIComponent(next)}`);
    const j = (await r.json().catch(() => ({}))) as List;
    if (r.ok) {
      setMore((x) => [...x, ...j.items]);
      setNext(j.next);
    }
  };

  if (!list)
    return (
      <Loading label="Loading mail">
        <InboxBones />
      </Loading>
    );
  if (!list.configured)
    return (
      <Card
        title="Inbox isn't set up yet"
        subtitle="Mail to any address @getliftsmith.com already reaches Resend; the panel needs a key that can read it."
      >
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>
            In Resend › API Keys, create a key with <b>Full access</b> (the sending key can&apos;t read received mail).
          </li>
          <li>
            In Vercel › liftsmith › Settings › Environment Variables, add it as <code>RESEND_INBOX_API_KEY</code> for Production.
          </li>
          <li>Redeploy production, then open this tab again.</li>
        </ol>
      </Card>
    );
  const shown = inFolder(all, view, search);
  const at = open ? shown.findIndex((m) => m.id === open) : -1;
  // After archiving or marking done, the message may leave the list, so "next" is the one after it in the list
  // as it was, or the first still shown.
  const after = (id: string) => {
    const i = shown.findIndex((m) => m.id === id);
    const rest = shown.filter((m) => m.id !== id);
    setOpen(rest[Math.max(0, i)]?.id ?? null);
  };
  return (
    <div className="space-y-4">
      {list.error && (
        <p className="text-sm text-bad" role="alert">
          {list.error}
        </p>
      )}
      <InboxKeys shown={shown} at={at} setOpen={setOpen} />
      <div className="flex flex-wrap items-center gap-2">
        {(["waiting", "inbox", "archived"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={`press rounded-full border px-3 py-1.5 text-sm ${view === v ? "border-accent bg-accent/15" : "border-line text-muted"}`}
          >
            {FOLDER_LABEL[v]}
            {v === "waiting" ? ` (${waitingCount})` : ""}
          </button>
        ))}
        <label htmlFor="inbox-search" className="sr-only">
          Search mail
        </label>
        <input
          id="inbox-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sender or subject  /"
          className="card w-full px-3 py-1.5 text-sm sm:w-64"
        />
        <button type="button" onClick={() => setVersion((v) => v + 1)} className="press ml-auto text-sm text-muted underline">
          Refresh
        </button>
      </div>
      <p className="hidden text-xs text-faint md:block">
        Keys: j and k move through the list, e archives and opens the next, d marks done and opens the next, r replies, / searches, Esc
        closes.
      </p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card
          title={view === "archived" ? "Archived mail" : view === "waiting" ? "Waiting for an answer" : "Mail"}
          subtitle="Mail to @getliftsmith.com, newest first. In-app feedback arrives here too."
        >
          {shown.length ? (
            <ul className="divide-y divide-line/60">
              {shown.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(m.id)}
                    aria-current={open === m.id ? "true" : undefined}
                    className={`press w-full px-2 py-2 text-left ${open === m.id ? "bg-raised" : ""}`}
                  >
                    <span className="flex items-center gap-2 text-sm">
                      {waiting(m) && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Waiting" />}
                      <span className={`truncate ${waiting(m) ? "font-semibold" : ""}`}>
                        {m.from.replace(/<[^>]*>/, "").trim() || m.fromEmail}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-muted">{ago(m.receivedAt)}</span>
                    </span>
                    <span className="block truncate text-sm text-muted">
                      {m.subject}
                      {m.repliedAt ? " · answered" : m.handledAt ? " · done" : ""}
                      {m.attachments ? ` · ${m.attachments} attachment${m.attachments === 1 ? "" : "s"}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              {search
                ? "Nothing matches."
                : view === "waiting"
                  ? "Nothing waiting. All caught up."
                  : view === "inbox"
                    ? "No mail yet."
                    : "Nothing archived."}
            </p>
          )}
          {next && (
            <button type="button" onClick={() => void loadMore()} className="press mt-3 text-sm text-accent underline">
              Load older mail
            </button>
          )}
        </Card>
        {open ? (
          <Message
            key={open}
            id={open}
            admin={admin}
            onChange={() => setVersion((v) => v + 1)}
            onClose={() => setOpen(null)}
            onNext={() => after(open)}
          />
        ) : (
          <p className="hidden text-sm text-muted lg:block">Pick a message to read it.</p>
        )}
      </div>
      {admin && <SavedReplies />}
    </div>
  );
}

/** j and k step through the list, / goes to the search box, Esc closes the open message. Not while typing. */
function InboxKeys({ shown, at, setOpen }: { shown: InboxItem[]; at: number; setOpen: (id: string | null) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape" && at >= 0) return setOpen(null);
      if (typing(e.target)) return;
      if (e.key === "j" || e.key === "k") {
        e.preventDefault();
        const i = at < 0 ? 0 : Math.min(shown.length - 1, Math.max(0, at + (e.key === "j" ? 1 : -1)));
        const m = shown[i];
        if (m) setOpen(m.id);
      } else if (e.key === "/") {
        e.preventDefault();
        document.getElementById("inbox-search")?.focus();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [shown, at, setOpen]);
  return null;
}
