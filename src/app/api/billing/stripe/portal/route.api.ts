// POST /api/billing/stripe/portal/: signed in only. Stripe's customer portal for the account's web subscription
// (change plan, update the card, cancel, invoices). 404 when the account never subscribed on the web. Server build only.
import { preflight, reply, signedIn } from "@/server/accountHttp";
import { portalUrl, stripeConfig } from "@/server/stripe";

export const OPTIONS = preflight;

export async function POST(req: Request) {
  const cfg = stripeConfig();
  if (!cfg) return reply(req, 503, { error: "The web doesn't sell Pro yet." });
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  try {
    const url = await portalUrl(cfg, s.accountId);
    return url ? reply(req, 200, { url }) : reply(req, 404, { error: "No web subscription on this account." });
  } catch (e) {
    console.warn("[stripe] portal", e instanceof Error ? e.message : e);
    return reply(req, 502, { error: "Couldn't open the subscription page. Try again in a moment." });
  }
}
