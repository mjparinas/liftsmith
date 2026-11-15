// GET /strength-standards/ and /strength-standards/<lift>/ (rewritten here with ?lift=): strength standards from real
// lifters, plain HTML with no scripts under the share pages' strict CSP (src/server/standardsPage.ts). Server build only.
import { GYM_GONE_HEADERS, GYM_PAGE_HEADERS, pageLang } from "@/server/gymPage";
import { publishedLifts, standardsOf } from "@/server/standards";
import { isLiftSlug, liftHtml, standardsGoneHtml, standardsIndexHtml } from "@/server/standardsPage";

export const dynamic = "force-dynamic";

/** The numbers change once a day, so the edge can keep a page for an hour. */
const HEADERS = { ...GYM_PAGE_HEADERS, "Cache-Control": "public, max-age=600, s-maxage=3600" };

export async function GET(req: Request) {
  const lang = pageLang(req);
  const lift = new URL(req.url).searchParams.get("lift");
  const gone = () => new Response(standardsGoneHtml(lang), { status: 404, headers: GYM_GONE_HEADERS });
  try {
    if (lift !== null) {
      if (!isLiftSlug(lift)) return gone();
      const rows = await standardsOf(lift);
      if (!rows.length) return gone();
      const others = (await publishedLifts()).map((l) => l.lift).filter((l) => l !== lift);
      return new Response(liftHtml(lang, lift, rows, others), { headers: HEADERS });
    }
    return new Response(standardsIndexHtml(lang, await publishedLifts()), { headers: HEADERS });
  } catch {
    return gone();
  }
}
