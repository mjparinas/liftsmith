"use client";
// TDEE results and history graph, shared by the app (Tools › TDEE) and the public calculator page.
import { ACTIVITIES, ACTIVITY, bmiBand, type Activity, type TdeeResult } from "@/lib/tdee";
import type { TdeeEvent } from "@/lib/types";
import { haptic } from "@/lib/juice";
import { useEffect, useRef } from "react";

const T = {
  perDay: "calories a day",
  maintenance: "Maintenance",
  bmr: "Resting (BMR)",
  formulaKatch: "Katch-McArdle, from your lean mass",
  formulaMifflin: "Mifflin-St Jeor",
  cut: "Lose about 0.5 kg a week",
  bulk: "Lean bulk, about 0.25 kg a week",
  protein: "Protein",
  bmi: "BMI",
  byActivity: "At each activity level",
  chartEmpty: "Your TDEE is recorded each time your weight, age or training days change. Changes will chart here.",
};

const kcal = (n: number) => n.toLocaleString("en-US");

export function TdeeResults({ r, activity }: { r: TdeeResult; activity: Activity }) {
  return (
    <div>
      <div className="card p-5 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{T.maintenance}</div>
        <div className="num mt-1 text-5xl font-extrabold tracking-tight" data-testid="tdee-value">{kcal(r.tdee)}</div>
        <div className="text-sm text-muted">{T.perDay}</div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-left text-sm">
          <Cell label={T.bmr} value={`${kcal(r.bmr)} kcal`} note={r.formula === "katch" ? T.formulaKatch : T.formulaMifflin} />
          <Cell label={T.bmi} value={String(r.bmi)} note={bmiBand(r.bmi)} />
          <Cell label={T.cut} value={`${kcal(r.cut)} kcal`} />
          <Cell label={T.bulk} value={`${kcal(r.bulk)} kcal`} />
          <Cell label={T.protein} value={`${r.protein[0]}–${r.protein[1]} g`} note="1.6 to 2.2 g per kg" />
        </div>
      </div>
      <h3 className="mt-5 mb-2 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{T.byActivity}</h3>
      <table className="card w-full overflow-hidden text-sm">
        <tbody className="divide-y divide-line">
          {ACTIVITIES.map((a) => (
            <tr key={a} className={a === activity ? "bg-accent/12 font-semibold" : ""} aria-current={a === activity ? "true" : undefined}>
              <th scope="row" className="px-4 py-2.5 text-left font-medium">
                {ACTIVITY[a].label}
                <div className="text-xs font-normal text-muted">{ACTIVITY[a].detail}</div>
              </th>
              <td className="num px-4 py-2.5 text-right">{kcal(r.levels[a])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl bg-raised px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="num font-semibold">{value}</div>
      {note && <div className="text-xs text-faint">{note}</div>}
    </div>
  );
}

/** TDEE over time: one point a day it changed, with the value range and dates on the axes. */
export function TdeeChart({ points, now }: { points: Pick<TdeeEvent, "at" | "kcal">[]; now: number }) {
  if (points.length < 2) return <p className="card p-4 text-sm text-muted">{T.chartEmpty}</p>;
  const w = 320;
  const h = 150;
  const pad = { l: 44, r: 10, t: 12, b: 24 };
  const xs = points.map((p) => p.at);
  const lo0 = Math.min(...points.map((p) => p.kcal));
  const hi0 = Math.max(...points.map((p) => p.kcal));
  const span = Math.max(100, hi0 - lo0);
  const lo = Math.floor((lo0 - span * 0.15) / 50) * 50;
  const hi = Math.ceil((hi0 + span * 0.15) / 50) * 50;
  const t0 = xs[0];
  const t1 = Math.max(now, xs.at(-1)!);
  const x = (t: number) => pad.l + ((t - t0) / Math.max(1, t1 - t0)) * (w - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (h - pad.t - pad.b);
  // A step line: the TDEE holds until the next change, and runs on to today.
  let d = `M${x(points[0].at)},${y(points[0].kcal)}`;
  for (let i = 1; i < points.length; i++) d += ` H${x(points[i].at)} V${y(points[i].kcal)}`;
  d += ` H${x(t1)}`;
  const date = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const mid = Math.round((lo + hi) / 2);
  const first = points[0].kcal;
  const last = points.at(-1)!.kcal;
  return (
    <figure className="card p-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={`TDEE from ${kcal(first)} on ${date(t0)} to ${kcal(last)} now, ${points.length} changes`}>
        {[lo, mid, hi].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeDasharray="3 4" />
            <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="var(--color-faint)" className="num">{kcal(v)}</text>
          </g>
        ))}
        <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p) => (
          <circle key={p.at} cx={x(p.at)} cy={y(p.kcal)} r={3.5} fill="var(--color-accent)">
            <title>{`${date(p.at)}: ${kcal(p.kcal)} kcal`}</title>
          </circle>
        ))}
        <text x={pad.l} y={h - 6} fontSize="10" fill="var(--color-faint)">{date(t0)}</text>
        <text x={w - pad.r} y={h - 6} fontSize="10" fill="var(--color-faint)" textAnchor="end">Today</text>
      </svg>
    </figure>
  );
}

/**
 * A value with big − and + buttons, no typing (Melvin, 2026-11-09: one hand, eyes on the lift).
 * Holding a button repeats, speeding up after a moment. Symmetric, so it suits either hand.
 */
export function Bump({ label, value, onStep, id }: { label: string; value: string; onStep: (dir: 1 | -1, big: boolean) => void; id: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-semibold" id={`${id}-label`}>{label}</span>
      <span className="flex items-center gap-2" role="group" aria-labelledby={`${id}-label`}>
        <HoldButton dir={-1} label={`Less ${label.toLowerCase()}`} onStep={onStep}>−</HoldButton>
        <output id={id} aria-live="polite" className="num min-w-[5.5rem] text-center text-lg font-semibold">{value}</output>
        <HoldButton dir={1} label={`More ${label.toLowerCase()}`} onStep={onStep}>+</HoldButton>
      </span>
    </div>
  );
}

function HoldButton({ dir, label, onStep, children }: { dir: 1 | -1; label: string; onStep: (dir: 1 | -1, big: boolean) => void; children: string }) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const count = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const stop = () => clearTimeout(timer.current);
  const start = () => {
    count.current = 0;
    const tick = () => {
      count.current++;
      onStep(dir, count.current > 8);
      timer.current = setTimeout(tick, count.current > 8 ? 70 : 140);
    };
    timer.current = setTimeout(tick, 420);
  };
  // A plain tap (or Enter) steps once; a hold has already stepped.
  const click = () => {
    if (count.current === 0) {
      haptic("select");
      onStep(dir, false);
    }
    count.current = 0;
  };
  return (
    <button
      type="button"
      aria-label={label}
      className="press grid h-12 w-12 shrink-0 touch-manipulation select-none place-items-center rounded-full border border-line bg-raised text-xl font-bold active:border-accent/60 active:bg-accent/15"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onClick={click}
    >
      {children}
    </button>
  );
}

