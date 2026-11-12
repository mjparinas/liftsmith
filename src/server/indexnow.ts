// IndexNow pings (src/lib/indexnow.ts), from the daily admin job: every public page in the sitemap that's new, or
// whose date changed, since the last ping is sent to IndexNow once, so Bing and the other engines that take part
// pick it up within a day of the nightly release. What was sent is kept in `indexnow_sent`, so a page goes again
// only when it changes. Only production pings, because the key file proves the pings come from www.getliftsmith.com.
// Public profiles (/u/<handle>/, Melvin 2026-11-12: "Do the Bing thing") go too, from the people sitemap: a profile is
// sent when it turns public and again after each new workout posted for everyone (its date is the last one). A profile
// that was sent and has since gone private, been suspended or lost its handle is sent once more as gone, so the
// engines recrawl it, find the noindex "isn't public" page and drop it.
import { INDEXNOW_BATCH, INDEXNOW_ENDPOINT, INDEXNOW_HOST, INDEXNOW_KEY, INDEXNOW_KEY_LOCATION } from "@/lib/indexnow";
import { absolute, siteRoutes, type Route } from "@/lib/seo";

import { batch, query } from "./db";
import { sitemapPeople } from "./publicProfile";

const TIMEOUT = 15_000;

/** What a page was last sent as: its date when it has one, so a dated page goes again after an edit. */
const signature = (r: Route) => r.date ?? "";
/** The signature of a profile page sent because it stopped being public. */
const GONE = "gone";

/** The people sitemap as routes, each dated by its last workout posted for everyone. */
export async function peopleRoutes(): Promise<Route[]> {
  const people = await sitemapPeople();
  return people.map((p) => ({ path: `/u/${p.handle}/`, date: new Date(p.lastModified).toISOString().slice(0, 10), priority: 0.4 }));
}

export type IndexNowResult = { sent: number; skipped?: string } | { sent: 0; error: string };

/** Sends the new and changed pages. `force` sends from any environment (for tests and a manual run). */
export async function pingIndexNow(
  opts: { routes?: Route[]; people?: Route[]; now?: number; force?: boolean } = {},
): Promise<IndexNowResult> {
  if (!opts.force && process.env.VERCEL_ENV !== "production") return { sent: 0, skipped: "not production" };
  const now = opts.now ?? Date.now();
  const people = opts.people ?? (await peopleRoutes());
  const routes = [...(opts.routes ?? siteRoutes()), ...people];
  const sent = new Map((await query<{ url: string; sig: string }>("SELECT url, sig FROM indexnow_sent")).map((r) => [r.url, r.sig]));
  const due = routes.map((r) => ({ url: absolute(r.path), sig: signature(r) })).filter((r) => sent.get(r.url) !== r.sig);
  const live = new Set(people.map((r) => absolute(r.path)));
  const profileBase = absolute("/u/");
  for (const [url, sig] of sent) {
    if (url.startsWith(profileBase) && sig !== GONE && !live.has(url)) due.push({ url, sig: GONE });
  }
  if (!due.length) return { sent: 0 };
  let count = 0;
  for (let i = 0; i < due.length; i += INDEXNOW_BATCH) {
    const part = due.slice(i, i + INDEXNOW_BATCH);
    let res: Response;
    try {
      res = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: INDEXNOW_HOST,
          key: INDEXNOW_KEY,
          keyLocation: INDEXNOW_KEY_LOCATION,
          urlList: part.map((p) => p.url),
        }),
        signal: AbortSignal.timeout(TIMEOUT),
      });
    } catch {
      return { sent: 0, error: "Couldn't reach IndexNow." };
    }
    // 200 and 202 both mean taken (202: the key is still being checked). Anything else is kept for the next run.
    if (res.status !== 200 && res.status !== 202) return { sent: 0, error: `IndexNow answered ${res.status}.` };
    await batch(
      part.map((p) => ({
        sql: "INSERT INTO indexnow_sent (url, sig, sent_at) VALUES (?, ?, ?) ON CONFLICT(url) DO UPDATE SET sig = excluded.sig, sent_at = excluded.sent_at",
        args: [p.url, p.sig, now],
      })),
    );
    count += part.length;
  }
  return { sent: count };
}
