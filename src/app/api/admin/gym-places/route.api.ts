// GET /api/admin/gym-places/?q=: real gyms for the admin Gyms tab (staff). POST (admins, audited):
// {action: "import", where: "Langley, BC"} seeds an area from OpenStreetMap; {id, action: hide | show | gym | studio | delete}
// changes one gym (src/server/gymPlaces.ts, docs/decisions/gyms.md).
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { actOnPlace, adminPlaces, importArea } from "@/server/gymPlaces";

export const dynamic = "force-dynamic";
// An OpenStreetMap import can take a while on a busy map server.
export const maxDuration = 120;

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  return json(200, await adminPlaces(new URL(req.url).searchParams.get("q")));
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  if (!body) return json(400, { error: "Bad request." });
  if (body.action === "import") {
    const r = await importArea(String(body.where ?? ""));
    if (!r.ok)
      return json(r.error === "where" ? 400 : 502, {
        error:
          r.error === "where"
            ? "That place wasn't found. Try a city and province, like Langley, BC."
            : "The map server didn't answer. Try again in a minute.",
      });
    await audit(gate.staff.email, "gyms.import", `${r.area}: ${r.added} added, ${r.updated} updated`);
    return json(200, r);
  }
  if (!(await actOnPlace(body.id, body.action))) return json(400, { error: "Which gym, and what to do?" });
  await audit(gate.staff.email, `gyms.${String(body.action)}`, String(body.id));
  return json(200, { ok: true });
}
