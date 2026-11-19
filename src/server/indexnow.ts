// IndexNow pings (src/lib/indexnow.ts), from the daily admin job: every public page in the sitemap that's new, or
// whose date changed, since the last ping is sent to IndexNow once, so Bing and the other engines that take part
// pick it up within a day of the nightly release. What was sent is kept in `indexnow_sent`, so a page goes again
// only when it changes. Only production pings, because the key file proves the pings come from www.getliftsmith.com.
// Public profiles (/u/<handle>/, Melvin 2026-11-12: "Do the Bing thing") go too, from the people sitemap: a profile is
// sent when it turns public and again after each new workout posted for everyone (its date is the last one). A profile
// that was sent and has since gone private, been suspended or lost its handle is sent once more as gone, so the
// engines recrawl it, find the noindex "isn't public" page and drop it.
// The strength standards pages (standards.ts) and the trainer directory's cities (trainerDirectory.ts) go once each when
// they're first indexable (2026-11-15). Coaches' programs (programPage.ts) go when listed and again after each edit. Gym pages don't: there are tens of thousands, past what IndexNow takes in a day,
// so they rely on their sitemap.
import { INDEXNOW_BATCH, INDEXNOW_ENDPOINT, INDEXNOW_HOST, INDEXNOW_KEY, INDEXNOW_KEY_LOCATION } from "@/lib/indexnow";
import { absolute, siteRoutes, type Route } from "@/lib/seo";

import { communityEntries, publicBoard } from "./communityPage";
import { batch, query } from "./db";
import { libraryEntries, publicRoutines } from "./libraryPage";
import { programEntries, publicPrograms } from "./programPage";
import { sitemapPeople } from "./publicProfile";
import { publishedLifts } from "./standards";
import { standardsPath } from "./standardsPage";
import { trainerCities } from "./trainerDirectory";
import { directoryEntries } from "./trainerPage";

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

/** Server-drawn pages worth indexing that aren't in the site's own sitemap: standards and the trainer directory. Undated, so each goes once. */
export async function serverRoutes(): Promise<Route[]> {
  const [lifts, cities, programs, community, routines] = await Promise.all([
    publishedLifts().catch(() => []),
    trainerCities().catch(() => []),
    publicPrograms().catch(() => []),
    publicBoard().catch(() => ({ posts: [], shipped: [] })),
    publicRoutines().catch(() => []),
  ]);
  const paths = [
    ...(lifts.length ? [standardsPath(), ...lifts.map((l) => standardsPath(l.lift))] : []),
    ...directoryEntries(cities, 0).map((e) => e.path),
  ];
  // Coaches' programs are dated by their last change, so an edited program goes again (programPage.ts).
  // Community posts are dated too: a status change sends the page again (communityPage.ts).
  // Library routines too, dated by their last change (libraryPage.ts).
  const dated = [...programEntries(programs), ...communityEntries(community.posts, community.shipped), ...libraryEntries(routines)].map(
    (e) => ({
      path: e.path,
      date: new Date(e.lastModified).toISOString().slice(0, 10),
      priority: 0.5,
    }),
  );
  return [...paths.map((path) => ({ path, priority: 0.5 })), ...dated];
}

export type IndexNowResult = { sent: number; skipped?: string } | { sent: 0; error: string };

/** Sends the new and changed pages. `force` sends from any environment (for tests and a manual run). */
export async function pingIndexNow(
  opts: { routes?: Route[]; people?: Route[]; pages?: Route[]; now?: number; force?: boolean } = {},
): Promise<IndexNowResult> {
  if (!opts.force && process.env.VERCEL_ENV !== "production") return { sent: 0, skipped: "not production" };
  const now = opts.now ?? Date.now();
  const people = opts.people ?? (await peopleRoutes());
  const routes = [...(opts.routes ?? siteRoutes()), ...people, ...(opts.pages ?? (await serverRoutes()))];
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
