"use client";

import { plateStyle, type Loading } from "@/lib/plates";
import type { Unit } from "@/lib/types";
import { fmtNum } from "@/lib/units";

// A barbell with the plates to load on each side, heaviest nearest the collar. The point is that
// nobody has to do plate maths between sets.

export type PlateFinish = "classic" | "black" | "chrome" | "neon";

/** The words on the graphic. English here for the website; the app's PlateBar (app/Plates.tsx) passes its language's. */
export const PLATE_WORDS = {
  label: "Load {plates} {unit} on each side of a {bar} {unit} bar",
  noPlates: "no plates",
  bar: "{bar} {unit} bar",
  eachSide: "Each side:",
  empty: "Empty bar",
  nearest: "nearest you can load",
};
export type PlateWords = Record<keyof typeof PLATE_WORDS, string>;
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? "");

/** Plate finishes won from crates keep the weight colour as a rim, so plates stay easy to tell apart. */
function finished(s: ReturnType<typeof plateStyle>, finish: PlateFinish) {
  if (finish === "black") return { fill: "var(--plate-black)", stroke: s.rim, strokeWidth: 2.5, text: s.rim };
  if (finish === "chrome") return { fill: "url(#chrome)", stroke: s.rim, strokeWidth: 2.5, text: "var(--plate-ink-dark)" };
  if (finish === "neon") return { fill: "var(--plate-black)", stroke: s.rim, strokeWidth: 3, text: s.rim, glow: true };
  return { fill: s.fill, stroke: "var(--plate-edge)", strokeWidth: 1, text: s.text };
}

export function PlateBar({
  loading,
  bar,
  unit,
  compact,
  finish = "classic",
  words: w = PLATE_WORDS,
}: {
  loading: Loading;
  bar: number;
  unit: Unit;
  compact?: boolean;
  finish?: PlateFinish;
  words?: PlateWords;
}) {
  const plates = loading.perSide;
  const W = 360;
  const cy = 60;
  const collar = 118; // x where the left sleeve's collar sits
  let x = collar;
  const left = plates.map((w) => {
    const s = plateStyle(w, unit);
    x -= s.width + 1.5;
    return { w, s, x };
  });
  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} 120`}
        className="w-full"
        role="img"
        aria-label={fill(w.label, { plates: plates.length ? plates.map(fmtNum).join(", ") : w.noPlates, unit, bar: fmtNum(bar) })}
      >
        <defs>
          <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c9d1db" />
            <stop offset="0.5" stopColor="#8e99a6" />
            <stop offset="1" stopColor="#5e6873" />
          </linearGradient>
          <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f4f7fb" />
            <stop offset="0.45" stopColor="#9aa6b4" />
            <stop offset="0.55" stopColor="#e2e8ef" />
            <stop offset="1" stopColor="#6b7684" />
          </linearGradient>
          <filter id="neon" x="-50%" y="-20%" width="200%" height="140%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* shaft */}
        <rect x={collar} y={cy - 3} width={W - collar * 2} height={6} rx={2} fill="url(#steel)" />
        <rect x={W / 2 - 34} y={cy - 3.5} width={68} height={7} rx={2} fill="#6f7a87" opacity={0.5} />
        {/* sleeves */}
        <rect x={6} y={cy - 6} width={collar - 6} height={12} rx={3} fill="url(#steel)" />
        <rect x={W - collar} y={cy - 6} width={collar - 6} height={12} rx={3} fill="url(#steel)" />
        <rect x={collar - 2} y={cy - 11} width={6} height={22} rx={2} fill="#aeb7c2" />
        <rect x={W - collar - 4} y={cy - 11} width={6} height={22} rx={2} fill="#aeb7c2" />
        {[false, true].map((mirror) => (
          <g key={String(mirror)} transform={mirror ? `translate(${W},0) scale(-1,1)` : undefined}>
            {left.map(({ w, s, x }, i) => {
              const f = finished(s, finish);
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={cy - s.height / 2}
                    width={s.width}
                    height={s.height}
                    rx={2.5}
                    style={{ fill: f.fill, stroke: f.stroke }}
                    strokeWidth={f.strokeWidth}
                    filter={"glow" in f ? "url(#neon)" : undefined}
                  />
                  {!mirror && s.height > 48 && (
                    <text
                      x={x + s.width / 2}
                      y={cy + 3.5}
                      fontSize={9}
                      fontWeight={700}
                      textAnchor="middle"
                      style={{ fill: f.text }}
                      transform={`rotate(-90 ${x + s.width / 2} ${cy})`}
                    >
                      {fmtNum(w)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        ))}
        {!compact && (
          <text x={W / 2} y={cy + 30} fontSize={11} textAnchor="middle" style={{ fill: "var(--color-faint)" }}>
            {fill(w.bar, { bar: fmtNum(bar), unit })}
          </text>
        )}
      </svg>
      <p className="text-center text-sm text-muted num">
        {plates.length ? (
          <>
            {w.eachSide} <span className="font-semibold text-ink">{plates.map(fmtNum).join(" + ")}</span> {unit}
          </>
        ) : (
          w.empty
        )}
        {!loading.exact && <span className="ml-2 text-warn">{w.nearest}</span>}
      </p>
    </div>
  );
}
