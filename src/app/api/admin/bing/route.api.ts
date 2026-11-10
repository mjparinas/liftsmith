// GET /api/admin/bing/?days=7|28|90|365: Bing Webmaster Tools for the Traffic tab (src/server/bing.ts), cached for
// 10 minutes; &refresh=1 reads again. Staff only (support can look). The API key stays on the server.
import { isSearchPeriod } from "@/lib/searchConsole";
import { json, requireStaff } from "@/server/adminAuth";
import { bingPart } from "@/server/bing";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireStaff(req);
  if ("response" in gate) return gate.response;
  const q = new URL(req.url).searchParams;
  const days = Number(q.get("days") ?? 28);
  if (!isSearchPeriod(days)) return json(400, { error: "Pick 7, 28, 90 or 365 days." });
  return json(200, await bingPart(days, { refresh: q.get("refresh") === "1" }));
}
