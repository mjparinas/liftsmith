// GET /api/connect/concept2/results/?days=90&tz=-300: the lifter's Concept2 Logbook sessions (rows, ski and
// bike pieces), which the app saves as cardio workouts. Passed through, never stored. Server build only.
import { preflight, reply, signedIn } from "@/server/accountHttp";
import { concept2Results, Unlinked } from "@/server/connect";
import { rateLimit } from "@/server/db";

export const OPTIONS = preflight;

type Ctx = { params: Promise<{ provider: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { provider } = await ctx.params;
  if (provider !== "concept2") return reply(req, 404, { error: "Unknown service" });
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  if (!(await rateLimit(`results:${s.accountId}:${provider}`, 60, 3_600_000).catch(() => true)))
    return reply(req, 429, { error: "Too many tries" });
  const q = new URL(req.url).searchParams;
  const days = Math.min(365, Math.max(1, Number(q.get("days")) || 90));
  const tz = Math.min(840, Math.max(-720, Number(q.get("tz")) || 0));
  try {
    return reply(req, 200, { sessions: await concept2Results(s.accountId, days, tz) });
  } catch (e) {
    if (e instanceof Unlinked) return reply(req, 409, { error: "unlinked" });
    return reply(req, 502, { error: "The service didn't answer. Try again later." });
  }
}
