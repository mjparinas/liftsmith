// Loads what the admin panel's numbers are computed from (src/lib/adminMetrics.ts). Installs marked as test
// devices (the owner's phones, CI) are left out of every number.
import { computeMetrics, type Counted, type InstallFacts, type MetricsInput, type SubEvent } from "@/lib/adminMetrics";

import { query } from "./db";

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const REAL = "install_id NOT IN (SELECT id FROM installs WHERE test = 1)";

const n = (v: unknown) => Number(v ?? 0);
const s = (v: unknown) => (v == null ? null : String(v));
const counted = (rows: { key: unknown; n: unknown }[]): Counted[] => rows.map((r) => ({ key: s(r.key) ?? "(none)", n: n(r.n) }));

const activeSince = (from: number, to: number) =>
  query<{ n: number }>(`SELECT COUNT(DISTINCT install_id) AS n FROM events WHERE at > ? AND at <= ? AND ${REAL}`, [from, to]);

export async function loadMetricsInput(days: number, now = Date.now()): Promise<MetricsInput> {
  const since = now - days * DAY;
  const prevSince = since - days * DAY;
  const today = Math.floor(now / DAY);
  const firstDay = today - days + 1;

  const [installs, active, dau, wau, mau, daily, steps, screens, features, permissions, workouts, cohortRows, subs, launch, prevWorkouts] =
    await Promise.all([
      query(
        `SELECT i.*,
         (SELECT MIN(at) FROM events e WHERE e.install_id = i.id AND e.name = 'onboarding_complete') AS onboarded,
         (SELECT MIN(at) FROM events e WHERE e.install_id = i.id AND e.name = 'workout_start') AS first_workout,
         (SELECT COUNT(*) FROM events e WHERE e.install_id = i.id AND e.name = 'workout_finish') AS workouts,
         (SELECT MIN(at) FROM events e WHERE e.install_id = i.id AND e.name = 'paywall_view') AS paywall,
         (SELECT MIN(at) FROM events e WHERE e.install_id = i.id AND e.name = 'trial_recap') AS recap,
         (SELECT COUNT(*) FROM events e, (SELECT MIN(at) AS t FROM subscription_events s WHERE s.install_id = i.id AND s.kind = 'trial_start') ts
           WHERE e.install_id = i.id AND e.name = 'workout_finish' AND ts.t IS NOT NULL AND e.at >= ts.t AND e.at < ts.t + ${14 * DAY}) AS trial_workouts
       FROM installs i WHERE i.test = 0 AND (i.first_seen >= ? OR i.last_seen >= ?)`,
        [Math.min(prevSince, now - 400 * DAY), since],
      ),
      query(
        `SELECT CAST(at / ${DAY} AS INTEGER) AS day, platform, COUNT(DISTINCT install_id) AS n FROM events WHERE at >= ? AND at <= ? AND ${REAL} GROUP BY day, platform`,
        [firstDay * DAY, now],
      ),
      activeSince(now - DAY, now),
      activeSince(now - 7 * DAY, now),
      activeSince(now - 30 * DAY, now),
      query(`SELECT CAST(at / ${DAY} AS INTEGER) AS day, name, COUNT(*) AS n FROM events WHERE at >= ? AND ${REAL} GROUP BY day, name`, [
        since,
      ]),
      query(
        `SELECT CAST(json_extract(props, '$.step') AS INTEGER) AS step, json_extract(props, '$.name') AS name, COUNT(DISTINCT install_id) AS n
       FROM events WHERE name = 'onboarding_step' AND at >= ? AND ${REAL} GROUP BY step, name`,
        [since],
      ),
      query(
        `SELECT json_extract(props, '$.screen') AS key, COUNT(*) AS n FROM events WHERE name = 'screen_view' AND at >= ? AND ${REAL} GROUP BY key ORDER BY n DESC LIMIT 20`,
        [since],
      ),
      query(
        `SELECT json_extract(props, '$.name') || COALESCE(' · ' || json_extract(props, '$.detail'), '') AS key, COUNT(DISTINCT install_id) AS n
       FROM events WHERE name = 'feature' AND at >= ? AND ${REAL} GROUP BY key ORDER BY n DESC LIMIT 30`,
        [since],
      ),
      query(
        `SELECT json_extract(props, '$.name') AS key, SUM(CASE WHEN json_extract(props, '$.granted') THEN 1 ELSE 0 END) AS granted, SUM(CASE WHEN json_extract(props, '$.granted') THEN 0 ELSE 1 END) AS denied
       FROM events WHERE name = 'permission' AND at >= ? AND ${REAL} GROUP BY key`,
        [since],
      ),
      query(
        `SELECT CAST(at / ${DAY} AS INTEGER) AS day, COUNT(*) AS n, SUM(COALESCE(json_extract(props, '$.minutes'), 0)) AS minutes, SUM(COALESCE(json_extract(props, '$.sets'), 0)) AS sets,
         SUM(CASE WHEN json_extract(props, '$.auto') THEN 1 ELSE 0 END) AS auto, SUM(COALESCE(json_extract(props, '$.prs'), 0)) AS prs
       FROM events WHERE name = 'workout_finish' AND at >= ? AND ${REAL} GROUP BY day`,
        [since],
      ),
      query(
        `SELECT e.install_id AS id, i.first_seen, CAST((e.at - i.first_seen) / ${WEEK} AS INTEGER) AS w
       FROM events e JOIN installs i ON i.id = e.install_id
       WHERE i.test = 0 AND i.first_seen >= ? AND e.at >= i.first_seen GROUP BY e.install_id, w`,
        [now - 12 * WEEK],
      ),
      query(`SELECT * FROM subscription_events WHERE install_id IS NULL OR ${REAL} ORDER BY at`),
      query<{ at: number | null }>("SELECT MIN(first_seen) AS at FROM installs WHERE test = 0 AND store IN ('play', 'appstore')"),
      query<{ n: number }>(`SELECT COUNT(*) AS n FROM events WHERE name = 'workout_finish' AND at >= ? AND at < ? AND ${REAL}`, [
        prevSince,
        since,
      ]),
    ]);

  const byInstall = new Map<string, { firstSeen: number; weeks: number[] }>();
  for (const r of cohortRows) {
    const id = String(r.id);
    const row = byInstall.get(id) ?? { firstSeen: n(r.first_seen), weeks: [] };
    row.weeks.push(n(r.w));
    byInstall.set(id, row);
  }
  // Installs with no event after the first still count in their cohort.
  for (const i of installs)
    if (n(i.first_seen) >= now - 12 * WEEK && !byInstall.has(String(i.id)))
      byInstall.set(String(i.id), { firstSeen: n(i.first_seen), weeks: [0] });

  return {
    now,
    days,
    launchAt: process.env.LAUNCH_DATE ? Date.parse(process.env.LAUNCH_DATE) || null : launch[0]?.at == null ? null : n(launch[0].at),
    installs: installs.map((i): InstallFacts => ({
      id: String(i.id),
      firstSeen: n(i.first_seen),
      lastSeen: n(i.last_seen),
      platform: String(i.platform),
      store: s(i.store),
      source: s(i.source),
      medium: s(i.medium),
      campaign: s(i.campaign),
      referrer: s(i.referrer),
      country: s(i.country),
      os: s(i.os),
      osVersion: s(i.os_version),
      manufacturer: s(i.manufacturer),
      model: s(i.model),
      appVersion: s(i.app_version),
      formFactor: s(i.form_factor),
      locale: s(i.locale),
      asaCampaign: s(i.asa_campaign),
      onboarded: i.onboarded == null ? null : n(i.onboarded),
      firstWorkout: i.first_workout == null ? null : n(i.first_workout),
      workouts: n(i.workouts),
      paywall: i.paywall == null ? null : n(i.paywall),
      trialWorkouts: n(i.trial_workouts),
      recap: i.recap == null ? null : n(i.recap),
    })),
    active: active.map((r) => ({ day: n(r.day), platform: String(r.platform), n: n(r.n) })),
    dau: n(dau[0]?.n),
    wau: n(wau[0]?.n),
    mau: n(mau[0]?.n),
    daily: daily.map((r) => ({ day: n(r.day), name: String(r.name), n: n(r.n) })),
    steps: steps.map((r) => ({ step: n(r.step), name: s(r.name) ?? "", n: n(r.n) })),
    screens: counted(screens as { key: unknown; n: unknown }[]),
    features: counted(features as { key: unknown; n: unknown }[]),
    permissions: permissions.map((r) => ({ key: s(r.key) ?? "(none)", granted: n(r.granted), denied: n(r.denied) })),
    workouts: workouts.map((r) => ({ day: n(r.day), n: n(r.n), minutes: n(r.minutes), sets: n(r.sets), auto: n(r.auto), prs: n(r.prs) })),
    prevWorkouts: n(prevWorkouts[0]?.n),
    cohortWeeks: [...byInstall.entries()].map(([id, v]) => ({ id, ...v })),
    subs: subs.map((e): SubEvent => ({
      id: String(e.id),
      at: n(e.at),
      installId: s(e.install_id),
      subscription: s(e.subscription),
      store: String(e.store),
      kind: String(e.kind),
      plan: s(e.plan),
      usd: e.usd_micros == null ? null : n(e.usd_micros) / 1e6,
      priceLocal: e.price_micros == null ? null : n(e.price_micros) / 1e6,
      currency: s(e.currency),
      reason: s(e.reason),
    })),
    site: await loadSite(days, now),
  };
}

async function loadSite(days: number, now: number): Promise<MetricsInput["site"]> {
  const today = Math.floor(now / DAY);
  const from = today - days + 1;
  const prevFrom = from - days;
  const views = "kind = 'view' AND bot = 0";
  const top = (col: string, limit = 15) =>
    query<{ key: unknown; n: unknown }>(
      `SELECT ${col} AS key, COUNT(DISTINCT visitor || '/' || day) AS n FROM page_views WHERE day >= ? AND ${views} GROUP BY key ORDER BY n DESC LIMIT ${limit}`,
      [from],
    ).then(counted);
  const [daily, totals, prev, pages, referrers, sources, campaigns, countries, devices, browsers, os, ctas] = await Promise.all([
    query(`SELECT day, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS views FROM page_views WHERE day >= ? AND ${views} GROUP BY day`, [
      from,
    ]),
    query(`SELECT COUNT(DISTINCT visitor || '/' || day) AS visitors, COUNT(*) AS views FROM page_views WHERE day >= ? AND ${views}`, [
      from,
    ]),
    query(
      `SELECT COUNT(DISTINCT visitor || '/' || day) AS visitors, COUNT(*) AS views FROM page_views WHERE day >= ? AND day < ? AND ${views}`,
      [prevFrom, from],
    ),
    query<{ key: unknown; n: unknown }>(
      `SELECT path AS key, COUNT(*) AS n FROM page_views WHERE day >= ? AND ${views} GROUP BY key ORDER BY n DESC LIMIT 20`,
      [from],
    ).then(counted),
    top("COALESCE(referrer, '(direct)')"),
    top("COALESCE(source || COALESCE(' / ' || medium, ''), '(untagged)')"),
    top("campaign"),
    top("country", 20),
    top("device"),
    top("browser"),
    top("os"),
    query(
      `SELECT cta AS key, path, COUNT(*) AS n FROM page_views WHERE day >= ? AND kind = 'cta' AND bot = 0 GROUP BY cta, path ORDER BY n DESC LIMIT 30`,
      [from],
    ),
  ]);
  return {
    daily: daily.map((r) => ({ day: n(r.day), visitors: n(r.visitors), views: n(r.views) })),
    visitors: n(totals[0]?.visitors),
    views: n(totals[0]?.views),
    prevVisitors: n(prev[0]?.visitors),
    prevViews: n(prev[0]?.views),
    pages,
    referrers,
    sources,
    campaigns: campaigns.filter((c) => c.key !== "(none)"),
    countries,
    devices,
    browsers,
    os,
    ctas: ctas.map((r) => ({ key: s(r.key) ?? "", path: s(r.path) ?? "", n: n(r.n) })),
    ctaTotal: ctas.reduce((t, r) => t + n(r.n), 0),
  };
}

export async function adminMetrics(days: number, now = Date.now()) {
  return computeMetrics(await loadMetricsInput(days, now));
}

/** The latest installs, for the Installs tab (device and source, never anything the lifter typed). */
export interface InstallFilter {
  /** Part of an install id, a device, a source or a campaign. */
  q?: string;
  /** play, appstore or web (the store an install came from). */
  store?: string;
  /** Two-letter country code. */
  country?: string;
  /** Real installs only, test devices only, or both (the default). */
  test?: "real" | "test";
  /** Only installs that finished at least one workout. */
  worked?: boolean;
  /** Paging: installs first seen before this time. */
  before?: number;
  limit?: number;
}

/** The latest installs, newest first, filtered for the Installs tab; `next` is the cursor for "Load more". */
export async function recentInstalls(f: InstallFilter = {}) {
  const limit = Math.min(Math.max(f.limit ?? 100, 1), 200);
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    where.push(
      "(i.id LIKE ? ESCAPE '\\' OR i.model LIKE ? ESCAPE '\\' OR i.manufacturer LIKE ? ESCAPE '\\' OR i.source LIKE ? ESCAPE '\\' OR i.campaign LIKE ? ESCAPE '\\' OR i.referrer LIKE ? ESCAPE '\\')",
    );
    args.push(like, like, like, like, like, like);
  }
  if (f.store === "web") where.push("(i.store = 'web' OR (i.store IS NULL AND i.platform = 'web'))");
  else if (f.store === "play") where.push("(i.store = 'play' OR (i.store IS NULL AND i.platform = 'android'))");
  else if (f.store === "appstore") where.push("(i.store IN ('appstore', 'testflight') OR (i.store IS NULL AND i.platform = 'ios'))");
  if (f.country) {
    where.push("i.country = ?");
    args.push(f.country);
  }
  if (f.test) where.push(f.test === "test" ? "i.test = 1" : "i.test = 0");
  if (f.worked) where.push("EXISTS (SELECT 1 FROM events e WHERE e.install_id = i.id AND e.name = 'workout_finish')");
  if (f.before != null) {
    where.push("i.first_seen < ?");
    args.push(f.before);
  }
  const rows = await query(
    `SELECT i.id, i.first_seen, i.last_seen, i.platform, i.store, i.app_version, i.os, i.os_version, i.manufacturer, i.model, i.country, i.locale, i.source, i.medium, i.campaign, i.referrer, i.asa_campaign, i.test,
       (SELECT COUNT(*) FROM events e WHERE e.install_id = i.id) AS events,
       (SELECT COUNT(*) FROM events e WHERE e.install_id = i.id AND e.name = 'workout_finish') AS workouts
     FROM installs i ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY i.first_seen DESC LIMIT ?`,
    [...args, limit + 1],
  );
  const installs = rows.slice(0, limit).map((r) => ({
    id: String(r.id),
    firstSeen: n(r.first_seen),
    lastSeen: n(r.last_seen),
    platform: String(r.platform),
    store: s(r.store),
    appVersion: s(r.app_version),
    device: [s(r.manufacturer), s(r.model)].filter(Boolean).join(" ") || null,
    os: [s(r.os), s(r.os_version)].filter(Boolean).join(" ") || null,
    country: s(r.country),
    locale: s(r.locale),
    source:
      [s(r.source), s(r.medium), s(r.campaign)].filter(Boolean).join(" / ") ||
      s(r.referrer) ||
      (s(r.asa_campaign) !== "none" ? s(r.asa_campaign) : null),
    test: n(r.test) === 1,
    events: n(r.events),
    workouts: n(r.workouts),
  }));
  return { installs, next: rows.length > limit ? installs[installs.length - 1]!.firstSeen : null };
}

/** The countries installs came from, most first, for the Installs tab's filter. */
export async function installCountries(): Promise<string[]> {
  const rows = await query("SELECT country FROM installs WHERE country IS NOT NULL GROUP BY country ORDER BY COUNT(*) DESC LIMIT 60");
  return rows.map((r) => String(r.country));
}

export interface AuditFilter {
  /** Staff email. */
  who?: string;
  /** An action, or the start of one ("2fa" matches 2fa.enable and 2fa.verify). */
  action?: string;
  /** Paging: entries older than this id. */
  before?: number;
  limit?: number;
}

/** The change log, newest first, with `next` for "Load more"; `people` and `actions` fill the filters. */
export async function auditLog(f: AuditFilter = {}) {
  const limit = Math.min(Math.max(f.limit ?? 100, 1), 500);
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (f.who) {
    where.push("admin = ?");
    args.push(f.who);
  }
  if (f.action) {
    where.push("(action = ? OR action LIKE ? ESCAPE '\\')");
    args.push(f.action, `${f.action.replace(/[%_\\]/g, (c) => `\\${c}`)}.%`);
  }
  if (f.before != null) {
    where.push("id < ?");
    args.push(f.before);
  }
  const [rows, people, actions] = await Promise.all([
    query(
      `SELECT id, at, admin, action, target, detail FROM admin_audit ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY id DESC LIMIT ?`,
      [...args, limit + 1],
    ),
    query("SELECT admin FROM admin_audit GROUP BY admin ORDER BY MAX(id) DESC LIMIT 50"),
    query("SELECT action FROM admin_audit GROUP BY action ORDER BY action LIMIT 200"),
  ]);
  const audit = rows.slice(0, limit).map((r) => ({
    id: n(r.id),
    at: n(r.at),
    admin: String(r.admin),
    action: String(r.action),
    target: s(r.target),
    detail: s(r.detail),
  }));
  return {
    audit,
    next: rows.length > limit ? audit[audit.length - 1]!.id : null,
    people: people.map((r) => String(r.admin)),
    actions: actions.map((r) => String(r.action)),
  };
}
