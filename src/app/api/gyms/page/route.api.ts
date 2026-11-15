// GET /gyms/, /gyms/<city>/ and /gyms/<city>/<gym>/ (rewritten here with ?city=&gym=): the website's gym pages, plain
// HTML with no scripts (except /gyms/'s map, gymsNear.ts) and their own strict CSP (src/server/gymPage.ts). Anything not found gets a noindex page. A visit
// with ?from=qr came from the gym's poster or stand and is counted (gymPosters.ts). Server build only.
import { addressKey } from "@/server/gymDirectory";
import { cityHtml, goneHtml, GYM_GONE_HEADERS, GYM_PAGE_HEADERS, gymHtml, indexHtml, pageLang } from "@/server/gymPage";
import { cities, cityPlaces, movedCity, movedGym, placeBySlug } from "@/server/gymPlaces";
import { countScan } from "@/server/gymPosters";
import { publicPosterHtml } from "@/server/gymPrint";
import { GYMS_INDEX_CSP } from "@/server/gymsNear";
import { cityTrainers } from "@/server/trainerDirectory";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const lang = pageLang(req);
  const u = new URL(req.url).searchParams;
  const city = u.get("city");
  const gym = u.get("gym");
  const gone = () => new Response(goneHtml(lang), { status: 404, headers: GYM_GONE_HEADERS });
  // A page that moved when its city was fixed (gymPlaces.ts moveToCity): a permanent redirect, keeping ?from=qr.
  const moved = (to: string, poster = false) => {
    const qr = u.get("from") === "qr" ? "?from=qr" : "";
    return new Response(null, {
      status: 301,
      headers: { Location: `${to}${poster ? "poster/" : ""}${qr}`, "Cache-Control": "public, max-age=3600" },
    });
  };
  try {
    if (city && gym) {
      const p = await placeBySlug(city, gym);
      if (!p) {
        const to = await movedGym(city, gym);
        return to ? moved(to, u.get("poster") === "1") : gone();
      }
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
      if (!list.length) {
        const to = await movedCity(city);
        return to ? moved(to) : gone();
      }
      const trainers = (await cityTrainers(city).catch(() => ({ people: [] }))).people.length;
      return new Response(cityHtml(city, list, lang, trainers), { headers: GYM_PAGE_HEADERS });
    }
    // /gyms/ runs one script of our own (the map of the closest gyms), so it gets its own policy (gymsNear.ts).
    return new Response(indexHtml(await cities(), lang), { headers: { ...GYM_PAGE_HEADERS, "Content-Security-Policy": GYMS_INDEX_CSP } });
  } catch {
    return gone();
  }
}
