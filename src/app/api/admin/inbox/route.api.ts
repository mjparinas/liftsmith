// The admin Inbox (src/server/inbox.ts): mail Resend received for our domain. GET `?id=` opens one message,
// `?count=1` says how many are waiting (the tab's count), otherwise a page of the newest (`?after=` continues).
// POST `{ action: "handled" | "archive" | "reply", id, ... }`; changes need an admin and are audited.
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import {
  getInboxMessage,
  inboxConfigured,
  InboxError,
  listInbox,
  markArchived,
  markHandled,
  replyToInbox,
  waitingMail,
} from "@/server/inbox";

const ID = /^[A-Za-z0-9-]{1,100}$/;
const fail = (e: unknown) => json(e instanceof InboxError ? e.status : 502, { error: (e as Error).message });

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  if (!inboxConfigured()) return json(200, { configured: false, items: [], next: null, waiting: 0 });
  const q = new URL(req.url).searchParams;
  const id = q.get("id");
  const after = q.get("after") ?? undefined;
  if ((id && !ID.test(id)) || (after && !ID.test(after))) return json(400, { error: "Bad request" });
  try {
    if (id) return json(200, { message: await getInboxMessage(id) });
    if (q.has("count")) return json(200, { waiting: (await waitingMail()).length });
    return json(200, { configured: true, ...(await listInbox({ after })) });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  if (!inboxConfigured()) return json(400, { error: "The inbox isn't set up (RESEND_INBOX_API_KEY)." });
  const body = await readBody(req, 40_000);
  if (!body || typeof body.id !== "string" || !ID.test(body.id)) return json(400, { error: "Bad request" });
  const id = body.id;
  try {
    if (body.action === "handled") {
      await markHandled(id, body.handled !== false);
      await audit(gate.staff.email, body.handled === false ? "inbox.reopen" : "inbox.done", id);
      return json(200, { ok: true });
    }
    if (body.action === "archive") {
      await markArchived(id, body.archived !== false);
      await audit(gate.staff.email, body.archived === false ? "inbox.unarchive" : "inbox.archive", id);
      return json(200, { ok: true });
    }
    if (body.action === "reply") {
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text) return json(400, { error: "Write a reply first." });
      if (text.length > 10_000) return json(400, { error: "Keep the reply under 10,000 characters." });
      const ok = await replyToInbox(id, text, gate.staff.email);
      await audit(gate.staff.email, "inbox.reply", id, { ok });
      return ok ? json(200, { ok: true }) : json(502, { error: "The reply couldn't be sent." });
    }
  } catch (e) {
    return fail(e);
  }
  return json(400, { error: "Unknown action" });
}
