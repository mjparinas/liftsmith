"use client";

import { useState } from "react";

import { platformStore } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import { billingLive, buy, entActive, manageUrl, restore, retryBilling, useBilling, type BuyResult } from "@/lib/billing";
import { PRO_FEATURES, type Feature } from "@/lib/entitlements";
import { date, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { SITE_URL } from "@/lib/site";
import { useApp } from "@/lib/store";
import type { Plan } from "@/lib/trial";
import { useNow } from "@/lib/useNow";
import type { MessageKey } from "@/locales/en";

import { CreatorCode } from "./CreatorCode";
import { celebratePro } from "./ProWelcome";
import { go, goBack, historyDepth, ROUTES, useRoute, type Route } from "./router";
import { Button } from "./ui";

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
  count: { feature: "autoCount", back: "workout" },
  replan: { feature: "replan", back: "workout" },
  goals: { feature: "goalPlanner", back: "stats" },
  plateau: { feature: "plateauDetective", back: "stats" },
  settings: { back: "settings" },
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
      <h2 id="pro-unlocks" className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
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
  const store = platformStore() === "appstore" ? "appstore" : "play";

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
    }
  };

  const doRestore = async () => {
    setNote(null);
    const ok = await restore();
    if (ok) {
      haptic("success");
      onDone?.(useBilling.getState().ent?.plan ?? "annual", false);
    } else setNote(t("pro.restoreNone"));
  };

  if (!offers?.length) {
    return (
      <div className="mt-6 space-y-3">
        <p className="text-sm text-muted">{t(store === "appstore" ? "pro.offline.appstore" : "pro.offline.play")}</p>
        {error && <p className="break-words text-xs text-faint">{t("pro.errorDetail", { detail: error })}</p>}
        <Button kind="ghost" className="w-full" disabled={busy} onClick={() => void retryBilling()}>
          {t("pro.retry")}
        </Button>
        <Button kind="quiet" className="w-full" disabled={busy} onClick={() => void doRestore()}>
          {t("pro.restore")}
        </Button>
        {note && (
          <p role="status" className="text-sm text-warn">
            {note}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
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
        {t("pro.restore")}
      </Button>
      <p className="mt-2 text-xs text-faint">{t(store === "appstore" ? "pro.legal.appstore" : "pro.legal.play")}</p>
      <p className="mt-1 flex gap-4 text-xs">
        {store === "appstore" && (
          <a className="text-accent underline" href={APPLE_EULA} target="_blank" rel="noreferrer">
            {t("pro.termsLink")}
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
  const active = live && (entActive(ent, now) || viaAccount);
  const on = (ms: number) => date(ms, { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="pb-24">
      <button type="button" onClick={leave} className="press -ml-2 min-h-11 pt-2 text-muted">
        ‹ {t("pro.back")}
      </button>
      <h1 className="text-[1.75rem] font-extrabold tracking-tight">{active ? t("pro.youHave") : t("pro.title")}</h1>
      <p className="mt-2 text-muted">{t("pro.lead")}</p>
      <ProFeatures focus={active ? undefined : from.feature} />
      {!billingLive() ? (
        // The web app and builds without store billing: nothing to buy here, and everything is on.
        <p className="card mt-6 p-4 text-sm text-muted">{t("pro.notHere")}</p>
      ) : active && !entActive(ent, now) ? (
        // Pro that comes with the account (the store review account): nothing to buy or manage.
        <p className="card mt-6 p-4 text-sm text-muted">{t("pro.status.account")}</p>
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
          <Button kind="ghost" className="mt-3 w-full" onClick={() => window.open(manageUrl(ent), "_blank")}>
            {t("pro.manage")}
          </Button>
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
