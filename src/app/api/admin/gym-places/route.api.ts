// GET /api/admin/gym-places/?q=&page=&country=&city=&status=&missing=: real gyms for the admin Gyms tab, 50 a page, and the gyms lifters added that
// wait for a check (staff). ?countries=1: the countries with major cities to import. ?cities=<code>|ALL: one
// country's (or every country's) major cities (majorCities.ts, worldCities.ts) and when each last imported cleanly.
// ?imports=1: the latest imports with their debug logs (gymImport.ts). ?job=1: the country import running on the server
// (or the latest one not closed) with its progress; ?job=<id>&log=1 its whole debug log (gymImportJobs.ts). POST
// (admins, audited): {action: "import", where: "Langley, BC", server?: n, fresh?: true} seeds an area from
// OpenStreetMap; {action: "importJob", country: "CA" | "ALL", skipRecent?, notify?} starts a country import on the
// server; {action: "importRetry", job} starts a new one of the cities a job didn't import; {action: "importRetryRecent"}
// one of every city whose latest recent import failed; {action: "repair", after} fixes the next thousand gyms' city
// names and addresses (gymRepair.ts); {action: "importStop" |
// "importClose", job} stops or closes one; {action: "enrich"}
// reads the next batch of gyms' own websites for missing details (gymEnrich.ts); {id, action:
// hide | show | gym | studio | delete | approve | reject} changes one gym (src/server/gymPlaces.ts, docs/decisions/gyms.md).
import { after } from "next/server";

import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { enrichBatch } from "@/server/gymEnrich";
import { failedRecently, importArea, lastImported, recentImports } from "@/server/gymImport";
import {
  createJob,
  dismissJob,
  jobLog,
  jobStatus,
  kickWorker,
  placesFor,
  runWorker,
  stopJob,
  unfinishedPlaces,
} from "@/server/gymImportJobs";
import { actOnPlace, adminPlaces, pendingPlaces } from "@/server/gymPlaces";
import { repairStep } from "@/server/gymRepair";
import { importCountryList, isImportCountry, MAJOR_CITIES } from "@/server/majorCities";

export const dynamic = "force-dynamic";
// An OpenStreetMap import of a big city can take a few minutes on a busy map server.
export const maxDuration = 300;

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const u = new URL(req.url).searchParams;
  const country = u.get("cities");
  if (country !== null) {
    // ALL: every country's cities, biggest countries' lists in the picker's order.
    const cities = country === "ALL" ? importCountryList().flatMap((c) => MAJOR_CITIES[c.code] ?? []) : MAJOR_CITIES[country];
    if (!cities || (country !== "ALL" && !isImportCountry(country))) return json(400, { error: "A country code, or ALL." });
    return json(200, { cities, last: await lastImported(cities) });
  }
  if (u.get("countries") !== null) return json(200, { countries: importCountryList() });
  if (u.get("imports") !== null) return json(200, { imports: await recentImports() });
  const job = u.get("job");
  if (job !== null) {
    if (u.get("log") !== null) {
      const log = await jobLog(job);
      return log ? json(200, log) : json(404, { error: "No such import." });
    }
    return json(200, { job: await jobStatus(job === "1" ? undefined : job) });
  }
  const filter = { q: u.get("q"), country: u.get("country"), city: u.get("city"), status: u.get("status"), missing: u.get("missing") };
  const [list, pending] = await Promise.all([adminPlaces({ ...filter, page: u.get("page") }), pendingPlaces()]);
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
  if (body.action === "importJob" || body.action === "importRetry" || body.action === "importRetryRecent") {
    let label: string;
    let places: string[];
    let skipped = 0;
    if (body.action === "importJob") {
      const country = String(body.country ?? "");
      const cities = country === "ALL" ? importCountryList().flatMap((c) => MAJOR_CITIES[c.code] ?? []) : MAJOR_CITIES[country];
      if (!cities || (country !== "ALL" && !isImportCountry(country))) return json(400, { error: "A country code, or ALL." });
      const p = await placesFor(cities, body.skipRecent !== false);
      places = p.todo;
      skipped = p.skipped;
      label = country === "ALL" ? "every country" : (importCountryList().find((c) => c.code === country)?.name ?? country);
      if (!places.length) return json(200, { nothing: true, skipped });
    } else {
      places = body.action === "importRetry" ? await unfinishedPlaces(String(body.job ?? "")) : await failedRecently();
      label = `${places.length} failed ${places.length === 1 ? "city" : "cities"}`;
    }
    const made = await createJob({ label, places, skipped, startedBy: gate.staff.email, notify: body.notify !== false });
    if ("error" in made)
      return made.error === "running"
        ? json(409, { error: "Another import is running. Stop it first.", job: made.id })
        : json(400, { error: "Nothing to import." });
    await audit(gate.staff.email, "gyms.importJob", `${label}: ${places.length} cities${skipped ? `, ${skipped} recent skipped` : ""}`);
    // The worker runs in its own invocation (its own 800 seconds); without CRON_SECRET (local), right here instead.
    const origin = new URL(req.url).origin;
    after(async () => {
      if (!(await kickWorker(origin))) await runWorker({ deadline: Date.now() + 280_000 }).catch(() => null);
    });
    return json(200, { job: await jobStatus(made.id) });
  }
  if (body.action === "importStop" || body.action === "importClose") {
    const id = String(body.job ?? "");
    const done = body.action === "importStop" ? await stopJob(id) : await dismissJob(id);
    if (!done) return json(400, { error: "That import isn't running." });
    if (body.action === "importStop") await audit(gate.staff.email, "gyms.importStop", id);
    return json(200, { job: body.action === "importStop" ? await jobStatus(id) : null });
  }
  if (body.action === "repair") {
    // One step of fixing city names that are postcodes or house numbers, and untidy addresses (gymRepair.ts).
    const r = await repairStep(typeof body.after === "string" ? body.after.slice(0, 20) : "");
    if (r.cities || r.addresses || r.moved)
      await audit(gate.staff.email, "gyms.repair", `${r.cities} cities fixed, ${r.addresses} addresses tidied, ${r.moved} pages moved`);
    return json(200, r);
  }
  if (body.action === "enrich") {
    // The next batch of gyms whose own website may fill missing details (gymEnrich.ts).
    const r = await enrichBatch();
    const filled = r.done.filter((d) => d.filled.length).length;
    if (r.done.length) await audit(gate.staff.email, "gyms.enrich", `${r.done.length} read, ${filled} filled in, ${r.left} left`);
    return json(200, r);
  }
  if (!(await actOnPlace(body.id, body.action))) return json(400, { error: "Which gym, and what to do?" });
  await audit(gate.staff.email, `gyms.${String(body.action)}`, String(body.id));
  return json(200, { ok: true });
}
