"use client";

// The public one-rep max calculator (/tools/one-rep-max-calculator/): the app's own estimate (onerm.ts),
// with reps in reserve counted, a reps-to-weight table and every formula's answer. Nothing is stored or sent.
import { useState } from "react";

import { BumpField } from "@/components/app/ui";
import { allFormulas, estimate, MAX_RTF, repTable } from "@/lib/onerm";
import { fill } from "@/lib/siteLang";
import type { Unit } from "@/lib/types";
import { fmtNum, LB } from "@/lib/units";
import type { OneRmUi } from "@/locales/site/tools/types";

const chip = (on: boolean) =>
  `press min-h-11 rounded-full border px-4 text-sm ${on ? "border-accent/70 bg-accent/15 font-medium text-ink" : "border-line bg-surface text-muted"}`;

/** The calculator's words in English; translated pages pass their own (src/locales/site/tools/). */
export const ONERM_EN: OneRmUi = {
  units: "Units",
  weight: "Weight lifted ({unit})",
  weightAria: "weight",
  reps: "Reps",
  repsAria: "reps",
  left: "Reps you had left",
  failure: "0 (failure)",
  leftNote: "Counting the reps you had left makes the estimate much closer.",
  rough: "Estimates past 10 reps to failure are rougher.",
  estimate: "Estimated one-rep max",
  tableCaption: "Weight for each number of reps to failure",
  colReps: "Reps",
  colWeight: "Weight",
  colPct: "% of max",
  formulas: "How each formula sees it",
  formulasNote: "The estimate above averages the formulas that fit {n} reps to failure (marked ✓).",
};

export function OneRmCalculator({ t = ONERM_EN }: { t?: OneRmUi }) {
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
        <div className="flex flex-wrap gap-2" role="group" aria-label={t.units}>
          {(["kg", "lb"] as const).map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={unit === u}
              className={chip(unit === u)}
              onClick={() => {
                setUnit(u);
                setWeight(u === "kg" ? "100" : "225");
              }}
            >
              {u}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="w" className="font-semibold">
            {fill(t.weight, { unit })}
          </label>
          <BumpField
            id="w"
            label={t.weightAria}
            className="mt-2"
            size="lg"
            value={weight}
            onChange={setWeight}
            step={unit === "kg" ? 2.5 : 5}
            start={unit === "kg" ? 100 : 225}
            min={0}
            max={unit === "kg" ? 500 : 1100}
          />
        </div>
        <div>
          <label htmlFor="r" className="font-semibold">
            {t.reps}
          </label>
          <BumpField
            id="r"
            label={t.repsAria}
            className="mt-2"
            size="lg"
            value={reps}
            onChange={setReps}
            step={1}
            start={5}
            min={1}
            max={MAX_RTF}
          />
        </div>
        <div>
          <span className="font-semibold" id="rir-l">
            {t.left}
          </span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="rir-l">
            {[0, 1, 2, 3, 4].map((n) => (
              <button key={n} type="button" aria-pressed={rir === n} className={chip(rir === n)} onClick={() => setRir(n)}>
                {n === 0 ? t.failure : n === 4 ? "4+" : n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">
            {t.leftNote} {r + rir > 10 ? t.rough : ""}
          </p>
        </div>
      </div>
      <div className="card p-5" aria-live="polite">
        <p className="text-sm text-muted">{t.estimate}</p>
        <p className="display mt-1 text-5xl font-extrabold">
          {e1rm > 0 ? fmtNum(round(fromKg(e1rm))) : "–"} <span className="text-2xl text-muted">{unit}</span>
        </p>
        {table.length > 0 && (
          <table className="mt-5 w-full text-sm">
            <caption className="sr-only">{t.tableCaption}</caption>
            <thead>
              <tr className="text-left text-muted">
                <th className="py-1 font-medium">{t.colReps}</th>
                <th className="py-1 font-medium">{t.colWeight}</th>
                <th className="py-1 font-medium">{t.colPct}</th>
              </tr>
            </thead>
            <tbody className="num">
              {table.map((t) => (
                <tr key={t.reps} className="border-t border-line/60">
                  <td className="py-1.5">{t.reps}</td>
                  <td className="py-1.5 font-semibold">
                    {fmtNum(round(fromKg(t.weight)))} {unit}
                  </td>
                  <td className="py-1.5 text-muted">{t.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {e1rm > 0 && (
        <div className="card p-5 md:col-span-2">
          <h2 className="font-semibold">{t.formulas}</h2>
          <p className="mt-1 text-sm text-muted">{fill(t.formulasNote, { n: rtf })}</p>
          <ul className="num mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {formulas.map((f) => (
              <li key={f.id} className="flex justify-between gap-2 rounded-xl border border-line px-3 py-2">
                <span>
                  {f.used ? "✓ " : ""}
                  {f.name} ({f.year})
                </span>
                <span className="font-semibold">{fmtNum(round(fromKg(f.e1rm)))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
