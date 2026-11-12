"use client";

import { useEffect, useMemo } from "react";

import { track } from "@/lib/analytics";
import { useAccount } from "@/lib/auth";
import { proMember, useBilling } from "@/lib/billing";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { doneLines, impactLine, topLine } from "@/lib/trialNotes";
import {
  adjusted,
  daysLeft,
  proImpact,
  trialStage,
  trialWindow,
  type ProImpact,
  type TrialStage,
  type TrialWindow,
} from "@/lib/trialRecap";
import { fmtNum } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { Icon } from "./icons";

// The trial's Pro moments (docs/decisions/money.md "The first two weeks"): what Pro did, on the paywall and at
// the end of each adaptive workout in the trial. The coach's notes (halfway, ending, ended) are in Insights.tsx.

export interface TrialState {
  win: TrialWindow;
  stage: TrialStage;
  impact: ProImpact;
  /** The store turns the trial into a subscription at its end (it wasn't cancelled). */
  renews: boolean;
}

/** The lifter's trial right now, or null: no trial, it was paid for, or billing isn't live here. */
export function useTrial(): TrialState | null {
  const { events, profile } = useApp();
  const { live, ent } = useBilling();
  const sub = useAccount((s) => s.account?.sub ?? null);
  const viaAccount = useAccount((s) => !!s.account?.pro);
  const now = useNow(60_000);
  const hour = Math.floor(now / 3_600_000);
  return useMemo(() => {
    if (!live) return null;
    const store = ent ?? (sub ? { trial: sub.trial, expiresAt: sub.expiresAt } : null);
    const win = trialWindow(profile.pro, store);
    const pro = proMember(now, { live, ent }, viaAccount);
    const stage = trialStage(win, now, { pro, trial: store?.trial ?? false });
    if (!win || !stage) return null;
    return { win, stage, impact: proImpact(events, win), renews: (ent?.willRenew ?? sub?.willRenew) !== false };
    // Recomputed when the log or the store's answer changes, or once an hour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, profile.pro, live, ent, sub, viaAccount, hour]);
}

const SENT = "liftsmith.trialRecap.sent";

/** Records once (per place, stage and trial) that the lifter saw what Pro did, for the admin Funnel tab. */
export function trackRecap(where: "note" | "paywall" | "done", stage: string, win: TrialWindow, i: ProImpact, key = "") {
  const id = `${where}-${stage}-${Math.floor(win.end / 86_400_000)}${key}`;
  try {
    const sent = JSON.parse(localStorage.getItem(SENT) ?? "[]") as string[];
    if (sent.includes(id)) return;
    localStorage.setItem(SENT, JSON.stringify([...sent, id].slice(-40)));
  } catch {}
  track("trial_recap", { where, stage, workouts: i.workouts, raised: i.raised, adjusted: adjusted(i) });
}

/** The paywall's "What Pro did in your trial": three numbers, the sentence behind them and the biggest jump. */
export function TrialRecap() {
  const trial = useTrial();
  const unit = useApp((s) => s.profile.unit);
  const shown = !!trial && trial.impact.workouts > 0;
  useEffect(() => {
    if (shown) trackRecap("paywall", trial.stage, trial.win, trial.impact);
  }, [shown, trial?.stage]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!shown) return null;
  const { impact, stage } = trial;
  const over = stage === "ended";
  const title = over ? t("trl.recap.did") : t("trl.recap.soFar");
  const top = topLine(impact, unit);
  return (
    <section className="card-tint mt-5 p-4" style={{ "--tint": "var(--color-violet)" } as React.CSSProperties} aria-label={title}>
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <Icon name="sparkle" size={16} className="text-violet" />
        {title}
      </h2>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        {(
          [
            ["trl.tile.workouts", impact.workouts],
            ["trl.tile.raised", impact.raised],
            ["trl.tile.adjusted", adjusted(impact)],
          ] as const
        ).map(([k, n]) => (
          <div key={k} className="flex flex-col-reverse rounded-xl bg-surface/60 p-2">
            <dt className="text-xs text-muted">{t(k)}</dt>
            <dd className="display text-2xl">{fmtNum(n)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-muted">{impactLine(impact, over)}</p>
      {top && <p className="mt-1 text-sm">{top}</p>}
    </section>
  );
}

/** The end-of-workout line in the trial: what Pro changed in this workout, and the days left. Nothing outside the trial. */
export function TrialDone({ sessionId }: { sessionId: string }) {
  const trial = useTrial();
  const events = useApp((s) => s.events);
  const now = useNow(60_000);
  const running = !!trial && trial.stage !== "ended";
  const lines = useMemo(() => (running ? doneLines(proImpact(events, trial.win, sessionId)) : []), [running, events, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (running && lines.length) trackRecap("done", trial.stage, trial.win, trial.impact, `-${sessionId}`);
  }, [running, lines.length, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!running || !lines.length) return null;
  return (
    <section
      className="card-tint mt-4 p-4 text-left"
      style={{ "--tint": "var(--color-violet)" } as React.CSSProperties}
      aria-label={t("trl.done.title")}
    >
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <Icon name="sparkle" size={16} className="text-violet" />
        {t("trl.done.title")}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {lines.join(" ")} {t("trl.done.left", { count: daysLeft(trial.win, now) })}
      </p>
    </section>
  );
}
