// GET /sitemap-strength.xml (rewritten here): the strength standards pages with enough lifters to be indexed
// (src/server/standardsPage.ts), listed in robots.txt. Server build only.
import { gymSitemapXml } from "@/server/gymPage";
import { publishedLifts } from "@/server/standards";
import { standardsPath } from "@/server/standardsPage";

export const dynamic = "force-dynamic";

export async function GET() {
  const lifts = await publishedLifts().catch(() => []);
  const entries = lifts.length
    ? [
        { path: standardsPath(), lastModified: Math.max(...lifts.map((l) => l.updatedAt)) },
        ...lifts.map((l) => ({ path: standardsPath(l.lift), lastModified: l.updatedAt })),
      ]
    : [];
  return new Response(gymSitemapXml(entries), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
