"use client";

import { useState } from "react";

import { exercise } from "@/lib/exercises";
import { num, t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { ACTIVITY, currentTdee, parseBodyFat, tdeeHistory } from "@/lib/tdee";
import { MUSCLE_LABEL, MUSCLES } from "@/lib/types";
import { fmtNum, fmtVolume, fromKg, toKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { AchievementRow, useGame } from "./Achievements";
import { BodyFatField } from "./BodyFatField";
import { GoalsCard } from "./Coach";
import { StrengthCard, TonnageCard } from "./Extras";
import { ago } from "./format";
import { HistoryCalendar } from "./History";
import { Icon, type IconName } from "./icons";
import { CoachNotes } from "./Insights";
import { DotsCard, OneRmSection } from "./OneRepMax";
import { go } from "./router";
import { HUE } from "./theme";
import { BumpField, Button, EmptyState, ScreenHeader, Section, StatTile } from "./ui";

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
  const tiles: [string, string, string, IconName, string][] = [
    ["workouts", t("progress.workouts"), num(stats.sessions.length), "dumbbell", HUE.accent],
    ["streak", t("progress.streak"), num(streak.weeks), "flame", HUE.ember],
    ["sets", t("progress.sets"), num(stats.totalSets), "layers", HUE.violet],
    ["volume", t("progress.volume"), fmtVolume(stats.totalVolume, unit), "progress", HUE.cyan],
  ];
  return (
    <div className="pb-2">
      <ScreenHeader title={t("progress.title")} />
      <CoachNotes title={t("progress.next")} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {tiles.map(([k, label, v, icon, hue]) => (
          <StatTile key={k} label={label} value={v} icon={icon} tint={hue} info={k === "volume" ? "volume" : undefined} />
        ))}
      </div>
      <TonnageCard />
      <StrengthCard />

      <GoalsCard />

      <Section title={t("progress.weekSets")} icon="target" info="weeklySets">
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
      </Section>

      <BodyweightCard />
      <TdeeCard />

      <OneRmSection />
      <DotsCard />

      <Section title={t("progress.prs")} icon="trophy">
        <ul className="card divide-y divide-line">
          {stats.prs.slice(0, 8).map((p) => (
            <li key={p.at + p.exerciseId} className="flex justify-between px-4 py-3">
              <span className="flex items-center gap-2 font-medium">
                <span className="text-gold">
                  <Icon name="trophy" size={16} />
                </span>
                {exercise(p.exerciseId).name}
              </span>
              <span className="num text-muted">
                {fmtNum(fromKg(p.weight, unit))} {unit} × {p.reps} · {ago(p.at, now)}
              </span>
            </li>
          ))}
          {!stats.prs.length && (
            <li>
              <EmptyState icon="trophy" tint={HUE.gold} title={t("progress.noPrs")} body={t("progress.noPrs.body")} />
            </li>
          )}
        </ul>
      </Section>

      <Section
        title={t("progress.achievements", { earned: g.badges.earned, total: g.badges.total })}
        right={
          <button type="button" onClick={() => go("achievements")} className="press text-sm text-accent">
            {t("progress.seeAll")}
          </button>
        }
      >
        <ul className="card divide-y divide-line">
          {g.nearest.map((a) => (
            <AchievementRow key={a.id} a={a} />
          ))}
          {!g.nearest.length && <li className="px-4 py-3 text-muted">{t("progress.noBadges")}</li>}
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
      </Section>
    </div>
  );
}

/** TDEE now, with its history as a sparkline. Opens Tools › TDEE. */
function TdeeCard() {
  const { events, stats, profile } = useApp();
  const now = useNow(60_000);
  const cur = currentTdee(events, stats.sessions, profile, now);
  const hist = tdeeHistory(events);
  return (
    <Section
      title={t("progress.tdee")}
      icon="flame"
      right={
        <button type="button" onClick={() => go("tools")} className="press text-sm text-accent">
          {t("progress.allTools")}
        </button>
      }
    >
      <button
        type="button"
        onClick={() => go("tools", "tdee")}
        className="press card flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div>
          <div className="num text-2xl font-bold">
            {cur.result ? t("progress.kcal", { kcal: cur.result.tdee }) : t("progress.tdee.none")}
          </div>
          <div className="text-sm text-muted">
            {cur.result
              ? cur.activity.source === "manual"
                ? ACTIVITY[cur.activity.activity].label
                : t("progress.tdee.auto", { level: ACTIVITY[cur.activity.activity].label })
              : t("progress.tdee.add")}
          </div>
        </div>
        <Spark points={hist.map((e) => e.kcal)} empty={t("progress.tdee.spark")} />
      </button>
    </Section>
  );
}

/** Body weight log: one input, a trend line and the change over the last month. */
function BodyweightCard() {
  const { events, profile, logBodyweight } = useApp();
  const unit = profile.unit;
  const log = events.filter((e) => e.type === "bodyweight").sort((a, b) => a.at - b.at);
  const [value, setValue] = useState("");
  const [fat, setFat] = useState("");
  const [fatError, setFatError] = useState(false);
  const last = log.at(-1);
  const monthAgo = [...log].reverse().find((e) => !!last && e.type === "bodyweight" && e.at <= last.at - 28 * 86400_000);
  const kg = (e: (typeof log)[number] | undefined) => (e?.type === "bodyweight" ? e.kg : undefined);
  const change = kg(last) !== undefined && kg(monthAgo) !== undefined ? fromKg(kg(last)! - kg(monthAgo)!, unit) : undefined;
  const lastFat = [...log].reverse().find((e) => e.type === "bodyweight" && e.bodyFat !== undefined);
  // Weight, body fat or both: body fat on its own is logged with the last weight, so the trend lines stay whole.
  const submit = () => {
    const n = Number(value);
    const pct = parseBodyFat(fat);
    setFatError(fat.trim() !== "" && pct === undefined);
    if (fat.trim() !== "" && pct === undefined) return;
    if (!(n > 0) && pct === undefined) return;
    logBodyweight(n > 0 ? toKg(n, unit) : (kg(last) ?? profile.bodyweight), pct);
    setValue("");
    setFat("");
  };
  return (
    <Section title={t("progress.bw")} icon="heart">
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="num text-2xl font-bold">
              {fmtNum(Math.round(fromKg(kg(last) ?? profile.bodyweight, unit) * 10) / 10)} {unit}
            </div>
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
          <Spark points={log.map((e) => (e.type === "bodyweight" ? e.kg : 0))} empty={t("progress.bw.spark")} />
        </div>
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <BumpField
            label={t("progress.bw.label", { unit })}
            placeholder={t("progress.bw.placeholder", { unit })}
            value={value}
            onChange={setValue}
            step={unit === "lb" ? 0.2 : 0.1}
            start={Math.round(fromKg(kg(last) ?? profile.bodyweight, unit) * 10) / 10}
            min={1}
          />
          <div className="flex flex-wrap items-end gap-2">
            <BodyFatField id="progress-bf" value={fat} onChange={setFat} />
            <Button kind="ghost" label={t("progress.bw.logLabel")} onClick={submit}>
              {t("progress.bw.log")}
            </Button>
          </div>
          {fatError && (
            <p role="alert" className="text-sm text-bad">
              {t("body.fat.range")}
            </p>
          )}
        </form>
      </div>
    </Section>
  );
}
