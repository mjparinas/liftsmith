// Email to the admins (Gradelings' src/server/alerts.ts): instant alerts when something goes wrong (a store payment
// failed, the reminder job failed, a System check went down or came back, repeated failed staff sign-ins), good news
// (a new paying customer), and a morning digest. They go only to ADMIN_EMAILS, never support. The same alert goes
// out at most once every 6 hours, so a flapping service doesn't flood the inbox. Counts and ids only: never a
// lifter's email, training or health data. Nothing here ever throws into the webhook or job that raised it.
import { CHECKS, type CheckId } from "@/lib/systemHealth";

import { adminEmails, supportEmails } from "./adminAuth";
import { todoList } from "./adminTodo";
import { query, run } from "./db";
import { getJson, getSetting, setSetting } from "./settings";
import { runCheck } from "./systemHealth";

const DAY = 86_400_000;
const HOUR = 3_600_000;
export const ALERT_GAP = 6 * HOUR;
/** Failed staff sign-ins that raise an alert: this many within the window. */
export const STAFF_FLOOD = { count: 5, windowMs: 15 * 60_000 };
export const STAFF_ALERT_KEY = "staff-sign-ins";

export interface AlertSettings {
  /** Alerts the moment something goes wrong, and new paying customers. */
  instant: boolean;
  /** The morning digest. */
  digest: boolean;
}

export async function alertSettings(): Promise<AlertSettings> {
  const s = await getJson<Partial<AlertSettings>>("alerts", {});
  return { instant: s.instant !== false, digest: s.digest !== false };
}

export const saveAlertSettings = (s: AlertSettings) => setSetting("alerts", JSON.stringify(s));

export const siteOrigin = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://www.getliftsmith.com").replace(/\/$/, "");

export type Mailer = (to: string, subject: string, text: string) => Promise<boolean>;

/** Sends through Resend with the sending key. Null without one. */
export function resendMailer(env: NodeJS.ProcessEnv = process.env, send: typeof fetch = fetch): Mailer | null {
  const key = env.RESEND_API_KEY;
  if (!key) return null;
  const from = env.ADMIN_FROM ?? env.FEEDBACK_FROM ?? env.MAIL_FROM ?? "Liftsmith admin <onboarding@resend.dev>";
  return async (to, subject, text) => {
    const r = await send("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    return r.ok;
  };
}

const body = (lines: string[], path?: string) =>
  [
    ...lines,
    ...(path ? ["", `Open the admin panel: ${siteOrigin()}${path}`] : []),
    "",
    "Sent by the Liftsmith admin panel. Switch alerts off under Automations.",
  ].join("\n");

/**
 * Sends an alert to every admin, unless alerts are off or the same alert (`key`) went out in the last 6 hours.
 * Returns whether it went out. Never throws.
 */
export async function sendAlert(
  key: string,
  a: { subject: string; lines: string[]; path?: string; news?: boolean },
  opts: { now?: number; mail?: Mailer | null } = {},
): Promise<boolean> {
  const now = opts.now ?? Date.now();
  try {
    if (!(await alertSettings()).instant) return false;
    const mail = opts.mail === undefined ? resendMailer() : opts.mail;
    const to = [...adminEmails()];
    if (!mail || !to.length) return false;
    const last = Number((await getSetting(`alert-sent:${key}`)) ?? 0);
    if (last && now - last < ALERT_GAP) return false;
    await setSetting(`alert-sent:${key}`, String(now), now);
    let sent = false;
    for (const t of to) sent = (await mail(t, a.news ? a.subject : `Alert: ${a.subject}`, body(a.lines, a.path))) || sent;
    return sent;
  } catch (e) {
    console.error("[alert] could not send", (e as Error).message);
    return false;
  }
}

// ---------- Store events (from the RevenueCat webhook) ----------

const STORE: Record<string, string> = { play: "Google Play", appstore: "the App Store" };
const PLAN: Record<string, string> = { monthly: "the monthly plan", annual: "the yearly plan" };

/**
 * Alerts for one stored store event: a new paying customer (the subscription's first paid event; renewals and a
 * subscriber who paid before aren't announced) or a payment failure. Never throws.
 */
export async function alertForStoreEvent(eventId: string, opts: { now?: number; mail?: Mailer | null } = {}): Promise<boolean> {
  try {
    const [e] = await query(
      "SELECT id, at, install_id, subscription, store, kind, plan, usd_micros, country, reason FROM subscription_events WHERE id = ?",
      [eventId],
    );
    if (!e) return false;
    const kind = String(e.kind);
    const store = STORE[String(e.store)] ?? String(e.store);
    const install = e.install_id == null ? null : String(e.install_id);
    const path = install ? `/admin/?tab=Installs&open=${encodeURIComponent(install)}` : "/admin/?tab=Revenue";
    if ((kind === "cancel" || kind === "expire") && e.reason === "billing")
      return await sendAlert(
        `billing:${String(e.subscription ?? eventId)}`,
        {
          subject: `A payment failed on ${store}`,
          lines: [
            `A ${PLAN[String(e.plan)] ?? "Pro"} subscriber's payment failed and the store ${kind === "cancel" ? "cancelled" : "ended"} it.`,
            "The store retries and emails them itself; there's nothing to refund.",
          ],
          path,
        },
        opts,
      );
    if (kind !== "purchase" && kind !== "trial_convert") return false;
    const earlier = await query(
      "SELECT 1 FROM subscription_events WHERE id != ? AND source = 'store' AND kind IN ('purchase', 'trial_convert', 'renew') AND ((subscription IS NOT NULL AND subscription = ?) OR (install_id IS NOT NULL AND install_id = ?)) AND at <= ? LIMIT 1",
      [eventId, e.subscription == null ? null : String(e.subscription), install, Number(e.at)],
    );
    if (earlier.length) return false;
    const [count] = await query<{ n: number }>(
      "SELECT COUNT(DISTINCT COALESCE(subscription, install_id)) AS n FROM subscription_events WHERE source = 'store' AND kind IN ('purchase', 'trial_convert')",
    );
    const n = Number(count?.n ?? 0);
    const usd = e.usd_micros == null ? null : Number(e.usd_micros) / 1e6;
    return await sendAlert(
      `new-customer:${String(e.subscription ?? eventId)}`,
      {
        news: true,
        subject: `New paying customer on ${store}`,
        lines: [
          `Someone ${kind === "trial_convert" ? "stayed on after their trial with" : "bought"} ${PLAN[String(e.plan)] ?? "Pro"}${usd != null ? ` ($${usd.toFixed(2)} US)` : ""}${e.country ? `, in ${String(e.country)}` : ""}.`,
          `That makes ${n} paying ${n === 1 ? "subscriber" : "subscribers"} so far.`,
        ],
        path,
      },
      opts,
    );
  } catch (e) {
    console.error("[alert] could not check a store event", (e as Error).message);
    return false;
  }
}

// ---------- Failed staff sign-ins ----------

export type StaffStep = "link" | "code";

export async function staffFailuresSince(since: number): Promise<{ total: number; byEmail: Record<string, number> }> {
  const rows = await query<{ email: string; n: number }>(
    "SELECT email, COUNT(*) AS n FROM staff_sign_in_failures WHERE at >= ? GROUP BY email",
    [since],
  );
  const byEmail: Record<string, number> = {};
  for (const r of rows) byEmail[String(r.email)] = Number(r.n);
  return { total: Object.values(byEmail).reduce((a, b) => a + b, 0), byEmail };
}

/** Notes a failed sign-in to a staff address (others are ignored) and alerts when several fail at once. Never throws. */
export async function reportStaffFailure(email: string, step: StaffStep, opts: { now?: number; mail?: Mailer | null } = {}): Promise<void> {
  const now = opts.now ?? Date.now();
  try {
    const e = email.toLowerCase();
    if (!adminEmails().has(e) && !supportEmails().has(e)) return;
    await run("DELETE FROM staff_sign_in_failures WHERE at < ?", [now - 30 * DAY]);
    await run("INSERT INTO staff_sign_in_failures (email, step, at) VALUES (?, ?, ?)", [e, step, now]);
    const recent = await staffFailuresSince(now - STAFF_FLOOD.windowMs);
    if (recent.total < STAFF_FLOOD.count) return;
    await sendAlert(
      STAFF_ALERT_KEY,
      {
        subject: "Repeated failed admin sign-ins",
        lines: [
          `${recent.total} sign-ins to admin or support addresses failed in the last ${STAFF_FLOOD.windowMs / 60_000} minutes.`,
          "If that wasn't you, check the Admin security card on the System tab.",
        ],
        path: "/admin/?tab=System",
      },
      opts,
    );
  } catch (e) {
    console.error("[alert] could not note a failed staff sign-in", (e as Error).message);
  }
}

// ---------- Watching the System checks, and the digest ----------

/** The checks worth watching on a schedule (status pages and settings are left to the digest). */
const WATCHED: CheckId[] = CHECKS.map((c) => c.id).filter((id) => id !== "settings");

/** Alerts when a System check goes down, and again once it's working. Run by `/api/cron/admin/` each day. */
export async function watchSystem(opts: { now?: number; mail?: Mailer | null } = {}): Promise<{ down: string[]; alerted: boolean }> {
  const now = opts.now ?? Date.now();
  const results = await Promise.all(WATCHED.map((id) => runCheck(id, { refresh: true, now })));
  const down = results.map((r) => r.result).filter((c) => c.state === "down");
  const before = new Set(await getJson<string[]>("alert:down", []));
  const ids = new Set(down.map((c) => c.id));
  const fresh = down.filter((c) => !before.has(c.id));
  const recovered = [...before].filter((id) => !ids.has(id));
  await setSetting("alert:down", JSON.stringify([...ids]), now);
  let alerted = false;
  if (fresh.length)
    alerted = await sendAlert(
      `down:${fresh
        .map((c) => c.id)
        .sort()
        .join(",")}`,
      {
        subject: `${fresh.map((c) => c.title).join(", ")} ${fresh.length === 1 ? "is" : "are"} down`,
        lines: fresh.map((c) => `${c.title}: ${c.summary}`),
        path: "/admin/?tab=System",
      },
      opts,
    );
  if (recovered.length) {
    const titles = recovered.map((id) => CHECKS.find((c) => c.id === id)?.title ?? id);
    alerted =
      (await sendAlert(
        `up:${recovered.sort().join(",")}`,
        { subject: `${titles.join(", ")} working again`, lines: titles.map((t) => `${t} is working again.`), path: "/admin/?tab=System" },
        opts,
      )) || alerted;
  }
  return { down: [...ids], alerted };
}

/** What the morning digest says: the last 24 hours in counts, what waits on To Do, and System problems. */
export async function digestLines(now = Date.now()): Promise<{ subject: string; lines: string[] }> {
  const since = now - DAY;
  const [todo, checks, counts] = await Promise.all([
    todoList(now).catch(() => null),
    Promise.all(WATCHED.map((id) => runCheck(id, { now }).then((r) => r.result))).catch(() => null),
    query<Record<string, number | null>>(
      `SELECT
         (SELECT COUNT(*) FROM installs WHERE test = 0 AND first_seen > ?) AS installs,
         (SELECT COUNT(DISTINCT install_id) FROM events WHERE at > ? AND name = 'workout_finish' AND install_id NOT IN (SELECT id FROM installs WHERE test = 1)) AS lifters,
         (SELECT COUNT(*) FROM subscription_events WHERE at > ? AND kind = 'trial_start') AS trials,
         (SELECT COUNT(*) FROM subscription_events WHERE at > ? AND kind IN ('purchase', 'trial_convert', 'renew')) AS payments,
         (SELECT SUM(usd_micros) FROM subscription_events WHERE at > ? AND kind IN ('purchase', 'trial_convert', 'renew')) AS usd,
         (SELECT COUNT(*) FROM subscription_events WHERE at > ? AND kind IN ('cancel', 'refund')) AS cancels,
         (SELECT COUNT(*) FROM accounts WHERE created_at > ?) AS accounts`,
      [since, since, since, since, since, since, since],
    ),
  ]);
  const c = counts[0] ?? {};
  const v = (k: string) => Number(c[k] ?? 0);
  const items = todo?.items ?? [];
  const tasks = todo?.tasks.filter((t) => !t.doneAt) ?? [];
  const problems = checks?.filter((x) => x.state === "down" || x.state === "warn") ?? [];
  const lines = [
    `Last 24 hours: ${v("installs")} new installs, ${v("lifters")} lifters worked out, ${v("accounts")} new accounts.`,
    `Money: ${v("trials")} trials started, ${v("payments")} payments ($${(v("usd") / 1e6).toFixed(2)} US before store fees), ${v("cancels")} cancellations or refunds.`,
    todo
      ? items.length + tasks.length
        ? `To do: ${items.length + tasks.length} waiting.`
        : "To do: nothing waiting."
      : "To do: couldn't be read.",
    ...items.slice(0, 8).map((i) => `• ${i.title}`),
    checks
      ? problems.length
        ? `System: ${problems.map((p) => `${p.title} (${p.state === "down" ? "down" : "needs a look"})`).join(", ")}.`
        : "System: everything is working."
      : "System: couldn't be checked.",
  ];
  const n = items.length + tasks.length;
  return {
    subject: `${n} to do${problems.length ? `, ${problems.length} system ${problems.length === 1 ? "problem" : "problems"}` : ""}`,
    lines,
  };
}

/** The morning digest to every admin, unless it's switched off. Returns how many went out. */
export async function sendDigest(opts: { now?: number; mail?: Mailer | null } = {}): Promise<number> {
  if (!(await alertSettings()).digest) return 0;
  const mail = opts.mail === undefined ? resendMailer() : opts.mail;
  const to = [...adminEmails()];
  if (!mail || !to.length) return 0;
  const d = await digestLines(opts.now);
  let sent = 0;
  for (const t of to) if (await mail(t, `Liftsmith today: ${d.subject}`, body(d.lines, "/admin/?tab=To%20Do"))) sent++;
  return sent;
}
