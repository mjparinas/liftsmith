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
