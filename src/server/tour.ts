// The getting-started emails (Melvin, 2026-11-14: "a series of emails, with branding, that promote all the features
// the app has with actual in app screenshots. One per day"). Eight emails, one a day, each about one thing the app
// does, with the real screen from the Google Play listing in the reader's language (public/email/, made by
// scripts/email-images.mjs). They start the day after the subscription begins, go out at 10:00 in the lifter's time
// zone, and step aside for any other email that day (reminders.ts schedule()), so nobody gets two in a day. Never to
// under-18s. Each one has its own switch ("Getting started tips") and the unsubscribe link like every email.
import { BRAND } from "@/lib/brand";
import { addDays, atTime, dateKey, dayStart, inQuiet } from "@/lib/messages";
import { say, type MsgKey, type MsgLang } from "@/lib/messageText";
import { APP_PATH, SITE_URL } from "@/lib/site";

import { brandedMail, type Footer, type Mail } from "./reminderEmails";
import type { Send } from "./reminders";

/** What the server knows for the steps that wait on a flag (remindersDb.ts tourFlags). */
export interface TourFlags {
  /** The Wear OS app is live on Google Play (admin flag `wearOnPlay`). */
  wearOnPlay: boolean;
}

export const NO_TOUR_FLAGS: TourFlags = { wearOnPlay: false };

interface Step {
  id: string;
  image: string;
  route: string;
  /**
   * Added after the series started, behind this flag: sent in its place in the order to anyone still on Getting
   * started while the flag is on, and skipped by anyone who finished without it (they hear about it in the weekly
   * tips instead, weekly/list.ts `coveredBy`), so nobody who's done gets a ninth "Getting started" months later.
   */
  late?: keyof TourFlags;
}

/**
 * The series, in order: the Play listing's eight phone shots (01 to 08) and the screen each one opens, and the Wear
 * OS app (09: the watch app's own screens, scripts/email-watch.mjs; Melvin, 2026-11-26: "add the fact that we now
 * have support for wear os (android) smart watches"), right after the rest timer it carries to the wrist.
 */
export const TOUR: readonly Step[] = [
  { id: "plan", image: "01", route: "today" },
  { id: "why", image: "02", route: "today" },
  { id: "log", image: "03", route: "today" },
  { id: "weight", image: "04", route: "today" },
  { id: "rest", image: "05", route: "today" },
  { id: "watch", image: "09", route: "connections", late: "wearOnPlay" },
  { id: "recovery", image: "06", route: "recovery" },
  { id: "notes", image: "07", route: "stats" },
  { id: "awards", image: "08", route: "achievements" },
];

export type TourStep = Step;
export const TOUR_HOUR = "10:00";

const sentKeys = (sends: readonly Send[]) => new Set(sends.filter((s) => s.kind === "tour" && s.status !== "cancelled").map((s) => s.key));

/**
 * The steps this subscriber gets: every step that waits on nothing, plus a `late` step already sent, or one whose
 * flag is on while some other step is still to come.
 */
export function tourSteps(sends: readonly Send[], flags: TourFlags): Step[] {
  const done = sentKeys(sends);
  const rest = TOUR.filter((t) => !t.late);
  const running = rest.some((t) => !done.has(`tour:${t.id}`));
  return TOUR.filter((t) => !t.late || done.has(`tour:${t.id}`) || (flags[t.late] && running));
}

export interface TourSend {
  key: string;
  at: number;
  step: TourStep;
  n: number;
  /** How many steps this subscriber gets ("3 of 9"). */
  total: number;
}

/**
 * The next tour email, if one is due between `from` and `to`: the first step not yet sent or scheduled, at 10:00 on
 * a day after the last one, on a day with no other email (the welcome included).
 */
export function nextTour(sends: readonly Send[], tz: string, from: number, to: number, flags: TourFlags = NO_TOUR_FLAGS): TourSend | null {
  const live = sends.filter((s) => s.status !== "cancelled");
  const done = sentKeys(live);
  const steps = tourSteps(live, flags);
  const n = steps.findIndex((t) => !done.has(`tour:${t.id}`));
  if (n < 0) return null;
  const step = steps[n]!;
  const busy = new Set(live.map((s) => dateKey(s.sendAt, tz)));
  const lastTour = Math.max(0, ...live.filter((s) => s.kind === "tour").map((s) => s.sendAt));
  // A while loop, not `for (…; …; day = addDays(…))`: the bundler left the imported addDays bare in that
  // for-loop's update, so the daily job threw "addDays is not defined" in production (scripts/bundle-check.mjs).
  let day = dayStart(from, tz);
  while (day < to) {
    const at = atTime(day, TOUR_HOUR, tz);
    if (at >= from && at < to && at > lastTour && !inQuiet(at, tz) && !busy.has(dateKey(at, tz)))
      return { key: `tour:${step.id}`, at, step, n, total: steps.length };
    day = addDays(day, 1, tz);
  }
  return null;
}

const k = (id: string, part: string) => `rmd.tour.${id}.${part}` as MsgKey;

/** One tour email: the screen, its title, two short lines, and a button to that screen. */
export function tourMail(t: Pick<TourSend, "step" | "n"> & { total?: number }, footer: Footer, lang: MsgLang | undefined): Mail {
  const l = lang ?? "en";
  const total = t.total ?? TOUR.filter((s) => !s.late).length;
  return brandedMail(lang, {
    title: say(lang, k(t.step.id, "title")),
    paras: [say(lang, k(t.step.id, "body")), say(lang, k(t.step.id, "tip"))],
    image: {
      url: `${SITE_URL}/email/${l}/${t.step.image}.jpg`,
      alt: say(lang, k(t.step.id, "title")),
    },
    cta: { label: say(lang, "rmd.tour.cta", { brand: BRAND.name }), url: `${SITE_URL}${APP_PATH}#/${t.step.route}` },
    footer,
    why: say(lang, "rmd.mail.whyTour", { n: t.n + 1, total }),
    kicker: say(lang, "rmd.tour.kicker", { n: t.n + 1, total }),
  });
}
