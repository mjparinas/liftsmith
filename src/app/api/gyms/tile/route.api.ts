// GET /api/gyms/tile/?z=&x=&y=[&style=light]: one Mapbox map tile for the map in Find gyms near you, passed through so
// the Mapbox token stays on the server (src/server/gymMedia.ts, docs/decisions/gyms.md). A tile never changes for us, so
// it's kept a week in the phone and a month at the edge; only tiles the edge hasn't seen reach this code, and those
// are rate-limited per address so nobody can pull Mapbox's map through us. 404 while MAPBOX_TOKEN isn't set. Server
// build only.
import { rateLimit } from "@/server/db";
import { tileImage, TILES_PER_HOUR } from "@/server/gymMedia";

export const dynamic = "force-dynamic";

const ipOf = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const [ok, tile] = await Promise.all([
    rateLimit(`gyms:tile:${ipOf(req)}`, TILES_PER_HOUR, 3_600_000).catch(() => true),
    tileImage({ z: u.get("z"), x: u.get("x"), y: u.get("y"), style: u.get("style") }).catch(() => null),
  ]);
  if (!ok) return new Response("Slow down", { status: 429, headers: { "Cache-Control": "no-store" } });
  if (!tile) return new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=300" } });
  return new Response(tile.bytes, {
    headers: {
      "Content-Type": tile.type,
      "Cache-Control": "public, max-age=604800, s-maxage=2592000",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
