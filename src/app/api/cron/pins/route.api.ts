// Posts the Pinterest queue at its pace (src/server/pins.ts postDue, docs/decisions/pinterest.md). Vercel Schedules
// ("pins" in vercel.json) calls GET every two hours; each run posts at most one pin, and only when the day's share
// hasn't gone out. Safe to run twice: the hour's run is claimed once and each pin is claimed before it's sent.
// "Authorization: Bearer $CRON_SECRET". Each run is recorded (src/server/monitor.ts).
import { trackJob } from "@/server/monitor";
import { postDue } from "@/server/pins";
import { authorized } from "@/server/revenuecat";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  if (!authorized(req.headers.get("authorization"), process.env.CRON_SECRET))
    return Response.json({ error: "Not allowed" }, { status: 401 });
  return trackJob("pins", async () => Response.json(await postDue()));
}
