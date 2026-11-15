// GET /trainers/ and /trainers/<city>/ (rewritten here with ?city=): personal trainers, coaches and physios listed at
// their gyms, by city, plain HTML with no scripts under the share pages' strict CSP (src/server/trainerPage.ts). A city
// with nobody listed answers 404 with the index. Server build only.
import { GYM_GONE_HEADERS, GYM_PAGE_HEADERS, pageLang } from "@/server/gymPage";
import { cityTrainers, trainerCities } from "@/server/trainerDirectory";
import { trainerCityHtml, trainerIndexHtml } from "@/server/trainerPage";

export const dynamic = "force-dynamic";

const HEADERS = { ...GYM_PAGE_HEADERS, "Cache-Control": "public, max-age=600, s-maxage=3600" };

export async function GET(req: Request) {
  const lang = pageLang(req);
  const city = new URL(req.url).searchParams.get("city");
  try {
    if (city !== null) {
      const c = await cityTrainers(city);
      if (c.people.length) return new Response(trainerCityHtml(lang, city, c), { headers: HEADERS });
      return new Response(trainerIndexHtml(lang, await trainerCities()), { status: 404, headers: GYM_GONE_HEADERS });
    }
    return new Response(trainerIndexHtml(lang, await trainerCities()), { headers: HEADERS });
  } catch {
    return new Response(trainerIndexHtml(lang, []), { status: 404, headers: GYM_GONE_HEADERS });
  }
}
