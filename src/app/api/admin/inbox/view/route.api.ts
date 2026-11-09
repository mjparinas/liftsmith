// One received email's HTML, sanitized, as a page of its own for the Inbox's sandboxed frame (as in Gradelings).
// `?images=1` lets remote images load. Served with its own strict policy (`emailViewPolicy`: sandboxed, no
// scripts, nothing from the network unless images are asked for) and only frameable by the panel itself.
import { json, requireStaff } from "@/server/adminAuth";
import { emailPage, emailViewPolicy, sanitizeEmailHtml } from "@/server/emailHtml";
import { getInboxHtml, InboxError, inboxConfigured } from "@/server/inbox";

const ID = /^[A-Za-z0-9-]{1,100}$/;

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  if (!inboxConfigured()) return json(400, { error: "The inbox isn't set up." });
  const q = new URL(req.url).searchParams;
  const id = q.get("id");
  if (!id || !ID.test(id)) return json(400, { error: "Bad request" });
  const images = q.get("images") === "1";
  let html: string;
  try {
    html = await getInboxHtml(id);
  } catch (e) {
    return json(e instanceof InboxError ? e.status : 502, { error: (e as Error).message });
  }
  return new Response(emailPage(sanitizeEmailHtml(html, { images })), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "content-security-policy": emailViewPolicy(images),
      "x-frame-options": "SAMEORIGIN",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "cross-origin-resource-policy": "same-origin",
    },
  });
}
