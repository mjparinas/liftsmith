// The admin panel's System page (modelled on Gradelings' src/lib/systemHealth.ts): one check per part of the
// stack plus the providers' public status pages. Shared by the server, which runs the checks, and the panel,
// which shows them. Pure, so it is tested without a network.

/** ok: working. warn: worth a look. down: broken. off: not set up, so not checked. */
export type CheckState = "ok" | "warn" | "down" | "off";

export interface CheckRow {
  label: string;
  value: string;
  state?: CheckState;
  /** A time the row is about, shown as "3 days ago". */
  at?: number;
  href?: string;
}

export interface HealthCheck {
  id: string;
  title: string;
  state: CheckState;
  /** One line: what's going on. */
  summary: string;
  rows: CheckRow[];
  /** What to set up when the check is off, naming settings, never their values. */
  setup?: string;
  link?: { label: string; href: string };
}

export interface StatusIncident {
  name: string;
  startedAt: number | null;
  href: string | null;
}

export interface StatusPage {
  name: string;
  url: string;
  state: CheckState;
  description: string;
  incidents: StatusIncident[];
}

/** One card's answer from `/api/admin/system/?check=` or `?page=`: the result and when it was checked. */
export interface CheckResult<T> {
  checkedAt: number;
  result: T;
}

/** The checks, in the order the page shows them, so it can draw every card before its result arrives. */
export const CHECKS = [
  { id: "site", title: "Live site" },
  { id: "uptime", title: "Uptime" },
  { id: "builds", title: "Builds (GitHub Actions)" },
  { id: "deploys", title: "Deploys (Vercel)" },
  { id: "database", title: "Database" },
  { id: "email", title: "Email (Resend)" },
  { id: "job", title: "Daily reminder job" },
  { id: "billing", title: "Subscriptions (RevenueCat)" },
  { id: "security", title: "Admin security" },
  { id: "capacity", title: "Capacity" },
  { id: "backups", title: "Backups" },
  { id: "settings", title: "Settings" },
] as const;
export type CheckId = (typeof CHECKS)[number]["id"];

/** The providers' public status pages, in the order the page shows them. */
export const STATUS_PAGES = [
  { name: "Vercel", url: "https://www.vercel-status.com" },
  { name: "GitHub", url: "https://www.githubstatus.com" },
  { name: "Resend", url: "https://resend-status.com" },
  { name: "Turso", url: "https://status.turso.tech" },
  { name: "RevenueCat", url: "https://status.revenuecat.com" },
] as const;
export type StatusPageName = (typeof STATUS_PAGES)[number]["name"];

export const STATE_LABEL: Record<CheckState, string> = { ok: "Working", warn: "Needs a look", down: "Down", off: "Not set up" };

const RANK: Record<CheckState, number> = { off: 0, ok: 1, warn: 2, down: 3 };

/** The worst state among some states, ignoring checks that are off (ok when all are off). */
export function worst(states: CheckState[]): CheckState {
  return states.reduce<CheckState>((w, s) => (s !== "off" && RANK[s] > RANK[w] ? s : w), "ok");
}

/** A Statuspage.io indicator (none, minor, major, critical, maintenance) as a state. */
export function statuspageState(indicator: unknown): CheckState {
  if (indicator === "none") return "ok";
  if (indicator === "major" || indicator === "critical") return "down";
  return "warn";
}

/** A Better Stack status page's aggregate state (operational, degraded, downtime, maintenance). */
export function betterStackState(state: unknown): CheckState {
  if (state === "operational") return "ok";
  if (state === "downtime") return "down";
  return "warn";
}

/** UptimeRobot's monitor status code: 0 paused, 1 not checked yet, 2 up, 8 seems down, 9 down. */
export function uptimeRobotStatus(status: unknown): { state: CheckState; label: string } {
  switch (status) {
    case 2:
      return { state: "ok", label: "Up" };
    case 8:
      return { state: "warn", label: "Seems down" };
    case 9:
      return { state: "down", label: "Down" };
    case 0:
      return { state: "warn", label: "Paused" };
    default:
      return { state: "warn", label: "Not checked yet" };
  }
}

/** The public pages and files the Live site card loads from outside, the way a visitor's browser would. */
export const SITE_PAGES = ["/", "/app/", "/privacy/", "/exercises/"] as const;
export const SITE_FILES = ["/sitemap.xml", "/robots.txt", "/manifest.webmanifest", "/api/health/"] as const;
/** A page slower than this is worth a look. */
export const SITE_SLOW_MS = 3000;
/** Build files checked per page: enough to catch a half-finished deploy without loading every chunk. */
export const SITE_ASSETS_PER_PAGE = 4;

/** The first few script and stylesheet files a page names from our own `/_next/static/`. */
export function pageAssets(html: string, limit = SITE_ASSETS_PER_PAGE): string[] {
  const found = new Set<string>();
  for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css)(?:\?[^"]*)?)"/g)) {
    found.add(m[1]);
    if (found.size >= limit) break;
  }
  return [...found];
}

/** A daily job is late when its last start is over 26 hours ago (it runs once a day at 00:05 UTC). */
export const JOB_LATE_MS = 26 * 3_600_000;
/** A job still "running" after this long died without finishing. */
export const JOB_RUNNING_MS = 15 * 60_000;

/** The state of a daily job from its latest runs (newest first). */
export function jobState(runs: { startedAt: number; finishedAt: number | null; ok: boolean | null }[], now: number): CheckState {
  const last = runs[0];
  if (!last) return "warn";
  if (last.finishedAt == null) return now - last.startedAt > JOB_RUNNING_MS ? "down" : "ok";
  if (!last.ok) return "down";
  return now - last.startedAt > JOB_LATE_MS ? "warn" : "ok";
}

/** A GitHub Actions run's conclusion as a state; a run still going is ok. */
export function runState(r: { status: string; conclusion: string | null }): CheckState {
  if (r.status !== "completed") return "ok";
  if (r.conclusion === "success" || r.conclusion === "skipped" || r.conclusion === "neutral") return "ok";
  if (r.conclusion === "cancelled") return "warn";
  return "down";
}

/**
 * The server settings the panel checks are present: names only, never values. `required` turns the card red,
 * `recommended` amber, `optional` stays quiet. Keep in step with AGENTS.md ("Server environment" lines).
 */
export const SETTINGS: { names: string[]; label: string; need: "required" | "recommended" | "optional"; what: string }[] = [
  {
    names: ["TURSO_DATABASE_URL", "DATABASE_URL"],
    label: "Database",
    need: "required",
    what: "Analytics, reminders, creators and the admin panel need it.",
  },
  { names: ["RESEND_API_KEY"], label: "Email sending", need: "required", what: "Admin sign-in links, feedback and reminder emails." },
  { names: ["ADMIN_EMAILS"], label: "Admin emails", need: "required", what: "Who can open this panel." },
  { names: ["MAIL_FROM"], label: "Reminder sender", need: "required", what: "The From address for reminder emails." },
  {
    names: ["MAIL_POSTAL_ADDRESS"],
    label: "Postal address",
    need: "required",
    what: "Every marketing email must carry it (CAN-SPAM, CASL).",
  },
  { names: ["REMINDER_SECRET"], label: "Unsubscribe link secret", need: "required", what: "Signs one-click unsubscribe links." },
  { names: ["CRON_SECRET"], label: "Cron secret", need: "required", what: "Vercel Cron sends it to the daily reminder job." },
  { names: ["ANALYTICS_SECRET"], label: "Visitor hash salt", need: "recommended", what: "Salts the cookieless visitor count." },
  { names: ["NEXT_PUBLIC_SITE_URL"], label: "Site address", need: "recommended", what: "Set it to https://www.getliftsmith.com." },
  { names: ["FEEDBACK_TO"], label: "Feedback inbox", need: "recommended", what: "Where in-app feedback is emailed." },
  {
    names: ["RESEND_INBOX_API_KEY"],
    label: "Inbox reading key",
    need: "recommended",
    what: "A full-access Resend key, so the Inbox tab can read received mail.",
  },
  {
    names: ["REVENUECAT_WEBHOOK_SECRET"],
    label: "RevenueCat webhook",
    need: "optional",
    what: "Store subscription events, once billing is live.",
  },
  { names: ["UPTIMEROBOT_API_KEY"], label: "UptimeRobot", need: "optional", what: "The read-only API key, for the Uptime card." },
  {
    names: ["GITHUB_TOKEN"],
    label: "GitHub token",
    need: "optional",
    what: "A read-only Actions token; the Builds card works without one, within GitHub's hourly limit.",
  },
  { names: ["VERCEL_TOKEN"], label: "Vercel token", need: "optional", what: "A read-only token, for the Deploys card's history." },
  {
    names: ["GOOGLE_SERVICE_ACCOUNT_KEY"],
    label: "Search Console key",
    need: "optional",
    what: "A Google service account's JSON key (a Restricted user on the property), for the Traffic tab's Google Search part.",
  },
  {
    names: ["TWO_FACTOR_KEY"],
    label: "Two-step encryption key",
    need: "recommended",
    what: "Encrypts staff authenticator secrets in the database. Without it they're stored as they are. Don't change it once set.",
  },
  {
    names: ["ADMIN_2FA"],
    label: "Two-step for staff",
    need: "optional",
    what: "Unset: every staff sign-in needs an authenticator code. Set to optional to let staff without it in.",
  },
  {
    names: ["DATABASE_SIZE_LIMIT_MB"],
    label: "Database size limit",
    need: "optional",
    what: "Your Turso plan's storage, in megabytes, for the Capacity card's warning.",
  },
];

/** A restore practice (docs/RESTORE.md) older than this is stale: monthly, with a few days of slack. */
export const RESTORE_DRILL_DAYS = 35;

/** Warns when no restore practice has been recorded or the last one is stale. */
export function restoreDrillState(at: number | null, now: number): CheckState {
  if (at == null) return "warn";
  return now - at > RESTORE_DRILL_DAYS * 86_400_000 ? "warn" : "ok";
}

/** Failed staff sign-ins in a day before the Admin security card warns. */
export const STAFF_FAILURES_WARN = 10;

/** Share of the database size limit used, as a state: a warning at 70%, down at 90%. */
export function capacityState(usedShare: number | null): CheckState {
  if (usedShare == null) return "ok";
  return usedShare >= 0.9 ? "down" : usedShare >= 0.7 ? "warn" : "ok";
}

/** Megabytes with a thousands separator ("1,240 MB"), or one decimal under 10. */
export function megabytes(bytes: number): string {
  const mb = bytes / 1_048_576;
  return mb < 10 ? `${Math.round(mb * 10) / 10} MB` : `${Math.round(mb).toLocaleString("en-US")} MB`;
}

/** Days until `limit` at the growth seen between the oldest and newest samples; null without a week of samples or growth. */
export function daysUntilFull(samples: { day: number; bytes: number }[], limit: number | null): number | null {
  if (!limit || samples.length < 2) return null;
  const sorted = [...samples].sort((a, b) => a.day - b.day);
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  if (last.day - first.day < 7 || last.bytes <= first.bytes) return null;
  const perDay = (last.bytes - first.bytes) / (last.day - first.day);
  return Math.max(0, Math.floor((limit - last.bytes) / perDay));
}

/** Which settings are set, by name. `env` is looked up, never returned. */
export function settingRows(env: (name: string) => string): CheckRow[] {
  return SETTINGS.map((s) => {
    const name = s.names.find((n) => env(n));
    return {
      label: s.label,
      value: name ? `Set (${name})` : `Missing: ${s.names.join(" or ")}. ${s.what}`,
      state: name ? "ok" : s.need === "required" ? "down" : s.need === "recommended" ? "warn" : undefined,
    };
  });
}

/** Whether a site address follows the www rule (AGENTS.md "Domain"): https, the www host, no path. */
export function siteAddressProblem(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return "It should start with https://.";
    if (u.hostname === "getliftsmith.com") return "Use the www address: https://www.getliftsmith.com.";
    if (u.pathname !== "/" || u.search) return "It should be just the address, with no path.";
    return null;
  } catch {
    return "It isn't a web address. Use https://www.getliftsmith.com.";
  }
}
