// The admins' morning digest (Gradelings' digest, Melvin 2026-11-12): one email at about 8 AM Pacific with the last
// 24 hours in counts (sign-ups and installs by platform, workouts, Pro trials, new subscribers, payments and
// cancellations across Google Play, the App Store and Stripe), site health (the live site's /api/health/, UptimeRobot
// and every other System check), what waits on To Do, and a link to the panel. Plain text with an HTML twin.
// Counts only: never a lifter's email, name, training or health data. Switched off on the Automations tab.
import { CONTACT_EMAIL } from "@/lib/site";
import { CHECKS, type CheckState, type HealthCheck } from "@/lib/systemHealth";

import { adminEmails } from "./adminAuth";
import { todoList, type TodoKind, type TodoList } from "./adminTodo";
import { coachTotals, type CoachTotals } from "./adminUsers";
import { alertSettings, resendMailer, siteOrigin, type Mailer } from "./alerts";
import { query } from "./db";
import { getSetting, setSetting } from "./settings";
import { runCheck } from "./systemHealth";

const DAY = 86_400_000;

/** When it goes out: 8 AM in this zone. Vercel Cron runs in UTC, so the route runs at 15:00 and 16:00 UTC (8 AM PDT and PST). */
export const DIGEST_ZONE = "America/Los_Angeles";
export const DIGEST_HOUR = 8;
const SENT_KEY = "digest-sent";

export type Platform = "android" | "ios" | "web";
export const PLATFORMS: Platform[] = ["android", "ios", "web"];
const PLATFORM_NAME: Record<Platform, string> = { android: "Android", ios: "iOS", web: "web" };

export type Store = "play" | "appstore" | "web";
export const STORES: Store[] = ["play", "appstore", "web"];
const STORE_NAME: Record<Store, string> = { play: "Google Play", appstore: "App Store", web: "Stripe (web)" };

export interface Money {
  trials: number;
  /** First payments: a purchase, or a trial that turned into a paid plan. */
  started: number;
  renewals: number;
  /** Paid events (started + renewals) and what they came to, in US micros before store fees. */
  payments: number;
  usdMicros: number;
  cancels: number;
  refunds: number;
  /** Cancellations and expiries because a payment failed. */
  failed: number;
}

export interface DigestData {
  signups: Record<Platform, number>;
  installs: Record<Platform, number>;
  lifters: number;
  money: Record<Store, Money>;
  total: Money;
  todo: TodoList | null;
  checks: HealthCheck[] | null;
  /** Coaching in the last 24 hours plus the totals (null when it couldn't be read). */
  coaching: CoachTotals | null;
}

const zero = (): Money => ({ trials: 0, started: 0, renewals: 0, payments: 0, usdMicros: 0, cancels: 0, refunds: 0, failed: 0 });
const byPlatform = (): Record<Platform, number> => ({ android: 0, ios: 0, web: 0 });
const platformOf = (v: unknown): Platform => (v === "android" || v === "ios" ? v : "web");
const storeOf = (v: unknown): Store => (v === "play" || v === "appstore" ? v : "web");

/** Test installs (the panel's own and store reviewers') stay out, as everywhere in the panel. */
const REAL = "(install_id IS NULL OR install_id NOT IN (SELECT id FROM installs WHERE test = 1))";

/** Reads the last 24 hours. Each part that can't be read is null or zero, so the digest still goes out. */
export async function digestData(now = Date.now()): Promise<DigestData> {
  const since = now - DAY;
  const [todo, checks, signupRows, installRows, lifterRows, moneyRows, coaching] = await Promise.all([
    todoList(now).catch(() => null),
    Promise.all(CHECKS.map((c) => runCheck(c.id, { now }).then((r) => r.result))).catch(() => null),
    // An account's platform is where it first signed in: its first session.
    query<{ platform: string | null; n: number }>(
      `SELECT (SELECT s.platform FROM account_sessions s WHERE s.account_id = a.id ORDER BY s.created_at LIMIT 1) AS platform, COUNT(*) AS n
         FROM accounts a WHERE a.created_at > ? GROUP BY 1`,
      [since],
    ).catch(() => []),
    query<{ platform: string; n: number }>(
      "SELECT platform, COUNT(*) AS n FROM installs WHERE test = 0 AND first_seen > ? GROUP BY platform",
      [since],
    ).catch(() => []),
    query<{ n: number }>(`SELECT COUNT(DISTINCT install_id) AS n FROM events WHERE at > ? AND name = 'workout_finish' AND ${REAL}`, [
      since,
    ]).catch(() => []),
    query<{ store: string; kind: string; reason: string | null; n: number; usd: number | null }>(
      `SELECT store, kind, reason, COUNT(*) AS n, SUM(usd_micros) AS usd FROM subscription_events WHERE at > ? AND ${REAL} GROUP BY store, kind, reason`,
      [since],
    ).catch(() => []),
    coachTotals(now, since).catch(() => null),
  ]);
  const signups = byPlatform();
  for (const r of signupRows) signups[platformOf(r.platform)] += Number(r.n);
  const installs = byPlatform();
  for (const r of installRows) installs[platformOf(r.platform)] += Number(r.n);
  const money = { play: zero(), appstore: zero(), web: zero() } as Record<Store, Money>;
  for (const r of moneyRows) {
    const m = money[storeOf(r.store)];
    const n = Number(r.n);
    const kind = String(r.kind);
    if (kind === "trial_start") m.trials += n;
    if (kind === "purchase" || kind === "trial_convert") m.started += n;
    if (kind === "renew") m.renewals += n;
    if (kind === "purchase" || kind === "trial_convert" || kind === "renew") {
      m.payments += n;
      m.usdMicros += Number(r.usd ?? 0);
    }
    if (kind === "cancel") m.cancels += n;
    if (kind === "refund") m.refunds += n;
    if ((kind === "cancel" || kind === "expire") && r.reason === "billing") m.failed += n;
  }
  const total = zero();
  for (const s of STORES) for (const k of Object.keys(total) as (keyof Money)[]) total[k] += money[s][k];
  return { signups, installs, lifters: Number(lifterRows[0]?.n ?? 0), money, total, todo, checks, coaching };
}

// ---------- Wording ----------

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const usd = (micros: number) => `$${(micros / 1e6).toFixed(2)}`;
const sum = (r: Record<Platform, number>) => PLATFORMS.reduce((a, p) => a + r[p], 0);
const split = (r: Record<Platform, number>) => PLATFORMS.map((p) => `${PLATFORM_NAME[p]} ${r[p]}`).join(", ");

const TODO_GROUP: Record<TodoKind, string> = {
  inbox: "Email waiting for an answer",
  creator: "Creator payouts",
  billing: "Billing problems",
  job: "Scheduled jobs",
  gyms: "Gym claims and posters",
  setup: "Setup steps",
};

const STATE_WORD: Partial<Record<CheckState, string>> = { down: "down", warn: "needs a look" };

export interface Digest {
  subject: string;
  /** The opening line: sign-ups, payments and cancellations, as in Gradelings. */
  headline: string;
  sections: { title: string; lines: string[]; bullets?: string[] }[];
  todoCount: number;
  problems: number;
}

export function digestFrom(d: DigestData): Digest {
  const t = d.total;
  const headline = `Last 24 hours: ${plural(sum(d.signups), "sign-up", "sign-ups")}, ${plural(t.payments, "payment", "payments")} (${usd(t.usdMicros)} US), ${plural(t.cancels, "cancellation", "cancellations")}.`;

  const people = [
    `Sign-ups: ${sum(d.signups)} (${split(d.signups)}).`,
    `New installs: ${sum(d.installs)} (${split(d.installs)}).`,
    `${plural(d.lifters, "lifter", "lifters")} finished a workout.`,
  ];

  const c = d.coaching;
  const coaching = c
    ? [
        `${plural(c.coachesNew, "new coach", "new coaches")} (${c.coachesNewFromPage} from the coaches page), ${plural(c.clientsNew, "new client", "new clients")}.`,
        `All time: ${plural(c.coaches, "coach", "coaches")} (${c.coachesWithClients} with clients), ${plural(c.clients, "client", "clients")}.`,
      ]
    : ["Coaching couldn't be read."];

  const pro = [
    `${plural(t.trials, "trial", "trials")} started, ${plural(t.started, "new subscriber", "new subscribers")}, ${plural(t.renewals, "renewal", "renewals")}.`,
    `${plural(t.payments, "payment", "payments")}: ${usd(t.usdMicros)} US before store fees.`,
    `${plural(t.cancels, "cancellation", "cancellations")}, ${plural(t.refunds, "refund", "refunds")}${t.failed ? `, ${plural(t.failed, "failed payment", "failed payments")}` : ""}.`,
  ];
  const stores = STORES.filter((s) => Object.values(d.money[s]).some((v) => v > 0)).map((s) => {
    const m = d.money[s];
    const bits = [
      m.trials && plural(m.trials, "trial", "trials"),
      m.started && plural(m.started, "new subscriber", "new subscribers"),
      m.renewals && plural(m.renewals, "renewal", "renewals"),
      m.payments && `${usd(m.usdMicros)} US`,
      m.cancels && plural(m.cancels, "cancellation", "cancellations"),
      m.refunds && plural(m.refunds, "refund", "refunds"),
      m.failed && plural(m.failed, "failed payment", "failed payments"),
    ].filter(Boolean);
    return `${STORE_NAME[s]}: ${bits.join(", ")}`;
  });

  const items = d.todo?.items ?? [];
  const tasks = d.todo?.tasks.filter((x) => !x.doneAt) ?? [];
  const todoCount = items.length + tasks.length;
  const groups = new Map<string, number>();
  for (const i of items) groups.set(TODO_GROUP[i.kind], (groups.get(TODO_GROUP[i.kind]) ?? 0) + 1);
  if (tasks.length) groups.set("Your tasks", tasks.length);
  const todo = d.todo
    ? {
        title: "To do",
        lines: [todoCount ? `${plural(todoCount, "item", "items")}.` : "Nothing waiting."],
        bullets: [...groups].map(([k, n]) => `${k}: ${n}`),
      }
    : { title: "To do", lines: ["The To Do list couldn't be read."] };

  const checks = d.checks ?? [];
  const site = checks.find((c) => c.id === "site");
  const uptime = checks.find((c) => c.id === "uptime");
  const problems = checks.filter((c) => c.state === "down" || c.state === "warn");
  const health = d.checks
    ? [
        site ? `Live site: ${site.summary}` : null,
        uptime ? `Uptime: ${uptime.summary}` : null,
        problems.length
          ? `System: ${problems.map((p) => `${p.title} (${STATE_WORD[p.state]})`).join(", ")}.`
          : "System: everything is working.",
      ].filter((x): x is string => x != null)
    : ["System: couldn't be checked."];

  return {
    subject: `Today: ${todoCount} to do${problems.length ? `, ${plural(problems.length, "system problem", "system problems")}` : ""}`,
    headline,
    sections: [
      { title: "Site health", lines: health },
      { title: "Lifters", lines: people },
      { title: "Coaching", lines: coaching },
      { title: "Pro", lines: pro, bullets: stores.length ? stores : undefined },
      todo,
    ],
    todoCount,
    problems: problems.length,
  };
}

// ---------- The email ----------

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export interface DigestFooter {
  postalAddress: string | null;
  contact: string;
}

const WHY = "You get this because your account is an admin. Turn alerts or the digest off in the admin panel under Automations.";
const NO_ADS = "Liftsmith has no ads and never sells your information.";

export function digestMail(g: Digest, footer: DigestFooter, origin = siteOrigin()): { subject: string; text: string; html: string } {
  const admin = `${origin}/admin/`;
  const privacy = `${origin}/privacy/`;
  const text = [
    "Your morning digest",
    g.headline,
    ...g.sections.flatMap((s) => ["", `${s.title}`, ...s.lines, ...(s.bullets ?? []).map((b) => `• ${b}`)]),
    "",
    `Open the admin panel: ${admin}`,
    "",
    WHY,
    "",
    `${NO_ADS} Privacy: ${privacy} · Questions? ${footer.contact}`,
    footer.postalAddress ? `Liftsmith · ${footer.postalAddress}` : "Liftsmith",
  ].join("\n");

  const p = (s: string) => `<p style="font-size:15px;line-height:1.5;margin:0 0 6px">${esc(s)}</p>`;
  const small = (s: string) => `<p style="font-size:12px;line-height:1.5;color:#808c9d;margin:0 0 6px">${s}</p>`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="color-scheme" content="dark light"></head>
<body style="margin:0;background:#0a0d12;color:#e8edf4;font-family:Roboto,-apple-system,Segoe UI,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr>
<td style="padding-right:10px"><img src="${esc(origin)}/icon-192.png" width="40" height="40" alt="Liftsmith anvil and barbell" style="display:block;border-radius:10px"></td>
<td style="color:#4c8dff;font-weight:700;font-size:17px">Liftsmith</td></tr></table>
<h1 style="font-size:22px;margin:0 0 8px">Your morning digest</h1>
<p style="font-size:16px;line-height:1.5;margin:0 0 20px">${esc(g.headline)}</p>
${g.sections
  .map(
    (s) => `<div style="background:#121821;border:1px solid #222a35;border-radius:14px;padding:14px 16px;margin:0 0 12px">
<p style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#9aa6b6;font-weight:700;margin:0 0 8px">${esc(s.title)}</p>
${s.lines.map(p).join("\n")}${s.bullets?.length ? `<ul style="margin:6px 0 0;padding-left:20px">${s.bullets.map((b) => `<li style="font-size:15px;line-height:1.5">${esc(b)}</li>`).join("")}</ul>` : ""}
</div>`,
  )
  .join("\n")}
<p style="margin:22px 0"><a href="${esc(admin)}" style="display:inline-block;background:#4c8dff;color:#0a0d12;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:14px">Open the admin panel</a></p>
<hr style="border:0;border-top:1px solid #222a35;margin:24px 0 14px">
${small(esc(WHY))}
${small(`${esc(NO_ADS)} <a href="${esc(privacy)}" style="color:#808c9d">Privacy</a> · Questions? <a href="mailto:${esc(footer.contact)}" style="color:#808c9d">${esc(footer.contact)}</a>`)}
${small(esc(footer.postalAddress ? `Liftsmith · ${footer.postalAddress}` : "Liftsmith"))}
</div></body></html>`;
  return { subject: g.subject, text, html };
}

// ---------- When it goes out ----------

/** The date (YYYY-MM-DD) and hour in `zone` at `now`. */
export function localClock(now: number, zone = DIGEST_ZONE): { date: string; hour: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(now))
      .map((x) => [x.type, x.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

/** Due once 8 AM Pacific has come and today's hasn't gone out yet, so the 15:00 and 16:00 UTC runs send exactly one. */
export const digestDue = (now: number, lastSent: string | null) => {
  const c = localClock(now);
  return c.hour >= DIGEST_HOUR && c.date !== lastSent;
};

/**
 * The morning digest to every admin, unless it's switched off or today's already went out (`force` sends anyway,
 * for the Automations tab's test). Returns how many went out.
 */
export async function sendDigest(opts: { now?: number; mail?: Mailer | null; force?: boolean } = {}): Promise<number> {
  const now = opts.now ?? Date.now();
  if (!opts.force) {
    if (!(await alertSettings()).digest) return 0;
    if (!digestDue(now, await getSetting(SENT_KEY))) return 0;
  }
  const mail = opts.mail === undefined ? resendMailer() : opts.mail;
  const to = [...adminEmails()];
  if (!mail || !to.length) return 0;
  const m = digestMail(digestFrom(await digestData(now)), {
    postalAddress: process.env.MAIL_POSTAL_ADDRESS?.trim() || null,
    contact: CONTACT_EMAIL,
  });
  let sent = 0;
  for (const t of to) if (await mail(t, m.subject, m.text, m.html)) sent++;
  if (sent && !opts.force) await setSetting(SENT_KEY, localClock(now).date, now);
  return sent;
}
