// Opening hours as OpenStreetMap writes them ("Mo-Th 05:00-22:00; Fr 05:00-21:00; Sa,Su 07:00-19:00", "24/7"),
// turned into one line per weekday for a gym's page (docs/decisions/gyms.md). Only the common forms are read: day
// ranges and lists, one or more time ranges, "off", "24/7" and public holidays (PH, skipped). Anything else gives
// null and the page shows the hours as written, so a rule we don't understand is never shown wrong.

/** Monday first, as OSM counts. */
export const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
export type Day = (typeof DAYS)[number];

/** For each weekday, Monday first: its time ranges ("05:00-22:00"), empty when closed. */
export type Week = string[][];

const TIME = /^([01]?\d|2[0-4]):([0-5]\d)-([01]?\d|2[0-4]):([0-5]\d)$/;
const pad = (t: string) => t.replace(/^(\d):/, "0$1:");

function days(spec: string): number[] | null {
  const out = new Set<number>();
  for (const part of spec.split(",")) {
    const [a, b] = part.split("-");
    const i = DAYS.indexOf(a as Day);
    if (i < 0) return null;
    if (b === undefined) {
      out.add(i);
      continue;
    }
    const j = DAYS.indexOf(b as Day);
    if (j < 0) return null;
    for (let k = i; ; k = (k + 1) % 7) {
      out.add(k);
      if (k === j) break;
    }
  }
  return [...out];
}

export function parseHours(raw: string): Week | null {
  const text = raw.trim();
  if (!text) return null;
  if (text === "24/7") return DAYS.map(() => ["00:00-24:00"]);
  const week: Week = DAYS.map(() => []);
  let any = false;
  for (const rule of text.split(";").map((r) => r.trim())) {
    if (!rule) continue;
    const m = /^([A-Za-z,-]+)\s+(.+)$/.exec(rule);
    if (!m) return null;
    const [, daySpec, rest] = m;
    if (/^PH\b|^SH\b/.test(daySpec!)) continue;
    const list = days(daySpec!.replace(/,PH$|,SH$/, ""));
    if (!list) return null;
    if (rest === "off" || rest === "closed") {
      for (const d of list) week[d] = [];
      any = true;
      continue;
    }
    const ranges = rest!.split(",").map((r) => r.trim());
    if (!ranges.every((r) => TIME.test(r))) return null;
    for (const d of list) week[d] = ranges.map((r) => r.split("-").map(pad).join("-"));
    any = true;
  }
  return any ? week : null;
}

/** Open around the clock every day. */
export const allDay = (w: Week) => w.every((d) => d.length === 1 && d[0] === "00:00-24:00");

/** A week back into OpenStreetMap's form, runs of days with the same hours joined: "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00". */
export function formatHours(week: Week): string {
  if (allDay(week)) return "24/7";
  const rules: string[] = [];
  let i = 0;
  const groups: { days: number[]; hours: string }[] = [];
  while (i < 7) {
    const hours = week[i]!.join(",");
    let j = i;
    while (j + 1 < 7 && week[j + 1]!.join(",") === hours) j++;
    if (hours) {
      const same = groups.find((g) => g.hours === hours);
      const days = Array.from({ length: j - i + 1 }, (_, k) => i + k);
      if (same) same.days.push(...days);
      else groups.push({ days, hours });
    }
    i = j + 1;
  }
  for (const g of groups) {
    const parts: string[] = [];
    let k = 0;
    while (k < g.days.length) {
      let m = k;
      while (m + 1 < g.days.length && g.days[m + 1] === g.days[m]! + 1) m++;
      parts.push(
        m - k >= 2
          ? `${DAYS[g.days[k]!]}-${DAYS[g.days[m]!]}`
          : g.days
              .slice(k, m + 1)
              .map((d) => DAYS[d])
              .join(","),
      );
      k = m + 1;
    }
    rules.push(`${parts.join(",")} ${g.hours}`);
  }
  return rules.join("; ");
}

// --- Open now (idea borrowed from a sat-nav app's place cards, 2026-11-19; docs/decisions/gyms.md "Open now") ---

/** A moment on a gym's clock: the weekday, Monday = 0 as OSM counts, and minutes since midnight. */
export interface Clock {
  day: number;
  min: number;
}

/**
 * Whether a gym is open at `at`, and the next change: open with the time it closes ("22:00"; null when it never closes
 * this week), "soon" within an hour of closing; or closed with when it opens next and how many days ahead (0 today,
 * 1 tomorrow; null when it never opens). A range that ends before it starts ("22:00-02:00") runs past midnight, and a
 * range that ends at 24:00 joins the next day's 00:00 start.
 */
export type OpenState = { open: true; closes: string | null; soon: boolean } | { open: false; opens: string | null; inDays: number | null };

/** How close to closing counts as "closes soon". */
export const SOON_MIN = 60;
const WEEK_MIN = 7 * 24 * 60;

const mins = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 60 + m!;
};

/** Every open stretch of the week in minutes from Monday 00:00, overlapping ones and ones that touch merged. */
function stretches(week: Week): [number, number][] {
  const raw: [number, number][] = [];
  week.forEach((ranges, d) => {
    for (const r of ranges) {
      const [a, b] = r.split("-");
      const start = d * 1440 + mins(a!);
      let end = d * 1440 + mins(b!);
      if (end <= start) end += 1440;
      raw.push([start, end]);
    }
  });
  // Stretches past Sunday midnight wrap to Monday: lay each one down a week earlier too, so a lookup on Monday sees it.
  const all = raw.flatMap(([a, b]) => [[a, b] as [number, number], [a - WEEK_MIN, b - WEEK_MIN] as [number, number]]);
  all.sort((x, y) => x[0] - y[0]);
  const out: [number, number][] = [];
  for (const s of all) {
    const last = out.at(-1);
    if (last && s[0] <= last[1]) last[1] = Math.max(last[1], s[1]);
    else out.push([s[0], s[1]]);
  }
  return out;
}

const hhmm = (m: number) => {
  const x = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
};

export function openState(week: Week, at: Clock): OpenState {
  const now = at.day * 1440 + at.min;
  const list = stretches(week);
  if (!list.length) return { open: false, opens: null, inDays: null };
  // Look a week either side so a stretch that started last Sunday or opens next Monday is found.
  for (const [a, b] of list) {
    for (const shift of [0, WEEK_MIN]) {
      if (now >= a + shift && now < b + shift) {
        const end = b + shift;
        // Open all week long (24/7, or every day joined up): no closing time to give.
        if (b - a >= WEEK_MIN) return { open: true, closes: null, soon: false };
        return { open: true, closes: hhmm(end), soon: end - now <= SOON_MIN };
      }
    }
  }
  let next = Infinity;
  for (const [a] of list) for (const shift of [0, WEEK_MIN]) if (a + shift > now && a + shift < next) next = a + shift;
  const inDays = Math.floor(next / 1440) - at.day;
  return { open: false, opens: hhmm(next), inDays };
}

/** The clock right now in a time zone (the viewer's own when none is given), as `openState` wants it. */
export function clockAt(date: Date, timeZone?: string): Clock {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
  } catch {
    parts = new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(
      date,
    );
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday"));
  return { day: Math.max(0, day), min: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
}

/**
 * Hours are on the gym's own clock, and we don't store its time zone, so "open now" is worked out on the viewer's clock
 * and only for gyms close enough to share it. 300 km keeps every gym a finder shows near home inside one zone almost
 * everywhere, and a gym further away shows its hours without a guess.
 */
export const OPEN_NEAR_KM = 300;

/** The open state of a gym's raw OSM hours at `at`, or null when the hours are missing, unreadable or too far to trust. */
export function openNow(raw: string, at: Clock, km?: number | null): OpenState | null {
  if (km != null && km > OPEN_NEAR_KM) return null;
  const week = parseHours(raw);
  return week ? openState(week, at) : null;
}
