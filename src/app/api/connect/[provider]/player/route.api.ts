// GET /api/connect/sonos/player/?group=<id>: the lifter's Sonos groups and favourites, and what that group is
// playing. POST { group, command }: play, pause, skip, set or nudge the volume, or play a favourite. A lab
// (labSonos, docs/decisions/sonos.md); passed through to Sonos, never stored. Server build only.
import { checkSonosCommand, isSonosId } from "@/lib/cloud";
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { Unlinked } from "@/server/connect";
import { rateLimit } from "@/server/db";
import { Gone, sonosCommand, sonosState } from "@/server/sonos";

export const OPTIONS = preflight;

type Ctx = { params: Promise<{ provider: string }> };

function failed(req: Request, e: unknown): Response {
  if (e instanceof Unlinked) return reply(req, 409, { error: "unlinked" });
  if (e instanceof Gone) return reply(req, 410, { error: "gone" });
  return reply(req, 502, { error: "Sonos didn't answer. Try again later." });
}

export async function GET(req: Request, ctx: Ctx) {
  const { provider } = await ctx.params;
  if (provider !== "sonos") return reply(req, 404, { error: "Unknown service" });
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  if (!(await rateLimit(`sonos-state:${s.accountId}`, 600, 3_600_000).catch(() => true)))
    return reply(req, 429, { error: "Too many tries" });
  const group = new URL(req.url).searchParams.get("group");
  try {
    return reply(req, 200, await sonosState(s.accountId, isSonosId(group) ? group : null));
  } catch (e) {
    return failed(req, e);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  const { provider } = await ctx.params;
  if (provider !== "sonos") return reply(req, 404, { error: "Unknown service" });
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  // A long workout changes the volume twice a set; 900 an hour leaves room for skipping and nudging too.
  if (!(await rateLimit(`sonos:${s.accountId}`, 900, 3_600_000).catch(() => true))) return reply(req, 429, { error: "Too many tries" });
  const body = (await readJson(req)) as { group?: unknown; command?: unknown } | undefined;
  const command = checkSonosCommand(body?.command);
  if (!isSonosId(body?.group) || !command) return reply(req, 400, { error: "Bad command" });
  try {
    await sonosCommand(s.accountId, body.group, command);
    return reply(req, 200, { ok: true });
  } catch (e) {
    return failed(req, e);
  }
}
