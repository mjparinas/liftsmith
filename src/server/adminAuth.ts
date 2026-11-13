// Sign-in for the admin panel (/admin/). Admins are separate from lifters' accounts: an admin signs in with a one-time
// link emailed through Resend to an address on ADMIN_EMAILS (or SUPPORT_EMAILS, read-only). The lists live in
// the environment, so nothing a request writes can make someone an admin. Without either list the panel and
// its API answer 404. Only hashes of links and session tokens are stored; every change is audited.
import { createHash, randomBytes } from "node:crypto";

import { query, rateLimit, run } from "./db";
import { passedSecondStep } from "./twoFactor";

export const COOKIE = "ls_admin";
const LINK_MS = 15 * 60_000;
/** A staff session ends after 30 days without use, and 90 days after its sign-in whatever happens (Melvin,
 *  2026-11-11: stay signed in for weeks). Each day of use pushes the 30 days forward again. */
export const ADMIN_IDLE_MS = 30 * 86_400_000;
export const ADMIN_MAX_MS = 90 * 86_400_000;
const RENEW_MS = 86_400_000;

const list = (v: string | undefined) =>
  new Set(
    (v ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@")),
  );
export const adminEmails = () => list(process.env.ADMIN_EMAILS);
export function supportEmails() {
  const admins = adminEmails();
  return new Set([...list(process.env.SUPPORT_EMAILS)].filter((e) => !admins.has(e)));
}
export type Role = "admin" | "support";
export const roleOf = (email: string): Role | null => (adminEmails().has(email) ? "admin" : supportEmails().has(email) ? "support" : null);

const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const token = () => randomBytes(32).toString("base64url");

const json = (status: number, body: unknown, headers: HeadersInit = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
/** The sign-in email's subject; the admin Inbox leaves these out (src/server/inbox.ts). */
export const ADMIN_LINK_SUBJECT = "Your Liftsmith admin sign-in link";
export const notFound = () => json(404, { error: "Not found" });

/** Requests that change something must come from our own pages. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") === "same-origin";
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

/** Starts a sign-in: emails a link if the address is on a list. Always answers the same, so the list can't be probed. */
export async function startSignIn(req: Request, email: string, send: typeof fetch = fetch, now = Date.now()): Promise<Response> {
  const e = email.trim().toLowerCase();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "?";
  if (!(await rateLimit(`admin-login:${ip}`, 10, 15 * 60_000, now)))
    return json(429, { error: "Too many tries. Wait 15 minutes and try again." });
  const sent = { ok: true, message: "If that address is an admin, a sign-in link is on its way. It works once, for 15 minutes." };
  if (!roleOf(e)) return json(200, sent);
  const t = token();
  await run("INSERT INTO admin_links (token_hash, email, expires_at) VALUES (?, ?, ?)", [hash(t), e, now + LINK_MS]);
  const link = `${new URL(req.url).origin}/api/admin/login/?token=${t}`;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Local development only: there's no email, so hand the link back.
    if (process.env.NODE_ENV !== "production") return json(200, { ...sent, devLink: link });
    return json(503, { error: "Email isn't set up (RESEND_API_KEY)." });
  }
  const r = await send("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.ADMIN_FROM ?? process.env.FEEDBACK_FROM ?? "Liftsmith admin <onboarding@resend.dev>",
      to: [e],
      subject: ADMIN_LINK_SUBJECT,
      text: `Sign in to the Liftsmith admin panel:\n\n${link}\n\nThe link works once, for 15 minutes. If you didn't ask for it, ignore this email.`,
    }),
  });
  if (!r.ok) return json(502, { error: "Couldn't send the email." });
  return json(200, sent);
}

/** Finishes a sign-in from the emailed link: sets the session cookie and goes to the panel. */
export async function finishSignIn(req: Request, now = Date.now()): Promise<Response> {
  const t = new URL(req.url).searchParams.get("token") ?? "";
  const rows = await query<{ email: string; expires_at: number; used_at: number | null }>(
    "SELECT email, expires_at, used_at FROM admin_links WHERE token_hash = ?",
    [hash(t)],
  );
  const link = rows[0];
  const back = (q: string) => new Response(null, { status: 303, headers: { Location: `/admin/${q}`, "Cache-Control": "no-store" } });
  if (!t || !link || link.used_at != null || Number(link.expires_at) < now || !roleOf(String(link.email))) {
    // A used or expired link for a staff address is noted for the System tab (and alerts when it repeats).
    if (link) await import("./alerts").then((a) => a.reportStaffFailure(String(link.email), "link", { now }));
    return back("?link=expired");
  }
  // One use only, in one statement: two requests racing with the same link can't both get a session.
  const used = await query("UPDATE admin_links SET used_at = ? WHERE token_hash = ? AND used_at IS NULL RETURNING email", [now, hash(t)]);
  if (!used.length) return back("?link=expired");
  const s = token();
  await run("INSERT INTO admin_sessions (token_hash, email, created_at, expires_at) VALUES (?, ?, ?, ?)", [
    hash(s),
    link.email,
    now,
    now + ADMIN_IDLE_MS,
  ]);
  await audit(String(link.email), "signin", null);
  const res = back("");
  res.headers.append("Set-Cookie", `${COOKIE}=${s}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${ADMIN_MAX_MS / 1000}`);
  return res;
}

function cookie(req: Request): string | null {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === COOKIE) return v.join("=");
  }
  return null;
}

export interface Staff {
  email: string;
  role: Role;
}

/** A signed-in staff session, whether or not it has passed the second step yet (src/server/twoFactor.ts). */
export interface StaffSession extends Staff {
  /** Hash of the session token, for the two-step routes. */
  sessionHash: string;
  twoFactor: boolean;
  /** Whether it has passed every sign-in step, so the panel may open. */
  ready: boolean;
}

export async function getStaffSession(req: Request, now = Date.now()): Promise<StaffSession | null> {
  const c = cookie(req);
  if (!c) return null;
  const rows = await query<{ email: string; created_at: number; expires_at: number; step_at: number | null; enabled_at: number | null }>(
    `SELECT s.email, s.created_at, s.expires_at, st.at AS step_at, t.enabled_at
     FROM admin_sessions s
     LEFT JOIN admin_session_steps st ON st.token_hash = s.token_hash
     LEFT JOIN admin_two_factor t ON t.email = s.email
     WHERE s.token_hash = ?`,
    [hash(c)],
  );
  const s = rows[0];
  // A browser that sent a cookie and is turned away is logged with the reason (never the token), so an early
  // sign-out can be traced in Vercel's logs: "unknown" means the database lost the session, the rest are rules.
  const ended = (why: string) => (console.warn(`[admin] session ended: ${why}`), null);
  if (!s) return ended("unknown");
  if (Number(s.expires_at) < now) return ended("idle 30 days");
  if (Number(s.created_at) + ADMIN_MAX_MS < now) return ended("90-day cap");
  // Taking an address off the list in the environment ends its sessions at once.
  const role = roleOf(String(s.email));
  if (!role) return ended("address no longer staff");
  // Sliding expiry: use pushes the idle limit forward, written at most once a day (never past the 90-day cap, which
  // the cookie's own Max-Age matches). A failed write only waits for the next request.
  const renewed = Math.min(now + ADMIN_IDLE_MS, Number(s.created_at) + ADMIN_MAX_MS);
  if (renewed - Number(s.expires_at) > RENEW_MS)
    await run("UPDATE admin_sessions SET expires_at = ? WHERE token_hash = ?", [renewed, hash(c)]).catch(() => 0);
  const twoFactor = s.enabled_at != null;
  return {
    email: String(s.email),
    role,
    sessionHash: hash(c),
    twoFactor,
    ready: passedSecondStep(twoFactor, s.step_at == null ? null : Number(s.step_at)),
  };
}

/** The staff member behind a request, once every sign-in step is passed. */
export async function getStaff(req: Request, now = Date.now()): Promise<Staff | null> {
  const s = await getStaffSession(req, now);
  return s?.ready ? { email: s.email, role: s.role } : null;
}

/** Guards an admin route: 404 for anyone else, so the API doesn't advertise itself. Changes need an admin. */
export async function requireStaff(req: Request, opts: { write?: boolean } = {}): Promise<{ staff: Staff } | { response: Response }> {
  if (req.method !== "GET" && !sameOrigin(req)) return { response: json(403, { error: "Bad origin" }) };
  let staff: Staff | null;
  try {
    staff = await getStaff(req);
  } catch {
    // The database didn't answer: say so, rather than a 404 the panel reads as "signed out".
    return { response: json(503, { error: "The database didn't answer. Try again in a moment." }) };
  }
  if (!staff || (opts.write && staff.role !== "admin")) return { response: notFound() };
  return { staff };
}

export async function signOut(req: Request): Promise<Response> {
  const c = cookie(req);
  if (c) {
    await run("DELETE FROM admin_sessions WHERE token_hash = ?", [hash(c)]);
    await run("DELETE FROM admin_session_steps WHERE token_hash = ?", [hash(c)]);
  }
  const res = json(200, { ok: true });
  res.headers.append("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
}

export async function audit(admin: string, action: string, target: string | null, detail?: unknown): Promise<void> {
  await run("INSERT INTO admin_audit (at, admin, action, target, detail) VALUES (?, ?, ?, ?, ?)", [
    Date.now(),
    admin,
    action,
    target,
    detail === undefined ? null : JSON.stringify(detail).slice(0, 2000),
  ]);
}

export { json };
