"use client";

import { clockTime, t, weekday } from "@/lib/i18n";
import type { OpenState } from "@/lib/openingHours";

// "Open now · closes 10:00 PM" for a real gym (docs/decisions/gyms.md "Open now"), on the finder's rows and a gym's
// details. The words are the website's (gp.*), so the app and /gyms/ say it the same way.

const time = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return clockTime(h === 24 ? 0 : h!, m!);
};

/** The line for a state, `today` being the viewer's weekday, Monday = 0 as OSM counts. */
export function openText(s: OpenState, today: number): string {
  if (s.open) {
    if (s.closes == null) return t("gp.openAllHours");
    return t(s.soon ? "gp.openSoon" : "gp.openNow", { time: time(s.closes) });
  }
  if (s.opens == null || s.inDays == null) return t("gp.closedNow");
  if (s.inDays === 0) return t("gp.closedOpens", { time: time(s.opens) });
  if (s.inDays === 1) return t("gp.closedOpensTomorrow", { time: time(s.opens) });
  // OSM counts Monday first; weekday() counts Sunday as 0.
  return t("gp.closedOpensDay", { day: weekday((today + s.inDays + 1) % 7, "long"), time: time(s.opens) });
}

/** The colour says it at a glance (green open, amber closing soon, muted closed); the words always say it too. */
export function OpenNow({ state, today, className = "" }: { state: OpenState; today: number; className?: string }) {
  const tone = state.open ? (state.soon ? "text-warn" : "text-good") : "text-muted";
  return <span className={`num font-medium ${tone} ${className}`}>{openText(state, today)}</span>;
}
