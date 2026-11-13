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
  /** A heading the row sits under; rows with the same group follow each other. */
  group?: string;
  /** A small line under the row: what it's for. */
  note?: string;
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

/** What a setting is for, in the order the Settings card groups them. */
export const SETTING_GROUPS = [
  "Core",
  "Email",
  "Admin panel",
  "Sign-in",
  "Payments",
  "Connected apps",
  "Push notifications",
  "Gyms",
  "Search and monitoring",
] as const;
export type SettingGroup = (typeof SETTING_GROUPS)[number];

export interface Setting {
  /** Environment variable names. Any one of them is enough, unless `all` is set. */
  names: string[];
  /** Every name must be set (a client id and its secret, say). */
  all?: boolean;
  label: string;
  group: SettingGroup;
  need: "required" | "recommended" | "optional";
  /** What it powers, and what happens without it. */
  what: string;
}

/**
 * Every server setting the code reads, so the panel can say which are present: names only, never values.
 * `required` turns the card red, `recommended` amber, `optional` stays quiet. `systemHealth.test.ts` fails when
 * the code reads an environment variable that isn't here (or on `NOT_SETTINGS`), so a new key can't go unlisted.
 * Keep in step with AGENTS.md ("Environment variables live in Vercel").
 */
export const SETTINGS: Setting[] = [
  // Core
  {
    names: ["TURSO_DATABASE_URL", "DATABASE_URL"],
    label: "Database",
    group: "Core",
    need: "required",
    what: "Accounts, sync, Friends, analytics, reminders and this panel. Production reads DATABASE_URL first (the pin against Turso's branch per deploy).",
  },
  {
    names: ["TURSO_AUTH_TOKEN", "DATABASE_AUTH_TOKEN"],
    label: "Database token",
    group: "Core",
    need: "required",
    what: "The database's auth token, paired with the address above.",
  },
  {
    names: ["NEXT_PUBLIC_SITE_URL"],
    label: "Site address",
    group: "Core",
    need: "recommended",
    what: "Set it to https://www.getliftsmith.com.",
  },
  { names: ["CRON_SECRET"], label: "Cron secret", group: "Core", need: "required", what: "Vercel Cron sends it to the daily jobs." },
  {
    names: ["ANALYTICS_SECRET", "ADMIN_SECRET"],
    label: "Visitor hash salt",
    group: "Core",
    need: "recommended",
    what: "Salts the cookieless visitor count.",
  },
  {
    names: ["LAUNCH_DATE"],
    label: "Launch date",
    group: "Core",
    need: "optional",
    what: "Where the Overview's since-launch numbers start. Without it, the first store install.",
  },
  {
    names: ["REVIEW_SIGNIN_CODE"],
    label: "Store reviewer sign-in code",
    group: "Core",
    need: "recommended",
    what: "The 12-digit code the Play and App Store reviewers sign in with.",
  },
  {
    names: ["NEXT_PUBLIC_GOOGLE_PLAY_URL"],
    label: "Google Play link",
    group: "Core",
    need: "optional",
    what: "The website's Get it on Google Play buttons. Read when the site is built, so redeploy after changing it.",
  },
  {
    names: ["NEXT_PUBLIC_APP_STORE_URL"],
    label: "App Store link",
    group: "Core",
    need: "optional",
    what: "The website's App Store buttons. Read when the site is built, so redeploy after changing it.",
  },
  // Email
  {
    names: ["RESEND_API_KEY"],
    label: "Email sending",
    group: "Email",
    need: "required",
    what: "Admin sign-in links, feedback and reminder emails.",
  },
  { names: ["MAIL_FROM"], label: "Reminder sender", group: "Email", need: "required", what: "The From address for reminder emails." },
  {
    names: ["MAIL_POSTAL_ADDRESS"],
    label: "Postal address",
    group: "Email",
    need: "required",
    what: "Every marketing email must carry it (CAN-SPAM, CASL).",
  },
  {
    names: ["REMINDER_SECRET"],
    label: "Unsubscribe link secret",
    group: "Email",
    need: "required",
    what: "Signs one-click unsubscribe links.",
  },
  { names: ["FEEDBACK_TO"], label: "Feedback inbox", group: "Email", need: "recommended", what: "Where in-app feedback is emailed." },
  {
    names: ["FEEDBACK_FROM"],
    label: "Feedback sender",
    group: "Email",
    need: "optional",
    what: "The From address for feedback and Inbox replies. Without it, the reminder sender.",
  },
  {
    names: ["ADMIN_FROM"],
    label: "Admin mail sender",
    group: "Email",
    need: "optional",
    what: "The From address for sign-in links and alerts. Without it, the feedback sender.",
  },
  {
    names: ["RESEND_INBOX_API_KEY"],
    label: "Inbox reading key",
    group: "Email",
    need: "recommended",
    what: "A full-access Resend key, so the Inbox tab can read received mail.",
  },
  {
    names: ["INBOX_DOMAINS"],
    label: "Inbox domains",
    group: "Email",
    need: "optional",
    what: "Which domains' mail the Inbox shows (the Resend account is shared with Gradelings). Without it, getliftsmith.com.",
  },
  // Admin panel
  { names: ["ADMIN_EMAILS"], label: "Admin emails", group: "Admin panel", need: "required", what: "Who can open this panel." },
  {
    names: ["SUPPORT_EMAILS"],
    label: "Support emails",
    group: "Admin panel",
    need: "optional",
    what: "Read-only staff for this panel.",
  },
  {
    names: ["TWO_FACTOR_KEY"],
    label: "Two-step encryption key",
    group: "Admin panel",
    need: "recommended",
    what: "Encrypts staff authenticator secrets in the database. Without it they're stored as they are. Don't change it once set.",
  },
  {
    names: ["ADMIN_2FA"],
    label: "Two-step for staff",
    group: "Admin panel",
    need: "optional",
    what: "Unset: every staff sign-in needs an authenticator code. Set to optional to let staff without it in.",
  },
  {
    names: ["ANTHROPIC_API_KEY"],
    label: "Draft with AI",
    group: "Admin panel",
    need: "optional",
    what: "The Inbox's Draft with AI button.",
  },
  // Sign-in
  {
    names: ["NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID", "GOOGLE_CLIENT_IDS"],
    label: "Google sign-in client",
    group: "Sign-in",
    need: "optional",
    what: "Overrides the web client id built into the app. Without it, the built-in one.",
  },
  {
    names: ["NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID"],
    label: "Google sign-in on iPhone",
    group: "Sign-in",
    need: "optional",
    what: "The iOS client id, so tokens from the iPhone app are accepted. iOS setup is deferred.",
  },
  {
    names: ["NEXT_PUBLIC_APPLE_SERVICES_ID", "APPLE_CLIENT_IDS"],
    label: "Apple sign-in on the web",
    group: "Sign-in",
    need: "optional",
    what: "The Services ID, for Sign in with Apple on the website. The app's bundle id is always accepted.",
  },
  {
    names: ["APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY"],
    all: true,
    label: "Apple sign-in key",
    group: "Sign-in",
    need: "optional",
    what: "A Sign in with Apple .p8 key, to finish Apple sign-ins on the server and revoke them when an account is deleted. iOS setup is deferred.",
  },
  // Payments
  {
    names: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_MONTHLY", "STRIPE_PRICE_ANNUAL"],
    all: true,
    label: "Stripe (Pro on the web)",
    group: "Payments",
    need: "recommended",
    what: "With any of the four missing, the web app sells nothing and stays unlocked.",
  },
  {
    names: ["STRIPE_PRICE_COACH_MONTHLY", "STRIPE_PRICE_COACH_ANNUAL", "STRIPE_PRICE_COACH_PLUS_MONTHLY", "STRIPE_PRICE_COACH_PLUS_ANNUAL"],
    label: "Stripe coach plans (Coach and Coach Plus on the web)",
    group: "Payments",
    need: "optional",
    what: "The price ids of the coach plans. A plan is sold on the web once both of its prices are set; the coachPlans flag turns the client limits on.",
  },
  {
    names: ["STRIPE_CONNECT_WEBHOOK_SECRET"],
    label: "Stripe Connect (coaches' client payments)",
    group: "Payments",
    need: "optional",
    what: "The signing secret of the Connect webhook (/api/coach/stripe/). With it and STRIPE_SECRET_KEY set, coaches can take client payments; without it payments don't show.",
  },
  {
    names: ["STRIPE_CONNECT_FEE_PERCENT"],
    label: "Liftsmith's share of client payments",
    group: "Payments",
    need: "optional",
    what: "A percentage (up to 20) taken from each client payment. Unset or 0: coaches keep everything but Stripe's own fees.",
  },
  {
    names: ["REVENUECAT_WEBHOOK_SECRET"],
    label: "RevenueCat webhook",
    group: "Payments",
    need: "recommended",
    what: "Store subscription events: the Revenue tab, Pro on the account and creator commission.",
  },
  // Connected apps: each one is "Coming soon" in the app until both are set (connect.ts).
  ...(
    [
      ["STRAVA", "Strava", "Workouts out to Strava."],
      ["OURA", "Oura", "Sleep and readiness in from Oura."],
      ["WHOOP", "WHOOP", "Recovery and sleep in from WHOOP."],
      ["WITHINGS", "Withings", "Weigh-ins and body fat in from Withings."],
      ["POLAR", "Polar", "Sleep and Nightly Recharge in from Polar."],
      ["CONCEPT2", "Concept2", "Rows and rides in from the Concept2 Logbook."],
      ["SONOS", "Sonos", "The Sonos lab's play, skip and volume."],
    ] as const
  ).map(([key, name, what]): Setting => ({
    names: [`${key}_CLIENT_ID`, `${key}_CLIENT_SECRET`],
    all: true,
    label: name,
    group: "Connected apps",
    need: "optional",
    what: `${what} Until both are set it shows "Coming soon".`,
  })),
  // Push notifications
  {
    names: ["FCM_SERVICE_ACCOUNT_JSON"],
    label: "Android push (Firebase)",
    group: "Push notifications",
    need: "optional",
    what: "Friends notifications to Android phones. Without it no Android push is sent.",
  },
  {
    names: ["APNS_KEY_P8", "APNS_KEY_ID", "APNS_TEAM_ID"],
    all: true,
    label: "iPhone push (APNs)",
    group: "Push notifications",
    need: "optional",
    what: "Friends notifications to iPhones. iOS setup is deferred.",
  },
  {
    names: ["APNS_TOPIC"],
    label: "iPhone push topic",
    group: "Push notifications",
    need: "optional",
    what: "The app's bundle id for APNs. Without it, com.getliftsmith.app.",
  },
  {
    names: ["APNS_SANDBOX"],
    label: "iPhone push sandbox",
    group: "Push notifications",
    need: "optional",
    what: "Set to 1 to send to development builds instead of the App Store app.",
  },
  // Gyms
  {
    names: ["MAPBOX_TOKEN"],
    label: "Mapbox",
    group: "Gyms",
    need: "optional",
    what: "The map picture on gym pages. Without it they show no map.",
  },
  // Search and monitoring
  {
    names: ["GOOGLE_SERVICE_ACCOUNT_KEY"],
    label: "Search Console key",
    group: "Search and monitoring",
    need: "optional",
    what: "A Google service account's JSON key (a Restricted user on the property), for the Traffic tab's Google Search part.",
  },
  {
    names: ["SEARCH_CONSOLE_SITE"],
    label: "Search Console property",
    group: "Search and monitoring",
    need: "optional",
    what: "Which Search Console property to read. Without it, the getliftsmith.com domain property.",
  },
  {
    names: ["BING_WEBMASTER_API_KEY"],
    label: "Bing Webmaster key",
    group: "Search and monitoring",
    need: "optional",
    what: "The API key from Bing Webmaster Tools (Settings › API access), for the Traffic tab's Bing part.",
  },
  {
    names: ["BING_SITE_URL"],
    label: "Bing site",
    group: "Search and monitoring",
    need: "optional",
    what: "Which Bing Webmaster site to read. Without it, the www site.",
  },
  {
    names: ["UPTIMEROBOT_API_KEY"],
    label: "UptimeRobot",
    group: "Search and monitoring",
    need: "optional",
    what: "The read-only API key, for the Uptime card.",
  },
  {
    names: ["GITHUB_TOKEN"],
    label: "GitHub token",
    group: "Search and monitoring",
    need: "optional",
    what: "A read-only Actions token; the Builds card works without one, within GitHub's hourly limit.",
  },
  {
    names: ["VERCEL_TOKEN"],
    label: "Vercel token",
    group: "Search and monitoring",
    need: "optional",
    what: "A read-only token, for the Deploys card's history and for this card to say which environments each setting is in.",
  },
  {
    names: ["DATABASE_SIZE_LIMIT_MB"],
    label: "Database size limit",
    group: "Search and monitoring",
    need: "optional",
    what: "Your Turso plan's storage, in megabytes, for the Capacity card's warning.",
  },
];

/**
 * Environment variables the code reads that aren't settings to keep: Vercel and CI set them on every build, or
 * they're build-time switches for scripts and tests. `systemHealth.test.ts` checks the code against both lists.
 */
export const NOT_SETTINGS: string[] = [
  "NODE_ENV",
  "VITEST",
  "STATIC_EXPORT",
  "NEXT_PUBLIC_STATIC",
  "STILLS",
  "SPEED_REPORT",
  "REP_ACCURACY",
  "SHOW_SAMPLE_QUOTES",
  "RESEND_API_BASE",
  "COMMIT_SHA",
  "GITHUB_SHA",
  "GITHUB_REPOSITORY",
  "NEXT_PUBLIC_COMMIT_SHA",
  "NEXT_PUBLIC_APP_VERSION",
  // Built into the apps by release.yml from the GitHub secrets on BUILD_SECRETS.
  "NEXT_PUBLIC_REVENUECAT_ANDROID_KEY",
  "NEXT_PUBLIC_REVENUECAT_IOS_KEY",
  "VERCEL_ENV",
  "VERCEL_REGION",
  "VERCEL_PROJECT_ID",
  "VERCEL_TEAM_ID",
  "VERCEL_GIT_COMMIT_SHA",
  "VERCEL_GIT_COMMIT_REF",
  "VERCEL_GIT_COMMIT_MESSAGE",
  "VERCEL_GIT_REPO_OWNER",
  "VERCEL_GIT_REPO_SLUG",
];

/**
 * Keys that live in GitHub (Settings › Secrets and variables › Actions), not Vercel: the app store builds read
 * them in `release.yml` and `ci.yml`. The panel can't see them, so the card lists them for completeness.
 */
export const BUILD_SECRETS: { names: string[]; label: string; what: string }[] = [
  {
    names: ["ANDROID_KEYSTORE_B64", "ANDROID_KEYSTORE_PASSWORD"],
    label: "Android upload key",
    what: "Signs the App Bundle for Google Play.",
  },
  { names: ["PLAY_SERVICE_ACCOUNT_JSON"], label: "Google Play upload", what: "Uploads each release to the internal track." },
  { names: ["GOOGLE_SERVICES_JSON"], label: "Firebase config", what: "Lets the Android app register for Friends push." },
  {
    names: ["REVENUECAT_ANDROID_KEY", "REVENUECAT_IOS_KEY"],
    label: "RevenueCat app keys",
    what: "Built into the apps as NEXT_PUBLIC_REVENUECAT_*_KEY, so they can sell Pro.",
  },
  {
    names: ["APPLE_TEAM_ID", "ASC_KEY_ID", "ASC_ISSUER_ID", "ASC_KEY_P8"],
    label: "App Store Connect",
    what: "Archives the iPhone app and uploads it to TestFlight.",
  },
  {
    names: ["PROMOTE_TOKEN"],
    label: "Promotion token",
    what: "Only if main requires reviews: lets the nightly staging → main merge go through.",
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

/** Vercel's environments, in the order the panel names them. */
const TARGETS = ["production", "preview", "development"] as const;
const TARGET_LABEL: Record<string, string> = { production: "Production", preview: "Preview", development: "Development" };

/** Which of Vercel's environments hold a name ("Production and Preview"), from the project's variable list. */
export function targetsLabel(names: string[], targets: Map<string, string[]>): string {
  const all = new Set(names.flatMap((n) => targets.get(n) ?? []));
  const list = TARGETS.filter((t) => all.has(t)).map((t) => TARGET_LABEL[t]!);
  if (!list.length) return "";
  return list.length === 1 ? `${list[0]} only` : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

/**
 * Which settings are set, by name. `env` is looked up, never returned. `targets` (variable name to Vercel
 * environments, from the Vercel API when VERCEL_TOKEN is set) adds where each one is set, and lists variables in
 * Vercel that no setting names.
 */
export function settingRows(env: (name: string) => string, targets?: Map<string, string[]>): CheckRow[] {
  const rows = SETTINGS.map((s): CheckRow => {
    const present = s.names.filter((n) => env(n));
    const set = s.all ? present.length === s.names.length : present.length > 0;
    const where = targets ? targetsLabel(s.names, targets) : "";
    const missingState: CheckState | undefined = s.need === "required" ? "down" : s.need === "recommended" ? "warn" : undefined;
    let value: string;
    if (set) value = `Set (${(s.all ? s.names : present.slice(0, 1)).join(", ")})`;
    else if (s.all && present.length) value = `Missing ${s.names.filter((n) => !env(n)).join(", ")}`;
    else value = `Missing: ${s.names.join(s.all ? " and " : " or ")}`;
    if (where) value += ` · ${where}`;
    return {
      label: s.label,
      value,
      // Half of a pair set is always worth a look: something was meant to be on.
      state: set ? "ok" : s.all && present.length ? "warn" : missingState,
      group: s.group,
      note: s.what,
    };
  });
  if (targets) {
    const known = new Set([...SETTINGS.flatMap((s) => s.names), ...NOT_SETTINGS]);
    for (const name of [...targets.keys()].filter((n) => !known.has(n)).sort())
      rows.push({
        label: name,
        value: targetsLabel([name], targets),
        state: "warn",
        group: "In Vercel, not read by the code",
        note: "Nothing in the code reads it. Remove it from Vercel, or add it to SETTINGS if it's new.",
      });
  }
  for (const b of BUILD_SECRETS)
    rows.push({
      label: b.label,
      value: b.names.join(", "),
      group: "App builds (GitHub secrets, not checked here)",
      note: b.what,
    });
  return rows;
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
