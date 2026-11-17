// Crew session reminders (src/server/clubChat.ts, docs/decisions/friends.md "Club chat and crew sessions"). Vercel
// Schedules ("crew" in vercel.json) calls GET every 15 minutes: everyone in a crew session starting within the hour
// gets one push. Safe to run twice: each session is claimed in one statement before anyone is told, and a run with
// nothing due reads only the partial index of sessions not yet reminded. "Authorization: Bearer $CRON_SECRET".
import { crewReminders } from "@/server/clubChat";
import { authorized } from "@/server/revenuecat";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!authorized(req.headers.get("authorization"), process.env.CRON_SECRET))
    return Response.json({ error: "Not allowed" }, { status: 401 });
  return Response.json(await crewReminders());
}
