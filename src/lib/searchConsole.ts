// The admin Traffic tab's Google Search part (ported from Gradelings' src/lib/traffic.ts): how people find the
// website in Google, read on the server from Search Console with a read-only service account. This file holds the
// shapes and the plain arithmetic, so the browser and the server share them.

export const SEARCH_PERIODS = [7, 28, 90, 365] as const;
export type SearchPeriod = (typeof SEARCH_PERIODS)[number];
export const isSearchPeriod = (n: number): n is SearchPeriod => (SEARCH_PERIODS as readonly number[]).includes(n);

const DAY = 86_400_000;
/** Search Console's numbers settle two to three days late, so its periods end three days ago. */
export const SEARCH_LAG_DAYS = 3;

const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** The period and the one before it, as inclusive YYYY-MM-DD dates (UTC), ending `lagDays` ago. */
export function periodDates(days: number, now: number, lagDays = 0): { start: string; end: string; prevStart: string; prevEnd: string } {
  const d = new Date(now);
  const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - lagDays * DAY;
  const start = end - (days - 1) * DAY;
  return { start: iso(start), end: iso(end), prevStart: iso(start - days * DAY), prevEnd: iso(start - DAY) };
}

export interface SearchTotals {
  clicks: number;
  impressions: number;
  /** Clicks ÷ impressions, 0 to 1. */
  ctr: number;
  /** Average position in Google results (1 is the top). */
  position: number;
}

export interface SearchRow extends SearchTotals {
  key: string;
}

export interface SitemapInfo {
  path: string;
  lastDownloaded: number | null;
  errors: number;
  warnings: number;
  submitted: number;
}

export interface SearchReport {
  site: string;
  start: string;
  end: string;
  totals: SearchTotals;
  previous: SearchTotals;
  daily: { date: string; clicks: number; impressions: number }[];
  queries: SearchRow[];
  pages: SearchRow[];
  countries: SearchRow[];
  devices: SearchRow[];
  sitemaps: SitemapInfo[];
}

/** A part that isn't set up says which settings to add; one that failed says why. */
export type SearchPart = { state: "ok"; report: SearchReport } | { state: "setup"; setup: string } | { state: "error"; error: string };

/** Shows a page URL from Search Console as a path on the site. */
export function pathOf(url: string): string {
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname) + u.search;
  } catch {
    return url;
  }
}

/** Days since 1970 for a YYYY-MM-DD date, the x axis the admin charts use. */
export const dayNumber = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY);

/**
 * Searches worth acting on: shown at least `minShown` times on page one or two of Google (position 4 to 20) but
 * clicked less than 3% of the time. A better title and description, or a page that answers the search more
 * directly, usually turns these into clicks. Most impressions first.
 */
export function nearMisses(rows: SearchRow[], minShown = 20): SearchRow[] {
  return rows
    .filter((r) => r.impressions >= minShown && r.position >= 4 && r.position <= 20 && r.ctr < 0.03)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);
}
