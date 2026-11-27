// GET /embed/gym/<id>/<kind>/ and /embed/gym/<id>/badge.svg (rewritten here with ?id=&kind=, next.config.ts): the website
// widgets an official gym puts on its own site (src/server/gymWidgets.ts, docs/decisions/gyms.md "Website widgets").
// Server build only.
import { widgetPlace } from "@/server/gymPlaces";
import { BADGE_HEADERS, badgeSvg, WIDGET_HEADERS, widgetHtml, widgetRequest } from "@/server/gymWidgets";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { id, kind, lang, theme } = widgetRequest(new URL(req.url).searchParams);
  // The badge names no gym, so it's drawn without reading anything.
  if (kind === "badge") return new Response(badgeSvg(lang, theme), { headers: BADGE_HEADERS });
  if (!kind) return new Response(widgetHtml(null, "equipment", lang, theme), { status: 404, headers: WIDGET_HEADERS });
  let p;
  try {
    p = await widgetPlace(id, kind === "schedule");
  } catch {
    // The database didn't answer: say the widget is off for now, and keep that answer out of every cache.
    return new Response(widgetHtml(null, kind, lang, theme), { status: 503, headers: { ...WIDGET_HEADERS, "Cache-Control": "no-store" } });
  }
  return new Response(widgetHtml(p, kind, lang, theme), { status: p ? 200 : 404, headers: WIDGET_HEADERS });
}
