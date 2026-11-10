// The Inbox's saved replies (src/lib/savedReplies.ts): GET the list (staff), PUT { replies: [{ id, title, body }] }
// to replace it (admins, audited).
import { repliesProblem, type SavedReply } from "@/lib/savedReplies";
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { savedReplies } from "@/server/replyDraft";
import { setSetting } from "@/server/settings";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  return json(200, { replies: await savedReplies() });
}

export async function PUT(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req, 200_000);
  const problem = repliesProblem(body?.replies);
  if (problem) return json(400, { error: problem });
  const replies = (body!.replies as SavedReply[]).map((r) => ({ id: r.id, title: r.title.trim(), body: r.body.trim() }));
  await setSetting("saved_replies", JSON.stringify(replies));
  await audit(gate.staff.email, "replies.save", null, { count: replies.length });
  return json(200, { ok: true });
}
