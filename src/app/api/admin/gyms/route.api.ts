// GET /api/admin/gyms/: listed gyms with open reports, and real gyms' pages with open reports (staff). POST {id, action}
// (admins, audited): for a listing, remove deletes it and dismiss closes its reports and shows it again
// (src/server/gymDirectory.ts); with `place: true`, a reported gym page: dismiss, hide, merge {into} or edit {name,
// address, website, phone, hours, kind} (src/server/gymPlaceReports.ts).
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { reportedGyms, resolveGym } from "@/server/gymDirectory";
import { decidePlace, reportedPlaces } from "@/server/gymPlaceReports";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const [gyms, places] = await Promise.all([reportedGyms(), reportedPlaces()]);
  return json(200, { gyms, places });
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  if (body?.place === true) {
    const r = await decidePlace(gate.staff.email, body.id, String(body.action), body);
    if (!r.ok) return json(400, { error: r.error });
    await audit(
      gate.staff.email,
      `gymPlace.${String(body.action)}`,
      `${String(body.id)}${body.action === "merge" ? ` → ${String(body.into)}` : ""}`,
    );
    return json(200, { ok: true });
  }
  if (!body || !(await resolveGym(body.id, body.action))) return json(400, { error: "Which gym, and remove or dismiss?" });
  await audit(gate.staff.email, `gym.${String(body.action)}`, String(body.id));
  return json(200, { ok: true });
}
