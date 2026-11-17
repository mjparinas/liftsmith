// GET /api/seasons/: the season schedule (src/server/seasons.ts), read by the app on open and on return to the
// foreground (src/lib/remoteSeasons.ts). Public: the same answer for everyone, with nothing personal in it.
import { NATIVE_ORIGINS } from "@/lib/feedbackServer";
import { DEFAULT_SEASONS } from "@/lib/seasons";
import { rateLimit } from "@/server/db";
import { seasonSchedule } from "@/server/seasons";

export const dynamic = "force-dynamic";

function headers(origin: string | null): Record<string, string> {
  const h: Record<string, string> = { "Cache-Control": "public, max-age=300" };
  if (origin && NATIVE_ORIGINS.has(origin))
    Object.assign(h, { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, OPTIONS", Vary: "Origin" });
  return h;
}

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: headers(req.headers.get("origin")) });
}

export async function GET(req: Request) {
  const h = headers(req.headers.get("origin"));
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "?";
    if (!(await rateLimit(`seasons-ip:${ip}`, 300, 3_600_000))) return Response.json({ error: "Slow down" }, { status: 429, headers: h });
    return Response.json({ seasons: await seasonSchedule() }, { headers: h });
  } catch {
    // No database: the built-in schedule.
    return Response.json({ seasons: DEFAULT_SEASONS }, { headers: h });
  }
}
