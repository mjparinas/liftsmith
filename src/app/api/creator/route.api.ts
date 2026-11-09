// Creator codes from the app and the /c/ link page (AGENTS.md "Marketing and growth").
// POST {installId, code, source, platform}: records which creator this install came with (src/server/creators.ts).
// GET ?code=: the creator's display name, for the link page. 404 for an unknown or paused code.
import { NATIVE_ORIGINS } from "@/lib/feedbackServer";
import { claimCode, findCreator } from "@/server/creators";
import { rateLimit } from "@/server/db";

function cors(origin: string | null): Record<string, string> {
  return origin && NATIVE_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" } : {};
}

const json = (status: number, body: unknown, headers: Record<string, string>) => Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
const ipOf = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "?";

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req.headers.get("origin")) });
}

export async function GET(req: Request) {
  const h = cors(req.headers.get("origin"));
  try {
    if (!(await rateLimit(`creator-get:${ipOf(req)}`, 60, 3_600_000))) return json(429, { error: "Too many tries" }, h);
    const c = await findCreator(new URL(req.url).searchParams.get("code"));
    return c ? json(200, c, h) : json(404, { error: "No such code" }, h);
  } catch {
    // No database yet: the app keeps the code pending and asks again later.
    return json(503, { error: "Not set up" }, h);
  }
}

export async function POST(req: Request) {
  const h = cors(req.headers.get("origin"));
  // Codes are short: a limit per address stops anyone guessing through them.
  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > 1000) return json(413, { error: "Too large" }, h);
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: "Not JSON" }, h);
  }
  try {
    if (!(await rateLimit(`creator-claim:${ipOf(req)}`, 30, 3_600_000))) return json(429, { error: "Too many tries" }, h);
    const r = await claimCode(body);
    return r.ok ? json(200, { code: r.code, name: r.name }, h) : json(r.status, { error: r.error }, h);
  } catch {
    return json(503, { error: "Not set up" }, h);
  }
}
