// Server side of reminder emails: the subscription, double opt-in, unsubscribe, and the daily job that
// schedules the next day's emails with Resend. The routes under src/app/api/reminders/ and
// src/app/api/cron/reminders/ only add HTTP; everything here is tested with an in-memory store.
//
// What the server keeps per subscription: the email address, which kinds of email are on, when the
// lifter agreed, and the planner's numbers (training days and time, time zone, last and first workout
// times, days trained this week, streak, Pro state). No workouts, weights or health data. Tokens are
// stored hashed. The subscription has its own table with a nullable account id, so accounts can claim
// it later.
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { dateKey, EMAIL_KINDS, KIND_INFO, milestone, plan, validTz, type Message, type MessageKind, type PlanInput, type ProState } from "@/lib/messages";
import { confirmMail, messageMail, welcomeMail, type Footer, type Mail } from "./reminderEmails";

export type Status = "pending" | "confirmed" | "unsubscribed";
export type PlanFields = Omit<PlanInput, "kinds">;

export interface Sub {
  id: string;
  accountId: string | null;
  email: string;
  tokenHash: string;
  confirmHash: string | null;
  status: Status;
  kinds: Partial<Record<MessageKind, boolean>>;
  plan: PlanFields;
  consentAt: number;
  createdAt: number;
  updatedAt: number;
  confirmedAt: number | null;
  /** When confirmation emails went out, to cap them at 3 a day. */
  confirmSends: number[];
}

export interface Send {
  subId: string;
  key: string;
  kind: MessageKind | "welcome";
  sendAt: number;
  resendId: string | null;
  status: "scheduled" | "sent" | "cancelled";
}

export interface Store {
  get(id: string): Promise<Sub | null>;
  put(s: Sub): Promise<void>;
  remove(id: string): Promise<void>;
  confirmed(): Promise<Sub[]>;
  sends(subId: string, since: number): Promise<Send[]>;
  putSend(s: Send): Promise<void>;
  removeSends(subId: string): Promise<void>;
}

export interface Outgoing extends Mail {
  to: string;
  idempotencyKey: string;
  scheduledAt?: number;
  headers?: Record<string, string>;
}

export interface Mailer {
  send(m: Outgoing): Promise<{ id: string } | null>;
  cancel(id: string): Promise<boolean>;
}

export interface Env {
  siteUrl: string;
  secret: string;
  postalAddress: string;
}

const DAY = 86_400_000;
/** Each schedule run covers a little more than a day, so a late daily job leaves no gap. */
export const WINDOW = 26 * 3600_000;
/** Caps on top of the planner's one a day: three emails a rolling week, one Pro email a fortnight. */
export const CAPS = { perWeek: 3, proEvery: 14 * DAY, confirmPerDay: 3 } as const;

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const hex = (n: number) => randomBytes(n).toString("hex");

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** The unsubscribe token: an HMAC of the subscription id, so it never has to be stored. */
export const unsubToken = (id: string, secret: string) => createHmac("sha256", secret).update(`unsub:${id}`).digest("hex").slice(0, 32);

export const unsubUrl = (env: Env, id: string) => `${env.siteUrl}/api/reminders/unsubscribe/?s=${id}&t=${unsubToken(id, env.secret)}`;

const footer = (env: Env, id: string): Footer => ({ unsubscribeUrl: unsubUrl(env, id), postalAddress: env.postalAddress });

/** RFC 8058 one-click unsubscribe, which Gmail and Yahoo require of bulk senders. */
const listHeaders = (env: Env, id: string) => ({ "List-Unsubscribe": `<${unsubUrl(env, id)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" });

// --- Checking what the phone sends ---

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX = (n: number) => new RegExp(`^[0-9a-f]{${n}}$`);
const num = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const optNum = (v: unknown) => v === null || v === undefined || num(v);

export interface SubBody {
  id: string;
  token: string;
  email: string;
  kinds: Partial<Record<MessageKind, boolean>>;
  consentAt: number;
  resubscribe: boolean;
  plan: PlanFields;
}

export function checkBody(b: unknown): { ok: true; body: SubBody } | { ok: false; error: string } {
  if (!b || typeof b !== "object") return { ok: false, error: "Not a subscription" };
  const x = b as Record<string, unknown>;
  if (typeof x.id !== "string" || !HEX(32).test(x.id)) return { ok: false, error: "Bad id" };
  if (typeof x.token !== "string" || !HEX(64).test(x.token)) return { ok: false, error: "Bad token" };
  if (typeof x.email !== "string" || x.email.length > 254 || !EMAIL.test(x.email.trim())) return { ok: false, error: "Bad email" };
  if (!x.kinds || typeof x.kinds !== "object") return { ok: false, error: "Bad kinds" };
  const kinds: SubBody["kinds"] = {};
  for (const [k, v] of Object.entries(x.kinds)) {
    if (!EMAIL_KINDS.includes(k as MessageKind) || typeof v !== "boolean") return { ok: false, error: "Bad kinds" };
    kinds[k as MessageKind] = v;
  }
  if (typeof x.tz !== "string" || x.tz.length > 64 || !validTz(x.tz)) return { ok: false, error: "Bad time zone" };
  if (!Array.isArray(x.days) || x.days.length > 7 || !x.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) || new Set(x.days).size !== x.days.length) return { ok: false, error: "Bad days" };
  if (typeof x.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time)) return { ok: false, error: "Bad time" };
  if (!Number.isInteger(x.daysPerWeek) || (x.daysPerWeek as number) < 1 || (x.daysPerWeek as number) > 7) return { ok: false, error: "Bad days per week" };
  for (const k of ["startedAt", "weekStart", "consentAt"]) if (!num(x[k])) return { ok: false, error: `Bad ${k}` };
  for (const k of ["lastWorkoutAt", "firstWorkoutAt"]) if (!optNum(x[k])) return { ok: false, error: `Bad ${k}` };
  if (!Number.isInteger(x.weekDays) || (x.weekDays as number) < 0 || (x.weekDays as number) > 7) return { ok: false, error: "Bad weekDays" };
  if (!Number.isInteger(x.streakWeeks) || (x.streakWeeks as number) < 0 || (x.streakWeeks as number) > 5000) return { ok: false, error: "Bad streakWeeks" };
  const p = x.pro as Record<string, unknown> | undefined;
  let pro: ProState;
  if (p?.state === "pro") pro = { state: "pro" };
  else if (p?.state === "trial" && num(p.endsAt)) pro = { state: "trial", endsAt: p.endsAt as number };
  else if (p?.state === "free" && num(p.since)) pro = { state: "free", since: p.since as number };
  else return { ok: false, error: "Bad pro" };
  return {
    ok: true,
    body: {
      id: x.id,
      token: x.token,
      email: x.email.trim().toLowerCase(),
      kinds,
      consentAt: x.consentAt as number,
      resubscribe: x.resubscribe === true,
      plan: {
        tz: x.tz,
        days: x.days as number[],
        time: x.time,
        daysPerWeek: x.daysPerWeek as number,
        startedAt: x.startedAt as number,
        lastWorkoutAt: (x.lastWorkoutAt as number | null) ?? undefined,
        firstWorkoutAt: (x.firstWorkoutAt as number | null) ?? undefined,
        weekDays: x.weekDays as number,
        weekStart: x.weekStart as number,
        streakWeeks: x.streakWeeks as number,
        pro,
      },
    },
  };
}

// --- Handlers ---

export type Result = { code: number; body: { status?: Status; error?: string } };

async function sendConfirm(sub: Sub, store: Store, mail: Mailer, env: Env, now: number): Promise<boolean> {
  const recent = sub.confirmSends.filter((t) => now - t < DAY);
  if (recent.length >= CAPS.confirmPerDay) return false;
  const token = hex(32);
  sub.confirmHash = sha256(token);
  sub.confirmSends = [...recent, now];
  await store.put(sub);
  const m = confirmMail(`${env.siteUrl}/api/reminders/confirm/?s=${sub.id}&t=${token}`);
  await mail.send({ ...m, to: sub.email, idempotencyKey: `confirm-${sub.id}-${now}` });
  return true;
}

/** POST /api/reminders/: create or update a subscription. */
export async function subscribe(body: SubBody, store: Store, mail: Mailer, env: Env, now: number): Promise<Result> {
  const prev = await store.get(body.id);
  if (prev && !same(prev.tokenHash, sha256(body.token))) return { code: 403, body: { error: "Not yours" } };

  if (!prev) {
    const sub: Sub = { id: body.id, accountId: null, email: body.email, tokenHash: sha256(body.token), confirmHash: null, status: "pending", kinds: body.kinds, plan: body.plan, consentAt: body.consentAt, createdAt: now, updatedAt: now, confirmedAt: null, confirmSends: [] };
    await sendConfirm(sub, store, mail, env, now);
    return { code: 200, body: { status: "pending" } };
  }

  const sub: Sub = { ...prev, kinds: body.kinds, plan: body.plan, updatedAt: now };
  if (prev.email !== body.email || (prev.status === "unsubscribed" && body.resubscribe)) {
    // A new address, or someone who unsubscribed turning email back on: confirm again before sending anything.
    await cancelScheduled(sub, store, mail, now, () => true);
    Object.assign(sub, { email: body.email, status: "pending" as Status, confirmedAt: null, consentAt: body.consentAt });
    if (!(await sendConfirm(sub, store, mail, env, now))) await store.put(sub);
    return { code: 200, body: { status: "pending" } };
  }
  if (prev.status === "pending" && body.resubscribe) {
    if (!(await sendConfirm(sub, store, mail, env, now))) await store.put(sub);
    return { code: 200, body: { status: "pending" } };
  }
  await store.put(sub);
  if (sub.status === "confirmed") {
    const m = milestone(prev.plan, sub.plan, now);
    const on = sub.kinds.milestone ?? true;
    if (m && on) {
      const done = (await store.sends(sub.id, 0)).some((s) => s.key === m.key);
      if (!done) await deliver(sub, { ...m, kind: "milestone", at: now, route: "stats" }, store, mail, env, now);
    }
    await schedule(sub, store, mail, env, now);
  }
  return { code: 200, body: { status: sub.status } };
}

/** DELETE /api/reminders/: the lifter stopped email in the app. Cancels what's scheduled and erases the row. */
export async function remove(id: string, token: string, store: Store, mail: Mailer, now: number): Promise<Result> {
  const sub = await store.get(id);
  if (!sub) return { code: 404, body: { error: "Not found" } };
  if (!same(sub.tokenHash, sha256(token))) return { code: 403, body: { error: "Not yours" } };
  await cancelScheduled(sub, store, mail, now, () => true);
  await store.removeSends(id);
  await store.remove(id);
  return { code: 200, body: {} };
}

/** POST /api/reminders/confirm/: the button on the page the confirmation link opens. */
export async function confirm(id: string, token: string, store: Store, mail: Mailer, env: Env, now: number): Promise<"confirmed" | "already" | "invalid"> {
  const sub = await store.get(id);
  if (!sub) return "invalid";
  if (sub.status === "confirmed") return "already";
  if (!sub.confirmHash || !same(sub.confirmHash, sha256(token))) return "invalid";
  Object.assign(sub, { status: "confirmed" as Status, confirmHash: null, confirmedAt: now, updatedAt: now });
  await store.put(sub);
  const sends = await store.sends(sub.id, 0);
  if (!sends.some((s) => s.key === "welcome")) {
    const r = await mail.send({ ...welcomeMail(footer(env, sub.id)), to: sub.email, idempotencyKey: `welcome-${sub.id}`, headers: listHeaders(env, sub.id) });
    await store.putSend({ subId: sub.id, key: "welcome", kind: "welcome", sendAt: now, resendId: r?.id ?? null, status: "sent" });
  }
  await schedule(sub, store, mail, env, now);
  return "confirmed";
}

/** POST /api/reminders/unsubscribe/: the page's button, or a mail app's one-click unsubscribe. */
export async function unsubscribe(id: string, token: string, store: Store, mail: Mailer, env: Env, now: number): Promise<boolean> {
  if (!HEX(32).test(id) || !same(unsubToken(id, env.secret), token)) return false;
  const sub = await store.get(id);
  if (!sub) return true; // already gone
  await cancelScheduled(sub, store, mail, now, () => true);
  await store.put({ ...sub, status: "unsubscribed", updatedAt: now });
  return true;
}

/** The daily job: schedule the next day's emails for every confirmed subscription. */
export async function runDaily(store: Store, mail: Mailer, env: Env, now: number): Promise<{ subs: number; scheduled: number }> {
  let scheduled = 0;
  const subs = await store.confirmed();
  for (const sub of subs) scheduled += await schedule(sub, store, mail, env, now);
  return { subs: subs.length, scheduled };
}

// --- Scheduling ---

/** Whether a message would break a cap, given what was already sent or scheduled. */
export function capped(m: Pick<Message, "kind" | "at">, sends: readonly Send[], tz: string): boolean {
  const live = sends.filter((s) => s.status !== "cancelled" && s.kind !== "welcome");
  if (live.some((s) => dateKey(s.sendAt, tz) === dateKey(m.at, tz))) return true;
  if (live.filter((s) => s.sendAt > m.at - 7 * DAY && s.sendAt <= m.at).length >= CAPS.perWeek) return true;
  if (m.kind === "pro" && live.some((s) => s.kind === "pro" && Math.abs(m.at - s.sendAt) < CAPS.proEvery)) return true;
  return false;
}

async function deliver(sub: Sub, m: Pick<Message, "key" | "kind" | "at" | "title" | "body" | "route">, store: Store, mail: Mailer, env: Env, now: number): Promise<boolean> {
  const later = m.at - now > 60_000;
  const r = await mail.send({ ...messageMail(m, footer(env, sub.id)), to: sub.email, idempotencyKey: `${sub.id}-${m.key}`, scheduledAt: later ? m.at : undefined, headers: listHeaders(env, sub.id) });
  if (!r) return false;
  await store.putSend({ subId: sub.id, key: m.key, kind: m.kind, sendAt: later ? m.at : now, resendId: r.id, status: later ? "scheduled" : "sent" });
  return true;
}

async function cancelScheduled(sub: Sub, store: Store, mail: Mailer, now: number, which: (s: Send) => boolean) {
  for (const s of await store.sends(sub.id, now - DAY)) {
    if (s.status !== "scheduled" || s.sendAt <= now + 60_000 || !which(s)) continue;
    if (s.resendId) await mail.cancel(s.resendId);
    await store.putSend({ ...s, status: "cancelled" });
  }
}

/**
 * Brings one subscription's scheduled emails in line with its plan for the next day: cancels any that
 * no longer apply (say, a workout was logged) and schedules new ones within the caps.
 */
export async function schedule(sub: Sub, store: Store, mail: Mailer, env: Env, now: number): Promise<number> {
  if (sub.status !== "confirmed") return 0;
  const msgs = plan({ ...sub.plan, kinds: sub.kinds }, now, now + WINDOW, "email").filter((m) => KIND_INFO[m.kind].email);
  const keys = new Set(msgs.map((m) => m.key));
  await cancelScheduled(sub, store, mail, now, (s) => !keys.has(s.key));
  const sends = await store.sends(sub.id, now - 30 * DAY);
  let n = 0;
  for (const m of msgs) {
    if (sends.some((s) => s.key === m.key && s.status !== "cancelled")) continue;
    if (capped(m, sends, sub.plan.tz)) continue;
    if (await deliver(sub, m, store, mail, env, now)) {
      sends.push({ subId: sub.id, key: m.key, kind: m.kind, sendAt: m.at, resendId: null, status: "scheduled" });
      n++;
    }
  }
  return n;
}

// --- Implementations ---

export function memoryStore(): Store & { subs: Map<string, Sub>; all: Send[] } {
  const subs = new Map<string, Sub>();
  let all: Send[] = [];
  return {
    subs,
    get all() {
      return all;
    },
    async get(id) {
      const s = subs.get(id);
      return s ? structuredClone(s) : null;
    },
    async put(s) {
      subs.set(s.id, structuredClone(s));
    },
    async remove(id) {
      subs.delete(id);
    },
    async confirmed() {
      return [...subs.values()].filter((s) => s.status === "confirmed").map((s) => structuredClone(s));
    },
    async sends(subId, since) {
      return all.filter((s) => s.subId === subId && s.sendAt >= since).map((s) => ({ ...s }));
    },
    async putSend(s) {
      all = [...all.filter((x) => !(x.subId === s.subId && x.key === s.key)), { ...s }];
    },
    async removeSends(subId) {
      all = all.filter((s) => s.subId !== subId);
    },
  };
}

/** Resend over its HTTP API (scheduled_at for later sends, idempotency keys against double sends). */
export function resendMailer(apiKey: string, from: string): Mailer {
  return {
    async send(m) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": m.idempotencyKey.slice(0, 256) },
        body: JSON.stringify({ from, to: [m.to], subject: m.subject, text: m.text, html: m.html, headers: m.headers, ...(m.scheduledAt ? { scheduled_at: new Date(m.scheduledAt).toISOString() } : {}) }),
      });
      if (!r.ok) return null;
      return (await r.json()) as { id: string };
    },
    async cancel(id) {
      const r = await fetch(`https://api.resend.com/emails/${encodeURIComponent(id)}/cancel`, { method: "POST", headers: { Authorization: `Bearer ${apiKey}` } });
      return r.ok;
    },
  };
}

/** The server's settings, or null with what's missing (the routes answer 503 until it's set up). */
export function reminderEnv(e: Record<string, string | undefined> = process.env): { env: Env; apiKey: string; from: string } | { missing: string[] } {
  const need = { RESEND_API_KEY: e.RESEND_API_KEY, REMINDER_SECRET: e.REMINDER_SECRET, MAIL_FROM: e.MAIL_FROM, MAIL_POSTAL_ADDRESS: e.MAIL_POSTAL_ADDRESS };
  const missing = Object.entries(need).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) return { missing };
  return { env: { siteUrl: (e.NEXT_PUBLIC_SITE_URL ?? "https://www.getliftsmith.com").replace(/\/$/, ""), secret: need.REMINDER_SECRET!, postalAddress: need.MAIL_POSTAL_ADDRESS! }, apiKey: need.RESEND_API_KEY!, from: need.MAIL_FROM! };
}
