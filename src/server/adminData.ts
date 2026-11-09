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

const activeSince = (from: number, to: number) => query<{ n: number }>(`SELECT COUNT(DISTINCT install_id) AS n FROM events WHERE at > ? AND at <= ? AND ${REAL}`, [from, to]);

export async function loadMetricsInput(days: number, now = Date.now()): Promise<MetricsInput> {
  const since = now - days * DAY;
  const prevSince = since - days * DAY;
  const today = Math.floor(now / DAY);
  const firstDay = today - days + 1;

  const [installs, active, dau, wau, mau, daily, steps, screens, features, permissions, workouts, cohortRows, subs, launch] = await Promise.all([
    query(
      `SELECT i.*,
         (SELECT MIN(at) FROM events e WHERE e.install_id = i.id AND e.name = 'onboarding_complete') AS onboarded,
         (SELECT MIN(at) FROM events e WHERE e.install_id = i.id AND e.name = 'workout_start') AS first_workout,
         (SELECT COUNT(*) FROM events e WHERE e.install_id = i.id AND e.name = 'workout_finish') AS workouts,
         (SELECT MIN(at) FROM events e WHERE e.install_id = i.id AND e.name = 'paywall_view') AS paywall
       FROM installs i WHERE i.test = 0 AND (i.first_seen >= ? OR i.last_seen >= ?)`,
      [Math.min(prevSince, now - 400 * DAY), since],
    ),
    query(`SELECT CAST(at / ${DAY} AS INTEGER) AS day, platform, COUNT(DISTINCT install_id) AS n FROM events WHERE at >= ? AND at <= ? AND ${REAL} GROUP BY day, platform`, [firstDay * DAY, now]),
    activeSince(now - DAY, now),
    activeSince(now - 7 * DAY, now),
    activeSince(now - 30 * DAY, now),
    query(`SELECT CAST(at / ${DAY} AS INTEGER) AS day, name, COUNT(*) AS n FROM events WHERE at >= ? AND ${REAL} GROUP BY day, name`, [since]),
    query(
      `SELECT CAST(json_extract(props, '$.step') AS INTEGER) AS step, json_extract(props, '$.name') AS name, COUNT(DISTINCT install_id) AS n
       FROM events WHERE name = 'onboarding_step' AND at >= ? AND ${REAL} GROUP BY step, name`,
      [since],
    ),
    query(`SELECT json_extract(props, '$.screen') AS key, COUNT(*) AS n FROM events WHERE name = 'screen_view' AND at >= ? AND ${REAL} GROUP BY key ORDER BY n DESC LIMIT 20`, [since]),
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
  ]);

  const byInstall = new Map<string, { firstSeen: number; weeks: number[] }>();
  for (const r of cohortRows) {
    const id = String(r.id);
    const row = byInstall.get(id) ?? { firstSeen: n(r.first_seen), weeks: [] };
    row.weeks.push(n(r.w));
    byInstall.set(id, row);
  }
  // Installs with no event after the first still count in their cohort.
  for (const i of installs) if (n(i.first_seen) >= now - 12 * WEEK && !byInstall.has(String(i.id))) byInstall.set(String(i.id), { firstSeen: n(i.first_seen), weeks: [0] });

  return {
    now,
    days,
    launchAt: process.env.LAUNCH_DATE ? Date.parse(process.env.LAUNCH_DATE) || null : launch[0]?.at == null ? null : n(launch[0].at),
    installs: installs.map(
      (i): InstallFacts => ({
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
      }),
    ),
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
    cohortWeeks: [...byInstall.entries()].map(([id, v]) => ({ id, ...v })),
    subs: subs.map(
      (e): SubEvent => ({
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
      }),
    ),
    site: await loadSite(days, now),
  };
}

async function loadSite(days: number, now: number): Promise<MetricsInput["site"]> {
  const today = Math.floor(now / DAY);
  const from = today - days + 1;
  const prevFrom = from - days;
  const views = "kind = 'view' AND bot = 0";
  const top = (col: string, limit = 15) =>
    query<{ key: unknown; n: unknown }>(`SELECT ${col} AS key, COUNT(DISTINCT visitor || '/' || day) AS n FROM page_views WHERE day >= ? AND ${views} GROUP BY key ORDER BY n DESC LIMIT ${limit}`, [from]).then(counted);
  const [daily, totals, prev, pages, referrers, sources, campaigns, countries, devices, browsers, os, ctas] = await Promise.all([
    query(`SELECT day, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS views FROM page_views WHERE day >= ? AND ${views} GROUP BY day`, [from]),
    query(`SELECT COUNT(DISTINCT visitor || '/' || day) AS visitors, COUNT(*) AS views FROM page_views WHERE day >= ? AND ${views}`, [from]),
    query(`SELECT COUNT(DISTINCT visitor || '/' || day) AS visitors, COUNT(*) AS views FROM page_views WHERE day >= ? AND day < ? AND ${views}`, [prevFrom, from]),
    query<{ key: unknown; n: unknown }>(`SELECT path AS key, COUNT(*) AS n FROM page_views WHERE day >= ? AND ${views} GROUP BY key ORDER BY n DESC LIMIT 20`, [from]).then(counted),
    top("COALESCE(referrer, '(direct)')"),
    top("COALESCE(source || COALESCE(' / ' || medium, ''), '(untagged)')"),
    top("campaign"),
    top("country", 20),
    top("device"),
    top("browser"),
    top("os"),
    query(`SELECT cta AS key, path, COUNT(*) AS n FROM page_views WHERE day >= ? AND kind = 'cta' AND bot = 0 GROUP BY cta, path ORDER BY n DESC LIMIT 30`, [from]),
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
export async function recentInstalls(limit = 100) {
  const rows = await query(
    `SELECT i.id, i.first_seen, i.last_seen, i.platform, i.store, i.app_version, i.os, i.os_version, i.manufacturer, i.model, i.country, i.locale, i.source, i.medium, i.campaign, i.referrer, i.asa_campaign, i.test,
       (SELECT COUNT(*) FROM events e WHERE e.install_id = i.id) AS events,
       (SELECT COUNT(*) FROM events e WHERE e.install_id = i.id AND e.name = 'workout_finish') AS workouts
     FROM installs i ORDER BY i.first_seen DESC LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({
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
    source: [s(r.source), s(r.medium), s(r.campaign)].filter(Boolean).join(" / ") || s(r.referrer) || (s(r.asa_campaign) !== "none" ? s(r.asa_campaign) : null),
    test: n(r.test) === 1,
    events: n(r.events),
    workouts: n(r.workouts),
  }));
}

export async function auditLog(limit = 100) {
  const rows = await query("SELECT id, at, admin, action, target, detail FROM admin_audit ORDER BY id DESC LIMIT ?", [limit]);
  return rows.map((r) => ({ id: n(r.id), at: n(r.at), admin: String(r.admin), action: String(r.action), target: s(r.target), detail: s(r.detail) }));
}
