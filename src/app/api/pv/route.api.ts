// POST /api/pv/: a page view or call-to-action click on the public site (src/components/SiteBeacon.tsx).
// Cookieless: nothing is stored on the visitor's device for it, and the visitor hash changes every day.
import { checkPageView } from "@/lib/analyticsSchema";
import { storePageView, whereFrom } from "@/server/collect";
import { rateLimit } from "@/server/db";

export async function POST(req: Request) {
  if (Number(req.headers.get("content-length") ?? 0) > 4000) return new Response(null, { status: 413 });
  // A browser's Global Privacy Control signal is respected: nothing is stored.
  if (req.headers.get("sec-gpc") === "1") return new Response(null, { status: 204 });
  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > 4000) return new Response(null, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  const pv = checkPageView(body);
  if (!pv) return new Response(null, { status: 400 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "?";
  try {
    if (!(await rateLimit(`pv:${ip}`, 300, 3_600_000))) return new Response(null, { status: 429 });
    await storePageView(pv, { ip, ua: req.headers.get("user-agent") ?? "", ownHost: new URL(req.url).hostname, ...whereFrom(req.headers) });
  } catch {
    return new Response(null, { status: 503 });
  }
  return new Response(null, { status: 204 });
}
