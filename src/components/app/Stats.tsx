"use client";

import { useEffect } from "react";

import { can } from "@/lib/entitlements";
import { exercise } from "@/lib/exercises";
import { num, t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { currentKg } from "@/lib/tdee";
import { MUSCLE_LABEL, MUSCLES } from "@/lib/types";
import { fmtBodyweight, fmtNum, fromKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { useGame } from "./Achievements";
import { GoalsCard } from "./Coach";
import { RecapAndPhotos, StrengthCard } from "./Extras";
import { ago } from "./format";
import { HistoryCalendar } from "./History";
import { Icon, type IconName } from "./icons";
import { CoachNotes } from "./Insights";
import { OneRmSection } from "./OneRepMax";
import { ProLocked } from "./ProLocked";
import { go, useRoute } from "./router";
import { HUE } from "./theme";
import { Button, EmptyState, ScreenHeader, Section, StatTile } from "./ui";
import { WeighInForm } from "./WeighIn";

function Spark({ points, empty }: { points: number[]; empty?: string }) {
  if (points.length < 2) return <div className="h-10 text-xs text-faint">{empty ?? t("progress.spark.empty")}</div>;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const w = 120;
  const h = 36;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * w},${h - ((p - min) / Math.max(1, max - min)) * (h - 4) - 2}`)
    .join(" ");
  return (
    <svg width={w} height={h} aria-hidden>
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--grad-a)", stopOpacity: 0.35 }} />
          <stop offset="1" style={{ stopColor: "var(--grad-a)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#spark)" stroke="none" />
      <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Stats() {
  const { stats, profile } = useApp();
  const now = useNow();
  const unit = profile.unit;
  const g = useGame();
  const streak = g.streak;
  const thisWeek = stats.weeklyMuscleSets.at(-1)!;
  // #/stats/strength (the fitness age card's "See strength score") lands on the strength score, not the top, and
  // #/stats/bodyweight (Settings › Body and units › Body weight) on the weigh-in.
  const { arg } = useRoute();
  useEffect(() => {
    const id = arg === "strength" ? "strength-score" : arg === "bodyweight" ? "bodyweight" : undefined;
    if (id) document.getElementById(id)?.scrollIntoView?.({ block: "start" });
  }, [arg]);
  const tiles: [string, string, string, IconName, string][] = [
    ["workouts", t("progress.workouts"), num(stats.sessions.length), "dumbbell", HUE.accent],
    // Before the first goal week is met, a flat "0" streak reads like a telling-off: show this week's days toward it.
    streak.weeks === 0 && streak.thisWeek > 0
      ? [
          "streak",
          t("progress.thisWeek"),
          t("progress.ofGoal", { n: streak.thisWeek, goal: Math.max(1, profile.daysPerWeek) }),
          "flame",
          HUE.ember,
        ]
      : ["streak", t("progress.streak"), num(streak.weeks), "flame", HUE.ember],
  ];
  return (
    // Desktop layout: the cards flow into two columns (.desk-cols); the header, next steps and the totals run across.
    <div className="desk-cols pb-2">
      <ScreenHeader className="desk-span" title={t("progress.title")} />
      <div className="desk-span">
        <CoachNotes title={t("progress.next")} />
      </div>
      {/* Simplified (UX audit, 2026-11-13, Melvin: "simplify, combine some stats and maybe hide others"): two
          tiles that say whether the lifter is showing up, then the recap and photos. Total sets, total volume and
          the "lifted in total" comparison went; DOTS and the calorie estimate live in Tools; badges on Awards. */}
      <div className="desk-span mt-4 grid grid-cols-2 gap-3">
        {tiles.map(([k, label, v, icon, hue]) => (
          <StatTile key={k} label={label} value={v} icon={icon} tint={hue} />
        ))}
      </div>
      <RecapAndPhotos />
      <div id="strength-score" className="scroll-mt-14">
        <StrengthCard />
      </div>

      <GoalsCard />

      <Section title={t("progress.weekSets")} icon="target" info="weeklySets">
        {/* Advanced stats are Pro (Melvin, 2026-11-12): free lifters see the card, marked Pro. */}
        {!can("advancedStats") ? (
          <ProLocked from="stats" title={t("pro.ft.advancedStats")} body={t("progress.weekSets.lock")} />
        ) : (
          <div className="card p-4">
            <ul className="space-y-2">
              {MUSCLES.filter((m) => thisWeek.sets[m] > 0)
                .sort((a, b) => thisWeek.sets[b] - thisWeek.sets[a])
                .map((m) => (
                  <li key={m} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 text-muted">{MUSCLE_LABEL[m]}</span>
                    <div className="relative h-2.5 flex-1 rounded-full bg-raised">
                      <div
                        className="absolute inset-y-0 rounded-full bg-good/15"
                        style={{ left: "50%", width: "50%" }}
                        title={t("progress.band")}
                      />
                      <div
                        className="relative h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                        style={{ width: `${Math.min(100, (thisWeek.sets[m] / 20) * 100)}%` }}
                      />
                    </div>
                    <span className="num w-8 text-right">{fmtNum(thisWeek.sets[m])}</span>
                  </li>
                ))}
              {!MUSCLES.some((m) => thisWeek.sets[m] > 0) && (
                <li>
                  <EmptyState icon="target" title={t("progress.noSets")} body={t("progress.noSets.body")} />
                </li>
              )}
            </ul>
            <p className="mt-3 text-xs text-faint">{t("progress.bandNote")}</p>
          </div>
        )}
      </Section>

      <OneRmSection />

      <div id="bodyweight" className="scroll-mt-14">
        <BodyweightCard />
      </div>

      <Section
        title={t("progress.prs")}
        icon="trophy"
        right={
          // Every exercise's own page with its stats (ExerciseLibrary.tsx).
          <button type="button" onClick={() => go("exercises")} className="press min-h-11 text-sm text-accent">
            {t("lift.lib.open")} ›
          </button>
        }
      >
        <ul className="card divide-y divide-line">
          {stats.prs.slice(0, 8).map((p) => (
            <li key={p.at + p.exerciseId}>
              <button
                type="button"
                onClick={() => go("exercise", p.exerciseId)}
                className="press flex w-full flex-wrap items-center justify-between gap-x-3 px-4 py-3 text-left"
              >
                <span className="flex items-center gap-2 font-medium">
                  <span className="text-gold">
                    <Icon name="trophy" size={16} />
                  </span>
                  {exercise(p.exerciseId).name}
                </span>
                <span className="num text-muted">
                  {fmtNum(fromKg(p.weight, unit))} {unit} × {p.reps} · {ago(p.at, now)}{" "}
                  <span className="text-accent" aria-hidden>
                    ›
                  </span>
                </span>
              </button>
            </li>
          ))}
          {!stats.prs.length && (
            <li>
              <EmptyState icon="trophy" tint={HUE.gold} title={t("progress.noPrs")} body={t("progress.noPrs.body")} />
            </li>
          )}
        </ul>
      </Section>

      <Section title={t("progress.history")} icon="calendar">
        {stats.sessions.length ? (
          <HistoryCalendar />
        ) : (
          <div className="card">
            <EmptyState
              icon="calendar"
              mascot="happy"
              title={t("progress.noWorkouts")}
              body={t("progress.noWorkouts.body")}
              action={
                <Button icon="play" onClick={() => go("today")}>
                  {t("progress.plan")}
                </Button>
              }
            />
          </div>
        )}
        {/* Trained without the phone? Add it after the fact (LogPast.tsx; moved here from the /me/ dashboard). */}
        <Button kind="ghost" className="mt-3 w-full" icon="plus" onClick={() => go("log")}>
          {t("past.title")}
        </Button>
      </Section>
      {/* The calculators (TDEE, DOTS and the rest) are one tap away; on desktop the sidebar has Tools. */}
      <Button kind="ghost" className="mt-3 w-full desk:hidden" icon="bolt" onClick={() => go("tools")}>
        {t("progress.allTools")}
      </Button>
    </div>
  );
}

/** Body weight log: one input, a trend line and the change over the last month. */
function BodyweightCard() {
  const { events, profile } = useApp();
  const unit = profile.unit;
  const log = events.filter((e) => e.type === "bodyweight").sort((a, b) => a.at - b.at);
  const last = log.at(-1);
  const monthAgo = [...log].reverse().find((e) => !!last && e.type === "bodyweight" && e.at <= last.at - 28 * 86400_000);
  const kg = (e: (typeof log)[number] | undefined) => (e?.type === "bodyweight" ? e.kg : undefined);
  const change = kg(last) !== undefined && kg(monthAgo) !== undefined ? fromKg(kg(last)! - kg(monthAgo)!, unit) : undefined;
  const lastFat = [...log].reverse().find((e) => e.type === "bodyweight" && e.bodyFat !== undefined);
  return (
    <Section title={t("progress.bw")} icon="heart">
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            {/* Before the first weigh-in the number would only be the setup answer, beside "No weigh-ins yet". */}
            {log.length > 0 && <div className="num text-2xl font-bold">{fmtBodyweight(currentKg(events, profile), unit)}</div>}
            <div className="text-sm text-muted">
              {change !== undefined
                ? t("progress.bw.change", { change: `${change >= 0 ? "+" : ""}${fmtNum(Math.round(change * 10) / 10)}`, unit })
                : log.length
                  ? t("progress.bw.count", { count: log.length })
                  : t("progress.bw.none")}
            </div>
            {lastFat?.type === "bodyweight" && lastFat.bodyFat !== undefined && (
              <div className="num text-sm text-muted">{t("body.fat.last", { pct: fmtNum(Math.round(lastFat.bodyFat * 10) / 10) })}</div>
            )}
          </div>
          {log.length > 0 && <Spark points={log.map((e) => (e.type === "bodyweight" ? e.kg : 0))} empty={t("progress.bw.spark")} />}
        </div>
        <WeighInForm id="progress" className="mt-3" />
      </div>
    </Section>
  );
}
