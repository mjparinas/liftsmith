// POST /api/sync/: push this device's new events, deletes and records, pull the rest by cursor.
// Server build only. See src/server/sync.ts.
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { rateLimit } from "@/server/db";
import { checkSync, MAX_BODY, sync } from "@/server/sync";

export const OPTIONS = preflight;

export async function POST(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  if (!(await rateLimit(`sync:${s.accountId}`, 600, 3_600_000).catch(() => true)))
    return reply(req, 429, { error: "Too many syncs. Wait a few minutes." });
  const raw = await readJson(req, MAX_BODY);
  if (raw === undefined) return reply(req, 413, { error: "Too large" });
  const c = checkSync(raw);
  if (!c.ok) return reply(req, 400, { error: c.error });
  return reply(req, 200, await sync(s.accountId, s.session, c.body));
}
