// The gym import worker (src/server/gymImportJobs.ts, docs/decisions/gyms.md "Imports run on the server"). Vercel Schedules
// ("gym-imports" in vercel.json) calls GET every five minutes as a safety net; Admin › Gyms and a worker whose time is up call POST to
// start the next worker at once. Both answer straight away and import in the background for up to 800 seconds; a
// worker that finds the job already held, or no job running, does nothing. "Authorization: Bearer $CRON_SECRET".
// The AI fix-up pass (gymAiFix.ts) runs beside it in the same invocation, with its own job and lease, and so does the
// mover that takes gym pictures still in the database to Vercel Blob (gymBlob.ts runMover; nothing once they've moved).
import { after } from "next/server";

import { runFixWorker } from "@/server/gymAiFix";
import { runMover } from "@/server/gymBlob";
import { kickWorker, runWorker } from "@/server/gymImportJobs";
import { authorized } from "@/server/revenuecat";

export const dynamic = "force-dynamic";
export const maxDuration = 800;

function work(req: Request) {
  if (!authorized(req.headers.get("authorization"), process.env.CRON_SECRET))
    return Response.json({ error: "Not allowed" }, { status: 401 });
  const origin = new URL(req.url).origin;
  after(async () => {
    const [r, f] = await Promise.all([
      runWorker().catch((e: unknown) => {
        console.error("[gym-imports] worker failed", e instanceof Error ? e.message : e);
        return null;
      }),
      runFixWorker().catch((e: unknown) => {
        console.error("[gym-imports] AI fix-up worker failed", e instanceof Error ? e.message : e);
        return null;
      }),
      runMover().catch((e: unknown) => console.error("[gym-imports] picture mover failed", e instanceof Error ? e.message : e)),
    ]);
    // Out of time with work still to go: a fresh worker carries on.
    if (r?.more || f?.more) await kickWorker(origin);
  });
  return Response.json({ started: true });
}

export const GET = work;
export const POST = work;
