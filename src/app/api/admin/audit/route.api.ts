// GET /api/admin/audit/: the change log, newest first, 100 at a time (?before=<id> for more), filtered by ?who=
// (a staff email) and ?action= (an action or its start, such as "2fa"). Staff only.
import { json, requireStaff } from "@/server/adminAuth";
import { auditLog } from "@/server/adminData";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const q = new URL(req.url).searchParams;
  const before = Number(q.get("before"));
  return json(
    200,
    await auditLog({
      who: q.get("who")?.slice(0, 200) || undefined,
      action: q.get("action")?.slice(0, 60) || undefined,
      before: Number.isFinite(before) && before > 0 ? before : undefined,
      limit: 100,
    }),
  );
}
