// /sitemap-gyms.xml and /sitemap-gyms-<n>.xml (src/app/api/gyms/sitemap/ and sitemap-part/): the gym finder's pages (src/server/gymPage.ts),
// listed in robots.txt next to the site's own sitemap. /sitemap-gyms.xml is a sitemap index; part 1 holds /gyms/,
// every city with gyms, gym chains with three locations or more (gymChains.ts), the trainer directory's cities with
// enough people listed (trainerPage.ts), coaches' listed programs (programPage.ts), the community's pages
// (communityPage.ts) and the public routine library (libraryPage.ts); the parts after it hold every gym page that's
// indexed, `SITEMAP_PART` at a time (sitemapParts). Server build only.
import { communityEntries, publicBoard } from "./communityPage";
import { keptSitemapChains } from "./gymChains";
import { gymSitemapIndexXml, gymSitemapXml, sitemapParts } from "./gymPage";
import { keptCities, keptSitemapGyms } from "./gymPlaces";
import { libraryEntries, publicRoutines } from "./libraryPage";
import { programEntries, publicPrograms } from "./programPage";
import { trainerCities } from "./trainerDirectory";
import { directoryEntries } from "./trainerPage";

const HEADERS = { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" };

/** The sitemap index (no `part`) or one part of it ("1", "2"…). /sitemap-gyms-<n>.xml comes through src/app/api/gyms/sitemap-part/[part]/route.api.ts. */
export async function gymSitemap(part: string | null): Promise<Response> {
  const [list, gyms, chains, trainers, programs, community, routines] = await Promise.all([
    keptCities().catch(() => []),
    keptSitemapGyms().catch(() => []),
    keptSitemapChains().catch(() => []),
    trainerCities().catch(() => []),
    publicPrograms().catch(() => []),
    publicBoard().catch(() => ({ posts: [], shipped: [] })),
    publicRoutines().catch(() => []),
  ]);
  const newest = Math.max(0, ...list.map((c) => c.updatedAt));
  const hubs = [
    { path: "/gyms/", lastModified: newest },
    ...list.map((c) => ({ path: `/gyms/${c.citySlug}/`, lastModified: c.updatedAt })),
    ...(chains.length ? [{ path: "/gym-chains/", lastModified: Math.max(...chains.map((c) => c.lastModified)) }, ...chains] : []),
    ...directoryEntries(trainers, newest),
    ...programEntries(programs),
    ...communityEntries(community.posts, community.shipped),
    ...libraryEntries(routines),
  ];
  const parts = sitemapParts(hubs, gyms);
  if (part === null) return new Response(gymSitemapIndexXml(parts), { headers: HEADERS });
  const entries = /^\d+$/.test(part) ? parts[Number(part) - 1] : undefined;
  if (!entries) return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(gymSitemapXml(entries), { headers: HEADERS });
}
