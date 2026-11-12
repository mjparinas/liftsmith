"use client";

import { useState } from "react";

import { Swatch } from "@/components/BodyMap";
import { Info } from "@/components/Info";
import { blockWeek, weekStart } from "@/lib/block";
import { can } from "@/lib/entitlements";
import { weeklySets } from "@/lib/generator";
import { t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { bandOf, recovery } from "@/lib/recovery";
import { useApp } from "@/lib/store";
import { MUSCLE_LABEL, MUSCLES, type Muscle } from "@/lib/types";
import { useNow } from "@/lib/useNow";

import { HealthTwin } from "./HealthTwin";
import { RecoveryMap } from "./RecoveryMap";
import { go } from "./router";
import { Button, EmptyState, ScreenHeader, Section } from "./ui";

const VIEW_KEY = "liftsmith.body.view";
type BodyView = "muscles" | "health";
const savedView = (): BodyView => {
  try {
    return localStorage.getItem(VIEW_KEY) === "health" ? "health" : "muscles";
  } catch {
    return "muscles";
  }
};

/**
 * The Body tab (health twin, 2026-11-09): one figure, two views. Muscles is the recovery map (Pro);
 * Health is the health twin (free). Without Pro it opens on Health.
 */
export function Recovery() {
  const [view, setView] = useState<BodyView>(() => (can("recoveryMap") ? savedView() : "health"));
  const pick = (v: BodyView) => {
    haptic("select");
    sound.tick();
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  };
  return (
    <div className="pb-2">
      <ScreenHeader title={t("body.title")} />
      <div className="mt-3 flex rounded-full border border-line bg-surface p-1" role="group" aria-label={t("body.views")}>
        {(["muscles", "health"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => pick(v)}
            data-testid={`body-${v}`}
            className={`press min-h-11 flex-1 rounded-full text-sm font-semibold ${view === v ? "bg-raised text-ink shadow-[inset_0_0_0_1px_var(--color-line)]" : "text-muted"}`}
          >
            {t(v === "muscles" ? "body.muscles" : "body.health")}
          </button>
        ))}
      </div>
      {view === "health" ? <HealthTwin /> : <Muscles />}
    </div>
  );
}

function Muscles() {
  const { events, profile } = useApp();
  const now = useNow();
  const rec = recovery(events, now);
  const wk = blockWeek(profile, now);
  const done = weeklySets(events, weekStart(profile, now));
  const list = [...MUSCLES].sort((a, b) => rec[a] - rec[b]);
  const [picked, setPicked] = useState<Muscle | null>(null);
  if (!can("recoveryMap")) {
    return (
      <div className="mt-4">
        <EmptyState
          icon="lock"
          title={t("recovery.locked.title")}
          body={t("recovery.locked.body")}
          action={<Button onClick={() => go("pro", "recovery")}>{t("pro.settings.see")}</Button>}
        />
      </div>
    );
  }
  return (
    // Desktop layout: the map on the left stays in view while the muscle list scrolls beside it.
    <div className="desk:grid desk:grid-cols-2 desk:items-start desk:gap-x-6">
      {/* The "i" sits beside the paragraph rather than in its flow, so it never drops onto a line of its own. */}
      <div className="mt-3 flex items-start text-muted desk:col-span-2">
        <p className="min-w-0 flex-1">
          {t("recovery.lead")} {t("map.pick")}
        </p>
        <Info term="recovery" className="-mr-3 mt-0 shrink-0" />
      </div>
      <div className="card mt-4 p-4 desk:sticky desk:top-6">
        <RecoveryMap rec={rec} chips={false} selected={picked} onSelect={setPicked} />
      </div>
      <Section title={t("recovery.muscles", { goal: wk.setsPerMuscle })} icon="target">
        <ul className="card divide-y divide-line/70 overflow-hidden">
          {list.map((m) => {
            const b = bandOf(rec[m]);
            const pct = Math.min(100, (done[m] / wk.setsPerMuscle) * 100);
            return (
              <li key={m}>
                <button
                  type="button"
                  aria-pressed={picked === m}
                  onClick={() => {
                    setPicked(picked === m ? null : m);
                    window.scrollTo?.({ top: 0, behavior: "smooth" });
                  }}
                  className={`press flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 text-left ${picked === m ? "picked-row" : ""}`}
                >
                  <span title={b.label} className="flex">
                    <Swatch band={b.band} colour={b.colour} />
                    <span className="sr-only">{b.label},</span>
                  </span>
                  <span className={`w-28 shrink-0 ${picked === m ? "font-bold text-ink" : "font-medium"}`}>{MUSCLE_LABEL[m]}</span>
                  <div
                    className="h-2 min-w-20 flex-1 overflow-hidden rounded-full bg-raised"
                    title={t("recovery.setsOf", { done: Math.round(done[m]), goal: wk.setsPerMuscle })}
                  >
                    <div
                      className={`h-full rounded-full ${pct >= 100 ? "bg-mint" : "bg-gradient-to-r from-accent to-accent-2"}`}
                      style={{ width: `${pct}%`, transition: "width 600ms var(--ease-out-expo)" }}
                    />
                  </div>
                  <span className="num ml-auto min-w-20 shrink-0 whitespace-nowrap text-right text-sm text-muted">
                    {rec[m]}% · {Math.round(done[m])}/{wk.setsPerMuscle}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}
