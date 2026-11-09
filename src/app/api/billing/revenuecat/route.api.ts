// POST /api/billing/revenuecat/: RevenueCat's webhook (src/server/revenuecat.ts). Server build only (Vercel).
// Needs REVENUECAT_WEBHOOK_SECRET (the same value as the Authorization header set in RevenueCat) and a database.
import { authorized, storeRcEvent, type RcEvent } from "@/server/revenuecat";

const MAX = 64_000;

export async function POST(req: Request) {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Not configured" }, { status: 503 });
  if (!authorized(req.headers.get("authorization"), secret)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body: { event?: RcEvent };
  try {
    const raw = await req.text();
    if (raw.length > MAX) return Response.json({ error: "Too large" }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Not JSON" }, { status: 400 });
  }
  if (!body.event?.id) return Response.json({ error: "No event" }, { status: 400 });
  try {
    const r = await storeRcEvent(body.event);
    return Response.json({ ok: true, r });
  } catch {
    // RevenueCat retries failed deliveries, so a database hiccup isn't lost.
    return Response.json({ error: "Storage failed" }, { status: 503 });
  }
}
