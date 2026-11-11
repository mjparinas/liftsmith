"use client";

// The public RPE and RIR chart (/tools/rpe-chart/): the weight for every rep count at every effort level,
// from the app's own one-rep max estimate (onerm.ts). Nothing is stored or sent.
import { useState } from "react";

import { BumpField } from "@/components/app/ui";
import { weightForReps } from "@/lib/onerm";
import type { Unit } from "@/lib/types";
import { fmtNum } from "@/lib/units";

import { chip } from "./chip";

/** RPE 10 is no reps left, 9 is one, and so on; half steps mean "maybe one more". */
export const RPES = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5] as const;
export const REPS = [1, 2, 3, 4, 5, 6, 8, 10, 12] as const;

/** Share of the one-rep max for a set of `reps` at an RPE. */
export const rpePct = (reps: number, rpe: number) => weightForReps(100, reps, 10 - rpe) / 100;

export function RpeChart() {
  const [unit, setUnit] = useState<Unit>("kg");
  const [max, setMax] = useState("140");
  const [pct, setPct] = useState(false);
  const m = Math.max(0, Number(max) || 0);
  const round = (n: number) => (unit === "kg" ? Math.round(n / 2.5) * 2.5 : Math.round(n / 5) * 5);
  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-end gap-6 p-5">
        <div>
          <label htmlFor="max" className="font-semibold">
            Your one-rep max ({unit})
          </label>
          <BumpField
            id="max"
            label="one-rep max"
            className="mt-2"
            size="lg"
            value={max}
            onChange={setMax}
            step={unit === "kg" ? 2.5 : 5}
            start={unit === "kg" ? 140 : 315}
            min={0}
            max={unit === "kg" ? 500 : 1100}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
          {(["kg", "lb"] as const).map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={!pct && unit === u}
              className={chip(!pct && unit === u)}
              onClick={() => {
                setPct(false);
                if (u !== unit) {
                  setUnit(u);
                  setMax(u === "kg" ? "140" : "315");
                }
              }}
            >
              {u}
            </button>
          ))}
          <button type="button" aria-pressed={pct} className={chip(pct)} onClick={() => setPct(true)}>
            % of max
          </button>
        </div>
      </div>
      <div className="card overflow-x-auto p-2" aria-live="polite" role="region" aria-label="RPE chart" tabIndex={0}>
        <table className="w-full min-w-[34rem] text-right tabular-nums">
          <caption className="p-3 text-left text-sm text-muted">
            {pct ? "Share of your one-rep max" : `Weight in ${unit}, rounded to the nearest ${unit === "kg" ? "2.5" : "5"}`} for each set
            (rows: reps; columns: RPE, with reps in reserve under it).
          </caption>
          <thead>
            <tr className="text-sm">
              <th scope="col" className="p-2 text-left">
                Reps
              </th>
              {RPES.map((r) => (
                <th key={r} scope="col" className="p-2">
                  RPE {fmtNum(r)}
                  <span className="block text-xs font-normal text-muted">{fmtNum(10 - r)} RIR</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REPS.map((reps) => (
              <tr key={reps} className="border-t border-line">
                <th scope="row" className="p-2 text-left">
                  {reps}
                </th>
                {RPES.map((r) => (
                  <td key={r} className="p-2">
                    {pct ? `${Math.round(rpePct(reps, r) * 100)}%` : fmtNum(round(m * rpePct(reps, r)))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
