// POST /api/connect/strava/upload/: post one finished workout to Strava, once (a retry is a no-op). Server
// build only.
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { checkWorkout, postWorkout } from "@/server/connect";
import { rateLimit } from "@/server/db";

export const OPTIONS = preflight;

type Ctx = { params: Promise<{ provider: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { provider } = await ctx.params;
  if (provider !== "strava") return reply(req, 404, { error: "Unknown service" });
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  if (!(await rateLimit(`upload:${s.accountId}`, 60, 3_600_000).catch(() => true))) return reply(req, 429, { error: "Too many tries" });
  const w = checkWorkout(await readJson(req));
  if (!w) return reply(req, 400, { error: "Bad workout" });
  const r = await postWorkout(s.accountId, w);
  if (r === "unlinked") return reply(req, 409, { error: "unlinked" });
  if (r === "failed") return reply(req, 502, { error: "Strava didn't answer. Try again later." });
  return reply(req, 200, { ok: true });
}
