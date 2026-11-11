// Pro on the web through Stripe (src/server/stripe.ts). Server build only.
// GET  /api/billing/stripe/?code=&trial=: whether the web sells Pro, both plans' prices, and the trial this lifter would
//      get (signed in: their own eligibility; a code's trial when it's live). {live: false} until Stripe is set up.
// POST /api/billing/stripe/ {plan, code?, trial?, installId?}: signed in only. A Stripe Checkout page to go to, or 409
//      when the account already has Pro (from the web, a phone's store or a lifetime code), so nobody pays twice.
import { alreadyPro } from "@/server/access";
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { accountInfo, sessionOf } from "@/server/accounts";
import { rateLimit } from "@/server/db";
import { checkoutUrl, stripeConfig, trialFor, webPrices, type WebPlan } from "@/server/stripe";

export const OPTIONS = preflight;
const SAFE_ID = /^[A-Za-z0-9_-]{8,64}$/;

export async function GET(req: Request) {
  const cfg = stripeConfig();
  if (!cfg) return reply(req, 200, { live: false });
  const u = new URL(req.url);
  const s = await sessionOf(req).catch(() => null);
  try {
    const [prices, trial] = await Promise.all([
      webPrices(cfg),
      trialFor(s?.accountId ?? null, u.searchParams.get("code"), u.searchParams.get("trial")),
    ]);
    return reply(req, 200, { live: prices.length > 0, prices, trialDays: trial.days });
  } catch {
    // Stripe or the database didn't answer: the app keeps what it showed last time.
    return reply(req, 503, { error: "Prices unavailable" });
  }
}

export async function POST(req: Request) {
  const cfg = stripeConfig();
  if (!cfg) return reply(req, 503, { error: "The web doesn't sell Pro yet." });
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  if (!(await rateLimit(`checkout:${s.accountId}`, 20, 3_600_000).catch(() => true)))
    return reply(req, 429, { error: "Too many tries. Wait a few minutes." });
  const b = ((await readJson(req)) ?? {}) as { plan?: unknown; code?: unknown; trial?: unknown; installId?: unknown };
  const plan: WebPlan | null = b.plan === "annual" || b.plan === "monthly" ? b.plan : null;
  if (!plan) return reply(req, 400, { error: "Pick a plan" });
  const a = await accountInfo(s.accountId);
  if (!a) return reply(req, 401, { error: "Signed out. Sign in again." });
  const held = await alreadyPro(s.accountId, a.email);
  if (held) return reply(req, 409, { error: "already", via: held.via });
  try {
    const trial = await trialFor(s.accountId, b.code, b.trial);
    const url = await checkoutUrl(cfg, {
      accountId: s.accountId,
      email: a.email,
      plan,
      installId: typeof b.installId === "string" && SAFE_ID.test(b.installId) ? b.installId : null,
      code: trial.code,
      trialDays: trial.days,
    });
    return reply(req, 200, { url });
  } catch (e) {
    console.warn("[stripe] checkout", e instanceof Error ? e.message : e);
    return reply(req, 502, { error: "Couldn't open checkout. Try again in a moment." });
  }
}
