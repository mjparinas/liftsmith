import { familyOf, type Family } from "@/components/app/theme";

import { EXERCISE_BY_ID } from "./exercises";
import { num, t } from "./i18n";
import { fmtTonnage } from "./moments";
import { recap, type Period, type Recap } from "./recap";
import { prLine, type Shareable, type ShareContext, type ShareOptions } from "./shareCards";
import type { AppEvent, SetEvent } from "./types";

// Training stats cards for the screenshot share sheet (Melvin, 2026-11-15, from a banking app that offers branded cards
// when you take a screenshot; docs/decisions/sharing.md "Share cards when you take a screenshot"). A span (1M to All)
// and three card styles: totals, where the sets went (push, pull, legs, core) and best lifts. Pure, so it's tested in
// node; privacy follows every other card (shareCards.ts): weights only while Show weights is on, counts and
// percentages always, and never heart rate, body numbers or places.

export const SPANS = ["1m", "3m", "6m", "1y", "all"] as const;
export type Span = (typeof SPANS)[number];

const DAY = 86_400_000;
const SPAN_DAYS: Record<Exclude<Span, "all">, number> = { "1m": 30, "3m": 91, "6m": 182, "1y": 365 };

/** The days a span covers, ending at the end of today; All starts with the lifter's first set. */
export function spanPeriod(span: Span, events: readonly AppEvent[], now: number): Period {
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  if (span !== "all") return { kind: "span", start: end.getTime() - SPAN_DAYS[span] * DAY, end: end.getTime() };
  let first = now;
  for (const e of events) if (e.type === "set" && e.at < first) first = e.at;
  const start = new Date(first);
  start.setHours(0, 0, 0, 0);
  return { kind: "span", start: start.getTime(), end: end.getTime() };
}

/** Whether there's anything to put on a card: at least one workout ever. */
export const hasStats = (events: readonly AppEvent[]) => events.some((e) => e.type === "set");

/** Card hex for each muscle family, matching the dark tokens behind FAMILY_HUE (the card is always dark). */
export const FAMILY_HEX: Record<Family, string> = { push: "#4c8dff", pull: "#38d6e8", legs: "#a78bfa", core: "#ff8a3d" };
const FAMILIES: Family[] = ["push", "pull", "legs", "core"];

/** Each family's share of the span's sets, by each set's first primary muscle, biggest first; empty with no sets. */
export function familySplit(sets: readonly SetEvent[]): { family: Family; share: number }[] {
  const n = new Map<Family, number>();
  let total = 0;
  for (const s of sets) {
    const m = EXERCISE_BY_ID.get(s.exerciseId)?.primary[0];
    if (!m) continue;
    n.set(familyOf(m), (n.get(familyOf(m)) ?? 0) + 1);
    total++;
  }
  if (!total) return [];
  return FAMILIES.map((family) => ({ family, share: (n.get(family) ?? 0) / total }))
    .filter((f) => f.share > 0)
    .sort((a, b) => b.share - a.share);
}

/** Whole percentages that add up to 100 (largest remainder), so the legend never says 99% or 101%. */
export function wholePercents(shares: readonly number[]): number[] {
  const raw = shares.map((s) => s * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (left <= 0) break;
    out[i] = (out[i] ?? 0) + 1;
    left--;
  }
  return out;
}

const pct = (x: number) => `${x >= 0 ? "+" : "−"}${num(Math.abs(Math.round(x * 100)))}%`;

/** The three styles for one span, the ones with something to show. Each is a share card like any other. */
export function statsShares(events: readonly AppEvent[], span: Span, ctx: ShareContext, now: number): Shareable[] {
  const period = spanPeriod(span, events, now);
  const r: Recap = recap(events, period, now);
  if (!r.workouts) return [];
  const kicker = t(`card.shot.span.${span}`);
  const footer = t("card.shot.footer", { level: ctx.game.level.level, title: ctx.game.level.title });
  const sets = events.filter((e): e is SetEvent => e.type === "set" && e.at >= period.start && e.at < period.end);
  const split = familySplit(sets);
  const out: Shareable[] = [];

  out.push({
    id: "stats-totals",
    kind: "stats",
    label: t("card.shot.style.totals"),
    figure: r.topExercise?.id,
    file: `liftsmith-${span}`,
    card: (o: ShareOptions) => ({
      kicker,
      headline: t("card.shot.workouts", { count: r.workouts, n: num(r.workouts) }),
      big: o.weights
        ? { value: fmtTonnage(r.volumeKg, ctx.unit), label: t("card.shot.lifted") }
        : { value: num(r.sets), label: t("card.shot.sets") },
      tiles: [
        [t("card.shot.prs"), num(r.prs.length)],
        [t("card.shot.weeks"), t("card.shot.weeksOf", { n: num(r.activeWeeks), of: num(r.weeks) })],
        ...(o.weights ? ([[t("card.shot.sets"), num(r.sets)]] as [string, string][]) : []),
      ],
      lines: span !== "all" && r.volumeChange !== null ? [t("card.shot.change", { change: pct(r.volumeChange) })] : [],
      footer,
      accent: ctx.accent,
      name: o.name,
    }),
  });

  if (split.length) {
    const whole = wholePercents(split.map((f) => f.share));
    out.push({
      id: "stats-split",
      kind: "stats",
      label: t("card.shot.style.split"),
      file: `liftsmith-split-${span}`,
      card: (o: ShareOptions) => ({
        kicker,
        headline: t("card.shot.splitHead"),
        tiles: [],
        lines: [],
        split: split.map((f, i) => ({ label: t(`card.shot.fam.${f.family}`), percent: whole[i] ?? 0, colour: FAMILY_HEX[f.family] })),
        big: { value: num(r.sets), label: t("card.shot.sets") },
        footer,
        accent: ctx.accent,
        name: o.name,
      }),
    });
  }

  const best = r.prs.slice(0, 3);
  if (best.length) {
    out.push({
      id: "stats-lifts",
      kind: "stats",
      label: t("card.shot.style.lifts"),
      figure: best[0]?.exerciseId,
      file: `liftsmith-bests-${span}`,
      card: (o: ShareOptions) => ({
        kicker,
        headline: t("card.shot.liftsHead"),
        big: { value: num(r.prs.length), label: t("card.shot.prsLong", { count: r.prs.length }) },
        tiles: [],
        lines: best.map((p) => prLine({ exerciseId: p.exerciseId, weight: p.weight, reps: p.reps }, o, ctx.unit)),
        footer,
        accent: ctx.accent,
        name: o.name,
      }),
    });
  }
  return out;
}
