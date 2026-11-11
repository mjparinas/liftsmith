// POST /api/creator/redeem/ {code}, signed in: redeems a lifetime code for the account (src/server/creators.ts,
// docs/decisions/marketing-and-growth.md). 200 {ok, code, pro: true}; 404 no such code; 409 a live code that
// isn't a lifetime one (the app applies it the usual way) or the account already has another; 410 ended or used up.
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { redeemLifetime } from "@/server/creators";
import { rateLimit } from "@/server/db";

export const OPTIONS = preflight;

const ipOf = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "?";

export async function POST(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  // Codes are short: limits per account and per address stop anyone guessing through them.
  const okAccount = await rateLimit(`redeem:${s.accountId}`, 20, 3_600_000).catch(() => true);
  const okIp = await rateLimit(`redeem-ip:${ipOf(req)}`, 30, 3_600_000).catch(() => true);
  if (!okAccount || !okIp) return reply(req, 429, { error: "Too many tries" });
  const body = await readJson(req, 1000);
  const code = body && typeof body === "object" ? (body as Record<string, unknown>).code : undefined;
  const r = await redeemLifetime(s.accountId, code);
  return r.ok ? reply(req, 200, { ok: true, code: r.code, pro: true }) : reply(req, r.status, { error: r.error, held: r.held });
}
