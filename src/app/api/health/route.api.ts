// GET /api/health/: 200 when the server and its database answer (one SELECT 1), 503 otherwise. Public,
// uncached and says nothing beyond pass or fail, so an uptime monitor (UptimeRobot) can watch it.
import { query } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    await query("SELECT 1");
    return Response.json({ ok: true }, { headers });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers });
  }
}
