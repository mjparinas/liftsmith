"use client";

import { useEffect, useState } from "react";

import { SECTION_LABEL } from "@/components/titles";
import { platformStore } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import {
  billingLive,
  buy,
  entActive,
  manageUrl,
  openWebPortal,
  restore,
  retryBilling,
  useBilling,
  waitForWebPro,
  webBilling,
  type BuyResult,
} from "@/lib/billing";
import { PRO_FEATURES, type Feature } from "@/lib/entitlements";
import { date, t } from "@/lib/i18n";
import { haptic, isNative, oops } from "@/lib/juice";
import { SITE_URL } from "@/lib/site";
import { useApp } from "@/lib/store";
import type { Plan } from "@/lib/trial";
import { useNow } from "@/lib/useNow";
import type { MessageKey } from "@/locales/en";

import { CreatorCode } from "./CreatorCode";
import { celebratePro } from "./ProWelcome";
import { go, goBack, historyDepth, ROUTES, useRoute, type Route } from "./router";
import { Button, ScreenHeader } from "./ui";

// The paywall (#/pro, also the last step of first-run setup). AGENTS.md "Money": plain prices from the
// store, annual first, neither plan pre-selected (each is its own button), the trial and renewal terms
// spelled out, Restore purchases, and cancel in the store's own subscriptions page. No countdowns.

const APPLE_EULA = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

// What each Pro screen entry point passes as the route argument (#/pro/<from>): the feature it was for,
// so the paywall can mark it, and the screen to go back to when there's no history (a fresh launch).
const FROM: Record<string, { feature?: Feature; back: Route }> = {
  programs: { feature: "adaptive", back: "programs" },
  splits: { feature: "adaptiveSplits", back: "programs" },
  today: { feature: "adaptive", back: "today" },
  recovery: { feature: "recoveryMap", back: "recovery" },
  twin: { feature: "healthReadiness", back: "recovery" },
  labs: { feature: "labs", back: "settings" },
  replan: { feature: "replan", back: "workout" },
  goals: { feature: "goalPlanner", back: "stats" },
  plateau: { feature: "plateauDetective", back: "stats" },
  settings: { back: "settings" },
  // Back from Stripe Checkout on the web (src/server/stripe.ts RETURN_URLS).
  paid: { back: "today" },
  setup: { back: "today" },
};

/** Where #/pro/<arg> came from: the feature to mark on the paywall and the screen behind it. */
export function proFrom(arg: string | undefined): { feature?: Feature; back: Route } {
  if (arg && FROM[arg]) return FROM[arg];
  return { back: arg && (ROUTES as readonly string[]).includes(arg) && arg !== "pro" ? (arg as Route) : "today" };
}

/**
 * Everything Pro unlocks, one row per gated feature (PRO_FEATURES in entitlements.ts), with a line on what
 * it does. The feature the lifter tapped comes first and is marked. `compact` (setup) shows titles only.
 */
export function ProFeatures({ focus, compact = false }: { focus?: Feature; compact?: boolean }) {
  const order = focus ? [focus, ...PRO_FEATURES.filter((f) => f !== focus)] : [...PRO_FEATURES];
  return (
    <section className="mt-5" aria-labelledby="pro-unlocks">
      <h2 id="pro-unlocks" className={SECTION_LABEL}>
        {t("pro.unlocks")}
      </h2>
      <ul className={`mt-2 ${compact ? "space-y-1.5 text-sm" : "space-y-2"}`}>
        {order.map((f) => {
          const title = t(`pro.ft.${f}` as MessageKey);
          if (compact)
            return (
              <li key={f} className="flex gap-2">
                <span className="text-accent" aria-hidden>
                  ✓
                </span>
                {title}
              </li>
            );
          const picked = f === focus;
          return (
            <li key={f} className={`rounded-2xl border p-3 ${picked ? "border-accent bg-accent/10" : "border-line bg-surface"}`}>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-accent" aria-hidden>
                  ✓
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {title}
                    {picked && <span className="ml-2 text-xs font-semibold text-accent">{t("pro.youAsked")}</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{t(`pro.fb.${f}` as MessageKey)}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {!compact && <p className="mt-3 text-sm text-muted">{t("pro.free")}</p>}
    </section>
  );
}

/** The plan buttons, Restore purchases and the store's terms. `onDone` runs after a purchase that unlocked Pro. */
export function Plans({ from, onDone }: { from: string; onDone?: (plan: Plan, trial: boolean) => void }) {
  const { offers, busy, error } = useBilling();
  const [note, setNote] = useState<string | null>(null);
  const signedIn = useAccount((s) => !!s.account);
  // The web app sells through Stripe (billing.ts), the apps through their store.
  const store = webBilling() ? "web" : platformStore() === "appstore" ? "appstore" : "play";

  const pick = async (plan: Plan) => {
    haptic("tick");
    setNote(null);
    const trialDays = offers?.find((o) => o.plan === plan)?.trialDays ?? null;
    const r: BuyResult = await buy(plan, from);
    if (r === "ok") {
      onDone?.(plan, !!trialDays);
      // Confetti, the celebrate buzz and the thank-you sheet (ProWelcome). Not after Restore purchases.
      celebratePro(trialDays);
    } else if (r === "error") {
      oops();
      setNote(t("pro.error"));
    } else if (r === "signIn") setNote(t("pro.web.signInFirst"));
    else if (r === "already") setNote(t("pro.web.already"));
  };

  const doRestore = async () => {
    setNote(null);
    const ok = await restore();
    if (ok) {
      haptic("success");
      onDone?.(useBilling.getState().ent?.plan ?? "annual", false);
    } else setNote(t(store === "web" ? "pro.web.restoreNone" : "pro.restoreNone"));
  };
  const restoreLabel = t(store === "web" ? "pro.web.restore" : "pro.restore");

  if (!offers?.length) {
    return (
      <div className="mt-6 space-y-3">
        <p className="text-sm text-muted">
          {t(store === "web" ? "pro.offline.web" : store === "appstore" ? "pro.offline.appstore" : "pro.offline.play")}
        </p>
        {error && <p className="break-words text-xs text-faint">{t("pro.errorDetail", { detail: error })}</p>}
        <Button kind="ghost" className="w-full" disabled={busy} onClick={() => void retryBilling()}>
          {t("pro.retry")}
        </Button>
        <Button kind="quiet" className="w-full" disabled={busy} onClick={() => void doRestore()}>
          {restoreLabel}
        </Button>
        {note && (
          <p role="status" className="text-sm text-warn">
            {note}
          </p>
        )}
        {/* Without the store's plans a lifetime code still works: it goes to the account, not the store. */}
        <CreatorCode collapsed />
      </div>
    );
  }

  return (
    <>
      {store === "web" && !signedIn && (
        // The web sells Pro to an account, so it follows the lifter to their phone (and survives a cleared browser).
        <div className="card mt-6 p-4 text-sm">
          <p className="text-muted">{t("pro.web.needsAccount")}</p>
          <Button kind="ghost" className="mt-3 w-full" icon="lock" onClick={() => go("account")}>
            {t("pro.web.signIn")}
          </Button>
        </div>
      )}
      <div className="mt-6 space-y-3">
        {offers.map((o) => {
          const name = o.plan === "annual" ? t("pro.yearly") : t("pro.monthly");
          const per = o.plan === "annual" ? t("pro.perYear") : t("pro.perMonth");
          return (
            <button
              key={o.plan}
              type="button"
              disabled={busy}
              onClick={() => void pick(o.plan)}
              className={`press w-full rounded-2xl border p-4 text-left disabled:opacity-60 ${o.plan === "annual" ? "border-accent bg-accent/10" : "border-line bg-surface"}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">
                  {o.trialDays ? t("pro.startTrial", { days: o.trialDays, plan: name }) : t("pro.subscribe", { plan: name })}
                </span>
                {o.perMonth && <span className="text-xs font-semibold text-accent">{t("pro.aboutMonth", { price: o.perMonth })}</span>}
              </div>
              <div className="mt-0.5 text-sm text-muted">
                {o.trialDays ? t("pro.trialTerms", { days: o.trialDays, price: o.price, per }) : t("pro.terms", { price: o.price, per })}
              </div>
            </button>
          );
        })}
      </div>
      {note && (
        <p role="status" className="mt-3 text-sm text-warn">
          {note}
        </p>
      )}
      <CreatorCode collapsed />
      <Button kind="quiet" className="mt-3 w-full" disabled={busy} onClick={() => void doRestore()}>
        {restoreLabel}
      </Button>
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
    </>
  );
}

export function Pro() {
  const { arg } = useRoute();
  const { live, ent } = useBilling();
  const { profile, setProfile } = useApp();
  const from = proFrom(arg);
  const back = from.back;
  // Back steps back through the app's history; on a fresh launch, the screen this was opened for.
  const leave = () => (historyDepth() > 0 ? goBack() : go(back));
  const now = useNow(60_000);
  const viaAccount = useAccount((s) => !!s.account?.pro);
  const proVia = useAccount((s) => s.account?.proVia ?? null);
  const active = live && (entActive(ent, now) || viaAccount);
  const on = (ms: number) => date(ms, { day: "numeric", month: "long", year: "numeric" });
  const [manageFailed, setManageFailed] = useState(false);
  // Back from Stripe Checkout (#/pro/paid): wait for the webhook to reach the account, then the thank-you.
  const [confirming, setConfirming] = useState(arg === "paid" && !isNative());
  useEffect(() => {
    if (arg !== "paid" || isNative()) return;
    let gone = false;
    void waitForWebPro().then((ok) => {
      if (gone) return;
      setConfirming(false);
      if (!ok) return;
      const sub = useAccount.getState().account?.sub;
      const trial = sub?.trial ? Math.max(1, Math.round(((sub.expiresAt ?? Date.now()) - Date.now()) / 86_400_000)) : null;
      const p = useApp.getState().profile;
      useApp.getState().setProfile({
        pro: {
          ...p.pro,
          offeredAt: p.pro?.offeredAt ?? Date.now(),
          plan: sub?.plan ?? "annual",
          ...(trial ? { trialStartedAt: Date.now(), trialDays: trial } : { subscribed: true }),
        },
      });
      useApp.getState().applyAccess();
      celebratePro(trial);
    });
    return () => {
      gone = true;
    };
  }, [arg]);
  const manage = async () => {
    setManageFailed(false);
    if (webBilling()) {
      if (!(await openWebPortal())) setManageFailed(true);
    } else window.open(manageUrl(ent), "_blank");
  };
  // Pro on the account without a store purchase on this device: say where it comes from and where it's managed.
  const accountLine =
    proVia === "web"
      ? t("pro.status.web")
      : proVia === "play"
        ? t("pro.status.play")
        : proVia === "appstore"
          ? t("pro.status.appstore")
          : t("pro.status.account");

  return (
    <div className="pb-24">
      <ScreenHeader back={{ label: `‹ ${t("pro.back")}`, onClick: leave }} title={active ? t("pro.youHave") : t("pro.title")} />
      <p className="mt-2 text-muted">{t("pro.lead")}</p>
      <ProFeatures focus={active ? undefined : from.feature} />
      {confirming ? (
        <p role="status" className="card mt-6 p-4 text-sm text-muted">
          {t("pro.web.confirming")}
        </p>
      ) : !billingLive() ? (
        // The web app and builds without store billing: nothing to buy here, and everything is on.
        <>
          <p className="card mt-6 p-4 text-sm text-muted">{t("pro.notHere")}</p>
          {/* A lifetime code redeemed here gives the account Pro on its phones too (creator.ts). */}
          {!viaAccount && <CreatorCode collapsed />}
        </>
      ) : active && !entActive(ent, now) ? (
        // Pro that comes with the account: the review account or a lifetime code (nothing to manage), a web subscription
        // seen from a phone (managed on the website; no link, the stores don't allow pointing to other payments), or a
        // phone's store subscription seen on the web (managed in that store).
        <p className="card mt-6 p-4 text-sm text-muted">{accountLine}</p>
      ) : active && ent ? (
        <div className="card mt-6 space-y-1 p-4 text-sm">
          <p className="font-semibold">{ent.plan === "monthly" ? t("pro.status.monthly") : t("pro.status.yearly")}</p>
          {ent.expiresAt != null && (
            <p className="text-muted">
              {ent.trial
                ? t("pro.status.trial", { date: on(ent.expiresAt) })
                : ent.willRenew
                  ? t("pro.status.renews", { date: on(ent.expiresAt) })
                  : t("pro.status.ends", { date: on(ent.expiresAt) })}
            </p>
          )}
          {ent.family && <p className="text-muted">{t("pro.status.family")}</p>}
          <Button kind="ghost" className="mt-3 w-full" onClick={() => void manage()}>
            {t("pro.manage")}
          </Button>
          {manageFailed && (
            <p role="status" className="text-sm text-warn">
              {t("pro.web.manageFailed")}
            </p>
          )}
        </div>
      ) : (
        <Plans
          from={arg ?? back}
          onDone={(plan, trial) => {
            const now = Date.now();
            const days = useBilling.getState().offers?.find((o) => o.plan === plan)?.trialDays ?? undefined;
            setProfile({
              pro: {
                ...profile.pro,
                offeredAt: profile.pro?.offeredAt ?? now,
                plan,
                ...(trial ? { trialStartedAt: now, trialDays: days } : { subscribed: true }),
              },
            });
            useApp.getState().applyAccess();
            leave();
          }}
        />
      )}
    </div>
  );
}
