// POST /api/billing/stripe/webhook/: Stripe's webhook (src/server/stripe.ts). Server build only.
// Needs STRIPE_WEBHOOK_SECRET (the endpoint's signing secret) and the rest of the Stripe setup. Events to send:
// customer.subscription.created, .updated and .deleted, invoice.paid and charge.refunded.
import { alertForStoreEvent } from "@/server/alerts";
import { storeStripeEvent, stripeConfig, verifySignature, type StripeEvent } from "@/server/stripe";

const MAX = 256_000;

export async function POST(req: Request) {
  const cfg = stripeConfig();
  if (!cfg) return Response.json({ error: "Not configured" }, { status: 503 });
  const raw = await req.text();
  if (raw.length > MAX) return Response.json({ error: "Too large" }, { status: 413 });
  if (!verifySignature(raw, req.headers.get("stripe-signature"), cfg.webhook))
    return Response.json({ error: "Bad signature" }, { status: 400 });
  let e: StripeEvent;
  try {
    e = JSON.parse(raw) as StripeEvent;
  } catch {
    return Response.json({ error: "Not JSON" }, { status: 400 });
  }
  try {
    const r = await storeStripeEvent(e, cfg);
    // A new paying customer emails the admins, as for the stores (never throws).
    if (r.eventId) await alertForStoreEvent(r.eventId);
    return Response.json({ ok: true, stored: r.stored });
  } catch {
    // Stripe retries failed deliveries for three days, so a database hiccup isn't lost.
    return Response.json({ error: "Storage failed" }, { status: 503 });
  }
}
