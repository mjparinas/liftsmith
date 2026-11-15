// Strength standards from real lifters (Melvin, 2026-11-15: step 3 of the traffic plan; docs/decisions/public-pages-and-seo.md
// "Strength standards from lifters"). Each morning (the admin cron) this reads the best estimated one-rep max each
// counted lifter reached in the past year on the big barbell lifts, groups lifters by sex and body weight, and keeps
// only the 25th, 50th, 75th and 90th percentile and the count of each group with at least MIN_CELL lifters. Nothing
// about any one lifter is kept or shown.
//
// Who counts: signed-in adults (a birth year on the profile saying 18 or over) with sex and body weight set, whose
// profile says yes (`standards: true`), or who haven't chosen and synced last from outside the EU, EEA, UK and
// Switzerland, where only a yes counts (as with usage stats). Settings › Your data and privacy › Strength standards is the switch.
// Under-18s never count, whatever the switch says.
import { batch, query, run } from "./db";

export const STANDARD_LIFTS = ["back-squat", "bench-press", "deadlift", "overhead-press"] as const;
export type StandardLift = (typeof STANDARD_LIFTS)[number];
export const isStandardLift = (x: unknown): x is StandardLift => typeof x === "string" && (STANDARD_LIFTS as readonly string[]).includes(x);
export type Sex = "male" | "female";

/** Lifters a body-weight group needs before it's shown. */
export const MIN_CELL = 30;
/** Lifters (of one sex) a lift needs before its page is indexed and in the sitemap. */
export const MIN_LIFT = 100;
const YEAR = 365 * 86_400_000;
/** Band 0 is everyone of that sex together. */
export const ALL = 0;

/** Body-weight groups, 10 kg wide; the first and last are open ("under 60", "120 and up"). */
export const BANDS: Record<Sex, { lo: number; hi: number }> = { male: { lo: 60, hi: 120 }, female: { lo: 50, hi: 100 } };
export function bandOf(sex: Sex, kg: number): number {
  const { lo, hi } = BANDS[sex];
  if (kg < lo) return lo - 10;
  if (kg >= hi) return hi;
  return Math.floor(kg / 10) * 10;
}
/** Every band of a sex, lightest first. */
export const bandsOf = (sex: Sex) => {
  const out: number[] = [];
  for (let b = BANDS[sex].lo - 10; b <= BANDS[sex].hi; b += 10) out.push(b);
  return out;
};

/** EU, EEA, UK and Switzerland: only an explicit yes counts. */
const ASK_FIRST = new Set("AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO GB CH".split(" "));
export const countsByDefault = (country: string | null | undefined) => !!country && !ASK_FIRST.has(country.toUpperCase());

/** A result no real lift reaches, as a share of body weight: typing slips and test data. */
const MAX_RATIO: Record<StandardLift, number> = { "back-squat": 4, "bench-press": 3, deadlift: 4.5, "overhead-press": 2.2 };
const MIN_RATIO = 0.15;

interface Lifter {
  sex: Sex;
  kg: number;
}

/** Whether a profile counts, and as whom. */
export function lifterOf(body: string, country: string | null, now: number): Lifter | null {
  let p: { standards?: unknown; birthYear?: unknown; sex?: unknown; bodyweight?: unknown };
  try {
    p = JSON.parse(body || "{}") as typeof p;
  } catch {
    return null;
  }
  if (p.standards === false) return null;
  if (p.standards !== true && !countsByDefault(country)) return null;
  const year = typeof p.birthYear === "number" ? p.birthYear : NaN;
  if (!Number.isFinite(year) || new Date(now).getUTCFullYear() - year < 18) return null;
  if (p.sex !== "male" && p.sex !== "female") return null;
  const kg = typeof p.bodyweight === "number" ? p.bodyweight : NaN;
  if (!(kg >= 30 && kg <= 250)) return null;
  return { sex: p.sex, kg };
}

/** The value at a percentile of a sorted list (nearest rank), to the nearest 0.5 kg. */
export function percentile(sorted: readonly number[], pct: number): number {
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1));
  return Math.round(sorted[i]! * 2) / 2;
}

export interface StandardRow {
  lift: StandardLift;
  sex: Sex;
  band: number;
  n: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  updatedAt: number;
}

/** Rebuilds the table from the past year's sets. Returns how many groups were kept. */
export async function refreshStandards(now = Date.now()): Promise<number> {
  const lifts = STANDARD_LIFTS.map(() => "?").join(", ");
  // The best Epley estimate per lifter and lift, from sets of 1 to 10 reps with a weight; sets done lighter for an
  // injury and rehab beside the lifting don't count.
  const best = await query<{ a: string; ex: string; e1: number }>(
    `SELECT account_id AS a, json_extract(body, '$.exerciseId') AS ex,
            MAX(json_extract(body, '$.weight') * (1 + json_extract(body, '$.reps') / 30.0)) AS e1
       FROM sync_events
      WHERE at > ? AND body IS NOT NULL AND json_extract(body, '$.type') = 'set'
        AND json_extract(body, '$.exerciseId') IN (${lifts})
        AND json_extract(body, '$.reps') BETWEEN 1 AND 10 AND json_extract(body, '$.weight') > 0
        AND json_extract(body, '$.injuryPct') IS NULL AND json_extract(body, '$.partId') IS NULL
      GROUP BY account_id, ex`,
    [now - YEAR, ...STANDARD_LIFTS],
  );
  const ids = [...new Set(best.map((r) => r.a))];
  const who = new Map<string, Lifter>();
  for (let i = 0; i < ids.length; i += 400) {
    const chunk = ids.slice(i, i + 400);
    const rows = await query<{ id: string; body: string; country: string | null }>(
      `SELECT r.account_id AS id, r.body AS body, a.country AS country FROM sync_records r JOIN accounts a ON a.id = r.account_id
        WHERE r.key = 'profile' AND r.account_id IN (${chunk.map(() => "?").join(", ")})`,
      chunk,
    );
    for (const r of rows) {
      const l = lifterOf(r.body, r.country, now);
      if (l) who.set(r.id, l);
    }
  }
  const groups = new Map<string, number[]>();
  const add = (key: string, v: number) => groups.set(key, [...(groups.get(key) ?? []), v]);
  for (const r of best) {
    const l = who.get(r.a);
    if (!l || !isStandardLift(r.ex) || !Number.isFinite(r.e1)) continue;
    const ratio = r.e1 / l.kg;
    if (ratio < MIN_RATIO || ratio > MAX_RATIO[r.ex]) continue;
    add(`${r.ex}|${l.sex}|${bandOf(l.sex, l.kg)}`, r.e1);
    add(`${r.ex}|${l.sex}|${ALL}`, r.e1);
  }
  const stmts: { sql: string; args: (string | number)[] }[] = [{ sql: "DELETE FROM strength_standards", args: [] }];
  for (const [key, list] of groups) {
    if (list.length < MIN_CELL) continue;
    const [lift, sex, band] = key.split("|") as [string, string, string];
    const sorted = [...list].sort((x, y) => x - y);
    stmts.push({
      sql: "INSERT INTO strength_standards (lift, sex, band, n, p25, p50, p75, p90, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [lift, sex, Number(band), sorted.length, ...[25, 50, 75, 90].map((p) => percentile(sorted, p)), now],
    });
  }
  await batch(stmts);
  return stmts.length - 1;
}

const toRow = (r: Record<string, unknown>): StandardRow => ({
  lift: r.lift as StandardLift,
  sex: r.sex as Sex,
  band: Number(r.band),
  n: Number(r.n),
  p25: Number(r.p25),
  p50: Number(r.p50),
  p75: Number(r.p75),
  p90: Number(r.p90),
  updatedAt: Number(r.updated_at),
});

/** Every kept group for a lift, by sex then band. */
export async function standardsOf(lift: StandardLift): Promise<StandardRow[]> {
  return (await query("SELECT * FROM strength_standards WHERE lift = ? ORDER BY sex, band", [lift])).map(toRow);
}

/** The lifts with enough lifters of either sex for a page of their own, with their totals. */
export async function publishedLifts(): Promise<{ lift: StandardLift; n: number; updatedAt: number }[]> {
  const rows = (await query("SELECT * FROM strength_standards WHERE band = ?", [ALL])).map(toRow);
  return STANDARD_LIFTS.flatMap((lift) => {
    const mine = rows.filter((r) => r.lift === lift);
    const n = mine.reduce((sum, r) => sum + r.n, 0);
    return mine.some((r) => r.n >= MIN_LIFT) ? [{ lift, n, updatedAt: Math.max(...mine.map((r) => r.updatedAt)) }] : [];
  });
}

/** Records the country an account syncs from, for the default above. */
export async function noteCountry(accountId: string, country: string | null): Promise<void> {
  const c = (country ?? "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return;
  await run("UPDATE accounts SET country = ? WHERE id = ? AND (country IS NULL OR country <> ?)", [c, accountId, c]);
}
