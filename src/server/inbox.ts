// The admin Inbox (modelled on Gradelings' src/server/inbox.ts): mail people send to an address on our domain,
// which Resend receives. The panel reads it live from Resend's receiving API, so message bodies are never copied
// into our database; we only keep whether an admin has dealt with, answered or archived each one (inbox_state).
//
// One Resend account receives for several domains (Gradelings too), so only mail addressed to our own domain
// (INBOX_DOMAINS, default getliftsmith.com) is listed or opened here.
import { query, run } from "./db";
import { hasRemoteImages } from "./emailHtml";

const DAY = 86_400_000;
const PAGE = 100;
/** Resend pages read at most for one list, so a busy other domain can't make the panel slow. */
const MAX_PAGES = 5;

const base = () => (process.env.RESEND_API_BASE ?? "https://api.resend.com").replace(/\/$/, "");
/** Reading received mail needs a full-access key; `RESEND_API_KEY` is a sending-only key, so a separate one may be set. */
export const readKey = () => (process.env.RESEND_INBOX_API_KEY || process.env.RESEND_API_KEY || "").trim();
const sendKey = () => (process.env.RESEND_API_KEY || process.env.RESEND_INBOX_API_KEY || "").trim();
export const inboxConfigured = () => Boolean(readKey());

/** The domains whose mail this panel shows. */
export function inboxDomains(): string[] {
  const set = (process.env.INBOX_DOMAINS ?? "getliftsmith.com")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
  return set.length ? set : ["getliftsmith.com"];
}

export class InboxError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function resend<T>(path: string, f: typeof fetch = fetch): Promise<T> {
  let res: Response;
  try {
    res = await f(`${base()}${path}`, {
      headers: { authorization: `Bearer ${readKey()}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new InboxError("Couldn't reach Resend.", 502);
  }
  if (res.status === 401 || res.status === 403)
    throw new InboxError(
      "Resend refused the API key. Reading received mail needs a full-access key: set RESEND_INBOX_API_KEY (see AGENTS.md, Admin inbox).",
      502,
    );
  if (res.status === 404) throw new InboxError("Resend has no such message.", 404);
  if (!res.ok) throw new InboxError(`Resend answered ${res.status}.`, 502);
  return (await res.json()) as T;
}

interface ResendReceived {
  id: string;
  from: string;
  to?: string[];
  cc?: string[];
  subject?: string | null;
  created_at: string;
  reply_to?: string[] | null;
  message_id?: string;
  text?: string | null;
  html?: string | null;
  attachments?: { filename?: string; size?: number }[];
}

export interface InboxItem {
  id: string;
  from: string;
  fromEmail: string;
  to: string[];
  subject: string;
  receivedAt: number;
  attachments: number;
  handledAt: number | null;
  repliedAt: number | null;
  repliedBy: string | null;
  archivedAt: number | null;
}

/** "Pat <pat@example.com>" → "pat@example.com". */
export function addressOf(from: string): string {
  const m = /<([^>]+)>/.exec(from);
  return (m ? m[1] : from).trim().toLowerCase();
}

/** Whether a received message was addressed to one of our domains. */
export function isOurs(m: Pick<ResendReceived, "to" | "cc">, domains = inboxDomains()): boolean {
  return [...(m.to ?? []), ...(m.cc ?? [])].some((a) => domains.some((d) => addressOf(a).endsWith(`@${d}`)));
}

async function enrich(items: ResendReceived[]): Promise<InboxItem[]> {
  if (!items.length) return [];
  const ids = items.map((i) => i.id);
  const marks = ids.map(() => "?").join(", ");
  const states = await query<{
    email_id: string;
    handled_at: number | null;
    replied_at: number | null;
    replied_by: string | null;
    archived_at: number | null;
  }>(`SELECT email_id, handled_at, replied_at, replied_by, archived_at FROM inbox_state WHERE email_id IN (${marks})`, ids);
  const state = new Map(states.map((s) => [String(s.email_id), s]));
  const num = (v: unknown) => (v == null ? null : Number(v));
  return items.map((i) => {
    const s = state.get(i.id);
    return {
      id: i.id,
      from: i.from,
      fromEmail: addressOf(i.from),
      to: i.to ?? [],
      subject: i.subject?.trim() || "(no subject)",
      receivedAt: Date.parse(i.created_at) || 0,
      attachments: i.attachments?.length ?? 0,
      handledAt: num(s?.handled_at),
      repliedAt: num(s?.replied_at),
      repliedBy: s?.replied_by == null ? null : String(s.replied_by),
      archivedAt: num(s?.archived_at),
    };
  });
}

/** The newest mail to our domain, up to `limit`, a Resend page at a time. `after` continues from a Resend id. */
export async function listInbox(
  opts: { limit?: number; after?: string } = {},
  f: typeof fetch = fetch,
): Promise<{ items: InboxItem[]; next: string | null }> {
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const ours: ResendReceived[] = [];
  let after = opts.after;
  let more = true;
  for (let page = 0; page < MAX_PAGES && more && ours.length < limit; page++) {
    const q = new URLSearchParams({ limit: String(PAGE) });
    if (after) q.set("after", after);
    const res = await resend<{ data?: ResendReceived[]; has_more?: boolean }>(`/emails/receiving?${q}`, f);
    const data = res.data ?? [];
    for (const m of data) {
      after = m.id;
      if (isOurs(m)) ours.push(m);
      if (ours.length >= limit) break;
    }
    more = Boolean(res.has_more) && data.length > 0;
  }
  return { items: await enrich(ours), next: more || ours.length >= limit ? (after ?? null) : null };
}

/** Mail nobody has answered, marked done or archived yet. */
export const isWaiting = (m: Pick<InboxItem, "handledAt" | "repliedAt" | "archivedAt">) => !m.handledAt && !m.repliedAt && !m.archivedAt;

/** Mail from our own domain (sign-in links, feedback copies) is never "waiting": nobody needs to answer it. */
export const fromUs = (m: Pick<InboxItem, "fromEmail">, domains = inboxDomains()) => domains.some((d) => m.fromEmail.endsWith(`@${d}`));

/** Mail from someone else in the last two weeks that is still waiting: the Inbox tab's count and the to-do list. */
export async function waitingMail(now = Date.now(), f: typeof fetch = fetch): Promise<InboxItem[]> {
  const { items } = await listInbox({ limit: 50 }, f);
  return items.filter((m) => isWaiting(m) && !fromUs(m) && m.receivedAt >= now - 14 * DAY);
}

/** Turns an HTML email into plain text, for the "Plain text" view. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface InboxMessage extends InboxItem {
  text: string;
  /** The mail has an HTML part, shown sanitized in a sandboxed frame (`/api/admin/inbox/view/`). */
  hasHtml: boolean;
  /** Its HTML would load images from the internet, which stay blocked until the admin asks. */
  remoteImages: boolean;
  replyTo: string;
  messageId: string | null;
  attachmentNames: string[];
}

async function received(id: string, f: typeof fetch = fetch): Promise<ResendReceived> {
  const m = await resend<ResendReceived>(`/emails/receiving/${encodeURIComponent(id)}`, f);
  // Another domain's mail in the same Resend account stays out of this panel.
  if (!isOurs(m)) throw new InboxError("Resend has no such message.", 404);
  return m;
}

export async function getInboxMessage(id: string, f: typeof fetch = fetch): Promise<InboxMessage> {
  const m = await received(id, f);
  const [item] = await enrich([m]);
  return {
    ...item,
    text: (m.text?.trim() || htmlToText(m.html ?? "")).slice(0, 50_000),
    hasHtml: Boolean(m.html?.trim()),
    remoteImages: hasRemoteImages(m.html ?? ""),
    replyTo: addressOf(m.reply_to?.[0] ?? m.from),
    messageId: m.message_id ?? null,
    attachmentNames: (m.attachments ?? []).map((a) => a.filename ?? "attachment"),
  };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** A received email's raw HTML, for `sanitizeEmailHtml`; its text part, escaped, when it has no HTML. */
export async function getInboxHtml(id: string, f: typeof fetch = fetch): Promise<string> {
  const m = await received(id, f);
  if (m.html?.trim()) return m.html;
  return `<pre style="white-space:pre-wrap;font-family:inherit">${esc(m.text ?? "")}</pre>`;
}

export async function markHandled(id: string, handled: boolean, now = Date.now()): Promise<void> {
  await run(
    "INSERT INTO inbox_state (email_id, handled_at) VALUES (?, ?) ON CONFLICT (email_id) DO UPDATE SET handled_at = excluded.handled_at",
    [id, handled ? now : null],
  );
}

/** Archiving moves a message out of the Inbox list into Archived; it stays in Resend either way. */
export async function markArchived(id: string, archived: boolean, now = Date.now()): Promise<void> {
  await run(
    "INSERT INTO inbox_state (email_id, archived_at) VALUES (?, ?) ON CONFLICT (email_id) DO UPDATE SET archived_at = excluded.archived_at",
    [id, archived ? now : null],
  );
}

/** The sender replies come from: the feedback or mail sender, on our verified domain. */
export const replyFrom = () =>
  process.env.FEEDBACK_FROM || process.env.MAIL_FROM || process.env.ADMIN_FROM || "Liftsmith <hello@getliftsmith.com>";

/** Answers a received email as a threaded plain-text reply, and marks it answered. */
export async function replyToInbox(id: string, text: string, admin: string, f: typeof fetch = fetch, now = Date.now()): Promise<boolean> {
  const m = await getInboxMessage(id, f);
  const subject = /^re:/i.test(m.subject) ? m.subject : `Re: ${m.subject === "(no subject)" ? "Liftsmith" : m.subject}`;
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const r = await f(`${base()}/emails`, {
    method: "POST",
    headers: { authorization: `Bearer ${sendKey()}`, "content-type": "application/json", "idempotency-key": `inbox-reply-${id}-${now}` },
    body: JSON.stringify({
      from: replyFrom(),
      to: [m.replyTo],
      subject,
      text,
      html: `<!doctype html><html><body style="font-family:system-ui,Segoe UI,Arial,sans-serif;color:#1d2233;line-height:1.55">${paras.map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("")}</body></html>`,
      ...(m.messageId ? { headers: { "In-Reply-To": m.messageId, References: m.messageId } } : {}),
    }),
  }).catch(() => null);
  if (!r?.ok) return false;
  await run(
    "INSERT INTO inbox_state (email_id, handled_at, replied_at, replied_by) VALUES (?, ?, ?, ?) ON CONFLICT (email_id) DO UPDATE SET handled_at = excluded.handled_at, replied_at = excluded.replied_at, replied_by = excluded.replied_by",
    [id, now, now, admin],
  );
  return true;
}
