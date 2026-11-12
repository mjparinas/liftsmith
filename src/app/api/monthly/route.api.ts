// GET /api/monthly/?month=2026-11: how many lifters finished that month's challenge (public, cached a few minutes).
// POST /api/monthly/ {month, device}: this device finished it (once per month; src/lib/monthlyCount.ts).
// Friends gap list 3, item 10 (docs/decisions/friends.md "Monthly finishers").
import { NATIVE_ORIGINS } from "@/lib/feedbackServer";
import { allowed, finishedCount, recordFinish, validMonth } from "@/server/monthly";

export const dynamic = "force-dynamic";

function headers(origin: string | null, cache: string): Record<string, string> {
  const h: Record<string, string> = { "Cache-Control": cache };
  if (origin && NATIVE_ORIGINS.has(origin))
    Object.assign(h, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    });
  return h;
}

const ipOf = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: headers(req.headers.get("origin"), "no-store") });
}

export async function GET(req: Request) {
  const origin = req.headers.get("origin");
  const month = new URL(req.url).searchParams.get("month");
  if (!validMonth(month)) return Response.json({ error: "Bad request" }, { status: 400, headers: headers(origin, "no-store") });
  try {
    if (!(await allowed(ipOf(req)))) return Response.json({ error: "Slow down" }, { status: 429, headers: headers(origin, "no-store") });
    return Response.json({ month, finished: await finishedCount(month) }, { headers: headers(origin, "public, max-age=300") });
  } catch {
    return Response.json({ error: "Not configured" }, { status: 503, headers: headers(origin, "no-store") });
  }
}

export async function POST(req: Request) {
  const h = headers(req.headers.get("origin"), "no-store");
  let body: { month?: unknown; device?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400, headers: h });
  }
  try {
    if (!(await allowed(ipOf(req)))) return Response.json({ error: "Slow down" }, { status: 429, headers: h });
    if (!(await recordFinish(body.month, body.device))) return Response.json({ error: "Bad request" }, { status: 400, headers: h });
    return Response.json({ ok: true, finished: await finishedCount(String(body.month)) }, { headers: h });
  } catch {
    return Response.json({ error: "Not configured" }, { status: 503, headers: h });
  }
}
