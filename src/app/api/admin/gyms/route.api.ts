// GET /api/admin/gyms/: listed gyms with open reports (staff). POST {id, action} (admins, audited): remove deletes
// the listing, dismiss closes its reports and shows it again (src/server/gymDirectory.ts).
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { reportedGyms, resolveGym } from "@/server/gymDirectory";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  return json(200, { gyms: await reportedGyms() });
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  if (!body || !(await resolveGym(body.id, body.action))) return json(400, { error: "Which gym, and remove or dismiss?" });
  await audit(gate.staff.email, `gym.${String(body.action)}`, String(body.id));
  return json(200, { ok: true });
}
