"use client";

import { useEffect, useState } from "react";

import type { OwnedGym } from "@/lib/gymClaims";
import { insightStep, MIN_LIFTERS, openHours, type GymInsights, type InsightStep } from "@/lib/gymInsights";
import { decodeGym } from "@/lib/gymShare";
import { loadInsights } from "@/lib/gymVisits";
import { clockTime, inSentence, num, t, weekday } from "@/lib/i18n";
import { parseHours } from "@/lib/openingHours";
import { EQUIPMENT_LABEL } from "@/lib/types";

import { Section, Skeleton } from "./ui";

// Owner insights on the owner's page (#/gymedit/<id>; docs/decisions/gyms.md "Owner insights"): how many lifters
// trained here in the last four weeks, the busy hours, the equipment they used and open problem reports, led by one
// thing to do (AGENTS.md "Action over stats"). Totals and shares only, from anonymous visits (gymInsights.ts).

/** Hours drawn on the chart: 5 AM to 11 PM, where nearly every gym's day is. */
const CHART_HOURS = Array.from({ length: 19 }, (_, i) => i + 5);

function stepText(step: InsightStep): string {
  switch (step.kind) {
    case "issues":
      return t("gym.ins.next.issues", { count: step.count, days: step.days });
    case "wait":
      return t("gym.ins.next.wait", { count: step.more });
    case "unused":
      return t("gym.ins.next.unused", { equipment: inSentence(EQUIPMENT_LABEL[step.equipment]) });
    case "down":
      return t("gym.ins.next.down", { pct: step.pct });
    case "quiet":
      return step.peak
        ? t("gym.ins.next.quiet", {
            quiet: clockTime(step.hour, 0),
            day: weekday(step.peak.day, "long"),
            busy: clockTime(step.peak.hour, 0),
          })
        : t("gym.ins.next.quietOnly", { quiet: clockTime(step.hour, 0) });
    case "keep":
      return t("gym.ins.next.keep");
  }
}

function change(now: number, before: number): string {
  if (!before) return t("gym.ins.new");
  const p = Math.round(((now - before) / before) * 100);
  return p === 0 ? t("gym.ins.same") : p > 0 ? t("gym.ins.up", { pct: p }) : t("gym.ins.down", { pct: -p });
}

export function InsightsSection({ gym }: { gym: OwnedGym }) {
  const [ins, setIns] = useState<GymInsights | null | "loading">("loading");
  useEffect(() => {
    let live = true;
    void loadInsights(gym.id).then((r) => live && setIns(r));
    return () => {
      live = false;
    };
  }, [gym.id]);
  if (ins === "loading")
    return (
      <Section title={t("gym.ins.title")}>
        <Skeleton className="h-40" />
      </Section>
    );
  if (!ins) return null;
  const kit = decodeGym(gym.code)?.equipment ?? [];
  const step = insightStep(ins, kit, openHours(parseHours(gym.hours)));
  const tile = (value: string, label: string, sub?: string) => (
    <div className="card p-3 text-center">
      <p className="display text-2xl">{value}</p>
      <p className="text-xs text-muted">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-faint">{sub}</p>}
    </div>
  );
  const top = Math.max(1, ...CHART_HOURS.map((h) => ins.hours[h] ?? 0));
  return (
    <Section title={t("gym.ins.title")}>
      <p className="card card-tint mb-3 p-3 text-sm" style={{ ["--tint" as string]: "var(--color-accent)" }}>
        {stepText(step)}
      </p>
      {ins.ready ? (
        <div className="grid gap-3">
          <div className="grid grid-cols-3 gap-2">
            {tile(num(ins.lifters), t("gym.ins.lifters"), change(ins.lifters, ins.liftersBefore))}
            {tile(num(ins.workouts), t("gym.ins.workouts"), change(ins.workouts, ins.workoutsBefore))}
            {tile(t("gym.ins.min", { n: ins.minutes }), t("gym.ins.length"))}
          </div>
          <div className="card p-3">
            <p className="text-sm font-semibold">{t("gym.ins.hours")}</p>
            {ins.peak && (
              <p className="text-xs text-muted">
                {t("gym.ins.peak", { day: weekday(ins.peak.day, "long"), time: clockTime(ins.peak.hour, 0) })}
              </p>
            )}
            <div className="mt-3 flex h-20 items-end gap-0.5" role="img" aria-label={t("gym.ins.hoursLabel")}>
              {CHART_HOURS.map((h) => (
                <div
                  key={h}
                  className="flex-1 rounded-t-sm bg-accent"
                  style={{ height: `${Math.max(4, ((ins.hours[h] ?? 0) / top) * 100)}%`, opacity: ins.hours[h] ? 1 : 0.25 }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-faint" aria-hidden>
              <span>{clockTime(5, 0)}</span>
              <span>{clockTime(14, 0)}</span>
              <span>{clockTime(23, 0)}</span>
            </div>
          </div>
          {ins.gear.length > 0 && (
            <div className="card p-3">
              <p className="text-sm font-semibold">{t("gym.ins.gear")}</p>
              <p className="mb-2 text-xs text-muted">{t("gym.ins.gearNote")}</p>
              <ul className="grid gap-1.5 text-sm">
                {ins.gear.slice(0, 8).map((g) => (
                  <li key={g.equipment} className="flex items-center gap-2">
                    <span className="w-32 shrink-0 truncate">{EQUIPMENT_LABEL[g.equipment]}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${g.share}%` }} />
                    </span>
                    <span className="w-12 shrink-0 text-right text-xs text-muted tabular-nums">{t("gym.ins.share", { pct: g.share })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="px-1 text-xs text-muted">{t("gym.ins.soon", { count: ins.lifters, need: MIN_LIFTERS })}</p>
      )}
      <p className="mt-2 px-1 text-xs text-faint">{t("gym.ins.privacy")}</p>
    </Section>
  );
}
