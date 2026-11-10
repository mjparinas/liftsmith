// The admin Traffic tab's Bing part: Bing Webmaster Tools read on the server with its API key (Bing Webmaster Tools
// › Settings › API access), so the key never reaches the browser. Daily clicks and times shown come from
// GetRankAndTrafficStats; searches and pages come from GetQueryStats and GetPageStats, which Bing reports by week.
// Results are cached for 10 minutes per period; a failed read isn't kept.
import { addUpWeeks, bingDay, type BingPart, type BingStat } from "@/lib/bing";
import { periodDates, SEARCH_LAG_DAYS, type SearchPeriod, type SearchTotals } from "@/lib/searchConsole";

const TIMEOUT = 10_000;
const DAY = 86_400_000;
export const BING_CACHE_MS = 10 * 60_000;
const API = "https://ssl.bing.com/webmaster/api.svc/json";
/** The site as it's verified in Bing Webmaster Tools when BING_SITE_URL isn't set. */
export const DEFAULT_BING_SITE = "https://www.getliftsmith.com/";

const env = (name: string) => process.env[name]?.trim() || "";

export const BING_SETUP =
  "Set BING_WEBMASTER_API_KEY in Vercel to the API key from Bing Webmaster Tools (Settings › API access › API key), for an account that has www.getliftsmith.com verified. BING_SITE_URL is optional (default https://www.getliftsmith.com/).";

/** One Bing API call. The key is in the address, so an error never repeats the address. */
async function call<T>(method: string, site: string, key: string): Promise<T[]> {
  const url = `${API}/${method}?siteUrl=${encodeURIComponent(site)}&apikey=${encodeURIComponent(key)}`;
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", headers: { accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT) });
  } catch (e) {
    throw new Error((e as Error).name === "TimeoutError" ? "Bing didn't answer in time." : "Couldn't reach Bing.");
  }
  if (!res.ok) {
    let why = "";
    try {
      const body = (await res.json()) as { Message?: string; ErrorCode?: number };
      why = body.Message ?? "";
    } catch {
      // No JSON body: the status is enough.
    }
    throw new Error(`Bing answered ${res.status}${why ? `: ${why.slice(0, 200)}` : "."}`);
  }
  const body = (await res.json()) as { d?: T[] | null };
  return body.d ?? [];
}

interface BingDaily {
  Date: string;
  Clicks: number;
  Impressions: number;
}

export async function bingReport(days: SearchPeriod, now = Date.now()): Promise<BingPart> {
  const key = env("BING_WEBMASTER_API_KEY");
  const site = env("BING_SITE_URL") || DEFAULT_BING_SITE;
  if (!key) return { state: "setup", setup: BING_SETUP };
  try {
    const [traffic, queries, pages] = await Promise.all([
      call<BingDaily>("GetRankAndTrafficStats", site, key),
      call<BingStat>("GetQueryStats", site, key),
      call<BingStat>("GetPageStats", site, key),
    ]);
    const d = periodDates(days, now, SEARCH_LAG_DAYS);
    const byDate = new Map<string, { clicks: number; impressions: number }>();
    for (const t of traffic) {
      const day = bingDay(t.Date);
      if (!day) continue;
      const r = byDate.get(day) ?? { clicks: 0, impressions: 0 };
      r.clicks += Number(t.Clicks) || 0;
      r.impressions += Number(t.Impressions) || 0;
      byDate.set(day, r);
    }
    const total = (start: string, end: string, weekly: BingStat[]): SearchTotals => {
      let clicks = 0;
      let impressions = 0;
      for (const [day, r] of byDate)
        if (day >= start && day <= end) {
          clicks += r.clicks;
          impressions += r.impressions;
        }
      // Bing gives a daily position only per search, so the period's position is the average over every search.
      const rows = addUpWeeks(weekly, start, end, Infinity);
      const shown = rows.reduce((n, r) => n + r.impressions, 0);
      const position = shown ? rows.reduce((n, r) => n + r.position * r.impressions, 0) / shown : 0;
      return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position };
    };
    const dates: string[] = [];
    for (let t = Date.parse(d.start); t <= Date.parse(d.end); t += DAY) dates.push(new Date(t).toISOString().slice(0, 10));
    const known = [...byDate.keys()].sort();
    return {
      state: "ok",
      report: {
        site,
        start: d.start,
        end: d.end,
        totals: total(d.start, d.end, queries),
        previous: total(d.prevStart, d.prevEnd, queries),
        daily: dates.map((date) => ({ date, clicks: byDate.get(date)?.clicks ?? 0, impressions: byDate.get(date)?.impressions ?? 0 })),
        queries: addUpWeeks(queries, d.start, d.end),
        pages: addUpWeeks(pages, d.start, d.end, 10),
        firstDay: known[0] ?? null,
      },
    };
  } catch (e) {
    return { state: "error", error: (e as Error).message };
  }
}

// One entry per period. The promise is kept, so two requests at the same time call Bing once.
const cache = new Map<SearchPeriod, { at: number; value: Promise<BingPart> }>();

/** Bing for the last `days`, kept for 10 minutes unless `refresh`. */
export function bingPart(days: SearchPeriod, opts: { refresh?: boolean; now?: number } = {}): Promise<BingPart> {
  const now = opts.now ?? Date.now();
  const hit = cache.get(days);
  if (!opts.refresh && hit && now - hit.at < BING_CACHE_MS) return hit.value;
  const value = bingReport(days, now);
  cache.set(days, { at: now, value });
  // A failed read isn't kept, so the next look tries again.
  void value.then((p) => p.state === "error" && cache.get(days)?.value === value && cache.delete(days));
  return value;
}

/** For tests. */
export function clearBingCache() {
  cache.clear();
}
