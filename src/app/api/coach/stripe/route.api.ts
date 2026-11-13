// POST /api/coach/stripe/: the Stripe Connect webhook for client payments (src/server/coachPay.ts). Server build only.
// Set up in Stripe as a Connect endpoint ("Events on connected accounts") with its own signing secret,
// STRIPE_CONNECT_WEBHOOK_SECRET. Events to send: account.updated, checkout.session.completed, invoice.paid,
// invoice.payment_failed, customer.subscription.updated and customer.subscription.deleted.
import { payConfig, storeConnectEvent, verifyConnect, type ConnectEvent } from "@/server/coachPay";

const MAX = 256_000;

export async function POST(req: Request) {
  const cfg = payConfig();
  if (!cfg) return Response.json({ error: "Not configured" }, { status: 503 });
  const raw = await req.text();
  if (raw.length > MAX) return Response.json({ error: "Too large" }, { status: 413 });
  if (!verifyConnect(raw, req.headers.get("stripe-signature"), cfg)) return Response.json({ error: "Bad signature" }, { status: 400 });
  let e: ConnectEvent;
  try {
    e = JSON.parse(raw) as ConnectEvent;
  } catch {
    return Response.json({ error: "Not JSON" }, { status: 400 });
  }
  if (!e?.data?.object || typeof e.type !== "string") return Response.json({ ok: true });
  try {
    await storeConnectEvent(e);
    return Response.json({ ok: true });
  } catch {
    // Stripe retries failed deliveries for three days, so a database hiccup isn't lost.
    return Response.json({ error: "Storage failed" }, { status: 503 });
  }
}
