// How many clients a coach may have (coach plans, src/lib/coachPlans.ts; docs/decisions/money.md "Coach plans").
//
// Off until the coachPlans flag is on: every coach keeps the old limit of 30, as before. Once it's on, a coach's limit
// comes from the highest coach tier on their account: a web subscription (stripe.ts), a Play or App Store subscription
// on a phone linked to the account (RevenueCat's webhook keeps the tier per install), or Coach Plus for the store review
// account. Plain Pro, or no plan, allows the coachProClients flag's number. A verified high school coach keeps their
// team-sized limit, free (teams.ts). Coaches who already had more clients than Pro allows when the flag went on keep
// the old 30 for GRANDFATHER.days. Nobody already linked is ever unlinked by a limit: it only stops new clients joining.
import { clientLimit, GRANDFATHER, higherTier, isCoachTier, type ClientLimits, type CoachTier } from "@/lib/coachPlans";
import { allowed, FLAGS } from "@/lib/flags";

import { query } from "./db";
import { flagStates } from "./flags";
import { accountHasPro } from "./review";
import { webSub } from "./stripe";

const DAY = 86_400_000;

export type CoachPlanVia = "web" | "play" | "appstore" | "review" | "school" | null;

export interface CoachPlan {
  /** Coach plans are on (the coachPlans flag). Off: the old limit of 30 for everyone, and nothing to sell. */
  live: boolean;
  /** The highest coach tier the account pays for (Pro when none). */
  tier: CoachTier;
  /** Where that tier comes from. */
  via: CoachPlanVia;
  /** Clients allowed now, and clients linked now. */
  limit: number;
  clients: number;
  /** Pro's and Coach's limits right now (the flags), for the plan sheet. */
  limits: ClientLimits;
  /** While the grace for coaches who were over Pro's limit lasts, when it ends. */
  graceUntil: number | null;
}

const OLD_LIMIT = GRANDFATHER.clients;

/** Pro's and Coach's client limits from the admin flags, falling back to the defaults in code. */
function limitsFrom(states: Awaited<ReturnType<typeof flagStates>>): ClientLimits {
  const num = (name: "coachProClients" | "coachClients") => {
    const v = states.get(name)?.value;
    return allowed(name, v) && typeof v === "number" ? v : FLAGS[name].default;
  };
  return { pro: num("coachProClients"), coach: num("coachClients") };
}

/** The highest tier on a store subscription from a phone linked to the account. */
async function storeTier(accountId: string, now: number): Promise<{ tier: CoachTier; via: "play" | "appstore" } | null> {
  const rows = await query<{ tier: string | null; store: string | null }>(
    `SELECT e.tier, e.store FROM account_installs ai JOIN entitlements e ON e.app_user_id = ai.install_id
     WHERE ai.account_id = ? AND e.active = 1 AND (e.expires_at IS NULL OR e.expires_at > ?)`,
    [accountId, now],
  );
  let best: { tier: CoachTier; via: "play" | "appstore" } | null = null;
  for (const r of rows) {
    const tier = isCoachTier(r.tier) ? r.tier : "pro";
    if (!best || higherTier(tier, best.tier) !== best.tier) best = { tier, via: r.store === "appstore" ? "appstore" : "play" };
  }
  return best;
}

async function emailOf(accountId: string): Promise<string | null> {
  const [r] = await query<{ email: string | null }>("SELECT email FROM accounts WHERE id = ?", [accountId]);
  return r?.email ? String(r.email) : null;
}

export async function coachPlanOf(accountId: string, now = Date.now()): Promise<CoachPlan> {
  const [states, [count]] = await Promise.all([
    flagStates().catch(() => new Map() as Awaited<ReturnType<typeof flagStates>>),
    query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_links WHERE coach_id = ?", [accountId]),
  ]);
  const clients = Number(count?.n ?? 0);
  const limits = limitsFrom(states);
  const flag = states.get("coachPlans");
  if (flag?.value !== true) return { live: false, tier: "pro", via: null, limit: OLD_LIMIT, clients, limits, graceUntil: null };

  let tier: CoachTier = "pro";
  let via: CoachPlanVia = null;
  const pick = (t: CoachTier, v: CoachPlanVia) => {
    if (t !== "pro" && higherTier(t, tier) !== tier) [tier, via] = [t, v];
  };
  if (accountHasPro(await emailOf(accountId))) pick("coachPlus", "review");
  const web = await webSub(accountId, now);
  if (web?.tier) pick(web.tier, "web");
  const store = await storeTier(accountId, now);
  if (store) pick(store.tier, store.via);
  let limit = clientLimit(tier, limits);

  // High school coaches keep their team-sized limit, free (loaded here, because teams.ts loads coach.ts).
  const { isSchoolCoach, TEAM_LIMITS } = await import("./teams");
  if (limit < TEAM_LIMITS.clients && (await isSchoolCoach(accountId, now))) {
    limit = TEAM_LIMITS.clients;
    via = "school";
  }

  // Grandfathered: more clients than Pro allows when coach plans went on keeps the old limit for a while.
  let graceUntil: number | null = null;
  const since = flag.updatedAt;
  const until = since + GRANDFATHER.days * DAY;
  if (limit < OLD_LIMIT && now < until) {
    const [before] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_links WHERE coach_id = ? AND created_at < ?", [
      accountId,
      since,
    ]);
    if (Number(before?.n ?? 0) > limits.pro) {
      limit = OLD_LIMIT;
      graceUntil = until;
    }
  }
  return { live: true, tier, via, limit, clients, limits, graceUntil };
}

/** Whether the coach can take one more client. */
export async function hasRoom(coachId: string, now = Date.now()): Promise<boolean> {
  const p = await coachPlanOf(coachId, now);
  return p.clients < p.limit;
}
