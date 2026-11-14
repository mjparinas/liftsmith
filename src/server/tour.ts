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

/** The series, in order: the Play listing's eight phone shots (01 to 08) and the screen each one opens. */
export const TOUR = [
  { id: "plan", image: "01", route: "today" },
  { id: "why", image: "02", route: "today" },
  { id: "log", image: "03", route: "today" },
  { id: "weight", image: "04", route: "today" },
  { id: "rest", image: "05", route: "today" },
  { id: "recovery", image: "06", route: "recovery" },
  { id: "notes", image: "07", route: "stats" },
  { id: "awards", image: "08", route: "achievements" },
] as const;

export type TourStep = (typeof TOUR)[number];
export const TOUR_HOUR = "10:00";

export interface TourSend {
  key: string;
  at: number;
  step: TourStep;
  n: number;
}

/**
 * The next tour email, if one is due between `from` and `to`: the first step not yet sent or scheduled, at 10:00 on
 * a day after the last one, on a day with no other email (the welcome included).
 */
export function nextTour(sends: readonly Send[], tz: string, from: number, to: number): TourSend | null {
  const live = sends.filter((s) => s.status !== "cancelled");
  const done = new Set(live.filter((s) => s.kind === "tour").map((s) => s.key));
  const n = TOUR.findIndex((t) => !done.has(`tour:${t.id}`));
  if (n < 0) return null;
  const step = TOUR[n]!;
  const busy = new Set(live.map((s) => dateKey(s.sendAt, tz)));
  const lastTour = Math.max(0, ...live.filter((s) => s.kind === "tour").map((s) => s.sendAt));
  for (let day = dayStart(from, tz); day < to; day = addDays(day, 1, tz)) {
    const at = atTime(day, TOUR_HOUR, tz);
    if (at < from || at >= to || at <= lastTour || inQuiet(at, tz)) continue;
    if (busy.has(dateKey(at, tz))) continue;
    return { key: `tour:${step.id}`, at, step, n };
  }
  return null;
}

const k = (id: string, part: string) => `rmd.tour.${id}.${part}` as MsgKey;

/** One tour email: the screen, its title, two short lines, and a button to that screen. */
export function tourMail(t: Pick<TourSend, "step" | "n">, footer: Footer, lang: MsgLang | undefined): Mail {
  const l = lang ?? "en";
  return brandedMail(lang, {
    title: say(lang, k(t.step.id, "title")),
    paras: [say(lang, k(t.step.id, "body")), say(lang, k(t.step.id, "tip"))],
    image: {
      url: `${SITE_URL}/email/${l}/${t.step.image}.jpg`,
      alt: say(lang, k(t.step.id, "title")),
    },
    cta: { label: say(lang, "rmd.tour.cta", { brand: BRAND.name }), url: `${SITE_URL}${APP_PATH}#/${t.step.route}` },
    footer,
    why: say(lang, "rmd.mail.whyTour", { n: t.n + 1, total: TOUR.length }),
    kicker: say(lang, "rmd.tour.kicker", { n: t.n + 1, total: TOUR.length }),
  });
}
