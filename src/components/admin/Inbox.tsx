"use client";
// The admin Inbox tab (as in Gradelings): mail Resend received for getliftsmith.com, read live from Resend. A message
// opens in a sandboxed frame with remote images blocked until asked for, or as plain text; it can be answered as a
// plain-text reply, marked done or archived. Support staff can read; only admins change anything.
import { useEffect, useState } from "react";
import type { InboxItem, InboxMessage } from "@/server/inbox";
import { Card } from "./charts";
import { ago, when } from "./time";

type List = { configured: boolean; items: InboxItem[]; next: string | null; error?: string };
const post = async (body: Record<string, unknown>) => {
  const r = await fetch("/api/admin/inbox/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  return r.ok ? null : (j.error ?? "That didn't work.");
};
const waiting = (m: InboxItem) => !m.handledAt && !m.repliedAt && !m.archivedAt;

function Message({ id, admin, onChange, onClose }: { id: string; admin: boolean; onChange: () => void; onClose: () => void }) {
  const [m, setM] = useState<InboxMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plain, setPlain] = useState(false);
  const [images, setImages] = useState(false);
  const [reply, setReply] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    fetch(`/api/admin/inbox/?id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as { message?: InboxMessage; error?: string };
        if (!live) return;
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
  };
  const send = async () => {
    await act({ action: "reply", text: reply }, "Reply sent.");
    setReply("");
  };

  if (error) return <Card title="Message"><p className="text-sm text-bad">{error}</p></Card>;
  if (!m) return <Card title="Message"><p className="text-sm text-muted">Loading…</p></Card>;
  return (
    <Card
      title={m.subject}
      subtitle={`${m.from} · ${when(m.receivedAt)}${m.to.length ? ` · to ${m.to.join(", ")}` : ""}`}
      right={<button type="button" onClick={onClose} className="press text-sm text-muted underline">Close</button>}
    >
      <div className="mb-3 flex flex-wrap gap-2 text-sm">
        {m.hasHtml && (
          <button type="button" aria-pressed={plain} onClick={() => setPlain(!plain)} className="press rounded-lg border border-line px-3 py-1.5">
            {plain ? "Show formatted" : "Plain text"}
          </button>
        )}
        {m.hasHtml && !plain && m.remoteImages && !images && (
          <button type="button" onClick={() => setImages(true)} className="press rounded-lg border border-line px-3 py-1.5">Load images</button>
        )}
        {admin && (
          <>
            <button type="button" onClick={() => void act({ action: "handled", handled: !m.handledAt }, m.handledAt ? "Marked as waiting." : "Marked as done.")} className="press rounded-lg border border-line px-3 py-1.5">
              {m.handledAt ? "Mark as waiting" : "Mark as done"}
            </button>
            <button type="button" onClick={() => void act({ action: "archive", archived: !m.archivedAt }, m.archivedAt ? "Moved back to the inbox." : "Archived.")} className="press rounded-lg border border-line px-3 py-1.5">
              {m.archivedAt ? "Move to inbox" : "Archive"}
            </button>
          </>
        )}
      </div>
      {m.remoteImages && !images && !plain && <p className="mb-2 text-xs text-muted">Images from the internet are blocked, so the sender can&apos;t tell the mail was opened.</p>}
      {m.hasHtml && !plain ? (
        <iframe
          key={`${id}-${images}`}
          title={`Message: ${m.subject}`}
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          src={`/api/admin/inbox/view/?id=${encodeURIComponent(id)}${images ? "&images=1" : ""}`}
          className="h-[28rem] w-full rounded-xl border border-line bg-white"
        />
      ) : (
        <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl border border-line p-3 font-sans text-sm">{m.text || "(No text.)"}</pre>
      )}
      {m.attachmentNames.length > 0 && <p className="mt-2 text-xs text-muted">Attachments (open them in Resend): {m.attachmentNames.join(", ")}</p>}
      {m.repliedAt && <p className="mt-2 text-xs text-good">Answered by {m.repliedBy} {ago(m.repliedAt)}.</p>}
      {admin && (
        <div className="mt-4">
          <label htmlFor="inbox-reply" className="text-sm font-semibold">Reply to {m.replyTo}</label>
          <textarea id="inbox-reply" value={reply} onChange={(e) => setReply(e.target.value)} rows={6} className="card mt-1 w-full px-3 py-2 text-sm" placeholder="Plain text. A blank line starts a new paragraph." />
          <button type="button" disabled={!reply.trim()} onClick={() => void send()} className="press mt-2 rounded-xl bg-accent px-4 py-2 font-semibold text-accent-ink disabled:opacity-50">Send reply</button>
        </div>
      )}
      {msg && <p role="status" className="mt-2 text-sm text-muted">{msg}</p>}
    </Card>
  );
}

export function Inbox({ admin, onCount }: { admin: boolean; onCount?: (n: number) => void }) {
  const [view, setView] = useState<"inbox" | "archived">("inbox");
  const [list, setList] = useState<List | null>(null);
  const [more, setMore] = useState<InboxItem[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
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

  if (!list) return <p className="text-muted">Loading…</p>;
  if (!list.configured)
    return (
      <Card title="Inbox isn't set up yet" subtitle="Mail to any address @getliftsmith.com already reaches Resend; the panel needs a key that can read it.">
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>In Resend › API Keys, create a key with <b>Full access</b> (the sending key can&apos;t read received mail).</li>
          <li>In Vercel › liftsmith › Settings › Environment Variables, add it as <code>RESEND_INBOX_API_KEY</code> for Production.</li>
          <li>Redeploy production, then open this tab again.</li>
        </ol>
      </Card>
    );
  const shown = all.filter((m) => (view === "archived" ? m.archivedAt : !m.archivedAt));
  return (
    <div className="space-y-4">
      {list.error && <p className="text-sm text-bad" role="alert">{list.error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {(["inbox", "archived"] as const).map((v) => (
          <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`press rounded-full border px-3 py-1.5 text-sm ${view === v ? "border-accent bg-accent/15" : "border-line text-muted"}`}>
            {v === "inbox" ? `Inbox (${waitingCount} waiting)` : "Archived"}
          </button>
        ))}
        <button type="button" onClick={() => setVersion((v) => v + 1)} className="press ml-auto text-sm text-muted underline">Refresh</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card title={view === "inbox" ? "Mail" : "Archived mail"} subtitle="Mail to @getliftsmith.com, newest first. In-app feedback arrives here too.">
          {shown.length ? (
            <ul className="divide-y divide-line/60">
              {shown.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => setOpen(m.id)} aria-current={open === m.id ? "true" : undefined} className={`press w-full px-2 py-2 text-left ${open === m.id ? "bg-raised" : ""}`}>
                    <span className="flex items-center gap-2 text-sm">
                      {waiting(m) && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Waiting" />}
                      <span className={`truncate ${waiting(m) ? "font-semibold" : ""}`}>{m.from.replace(/<[^>]*>/, "").trim() || m.fromEmail}</span>
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
            <p className="text-sm text-muted">{view === "inbox" ? "No mail yet." : "Nothing archived."}</p>
          )}
          {next && <button type="button" onClick={() => void loadMore()} className="press mt-3 text-sm text-accent underline">Load older mail</button>}
        </Card>
        {open ? <Message key={open} id={open} admin={admin} onChange={() => setVersion((v) => v + 1)} onClose={() => setOpen(null)} /> : <p className="hidden text-sm text-muted lg:block">Pick a message to read it.</p>}
      </div>
    </div>
  );
}
