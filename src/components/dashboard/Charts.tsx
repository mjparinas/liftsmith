"use client";
import { dayKey, heat, weekdayNames, type DayTotals, type GridDay } from "@/lib/dashboard";
import { useEffect, useRef, useState } from "react";

// Small SVG charts for the web dashboard. One series each (the title names it, so no legend), the
// accent colour for data, recessive grid lines, and a hover or focus readout on every mark.

const HEAT = ["var(--color-raised)", "rgb(76 141 255 / 0.3)", "rgb(76 141 255 / 0.55)", "rgb(76 141 255 / 0.8)", "var(--color-accent)"];
/** Every other weekday label down the side of the year grid, in the lifter's week order. */
const dow = () => weekdayNames().map((d, i) => (i % 2 ? "" : d));

function dayLabel(ms: number) {
  return new Date(ms).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function describe(t: DayTotals | undefined) {
  if (!t) return "Rest day";
  return `${t.sessions} workout${t.sessions > 1 ? "s" : ""}, ${t.sets} sets${t.prs ? `, ${t.prs} PR${t.prs > 1 ? "s" : ""}` : ""}`;
}

function summary(grid: GridDay[][], days: Map<string, DayTotals>) {
  const shown = grid.flat().filter((d) => !d.future);
  const trained = shown.filter((d) => days.has(d.key)).length;
  return `Trained on ${trained} of the last ${shown.length} days`;
}

/** A year of training days, one square per day, darker for more sets. */
export function YearHeatmap({ grid, days, onPick }: { grid: GridDay[][]; days: Map<string, DayTotals>; onPick?: (ms: number) => void }) {
  const [hover, setHover] = useState<GridDay | null>(null);
  const cell = 13;
  const gap = 3;
  const months: { x: number; label: string }[] = [];
  grid.forEach((col, i) => {
    const d = new Date(col[0].ms);
    if (d.getDate() <= 7) months.push({ x: i, label: d.toLocaleDateString([], { month: "short" }) });
  });
  return (
    <div>
      <div className="overflow-x-auto pb-1" tabIndex={0} role="region" aria-label="Training days this year, scrolls sideways">
        <div className="relative inline-grid" role="img" aria-label={summary(grid, days)} style={{ gridTemplateColumns: `28px repeat(${grid.length}, ${cell}px)`, columnGap: gap, rowGap: gap }}>
          <div />
          {grid.map((_, i) => (
            <div key={i} className="h-4 text-[0.625rem] leading-4 text-faint" aria-hidden>{months.find((m) => m.x === i)?.label ?? ""}</div>
          ))}
          {dow().map((label, row) => (
            <Row key={row} label={label} row={row} grid={grid} days={days} cell={cell} onHover={setHover} onPick={onPick} />
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span aria-live="polite" className="num min-h-4">{hover ? `${dayLabel(hover.ms)}: ${describe(days.get(hover.key))}` : "Point at a day for details"}</span>
        <span className="flex items-center gap-1" aria-hidden>
          Fewer sets
          {HEAT.map((c, i) => <span key={i} className="inline-block h-3 w-3 rounded-[3px]" style={{ background: c }} />)}
          More
        </span>
      </div>
    </div>
  );
}

function Row({ label, row, grid, days, cell, onHover, onPick }: { label: string; row: number; grid: GridDay[][]; days: Map<string, DayTotals>; cell: number; onHover: (d: GridDay | null) => void; onPick?: (ms: number) => void }) {
  return (
    <>
      <div className="text-[0.625rem] leading-[13px] text-faint" aria-hidden>{label}</div>
      {grid.map((col) => {
        const d = col[row];
        if (d.future) return <div key={d.key} style={{ width: cell, height: cell }} />;
        const t = days.get(d.key);
        // Pointer-only: the squares are too small to tap, so keyboard and screen reader users get the
        // same days from the month calendar and the summary on the grid.
        return (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <div
            key={d.key}
            onMouseEnter={() => onHover(d)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onPick?.(d.ms)}
            className={`rounded-[3px] ${onPick ? "cursor-pointer" : ""}`}
            style={{ width: cell, height: cell, background: HEAT[heat(t)] }}
          />
        );
      })}
    </>
  );
}

/** One month as a calendar, with the workouts on each day. */
export function MonthCalendar({ rows, days, today, selected, onPick }: { rows: (GridDay | null)[][]; days: Map<string, DayTotals>; today: number; selected: string | null; onPick: (key: string) => void }) {
  const todayKey = dayKey(today);
  return (
    <table className="w-full table-fixed border-separate border-spacing-1 text-sm">
      <thead>
        <tr>{weekdayNames().map((d) => <th key={d} scope="col" className="pb-1 text-xs font-medium text-faint">{d}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((d, j) => {
              if (!d) return <td key={j} />;
              const t = days.get(d.key);
              const on = selected === d.key;
              return (
                <td key={d.key}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => onPick(d.key)}
                    className={`press flex h-16 w-full flex-col items-start rounded-xl border p-1.5 text-left ${on ? "border-accent" : "border-line"} ${t ? "bg-accent/15" : "bg-surface"}`}
                  >
                    <span className={`num text-xs ${d.key === todayKey ? "rounded-full bg-accent px-1.5 font-semibold text-accent-ink" : "text-muted"}`}>{new Date(d.ms).getDate()}</span>
                    <span className="sr-only">, {dayLabel(d.ms)}: {describe(t)}</span>
                    {t && <span aria-hidden className="num mt-auto text-xs font-semibold text-ink">{t.sets} sets{t.prs ? " · PR" : ""}</span>}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A line over time with a crosshair readout. Points are [ms, value]. */
export function LineChart({ points, format, label, height = 180 }: { points: [number, number][]; format: (v: number) => string; label: string; height?: number }) {
  const [hi, setHi] = useState<number | null>(null);
  // Draw at the real width so the axis text stays its true size on a phone and a big screen.
  const box = useRef<HTMLElement>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  if (points.length < 2) return <p className="text-sm text-muted">Needs two sessions to draw a trend.</p>;
  const pad = { l: 44, r: 12, t: 12, b: 24 };
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const lo = Math.min(...ys);
  const hiY = Math.max(...ys);
  const span = Math.max(1, hiY - lo);
  const y0 = lo - span * 0.1;
  const y1 = hiY + span * 0.1;
  const X = (t: number) => pad.l + ((t - x0) / Math.max(1, x1 - x0)) * (w - pad.l - pad.r);
  const Y = (v: number) => pad.t + (1 - (v - y0) / (y1 - y0)) * (height - pad.t - pad.b);
  const d = points.map((p, i) => `${i ? "L" : "M"}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(" ");
  const ticks = [y0 + (y1 - y0) * 0.1, (y0 + y1) / 2, y1 - (y1 - y0) * 0.1];
  const near = (clientX: number, rect: DOMRect) => {
    const t = x0 + ((clientX - rect.left) / rect.width * w - pad.l) / (w - pad.l - pad.r) * (x1 - x0);
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(points[i][0] - t) < Math.abs(points[best][0] - t)) best = i;
    return best;
  };
  const p = hi === null ? points.at(-1)! : points[hi];
  return (
    <figure ref={box}>
      <figcaption className="num mb-1 text-sm text-muted" aria-live="polite">
        {new Date(p[0]).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}: <span className="font-semibold text-ink">{format(p[1])}</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className="w-full touch-none"
        role="img"
        aria-label={`${label}: from ${format(points[0][1])} to ${format(points.at(-1)![1])} over ${points.length} sessions`}
        onPointerMove={(e) => setHi(near(e.clientX, e.currentTarget.getBoundingClientRect()))}
        onPointerLeave={() => setHi(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={Y(t)} y2={Y(t)} stroke="var(--color-line)" strokeWidth={1} />
            <text x={pad.l - 6} y={Y(t) + 4} textAnchor="end" fontSize={11} fill="var(--color-faint)">{format(t)}</text>
          </g>
        ))}
        <text x={pad.l} y={height - 6} fontSize={11} fill="var(--color-faint)">{new Date(x0).toLocaleDateString([], { month: "short", year: "numeric" })}</text>
        <text x={w - pad.r} y={height - 6} textAnchor="end" fontSize={11} fill="var(--color-faint)">{new Date(x1).toLocaleDateString([], { month: "short", year: "numeric" })}</text>
        <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {hi !== null && <line x1={X(p[0])} x2={X(p[0])} y1={pad.t} y2={height - pad.b} stroke="var(--color-muted)" strokeWidth={1} strokeDasharray="3 3" />}
        <circle cx={X(p[0])} cy={Y(p[1])} r={5} fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth={2} />
      </svg>
    </figure>
  );
}

/** Columns, one per week, with the value under the pointer read out above. */
export function WeekBars({ weeks, value, format, label }: { weeks: { weekStart: number }[]; value: (i: number) => number; format: (v: number) => string; label: string }) {
  const [hi, setHi] = useState<number | null>(null);
  const vals = weeks.map((_, i) => value(i));
  const max = Math.max(1, ...vals);
  const i = hi ?? weeks.length - 1;
  return (
    <figure>
      <figcaption className="num mb-2 text-sm text-muted" aria-live="polite">
        Week of {new Date(weeks[i].weekStart).toLocaleDateString([], { month: "short", day: "numeric" })}: <span className="font-semibold text-ink">{format(vals[i])}</span>
      </figcaption>
      <div className="flex h-28 items-end gap-1" role="group" aria-label={label}>
        {weeks.map((wk, j) => (
          <button
            key={wk.weekStart}
            type="button"
            aria-label={`Week of ${new Date(wk.weekStart).toLocaleDateString([], { month: "short", day: "numeric" })}: ${format(vals[j])}`}
            onMouseEnter={() => setHi(j)}
            onMouseLeave={() => setHi(null)}
            onFocus={() => setHi(j)}
            onBlur={() => setHi(null)}
            className="flex h-full flex-1 items-end"
          >
            <span className={`block w-full rounded-t-[4px] ${j === i ? "bg-accent" : "bg-accent/55"}`} style={{ height: `${Math.max(vals[j] ? 4 : 1, (vals[j] / max) * 100)}%` }} />
          </button>
        ))}
      </div>
    </figure>
  );
}
