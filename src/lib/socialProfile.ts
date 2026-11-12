// A friend's profile, worked out on the reader's device: their training calendar and the days they usually
// train (from the posts the reader may see), and why someone is suggested. Decision record docs/decisions/friends.md
// ("People you may know and richer profiles").
import { list as fmtList, t, weekday } from "./i18n";
import { weekStart } from "./invite";
import { SOCIAL_LIMITS, type Suggestion } from "./socialTypes";

const DAY = 86_400_000;

/** One week of the calendar: its Monday and, for Monday to Sunday, whether a workout was posted that day. */
export interface CalendarWeek {
  start: number;
  days: boolean[];
}

/** The last `weeks` weeks, oldest first, Monday to Sunday in the reader's time zone. Days after today are false. */
export function trainingCalendar(trained: readonly number[], now: number, weeks = SOCIAL_LIMITS.calendarWeeks): CalendarWeek[] {
  const keys = new Set(trained.map((at) => new Date(at).toDateString()));
  const out: CalendarWeek[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const start = weekStart(now, w);
    const days: boolean[] = [];
    for (let d = 0; d < 7; d++) {
      // Noon, so a daylight-saving change never moves a day.
      const at = new Date(start + d * DAY + 12 * 3_600_000);
      at.setHours(12, 0, 0, 0);
      days.push(at.getTime() <= now + DAY && keys.has(at.toDateString()));
    }
    out.push({ start, days });
  }
  return out;
}

/**
 * The weekdays someone usually trains (Sunday = 0), so a friend can plan a session together: days with a workout
 * in at least a third of the weeks they trained at all, and at least twice. Empty with fewer than four workouts.
 */
export function usualDays(trained: readonly number[]): number[] {
  if (trained.length < 4) return [];
  const weeks = new Set(trained.map((at) => weekStart(at)));
  const count = new Array<number>(7).fill(0);
  const seen = new Set<string>();
  for (const at of trained) {
    const d = new Date(at);
    if (seen.has(d.toDateString())) continue;
    seen.add(d.toDateString());
    count[d.getDay()]!++;
  }
  const need = Math.max(2, Math.ceil(weeks.size / 3));
  // Monday first, like the calendar.
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => count[d]! >= need);
}

/** "Usually trains Monday, Wednesday and Friday", or null when there's no pattern yet. */
export function usualDaysLine(trained: readonly number[]): string | null {
  const days = usualDays(trained);
  if (!days.length || days.length > 6) return null;
  return t("social.usual", { days: fmtList(days.map((d) => weekday(d, "long"))) });
}

/** Why someone is suggested, in a short line. */
export function suggestionWhy(s: Pick<Suggestion, "reason" | "count" | "via">): string {
  switch (s.reason) {
    case "followsYou":
      return t("social.why.followsYou");
    case "partner":
      return t("social.why.partner");
    case "club":
      return t("social.why.club", { club: s.via ?? "" });
    case "mutual":
      return (s.count ?? 1) > 1
        ? t("social.why.mutualMany", { name: s.via ?? "", count: (s.count ?? 1) - 1 })
        : t("social.why.mutual", { name: s.via ?? "" });
  }
}
