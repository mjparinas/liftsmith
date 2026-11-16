// GET /api/connect/<concept2|garmin>/results/?days=90&tz=-300: the lifter's Concept2 Logbook sessions (rows, ski
// and bike pieces) or Garmin runs, rides and indoor rows, which the app saves as cardio workouts. Concept2's are
// passed through; Garmin's were kept when Garmin pinged us (connect.ts garminPing). Server build only.
import { isCardioCloud } from "@/lib/cloud";
import { preflight, reply, signedIn } from "@/server/accountHttp";
import { cardioResults, Unlinked } from "@/server/connect";
import { rateLimit } from "@/server/db";

export const OPTIONS = preflight;

type Ctx = { params: Promise<{ provider: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { provider } = await ctx.params;
  if (!isCardioCloud(provider)) return reply(req, 404, { error: "Unknown service" });
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  if (!(await rateLimit(`results:${s.accountId}:${provider}`, 60, 3_600_000).catch(() => true)))
    return reply(req, 429, { error: "Too many tries" });
  const q = new URL(req.url).searchParams;
  const days = Math.min(365, Math.max(1, Number(q.get("days")) || 90));
  const tz = Math.min(840, Math.max(-720, Number(q.get("tz")) || 0));
  try {
    return reply(req, 200, { sessions: await cardioResults(s.accountId, provider, days, tz) });
  } catch (e) {
    if (e instanceof Unlinked) return reply(req, 409, { error: "unlinked" });
    return reply(req, 502, { error: "The service didn't answer. Try again later." });
  }
}
