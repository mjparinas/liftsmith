// POST /api/collect/: a batch of usage events from the app (src/lib/analytics.ts). Server build only (Vercel);
// the static export for the native shells leaves it out. Needs a database (DATABASE_URL or TURSO_DATABASE_URL).
import { checkBatch, MAX_BATCH_BYTES } from "@/lib/analyticsSchema";
import { NATIVE_ORIGINS } from "@/lib/feedbackServer";
import { storeBatch, whereFrom } from "@/server/collect";
import { rateLimit } from "@/server/db";

function cors(origin: string | null): Record<string, string> {
  return origin && NATIVE_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" } : {};
}
const json = (status: number, body: unknown, headers: Record<string, string>) => Response.json(body, { status, headers });

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req.headers.get("origin")) });
}

export async function POST(req: Request) {
  const h = cors(req.headers.get("origin"));
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BATCH_BYTES) return json(413, { error: "Too large" }, h);
  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BATCH_BYTES) return json(413, { error: "Too large" }, h);
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: "Not JSON" }, h);
  }
  const checked = checkBatch(body);
  if (!checked.ok) return json(400, { error: checked.error }, h);
  try {
    // Per install, and per address too, since the install id is whatever the caller says it is.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "?";
    if (!(await rateLimit(`collect:${checked.batch.context.installId}`, 120, 3_600_000))) return json(429, { error: "Slow down" }, h);
    if (!(await rateLimit(`collect-ip:${ip}`, 600, 3_600_000))) return json(429, { error: "Slow down" }, h);
    const r = await storeBatch(checked.batch, whereFrom(req.headers));
    return json(200, { ok: true, ...r }, h);
  } catch {
    // No database yet: the app keeps the events and tries again later.
    return json(503, { error: "Analytics storage is not configured" }, h);
  }
}
