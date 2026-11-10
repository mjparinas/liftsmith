// POST /api/auth/apple/ {idToken, nonce, code?, platform}: signs in with Apple and returns a session token.
// Server build only. See src/server/accounts.ts.
import { hasDb, preflight, readJson, reply } from "@/server/accountHttp";
import { limited, platformOf, signInWith } from "@/server/accounts";

export const OPTIONS = preflight;

export async function POST(req: Request) {
  if (!hasDb()) return reply(req, 503, { error: "Accounts aren't set up yet." });
  if (await limited(req, "apple", 30)) return reply(req, 429, { error: "Too many tries. Wait a few minutes." });
  const raw = (await readJson(req, 16_000)) as { idToken?: unknown; nonce?: unknown; code?: unknown; platform?: unknown } | undefined;
  if (typeof raw?.idToken !== "string" || typeof raw.nonce !== "string" || raw.nonce.length > 200)
    return reply(req, 400, { error: "Bad request" });
  const r = await signInWith("apple", {
    idToken: raw.idToken,
    nonce: raw.nonce,
    code: typeof raw.code === "string" ? raw.code.slice(0, 1000) : undefined,
    platform: platformOf(raw.platform),
  });
  return reply(req, r.code, r.body);
}
