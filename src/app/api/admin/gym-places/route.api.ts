// GET /api/admin/gym-places/?q=&page=: real gyms for the admin Gyms tab, 50 a page, and the gyms lifters added that
// wait for a check (staff). ?cities=CA|US: the major cities to import in one go (majorCities.ts) and when each last
// imported cleanly. ?imports=1: the latest imports with their debug logs (gymImport.ts). POST (admins, audited):
// {action: "import", where: "Langley, BC", server?: n, fresh?: true} seeds an area from OpenStreetMap; {id, action:
// hide | show | gym | studio | delete | approve | reject} changes one gym (src/server/gymPlaces.ts, docs/decisions/gyms.md).
import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { importArea, lastImported, recentImports } from "@/server/gymImport";
import { actOnPlace, adminPlaces, pendingPlaces } from "@/server/gymPlaces";
import { isImportCountry, MAJOR_CITIES } from "@/server/majorCities";

export const dynamic = "force-dynamic";
// An OpenStreetMap import of a big city can take a few minutes on a busy map server.
export const maxDuration = 300;

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const u = new URL(req.url).searchParams;
  const country = u.get("cities");
  if (country !== null) {
    if (!isImportCountry(country)) return json(400, { error: "CA or US." });
    const cities = MAJOR_CITIES[country];
    return json(200, { cities, last: await lastImported(cities) });
  }
  if (u.get("imports") !== null) return json(200, { imports: await recentImports() });
  const [list, pending] = await Promise.all([adminPlaces(u.get("q"), u.get("page")), pendingPlaces()]);
  return json(200, { ...list, pending });
}

export async function POST(req: Request) {
  const gate = await requireStaff(req, { write: true });
  if ("response" in gate) return gate.response;
  const body = await readBody(req);
  if (!body) return json(400, { error: "Bad request." });
  if (body.action === "import") {
    const r = await importArea(String(body.where ?? ""), fetch, Date.now(), {
      server: typeof body.server === "number" ? body.server : 0,
      fresh: body.fresh === true,
    });
    if (!r.ok)
      return json(r.error === "where" ? 400 : 502, {
        ...r,
        error:
          r.error === "where"
            ? "That place wasn't found. Try a city and province, like Langley, BC."
            : "No map server answered in time. Try again in a minute.",
      });
    await audit(gate.staff.email, "gyms.import", `${r.area}: ${r.added} added, ${r.updated} updated, ${r.unchanged} unchanged`);
    return json(200, r);
  }
  if (!(await actOnPlace(body.id, body.action))) return json(400, { error: "Which gym, and what to do?" });
  await audit(gate.staff.email, `gyms.${String(body.action)}`, String(body.id));
  return json(200, { ok: true });
}
