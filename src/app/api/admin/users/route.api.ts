// GET /api/admin/users/?q=: search accounts by email or id (staff). GET ?id=: one account's page (staff; each
// opening by support is in the audit log). POST changes it:
//   {action: "note", id, text}     add a private note (staff)
//   {action: "unnote", noteId}     remove a note (support: their own; admins: any)
//   {action: "signout", id}        end every device's session (admins)
//   {action: "delete", id, confirm: "DELETE"}  delete the account and everything synced to it (admins)
import { deleteAccount } from "@/server/accounts";
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { accountDetail, accountTotals, addNote, checkNote, removeNote, searchAccounts, signOutEverywhere } from "@/server/adminUsers";

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
    return json(200, { account: detail });
  }
  const [accounts, totals] = await Promise.all([searchAccounts(q.get("q") ?? ""), accountTotals()]);
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
    default:
      return json(400, { error: "Unknown action" });
  }
}
