// GET /api/admin/schools/: high school coaches waiting for staff, recent decisions and the school domains staff have
// ruled on (staff). POST {id, action} (admins, audited): "approve" trusts the coach's school domain, "reject" turns
// this coach down, "block" stops the whole domain (src/server/teams.ts, docs/decisions/school-teams.md).
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { decideSchool, schoolQueue } from "@/server/teams";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  return json(200, await schoolQueue());
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  if (!body || !(await decideSchool(body.id, body.action))) return json(400, { error: "That coach isn't there any more." });
  await audit(gate.staff.email, `schools.${String(body.action)}`, String(body.id));
  return json(200, { ok: true });
}
