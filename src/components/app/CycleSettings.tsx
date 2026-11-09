"use client";
import { cycleState, startOfDay } from "@/lib/cycle";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import { useState } from "react";
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
    <Section title="Cycle-aware readiness">
      {!on ? (
        <>
          <p className="text-sm text-muted">Optional. Log the day your period starts and Liftsmith nudges the day&apos;s push or easy call a little around your cycle.</p>
          <Button kind="ghost" className="mt-3 w-full" onClick={() => setConsent(true)}>Set up</Button>
        </>
      ) : (
        <div className="card space-y-3 p-4">
          <p className="text-sm">{state ? `Cycle day ${state.day} of about ${state.length}.` : "Log the first day of your next period to start."}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button kind="ghost" onClick={() => logPeriod(today)}>Period started today</Button>
            <Button kind="ghost" onClick={() => logPeriod(today - DAY)}>Started yesterday</Button>
          </div>
          {confirmOff ? (
            <div className="space-y-2">
              <p className="text-sm text-muted">This turns it off and deletes every period you logged on this device.</p>
              <Button kind="danger" className="w-full" onClick={() => { void forgetCycle(); setConfirmOff(false); }}>Turn off and delete</Button>
              <Button kind="quiet" className="w-full" onClick={() => setConfirmOff(false)}>Cancel</Button>
            </div>
          ) : (
            <Button kind="quiet" className="w-full" onClick={() => setConfirmOff(true)}>Turn off and delete cycle data</Button>
          )}
        </div>
      )}
      <Sheet open={consent} onClose={() => setConsent(false)} title="Cycle-aware readiness">
        <div className="space-y-3 text-sm">
          <p>You log the first day of each period. Liftsmith estimates where you are in your cycle from your own typical length and adjusts the day&apos;s readiness a little. For example, it might suggest going by feel during your period. You can always override the call.</p>
          <p><strong>Your cycle data stays on this phone.</strong> It only leaves it through your own backup and sync if you turn those on. It is never used for analytics or ads, never included in feedback reports, and never shared or sold.</p>
          <p>Research on cycle phase and strength is mixed and varies between people, so the effect is small. This isn&apos;t medical advice, contraception or a fertility tool.</p>
          <p>You can turn it off at any time, which deletes everything you logged.</p>
          <Button className="w-full" onClick={() => { setProfile({ cycle: { enabled: true, consentAt: Date.now() } }); replan(); setConsent(false); }}>I agree, turn it on</Button>
          <Button kind="quiet" className="w-full" onClick={() => setConsent(false)}>Not now</Button>
        </div>
      </Sheet>
    </Section>
  );
}
