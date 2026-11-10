"use client";

import { useId } from "react";

import { Icon } from "@/components/app/icons";
import { beatStyle } from "@/lib/beat";
import { trendPath, trendPoints } from "@/lib/hrTrend";

import { DEMO_COLOURS } from "./colours";

const W = 44;
const H = 14;

/**
 * The live heart rate on the 3D figure's stage: a red heart, the bpm, and a small trend line of the
 * last couple of minutes that fades in from the left and ends in a soft dot at the latest reading.
 * The stage is always dark, so it uses the stage colour rather than the theme's.
 */
export function HeartReadout({ bpm, trend = [] }: { bpm: number; trend?: readonly number[] }) {
  const id = useId();
  const points = trendPoints(trend, W, H);
  const line = trendPath(points);
  const last = points[points.length - 1];
  const red = DEMO_COLOURS.heart;
  return (
    <span
      className="pointer-events-none absolute bottom-2 left-3 flex items-center gap-1.5 font-mono text-[0.6875rem] font-semibold tabular-nums"
      style={{ color: red }}
      role="img"
      aria-label={`Heart rate ${bpm}`}
      data-testid="heart-readout"
    >
      <span className="animate-beat inline-flex" style={beatStyle(bpm)} aria-hidden>
        <Icon name="heart" size={12} filled strokeWidth={1.5} />
      </span>
      <span aria-hidden>{bpm}</span>
      {line && last && (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[0.875rem] w-[2.75rem] overflow-visible" aria-hidden data-testid="heart-trend">
          <defs>
            <linearGradient id={`${id}-s`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor={red} stopOpacity="0" />
              <stop offset="0.35" stopColor={red} stopOpacity="0.55" />
              <stop offset="1" stopColor={red} stopOpacity="1" />
            </linearGradient>
            <linearGradient id={`${id}-f`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={red} stopOpacity="0.22" />
              <stop offset="1" stopColor={red} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L${last[0]} ${H} L0 ${H} Z`} fill={`url(#${id}-f)`} />
          <path d={line} fill="none" stroke={`url(#${id}-s)`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={last[0]} cy={last[1]} r="3.5" fill={red} opacity="0.25" />
          <circle cx={last[0]} cy={last[1]} r="1.75" fill={red} />
        </svg>
      )}
    </span>
  );
}
