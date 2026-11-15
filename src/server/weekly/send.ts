// When the weekly tips go out, and what each one says (docs/decisions/weekly-emails.md). One email a week once
// Getting started is over, at 10:00 local on a Tuesday, or the next free weekday up to Saturday when Tuesday already
// has an email. Like the tour it steps aside for any other email on its day (reminders.ts schedule()) and doesn't
// count toward the caps, but it never lands on a day that already has one, in a week that already has three, or in a
// week with a trial-ending email.
import { BRAND } from "@/lib/brand";
import { addDays, atTime, dateKey, dayStart, inQuiet, parts, type ProState } from "@/lib/messages";
import type { MsgLang } from "@/lib/messageText";
import { APP_PATH, SITE_URL } from "@/lib/site";

import { brandedMail, type Footer, type Mail } from "../reminderEmails";
import type { Send } from "../reminders";
import { TOUR } from "../tour";
import { PRO_PRICE, WEEKLY, type Role, type WeeklyEmail } from "./list";
import * as de from "./text/de";
import * as en from "./text/en";
import * as es from "./text/es";
import * as fr from "./text/fr";
import * as it from "./text/it";
import * as ja from "./text/ja";

export const TEXT: Record<MsgLang, { common: en.Common; emails: Record<string, en.Words> }> = { en, es, fr, de, it, ja };

export const WEEKLY_HOUR = "10:00";
const DAY = 86_400_000;
/** Getting started's last email, then a week's quiet, then the first weekly tip. */
export const AFTER_TOUR = 7 * DAY;
/** With Getting started switched off, the weekly tips start as if it had run: eight days, then a week. */
export const WITHOUT_TOUR = 15 * DAY;
/** At most this many other emails in the seven days before a weekly tip (reminders.ts CAPS.perWeek). */
const WEEK_CAP = 3;
/** Tuesday (2) first, then the days after it, Saturday (6) last. */
const DAYS = new Set([2, 3, 4, 5, 6]);

/** What the server knows about the account, for the emails meant for some people only. */
export interface WeeklyFacts {
  roles: Role[];
  flags: { coachPlans: boolean };
}

export const NO_FACTS: WeeklyFacts = { roles: [], flags: { coachPlans: false } };

export interface WeeklySend {
  key: string;
  at: number;
  email: WeeklyEmail;
  /** How many weekly tips this account has had before this one (the kicker shows n + 1). */
  n: number;
}

export const weeklyKey = (e: Pick<WeeklyEmail, "id">) => `weekly:${e.id}`;

/** Whether this email is for this account: its role, not a role it's kept from, and any flag it waits for. */
export function forAccount(e: WeeklyEmail, f: WeeklyFacts): boolean {
  if (e.audience !== "lifter" && !f.roles.includes(e.audience)) return false;
  if (e.notFor?.some((r) => f.roles.includes(r))) return false;
  if (e.needsFlag && !f.flags[e.needsFlag]) return false;
  return true;
}

/** The emails still to send, in order: brand-new features first (oldest first), then the list. */
export function queue(sent: ReadonlySet<string>, f: WeeklyFacts): WeeklyEmail[] {
  const left = WEEKLY.filter((e) => !sent.has(weeklyKey(e)) && forAccount(e, f));
  const fresh = left.filter((e) => e.fresh).sort((a, b) => a.fresh!.localeCompare(b.fresh!));
  return [...fresh, ...left.filter((e) => !e.fresh)];
}

/**
 * When the weekly tips may start: a week after Getting started's last email once all eight are out, or fifteen days
 * after the subscription began when Getting started is switched off. Null while Getting started is still running.
 */
export function weeklyStart(sends: readonly Send[], tourOn: boolean, since: number): number | null {
  const tour = sends.filter((s) => s.kind === "tour" && s.status !== "cancelled");
  const done = TOUR.every((t) => tour.some((s) => s.key === `tour:${t.id}`));
  if (done) return Math.max(...tour.map((s) => s.sendAt)) + AFTER_TOUR;
  return tourOn ? null : since + WITHOUT_TOUR;
}

/** The Monday that starts the local week holding `ms`, as a date key: one weekly tip per calendar week. */
function weekOf(ms: number, tz: string): string {
  let day = dayStart(ms, tz);
  let n = 0;
  while (parts(day + 12 * 3600_000, tz).wd !== 1 && n++ < 7) day = addDays(day, -1, tz);
  return dateKey(day + 12 * 3600_000, tz);
}

/** The next weekly tip due between `from` and `to`, if any (see the top of this file for the rules). */
export function nextWeekly(
  sends: readonly Send[],
  tz: string,
  from: number,
  to: number,
  start: number,
  facts: WeeklyFacts,
): WeeklySend | null {
  const live = sends.filter((s) => s.status !== "cancelled");
  const weekly = live.filter((s) => s.kind === "weekly");
  const email = queue(new Set(weekly.map((s) => s.key)), facts)[0];
  if (!email) return null;
  // One a calendar week, and none in a week with a trial-ending email: that one matters more.
  const weeks = new Set(live.filter((s) => s.kind === "weekly" || s.kind === "trial").map((s) => weekOf(s.sendAt, tz)));
  const others = live.filter((s) => s.kind !== "weekly" && s.kind !== "tour" && s.kind !== "welcome");
  const busy = new Set(live.map((s) => dateKey(s.sendAt, tz)));
  // A while loop: see nextTour (the bundler once dropped an imported addDays from a for-loop's update).
  let day = dayStart(from, tz);
  while (day < to) {
    const at = atTime(day, WEEKLY_HOUR, tz);
    const ok =
      at >= from &&
      at < to &&
      at >= start &&
      DAYS.has(parts(at, tz).wd) &&
      !inQuiet(at, tz) &&
      !busy.has(dateKey(at, tz)) &&
      !weeks.has(weekOf(at, tz)) &&
      others.filter((s) => s.sendAt > at - 7 * DAY && s.sendAt <= at).length < WEEK_CAP;
    if (ok) return { key: weeklyKey(email), at, email, n: weekly.length };
    day = addDays(day, 1, tz);
  }
  return null;
}

const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => String(vars[k] ?? m));

/** The screenshot for an email under public/email/<lang>/, or null for one that goes without (list.ts `shot`). */
export const imageOf = (e: WeeklyEmail) => (e.shot === false ? null : `w/${e.id}`);

/** The line after the points: what Pro or Labs means for this reader, or nothing for a free feature. */
export function ending(e: WeeklyEmail, c: en.Common, pro: ProState): string[] {
  if (e.plain || e.tier === "free") return [];
  const own = pro.state === "pro" ? c.proHave : pro.state === "trial" ? c.proTrial : fill(c.proFree, PRO_PRICE);
  return e.tier === "lab" ? [c.lab, own] : [own];
}

/** One weekly tip: a title, a line, the points, the Pro or Labs line, "Did you know?", the button and the screen. */
export function weeklyMail(w: Pick<WeeklySend, "email" | "n">, footer: Footer, lang: MsgLang | undefined, pro: ProState): Mail {
  const l = lang ?? "en";
  const { common: c, emails } = TEXT[l];
  const words = emails[w.email.id] ?? en.emails[w.email.id]!;
  const sell = w.email.id === "why-pro" && pro.state !== "pro";
  const shot = imageOf(w.email);
  return brandedMail(lang, {
    title: words.title,
    paras: [words.intro],
    points: words.points,
    after: ending(w.email, c, pro),
    dyk: { label: c.dykLabel, text: words.dyk },
    image: shot ? { url: `${SITE_URL}/email/${l}/${shot}.jpg`, alt: words.title } : undefined,
    cta: { label: sell ? c.ctaPro : fill(c.cta, { brand: BRAND.name }), url: `${SITE_URL}${APP_PATH}#/${w.email.route}` },
    footer,
    why: c.why,
    kicker: fill(c.kicker, { n: w.n + 1 }),
  });
}
