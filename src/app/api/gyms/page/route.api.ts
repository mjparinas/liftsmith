// GET /gyms/, /gyms/<city>/ and /gyms/<city>/<gym>/ (rewritten here with ?city=&gym=): the website's gym pages, plain
// HTML with no scripts (except /gyms/'s map, gymsNear.ts) and their own strict CSP (src/server/gymPage.ts). Anything not found gets a noindex page. A visit
// with ?from=qr came from the gym's poster or stand and is counted (gymPosters.ts). /gyms/<city>/<gym>/report/ is the
// Report a problem form (GET shows it, POST sends it; gymReportPage.ts). Server build only.
import { addressKey } from "@/server/gymDirectory";
import { cityHtml, goneHtml, GYM_GONE_HEADERS, GYM_PAGE_HEADERS, gymHtml, indexHtml, pageLang } from "@/server/gymPage";
import { mergedPath, reportPlace } from "@/server/gymPlaceReports";
import { cities, cityPlaces, movedCity, movedGym, placeBySlug } from "@/server/gymPlaces";
import { countScan } from "@/server/gymPosters";
import { publicPosterHtml } from "@/server/gymPrint";
import { GYM_REPORT_HEADERS, reportPageHtml, type ReportPageState } from "@/server/gymReportPage";
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
        // A page that moved city (gym_moves), or a duplicate staff merged into another gym (gymPlaceReports.ts).
        const to = (await movedGym(city, gym)) ?? (await mergedPath(city, gym));
        return to ? moved(to, u.get("poster") === "1") : gone();
      }
      // /gyms/<city>/<gym>/report/: Report a problem with this page (gymReportPage.ts).
      if (u.get("report") === "1") return new Response(reportPageHtml(p, lang), { headers: GYM_REPORT_HEADERS });
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

// POST /gyms/<city>/<gym>/report/: the report form, sent without scripts. Answers with the same page, saying it was sent
// or what to fix. A filled-in hidden field (bots fill every box) is thanked and dropped.
export async function POST(req: Request) {
  const lang = pageLang(req);
  const u = new URL(req.url).searchParams;
  const city = u.get("city");
  const gym = u.get("gym");
  if (u.get("report") !== "1" || !city || !gym) return new Response(goneHtml(lang), { status: 404, headers: GYM_GONE_HEADERS });
  const p = await placeBySlug(city, gym).catch(() => null);
  if (!p) return new Response(goneHtml(lang), { status: 404, headers: GYM_GONE_HEADERS });
  const page = (state: ReportPageState, status = 200) =>
    new Response(reportPageHtml(p, lang, state), { status, headers: GYM_REPORT_HEADERS });
  const form = await req.formData().catch(() => null);
  if (!form) return page("failed", 400);
  if (String(form.get("site") ?? "")) return page("sent");
  const r = await reportPlace(
    addressKey(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?"),
    p.id,
    form.get("reason"),
    form.get("note"),
  ).catch(() => null);
  if (!r) return page("failed", 500);
  if (r.ok) return page("sent");
  return r.error === "reason" ? page("pick", 400) : r.error === "slow" ? page("slow", 429) : page("failed", 404);
}
