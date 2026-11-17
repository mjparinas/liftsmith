// Admin › Community (src/server/community.ts, docs/decisions/community.md). Staff only; every change is audited.
// GET: every post, newest first. ?id=<post>: its comments (hidden ones too) and timeline. ?shot=<post>: its screenshot.
// POST {op}: status (id, status, note: tells its followers), merge (id, into), reply (id, body: as the Liftsmith
// team), hide / show (post or comment), remove (post or comment), block / unblock (account).
import { after } from "next/server";

import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import {
  adminPosts,
  adminThread,
  comment,
  isPostId,
  merge,
  notifyFollowers,
  removeTarget,
  setBlocked,
  setHidden,
  setStatus,
  shotFor,
  STAFF_ACCOUNT,
} from "@/server/community";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const q = new URL(req.url).searchParams;
  const shot = q.get("shot");
  if (shot !== null) {
    const img = await shotFor(shot, "staff");
    if (!img) return json(404, { error: "No screenshot" });
    return new Response(new Uint8Array(img), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
    });
  }
  const id = q.get("id");
  if (id !== null) {
    const t = isPostId(id) ? await adminThread(id) : null;
    return t ? json(200, t) : json(404, { error: "Not found" });
  }
  return json(200, { posts: await adminPosts() });
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const b = await readBody(req);
  if (!b) return json(400, { error: "Bad request" });
  const who = gate.staff.email;
  const target = { post: b.post, comment: b.comment };
  const label = String(b.post ?? b.comment ?? b.id ?? b.account ?? "");
  switch (b.op) {
    case "status": {
      const r = await setStatus(b.id, b.status, b.note);
      if (!r) return json(400, { error: "Nothing to change." });
      await audit(who, "community.status", r.post.id, { status: b.status });
      const push = r.push;
      // Followers hear after the answer, so a big post doesn't keep staff waiting.
      if (push) after(() => notifyFollowers(r.post.id, push, r.post.title).then(() => undefined));
      return json(200, { ok: true });
    }
    case "merge":
      if (!(await merge(b.id, b.into))) return json(400, { error: "Pick two different posts that aren't merged." });
      await audit(who, "community.merge", label, { into: b.into });
      return json(200, { ok: true });
    case "reply": {
      const r = await comment(STAFF_ACCOUNT, b.id, b.body, Date.now(), true);
      if ("error" in r) return json(400, { error: r.error });
      await audit(who, "community.reply", label);
      return json(200, r);
    }
    case "hide":
    case "show":
      if (!(await setHidden(target, b.op === "hide"))) return json(400, { error: "Not found" });
      await audit(who, `community.${b.op}`, label);
      return json(200, { ok: true });
    case "remove":
      if (!(await removeTarget(target))) return json(400, { error: "Not found" });
      await audit(who, "community.remove", label);
      return json(200, { ok: true });
    case "block":
    case "unblock":
      if (!(await setBlocked(b.account, b.op === "block"))) return json(400, { error: "Which account?" });
      await audit(who, `community.${b.op}`, String(b.account));
      return json(200, { ok: true });
    default:
      return json(400, { error: "Unknown op" });
  }
}
