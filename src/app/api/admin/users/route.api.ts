// GET /api/admin/users/?q=: search accounts by email or id (staff). GET ?id=: one account's page (staff; each
// opening by support is in the audit log). POST changes it:
//   {action: "note", id, text}     add a private note (staff)
//   {action: "unnote", noteId}     remove a note (support: their own; admins: any)
//   {action: "signout", id}        end every device's session (admins)
//   {action: "delete", id, confirm: "DELETE"}  delete the account and everything synced to it (admins)
//   {action: "reset", id, confirm}  clear everything but the sign-in and Pro; `confirm` is their Friends handle, or
//                                   their email without one, typed exactly (admins; docs/decisions/moderation.md)
//   {action: "mod", id, what, reason?, days?}  moderate their Friends profile: warn, suspend, ban, shadow, unban,
//                                   boardsOff, boardsOn, resetName, resetHandle, dismiss (admins)
// GET ?q= also takes filter (all, reported, actioned, teens) and sort (newest, reports, seen).
import { deleteAccount, resetAccount } from "@/server/accounts";
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import {
  accountDetail,
  accountTotals,
  addNote,
  checkNote,
  removeNote,
  searchAccounts,
  signOutEverywhere,
  USER_FILTERS,
  USER_SORTS,
} from "@/server/adminUsers";
import { moderate, moderationFor, parseAction } from "@/server/socialModeration";

export const dynamic = "force-dynamic";

const ID = /^[A-Za-z0-9_-]{8,64}$/;

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const q = new URL(req.url).searchParams;
  const id = q.get("id");
  if (id != null) {
    if (!ID.test(id)) return json(400, { error: "Bad id" });
    const detail = await accountDetail(id);
    if (!detail) return json(404, { error: "No account with that id." });
    if (gate.staff.role === "support") await audit(gate.staff.email, "account.view", id);
    return json(200, { account: detail, moderation: await moderationFor(id) });
  }
  const filter = USER_FILTERS.find((f) => f === q.get("filter")) ?? "all";
  const sort = USER_SORTS.find((x) => x === q.get("sort")) ?? "newest";
  const [accounts, totals] = await Promise.all([searchAccounts(q.get("q") ?? "", 100, { filter, sort }), accountTotals()]);
  return json(200, { accounts, totals });
}

export async function POST(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  if (!body) return json(400, { error: "Not JSON" });
  const who = gate.staff.email;
  const admin = gate.staff.role === "admin";
  const id = typeof body.id === "string" && ID.test(body.id) ? body.id : null;
  switch (body.action) {
    case "note": {
      if (!id) return json(400, { error: "Which account?" });
      const t = checkNote(body.text);
      if (!t.ok) return json(400, { error: t.error });
      if (!(await accountDetail(id))) return json(404, { error: "No account with that id." });
      const noteId = await addNote(id, t.text, who);
      await audit(who, "account.note", id);
      return json(200, { ok: true, id: noteId });
    }
    case "unnote": {
      const noteId = Number(body.noteId);
      if (!Number.isInteger(noteId)) return json(400, { error: "Which note?" });
      if (!(await removeNote(noteId, who, admin))) return json(404, { error: "No such note, or it isn't yours." });
      await audit(who, "account.unnote", String(noteId));
      return json(200, { ok: true });
    }
    case "signout": {
      if (!admin) return json(403, { error: "Only an admin can do that." });
      if (!id) return json(400, { error: "Which account?" });
      const n = await signOutEverywhere(id);
      await audit(who, "account.signout", id, { sessions: n });
      return json(200, { ok: true, sessions: n });
    }
    case "delete": {
      if (!admin) return json(403, { error: "Only an admin can do that." });
      if (!id) return json(400, { error: "Which account?" });
      if (body.confirm !== "DELETE") return json(400, { error: "Type DELETE to confirm." });
      if (!(await accountDetail(id))) return json(404, { error: "No account with that id." });
      await deleteAccount(id);
      // The email isn't kept in the log once the account is gone.
      await audit(who, "account.delete", id);
      return json(200, { ok: true });
    }
    case "reset": {
      if (!admin) return json(403, { error: "Only an admin can do that." });
      if (!id) return json(400, { error: "Which account?" });
      const detail = await accountDetail(id);
      if (!detail) return json(404, { error: "No account with that id." });
      // Melvin, 2026-11-14: "an are you sure message that forces you to type their username correctly".
      const name = detail.handle ?? detail.email ?? detail.id;
      if (body.confirm !== name) return json(400, { error: `Type ${name} exactly to confirm.` });
      await resetAccount(id);
      await audit(who, "account.reset", id);
      return json(200, { ok: true });
    }
    case "mod": {
      if (!admin) return json(403, { error: "Only an admin can do that." });
      if (!id) return json(400, { error: "Which account?" });
      const a = parseAction(body);
      if (!a) return json(400, { error: "What should happen?" });
      if (!(await moderate(id, a))) return json(404, { error: "They haven't joined Friends, so there's nothing to moderate." });
      await audit(
        who,
        `mod.${a.action}`,
        id,
        "reason" in a || "days" in a ? { reason: "reason" in a ? a.reason : undefined, days: "days" in a ? a.days : undefined } : undefined,
      );
      return json(200, { ok: true });
    }
    default:
      return json(400, { error: "Unknown action" });
  }
}
