// GET /sitemap-people.xml (rewritten here): every public profile with a workout to show, listed in robots.txt next to
// the site's own sitemap. Private, suspended and empty profiles are never in it. Server build only.
import { sitemapPeople, sitemapXml } from "@/server/publicProfile";

export const dynamic = "force-dynamic";

export async function GET() {
  const people = await sitemapPeople().catch(() => []);
  return new Response(sitemapXml(people), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
