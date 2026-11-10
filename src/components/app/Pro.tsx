"use client";

import { useState } from "react";

import { platformStore } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import { billingLive, buy, entActive, loadOffers, manageUrl, restore, useBilling, type BuyResult } from "@/lib/billing";
import { date, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { SITE_URL } from "@/lib/site";
import { useApp } from "@/lib/store";
import type { Plan } from "@/lib/trial";
import { useNow } from "@/lib/useNow";

import { CreatorCode } from "./CreatorCode";
import { go, useRoute, type Route } from "./router";
import { Button } from "./ui";

// The paywall (#/pro, also the last step of first-run setup). AGENTS.md "Money": plain prices from the
// store, annual first, neither plan pre-selected (each is its own button), the trial and renewal terms
// spelled out, Restore purchases, and cancel in the store's own subscriptions page. No countdowns.

const APPLE_EULA = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

export function ProFeatures() {
  return (
    <ul className="mt-4 space-y-1.5 text-sm">
      {[t("pro.f1"), t("pro.f2"), t("pro.f3"), t("pro.f4"), t("pro.f5")].map((f) => (
        <li key={f} className="flex gap-2">
          <span className="text-accent" aria-hidden>
            ✓
          </span>
          {f}
        </li>
      ))}
    </ul>
  );
}

/** The plan buttons, Restore purchases and the store's terms. `onDone` runs after a purchase that unlocked Pro. */
export function Plans({ from, onDone }: { from: string; onDone?: (plan: Plan, trial: boolean) => void }) {
  const { offers, busy } = useBilling();
  const [note, setNote] = useState<string | null>(null);
  const store = platformStore() === "appstore" ? "appstore" : "play";

  const pick = async (plan: Plan) => {
    haptic("tick");
    setNote(null);
    const trial = !!offers?.find((o) => o.plan === plan)?.trialDays;
    const r: BuyResult = await buy(plan, from);
    if (r === "ok") {
      haptic("celebrate");
      onDone?.(plan, trial);
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
        <Button kind="ghost" className="w-full" disabled={busy} onClick={() => void loadOffers().catch(() => setNote(t("pro.error")))}>
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
  const back = (arg as Route | undefined) ?? "settings";
  const now = useNow(60_000);
  const viaAccount = useAccount((s) => !!s.account?.pro);
  const active = live && (entActive(ent, now) || viaAccount);
  const on = (ms: number) => date(ms, { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="pb-24">
      <button type="button" onClick={() => go(back)} className="press -ml-2 min-h-11 pt-2 text-muted">
        ‹ {t("pro.back")}
      </button>
      <h1 className="text-[1.75rem] font-extrabold tracking-tight">{active ? t("pro.youHave") : t("pro.title")}</h1>
      <p className="mt-2 text-muted">{t("pro.lead")}</p>
      <ProFeatures />
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
          from={back}
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
            go(back === "pro" ? "today" : back);
          }}
        />
      )}
    </div>
  );
}
