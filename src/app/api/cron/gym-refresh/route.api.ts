// The daily gym refresh (docs/decisions/gyms.md "One button: every gym in the world"). Vercel Schedules ("gym-refresh"
// in vercel.json) calls GET once a day: it starts a job of every gym new or changed on OpenStreetMap since the last
// one, whose website and AI steps then carry on with whatever is due, and starts the worker (gym-imports). Safe to run
// twice: no job starts while another runs or within 20 hours of the last daily one. "Authorization: Bearer $CRON_SECRET".
import { after } from "next/server";

import { kickWorker, runWorker, startDaily } from "@/server/gymImportJobs";
import { authorized } from "@/server/revenuecat";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!authorized(req.headers.get("authorization"), process.env.CRON_SECRET))
    return Response.json({ error: "Not allowed" }, { status: 401 });
  const r = await startDaily();
  if ("id" in r) {
    const origin = new URL(req.url).origin;
    after(async () => {
      if (!(await kickWorker(origin))) await runWorker({ deadline: Date.now() + 280_000 }).catch(() => null);
    });
  }
  return Response.json(r);
}
