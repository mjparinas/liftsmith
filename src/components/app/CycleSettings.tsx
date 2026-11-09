"use client";
import { cycleState, startOfDay } from "@/lib/cycle";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { Button, Section, Sheet } from "./ui";

const DAY = 86_400_000;

/** Settings › Cycle-aware readiness: its own consent, one-tap period logging, and full deletion. */
export function CycleSettings() {
  const { profile, setProfile, events, logPeriod, forgetCycle, replan } = useApp();
  const [consent, setConsent] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const now = useNow(60_000);
  const on = !!profile.cycle?.enabled;
  const state = on ? cycleState(events, now) : null;
  const today = startOfDay(now);

  return (
    <Section title={t("cycle.title")}>
      {!on ? (
        <>
          <p className="text-sm text-muted">{t("cycle.intro")}</p>
          <Button kind="ghost" className="mt-3 w-full" onClick={() => setConsent(true)}>{t("cycle.setUp")}</Button>
        </>
      ) : (
        <div className="card space-y-3 p-4">
          <p className="text-sm">{state ? t("cycle.day", { day: state.day, length: state.length }) : t("cycle.logFirst")}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button kind="ghost" onClick={() => logPeriod(today)}>{t("cycle.today")}</Button>
            <Button kind="ghost" onClick={() => logPeriod(today - DAY)}>{t("cycle.yesterday")}</Button>
          </div>
          {confirmOff ? (
            <div className="space-y-2">
              <p className="text-sm text-muted">{t("cycle.offNote")}</p>
              <Button kind="danger" className="w-full" onClick={() => { void forgetCycle(); setConfirmOff(false); }}>{t("cycle.offConfirm")}</Button>
              <Button kind="quiet" className="w-full" onClick={() => setConfirmOff(false)}>{t("cycle.cancel")}</Button>
            </div>
          ) : (
            <Button kind="quiet" className="w-full" onClick={() => setConfirmOff(true)}>{t("cycle.off")}</Button>
          )}
        </div>
      )}
      <Sheet open={consent} onClose={() => setConsent(false)} title={t("cycle.title")}>
        <div className="space-y-3 text-sm">
          <p>{t("cycle.consent1")}</p>
          <p><strong>{t("cycle.consent2a")}</strong> {t("cycle.consent2b")}</p>
          <p>{t("cycle.consent3")}</p>
          <p>{t("cycle.consent4")}</p>
          <Button className="w-full" onClick={() => { setProfile({ cycle: { enabled: true, consentAt: Date.now() } }); replan(); setConsent(false); }}>{t("cycle.agree")}</Button>
          <Button kind="quiet" className="w-full" onClick={() => setConsent(false)}>{t("cycle.notNow")}</Button>
        </div>
      </Sheet>
    </Section>
  );
}
