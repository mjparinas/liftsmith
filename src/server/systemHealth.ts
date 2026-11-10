// Runs the admin System page's checks (modelled on Gradelings' src/server/systemHealth.ts). Every token stays
// on the server: each check reads its own settings, asks the service with a read-only token, and returns only
// what the page shows. A check that isn't set up says so instead of failing, and one slow or broken service
// never holds up the rest (each call has a time limit).
import {
  betterStackState,
  CHECKS,
  JOB_LATE_MS,
  jobState,
  pageAssets,
  runState,
  settingRows,
  SITE_FILES,
  SITE_PAGES,
  SITE_SLOW_MS,
  siteAddressProblem,
  STATUS_PAGES,
  statuspageState,
  uptimeRobotStatus,
  worst,
  type CheckId,
  type CheckResult,
  type CheckRow,
  type CheckState,
  type HealthCheck,
  type StatusPage,
  type StatusPageName,
} from "@/lib/systemHealth";

import { query } from "./db";
import { inboxDomains, readKey } from "./inbox";
import { recentJobRuns } from "./monitor";

const DAY = 86_400_000;
const TIMEOUT = 8_000;
const env = (name: string) => process.env[name]?.trim() || "";
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
const num = (n: number) => n.toLocaleString("en-US");

class HttpError extends Error {
  constructor(
    readonly status: number,
    service: string,
  ) {
    super(status === 401 || status === 403 ? `${service} refused the token (${status}).` : `${service} answered ${status}.`);
  }
}

async function getJson<T>(
  service: string,
  url: string,
  headers: Record<string, string> = {},
  init: Pick<RequestInit, "method" | "body"> = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { accept: "application/json", ...headers },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT),
    });
  } catch (e) {
    throw new Error((e as Error).name === "TimeoutError" ? `${service} didn't answer in time.` : `Couldn't reach ${service}.`);
  }
  if (!res.ok) throw new HttpError(res.status, service);
  return (await res.json()) as T;
}

/** Runs a check, turning an unexpected error into a "down" result rather than a failed page. */
async function safely(id: string, title: string, fn: () => Promise<HealthCheck>): Promise<HealthCheck> {
  try {
    return await fn();
  } catch (e) {
    return { id, title, state: "down", summary: (e as Error).message, rows: [] };
  }
}

/** The public site's address (always the www host, AGENTS.md "Domain"). */
export const siteOrigin = () => (env("NEXT_PUBLIC_SITE_URL") || "https://www.getliftsmith.com").replace(/\/$/, "");

// ---------- The live site, loaded from outside ----------

interface Probe {
  status: number;
  ms: number;
  body: string;
}

async function probe(url: string, text = false): Promise<Probe | { error: string }> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      headers: { "user-agent": "Liftsmith-System-Check" },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const body = text ? await res.text() : "";
    if (!text) await res.body?.cancel();
    return { status: res.status, ms: Date.now() - started, body };
  } catch (e) {
    return { error: (e as Error).name === "TimeoutError" ? "didn't answer in time" : "couldn't be reached" };
  }
}
const isProbe = (p: Probe | { error: string }): p is Probe => !("error" in p);

/** Loads the public pages, the web app and a few files from the live address, plus the build files the pages name. */
export async function siteCheck(): Promise<HealthCheck> {
  const origin = siteOrigin();
  const title = "Live site";
  if (/\/\/(localhost|127\.)/.test(origin))
    return {
      id: "site",
      title,
      state: "off",
      summary: "The site address points at this computer.",
      rows: [],
      setup: "Set NEXT_PUBLIC_SITE_URL to https://www.getliftsmith.com.",
    };
  const pages = await Promise.all(SITE_PAGES.map(async (path) => ({ path, got: await probe(origin + path, true) })));
  const files = await Promise.all(SITE_FILES.map(async (path) => ({ path, got: await probe(origin + path) })));
  const assetPages = new Map<string, string>();
  for (const { path, got } of pages)
    if (isProbe(got) && got.status === 200) for (const a of pageAssets(got.body)) if (!assetPages.has(a)) assetPages.set(a, path);
  const assets = await Promise.all([...assetPages].map(async ([a, path]) => ({ a, path, got: await probe(origin + a) })));
  const missing = assets.filter((x) => !isProbe(x.got) || x.got.status !== 200);

  const rows: CheckRow[] = [];
  const problems: string[] = [];
  for (const { path, got } of [...pages, ...files]) {
    const bad = !isProbe(got) ? got.error : got.status !== 200 ? `answered ${got.status}` : "";
    const slow = isProbe(got) && got.ms > SITE_SLOW_MS;
    rows.push({
      label: path,
      value: bad || `Loaded in ${(got as Probe).ms} ms`,
      state: bad ? "down" : slow ? "warn" : "ok",
      href: origin + path,
    });
    if (bad) problems.push(`${path} ${bad}`);
  }
  rows.push({
    label: "Scripts and styles",
    value: missing.length
      ? `${assets.length - missing.length} of ${assets.length} loaded; missing: ${missing
          .slice(0, 3)
          .map((x) => x.a.split("?")[0].split("/").pop())
          .join(", ")}`
      : assets.length
        ? `All ${assets.length} loaded`
        : "None found on the pages",
    state: missing.length ? "down" : assets.length ? "ok" : "warn",
  });
  if (missing.length)
    problems.push(`${plural(missing.length, "build file")} named by ${[...new Set(missing.map((x) => x.path))].join(", ")} didn't load`);
  const state: CheckState = problems.length ? "down" : worst(rows.map((r) => r.state ?? "ok"));
  const summary = problems.length
    ? `${problems[0].charAt(0).toUpperCase()}${problems[0].slice(1)}.${problems.length > 1 ? ` ${problems.length - 1} more problem${problems.length > 2 ? "s" : ""}.` : ""}`
    : state === "warn"
      ? "Everything answers, but something is slow."
      : `All ${SITE_PAGES.length} pages and ${SITE_FILES.length} files load from ${new URL(origin).host}.`;
  return { id: "site", title, state, summary, rows, link: { label: "Open the site", href: origin } };
}

// ---------- Uptime (UptimeRobot) ----------

interface RobotMonitor {
  id: number;
  friendly_name: string;
  status: number;
  custom_uptime_ratio?: string;
  logs?: { type: number; datetime: number }[];
}

const ROBOT_LINK = { label: "UptimeRobot dashboard", href: "https://dashboard.uptimerobot.com/monitors" };

export async function uptimeCheck(): Promise<HealthCheck> {
  const key = env("UPTIMEROBOT_API_KEY");
  if (!key) {
    return {
      id: "uptime",
      title: "Uptime",
      state: "off",
      summary: "Not connected to UptimeRobot.",
      rows: [],
      setup:
        "Add a free UptimeRobot HTTP monitor for https://www.getliftsmith.com/api/health/ (every 5 minutes), then set UPTIMEROBOT_API_KEY to the account's read-only API key (Integrations & API › API).",
      link: { label: "UptimeRobot", href: "https://uptimerobot.com/" },
    };
  }
  const body = new URLSearchParams({ api_key: key, format: "json", custom_uptime_ratios: "1-7-30", logs: "1", logs_limit: "10" });
  const res = await getJson<{ stat: string; error?: { message?: string }; monitors?: RobotMonitor[] }>(
    "UptimeRobot",
    "https://api.uptimerobot.com/v2/getMonitors",
    { "content-type": "application/x-www-form-urlencoded", "cache-control": "no-cache" },
    { method: "POST", body: body.toString() },
  );
  if (res.stat !== "ok") throw new Error(`UptimeRobot refused the request${res.error?.message ? `: ${res.error.message}` : "."}`);
  const monitors = res.monitors ?? [];
  if (!monitors.length)
    return {
      id: "uptime",
      title: "Uptime",
      state: "warn",
      summary: "UptimeRobot has no monitors yet.",
      rows: [],
      setup: "Add a monitor for https://www.getliftsmith.com/api/health/.",
      link: ROBOT_LINK,
    };
  const ratios = (m: RobotMonitor) =>
    (m.custom_uptime_ratio ?? "").split("-").map((r) => (r && Number.isFinite(Number(r)) ? Math.round(Number(r) * 100) / 100 : null));
  const rows: CheckRow[] = monitors.map((m) => {
    const { state, label } = uptimeRobotStatus(m.status);
    const [day, week, month] = ratios(m);
    return {
      label: m.friendly_name,
      value: [label, day == null ? "" : `${day}% 24 h`, week == null ? "" : `${week}% 7 days`, month == null ? "" : `${month}% 30 days`]
        .filter(Boolean)
        .join(" · "),
      state,
    };
  });
  const outages = monitors
    .flatMap((m) => (m.logs ?? []).filter((l) => l.type === 1).map((l) => ({ name: m.friendly_name, at: l.datetime * 1000 })))
    .sort((a, b) => b.at - a.at);
  const down = monitors.filter((m) => uptimeRobotStatus(m.status).state === "down");
  const days = monitors.map((m) => ratios(m)[0]).filter((r): r is number => r != null);
  return {
    id: "uptime",
    title: "Uptime",
    state: worst(rows.map((r) => r.state ?? "ok")),
    summary: down.length
      ? `Down: ${down.map((m) => m.friendly_name).join(", ")}.`
      : monitors.every((m) => m.status === 2)
        ? `Up.${days.length ? ` ${Math.min(...days)}% uptime in the last day.` : ""}`
        : "Not every monitor is up yet.",
    rows: [...rows, ...(outages[0] ? [{ label: "Last outage", value: outages[0].name, at: outages[0].at }] : [])],
    link: ROBOT_LINK,
  };
}

// ---------- GitHub: builds ----------

interface GhRun {
  status: string;
  conclusion: string | null;
  created_at: string;
  html_url: string;
  head_branch?: string;
  event?: string;
  display_title?: string;
}

/** The repository: GITHUB_REPOSITORY, else the one Vercel built from, else ours. */
export const githubRepo = () =>
  env("GITHUB_REPOSITORY") ||
  (env("VERCEL_GIT_REPO_OWNER") && env("VERCEL_GIT_REPO_SLUG")
    ? `${env("VERCEL_GIT_REPO_OWNER")}/${env("VERCEL_GIT_REPO_SLUG")}`
    : "mjparinas/liftsmith");

function ghHeaders(): Record<string, string> {
  const token = env("GITHUB_TOKEN");
  return { "x-github-api-version": "2022-11-28", ...(token ? { authorization: `Bearer ${token}` } : {}) };
}

const WORKFLOWS = [
  { file: "ci.yml", branch: "staging", label: "CI on staging" },
  { file: "ci.yml", branch: "main", label: "CI on main" },
  { file: "promote-staging.yml", branch: "", label: "Nightly promotion" },
  { file: "release.yml", branch: "", label: "Store release" },
] as const;

export async function buildsCheck(): Promise<HealthCheck> {
  const repo = githubRepo();
  const title = "Builds (GitHub Actions)";
  const link = { label: "GitHub Actions", href: `https://github.com/${repo}/actions` };
  const lists = await Promise.all(
    WORKFLOWS.map((w) =>
      getJson<{ workflow_runs?: GhRun[] }>(
        "GitHub",
        `https://api.github.com/repos/${repo}/actions/workflows/${w.file}/runs?per_page=10${w.branch ? `&branch=${w.branch}` : ""}`,
        ghHeaders(),
      )
        .then((r) => r.workflow_runs ?? [])
        .catch((e: Error) => e),
    ),
  );
  const refused = lists.find((l): l is Error => l instanceof Error);
  if (refused && lists.every((l) => l instanceof Error)) {
    return {
      id: "builds",
      title,
      state: "warn",
      summary: refused.message,
      rows: [],
      setup: env("GITHUB_TOKEN")
        ? undefined
        : "GitHub limits unsigned reads to 60 an hour per address. Set GITHUB_TOKEN (fine-grained, this repository only, read-only Actions) if this keeps happening.",
      link,
    };
  }
  const name = (r: GhRun) => (r.display_title ?? "").split("\n")[0].slice(0, 90);
  const rows: CheckRow[] = [];
  let failing = 0;
  WORKFLOWS.forEach((w, i) => {
    const runs = lists[i];
    if (runs instanceof Error) {
      rows.push({ label: w.label, value: runs.message, state: "warn" });
      return;
    }
    // A cancelled run (a newer push replaced it) says nothing about the code.
    const done = runs.find((r) => r.status === "completed" && r.conclusion !== "cancelled" && r.conclusion !== "skipped");
    const running = runs.find((r) => r.status !== "completed");
    if (!done) {
      rows.push({
        label: w.label,
        value: running ? "Running its first time" : "No runs yet",
        state: running ? "ok" : undefined,
        href: running?.html_url,
      });
      return;
    }
    const s = runState(done);
    if (s === "down") failing++;
    rows.push({
      label: w.label,
      value: `${s === "down" ? "Failed" : "Passed"}: ${name(done)}`,
      at: Date.parse(done.created_at),
      state: s,
      href: done.html_url,
    });
    if (running)
      rows.push({ label: `${w.label}, running now`, value: name(running), at: Date.parse(running.created_at), href: running.html_url });
  });
  const state = worst(rows.map((r) => r.state ?? "ok"));
  return {
    id: "builds",
    title,
    state,
    summary: failing
      ? `${plural(failing, "workflow")} failed on its latest run.`
      : state === "warn"
        ? "Some runs couldn't be read."
        : "The latest builds of staging and main passed.",
    rows,
    link,
  };
}

// ---------- Vercel deployments ----------

interface VercelDeployment {
  uid: string;
  url?: string;
  state?: string;
  readyState?: string;
  target?: string | null;
  created: number;
  meta?: { githubCommitMessage?: string; githubCommitRef?: string; githubCommitSha?: string };
}

export async function deploysCheck(): Promise<HealthCheck> {
  const title = "Deploys (Vercel)";
  const link = { label: "Vercel deployments", href: "https://vercel.com/melvins-projects-b69f55c3/liftsmith/deployments" };
  // What this server is: Vercel sets these on every deployment, no token needed.
  const sha = env("VERCEL_GIT_COMMIT_SHA");
  const here: CheckRow[] = env("VERCEL_ENV")
    ? [
        {
          label: "Serving",
          value: `${env("VERCEL_ENV")} from ${env("VERCEL_GIT_COMMIT_REF") || "?"} at ${sha ? sha.slice(0, 7) : "?"}${env("VERCEL_GIT_COMMIT_MESSAGE") ? `: ${env("VERCEL_GIT_COMMIT_MESSAGE").split("\n")[0].slice(0, 80)}` : ""}`,
          href: sha ? `https://github.com/${githubRepo()}/commit/${sha}` : undefined,
        },
        ...(env("VERCEL_REGION") ? [{ label: "Region", value: env("VERCEL_REGION") }] : []),
      ]
    : [{ label: "Serving", value: "Not running on Vercel (a local or CI server)." }];
  const token = env("VERCEL_TOKEN");
  const project = env("VERCEL_PROJECT_ID");
  if (!token || !project) {
    return {
      id: "deploys",
      title,
      state: env("VERCEL_ENV") ? "ok" : "off",
      summary: env("VERCEL_ENV")
        ? `This deployment is live${sha ? ` at ${sha.slice(0, 7)}` : ""}. Set VERCEL_TOKEN for the history.`
        : "Not running on Vercel.",
      rows: here,
      setup:
        "For recent deploys and failures, set VERCEL_TOKEN (Vercel › Account Settings › Tokens, scoped to the team). VERCEL_PROJECT_ID is set by Vercel itself.",
      link,
    };
  }
  const team = env("VERCEL_TEAM_ID");
  const q = new URLSearchParams({ projectId: project, limit: "10", ...(team ? { teamId: team } : { slug: "melvins-projects-b69f55c3" }) });
  const d = await getJson<{ deployments?: VercelDeployment[] }>("Vercel", `https://api.vercel.com/v6/deployments?${q}`, {
    authorization: `Bearer ${token}`,
  });
  const list = d.deployments ?? [];
  const stateOf = (x: VercelDeployment) => x.readyState ?? x.state ?? "";
  const prod = list.find((x) => x.target === "production" && stateOf(x) === "READY");
  const failed = list.filter((x) => stateOf(x) === "ERROR" && x.created > Date.now() - 7 * DAY);
  const building = list.find((x) => stateOf(x) === "BUILDING" || stateOf(x) === "QUEUED" || stateOf(x) === "INITIALIZING");
  const rows: CheckRow[] = [
    ...here,
    ...(prod
      ? [
          {
            label: "Latest production",
            value: (prod.meta?.githubCommitMessage ?? "").split("\n")[0].slice(0, 90) || prod.uid,
            at: prod.created,
            state: "ok" as const,
            href: prod.url ? `https://${prod.url}` : undefined,
          },
        ]
      : []),
    ...(building
      ? [{ label: "Building now", value: (building.meta?.githubCommitMessage ?? "").split("\n")[0].slice(0, 90), at: building.created }]
      : []),
    ...list.slice(0, 6).map((x) => ({
      label: `${x.target === "production" ? "Production" : "Preview"} ${stateOf(x).toLowerCase()}`,
      value: `${x.meta?.githubCommitRef ?? ""} ${(x.meta?.githubCommitMessage ?? "").split("\n")[0].slice(0, 70)}`.trim(),
      at: x.created,
      state: (stateOf(x) === "ERROR" ? "down" : stateOf(x) === "READY" ? "ok" : undefined) as CheckState | undefined,
    })),
  ];
  const latestProd = list.find((x) => x.target === "production" && stateOf(x) !== "CANCELED");
  const state: CheckState = latestProd && stateOf(latestProd) === "ERROR" ? "down" : failed.length ? "warn" : "ok";
  return {
    id: "deploys",
    title,
    state,
    summary:
      state === "down"
        ? "The latest production deploy failed; the one before it is still serving."
        : failed.length
          ? `${plural(failed.length, "deploy")} failed this week.`
          : prod
            ? "Production is on its latest deploy."
            : "No production deploy found yet.",
    rows,
    link,
  };
}

// ---------- Database ----------

export async function databaseCheck(): Promise<HealthCheck> {
  const hosted = Boolean(env("TURSO_DATABASE_URL") || env("DATABASE_URL"));
  const started = Date.now();
  await query("SELECT 1");
  const ms = Date.now() - started;
  const [c] = await query<{ installs: number; tests: number; events: number; last: number | null; views: number }>(
    "SELECT (SELECT COUNT(*) FROM installs) AS installs, (SELECT COUNT(*) FROM installs WHERE test = 1) AS tests, (SELECT COUNT(*) FROM events) AS events, (SELECT MAX(at) FROM events) AS last, (SELECT COUNT(*) FROM page_views) AS views",
  ).catch(() => [undefined]);
  const state: CheckState = !hosted ? "warn" : ms > 1500 ? "warn" : "ok";
  return {
    id: "database",
    title: "Database",
    state,
    summary: hosted ? `Turso answered in ${ms} ms.` : "Using a local file: set TURSO_DATABASE_URL on Vercel.",
    rows: [
      { label: "Answer time", value: `${ms} ms`, state: ms > 1500 ? "warn" : "ok" },
      ...(c
        ? [
            { label: "Installs", value: `${num(Number(c.installs))}${Number(c.tests) ? ` (${num(Number(c.tests))} marked test)` : ""}` },
            { label: "Usage events", value: num(Number(c.events)) },
            { label: "Page views", value: num(Number(c.views)) },
            ...(c.last ? [{ label: "Last event received", value: "", at: Number(c.last) }] : []),
          ]
        : []),
    ],
    link: hosted ? { label: "Turso dashboard", href: "https://app.turso.tech/" } : undefined,
  };
}

// ---------- Email (Resend) ----------

interface ResendDomain {
  name: string;
  status: string;
  capabilities?: { sending?: string; receiving?: string };
}

export async function emailCheck(now = Date.now()): Promise<HealthCheck> {
  const title = "Email (Resend)";
  const link = { label: "Resend dashboard", href: "https://resend.com/emails" };
  if (!env("RESEND_API_KEY"))
    return {
      id: "email",
      title,
      state: "down",
      summary: "No Resend key: sign-in links, feedback and reminders can't be sent.",
      rows: [],
      setup: "Set RESEND_API_KEY.",
      link,
    };
  const rows: CheckRow[] = [];
  const key = readKey();
  const domains = await getJson<{ data?: ResendDomain[] }>("Resend", "https://api.resend.com/domains", {
    authorization: `Bearer ${key}`,
  }).catch((e: Error) => e);
  let state: CheckState = "ok";
  if (domains instanceof Error) {
    rows.push({
      label: "Domains",
      value:
        domains instanceof HttpError && (domains.status === 401 || domains.status === 403)
          ? "The key is sending-only, so domains and received mail can't be read. Set RESEND_INBOX_API_KEY to a full-access key."
          : domains.message,
      state: "warn",
    });
    state = "warn";
  } else {
    const ours = (domains.data ?? []).filter((d) => inboxDomains().includes(d.name));
    if (!ours.length) {
      rows.push({ label: "Domain", value: `${inboxDomains().join(", ")} isn't in this Resend account.`, state: "down" });
      state = "down";
    }
    for (const d of ours) {
      const verified = d.status === "verified";
      rows.push({
        label: d.name,
        value: `${verified ? "Verified" : `Status: ${d.status}`} · sending ${d.capabilities?.sending ?? "?"} · receiving ${d.capabilities?.receiving ?? "?"}`,
        state: verified ? "ok" : "down",
      });
      if (!verified) state = "down";
      else if (d.capabilities?.receiving && d.capabilities.receiving !== "enabled") {
        rows.push({
          label: "Receiving",
          value: "Off, so the Inbox stays empty. Turn on receiving for the domain in Resend.",
          state: "warn",
        });
        state = worst([state, "warn"]);
      }
    }
  }
  // Reminder emails over the last week, from our own records.
  const sends = await query<{ status: string; n: number }>(
    "SELECT status, COUNT(*) AS n FROM reminder_sends WHERE send_at > ? GROUP BY status",
    [now - 7 * DAY],
  ).catch(() => []);
  const subs = await query<{ status: string; n: number }>("SELECT status, COUNT(*) AS n FROM reminder_subs GROUP BY status").catch(
    () => [],
  );
  const count = (xs: { status: string; n: number }[], s: string) => Number(xs.find((x) => x.status === s)?.n ?? 0);
  rows.push({
    label: "Reminder emails, last 7 days",
    value: `${num(count(sends, "sent"))} sent, ${num(count(sends, "scheduled"))} scheduled, ${num(count(sends, "cancelled"))} cancelled`,
  });
  rows.push({
    label: "Reminder subscribers",
    value: `${num(count(subs, "confirmed"))} confirmed, ${num(count(subs, "pending"))} waiting to confirm, ${num(count(subs, "unsubscribed"))} unsubscribed`,
  });
  return {
    id: "email",
    title,
    state,
    summary:
      state === "ok"
        ? `Sending${domains instanceof Error ? "" : " and receiving"} on ${inboxDomains().join(", ")}.`
        : state === "down"
          ? "The sending domain needs attention in Resend."
          : "Sending works; some details can't be read with this key.",
    rows,
    link,
  };
}

// ---------- The daily reminder job ----------

export async function jobCheck(now = Date.now()): Promise<HealthCheck> {
  const title = "Daily reminder job";
  if (!env("CRON_SECRET"))
    return {
      id: "job",
      title,
      state: "off",
      summary: "CRON_SECRET isn't set, so Vercel Cron can't run the job.",
      rows: [],
      setup: "Set CRON_SECRET (any long random string).",
    };
  const runs = await recentJobRuns("reminders", 7);
  const state = jobState(runs, now);
  const last = runs[0];
  const short = (d: string | null) => {
    if (!d) return "";
    try {
      const j = JSON.parse(d) as Record<string, unknown>;
      return Object.entries(j)
        .filter(([, v]) => typeof v === "number" || typeof v === "string")
        .slice(0, 5)
        .map(([k, v]) => `${k} ${v}`)
        .join(", ");
    } catch {
      return d.slice(0, 120);
    }
  };
  return {
    id: "job",
    title,
    state,
    summary: !last
      ? "No run recorded yet. It runs at 00:05 UTC each day (vercel.json)."
      : state === "down"
        ? last.finishedAt == null
          ? "The last run started but never finished."
          : `The last run failed${last.detail ? `: ${short(last.detail)}` : "."}`
        : now - last.startedAt > JOB_LATE_MS
          ? "The job hasn't run in over a day. Check Vercel › Settings › Cron Jobs."
          : "Ran in the last day.",
    rows: runs.map((r) => ({
      label: r.finishedAt == null ? "Running or stopped" : r.ok ? "Finished" : "Failed",
      value: short(r.detail) || (r.finishedAt ? `${Math.round((r.finishedAt - r.startedAt) / 1000)} s` : ""),
      at: r.startedAt,
      state: r.finishedAt == null ? undefined : r.ok ? "ok" : "down",
    })),
    link: { label: "Vercel cron jobs", href: "https://vercel.com/melvins-projects-b69f55c3/liftsmith/settings/cron-jobs" },
  };
}

// ---------- Subscriptions (RevenueCat webhook) ----------

export async function billingCheck(now = Date.now()): Promise<HealthCheck> {
  const title = "Subscriptions (RevenueCat)";
  const link = { label: "RevenueCat dashboard", href: "https://app.revenuecat.com/" };
  if (!env("REVENUECAT_WEBHOOK_SECRET")) {
    return {
      id: "billing",
      title,
      state: "off",
      summary: "Billing isn't live yet, so no store events arrive.",
      rows: [],
      setup:
        "When billing goes live: point RevenueCat's webhook at https://www.getliftsmith.com/api/billing/revenuecat/ and set REVENUECAT_WEBHOOK_SECRET (AGENTS.md, Open items).",
      link,
    };
  }
  const [last] = await query<{ at: number | null; n: number }>(
    "SELECT MAX(at) AS at, COUNT(*) AS n FROM subscription_events WHERE source = 'store'",
  );
  const [week] = await query<{ n: number; failures: number }>(
    "SELECT COUNT(*) AS n, SUM(CASE WHEN kind = 'cancel' AND reason = 'billing' THEN 1 ELSE 0 END) AS failures FROM subscription_events WHERE source = 'store' AND at > ?",
    [now - 7 * DAY],
  );
  const at = last?.at == null ? null : Number(last.at);
  return {
    id: "billing",
    title,
    state: at == null ? "warn" : "ok",
    summary:
      at == null ? "The webhook is set up, but no store event has arrived yet." : `${num(Number(week?.n ?? 0))} store events this week.`,
    rows: [
      ...(at ? [{ label: "Last store event", value: "", at }] : []),
      { label: "Store events, all time", value: num(Number(last?.n ?? 0)) },
      {
        label: "Payment failures, last 7 days",
        value: num(Number(week?.failures ?? 0)),
        state: Number(week?.failures ?? 0) ? ("warn" as const) : ("ok" as const),
      },
    ],
    link,
  };
}

// ---------- Settings ----------

export function settingsCheck(): HealthCheck {
  const rows = settingRows(env);
  const site = env("NEXT_PUBLIC_SITE_URL");
  if (site) {
    const problem = siteAddressProblem(site);
    rows.push({ label: "Site address format", value: problem ?? `Public address: ${new URL(site).host}`, state: problem ? "warn" : "ok" });
  }
  const missing = rows.filter((r) => r.state === "down").length;
  return {
    id: "settings",
    title: "Settings",
    state: worst(rows.map((r) => r.state ?? "ok")),
    summary: missing ? `${plural(missing, "required setting")} missing.` : "Every required setting is present. Values are never shown.",
    rows,
  };
}

// ---------- Providers' status pages ----------

interface StatuspageSummary {
  status?: { indicator?: string; description?: string };
  incidents?: { name: string; started_at?: string; created_at?: string; shortlink?: string; status?: string }[];
}

async function statuspage(name: string, url: string): Promise<StatusPage> {
  const d = await getJson<StatuspageSummary>(name, `${url}/api/v2/summary.json`).catch(() =>
    getJson<StatuspageSummary>(name, `${url}/api/v2/status.json`),
  );
  return {
    name,
    url,
    state: statuspageState(d.status?.indicator),
    description: d.status?.description ?? "Unknown",
    incidents: (d.incidents ?? [])
      .filter((i) => i.status !== "resolved" && i.status !== "postmortem")
      .map((i) => ({ name: i.name, startedAt: Date.parse(i.started_at ?? i.created_at ?? "") || null, href: i.shortlink ?? null })),
  };
}

async function tursoStatus(): Promise<StatusPage> {
  const d = await getJson<{ data?: { attributes?: { aggregate_state?: string } } }>("Turso", "https://status.turso.tech/index.json");
  const s = d.data?.attributes?.aggregate_state;
  return {
    name: "Turso",
    url: "https://status.turso.tech",
    state: betterStackState(s),
    description: s ? s[0].toUpperCase() + s.slice(1) : "Unknown",
    incidents: [],
  };
}

const STATUS_RUNNERS: Record<StatusPageName, () => Promise<StatusPage>> = {
  Vercel: () => statuspage("Vercel", "https://www.vercel-status.com"),
  GitHub: () => statuspage("GitHub", "https://www.githubstatus.com"),
  Resend: () => statuspage("Resend", "https://resend-status.com"),
  Turso: tursoStatus,
  RevenueCat: () => statuspage("RevenueCat", "https://status.revenuecat.com"),
};

/** One provider's status page; a page that can't be read is "worth a look", never an error. */
async function readStatusPage(name: StatusPageName): Promise<StatusPage> {
  const url = STATUS_PAGES.find((p) => p.name === name)!.url;
  return STATUS_RUNNERS[name]().catch((e: Error): StatusPage => ({
    name,
    url,
    state: "warn",
    description: `Couldn't read the status page: ${e.message}`,
    incidents: [],
  }));
}

// ---------- One card at a time ----------

const RUNNERS: Record<CheckId, (now: number) => Promise<HealthCheck>> = {
  site: () => siteCheck(),
  uptime: () => uptimeCheck(),
  builds: () => buildsCheck(),
  deploys: () => deploysCheck(),
  database: () => databaseCheck(),
  email: (now) => emailCheck(now),
  job: (now) => jobCheck(now),
  billing: (now) => billingCheck(now),
  settings: async () => settingsCheck(),
};

export const isCheckId = (id: string): id is CheckId => CHECKS.some((c) => c.id === id);
export const isStatusPageName = (name: string): name is StatusPageName => STATUS_PAGES.some((p) => p.name === name);

/** Results are kept this long, so opening the page again doesn't call every service again. */
export const CACHE_MS = 60_000;
const cache = new Map<string, { at: number; value: Promise<unknown> }>();

function cached<T>(key: string, opts: { refresh?: boolean; now?: number }, runIt: (now: number) => Promise<T>): Promise<CheckResult<T>> {
  const now = opts.now ?? Date.now();
  const hit = cache.get(key);
  if (!opts.refresh && hit && now - hit.at < CACHE_MS) return hit.value.then((result) => ({ checkedAt: hit.at, result: result as T }));
  const value = runIt(now);
  cache.set(key, { at: now, value });
  value.catch(() => cache.get(key)?.value === value && cache.delete(key));
  return value.then((result) => ({ checkedAt: now, result }));
}

export function runCheck(id: CheckId, opts: { refresh?: boolean; now?: number } = {}): Promise<CheckResult<HealthCheck>> {
  const title = CHECKS.find((c) => c.id === id)!.title;
  return cached(`check:${id}`, opts, (now) => safely(id, title, () => RUNNERS[id](now)));
}

export function runStatusPage(name: StatusPageName, opts: { refresh?: boolean; now?: number } = {}): Promise<CheckResult<StatusPage>> {
  return cached(`page:${name}`, opts, () => readStatusPage(name));
}

/** For tests. */
export function clearSystemCache() {
  cache.clear();
}
