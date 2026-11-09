"use client";
// Small SVG charts for the admin panel. No chart library: thin marks, one axis, a legend for two or more
// series plus direct end labels, and a hover tooltip on every chart. The categorical colours were checked
// with the dataviz validator against the panel's surface (#11161d): all pass in dark mode.
import { useId, useRef, useState, type ReactNode } from "react";

export const SERIES = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"] as const;
const DAY = 86_400_000;

export const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");
export const fmtPct = (x: number | null | undefined, d = 1) => (x == null ? "—" : `${(x * 100).toFixed(d)}%`);
export const fmtUsd = (x: number | null | undefined, d = 0) => (x == null ? "—" : `$${x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}`);
export const fmtDay = (day: number) => new Date(day * DAY).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function Tile({ label, value, sub, delta, hint }: { label: string; value: string; sub?: string; delta?: number | null; hint?: string }) {
  return (
    <div className="card p-4" title={hint}>
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="num mt-1 text-2xl font-bold">{value}</div>
      {(sub || delta != null) && (
        <div className="mt-1 text-xs text-muted">
          {delta != null && Number.isFinite(delta) && (
            <span className={delta >= 0 ? "text-good" : "text-bad"} aria-label={`${delta >= 0 ? "up" : "down"} ${Math.abs(Math.round(delta * 100))}% on the period before`}>
              {delta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(delta * 100))}%{" "}
            </span>
          )}
          {sub}
        </div>
      )}
    </div>
  );
}

export function Card({ title, subtitle, children, right }: { title: string; subtitle?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  if (items.length < 2) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <svg width="16" height="8" aria-hidden>
            <line x1="0" x2="16" y1="4" y2="4" stroke={i.color} strokeWidth="2.5" strokeDasharray={i.dashed ? "4 3" : undefined} strokeLinecap="round" />
          </svg>
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

/** Each line's label at its last point, nudged apart so they never overlap. */
function endLabels(lines: (Line & { color: string })[], rows: Record<string, number | null>[], xs: (i: number) => number, ys: (v: number) => number, last: number) {
  const out: { key: string; label: string; x: number; y: number }[] = [];
  for (const l of lines) {
    let i = last;
    while (i >= 0 && rows[i][l.key] == null) i--;
    if (i >= 0) out.push({ key: l.key, label: l.label, x: xs(i), y: ys(rows[i][l.key]!) });
  }
  out.sort((a, b) => a.y - b.y);
  for (let k = 1; k < out.length; k++) if (out[k].y - out[k - 1].y < 13) out[k].y = out[k - 1].y + 13;
  return out;
}

export interface Line {
  key: string;
  label: string;
  dashed?: boolean;
  color?: string;
}

/** Lines over time (or months). `rows` hold an x and one value per series; null leaves a gap. */
export function LineChart({ rows, x, lines, xLabel, yFormat = fmtInt, height = 180, label, log = false }: { rows: Record<string, number | null>[]; x: string; lines: Line[]; xLabel: (v: number) => string; yFormat?: (v: number) => string; height?: number; label: string; log?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const W = 960;
  const H = height;
  const L = 64;
  const R = 96;
  const T = 8;
  const B = 22;
  const top = Math.max(0, ...rows.flatMap((r) => lines.map((l) => r[l.key] ?? 0)));
  const max = log ? 10 ** Math.ceil(Math.log10(Math.max(10, top))) : niceMax(top);
  const min = 10;
  const xs = (i: number) => L + (rows.length <= 1 ? 0 : (i * (W - L - R)) / (rows.length - 1));
  // Log scale (for MRR against the forecast, which spans 100x): values under 10 sit on the floor.
  const ys = (v: number) => (log ? T + (H - T - B) * (1 - (Math.log10(Math.max(min, v)) - 1) / (Math.log10(max) - 1)) : T + (H - T - B) * (1 - v / max));
  const ticks = log ? Array.from({ length: Math.round(Math.log10(max)) }, (_, k) => 10 ** (k + 1)) : [0, max / 2, max];
  const colored = lines.map((l, i) => ({ ...l, color: l.color ?? SERIES[i % SERIES.length] }));
  const path = (k: string) => {
    let d = "";
    let pen = false;
    rows.forEach((r, i) => {
      const v = r[k];
      if (v == null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${xs(i).toFixed(1)} ${ys(v).toFixed(1)} `;
      pen = true;
    });
    return d;
  };
  const onMove = (e: React.PointerEvent) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box || rows.length === 0) return;
    const px = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - L) / (W - L - R)) * (rows.length - 1));
    setHover(Math.max(0, Math.min(rows.length - 1, i)));
  };
  const step = Math.max(1, Math.ceil(rows.length / 6));
  const last = rows.length - 1;
  return (
    <figure className="relative overflow-x-auto">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label={label} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={ys(t)} y2={ys(t)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={L - 6} y={ys(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-muted)">{yFormat(t)}</text>
          </g>
        ))}
        {rows.map((r, i) => ((i % step === 0 && last - i >= step / 2) || i === last ? <text key={i} x={xs(i)} y={H - 6} textAnchor={i === last ? "end" : i === 0 ? "start" : "middle"} fontSize="11" fill="var(--color-muted)">{xLabel(r[x] ?? 0)}</text> : null))}
        {colored.map((l) => <path key={l.key} d={path(l.key)} fill="none" stroke={l.color} strokeWidth="2" strokeDasharray={l.dashed ? "5 4" : undefined} strokeLinejoin="round" strokeLinecap="round" />)}
        {colored.length <= 4 &&
          endLabels(colored, rows, xs, ys, last).map((e) => (
            <text key={e.key} x={e.x + 6} y={e.y + 4} fontSize="11" fill="var(--color-ink)">{e.label}</text>
          ))}
        {hover != null && (
          <g>
            <line x1={xs(hover)} x2={xs(hover)} y1={T} y2={H - B} stroke="var(--color-faint)" strokeWidth="1" />
            {colored.map((l) => (rows[hover][l.key] != null ? <circle key={l.key} cx={xs(hover)} cy={ys(rows[hover][l.key]!)} r="4" fill={l.color} stroke="var(--color-surface)" strokeWidth="2" /> : null))}
          </g>
        )}
      </svg>
      {hover != null && (
        <div className="pointer-events-none absolute top-0 z-10 rounded-lg border border-line bg-raised px-2.5 py-1.5 text-xs shadow-lg" style={{ left: `${Math.min(70, (xs(hover) / W) * 100)}%` }}>
          <div className="font-semibold">{xLabel(rows[hover][x] ?? 0)}</div>
          {colored.map((l) => (
            <div key={l.key} className="num flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: l.color }} />
              {l.label}: {rows[hover][l.key] == null ? "—" : yFormat(rows[hover][l.key]!)}
            </div>
          ))}
        </div>
      )}
      <Legend items={colored.map((l) => ({ label: l.label, color: l.color, dashed: l.dashed }))} />
    </figure>
  );
}

/** Stacked bars per day. */
export function StackedBars({ rows, keys, labels, xLabel = fmtDay, height = 160, label }: { rows: Record<string, number>[]; keys: string[]; labels: Record<string, string>; xLabel?: (v: number) => string; height?: number; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 960;
  const H = height;
  const L = 40;
  const T = 6;
  const B = 22;
  const totals = rows.map((r) => keys.reduce((s, k) => s + (r[k] ?? 0), 0));
  const max = niceMax(Math.max(0, ...totals));
  const bw = (W - L) / Math.max(1, rows.length);
  const ys = (v: number) => ((H - T - B) * v) / max;
  const step = Math.max(1, Math.ceil(rows.length / 6));
  const shown = keys.filter((k) => rows.some((r) => (r[k] ?? 0) > 0));
  return (
    <figure className="relative overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label={label} onPointerLeave={() => setHover(null)}>
        {[0, max / 2, max].map((t) => (
          <g key={t}>
            <line x1={L} x2={W} y1={H - B - ys(t)} y2={H - B - ys(t)} stroke="var(--color-line)" />
            <text x={L - 6} y={H - B - ys(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-muted)">{fmtInt(t)}</text>
          </g>
        ))}
        {rows.map((r, i) => {
          let y = H - B;
          const x = L + i * bw;
          return (
            <g key={i} onPointerEnter={() => setHover(i)}>
              <rect x={x} y={T} width={bw} height={H - T - B} fill="transparent" />
              {keys.map((k, j) => {
                const h = ys(r[k] ?? 0);
                if (h <= 0) return null;
                y -= h;
                // A 2px surface gap between stacked segments.
                return <rect key={k} x={x + Math.min(2, bw * 0.15)} y={y + 1} width={Math.max(1, bw - Math.min(4, bw * 0.3))} height={Math.max(0, h - 2)} rx={Math.min(3, bw / 4)} fill={SERIES[j % SERIES.length]} opacity={hover == null || hover === i ? 1 : 0.55} />;
              })}
              {((i % step === 0 && rows.length - 1 - i >= step / 2) || i === rows.length - 1) && <text x={i === rows.length - 1 ? x + bw : x + bw / 2} y={H - 6} textAnchor={i === rows.length - 1 ? "end" : "middle"} fontSize="11" fill="var(--color-muted)">{xLabel(r.day)}</text>}
            </g>
          );
        })}
      </svg>
      {hover != null && rows[hover] && (
        <div className="pointer-events-none absolute top-0 z-10 rounded-lg border border-line bg-raised px-2.5 py-1.5 text-xs shadow-lg" style={{ left: `${Math.min(70, ((L + hover * bw) / W) * 100)}%` }}>
          <div className="font-semibold">{xLabel(rows[hover].day)} · {fmtInt(totals[hover])}</div>
          {keys.map((k, j) => (rows[hover][k] ? <div key={k} className="num flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: SERIES[j % SERIES.length] }} />{labels[k] ?? k}: {fmtInt(rows[hover][k])}</div> : null))}
        </div>
      )}
      <Legend items={shown.map((k) => ({ label: labels[k] ?? k, color: SERIES[keys.indexOf(k) % SERIES.length] }))} />
    </figure>
  );
}

/** A ranked list with a bar per row: counts with their share of the total. */
export function BarList({ rows, total, empty = "Nothing yet.", format = fmtInt }: { rows: { key: string; n: number }[]; total?: number; empty?: string; format?: (n: number) => string }) {
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.n));
  const sum = total ?? rows.reduce((s, r) => s + r.n, 0);
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.key} className="relative overflow-hidden rounded-lg" title={`${r.key}: ${format(r.n)} (${fmtPct(sum ? r.n / sum : null)})`}>
          <div className="absolute inset-y-0 left-0 rounded-lg bg-accent/20" style={{ width: `${max ? (r.n / max) * 100 : 0}%` }} />
          <div className="relative flex justify-between gap-3 px-2.5 py-1.5 text-sm">
            <span className="truncate">{r.key}</span>
            <span className="num shrink-0 text-muted">{format(r.n)} <span className="text-faint">· {fmtPct(sum ? r.n / sum : null, 0)}</span></span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Funnel steps: each bar's share of the first step, and the conversion from the step before. */
export function Funnel({ steps }: { steps: { key: string; n: number }[] }) {
  const top = steps[0]?.n ?? 0;
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].n : null;
        return (
          <li key={s.key}>
            <div className="flex justify-between text-sm">
              <span>{s.key}</span>
              <span className="num text-muted">
                {fmtInt(s.n)}
                {prev != null && <span className="text-faint" title="Share of the step before"> · {fmtPct(prev ? s.n / prev : null, 0)} of previous</span>}
              </span>
            </div>
            <div className="mt-1 h-2.5 rounded-full bg-line">
              <div className="h-2.5 rounded-full bg-accent" style={{ width: `${top ? Math.max(1, (s.n / top) * 100) : 0}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Weekly retention cohorts: one hue, darker for higher retention, with the number always shown. */
export function CohortTable({ rows }: { rows: { start: number; size: number; weeks: (number | null)[] }[] }) {
  const id = useId();
  if (!rows.length) return <p className="text-sm text-muted">No installs in the last 12 weeks yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="num w-full min-w-[560px] border-separate border-spacing-[2px] text-xs" aria-describedby={id}>
        <caption id={id} className="sr-only">Share of each week&apos;s installs that used the app again in each later week</caption>
        <thead>
          <tr className="text-muted">
            <th className="px-2 py-1 text-left font-normal">Installed</th>
            <th className="px-2 py-1 text-right font-normal">Installs</th>
            {rows[0].weeks.map((_, k) => <th key={k} className="px-2 py-1 font-normal">W{k}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.start}>
              <td className="px-2 py-1 text-muted">{fmtDay(r.start / DAY)}</td>
              <td className="px-2 py-1 text-right">{fmtInt(r.size)}</td>
              {r.weeks.map((v, k) => (
                <td key={k} className="rounded px-2 py-1 text-center" style={{ background: v == null ? "transparent" : `rgb(57 135 229 / ${0.12 + v * 0.75})`, color: v != null && v > 0.5 ? "#fff" : "var(--color-ink)" }}>
                  {v == null ? "" : fmtPct(v, 0)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Table({ columns, rows, empty = "Nothing yet." }: { columns: string[]; rows: ReactNode[][]; empty?: string }) {
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="num w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            {columns.map((c) => <th key={c} className="px-2 py-1.5 font-normal">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/60">
              {r.map((c, j) => <td key={j} className="px-2 py-1.5 align-top">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
