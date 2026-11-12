// GET /api/connect/<oura|whoop|withings|polar>/daily/?days=45&tz=-300: the last days of sleep, HRV, resting heart rate,
// breathing rate, steps and (Withings) weigh-ins, one reading per metric per day. Passed through, never stored. Server build only.
import { isReadingCloud } from "@/lib/cloud";
import { preflight, reply, signedIn } from "@/server/accountHttp";
import { dailyReadings, Unlinked } from "@/server/connect";
import { rateLimit } from "@/server/db";

export const OPTIONS = preflight;

type Ctx = { params: Promise<{ provider: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { provider } = await ctx.params;
  if (!isReadingCloud(provider)) return reply(req, 404, { error: "Unknown service" });
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  if (!(await rateLimit(`daily:${s.accountId}:${provider}`, 60, 3_600_000).catch(() => true)))
    return reply(req, 429, { error: "Too many tries" });
  const q = new URL(req.url).searchParams;
  const days = Math.min(60, Math.max(1, Number(q.get("days")) || 45));
  const tz = Math.min(840, Math.max(-720, Number(q.get("tz")) || 0));
  try {
    return reply(req, 200, { readings: await dailyReadings(s.accountId, provider, days, tz) });
  } catch (e) {
    if (e instanceof Unlinked) return reply(req, 409, { error: "unlinked" });
    return reply(req, 502, { error: "The service didn't answer. Try again later." });
  }
}
