// POST /api/sync/: push this device's new events, deletes and records, pull the rest by cursor.
// Server build only. See src/server/sync.ts.
import { linkInstall } from "@/server/access";
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { accountAccess } from "@/server/accounts";
import { alertTrained } from "@/server/coach";
import { rateLimit } from "@/server/db";
import { settleReferral } from "@/server/earnedPro";
import { checkSync, MAX_BODY, sync, SyncFull } from "@/server/sync";

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
  try {
    // The install that synced counts its store subscription (if any) for the account (access.ts).
    await linkInstall(s.accountId, (raw as { installId?: unknown }).installId).catch(() => null);
    // `pro`, `proVia` and `sub`: the account's Pro from any source (the review account, a lifetime code, the web or a
    // phone's store), so every device learns it or loses it on sync.
    const out = await sync(s.accountId, s.session, c.body);
    // A friend who joined through an invite may just have finished their third workout (earnedPro.ts).
    if (c.body.events.some((e) => (e as { type?: unknown }).type === "sessionEnd")) {
      await settleReferral(s.accountId).catch(() => false);
      // A client's coaches hear about a workout just finished (trainer-mode.md).
      await alertTrained(s.accountId, c.body.events as { type?: unknown; at?: unknown }[]).catch(() => undefined);
    }
    const a = await accountAccess(s.accountId);
    return reply(req, 200, { ...out, pro: a.pro, proVia: a.proVia, sub: a.sub });
  } catch (e) {
    // The client shows its own "storage full" line for this error (account.syncFull).
    if (e instanceof SyncFull) return reply(req, 413, { error: "full" });
    throw e;
  }
}
