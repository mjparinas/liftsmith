"use client";

// The public training max calculator (/tools/training-max-calculator/): four-week waves from a training max,
// the same weeks as the app's Training max waves program (calculators.ts waves, programs.ts WAVES).
// Nothing is stored or sent.
import { useState } from "react";

import { WAVE_WEEKS, waves } from "@/lib/calculators";
import type { Unit } from "@/lib/types";
import { fmtNum } from "@/lib/units";

import { Choice, NumBox } from "./NumBox";

const LIFTS = ["Squat", "Bench press", "Deadlift", "Overhead press"] as const;
const KG = [140, 100, 180, 60];
const LB = [315, 225, 405, 135];
const WEEK = ["Week 1: fives", "Week 2: threes", "Week 3: five, three, one", "Week 4: light week"];

export function TrainingMaxCalculator() {
  const [unit, setUnit] = useState<Unit>("kg");
  const [share, setShare] = useState<"0.9" | "0.85">("0.9");
  const [maxes, setMaxes] = useState(KG);
  const step = unit === "kg" ? 2.5 : 5;
  return (
    <div className="space-y-6">
      <div className="card grid grid-cols-1 gap-5 p-5 md:grid-cols-2 [&>*]:min-w-0">
        <div className="space-y-4">
          <Choice
            label="Units"
            value={unit}
            options={[
              ["kg", "kg"],
              ["lb", "lb"],
            ]}
            onChange={(u) => {
              setUnit(u);
              setMaxes(u === "kg" ? KG : LB);
            }}
          />
          <Choice
            label="Training max"
            value={share}
            options={[
              ["0.9", "90% of max"],
              ["0.85", "85% of max"],
            ]}
            onChange={setShare}
          />
          <p className="text-sm text-muted">
            Start at 90%. If the last set of week 3 doesn&apos;t get its single with reps to spare, use 85%.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {LIFTS.map((name, i) => (
            <NumBox
              key={`${name}-${unit}`}
              id={`max-${i}`}
              label={`${name} max (${unit})`}
              value={maxes[i] ?? 0}
              onChange={(v) => setMaxes((m) => m.map((x, j) => (j === i ? v : x)))}
              step={step}
              min={0}
              max={unit === "kg" ? 500 : 1100}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 [&>*]:min-w-0">
        {LIFTS.map((name, i) => {
          const w = waves(maxes[i] ?? 0, Number(share), step);
          return (
            <div key={name} className="card p-5">
              <h3 className="font-bold">{name}</h3>
              <p className="text-sm text-muted">
                Training max {fmtNum(Math.round(w.tm / step) * step)} {unit}
              </p>
              <table className="num mt-3 w-full text-sm">
                <caption className="sr-only">{name}: four weeks of main sets</caption>
                <tbody className="divide-y divide-line">
                  {w.weeks.map((sets, k) => (
                    <tr key={k}>
                      <th scope="row" className="py-2 pr-2 text-left font-medium">
                        {WEEK[k]}
                      </th>
                      <td className="py-2 text-right">
                        {sets.map((s, j) => (
                          <span key={j} className="block">
                            {fmtNum(s.weight)} {unit} × {s.reps}
                            {s.amrap ? "+" : ""} <span className="text-faint">({Math.round(WAVE_WEEKS[k]!.pcts[j]! * 100)}%)</span>
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-muted">
        &quot;+&quot; means as many clean reps as you can. Add 2.5 kg (5 lb) to the press and bench training maxes and 5 kg (10 lb) to the
        squat and deadlift after each four weeks.
      </p>
    </div>
  );
}
