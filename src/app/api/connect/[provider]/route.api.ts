// POST /api/connect/<service>/: a one-time sign-in link for Strava, Oura or Whoop (the app opens it in the
// browser). DELETE: disconnect (revoke at the service and forget the tokens). Server build only.
import { isCloud } from "@/lib/cloud";
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { platformOf } from "@/server/accounts";
import { disconnect, keys, start } from "@/server/connect";
import { rateLimit } from "@/server/db";

export const OPTIONS = preflight;

type Ctx = { params: Promise<{ provider: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { provider } = await ctx.params;
  if (!isCloud(provider)) return reply(req, 404, { error: "Unknown service" });
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  if (!keys(provider)) return reply(req, 503, { error: "notReady" });
  if (!(await rateLimit(`connect:${s.accountId}`, 30, 3_600_000).catch(() => true))) return reply(req, 429, { error: "Too many tries" });
  const body = (await readJson(req)) as { platform?: unknown } | undefined;
  const url = await start(s.accountId, provider, platformOf(body?.platform));
  return url ? reply(req, 200, { url }) : reply(req, 503, { error: "notReady" });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { provider } = await ctx.params;
  if (!isCloud(provider)) return reply(req, 404, { error: "Unknown service" });
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  await disconnect(s.accountId, provider);
  return reply(req, 200, { ok: true });
}
