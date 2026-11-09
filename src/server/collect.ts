// Storing usage analytics from the app and page views from the site. The routes
// (src/app/api/collect/route.api.ts, src/app/api/pv/route.api.ts) only add HTTP; this is tested directly.
import { createHash, createHmac } from "node:crypto";
import type { Batch, PageView } from "@/lib/analyticsSchema";
import { referrerHost } from "@/lib/analyticsSchema";
import { batch as runBatch, query, run } from "./db";

const DAY = 86_400_000;

export interface Where {
  country?: string;
  region?: string;
}

/** Vercel's geo headers: country and region only, never a city or the address itself. */
export function whereFrom(headers: Headers): Where {
  const country = headers.get("x-vercel-ip-country")?.slice(0, 2).toUpperCase();
  const region = headers.get("x-vercel-ip-country-region")?.slice(0, 8);
  return { ...(country && /^[A-Z]{2}$/.test(country) ? { country } : {}), ...(region ? { region } : {}) };
}

/** Saves a checked batch: upserts the install, stores each event once, and mirrors purchases. */
export async function storeBatch(b: Batch, where: Where, now = Date.now()): Promise<{ stored: number }> {
  const c = b.context;
  const a = c.acquisition ?? {};
  const firstAt = b.events.reduce((m, e) => Math.min(m, e.at), now);
  // When the install was last used is the latest event's time, not when a queued batch arrived.
  const lastAt = b.events.length ? Math.min(now, b.events.reduce((m, e) => Math.max(m, e.at), 0)) : now;
  // First touch wins for acquisition fields (COALESCE keeps what's there); device details follow the latest batch.
  const stmts: { sql: string; args: (string | number | null)[] }[] = [
    {
      sql: `INSERT INTO installs (id, first_seen, last_seen, platform, app_version, first_version, build, os, os_version, manufacturer, model, form_factor, locale, time_zone, screen, country, region,
              store, source, medium, campaign, content, term, referrer, landing, reduced_motion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              first_seen = MIN(first_seen, excluded.first_seen), last_seen = MAX(last_seen, excluded.last_seen),
              app_version = excluded.app_version, build = excluded.build, os = excluded.os, os_version = excluded.os_version,
              manufacturer = excluded.manufacturer, model = excluded.model, form_factor = excluded.form_factor, locale = excluded.locale,
              time_zone = excluded.time_zone, screen = excluded.screen, reduced_motion = excluded.reduced_motion,
              country = COALESCE(excluded.country, country), region = COALESCE(excluded.region, region),
              store = COALESCE(store, excluded.store), source = COALESCE(source, excluded.source), medium = COALESCE(medium, excluded.medium),
              campaign = COALESCE(campaign, excluded.campaign), content = COALESCE(content, excluded.content), term = COALESCE(term, excluded.term),
              referrer = COALESCE(referrer, excluded.referrer), landing = COALESCE(landing, excluded.landing)`,
      args: [
        c.installId, firstAt, lastAt, c.platform, c.appVersion, c.appVersion, c.build ?? null, c.os ?? null, c.osVersion ?? null, c.manufacturer ?? null, c.model ?? null,
        c.formFactor ?? null, c.locale ?? null, c.timeZone ?? null, c.screen ?? null, where.country ?? null, where.region ?? null,
        a.store ?? null, a.source ?? null, a.medium ?? null, a.campaign ?? null, a.content ?? null, a.term ?? null, a.referrer ?? null, a.landing ?? null,
        c.reducedMotion == null ? null : c.reducedMotion ? 1 : 0,
      ],
    },
  ];
  for (const e of b.events) {
    stmts.push({
      sql: "INSERT OR IGNORE INTO events (id, install_id, name, at, received_at, platform, app_version, props) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [e.id, c.installId, e.name, e.at, now, c.platform, c.appVersion, e.props ? JSON.stringify(e.props) : null],
    });
    if (e.name === "trial_start" || e.name === "purchase") {
      const p = e.props ?? {};
      const kind = e.name === "trial_start" ? "trial_start" : "purchase";
      const price = typeof p.price === "number" ? Math.round(p.price * 1_000_000) : null;
      const currency = typeof p.currency === "string" ? p.currency.toUpperCase().slice(0, 3) : null;
      stmts.push({
        sql: "INSERT OR IGNORE INTO subscription_events (id, at, install_id, store, kind, plan, price_micros, currency, usd_micros, country, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'app')",
        args: [e.id, e.at, c.installId, String(p.store ?? a.store ?? c.platform), kind, typeof p.plan === "string" ? p.plan : null, price, currency, currency === "USD" ? price : null, where.country ?? null],
      });
    }
  }
  await runBatch(stmts);
  if (a.asaToken) void resolveSearchAds(c.installId, a.asaToken);
  return { stored: b.events.length };
}

/**
 * Apple Search Ads: trades the AdServices token for the campaign that brought the install (once per install).
 * Apple answers 404 for an install no ad led to. No ATT is needed for this.
 */
export async function resolveSearchAds(installId: string, token: string, post: typeof fetch = fetch): Promise<void> {
  try {
    const rows = await query<{ asa_campaign: string | null }>("SELECT asa_campaign FROM installs WHERE id = ?", [installId]);
    if (rows[0]?.asa_campaign) return;
    const r = await post("https://api-adservices.apple.com/api/v1/", { method: "POST", headers: { "Content-Type": "text/plain" }, body: token, signal: AbortSignal.timeout(5000) });
    let answer: string;
    if (r.status === 404) answer = "none";
    else if (r.ok) {
      const j = (await r.json()) as { attribution?: boolean; campaignId?: number; keywordId?: number };
      answer = j.attribution ? `asa:${j.campaignId ?? "?"}${j.keywordId ? `:${j.keywordId}` : ""}` : "none";
    } else return;
    await run("UPDATE installs SET asa_campaign = ? WHERE id = ?", [answer, installId]);
  } catch {
    // Try again with the next batch.
  }
}

// ---------- Website ----------

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor/i;

export function parseUa(ua: string): { device: string; browser: string; os: string; bot: boolean } {
  const bot = BOT.test(ua);
  const device = /iPad|Tablet/.test(ua) ? "tablet" : /Mobi|iPhone|Android/.test(ua) ? "mobile" : "desktop";
  const browser = /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Firefox\//.test(ua) ? "Firefox" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Other";
  const os = /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /CrOS/.test(ua) ? "ChromeOS" : /Linux/.test(ua) ? "Linux" : "Other";
  return { device, browser, os, bot };
}

/** A daily visitor hash: the same browser counts once a day, and the hash can't be tied across days or reversed. */
export function visitorHash(ip: string, ua: string, now = Date.now()): string {
  const day = Math.floor(now / DAY);
  const salt = createHmac("sha256", process.env.ANALYTICS_SECRET || process.env.ADMIN_SECRET || "liftsmith-analytics").update(String(day)).digest();
  return createHash("sha256").update(salt).update(ip).update("\n").update(ua).digest("base64url").slice(0, 22);
}

export async function storePageView(pv: PageView, req: { ip: string; ua: string; ownHost?: string } & Where, now = Date.now()): Promise<void> {
  const ua = parseUa(req.ua);
  const ref = referrerHost(pv.referrer, req.ownHost);
  await run(
    `INSERT INTO page_views (at, day, visitor, path, kind, cta, referrer, source, medium, campaign, country, device, browser, os, bot)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [now, Math.floor(now / DAY), visitorHash(req.ip, req.ua, now), pv.path, pv.cta ? "cta" : "view", pv.cta ?? null, ref ?? null, pv.utm?.source ?? null, pv.utm?.medium ?? null, pv.utm?.campaign ?? null, req.country ?? null, ua.device, ua.browser, ua.os, ua.bot ? 1 : 0],
  );
}
