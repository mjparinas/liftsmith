// The gym import worker (src/server/gymImportJobs.ts, docs/decisions/gyms.md "Imports run on the server"). Vercel Schedules
// ("gym-imports" in vercel.json) calls GET every five minutes as a safety net; Admin › Gyms and a worker whose time is up call POST to
// start the next worker at once. Both answer straight away and import in the background for up to 800 seconds; a
// worker that finds the job already held, or no job running, does nothing. "Authorization: Bearer $CRON_SECRET".
import { after } from "next/server";

import { kickWorker, runWorker } from "@/server/gymImportJobs";
import { authorized } from "@/server/revenuecat";

export const dynamic = "force-dynamic";
export const maxDuration = 800;

function work(req: Request) {
  if (!authorized(req.headers.get("authorization"), process.env.CRON_SECRET))
    return Response.json({ error: "Not allowed" }, { status: 401 });
  const origin = new URL(req.url).origin;
  after(async () => {
    const r = await runWorker().catch((e: unknown) => {
      console.error("[gym-imports] worker failed", e instanceof Error ? e.message : e);
      return null;
    });
    // Out of time with cities still to go: a fresh worker carries on.
    if (r?.more) await kickWorker(origin);
  });
  return Response.json({ started: true });
}

export const GET = work;
export const POST = work;
