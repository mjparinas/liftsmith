// Vercel Cron (vercel.json), once a day: schedules each confirmed subscriber's emails for the next day
// with Resend (scheduled_at), at local times in their own time zone. Once a day works on every Vercel
// plan. Vercel sends "Authorization: Bearer $CRON_SECRET".
import { runDaily } from "@/server/reminders";
import { setup } from "@/server/reminderHttp";

export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Not allowed" }, { status: 401 });
  const s = setup();
  if (!s) return Response.json({ error: "Email reminders are not configured" }, { status: 503 });
  return Response.json(await runDaily(s.store, s.mail, s.env, Date.now()));
}
