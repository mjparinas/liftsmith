// HTTP plumbing shared by the reminder routes: CORS for the native shells, a per-address rate limit,
// and the store and mailer for this server.
import { NATIVE_ORIGINS } from "@/lib/feedbackServer";

import { accountInfo, sessionOf } from "./accounts";
import { rateLimit } from "./db";
import { reminderEnv, resendMailer, type Env, type Mailer, type Store, type Verified } from "./reminders";
import { dbStore } from "./remindersDb";

export const MAX_BODY = 8_000;

export function cors(origin: string | null): Record<string, string> {
  return origin && NATIVE_ORIGINS.has(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        Vary: "Origin",
      }
    : {};
}

/** True when this address made `limit` requests to `route` in the last hour (shared across instances, db.ts). */
export async function limited(req: Request, route: string, limit: number): Promise<boolean> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "?";
  try {
    return !(await rateLimit(`reminders:${route}:${ip}`, limit, 3_600_000));
  } catch {
    return false; // the database is down: the handlers fail on their own
  }
}

export async function readJson(req: Request): Promise<unknown | undefined> {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return undefined;
  try {
    const raw = await req.text();
    return raw.length > MAX_BODY ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Form fields from a POSTed form (the confirm and unsubscribe pages) or the query string. */
export async function fields(req: Request): Promise<URLSearchParams> {
  const url = new URL(req.url);
  const out = new URLSearchParams(url.search);
  if (req.method === "POST") {
    try {
      const raw = await req.text();
      if (raw.length < 2000) for (const [k, v] of new URLSearchParams(raw)) out.set(k, v);
    } catch {}
  }
  return out;
}

export function setup(): { env: Env; store: Store; mail: Mailer } | null {
  const e = reminderEnv();
  if ("missing" in e) return null;
  return { env: e.env, store: dbStore(), mail: resendMailer(e.apiKey, e.from) };
}

export const html = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });

/** The signed-in account's verified email, when the request carries its session (Bearer token). Anything that
 *  goes wrong reads as signed out, which only means the address gets a confirmation email instead. */
export async function verifiedAccount(req: Request): Promise<Verified | null> {
  if (!req.headers.get("authorization")) return null;
  try {
    const s = await sessionOf(req);
    if (!s) return null;
    const a = await accountInfo(s.accountId);
    return a?.email ? { accountId: a.id, email: a.email } : null;
  } catch {
    return null;
  }
}
