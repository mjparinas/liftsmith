// GET /sitemap-gyms.xml (rewritten here): the gym finder's pages (src/server/gymPage.ts), listed in robots.txt next to
// the site's own sitemap: /gyms/, every city with gyms, every gym that isn't hidden or a studio, and the trainer
// directory's cities with enough people listed (trainerPage.ts), and coaches' listed programs (programPage.ts). Server build only.
import { gymSitemapXml } from "@/server/gymPage";
import { keptCities, keptSitemapGyms } from "@/server/gymPlaces";
import { programEntries, publicPrograms } from "@/server/programPage";
import { trainerCities } from "@/server/trainerDirectory";
import { directoryEntries } from "@/server/trainerPage";

export const dynamic = "force-dynamic";

export async function GET() {
  const [list, gyms, trainers, programs] = await Promise.all([
    keptCities().catch(() => []),
    keptSitemapGyms().catch(() => []),
    trainerCities().catch(() => []),
    publicPrograms().catch(() => []),
  ]);
  const newest = Math.max(0, ...list.map((c) => c.updatedAt));
  const entries = [
    { path: "/gyms/", lastModified: newest },
    ...list.map((c) => ({ path: `/gyms/${c.citySlug}/`, lastModified: c.updatedAt })),
    ...gyms,
    ...directoryEntries(trainers, newest),
    ...programEntries(programs),
  ];
  return new Response(gymSitemapXml(entries), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
