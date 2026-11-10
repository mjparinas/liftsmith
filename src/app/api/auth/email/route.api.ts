// POST /api/auth/email/ {email}: emails a six-digit sign-in code (Resend). Server build only.
import { hasDb, preflight, readJson, reply } from "@/server/accountHttp";
import { cleanEmail, limited, resendMail, startEmail } from "@/server/accounts";

export const OPTIONS = preflight;

export async function POST(req: Request) {
  if (!hasDb()) return reply(req, 503, { error: "Accounts aren't set up yet." });
  if (await limited(req, "email", 20)) return reply(req, 429, { error: "Too many tries. Wait a few minutes." });
  const raw = (await readJson(req)) as { email?: unknown } | undefined;
  const email = cleanEmail(raw?.email);
  if (!email) return reply(req, 400, { error: "Enter an email address." });
  const r = await startEmail(email, resendMail());
  return reply(req, r.code, r.body);
}
