"use client";

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { date, num, t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import type { LiftSession } from "@/lib/liftPage";
import {
  DEFAULT_RANGE,
  liftSeries,
  metricsFor,
  rangeStart,
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
  all: () => t("lift.range.all"),
};

const METRIC_LABEL: Record<StatMetric, () => string> = {
  e1rm: () => t("lift.metric.e1rm"),
  volume: () => t("lift.metric.volume"),
  top: () => t("lift.metric.top"),
  reps: () => t("lift.metric.reps"),
  time: () => t("lift.metric.time"),
};

/** The chart with its range and metric chips. Advanced stats (Pro), so ExercisePage shows it inside the trend card. */
export function LiftChart({ ex, sessions, unit, now }: { ex: Exercise; sessions: readonly LiftSession[]; unit: Unit; now: number }) {
  const metrics = metricsFor(ex);
  const [metric, setMetric] = useState<StatMetric>(metrics[0]!);
  const [range, setRange] = useState<StatRange>(DEFAULT_RANGE);
  const points = useMemo(() => liftSeries(sessions, metric, range, now), [sessions, metric, range, now]);
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
      {/* Keyed on what it shows, so a picked point doesn't carry over to another metric or range. */}
      <Plot
        key={`${metric}:${range}`}
        points={points}
        metric={metric}
        unit={unit}
        range={range}
        from={rangeStart(sessions, range, now)}
        now={now}
      />
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

/** The point nearest to a spot on the x axis (0 to 100), for picking a session by touch, pen or mouse. */
export function nearestPoint(points: readonly StatPoint[], xPct: number, x: (at: number) => number): number {
  let best = 0;
  let gap = Infinity;
  points.forEach((p, i) => {
    const d = Math.abs(x(p.at) - xPct);
    if (d < gap) {
      gap = d;
      best = i;
    }
  });
  return best;
}

/**
 * A line across the whole range (time to scale, so gaps between sessions show), filled below. The SVG
 * stretches to the card (non-scaling strokes), and the labels and the points are HTML on top, so text stays
 * sharp and round at any width. New bests are gold. Touching, dragging or hovering over the chart (or the arrow
 * keys) picks a session, and the line under the chart says its number and date (Melvin, 2026-11-26); a sideways
 * drag scrubs, an up-and-down one still scrolls the page.
 */
function Plot({
  points,
  metric,
  unit,
  range,
  from,
  now,
}: {
  points: readonly StatPoint[];
  metric: StatMetric;
  unit: Unit;
  range: StatRange;
  from: number;
  now: number;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const yearOf = (ms: number) => new Date(ms).getFullYear();
  const withYear = yearOf(from) !== yearOf(now);
  const fmtDay = (ms: number) => date(ms, { month: "short", day: "numeric", year: withYear ? "numeric" : undefined });
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
  const span = Math.max(1, now - from);
  const x = (at: number) => ((at - from) / span) * W;
  const y = (v: number) => (1 - (v - lo) / (hi - lo)) * H;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(p.at).toFixed(2)},${y(p.value).toFixed(2)}`).join(" ");
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const fill = `${line} L${x(last.at).toFixed(2)},${H} L${x(first.at).toFixed(2)},${H} Z`;
  const label = t("lift.chart.label", { metric: METRIC_LABEL[metric](), range: RANGE_LABEL[range]() });
  const shownAt = picked ?? points.length - 1;
  const shown = points[shownAt]!;
  const anyBest = points.some((p) => p.best);
  const pointText = (p: StatPoint) =>
    p.best
      ? t("lift.chart.pointBest", { value: fmtValue(metric, p.value, unit), date: fmtDay(p.at) })
      : t("lift.chart.point", { value: fmtValue(metric, p.value, unit), date: fmtDay(p.at) });
  const pick = (i: number) => {
    const next = Math.max(0, Math.min(points.length - 1, i));
    if (next === picked) return;
    setPicked(next);
    haptic("select");
  };
  const pickAt = (e: PointerEvent<HTMLDivElement>) => {
    const box = area.current?.getBoundingClientRect();
    if (!box || box.width <= 0) return;
    pick(nearestPoint(points, ((e.clientX - box.left) / box.width) * W, x));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 };
    if (e.key in step) pick(shownAt + step[e.key]!);
    else if (e.key === "Home") pick(0);
    else if (e.key === "End") pick(points.length - 1);
    else return;
    e.preventDefault();
  };
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
        <div
          ref={area}
          role="slider"
          tabIndex={0}
          aria-label={t("lift.chart.pick", { metric: METRIC_LABEL[metric]() })}
          aria-valuemin={1}
          aria-valuemax={points.length}
          aria-valuenow={shownAt + 1}
          aria-valuetext={pointText(shown)}
          data-no-swipe
          data-testid="lift-plot"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture?.(e.pointerId);
            pickAt(e);
          }}
          onPointerMove={(e) => {
            if (e.pointerType === "mouse" || e.buttons) pickAt(e);
          }}
          onKeyDown={onKey}
          className="relative h-40 min-w-0 flex-1 cursor-crosshair rounded-md touch-pan-y"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line/60" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-line" aria-hidden />
          {picked !== null && (
            <div
              className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-accent/50"
              style={{ left: `${x(shown.at)}%` }}
              aria-hidden
            />
          )}
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <defs>
              <linearGradient id="lift-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: "var(--grad-a)", stopOpacity: 0.3 }} />
                <stop offset="1" style={{ stopColor: "var(--grad-a)", stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            {points.length > 1 && <path d={fill} fill="url(#lift-fill)" stroke="none" />}
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
          {points.map((p, i) => {
            const isShown = i === shownAt;
            // Plain points only while there's room for them; bests and the shown point always.
            if (!p.best && !isShown && points.length > 40) return null;
            const size = isShown ? "h-3 w-3 border-2 border-surface" : p.best ? "h-2.5 w-2.5 border border-surface" : "h-1.5 w-1.5";
            const colour = p.best ? "bg-gold" : isShown ? "bg-accent" : "bg-accent/70";
            return (
              <span
                key={p.at}
                data-best={p.best ? "" : undefined}
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${size} ${colour}`}
                style={{ left: `${x(p.at)}%`, top: `${y(p.value)}%` }}
                aria-hidden
              />
            );
          })}
        </div>
      </div>
      <div className="num mt-1 flex flex-wrap justify-between gap-x-2 text-xs text-faint" aria-hidden>
        <span>{fmtDay(from)}</span>
        <span className={picked !== null ? "font-semibold text-ink" : undefined} data-testid="lift-point">
          {picked !== null
            ? pointText(shown)
            : t("lift.chart.latest", { value: fmtValue(metric, last.value, unit), date: fmtDay(last.at) })}
        </span>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-faint" aria-hidden>
        {anyBest && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gold" />
            {t("lift.chart.bestKey")}
          </span>
        )}
        <span>{t("lift.chart.hint")}</span>
      </p>
      <figcaption className="sr-only">
        {label}: {points.map(pointText).join(", ")}
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
