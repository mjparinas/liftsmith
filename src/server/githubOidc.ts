// Checks the OIDC token a GitHub Actions run hands us (docs/decisions/pinterest.md "No secret to set up"). The pin
// maker runs in this repo's own "Pins" workflow, which asks GitHub for a short-lived token with our audience; GitHub signs
// it (RS256) and says which repository, workflow and branch the run came from. We take uploads only from this repo's
// pins.yml on main or staging, never a pull request, so a fork or a pull request's run can't put anything in the queue,
// and nobody has to copy a secret into GitHub and Vercel.
import { createPublicKey, verify, type webcrypto } from "node:crypto";

import { SITE_URL } from "@/lib/site";

export const ISSUER = "https://token.actions.githubusercontent.com";
const KEYS_URL = `${ISSUER}/.well-known/jwks`;
export const REPO = "mjparinas/liftsmith";
export const PINS_AUDIENCE = `${SITE_URL}/pins`;
/** The one workflow file allowed, on the branches that only merged work reaches. */
export const ALLOWED_WORKFLOWS = ["main", "staging"].map((b) => `${REPO}/.github/workflows/pins.yml@refs/heads/${b}`);

export interface ActionsClaims {
  iss: string;
  aud: string | string[];
  exp: number;
  repository: string;
  workflow_ref: string;
  event_name: string;
  ref: string;
}

type Jwk = webcrypto.JsonWebKey & { kid?: string };
type Fetch = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;
let cache: { at: number; keys: Jwk[] } | null = null;
export const clearActionsKeys = () => {
  cache = null;
};

async function keys(get: Fetch, now: number, fresh = false): Promise<Jwk[]> {
  if (cache && !fresh && now - cache.at < 3_600_000) return cache.keys;
  const r = await get(KEYS_URL);
  if (!r.ok) throw new Error("keys");
  const body = (await r.json()) as { keys?: Jwk[] };
  cache = { at: now, keys: Array.isArray(body.keys) ? body.keys : [] };
  return cache.keys;
}

const b64 = (s: string) => Buffer.from(s, "base64url");

/** The token from an `Authorization: Bearer` header, checked; or a short reason it was refused. */
export async function verifyActionsToken(
  token: string,
  opts: { get?: Fetch; now?: number; audience?: string } = {},
): Promise<{ ok: true; claims: ActionsClaims } | { ok: false; error: string }> {
  const now = opts.now ?? Date.now();
  const get = opts.get ?? ((u: string) => fetch(u));
  const parts = token.split(".");
  if (parts.length !== 3 || token.length > 8000) return { ok: false, error: "malformed" };
  let header: { alg?: string; kid?: string };
  let claims: ActionsClaims;
  try {
    header = JSON.parse(b64(parts[0]!).toString("utf8"));
    claims = JSON.parse(b64(parts[1]!).toString("utf8"));
  } catch {
    return { ok: false, error: "malformed" };
  }
  if (header.alg !== "RS256" || !header.kid) return { ok: false, error: "alg" };
  let jwk = (await keys(get, now)).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await keys(get, now, true)).find((k) => k.kid === header.kid);
  if (!jwk) return { ok: false, error: "kid" };
  const good = verify("RSA-SHA256", Buffer.from(`${parts[0]}.${parts[1]}`), createPublicKey({ key: jwk, format: "jwk" }), b64(parts[2]!));
  if (!good) return { ok: false, error: "signature" };
  if (claims.iss !== ISSUER) return { ok: false, error: "issuer" };
  const aud = opts.audience ?? PINS_AUDIENCE;
  if (!(Array.isArray(claims.aud) ? claims.aud.includes(aud) : claims.aud === aud)) return { ok: false, error: "audience" };
  if (typeof claims.exp !== "number" || claims.exp * 1000 < now - 30_000) return { ok: false, error: "expired" };
  if (claims.repository !== REPO) return { ok: false, error: "repository" };
  if (!ALLOWED_WORKFLOWS.includes(claims.workflow_ref)) return { ok: false, error: "workflow" };
  if (claims.event_name !== "schedule" && claims.event_name !== "workflow_dispatch") return { ok: false, error: "event" };
  return { ok: true, claims };
}

export function bearer(req: Request): string {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}
