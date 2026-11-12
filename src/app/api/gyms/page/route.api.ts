// GET /gyms/, /gyms/<city>/ and /gyms/<city>/<gym>/ (rewritten here with ?city=&gym=): the website's gym pages, plain
// HTML with no scripts and their own strict CSP (src/server/gymPage.ts). Anything not found gets a noindex page. A visit
// with ?from=qr came from the gym's poster or stand and is counted (gymPosters.ts). Server build only.
import { addressKey } from "@/server/gymDirectory";
import { cityHtml, goneHtml, GYM_GONE_HEADERS, GYM_PAGE_HEADERS, gymHtml, indexHtml, pageLang } from "@/server/gymPage";
import { cities, cityPlaces, placeBySlug } from "@/server/gymPlaces";
import { countScan } from "@/server/gymPosters";
import { publicPosterHtml } from "@/server/gymPrint";

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
      // /gyms/<city>/<gym>/poster/: the free poster and stand cards any gym prints itself (gymPrint.ts).
      if (u.get("poster") === "1") return new Response(publicPosterHtml({ ...p, placeName: p.name }, lang), { headers: GYM_GONE_HEADERS });
      // From the QR code on the gym's poster or stand (?from=qr): counted once per address a day, so never cached.
      const qr = u.get("from") === "qr";
      if (qr) await countScan(p.id, addressKey(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?")).catch(() => {});
      return new Response(gymHtml(p, await cityPlaces(city), lang), {
        headers: qr ? { ...GYM_PAGE_HEADERS, "Cache-Control": "private, no-store" } : GYM_PAGE_HEADERS,
      });
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
