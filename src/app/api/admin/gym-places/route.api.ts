// GET /api/admin/gym-places/?q=&page=&country=&city=&status=&missing=: real gyms for the admin Gyms tab, 50 a page, and
// the gyms lifters added that wait for a check (staff). ?job=1: the import job running on the server (or the latest one
// not closed) with its progress, and the latest daily refresh; ?job=<id>&log=1 its whole debug log (gymImportJobs.ts).
// POST (admins, audited): {action: "importWorld", notify?} the one button, every gym in the world from OpenStreetMap,
// then their websites, then AI for what's missing (docs/decisions/gyms.md "One button: every gym in the world");
// {action: "importRetry", job} a new job of the areas a job didn't import; {action: "importStop" | "importClose", job}
// stops or closes one; {id, action: hide | show | gym | studio | delete | approve | reject} changes one gym
// (src/server/gymPlaces.ts).
import { after } from "next/server";

import { audit, json, requireStaff } from "@/server/adminAuth";
import { readBody } from "@/server/adminBody";
import { setFlag } from "@/server/flags";
import {
  createJob,
  dismissJob,
  importAiOn,
  jobLog,
  jobStatus,
  kickWorker,
  lastDaily,
  runWorker,
  startWorld,
  stopJob,
  unfinishedPlaces,
} from "@/server/gymImportJobs";
import { actOnPlace, adminPlaces, pendingPlaces } from "@/server/gymPlaces";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const u = new URL(req.url).searchParams;
  const job = u.get("job");
  if (job !== null) {
    if (u.get("log") !== null) {
      const log = await jobLog(job);
      return log ? json(200, log) : json(404, { error: "No such import." });
    }
    const [status, daily, ai] = await Promise.all([jobStatus(job === "1" ? undefined : job), lastDaily(), importAiOn()]);
    return json(200, { job: status, daily, ai });
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
  if (body.action === "importWorld" || body.action === "importRetry") {
    const notify = body.notify !== false;
    let made: Awaited<ReturnType<typeof createJob>>;
    let label: string;
    if (body.action === "importWorld") {
      made = await startWorld(gate.staff.email, notify);
      label = "every gym in the world";
    } else {
      const places = await unfinishedPlaces(String(body.job ?? ""));
      label = `${places.length} failed ${places.length === 1 ? "area" : "areas"}`;
      made = await createJob({ label, places, kind: "world", startedBy: gate.staff.email, notify });
    }
    if ("error" in made)
      return made.error === "running"
        ? json(409, { error: "Another import is running. Stop it first.", job: made.id })
        : json(400, { error: "Nothing to import." });
    await audit(gate.staff.email, "gyms.importJob", label);
    // The worker runs in its own invocation (its own 800 seconds); without CRON_SECRET (local), right here instead.
    const origin = new URL(req.url).origin;
    after(async () => {
      if (!(await kickWorker(origin))) await runWorker({ deadline: Date.now() + 280_000 }).catch(() => null);
    });
    return json(200, { job: await jobStatus(made.id) });
  }
  // The import's AI step on or off (the gymImportAi flag, also on the Flags tab).
  if (body.action === "importAi") {
    const on = body.on === true;
    await setFlag("gymImportAi", on, 100, gate.staff.email);
    await audit(gate.staff.email, "flag.set", "gymImportAi", { value: on, rollout: 100 });
    return json(200, { ai: on });
  }
  if (body.action === "importStop" || body.action === "importClose") {
    const id = String(body.job ?? "");
    const done = body.action === "importStop" ? await stopJob(id) : await dismissJob(id);
    if (!done) return json(400, { error: "That import isn't running." });
    if (body.action === "importStop") await audit(gate.staff.email, "gyms.importStop", id);
    return json(200, { job: body.action === "importStop" ? await jobStatus(id) : null });
  }
  if (!(await actOnPlace(body.id, body.action))) return json(400, { error: "Which gym, and what to do?" });
  await audit(gate.staff.email, `gyms.${String(body.action)}`, String(body.id));
  return json(200, { ok: true });
}
