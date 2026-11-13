"use client";

// Client payments through Stripe Connect (2026-11-13; Melvin: "taking client payments, through Stripe Connect"; server:
// src/server/coachPay.ts, docs/decisions/trainer-mode.md "Payments"). A coach connects their own Stripe account under
// Your clients, sets each client's price on their report (a personal trainer per session, a coach monthly, by default),
// and the client pays on Stripe's page from Your coach. Shown only once the server has Stripe Connect set up.
import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";
import {
  money,
  openStripe,
  pay,
  refreshPayments,
  savePrice,
  startPayments,
  stopMonthly,
  subscribed,
  type ClientPay,
  type OverviewPay,
  type PayAccount,
  type PriceKind,
} from "@/lib/coachPay";
import { date, parseNum, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { trainerError, type Person, type Role } from "@/lib/trainer";

import { BumpField, Button, Chip, Section } from "./ui";

const short = (ms: number) => date(ms, { month: "short", day: "numeric" });
const per = (kind: PriceKind, amount: string) => (kind === "month" ? t("pay.perMonth", { amount }) : t("pay.perSession", { amount }));

// --- The coach's side ---

/** Under Your clients: connect Stripe, finish setting up, or open the Stripe dashboard. */
export function PaySetup({ account, onChange }: { account: PayAccount | null; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [acc, setAcc] = useState(account);
  // Back from Stripe's setup pages: ask whether it's done.
  useEffect(() => {
    if (!account || account.ready) return;
    let live = true;
    refreshPayments()
      .then((a) => {
        if (!live || !a) return;
        setAcc(a);
        if (a.ready) onChange();
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [account, onChange]);
  const run = async (what: () => Promise<void>, detail: string) => {
    setBusy(true);
    try {
      await what();
      track("feature", { name: "trainer", detail });
      haptic("tick");
    } catch (e) {
      oops();
      setNote(trainerError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section title={t("pay.title")} icon="gift">
      <div className="card p-4">
        {!acc ? (
          <>
            <p className="text-sm text-muted">{t("pay.setupHint")}</p>
            <Button className="mt-3 w-full" disabled={busy} onClick={() => void run(startPayments, "payOnboard")}>
              {t("pay.setup")}
            </Button>
          </>
        ) : !acc.ready ? (
          <>
            <p className="text-sm">{t("pay.unfinished")}</p>
            <Button className="mt-3 w-full" disabled={busy} onClick={() => void run(startPayments, "payOnboard")}>
              {t("pay.finish")}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm">{t("pay.ready", { currency: acc.currency.toUpperCase() })}</p>
            <Button kind="ghost" className="mt-3 w-full" disabled={busy} onClick={() => void run(openStripe, "payDashboard")}>
              {t("pay.dashboard")}
            </Button>
          </>
        )}
        <p className="mt-3 text-xs text-muted">{t("pay.fine")}</p>
        {note && (
          <p className="mt-2 text-sm text-muted" role="status">
            {note}
          </p>
        )}
      </div>
    </Section>
  );
}

/** On a client's report: what they pay, their monthly plan and recent payments. */
export function ClientPayments({
  clientId,
  pay: p,
  role,
  onChange,
}: {
  clientId: string;
  pay: ClientPay;
  role: Role | null;
  onChange: () => void;
}) {
  const ready = !!p.account?.ready;
  const currency = p.price?.currency ?? p.account?.currency ?? "cad";
  const [kind, setKind] = useState<PriceKind>(p.price?.kind ?? (role === "coach" ? "month" : "session"));
  const [amount, setAmount] = useState(p.price ? String(p.price.amount) : "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const n = parseNum(amount);
  const valid = Number.isFinite(n) && n >= 1 && n <= 10_000;
  const changed = !p.price || p.price.amount !== n || p.price.kind !== kind;
  const save = async (clear: boolean) => {
    setBusy(true);
    try {
      const r = await savePrice(clientId, clear ? null : n, kind);
      if (!r) setAmount("");
      haptic("success");
      track("feature", { name: "trainer", detail: r ? "price" : "unprice" });
      setNote(r ? t("pay.priceSaved") : t("pay.priceCleared"));
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section title={t("pay.title")} icon="gift">
      <div className="card p-4">
        {!ready ? (
          <p className="text-sm text-muted">{t("pay.setupFirst")}</p>
        ) : (
          <>
            <p id="pay-kind" className="text-sm font-medium">
              {t("pay.how")}
            </p>
            <div className="mt-1 flex flex-wrap gap-2" role="group" aria-labelledby="pay-kind">
              <Chip active={kind === "session"} onClick={() => setKind("session")}>
                {t("pay.kind.session")}
              </Chip>
              <Chip active={kind === "month"} onClick={() => setKind("month")}>
                {t("pay.kind.month")}
              </Chip>
            </div>
            <label htmlFor="pay-amount" className="mt-3 block text-sm font-medium">
              {t("pay.amount", { currency: currency.toUpperCase() })}
            </label>
            <BumpField
              id="pay-amount"
              label={t("pay.amount", { currency: currency.toUpperCase() })}
              value={amount}
              onChange={setAmount}
              step={5}
              start={kind === "month" ? 200 : 60}
              min={1}
              max={10_000}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button className="flex-1" disabled={busy || !valid || !changed} onClick={() => void save(false)}>
                {t("pay.save")}
              </Button>
              {p.price && (
                <Button kind="ghost" disabled={busy} onClick={() => void save(true)}>
                  {t("pay.clear")}
                </Button>
              )}
            </div>
          </>
        )}
        {p.sub && subscribed(p.sub) && (
          <p className={`mt-3 text-sm ${p.sub.status === "past_due" ? "text-warn" : "text-good"}`}>
            {p.sub.status === "past_due"
              ? t("pay.subFailing")
              : p.sub.ending && p.sub.until
                ? t("pay.subEnding", { date: short(p.sub.until) })
                : p.sub.until
                  ? t("pay.subActive", { date: short(p.sub.until) })
                  : t("pay.subStarted")}
          </p>
        )}
        {note && (
          <p className="mt-2 text-sm text-muted" role="status">
            {note}
          </p>
        )}
      </div>
      {p.payments.length > 0 && (
        <ul className="card mt-2 divide-y divide-line">
          {p.payments.map((x) => (
            <li key={x.id} className="flex items-baseline justify-between gap-2 px-4 py-3">
              <span className="text-sm">{date(x.at, { month: "short", day: "numeric", year: "numeric" })}</span>
              <span className="num font-medium">{per(x.kind, money(x.amount, x.currency))}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

// --- The client's side: free ---

/** Under Your coach: pay a session, start or stop a monthly plan. Paying opens Stripe's page in the browser. */
export function YourPayments({ pay: p, coaches, onChange }: { pay: OverviewPay; coaches: Person[]; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  if (!p.prices.length) return null;
  const who = (id: string) => coaches.find((c) => c.id === id)?.name || t("trn.noName");
  const run = async (what: () => Promise<void>, done: string | null, detail: string) => {
    setBusy(true);
    try {
      await what();
      haptic("tick");
      track("feature", { name: "trainer", detail });
      if (done) setNote(done);
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mb-3">
      <p className="mb-2 px-1 text-sm font-semibold">{t("pay.yours")}</p>
      <ul className="space-y-2">
        {p.prices.map((x) => {
          const price = money(x.amount, x.currency);
          const on = subscribed(x.sub);
          return (
            <li key={x.coachId} className="card p-4">
              <p className="font-semibold">{t("pay.with", { name: who(x.coachId) })}</p>
              <p className="num text-sm text-muted">{per(x.kind, price)}</p>
              {x.kind === "month" && on && x.sub ? (
                <>
                  <p className={`mt-2 text-sm ${x.sub.status === "past_due" ? "text-warn" : "text-good"}`}>
                    {x.sub.status === "past_due"
                      ? t("pay.yourFailing")
                      : x.sub.ending && x.sub.until
                        ? t("pay.subEnding", { date: short(x.sub.until) })
                        : x.sub.until
                          ? t("pay.subActive", { date: short(x.sub.until) })
                          : t("pay.subStarted")}
                  </p>
                  {!x.sub.ending && (
                    <Button
                      kind="quiet"
                      disabled={busy}
                      className="mt-1 !px-0 text-sm"
                      onClick={() => void run(() => stopMonthly(x.coachId), t("pay.stopped"), "payStop")}
                    >
                      {t("pay.stop")}
                    </Button>
                  )}
                </>
              ) : (
                <Button className="mt-3 w-full" disabled={busy} onClick={() => void run(() => pay(x.coachId), null, "payCheckout")}>
                  {x.kind === "month" ? t("pay.startMonthly", { amount: price }) : t("pay.paySession", { amount: price })}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 px-1 text-xs text-muted">{t("pay.onStripe")}</p>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </div>
  );
}
