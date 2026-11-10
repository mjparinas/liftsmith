// Checks the ID tokens Google and Apple hand the app after sign-in (RS256 JWTs). The signature is checked
// against the provider's published keys, then the issuer, the audience (our own client ids), the expiry and
// the nonce. Only then is the token's subject trusted as the person's id at that provider.
import { createHash, createPublicKey, verify, type webcrypto } from "node:crypto";
import { APPLE_SERVICES_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "@/lib/authIds";

export type Provider = "google" | "apple";

export interface Claims {
  iss: string;
  aud: string;
  sub: string;
  exp: number;
  iat?: number;
  email?: string;
  email_verified?: boolean | string;
  nonce?: string;
}

const ISSUERS: Record<Provider, string[]> = {
  google: ["https://accounts.google.com", "accounts.google.com"],
  apple: ["https://appleid.apple.com"],
};
const KEYS_URL: Record<Provider, string> = {
  google: "https://www.googleapis.com/oauth2/v3/certs",
  apple: "https://appleid.apple.com/auth/keys",
};

type Jwk = webcrypto.JsonWebKey & { kid?: string };
type Fetch = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;
const cache = new Map<Provider, { at: number; keys: Jwk[] }>();

async function keys(p: Provider, get: Fetch, now: number, fresh = false): Promise<Jwk[]> {
  const c = cache.get(p);
  if (c && !fresh && now - c.at < 3_600_000) return c.keys;
  const r = await get(KEYS_URL[p]);
  if (!r.ok) throw new Error("keys");
  const body = (await r.json()) as { keys?: Jwk[] };
  const list = Array.isArray(body.keys) ? body.keys : [];
  cache.set(p, { at: now, keys: list });
  return list;
}

/** For tests: forget the cached keys. */
export const clearKeys = () => cache.clear();

const b64 = (s: string) => Buffer.from(s, "base64url");

export const sha256hex = (s: string) => createHash("sha256").update(s).digest("hex");

/** Client ids the tokens may be issued to, from the environment (comma lists), plus the public ones the app is built with. */
export function audiences(p: Provider, env: NodeJS.ProcessEnv = process.env): Set<string> {
  const raw =
    p === "google"
      ? [env.GOOGLE_CLIENT_IDS, env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID, env.NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID]
      : [env.APPLE_CLIENT_IDS, env.NEXT_PUBLIC_APPLE_SERVICES_ID, APPLE_SERVICES_ID, "com.getliftsmith.app"];
  return new Set(
    raw
      .flatMap((v) => (v ?? "").split(","))
      .map((v) => v.trim())
      .filter(Boolean),
  );
}

/**
 * Verifies a provider's ID token. `nonce` is the raw value the app made; the provider was given its SHA-256
 * (hex), so the token must carry that hash. Returns the claims, or a short reason it was refused.
 */
export async function verifyIdToken(
  p: Provider,
  token: string,
  nonce: string,
  opts: { aud?: Set<string>; get?: Fetch; now?: number } = {},
): Promise<{ ok: true; claims: Claims } | { ok: false; error: string }> {
  const now = opts.now ?? Date.now();
  const get = opts.get ?? ((u: string) => fetch(u));
  const aud = opts.aud ?? audiences(p);
  const parts = token.split(".");
  if (parts.length !== 3 || token.length > 8000) return { ok: false, error: "malformed" };
  let header: { alg?: string; kid?: string };
  let claims: Claims;
  try {
    header = JSON.parse(b64(parts[0]).toString("utf8"));
    claims = JSON.parse(b64(parts[1]).toString("utf8"));
  } catch {
    return { ok: false, error: "malformed" };
  }
  if (header.alg !== "RS256" || !header.kid) return { ok: false, error: "alg" };
  let list = await keys(p, get, now);
  let jwk = list.find((k) => k.kid === header.kid);
  if (!jwk) {
    // The provider rotated its keys since we cached them.
    list = await keys(p, get, now, true);
    jwk = list.find((k) => k.kid === header.kid);
  }
  if (!jwk) return { ok: false, error: "kid" };
  const good = verify("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), createPublicKey({ key: jwk, format: "jwk" }), b64(parts[2]));
  if (!good) return { ok: false, error: "signature" };
  if (!ISSUERS[p].includes(claims.iss)) return { ok: false, error: "issuer" };
  if (!aud.has(claims.aud)) return { ok: false, error: "audience" };
  if (typeof claims.exp !== "number" || claims.exp * 1000 < now - 60_000) return { ok: false, error: "expired" };
  if (typeof claims.sub !== "string" || !claims.sub) return { ok: false, error: "subject" };
  if (!nonce || claims.nonce !== sha256hex(nonce)) return { ok: false, error: "nonce" };
  return { ok: true, claims };
}

/** The token's email, only when the provider says it's verified. */
export function verifiedEmail(c: Claims): string | null {
  const ok = c.email_verified === true || c.email_verified === "true";
  return ok && typeof c.email === "string" && c.email.includes("@") ? c.email.trim().toLowerCase() : null;
}
