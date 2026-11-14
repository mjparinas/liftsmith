"use client";

// The phone side of reminders and lifecycle messages (messages.ts has the rules).
//  - Push: local notifications scheduled on the phone for the next two weeks, so they work offline and
//    with no account or server. Rescheduled when the app opens, comes back to the foreground, a
//    workout ends, or a setting changes. Android and iOS through @capacitor/local-notifications, on a
//    separate "Reminders" channel on Android so it can be muted on its own.
//  - Email: an opt-in subscription on the server (/api/reminders/) to the signed-in account's email. The
//    request carries the account's session, so the server knows the address is verified and starts at once;
//    an older subscription to another address stays double opt-in. The phone sends only the fields the planner needs (PlanInput), never workouts or health data.
//    The subscription id and its secret stay in this device's storage.
//  - Web: browsers can't schedule a notification while the page is closed without a push server, so
//    the web app offers email reminders only (documented in AGENTS.md).
import { LocalNotifications } from "@capacitor/local-notifications";

import { useAccount } from "./auth";
import { storePro } from "./billing";
import { trainingDays } from "./calendar";
import type { Stats } from "./derive";
import { goalStreak } from "./game";
import { currentLang } from "./i18n";
import { isNative } from "./juice";
import { dayStart, mondayIn, plan, proState, type Message, type MessageKind, type PlanInput } from "./messages";
import { SITE_URL } from "./site";
import { isTeen } from "./teen";
import type { Profile } from "./types";

export const HORIZON_DAYS = 14;
const DAY = 86_400_000;
export const CHANNEL_ID = "reminders";
export const SUB_KEY = "liftsmith.mailSub";

export const deviceTz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

/** The planner's input from the lifter's profile and stats: a handful of numbers, nothing more. */
export function planInput(profile: Profile, stats: Stats, now: number, channel: "push" | "email", tz = deviceTz()): PlanInput {
  const starts = stats.sessions.map((s) => s.start);
  const monday = mondayIn(now, tz);
  const weekDays = new Set(starts.filter((t) => t >= monday).map((t) => dayStart(t, tz))).size;
  const g = goalStreak(stats, profile, now);
  const prefs = profile.messages;
  return {
    tz,
    days: trainingDays(profile),
    time: profile.calendar?.time ?? "18:00",
    daysPerWeek: profile.daysPerWeek,
    startedAt: prefs?.startedAt ?? profile.blockStart,
    lastWorkoutAt: starts.length ? Math.max(...starts) : undefined,
    firstWorkoutAt: starts.length ? Math.min(...starts) : undefined,
    weekDays,
    weekStart: monday,
    // goalStreak counts this week once it's met; the planner wants the weeks before it.
    streakWeeks: g.weeks - (g.thisWeek >= Math.max(1, profile.daysPerWeek) ? 1 : 0),
    pro: storePro(now) ?? proState(profile.pro, now),
    kinds: (channel === "push" ? prefs?.push : prefs?.email?.kinds) ?? {},
    lang: currentLang(),
  };
}

/** A stable 31-bit notification id for a message key (iOS and Android both want an integer). */
export function notificationId(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return ((h >>> 0) % 2_000_000_000) + 1000; // ids under 1000 are left for other notifications
}

// --- Push (local notifications) ---

export const pushSupported = () => isNative();

export async function pushAllowed(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    return (await LocalNotifications.checkPermissions()).display === "granted";
  } catch {
    return false;
  }
}

export async function askPush(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    return (await LocalNotifications.requestPermissions()).display === "granted";
  } catch {
    return false;
  }
}

let channelMade = false;

/** Replaces every pending reminder with the plan for the next two weeks. Returns what was scheduled. */
export async function schedulePush(profile: Profile, stats: Stats, now = Date.now()): Promise<Message[]> {
  if (!pushSupported() || !profile.onboarded) return [];
  try {
    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications.filter((n) => (n.extra as { liftsmith?: boolean } | undefined)?.liftsmith);
    if (ours.length) await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
    if (!(await pushAllowed())) return [];
    const msgs = plan(planInput(profile, stats, now, "push"), now + 60_000, now + HORIZON_DAYS * DAY, "push");
    if (!msgs.length) return [];
    if (!channelMade) {
      // Android only; iOS has no channels and the plugin ignores this there.
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: "Reminders",
        description: "Workout reminders, streak alerts and offers you turned on",
        importance: 3,
      }).catch(() => {});
      channelMade = true;
    }
    await LocalNotifications.schedule({
      notifications: msgs.map((m) => ({
        id: notificationId(m.key),
        title: m.title,
        body: m.body,
        channelId: CHANNEL_ID,
        // Inexact is fine for a reminder, and never sends the lifter to the "Alarms" settings screen.
        isExactNotification: false,
        schedule: { at: new Date(m.at), allowWhileIdle: true },
        extra: { liftsmith: true, route: m.route, kind: m.kind },
      })),
    });
    return msgs;
  } catch {
    return [];
  }
}

/** Taps on a reminder open the screen it points to. Returns an unsubscribe function. */
export function onReminderTap(cb: (route: string) => void): () => void {
  if (!pushSupported()) return () => {};
  const h = LocalNotifications.addListener("localNotificationActionPerformed", (a) => {
    const extra = a.notification.extra as { liftsmith?: boolean; route?: string } | undefined;
    if (extra?.liftsmith && extra.route) cb(extra.route);
  });
  return () => void h.then((x) => x.remove()).catch(() => {});
}

// --- Email subscription ---

export interface MailSub {
  id: string;
  token: string;
}

export type MailStatus = "pending" | "confirmed" | "unsubscribed";

export const remindersUrl = () => (isNative() || typeof location === "undefined" ? `${SITE_URL}/api/reminders/` : "/api/reminders/");

function randomHex(bytes: number): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function mailSub(): MailSub | null {
  try {
    const s = JSON.parse(localStorage.getItem(SUB_KEY) ?? "null") as MailSub | null;
    return s?.id && s.token ? s : null;
  } catch {
    return null;
  }
}

function ensureSub(): MailSub {
  const s = mailSub() ?? { id: randomHex(16), token: randomHex(32) };
  try {
    localStorage.setItem(SUB_KEY, JSON.stringify(s));
  } catch {}
  return s;
}

/** The body the server stores. Only these fields, nothing about workouts beyond the planner's numbers. */
export function subscriptionBody(profile: Profile, stats: Stats, now: number, sub: MailSub, resubscribe = false) {
  const email = profile.messages?.email;
  const i = planInput(profile, stats, now, "email");
  return {
    id: sub.id,
    token: sub.token,
    email: email?.address ?? "",
    kinds: i.kinds,
    consentAt: email?.consentAt ?? now,
    resubscribe,
    tz: i.tz,
    days: i.days,
    time: i.time,
    daysPerWeek: i.daysPerWeek,
    startedAt: i.startedAt,
    lastWorkoutAt: i.lastWorkoutAt ?? null,
    firstWorkoutAt: i.firstWorkoutAt ?? null,
    weekDays: i.weekDays,
    weekStart: i.weekStart,
    streakWeeks: i.streakWeeks,
    pro: i.pro,
    lang: i.lang,
  };
}

/**
 * Sends the subscription to the server (creates it, or updates the schedule). Returns the server's
 * status, or null when offline or the server isn't set up (the next sync tries again).
 */
export async function syncEmail(
  profile: Profile,
  stats: Stats,
  opts: { resubscribe?: boolean; now?: number } = {},
): Promise<MailStatus | null> {
  if (!profile.messages?.email?.address) return null;
  const sub = ensureSub();
  // The account's session tells the server the address is the account's own, already verified.
  const token = useAccount.getState().account?.token;
  try {
    const r = await fetch(remindersUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(subscriptionBody(profile, stats, opts.now ?? Date.now(), sub, opts.resubscribe)),
    });
    if (!r.ok) return null;
    return ((await r.json()) as { status: MailStatus }).status;
  } catch {
    return null;
  }
}

/** Stops every email and deletes the address from the server. Local settings are cleared by the caller. */
export async function deleteEmail(): Promise<boolean> {
  const sub = mailSub();
  if (!sub) return true;
  try {
    const r = await fetch(remindersUrl(), { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub) });
    if (!r.ok && r.status !== 404) return false;
  } catch {
    return false;
  }
  try {
    localStorage.removeItem(SUB_KEY);
  } catch {}
  return true;
}

/**
 * Email is on by default (Melvin, 2026-11-14: "Email me setting should be on by default for all users"): once a
 * signed-in adult's device has synced with the account (so a fresh phone doesn't start a second subscription before
 * the account's settings arrive), the account's verified address is subscribed unless the lifter turned email off.
 * Under-18s start with it off and can turn it on. Returns the new prefs, or null when nothing should change.
 */
export function autoEmailPrefs(
  profile: Profile,
  email: string | null,
  synced: boolean,
  now = Date.now(),
): NonNullable<Profile["messages"]> | null {
  const prefs = profile.messages ?? { push: {} };
  if (!email || !synced || !profile.onboarded || prefs.email || prefs.emailOff || isTeen(profile, now)) return null;
  return { ...prefs, startedAt: prefs.startedAt ?? now, email: { address: email, consentAt: now, status: "pending", kinds: {} } };
}

/** Turns email on by default (autoEmailPrefs) and makes this device the one that keeps the subscription up to date. */
export function startDefaultEmail(profile: Profile, synced: boolean, save: (m: NonNullable<Profile["messages"]>) => void): boolean {
  const next = autoEmailPrefs(profile, accountEmail(), synced);
  if (!next) return false;
  ensureSub();
  save(next);
  return true;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export type { MessageKind };

// --- Keeping both in step with the lifter's data ---

let timer: ReturnType<typeof setTimeout> | undefined;
let lastEmailBody = "";

/** The signed-in account's email, lower case, or null when signed out or the account has none. */
export const accountEmail = () => useAccount.getState().account?.email?.trim().toLowerCase() || null;

/**
 * Reschedules push reminders and updates the email subscription a moment after anything changes
 * (debounced, so a burst of logged sets does it once). Email only goes out when the address is
 * confirmed or pending, and only when something the server uses has changed. A subscription still
 * waiting for confirmation moves to the signed-in account's address, which the server confirms at once.
 */
export function refreshReminders(
  get: () => { profile: Profile; stats: Stats },
  onStatus?: (s: MailStatus, address: string) => void,
  delay = 1500,
) {
  clearTimeout(timer);
  const run = async () => {
    const { profile: p, stats } = get();
    await schedulePush(p, stats);
    const saved = p.messages?.email;
    if (!saved?.address || saved.status === "unsubscribed") return;
    const sub = mailSub();
    if (!sub) return;
    const mine = accountEmail();
    const email = mine && saved.status === "pending" ? { ...saved, address: mine } : saved;
    const profile = email === saved ? p : { ...p, messages: { ...p.messages!, email } };
    const now = Date.now();
    const body = JSON.stringify({ ...subscriptionBody(profile, stats, now, sub), consentAt: 0, signedIn: !!mine });
    if (body === lastEmailBody) return;
    const status = await syncEmail(profile, stats, { now });
    if (status) {
      lastEmailBody = body;
      if (status !== saved.status || email.address !== saved.address) onStatus?.(status, email.address);
    }
  };
  timer = setTimeout(() => void run(), delay);
}
