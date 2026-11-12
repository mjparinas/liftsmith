// GET /gyms/, /gyms/<city>/ and /gyms/<city>/<gym>/ (rewritten here with ?city=&gym=): the website's gym pages, plain
// HTML with no scripts and their own strict CSP (src/server/gymPage.ts). Anything not found gets a noindex page. Server build only.
import { cityHtml, goneHtml, GYM_GONE_HEADERS, GYM_PAGE_HEADERS, gymHtml, indexHtml, pageLang } from "@/server/gymPage";
import { cities, cityPlaces, placeBySlug } from "@/server/gymPlaces";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const lang = pageLang(req);
  const u = new URL(req.url).searchParams;
  const city = u.get("city");
  const gym = u.get("gym");
  const gone = () => new Response(goneHtml(lang), { status: 404, headers: GYM_GONE_HEADERS });
  try {
    if (city && gym) {
      const p = await placeBySlug(city, gym);
      if (!p) return gone();
      return new Response(gymHtml(p, await cityPlaces(city), lang), { headers: GYM_PAGE_HEADERS });
    }
    if (city) {
      const list = await cityPlaces(city);
      if (!list.length) return gone();
      return new Response(cityHtml(city, list, lang), { headers: GYM_PAGE_HEADERS });
    }
    return new Response(indexHtml(await cities(), lang), { headers: GYM_PAGE_HEADERS });
  } catch {
    return gone();
  }
}
