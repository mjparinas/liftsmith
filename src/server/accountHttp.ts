// HTTP plumbing shared by the account and sync routes. The native shells call from their own origins with a
// Bearer token (no cookies), so CORS allows only those origins, and the website calls from its own.
import { NATIVE_ORIGINS } from "@/lib/feedbackServer";
import { sessionOf } from "./accounts";

export function cors(origin: string | null): Record<string, string> {
  return origin && NATIVE_ORIGINS.has(origin)
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400", Vary: "Origin" }
    : {};
}

export const reply = (req: Request, status: number, body: unknown) => Response.json(body, { status, headers: { "Cache-Control": "no-store", ...cors(req.headers.get("origin")) } });

export const preflight = (req: Request) => new Response(null, { status: 204, headers: cors(req.headers.get("origin")) });

export async function readJson(req: Request, max = 8_000): Promise<unknown | undefined> {
  if (Number(req.headers.get("content-length") ?? 0) > max) return undefined;
  try {
    const raw = await req.text();
    return raw.length > max ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Without a database the account routes answer 503, and the app keeps everything on the device. */
export const hasDb = () => !!(process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || process.env.NODE_ENV !== "production");

export async function signedIn(req: Request): Promise<{ accountId: string; session: string } | Response> {
  if (!hasDb()) return reply(req, 503, { error: "Accounts aren't set up yet." });
  const s = await sessionOf(req).catch(() => null);
  return s ?? reply(req, 401, { error: "Signed out. Sign in again." });
}
