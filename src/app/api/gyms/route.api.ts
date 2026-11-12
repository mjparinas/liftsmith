// Find a gym near you (src/server/gymDirectory.ts, docs/decisions/gym-sharing.md). Server build only.
// GET ?lat=&lon=: listed gyms near a position the app already rounded to about 1 km. Anyone, rate-limited.
// POST {op}: publish, unpublish and mine need a signed-in account; added and report work signed out too.
import { hasDb, preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { sessionOf } from "@/server/accounts";
import { rateLimit } from "@/server/db";
import { added, addressKey, LIMITS, mine, nearby, publish, report, unpublish } from "@/server/gymDirectory";

export const OPTIONS = preflight;

const ipOf = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";

export async function GET(req: Request) {
  if (!hasDb()) return reply(req, 503, { error: "The gym list isn't set up yet." });
  if (!(await rateLimit(`gyms:search:${ipOf(req)}`, LIMITS.searchesPerHour, 3_600_000))) return reply(req, 429, { error: "slow" });
  const u = new URL(req.url).searchParams;
  const gyms = await nearby(Number(u.get("lat") ?? NaN), Number(u.get("lon") ?? NaN));
  if (!gyms) return reply(req, 400, { error: "Bad request." });
  return reply(req, 200, { gyms });
}

export async function POST(req: Request) {
  if (!hasDb()) return reply(req, 503, { error: "The gym list isn't set up yet." });
  const body = await readJson(req, 24_000);
  if (!body || typeof body !== "object") return reply(req, 400, { error: "Bad request." });
  const b = body as Record<string, unknown>;
  if (b.op === "added" || b.op === "report") {
    const s = await sessionOf(req).catch(() => null);
    const who = s ? `acc:${s.accountId}` : addressKey(ipOf(req));
    if (!(await rateLimit(`gyms:${b.op}:${who}`, 30, 3_600_000))) return reply(req, 429, { error: "slow" });
    if (b.op === "added") {
      await added(who, b.id);
      return reply(req, 200, { ok: true });
    }
    return (await report(who, b.id, b.reason)) ? reply(req, 200, { ok: true }) : reply(req, 400, { error: "Bad request." });
  }
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  switch (b.op) {
    case "publish": {
      const r = await publish(s.accountId, b);
      if (r.ok) return reply(req, 200, { id: r.id });
      return reply(req, r.error === "slow" ? 429 : r.error === "full" ? 409 : 400, { error: r.error });
    }
    case "unpublish":
      await unpublish(s.accountId, b.localId);
      return reply(req, 200, { ok: true });
    case "mine":
      return reply(req, 200, { gyms: await mine(s.accountId) });
    default:
      return reply(req, 400, { error: "Unknown op." });
  }
}
