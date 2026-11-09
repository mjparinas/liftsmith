// POST /api/auth/email/verify/ {email, code, platform}: signs in with the emailed code. Server build only.
import { cleanEmail, limited, platformOf, verifyEmail } from "@/server/accounts";
import { hasDb, preflight, readJson, reply } from "@/server/accountHttp";

export const OPTIONS = preflight;

export async function POST(req: Request) {
  if (!hasDb()) return reply(req, 503, { error: "Accounts aren't set up yet." });
  if (await limited(req, "verify", 30)) return reply(req, 429, { error: "Too many tries. Wait a few minutes." });
  const raw = (await readJson(req)) as { email?: unknown; code?: unknown; platform?: unknown } | undefined;
  const email = cleanEmail(raw?.email);
  if (!email || typeof raw?.code !== "string" || !/^\s*\d{6}\s*$/.test(raw.code)) return reply(req, 400, { error: "Enter the six-digit code." });
  const r = await verifyEmail(email, raw.code, platformOf(raw.platform));
  return reply(req, r.code, r.body);
}
