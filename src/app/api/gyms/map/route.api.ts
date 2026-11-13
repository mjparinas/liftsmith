// GET /api/gyms/map/?place=<id>: a gym's map picture from Mapbox, passed through so the gym pages' CSP (images only from
// our own origin) holds and the token stays on the server (src/server/gymMedia.ts, docs/decisions/gyms.md). 404 while
// MAPBOX_TOKEN isn't set. Kept a day in the browser and at the edge. Server build only.
import { mapImage } from "@/server/gymMedia";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const m = await mapImage(new URL(req.url).searchParams.get("place")).catch(() => null);
  if (!m) return new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=300" } });
  return new Response(m.bytes, {
    headers: { "Content-Type": m.type, "Cache-Control": "public, max-age=86400, s-maxage=86400", "X-Content-Type-Options": "nosniff" },
  });
}
