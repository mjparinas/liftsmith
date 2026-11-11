// Friends and the workout feed (src/server/social.ts, docs/decisions/friends.md). Signed in only. Server build only.
// POST {op, ...}: one route for every action, so the phones need one CORS-allowed path.
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { flagsFor } from "@/server/flags";
import { handle } from "@/server/social";

export const OPTIONS = preflight;

export async function POST(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  // The admin panel's switch turns Friends off for everyone at once.
  const flags = await flagsFor(null).catch(() => null);
  if (flags && flags.social === false) return reply(req, 503, { error: "off" });
  const body = await readJson(req, 16_000);
  if (body === undefined) return reply(req, 413, { error: "Too big." });
  const r = await handle(s.accountId, body);
  return reply(req, r.code, r.body);
}
