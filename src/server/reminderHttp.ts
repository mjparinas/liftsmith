// HTTP plumbing shared by the reminder routes: CORS for the native shells, a per-address rate limit,
// and the store and mailer for this server.
import { NATIVE_ORIGINS } from "@/lib/feedbackServer";
import { reminderEnv, resendMailer, type Env, type Mailer, type Store } from "./reminders";
import { dbStore } from "./remindersDb";

export const MAX_BODY = 8_000;

export function cors(origin: string | null): Record<string, string> {
  return origin && NATIVE_ORIGINS.has(origin) ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" } : {};
}

const hits = new Map<string, number[]>();
/** True when this address made `limit` requests in the last hour (per server instance). */
export function limited(req: Request, limit: number, now = Date.now()): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "?";
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= limit) return true;
  hits.set(ip, [...recent, now]);
  return false;
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

export const html = (body: string, status = 200) => new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
