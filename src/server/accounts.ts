// Optional accounts (AGENTS.md "Accounts and sign-in"). An account exists only to sync and back up the
// lifter's own data; the app works fully without one. Sign-in is Google, Apple, or a six-digit code sent by
// email. Each method is an identity on the account, and methods with the same verified email land on the
// same account. The device gets a random session token; the server keeps only its hash.
import { createHash, createPrivateKey, randomBytes, randomInt, sign } from "node:crypto";

import { forgetAll } from "./connect";
import { hasLifetimePro } from "./creators";
import { batch, query, rateLimit, run } from "./db";
import { verifiedEmail, verifyIdToken, type Claims, type Provider } from "./idToken";
import { accountHasPro, isReviewEmail, reviewCodeMatches } from "./review";

export const SESSION_MS = 365 * 86_400_000;
const CODE_MS = 10 * 60_000;
const CODE_TRIES = 5;
const CODES_A_DAY = 5;

const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const token = () => randomBytes(32).toString("base64url");
const newId = () => randomBytes(12).toString("base64url");

export interface AccountInfo {
  id: string;
  email: string | null;
  providers: string[];
  createdAt: number;
  /** Pro that comes with the account, not a store purchase: the store review account (review.ts) or a lifetime code. */
  pro: boolean;
}

export type Platform = "web" | "android" | "ios";
export const platformOf = (v: unknown): Platform => (v === "android" || v === "ios" ? v : "web");

export async function accountInfo(id: string): Promise<AccountInfo | null> {
  const rows = await query<{ email: string | null; created_at: number }>("SELECT email, created_at FROM accounts WHERE id = ?", [id]);
  if (!rows[0]) return null;
  const ids = await query<{ provider: string }>("SELECT DISTINCT provider FROM account_identities WHERE account_id = ? ORDER BY provider", [
    id,
  ]);
  const email = rows[0].email ? String(rows[0].email) : null;
  return {
    id,
    email,
    providers: ids.map((r) => String(r.provider)),
    createdAt: Number(rows[0].created_at),
    pro: accountHasPro(email) || (await hasLifetimePro(id)),
  };
}

/** Whether the account has Pro on the server (not from a store purchase). Sync sends it on every round. */
export async function accountPro(id: string): Promise<boolean> {
  const rows = await query<{ email: string | null }>("SELECT email FROM accounts WHERE id = ?", [id]);
  return accountHasPro(rows[0]?.email ? String(rows[0].email) : null) || (await hasLifetimePro(id));
}

/** Finds or makes the account for an identity, joining accounts by verified email. */
async function accountFor(
  provider: string,
  subject: string,
  email: string | null,
  now: number,
  extra: { appleRefresh?: string | null } = {},
): Promise<string> {
  const known = await query<{ account_id: string }>("SELECT account_id FROM account_identities WHERE provider = ? AND subject = ?", [
    provider,
    subject,
  ]);
  if (known[0]) {
    const id = String(known[0].account_id);
    if (extra.appleRefresh)
      await run("UPDATE account_identities SET apple_refresh = ? WHERE provider = ? AND subject = ?", [
        extra.appleRefresh,
        provider,
        subject,
      ]);
    return id;
  }
  let id: string | null = null;
  if (email) {
    const same = await query<{ id: string }>("SELECT id FROM accounts WHERE email = ? ORDER BY created_at LIMIT 1", [email]);
    id = same[0] ? String(same[0].id) : null;
  }
  const stmts = [];
  if (!id) {
    id = newId();
    stmts.push({ sql: "INSERT INTO accounts (id, email, created_at, last_seen) VALUES (?, ?, ?, ?)", args: [id, email, now, now] });
  }
  stmts.push({
    sql: "INSERT INTO account_identities (provider, subject, account_id, email, created_at, apple_refresh) VALUES (?, ?, ?, ?, ?, ?)",
    args: [provider, subject, id, email, now, extra.appleRefresh ?? null],
  });
  await batch(stmts);
  return id;
}

async function startSession(accountId: string, platform: Platform, now: number): Promise<{ token: string; account: AccountInfo }> {
  const t = token();
  await run(
    "INSERT INTO account_sessions (token_hash, account_id, created_at, expires_at, last_seen, platform) VALUES (?, ?, ?, ?, ?, ?)",
    [hash(t), accountId, now, now + SESSION_MS, now, platform],
  );
  await run("UPDATE accounts SET last_seen = ? WHERE id = ?", [now, accountId]);
  return { token: t, account: (await accountInfo(accountId))! };
}

export type Result = { code: number; body: Record<string, unknown> };

export interface ProviderInput {
  idToken: string;
  nonce: string;
  /** Apple's one-time authorization code, exchanged for a refresh token so deleting the account can revoke it. */
  code?: string;
  platform: Platform;
}

export interface Deps {
  verify?: typeof verifyIdToken;
  appleRefresh?: (code: string, clientId: string) => Promise<string | null>;
  now?: number;
}

export async function signInWith(p: Provider, input: ProviderInput, deps: Deps = {}): Promise<Result> {
  const now = deps.now ?? Date.now();
  const v = await (deps.verify ?? verifyIdToken)(p, input.idToken, input.nonce);
  if (!v.ok) return { code: 401, body: { error: "That sign-in didn't work. Try again.", reason: v.error } };
  const c: Claims = v.claims;
  // Google always has a verified email; Apple gives one (perhaps a private relay address) on first sign-in.
  const email = verifiedEmail(c);
  let refresh: string | null = null;
  if (p === "apple" && input.code) refresh = await (deps.appleRefresh ?? appleRefreshToken)(input.code, c.aud).catch(() => null);
  const id = await accountFor(p, c.sub, email, now, { appleRefresh: refresh });
  return { code: 200, body: await startSession(id, input.platform, now) };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const cleanEmail = (v: unknown): string | null => {
  const e = typeof v === "string" ? v.trim().toLowerCase() : "";
  return e.length <= 254 && EMAIL_RE.test(e) ? e : null;
};

export type SendMail = (to: string, subject: string, text: string) => Promise<boolean>;

export function resendMail(): SendMail | null {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || process.env.FEEDBACK_FROM;
  if (!key || !from) return null;
  return async (to, subject, text) => {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    return r.ok;
  };
}

/** Emails a six-digit sign-in code. Answers the same whether or not the address has an account. */
export async function startEmail(email: string, mail: SendMail | null, now = Date.now()): Promise<Result> {
  // The store review account signs in with its fixed code (review.ts): nothing to send, and nothing is sent.
  if (isReviewEmail(email)) return { code: 200, body: { ok: true } };
  const rows = await query<{ sent: number; window_start: number }>("SELECT sent, window_start FROM account_codes WHERE email = ?", [email]);
  const r = rows[0];
  const fresh = !r || Number(r.window_start) < now - 86_400_000;
  const sent = fresh ? 0 : Number(r.sent);
  if (sent >= CODES_A_DAY) return { code: 429, body: { error: "Too many codes for this address today. Try again tomorrow." } };
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await run(
    `INSERT INTO account_codes (email, code_hash, expires_at, tries, sent, window_start) VALUES (?, ?, ?, 0, ?, ?)
     ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, tries = 0, sent = excluded.sent, window_start = excluded.window_start`,
    [email, hash(`${email}:${code}`), now + CODE_MS, sent + 1, fresh ? now : Number(r!.window_start)],
  );
  const text = `Your Liftsmith sign-in code is ${code}\n\nType it in the app to sign in. It works once, for 10 minutes.\n\nIf you didn't ask for it, ignore this email: nobody can sign in without the code.\n\nLiftsmith · https://www.getliftsmith.com`;
  if (!mail) {
    // Local development only: there's no email, so hand the code back.
    if (process.env.NODE_ENV !== "production") return { code: 200, body: { ok: true, devCode: code } };
    return { code: 503, body: { error: "Email sign-in isn't set up yet." } };
  }
  const ok = await mail(email, `${code} is your Liftsmith sign-in code`, text).catch(() => false);
  if (!ok) return { code: 502, body: { error: "Couldn't send the email. Try again in a minute." } };
  return { code: 200, body: { ok: true } };
}

export async function verifyEmail(email: string, code: string, platform: Platform, now = Date.now()): Promise<Result> {
  // The store review account: its fixed code from Vercel, reusable, for this one address only (review.ts).
  // Guesses are held back by the verify route's per-network limit and the code's 12+ digits (a trillion or more).
  // No limit on the address itself, on purpose: anyone could then lock the store reviewers out mid-review.
  if (isReviewEmail(email)) {
    if (!reviewCodeMatches(email, code)) return { code: 401, body: { error: "That code didn't match." } };
    const id = await accountFor("email", email, email, now);
    return { code: 200, body: await startSession(id, platform, now) };
  }
  const rows = await query<{ code_hash: string; expires_at: number; tries: number }>(
    "SELECT code_hash, expires_at, tries FROM account_codes WHERE email = ?",
    [email],
  );
  const r = rows[0];
  const wrong = { code: 401, body: { error: "That code didn't match. Check the latest email, or ask for a new code." } };
  if (!r || Number(r.expires_at) < now || Number(r.tries) >= CODE_TRIES)
    return { code: 401, body: { error: "That code has expired. Ask for a new one." } };
  // Count the try before comparing, in one statement, so parallel guesses can't all pass the tries check.
  const counted = await query(
    "UPDATE account_codes SET tries = tries + 1 WHERE email = ? AND tries < ? AND expires_at >= ? RETURNING tries",
    [email, CODE_TRIES, now],
  );
  if (!counted.length) return { code: 401, body: { error: "That code has expired. Ask for a new one." } };
  if (hash(`${email}:${code.trim()}`) !== String(r.code_hash)) return wrong;
  // One use only: whoever clears it first gets the session.
  const used = await query(
    "UPDATE account_codes SET expires_at = 0 WHERE email = ? AND code_hash = ? AND expires_at >= ? RETURNING email",
    [email, r.code_hash, now],
  );
  if (!used.length) return { code: 401, body: { error: "That code has expired. Ask for a new one." } };
  const id = await accountFor("email", email, email, now);
  return { code: 200, body: await startSession(id, platform, now) };
}

/** The signed-in account behind a request's Bearer token. */
export async function sessionOf(req: Request, now = Date.now()): Promise<{ accountId: string; session: string } | null> {
  const auth = req.headers.get("authorization") ?? "";
  const t = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!t || t.length > 200) return null;
  const h = hash(t);
  const rows = await query<{ account_id: string; expires_at: number; last_seen: number }>(
    "SELECT account_id, expires_at, last_seen FROM account_sessions WHERE token_hash = ?",
    [h],
  );
  const s = rows[0];
  if (!s || Number(s.expires_at) < now) return null;
  // Sliding expiry, written at most once a day.
  if (now - Number(s.last_seen) > 86_400_000) {
    await run("UPDATE account_sessions SET last_seen = ?, expires_at = ? WHERE token_hash = ?", [now, now + SESSION_MS, h]);
    await run("UPDATE accounts SET last_seen = ? WHERE id = ?", [now, s.account_id]);
  }
  return { accountId: String(s.account_id), session: h };
}

export async function signOut(session: string): Promise<void> {
  await run("DELETE FROM account_sessions WHERE token_hash = ?", [session]);
}

/** Deletes the account and everything synced to it, and revokes Apple's token (Apple requires both). */
export async function deleteAccount(accountId: string, revoke: (refresh: string) => Promise<unknown> = appleRevoke): Promise<void> {
  const apple = await query<{ apple_refresh: string | null }>(
    "SELECT apple_refresh FROM account_identities WHERE account_id = ? AND provider = 'apple'",
    [accountId],
  );
  for (const a of apple) if (a.apple_refresh) await Promise.resolve(revoke(String(a.apple_refresh))).catch(() => null);
  // Connected apps (Strava, Oura, Whoop): revoked at each service and forgotten.
  await forgetAll(accountId).catch(() => null);
  await batch([
    { sql: "DELETE FROM sync_events WHERE account_id = ?", args: [accountId] },
    { sql: "DELETE FROM sync_records WHERE account_id = ?", args: [accountId] },
    { sql: "DELETE FROM account_sessions WHERE account_id = ?", args: [accountId] },
    { sql: "DELETE FROM account_identities WHERE account_id = ?", args: [accountId] },
    { sql: "DELETE FROM account_notes WHERE account_id = ?", args: [accountId] },
    { sql: "DELETE FROM accounts WHERE id = ?", args: [accountId] },
  ]);
}

// --- Sign in with Apple's REST API: the client secret, the code exchange and revoking on delete. ---

/** APPLE_TEAM_ID, APPLE_KEY_ID and APPLE_PRIVATE_KEY (a Sign in with Apple .p8 key). Without them nothing is exchanged or revoked. */
export function appleClientSecret(clientId: string, env: NodeJS.ProcessEnv = process.env, now = Date.now()): string | null {
  const team = env.APPLE_TEAM_ID;
  const kid = env.APPLE_KEY_ID;
  const pem = env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!team || !kid || !pem) return null;
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const iat = Math.floor(now / 1000);
  const data = `${enc({ alg: "ES256", kid })}.${enc({ iss: team, iat, exp: iat + 300, aud: "https://appleid.apple.com", sub: clientId })}`;
  const sig = sign("sha256", Buffer.from(data), { key: createPrivateKey(pem), dsaEncoding: "ieee-p1363" });
  return `${data}.${sig.toString("base64url")}`;
}

async function appleRefreshToken(code: string, clientId: string): Promise<string | null> {
  const secret = appleClientSecret(clientId);
  if (!secret) return null;
  const r = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: secret, code, grant_type: "authorization_code" }),
  });
  if (!r.ok) return null;
  const body = (await r.json()) as { refresh_token?: string };
  // Kept with the client id it belongs to, which revoking needs.
  return body.refresh_token ? `${clientId} ${body.refresh_token}` : null;
}

async function appleRevoke(stored: string): Promise<void> {
  const [clientId, refresh] = stored.split(" ");
  const secret = clientId && refresh ? appleClientSecret(clientId) : null;
  if (!secret) return;
  await fetch("https://appleid.apple.com/auth/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: secret, token: refresh, token_type_hint: "refresh_token" }),
  });
}

/** A per-address hourly limit for the sign-in routes (shared across instances). */
export async function limited(req: Request, route: string, limit: number): Promise<boolean> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "?";
  try {
    return !(await rateLimit(`auth:${route}:${ip}`, limit, 3_600_000));
  } catch {
    return false;
  }
}
