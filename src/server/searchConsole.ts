// The admin Traffic tab's Google Search part, ported from Gradelings (src/server/traffic.ts). Search Console is read
// on the server through a service account with the read-only scope (webmasters.readonly), so no credential reaches
// the browser. Results are cached for 10 minutes per period; a failed read isn't kept.
import { createSign } from "node:crypto";

import { periodDates, SEARCH_LAG_DAYS, type SearchPart, type SearchPeriod, type SearchRow, type SitemapInfo } from "@/lib/searchConsole";

const TIMEOUT = 10_000;
const DAY = 86_400_000;
export const SEARCH_CACHE_MS = 10 * 60_000;
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
/** The property to read when SEARCH_CONSOLE_SITE isn't set: the getliftsmith.com domain property. */
export const DEFAULT_SITE = "sc-domain:getliftsmith.com";

const env = (name: string) => process.env[name]?.trim() || "";

async function fetchJson<T>(service: string, url: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT) });
  } catch (e) {
    throw new Error((e as Error).name === "TimeoutError" ? `${service} didn't answer in time.` : `Couldn't reach ${service}.`);
  }
  if (!res.ok) {
    let why = "";
    try {
      const body = (await res.json()) as { error?: { message?: string } | string; error_description?: string };
      why = typeof body.error === "string" ? (body.error_description ?? body.error) : (body.error?.message ?? "");
    } catch {
      // No JSON body: the status is enough.
    }
    throw new Error(`${service} answered ${res.status}${why ? `: ${why.slice(0, 200)}` : "."}`);
  }
  return (await res.json()) as T;
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

export const SEARCH_SETUP =
  "Set GOOGLE_SERVICE_ACCOUNT_KEY in Vercel to a Google Cloud service account's JSON key (as is, or base64), and add that service account's email to the getliftsmith.com property in Search Console as a Restricted user. SEARCH_CONSOLE_SITE is optional (default sc-domain:getliftsmith.com).";

/** The key from the environment, as JSON or base64 JSON; null when it isn't set or can't be read. */
export function serviceAccount(): ServiceAccount | null {
  const raw = env("GOOGLE_SERVICE_ACCOUNT_KEY");
  if (!raw) return null;
  for (const text of [raw, Buffer.from(raw, "base64").toString("utf8")]) {
    try {
      const k = JSON.parse(text) as Partial<ServiceAccount>;
      if (typeof k.client_email === "string" && typeof k.private_key === "string")
        return { client_email: k.client_email, private_key: k.private_key.replace(/\\n/g, "\n") };
    } catch {
      // Try the next reading.
    }
  }
  return null;
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

/** A signed JWT asking Google for a read-only Search Console token (RS256, one hour). */
export function signedAssertion(key: ServiceAccount, now = Date.now()): string {
  const iat = Math.floor(now / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: key.client_email, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${head}.${claims}`);
  return `${head}.${claims}.${b64url(signer.sign(key.private_key))}`;
}

let token: { value: string; until: number; email: string } | null = null;

async function accessToken(key: ServiceAccount, now: number): Promise<string> {
  if (token && token.email === key.client_email && token.until > now + 60_000) return token.value;
  const body = new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: signedAssertion(key, now) });
  const r = await fetchJson<{ access_token: string; expires_in: number }>("Google sign-in", TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  token = { value: r.access_token, until: now + r.expires_in * 1000, email: key.client_email };
  return r.access_token;
}

interface GscRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export async function searchReport(days: SearchPeriod, now = Date.now()): Promise<SearchPart> {
  const key = serviceAccount();
  const site = env("SEARCH_CONSOLE_SITE") || DEFAULT_SITE;
  if (!key)
    return {
      state: "setup",
      setup: env("GOOGLE_SERVICE_ACCOUNT_KEY") ? `GOOGLE_SERVICE_ACCOUNT_KEY can't be read as a JSON key. ${SEARCH_SETUP}` : SEARCH_SETUP,
    };
  try {
    const bearer = await accessToken(key, now);
    const base = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}`;
    const headers = { authorization: `Bearer ${bearer}`, "content-type": "application/json", accept: "application/json" };
    const d = periodDates(days, now, SEARCH_LAG_DAYS);
    const query = (startDate: string, endDate: string, dimensions: string[], rowLimit = 10) =>
      fetchJson<{ rows?: GscRow[] }>("Search Console", `${base}/searchAnalytics/query`, {
        method: "POST",
        headers,
        body: JSON.stringify({ startDate, endDate, dimensions, rowLimit, dataState: "final" }),
      }).then((r) => r.rows ?? []);
    const [totals, previous, daily, queries, pages, countries, devices, maps] = await Promise.all([
      query(d.start, d.end, []),
      query(d.prevStart, d.prevEnd, []),
      query(d.start, d.end, ["date"], 400),
      // More searches than are listed, so the near-miss list has something to pick from.
      query(d.start, d.end, ["query"], 100),
      query(d.start, d.end, ["page"]),
      query(d.start, d.end, ["country"]),
      query(d.start, d.end, ["device"]),
      fetchJson<{
        sitemap?: { path: string; lastDownloaded?: string; errors?: string; warnings?: string; contents?: { submitted?: string }[] }[];
      }>("Search Console", `${base}/sitemaps`, { headers }),
    ]);
    const sum = (rows: GscRow[]) => ({
      clicks: rows[0]?.clicks ?? 0,
      impressions: rows[0]?.impressions ?? 0,
      ctr: rows[0]?.ctr ?? 0,
      position: rows[0]?.position ?? 0,
    });
    const row = (r: GscRow): SearchRow => ({
      key: r.keys?.[0] ?? "",
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    });
    const byDate = new Map(daily.map((r) => [r.keys?.[0] ?? "", r]));
    const dates: string[] = [];
    for (let t = Date.parse(d.start); t <= Date.parse(d.end); t += DAY) dates.push(new Date(t).toISOString().slice(0, 10));
    const sitemaps: SitemapInfo[] = (maps.sitemap ?? []).map((m) => ({
      path: m.path,
      lastDownloaded: m.lastDownloaded ? Date.parse(m.lastDownloaded) : null,
      errors: Number(m.errors ?? 0),
      warnings: Number(m.warnings ?? 0),
      submitted: (m.contents ?? []).reduce((n, c) => n + Number(c.submitted ?? 0), 0),
    }));
    return {
      state: "ok",
      report: {
        site,
        start: d.start,
        end: d.end,
        totals: sum(totals),
        previous: sum(previous),
        daily: dates.map((date) => ({ date, clicks: byDate.get(date)?.clicks ?? 0, impressions: byDate.get(date)?.impressions ?? 0 })),
        queries: queries.map(row),
        pages: pages.map(row),
        countries: countries.map(row),
        devices: devices.map(row),
        sitemaps,
      },
    };
  } catch (e) {
    return { state: "error", error: (e as Error).message };
  }
}

// One entry per period. The promise is kept, so two requests at the same time call Google once.
const cache = new Map<SearchPeriod, { at: number; value: Promise<SearchPart> }>();

/** Search Console for the last `days`, kept for 10 minutes unless `refresh`. */
export function searchPart(days: SearchPeriod, opts: { refresh?: boolean; now?: number } = {}): Promise<SearchPart> {
  const now = opts.now ?? Date.now();
  const hit = cache.get(days);
  if (!opts.refresh && hit && now - hit.at < SEARCH_CACHE_MS) return hit.value;
  const value = searchReport(days, now);
  cache.set(days, { at: now, value });
  // A failed read isn't kept, so the next look tries again.
  void value.then((p) => p.state === "error" && cache.get(days)?.value === value && cache.delete(days));
  return value;
}

/** For tests. */
export function clearSearchCache() {
  cache.clear();
  token = null;
}
