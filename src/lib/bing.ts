// The admin Traffic tab's Bing part: how people find the website in Bing (and the engines that use Bing's index,
// such as DuckDuckGo, Yahoo and ChatGPT search), read on the server from Bing Webmaster Tools with its API key.
// This file holds the shapes and the plain arithmetic, so the browser and the server share them; the rows are the
// same shape as Search Console's, so the near-miss list works the same way.
import type { SearchRow, SearchTotals } from "./searchConsole";

export interface BingReport {
  site: string;
  start: string;
  end: string;
  totals: SearchTotals;
  previous: SearchTotals;
  daily: { date: string; clicks: number; impressions: number }[];
  /** Searches and pages, added up over the weeks that end in the period (Bing reports them by week). */
  queries: SearchRow[];
  pages: SearchRow[];
  /** The oldest day Bing has numbers for, so the panel can say when a long period is only partly covered. */
  firstDay: string | null;
}

export type BingPart = { state: "ok"; report: BingReport } | { state: "setup"; setup: string } | { state: "error"; error: string };

/**
 * A day from Bing's JSON, which uses .NET dates: "/Date(1399014000000-0700)/". The number is the instant; the
 * offset is Bing's own time zone, so the day is read in that zone. Null when it isn't a date.
 */
export function bingDay(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = /\/Date\((-?\d+)([+-]\d{2})?(\d{2})?\)\//.exec(value);
  if (!m) return null;
  const sign = m[2]?.startsWith("-") ? -1 : 1;
  const offset = m[2] ? sign * (Math.abs(Number(m[2])) * 60 + Number(m[3] ?? 0)) * 60_000 : 0;
  return new Date(Number(m[1]) + offset).toISOString().slice(0, 10);
}

/** One week's line from GetQueryStats or GetPageStats. `Query` holds the search, or the page for GetPageStats. */
export interface BingStat {
  Query: string;
  Clicks: number;
  Impressions: number;
  AvgImpressionPosition: number;
  Date: string;
}

/**
 * Bing's weekly lines added up for the days from `start` to `end` (YYYY-MM-DD, inclusive), one row per search or
 * page, most clicks first and then most shown. The position is the average over the times shown.
 */
export function addUpWeeks(stats: BingStat[], start: string, end: string, limit = 100): SearchRow[] {
  const by = new Map<string, { clicks: number; impressions: number; at: number }>();
  for (const s of stats) {
    const day = bingDay(s.Date);
    if (!day || day < start || day > end || !s.Query) continue;
    const r = by.get(s.Query) ?? { clicks: 0, impressions: 0, at: 0 };
    const shown = Number(s.Impressions) || 0;
    r.clicks += Number(s.Clicks) || 0;
    r.impressions += shown;
    r.at += (Number(s.AvgImpressionPosition) || 0) * shown;
    by.set(s.Query, r);
  }
  return [...by]
    .map(([key, r]) => ({
      key,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.impressions ? r.clicks / r.impressions : 0,
      position: r.impressions ? r.at / r.impressions : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
    .slice(0, limit);
}
