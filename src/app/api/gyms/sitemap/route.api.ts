// GET /sitemap-gyms.xml (rewritten here): the gym finder's pages (src/server/gymPage.ts), listed in robots.txt next to
// the site's own sitemap: /gyms/, every city with gyms, and every gym that isn't hidden or a studio. Server build only.
import { gymSitemapXml } from "@/server/gymPage";
import { cities, sitemapGyms } from "@/server/gymPlaces";

export const dynamic = "force-dynamic";

export async function GET() {
  const [list, gyms] = await Promise.all([cities().catch(() => []), sitemapGyms().catch(() => [])]);
  const entries = [
    { path: "/gyms/", lastModified: Math.max(0, ...list.map((c) => c.updatedAt)) },
    ...list.map((c) => ({ path: `/gyms/${c.citySlug}/`, lastModified: c.updatedAt })),
    ...gyms,
  ];
  return new Response(gymSitemapXml(entries), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
