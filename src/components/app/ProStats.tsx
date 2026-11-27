"use client";

import { useId } from "react";

import { t } from "@/lib/i18n";

import { Icon } from "./icons";
import { go } from "./router";
import { ProTag } from "./ui";

// "Unlock more stats with Pro" (Melvin, 2026-11-26: "free lifts dont get a chart that's a pro feature, make sure to
// emphasize that in the app"). Where a free lifter would see a chart (an exercise page, Progress's sets per muscle),
// this card shows a faded sample chart and what Pro's stats add. The whole card is the one button, and it opens the
// paywall at advanced stats (`#/pro/<from>`, mapped in Pro.tsx FROM), like ProLocked.

const POINTS = [62, 58, 60, 52, 54, 46, 47, 40, 36, 38, 30, 24];
const LINE = POINTS.map((v, i) => `${i ? "L" : "M"}${((i / (POINTS.length - 1)) * 100).toFixed(1)},${v}`).join(" ");

export function ProStats({ from, lines }: { from: "lift" | "stats"; lines: readonly string[] }) {
  const what = useId();
  return (
    <button
      type="button"
      onClick={() => go("pro", from)}
      // Named like every other Pro card ("Advanced stats, a Pro feature: see Pro"); what it adds is its description.
      aria-label={t("pro.locked", { what: t("pro.ft.advancedStats") })}
      aria-describedby={what}
      className="press card card-tint w-full overflow-hidden p-4 text-left"
      style={{ "--tint": "var(--color-violet)" } as React.CSSProperties}
      data-testid="pro-stats"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-semibold">{t("lift.pro.title")}</span>
        <ProTag />
      </span>
      {/* A sample, not the lifter's numbers: faded so it reads as a preview. */}
      <span className="relative mt-3 block h-20 opacity-45" aria-hidden>
        <svg viewBox="0 0 100 70" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <path d={`${LINE} L100,70 L0,70 Z`} fill="var(--grad-a)" fillOpacity={0.18} stroke="none" />
          <path
            d={LINE}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold"
          style={{ left: "100%", top: `${(24 / 70) * 100}%` }}
        />
      </span>
      <span id={what} className="mt-3 block space-y-1.5 text-sm">
        {lines.map((l) => (
          <span key={l} className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-accent" aria-hidden>
              <Icon name="check" size={16} />
            </span>
            <span>{l}</span>
          </span>
        ))}
      </span>
      <span className="mt-3 block text-sm font-semibold text-accent">
        {t("lift.pro.cta")} <span aria-hidden>›</span>
      </span>
    </button>
  );
}
