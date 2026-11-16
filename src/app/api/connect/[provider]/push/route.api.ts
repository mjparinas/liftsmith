// POST /api/connect/garmin/push/: Garmin Connect's ping after a lifter's watch synced, and its deregistrations
// (docs/decisions/connected-apps.md). No account token: Garmin calls it. Every summary is fetched back from
// Garmin's own API with the lifter's token (connect.ts garminPing), so a forged ping can't plant data. Garmin
// wants a quick 200 and retries anything else, so failures inside are skipped rather than answered. Server build only.
import { garminPing } from "@/server/connect";
import { rateLimit } from "@/server/db";

export const maxDuration = 60;

type Ctx = { params: Promise<{ provider: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { provider } = await ctx.params;
  if (provider !== "garmin") return new Response("Not found", { status: 404 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  if (!(await rateLimit(`garmin-push:${ip}`, 5000, 3_600_000).catch(() => true))) return new Response("Too many", { status: 429 });
  const text = await req.text().catch(() => "");
  if (text.length > 1_000_000) return new Response("Too large", { status: 413 });
  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  await garminPing(body).catch(() => 0);
  return new Response(null, { status: 200 });
}
