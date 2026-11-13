// Vercel Cron (vercel.json), each morning: runs the admin panel's System checks and emails the admins about any
// that went down or came back (src/server/alerts.ts), records the database size for
// the Capacity card, and pings IndexNow with new and changed public pages (src/server/indexnow.ts), and tells coaches about clients who
// went quiet (src/server/coach.ts alertQuiet). Vercel sends "Authorization: Bearer $CRON_SECRET". Each run is recorded (src/server/monitor.ts).
import { watchSystem } from "@/server/alerts";
import { sampleDbSize } from "@/server/capacity";
import { alertQuiet } from "@/server/coach";
import { sendDueCheckins } from "@/server/coachForms";
import { pingIndexNow } from "@/server/indexnow";
import { trackJob } from "@/server/monitor";
import { authorized } from "@/server/revenuecat";

export const maxDuration = 120;

export async function GET(req: Request) {
  if (!authorized(req.headers.get("authorization"), process.env.CRON_SECRET))
    return Response.json({ error: "Not allowed" }, { status: 401 });
  return trackJob("admin", async () => {
    const size = await sampleDbSize().catch(() => null);
    const watch = await watchSystem();
    const indexNow = await pingIndexNow().catch((e: Error) => ({ sent: 0, error: e.message }));
    // Coaches hear about clients who haven't trained for a week (trainer-mode.md).
    const quiet = await alertQuiet().catch(() => -1);
    // Weekly check-ins that are due go to their clients (coachForms.ts).
    const checkins = await sendDueCheckins().catch(() => -1);
    return Response.json({ down: watch.down, alerted: watch.alerted, bytes: size, indexNow, quiet, checkins });
  });
}
