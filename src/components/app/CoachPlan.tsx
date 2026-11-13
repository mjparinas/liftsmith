"use client";

// Coach plans on Coaching › Your clients (src/lib/coachPlans.ts; docs/decisions/money.md "Coach plans"): the coach's
// plan and how many clients it allows, with "See coach plans" opening one sheet of the plans for sale. When the client
// list is full the card says so and the button becomes the screen's way up (the Pro visibility rule: never hidden).
// Nothing shows until coach plans are on (the server's `plan.live`).
import { useEffect, useState } from "react";

import { CARD_TITLE } from "@/components/titles";
import { platformStore } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import { manageUrl, openWebPortal, useBilling, webBilling } from "@/lib/billing";
import { buyCoach, loadCoachOffers, useCoachBilling, type CoachBuyResult, type CoachOffer } from "@/lib/coachBilling";
import { clientLimit, higherTier, tierRank, UNLIMITED_CLIENTS, type CoachTier, type PaidCoachTier } from "@/lib/coachPlans";
import { date, t } from "@/lib/i18n";
import { haptic, isNative, oops } from "@/lib/juice";
import { SITE_URL } from "@/lib/site";
import type { CoachPlanInfo } from "@/lib/trainer";

import { APPLE_EULA } from "./Pro";
import { Button, Sheet } from "./ui";

const TIER_NAME = { pro: "cpl.tier.pro", coach: "cpl.tier.coach", coachPlus: "cpl.tier.coachPlus" } as const;
export const tierName = (tier: CoachTier) => t(TIER_NAME[tier]);

/** The plan as this device sees it: the server's answer, raised by a store purchase the server hasn't heard about yet. */
export function effectivePlan(plan: CoachPlanInfo, storeTier: CoachTier | undefined): { tier: CoachTier; limit: number } {
  const tier = higherTier(plan.tier, storeTier ?? "pro");
  return { tier, limit: Math.max(plan.limit, clientLimit(tier, plan.limits)) };
}

export function CoachPlanCard({ plan, onChange, paid = false }: { plan: CoachPlanInfo; onChange: () => void; paid?: boolean }) {
  const storeTier = useBilling((s) => s.coachTier);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(paid ? t("cpl.paid") : null);
  // Back from Stripe Checkout, or just bought in the store: the webhook lands a moment later, so look again twice.
  useEffect(() => {
    if (!paid) return;
    const ids = [setTimeout(onChange, 3000), setTimeout(onChange, 9000)];
    return () => ids.forEach(clearTimeout);
  }, [paid, onChange]);
  if (!plan.live) return null;
  const { tier, limit } = effectivePlan(plan, storeTier);
  const school = plan.via === "school";
  const unlimited = limit >= UNLIMITED_CLIENTS;
  const full = plan.clients >= limit;
  const over = plan.clients > limit;
  // The server sends it only while the grace lasts.
  const grace = plan.graceUntil;
  const share = unlimited ? 0 : Math.min(1, plan.clients / Math.max(1, limit));
  const done = (r: CoachBuyResult, bought: PaidCoachTier) => {
    if (r === "ok" || r === "upgraded") {
      haptic("celebrate");
      setOpen(false);
      setNote(t("cpl.done", { tier: tierName(bought) }));
      onChange();
      setTimeout(onChange, 4000);
    } else if (r === "already") setNote(t("cpl.already"));
    else if (r === "error") {
      oops();
      setNote(t("cpl.error"));
    } else if (r === "signIn") setNote(t("pro.web.signInFirst"));
  };
  return (
    <section
      className={`${full && !unlimited ? "card-tint" : "card"} mt-3 p-4`}
      style={full && !unlimited ? { ["--tint" as string]: "var(--color-warn)" } : undefined}
      aria-labelledby="coach-plan-h"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 id="coach-plan-h" className={CARD_TITLE}>
          {t("cpl.title")}
        </h3>
        <span className="text-sm font-semibold text-accent">{school ? t("cpl.tier.school") : tierName(tier)}</span>
      </div>
      <p className="num mt-1 text-sm">
        {unlimited ? t("cpl.countNoLimit", { count: plan.clients }) : t("cpl.count", { count: plan.clients, limit })}
      </p>
      {!unlimited && (
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-raised"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={Math.min(plan.clients, limit)}
          aria-label={t("cpl.count", { count: plan.clients, limit })}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${share * 100}%`, background: full ? "var(--color-warn)" : "var(--color-accent)" }}
          />
        </div>
      )}
      {/* What to do, not just the number (AGENTS.md "Action over stats"). */}
      <p className="mt-2 text-sm text-muted">
        {school
          ? t("cpl.school", { limit })
          : grace
            ? t("cpl.grace", { limit, date: date(grace, { day: "numeric", month: "long", year: "numeric" }) })
            : over
              ? t("cpl.over")
              : full
                ? t("cpl.full")
                : unlimited
                  ? t("cpl.free")
                  : t("cpl.left", { left: limit - plan.clients })}
      </p>
      {!school && tier !== "coachPlus" && (
        <Button kind={full ? "primary" : "ghost"} className="mt-3 w-full" onClick={() => setOpen(true)}>
          {t("cpl.see")}
        </Button>
      )}
      {tier === "coachPlus" && plan.via !== "review" && <ManageButton via={plan.via} />}
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
      <PlansSheet open={open} onClose={() => setOpen(false)} plan={plan} tier={tier} onDone={done} />
    </section>
  );
}

function ManageButton({ via }: { via: CoachPlanInfo["via"] }) {
  const ent = useBilling((s) => s.ent);
  const manage = async () => {
    if (webBilling() && via === "web") await openWebPortal();
    else if (isNative()) window.open(manageUrl(ent), "_blank");
  };
  // Only where it can be managed from here: the web for a web plan, the phone for a store plan.
  if ((via === "web" && !webBilling()) || ((via === "play" || via === "appstore") && !isNative())) return null;
  return (
    <Button kind="quiet" className="mt-3 w-full" onClick={() => void manage()}>
      {t("cpl.manage")}
    </Button>
  );
}

function PlansSheet({
  open,
  onClose,
  plan,
  tier,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  plan: CoachPlanInfo;
  tier: CoachTier;
  onDone: (r: CoachBuyResult, tier: PaidCoachTier) => void;
}) {
  const { offers, busy, error } = useCoachBilling();
  const proVia = useAccount((s) => s.account?.proVia ?? null);
  useEffect(() => {
    if (open) void loadCoachOffers();
  }, [open]);
  const web = webBilling();
  const store = web ? "web" : platformStore() === "appstore" ? "appstore" : "play";
  // Pro billed somewhere else than where this plan would be bought: say to cancel it there, so nobody pays twice.
  const otherBill =
    !web && proVia === "web"
      ? t("cpl.otherBill.web")
      : web && (proVia === "play" || proVia === "appstore")
        ? t("cpl.otherBill.store")
        : null;
  const pick = async (o: CoachOffer) => {
    haptic("tick");
    onDone(await buyCoach(o.tier, o.plan), o.tier);
  };
  return (
    <Sheet open={open} onClose={onClose} title={t("cpl.sheetTitle")}>
      <p className="text-sm text-muted">{t("cpl.sheetLead", { pro: plan.limits.pro })}</p>
      {(["coach", "coachPlus"] as PaidCoachTier[]).map((tr) => {
        const mine = tier === tr;
        const below = tierRank(tr) < tierRank(tier);
        const limit = clientLimit(tr, plan.limits);
        const choices = (offers ?? []).filter((o) => o.tier === tr);
        return (
          <section key={tr} className="card mt-4 p-4" aria-label={tierName(tr)}>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className={CARD_TITLE}>{tierName(tr)}</h3>
              {mine && <span className="text-xs font-semibold text-accent">{t("cpl.current")}</span>}
            </div>
            <p className="mt-1 text-sm font-semibold">
              {tr === "coachPlus" ? t("cpl.clients.coachPlus") : t("cpl.clients.coach", { limit })}
            </p>
            <p className="mt-1 text-sm text-muted">{t(tr === "coachPlus" ? "cpl.what.coachPlus" : "cpl.what.coach")}</p>
            {!mine && !below && (
              <div className="mt-3 space-y-2">
                {choices.map((o) => (
                  <button
                    key={o.plan}
                    type="button"
                    disabled={busy}
                    onClick={() => void pick(o)}
                    className={`press w-full rounded-2xl border p-3 text-left disabled:opacity-60 ${o.plan === "annual" ? "border-accent bg-accent/10" : "border-line bg-surface"}`}
                  >
                    <span className="block font-semibold">
                      {t(o.plan === "annual" ? "cpl.yearly" : "cpl.monthly", { tier: tierName(tr) })}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {o.plan === "annual" && o.perMonth
                        ? t("cpl.yearPrice", { price: o.price, perMonth: o.perMonth })
                        : t("cpl.monthPrice", { price: o.price })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}
      {!offers?.length && (
        <div className="mt-4">
          <p className="text-sm text-muted">{t("cpl.unavailable")}</p>
          {error && <p className="mt-1 text-xs break-words text-faint">{t("pro.errorDetail", { detail: error })}</p>}
          <Button kind="ghost" className="mt-2 w-full" disabled={busy} onClick={() => void loadCoachOffers()}>
            {t("cpl.retry")}
          </Button>
        </div>
      )}
      <p className="mt-4 text-sm">{t("cpl.free")}</p>
      {tier === "pro" && <p className="mt-2 text-xs text-muted">{otherBill ?? t("cpl.replace")}</p>}
      <p className="mt-2 text-xs text-faint">
        {t(store === "web" ? "pro.legal.web" : store === "appstore" ? "pro.legal.appstore" : "pro.legal.play")}
      </p>
      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <a className="text-accent underline" href={`${SITE_URL}/terms/`} target="_blank" rel="noreferrer">
          {t("pro.termsLink")}
        </a>
        {store === "appstore" && (
          <a className="text-accent underline" href={APPLE_EULA} target="_blank" rel="noreferrer">
            {t("pro.eulaLink")}
          </a>
        )}
        <a className="text-accent underline" href={`${SITE_URL}/privacy/`} target="_blank" rel="noreferrer">
          {t("pro.privacyLink")}
        </a>
      </p>
    </Sheet>
  );
}
