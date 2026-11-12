// Vercel Cron (vercel.json) at 15:00 and 16:00 UTC: the admins' morning digest (src/server/digest.ts). Cron runs in
// UTC, so one of the two runs is 8 AM Pacific whatever the season; the digest goes out once per Pacific day.
// Vercel sends "Authorization: Bearer $CRON_SECRET". Each run is recorded (src/server/monitor.ts).
import { sendDigest } from "@/server/digest";
import { trackJob } from "@/server/monitor";
import { authorized } from "@/server/revenuecat";

export const maxDuration = 60;

export async function GET(req: Request) {
  if (!authorized(req.headers.get("authorization"), process.env.CRON_SECRET))
    return Response.json({ error: "Not allowed" }, { status: 401 });
  return trackJob("digest", async () => Response.json({ sent: await sendDigest() }));
}
