"use client";
// The public one-rep max calculator (/tools/one-rep-max-calculator/): the app's own estimate (onerm.ts),
// with reps in reserve counted, a reps-to-weight table and every formula's answer. Nothing is stored or sent.
import { useState } from "react";
import { BumpField } from "@/components/app/ui";
import { allFormulas, estimate, MAX_RTF, repTable } from "@/lib/onerm";
import type { Unit } from "@/lib/types";
import { fmtNum, LB } from "@/lib/units";

const chip = (on: boolean) => `press min-h-11 rounded-full border px-4 text-sm ${on ? "border-accent/70 bg-accent/15 font-medium text-ink" : "border-line bg-surface text-muted"}`;

export function OneRmCalculator() {
  const [unit, setUnit] = useState<Unit>("kg");
  const [weight, setWeight] = useState("100");
  const [reps, setReps] = useState("5");
  const [rir, setRir] = useState(0);
  const toKg = (n: number) => (unit === "kg" ? n : n * LB);
  const fromKg = (n: number) => (unit === "kg" ? n : n / LB);
  const round = (n: number) => (unit === "kg" ? Math.round(n * 2) / 2 : Math.round(n));
  const w = Math.max(0, Number(weight) || 0);
  const r = Math.min(MAX_RTF, Math.max(1, Math.round(Number(reps) || 1)));
  const rtf = Math.min(MAX_RTF, r + rir);
  const kg = toKg(w);
  const e1rm = estimate(kg, rtf);
  const table = e1rm > 0 ? repTable(e1rm, 12) : [];
  const formulas = allFormulas(kg, rtf);
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 [&>*]:min-w-0">
      <div className="card space-y-5 p-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Units">
          {(["kg", "lb"] as const).map((u) => <button key={u} type="button" aria-pressed={unit === u} className={chip(unit === u)} onClick={() => { setUnit(u); setWeight(u === "kg" ? "100" : "225"); }}>{u}</button>)}
        </div>
        <div>
          <label htmlFor="w" className="font-semibold">Weight lifted ({unit})</label>
          <BumpField id="w" label="weight" className="mt-2" size="lg" value={weight} onChange={setWeight} step={unit === "kg" ? 2.5 : 5} start={unit === "kg" ? 100 : 225} min={0} max={unit === "kg" ? 500 : 1100} />
        </div>
        <div>
          <label htmlFor="r" className="font-semibold">Reps</label>
          <BumpField id="r" label="reps" className="mt-2" size="lg" value={reps} onChange={setReps} step={1} start={5} min={1} max={MAX_RTF} />
        </div>
        <div>
          <span className="font-semibold" id="rir-l">Reps you had left</span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="rir-l">
            {[0, 1, 2, 3, 4].map((n) => <button key={n} type="button" aria-pressed={rir === n} className={chip(rir === n)} onClick={() => setRir(n)}>{n === 0 ? "0 (failure)" : n === 4 ? "4+" : n}</button>)}
          </div>
          <p className="mt-2 text-sm text-muted">Counting the reps you had left makes the estimate much closer. {r + rir > 10 ? "Estimates past 10 reps to failure are rougher." : ""}</p>
        </div>
      </div>
      <div className="card p-5" aria-live="polite">
        <p className="text-sm text-muted">Estimated one-rep max</p>
        <p className="display mt-1 text-5xl font-extrabold">{e1rm > 0 ? fmtNum(round(fromKg(e1rm))) : "–"} <span className="text-2xl text-muted">{unit}</span></p>
        {table.length > 0 && (
          <table className="mt-5 w-full text-sm">
            <caption className="sr-only">Weight for each number of reps to failure</caption>
            <thead><tr className="text-left text-muted"><th className="py-1 font-medium">Reps</th><th className="py-1 font-medium">Weight</th><th className="py-1 font-medium">% of max</th></tr></thead>
            <tbody className="num">
              {table.map((t) => <tr key={t.reps} className="border-t border-line/60"><td className="py-1.5">{t.reps}</td><td className="py-1.5 font-semibold">{fmtNum(round(fromKg(t.weight)))} {unit}</td><td className="py-1.5 text-muted">{t.pct}%</td></tr>)}
            </tbody>
          </table>
        )}
      </div>
      {e1rm > 0 && (
        <div className="card p-5 md:col-span-2">
          <h2 className="font-semibold">How each formula sees it</h2>
          <p className="mt-1 text-sm text-muted">The estimate above averages the formulas that fit {rtf} reps to failure (marked ✓).</p>
          <ul className="num mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {formulas.map((f) => <li key={f.id} className="flex justify-between gap-2 rounded-xl border border-line px-3 py-2"><span>{f.used ? "✓ " : ""}{f.name} ({f.year})</span><span className="font-semibold">{fmtNum(round(fromKg(f.e1rm)))}</span></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
