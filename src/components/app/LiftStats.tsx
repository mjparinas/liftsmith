"use client";

import { useMemo, useState } from "react";

import { date, num, t } from "@/lib/i18n";
import type { LiftSession } from "@/lib/liftPage";
import {
  DEFAULT_RANGE,
  liftSeries,
  metricsFor,
  seriesChange,
  STAT_RANGES,
  type LiftComparison,
  type LiftTotals,
  type StatMetric,
  type StatPoint,
  type StatRange,
} from "@/lib/liftStats";
import { fmtTonnage, tonnage } from "@/lib/moments";
import type { OneRm } from "@/lib/onerm";
import type { Exercise, Unit } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";

import { StatsNeeded } from "./BodyStats";
import { clock } from "./format";
import { HUE } from "./theme";
import { Chip, Section, StatTile } from "./ui";

// The exercise page's stats (Melvin, 2026-11-13): lifetime totals with the estimated max, a chart over time
// with week to year ranges (three months by default), and how the lift compares with published strength
// standards for the lifter's body weight, age and sex. The maths is in src/lib/liftStats.ts; everything is
// drawn from the event log on the device. The chart is plain SVG and HTML, so it looks the same in Android's
// WebView, iOS's WKWebView and every browser, with no chart library.

const kg = (v: number, unit: Unit) => `${fmtNum(Math.round(fromKg(v, unit)))} ${unit}`;

function fmtValue(metric: StatMetric, v: number, unit: Unit): string {
  switch (metric) {
    case "e1rm":
      return kg(v, unit);
    case "top":
      return `${fmtNum(Math.round(fromKg(v, unit) * 10) / 10)} ${unit}`;
    case "volume":
      return fmtTonnage(v, unit);
    case "reps":
      return num(v);
    case "time":
      return clock(v);
  }
}

/** Sets, sessions, lifetime volume (or time) and the estimated max, then one fun comparison. Free for everyone. */
export function LiftTotalsCard({
  totals,
  max,
  unit,
  kind,
}: {
  totals: LiftTotals;
  max: OneRm | null;
  unit: Unit;
  kind: "loaded" | "bodyweight" | "timed";
}) {
  if (!totals.sets) return null;
  const ton = kind !== "timed" && totals.volumeKg > 0 ? tonnage(totals.volumeKg).last : null;
  return (
    <Section title={t("lift.glance")} icon="dumbbell">
      <div className="grid grid-cols-2 gap-3" data-testid="lift-totals">
        <StatTile label={t("lift.tile.sets")} value={num(totals.sets)} icon="layers" tint={HUE.accent} />
        <StatTile label={t("lift.tile.sessions")} value={num(totals.sessions)} icon="calendar" tint={HUE.cyan} />
        {kind === "timed" && <StatTile label={t("lift.tile.time")} value={clock(totals.seconds)} icon="clock" tint={HUE.mint} />}
        {kind !== "timed" && totals.volumeKg > 0 && (
          <StatTile label={t("lift.tile.volume")} value={fmtTonnage(totals.volumeKg, unit)} icon="bolt" tint={HUE.ember} info="volume" />
        )}
        {kind !== "timed" && (kind === "bodyweight" || !max) && (
          <StatTile label={t("lift.tile.reps")} value={num(totals.reps)} icon="repeat" tint={HUE.mint} />
        )}
        {max && <StatTile label={t("lift.tile.e1rm")} value={kg(max.e1rm, unit)} icon="target" tint={HUE.violet} info="e1rm" />}
      </div>
      <p className="mt-2 text-sm text-muted">
        {totals.firstAt !== null && t("lift.since", { date: date(totals.firstAt, { month: "long", year: "numeric" }) })}
        {ton && ` ${t("lift.ton", { name: ton.name })}`}
      </p>
    </Section>
  );
}

const RANGE_LABEL: Record<StatRange, () => string> = {
  "1w": () => t("lift.range.1w"),
  "1m": () => t("lift.range.1m"),
  "3m": () => t("lift.range.3m"),
  "6m": () => t("lift.range.6m"),
  "1y": () => t("lift.range.1y"),
};

const METRIC_LABEL: Record<StatMetric, () => string> = {
  e1rm: () => t("lift.metric.e1rm"),
  volume: () => t("lift.metric.volume"),
  top: () => t("lift.metric.top"),
  reps: () => t("lift.metric.reps"),
  time: () => t("lift.metric.time"),
};

/** The chart with its range and metric chips. Advanced stats (Pro), so ExercisePage shows it inside the trend card. */
export function LiftChart({
  ex,
  sessions,
  max,
  unit,
  now,
}: {
  ex: Exercise;
  sessions: readonly LiftSession[];
  max: OneRm | null;
  unit: Unit;
  now: number;
}) {
  const metrics = metricsFor(ex);
  const [metric, setMetric] = useState<StatMetric>(metrics[0]!);
  const [range, setRange] = useState<StatRange>(DEFAULT_RANGE);
  const points = useMemo(() => liftSeries(sessions, metric, range, now, max), [sessions, metric, range, now, max]);
  const change = seriesChange(points);
  return (
    <div className="mt-4" data-testid="lift-chart">
      {metrics.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("lift.metric.group")}>
          {metrics.map((m) => (
            <Chip key={m} active={metric === m} onClick={() => setMetric(m)}>
              {METRIC_LABEL[m]()}
            </Chip>
          ))}
        </div>
      )}
      <Plot points={points} metric={metric} unit={unit} range={range} now={now} />
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={t("lift.range.group")}>
        {STAT_RANGES.map((r) => (
          <Chip key={r} active={range === r} onClick={() => setRange(r)}>
            {RANGE_LABEL[r]()}
          </Chip>
        ))}
      </div>
      {change !== null && (
        <p className="mt-2 text-sm text-muted" data-testid="lift-change">
          {change >= 1 ? t("lift.chg.up", { pct: change }) : change <= -1 ? t("lift.chg.down", { pct: -change }) : t("lift.chg.flat")}
        </p>
      )}
    </div>
  );
}

const DAY = 86_400_000;
const RANGE_MS: Record<StatRange, number> = { "1w": 7 * DAY, "1m": 30 * DAY, "3m": 91 * DAY, "6m": 182 * DAY, "1y": 365 * DAY };

/**
 * A line across the whole range (time to scale, so gaps between sessions show), filled below. The SVG
 * stretches to the card (non-scaling strokes), and the labels and the newest point are HTML on top, so text
 * stays sharp and round at any width.
 */
function Plot({
  points,
  metric,
  unit,
  range,
  now,
}: {
  points: readonly StatPoint[];
  metric: StatMetric;
  unit: Unit;
  range: StatRange;
  now: number;
}) {
  const from = now - RANGE_MS[range];
  const fmtDay = (ms: number) => date(ms, { month: "short", day: "numeric" });
  if (!points.length) {
    return (
      <div className="mt-3 grid h-40 place-items-center rounded-xl border border-dashed border-line px-4 text-center text-sm text-muted">
        {t("lift.chart.empty")}
      </div>
    );
  }
  const vals = points.map((p) => p.value);
  const lo0 = Math.min(...vals);
  const hi0 = Math.max(...vals);
  const pad = (hi0 - lo0 || Math.max(1, hi0 * 0.1)) * 0.15;
  const lo = Math.max(0, lo0 - pad);
  const hi = hi0 + pad;
  const W = 100;
  const H = 100;
  const x = (at: number) => ((at - from) / (now - from)) * W;
  const y = (v: number) => (1 - (v - lo) / (hi - lo)) * H;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(p.at).toFixed(2)},${y(p.value).toFixed(2)}`).join(" ");
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const area = `${line} L${x(last.at).toFixed(2)},${H} L${x(first.at).toFixed(2)},${H} Z`;
  const label = t("lift.chart.label", { metric: METRIC_LABEL[metric](), range: RANGE_LABEL[range]() });
  return (
    <figure className="mt-3">
      <div className="flex gap-2">
        {/* The highest and lowest values, in a gutter beside the line so they never cover a point. */}
        <div className="num relative h-40 shrink-0 text-right text-xs text-muted" aria-hidden>
          <span className="invisible block h-0 overflow-hidden">{fmtValue(metric, hi0, unit)}</span>
          <span className="invisible block h-0 overflow-hidden">{fmtValue(metric, lo0, unit)}</span>
          <span className="absolute right-0 -translate-y-1/2" style={{ top: `${y(hi0)}%` }}>
            {fmtValue(metric, hi0, unit)}
          </span>
          {hi0 !== lo0 && (
            <span className="absolute right-0 -translate-y-1/2 text-faint" style={{ top: `${y(lo0)}%` }}>
              {fmtValue(metric, lo0, unit)}
            </span>
          )}
        </div>
        <div className="relative h-40 min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line/60" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-line" aria-hidden />
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <defs>
              <linearGradient id="lift-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: "var(--grad-a)", stopOpacity: 0.3 }} />
                <stop offset="1" style={{ stopColor: "var(--grad-a)", stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            {points.length > 1 && <path d={area} fill="url(#lift-fill)" stroke="none" />}
            {points.length > 1 && (
              <path
                d={line}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
          {points.length <= 40 &&
            points
              .slice(0, -1)
              .map((p) => (
                <span
                  key={p.at}
                  className="pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/70"
                  style={{ left: `${x(p.at)}%`, top: `${y(p.value)}%` }}
                  aria-hidden
                />
              ))}
          <span
            className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent"
            style={{ left: `${x(last.at)}%`, top: `${y(last.value)}%` }}
            aria-hidden
          />
        </div>
      </div>
      <div className="num mt-1 flex justify-between gap-2 text-xs text-faint" aria-hidden>
        <span>{fmtDay(from)}</span>
        <span>{t("lift.chart.latest", { value: fmtValue(metric, last.value, unit), date: fmtDay(last.at) })}</span>
      </div>
      <figcaption className="sr-only">
        {label}: {points.map((p) => `${fmtDay(p.at)} ${fmtValue(metric, p.value, unit)}`).join(", ")}
      </figcaption>
    </figure>
  );
}

/** Lifters like you: the share of trained lifters this max beats, a ladder of the standard, and the next rung to aim for. */
export function LiftCompareCard({ c, unit }: { c: LiftComparison; unit: Unit }) {
  // Decades from the 20s up ("in their 30s"); a teenager's age still adjusts the standard but isn't named.
  const decade = c.age !== null && c.age >= 20 ? Math.floor(c.age / 10) * 10 : null;
  const sx = c.sex === "female" ? "F" : c.sex === "male" ? "M" : "";
  const who = `lift.cmp.who${decade !== null ? "Age" : ""}${sx}` as const;
  const top = c.steps[c.steps.length - 1]!.e1rm;
  const scaleMax = Math.max(top * 1.08, c.ratio * c.bodyweightKg * 1.04);
  const pos = (v: number) => `${Math.min(100, (v / scaleMax) * 100)}%`;
  const you = c.ratio * c.bodyweightKg;
  return (
    <Section title={t("lift.cmp.title")} icon="people" info="strengthStandards">
      <div className="card p-4" data-testid="lift-compare">
        <p className="text-sm text-muted">{t(who, { weight: kg(c.bodyweightKg, unit), decade: decade ?? 0 })}</p>
        <p className="mt-2">
          <span className="display text-3xl text-accent">{t("lift.cmp.pct", { pct: c.percentile })}</span>
        </p>
        <p className="text-sm">{t("lift.cmp.stronger", { pct: c.percentile })}</p>
        <div className="relative mt-6 h-2 rounded-full bg-raised" aria-hidden>
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-accent-2" style={{ width: pos(you) }} />
          {c.steps.map((s) => (
            <span key={s.pct} className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-muted" style={{ left: pos(s.e1rm) }} />
          ))}
          <span
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent"
            style={{ left: pos(you) }}
          />
        </div>
        <ol className="num mt-3 grid grid-cols-5 gap-1 text-center text-xs" aria-label={t("lift.cmp.ladder")}>
          {c.steps.map((s) => (
            <li key={s.pct} className={c.percentile >= s.pct ? "text-ink" : "text-faint"}>
              <span className="block font-semibold">{t("lift.cmp.pct", { pct: s.pct })}</span>
              <span className="block">{kg(s.e1rm, unit)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm">{t("lift.cmp.ratio", { ratio: num(Math.round(c.ratio * 100) / 100, { maximumFractionDigits: 2 }) })}</p>
        <p className="mt-1 text-sm text-muted" data-testid="lift-compare-next">
          {c.next ? t("lift.cmp.next", { kg: kg(Math.max(1, c.next.moreKg), unit), pct: c.next.pct }) : t("lift.cmp.top")}
        </p>
        <p className="mt-3 text-xs text-faint">{t("lift.cmp.note")}</p>
      </div>
      {(c.age === null || !c.sex) && (
        <div className="mt-3">
          <StatsNeeded need={["sex", "age"]} />
        </div>
      )}
    </Section>
  );
}
