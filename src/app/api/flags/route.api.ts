// GET /api/flags/?install=<id>: every feature flag's value for this install (src/server/flags.ts), read by the app
// on open and on return to the foreground (src/lib/remoteFlags.ts). The install id is sent only while usage stats
// are on; without it, partial rollouts and tests show the default or the control. Public, never cached.
import { NATIVE_ORIGINS } from "@/lib/feedbackServer";
import { rateLimit } from "@/server/db";
import { flagsFor } from "@/server/flags";

export const dynamic = "force-dynamic";

function headers(origin: string | null): Record<string, string> {
  const h: Record<string, string> = { "Cache-Control": "no-store" };
  if (origin && NATIVE_ORIGINS.has(origin))
    Object.assign(h, { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, OPTIONS", Vary: "Origin" });
  return h;
}

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: headers(req.headers.get("origin")) });
}

export async function GET(req: Request) {
  const h = headers(req.headers.get("origin"));
  const raw = new URL(req.url).searchParams.get("install");
  const id = raw && /^[A-Za-z0-9_-]{8,64}$/.test(raw) ? raw : null;
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "?";
    if (!(await rateLimit(`flags-ip:${ip}`, 300, 3_600_000))) return Response.json({ error: "Slow down" }, { status: 429, headers: h });
    return Response.json({ flags: await flagsFor(id) }, { headers: h });
  } catch {
    // No database: the app keeps its last answer.
    return Response.json({ error: "Flags are not configured" }, { status: 503, headers: h });
  }
}
