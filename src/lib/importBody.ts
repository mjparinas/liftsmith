import { parseCsv, parseDate } from "./importCsv";
import { hash } from "./random";
import { MEASURE_SITES, type AppEvent, type BodyweightEvent, type MeasureEvent, type MeasureSite, type Unit } from "./types";
import { toKg } from "./units";

// Body weight, body fat and tape measurements from another app's export (2026-11-13), next to the workout
// import in Settings › Data. Three shapes: Hevy's measurements file (one row a day, a column per site), a
// FitNotes-style long file (one row per reading: date, measurement, value, unit), and any plain weigh-in log
// with a date and a weight column (scale apps, spreadsheets). Read on the device; ids come from the day, so
// importing the same file twice adds nothing, and a day that already has a weigh-in keeps it.

export type BodyFormat = "hevy" | "fitnotes" | "weights";

export interface BodyDay {
  /** Local "YYYY-MM-DD". */
  day: string;
  at: number;
  /** Weight in the file's unit. */
  weight?: number;
  /** The row's own weight unit, when the file says it per row. */
  unit?: Unit;
  bodyFat?: number;
  /** Centimetres. */
  sites: Partial<Record<MeasureSite, number>>;
}

export interface BodyFile {
  format: BodyFormat;
  /** The weight unit the file states, or null when the lifter has to say. */
  unit: Unit | null;
  days: BodyDay[];
}

const pad = (n: number) => String(n).padStart(2, "0");
const dayOf = (at: number) => {
  const d = new Date(at);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const num = (s: string | undefined) => {
  const n = parseFloat((s ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/** Site words in column names and FitNotes measurement names. Left and right are averaged. */
const SITE_WORDS: [RegExp, MeasureSite][] = [
  [/waist/, "waist"],
  [/hip|glute|butt/, "hips"],
  [/chest|bust/, "chest"],
  [/shoulder/, "shoulders"],
  [/neck/, "neck"],
  [/forearm/, "forearm"],
  [/bicep|upper arm|\barm\b/, "arm"],
  [/thigh|quad/, "thigh"],
  [/calf|calves/, "calf"],
];
const siteOf = (name: string): MeasureSite | undefined => SITE_WORDS.find(([re]) => re.test(name))?.[1];
const IN_CM = 2.54;

/** Reads a body measurement export. Null when the file is none of the shapes above. */
export function readBody(text: string): BodyFile | null {
  const rows = parseCsv(text);
  if (rows.length < 2) return null;
  const head = rows[0]!.map((h) => h.trim().toLowerCase());
  const at = (re: RegExp) => head.findIndex((h) => re.test(h));
  const date = at(/^(date|day|time|timestamp|date ?time)$/);
  if (date < 0) return null;
  // A workout file has an exercise column; it isn't this.
  if (head.some((h) => /exercise|ename/.test(h))) return null;
  const time = at(/^time$/);
  const days = new Map<string, BodyDay>();
  const dayFor = (r: string[]): BodyDay | null => {
    const when = parseDate((r[date] ?? "").trim(), time >= 0 && time !== date ? (r[time] ?? "").trim() : "");
    if (when === null) return null;
    const day = dayOf(when);
    if (!days.has(day)) days.set(day, { day, at: when, sites: {} });
    return days.get(day)!;
  };
  const done = (format: BodyFormat, unit: Unit | null): BodyFile | null => {
    const list = [...days.values()].filter((d) => d.weight || d.bodyFat || Object.keys(d.sites).length);
    return list.length ? { format, unit, days: list.sort((a, b) => a.at - b.at) } : null;
  };

  const measurement = at(/^(measurement|metric|type|name)$/);
  const value = at(/^(value|amount|reading)$/);
  if (measurement >= 0 && value >= 0) {
    // FitNotes-style: one reading a row, with its unit in its own column.
    const unitCol = at(/^unit$/);
    for (const r of rows.slice(1)) {
      const name = (r[measurement] ?? "").trim().toLowerCase();
      const v = num(r[value]);
      const u = (unitCol >= 0 ? (r[unitCol] ?? "") : "").trim().toLowerCase();
      const d = v > 0 ? dayFor(r) : null;
      if (!d) continue;
      if (/fat/.test(name)) d.bodyFat = v;
      else if (/weight/.test(name)) {
        d.weight = v;
        if (/^(kg|kgs|kilo)/.test(u)) d.unit = "kg";
        else if (/^(lb|lbs|pound)/.test(u)) d.unit = "lb";
      } else {
        const site = siteOf(name);
        if (site) d.sites[site] = avg(d.sites[site], /^(in|inch)/.test(u) ? v * IN_CM : v);
      }
    }
    // Every weight row said its unit, or the lifter picks.
    const all = [...days.values()].filter((d) => d.weight);
    return done("fitnotes", all.length && all.every((d) => d.unit) ? (all[0]!.unit ?? null) : null);
  }

  const kg = at(/^(weight|body ?weight)[ _(]*(kg|kgs)\)?$/);
  const lb = at(/^(weight|body ?weight)[ _(]*(lb|lbs)\)?$/);
  const plain = at(/^(weight|body ?weight|mass)$/);
  const fat = at(/fat/);
  const siteCols = head.flatMap((h, i) => {
    const site = /fat|weight|date|time|note|comment/.test(h) ? undefined : siteOf(h);
    if (!site) return [];
    const inches = /(_|\(| )(in|inch|inches)\)?$/.test(h);
    return [{ i, site, inches }];
  });
  const w = kg >= 0 ? kg : lb >= 0 ? lb : plain;
  if (w < 0 && fat < 0 && !siteCols.length) return null;
  for (const r of rows.slice(1)) {
    const weight = w >= 0 ? num(r[w]) : 0;
    const bf = fat >= 0 ? num(r[fat]) : 0;
    const sites = siteCols.map((c) => ({ ...c, v: num(r[c.i]) })).filter((c) => c.v > 0);
    if (!weight && !bf && !sites.length) continue;
    const d = dayFor(r);
    if (!d) continue;
    if (weight) d.weight = weight;
    // Some apps write body fat as a fraction (0.18).
    if (bf) d.bodyFat = bf < 1 ? bf * 100 : bf;
    const sum = new Map<MeasureSite, number[]>();
    for (const c of sites) sum.set(c.site, [...(sum.get(c.site) ?? []), c.inches ? c.v * IN_CM : c.v]);
    for (const [site, vs] of sum) d.sites[site] = vs.reduce((a, b) => a + b, 0) / vs.length;
  }
  // Hevy names its columns weight_kg, fat_percent and <site>_cm.
  const hevy = head.includes("fat_percent") || siteCols.length >= 3;
  return done(hevy ? "hevy" : "weights", kg >= 0 ? "kg" : lb >= 0 ? "lb" : siteCols.length && w < 0 ? "kg" : null);
}

const avg = (a: number | undefined, b: number) => (a === undefined ? b : (a + b) / 2);

/** What `bodyEvents` writes, for the summary before importing. */
export function bodyCounts(file: BodyFile): { weighIns: number; measures: number } {
  return {
    weighIns: file.days.filter((d) => d.weight).length,
    measures: file.days.reduce((n, d) => n + Object.keys(d.sites).length, 0),
  };
}

/**
 * The events for a body import: one weigh-in a day (with body fat when the file has it) and one tape
 * measurement per site a day. A day that already has a weigh-in, or that site measured, is left as it is.
 * Body fat without a weight that day goes on the last weight before it, like the manual body fat box.
 */
export function bodyEvents(
  file: BodyFile,
  unit: Unit,
  existing: readonly AppEvent[],
  now: number,
): { events: AppEvent[]; weighIns: number; measures: number } {
  const weighed = new Set<string>();
  const measured = new Set<string>();
  const weights: { at: number; kg: number }[] = [];
  for (const e of existing) {
    if (e.type === "bodyweight") {
      weighed.add(dayOf(e.at));
      weights.push({ at: e.at, kg: e.kg });
    } else if (e.type === "measure") measured.add(`${e.site}|${dayOf(e.at)}`);
  }
  const events: AppEvent[] = [];
  let weighIns = 0;
  let measures = 0;
  const tag = hash(file.format).toString(36);
  for (const d of file.days) {
    if (d.at > now) continue;
    const kg = d.weight ? Math.round(toKg(d.weight, d.unit ?? unit) * 100) / 100 : undefined;
    if (kg) weights.push({ at: d.at, kg });
    const bodyFat = d.bodyFat && d.bodyFat >= 3 && d.bodyFat <= 60 ? Math.round(d.bodyFat * 10) / 10 : undefined;
    if (!weighed.has(d.day) && (kg || bodyFat)) {
      const base = kg ?? weights.filter((x) => x.at <= d.at).sort((a, b) => b.at - a.at)[0]?.kg;
      if (base && base >= 20 && base <= 400) {
        const e: BodyweightEvent = {
          type: "bodyweight",
          id: `imp-${tag}-bw-${d.day}`,
          at: d.at,
          kg: base,
          ...(bodyFat ? { bodyFat } : {}),
        };
        events.push(e);
        weighed.add(d.day);
        weighIns++;
      }
    }
    for (const site of MEASURE_SITES) {
      const cm = d.sites[site];
      if (!cm || cm < 5 || cm > 300 || measured.has(`${site}|${d.day}`)) continue;
      const e: MeasureEvent = { type: "measure", id: `imp-${tag}-m-${site}-${d.day}`, at: d.at, site, cm: Math.round(cm * 10) / 10 };
      events.push(e);
      measured.add(`${site}|${d.day}`);
      measures++;
    }
  }
  return { events, weighIns, measures };
}
