// GET /api/admin/maintenance/: whether maintenance mode is on (staff; every tab shows a banner while it is).
// PUT {on: true, confirm: "TURN ON"} or {on: false} switches it (admins, audited). See src/lib/maintenance.ts.
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { getMaintenance, setMaintenance } from "@/server/maintenance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  return json(200, await getMaintenance());
}

export async function PUT(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  if (!body || typeof body.on !== "boolean") return json(400, { error: "Say on: true or false." });
  if (body.on && body.confirm !== "TURN ON") return json(400, { error: "Type TURN ON to confirm." });
  const state = await setMaintenance(body.on, gate.staff.email);
  await audit(gate.staff.email, body.on ? "maintenance.on" : "maintenance.off", null);
  return json(200, state);
}
