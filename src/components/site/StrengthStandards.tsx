"use client";

// The public strength standards tool (/tools/strength-standards/): one lift against the app's own standards
// (strength.ts), adjusted for body weight, age and sex, with the estimated max at each percentile.
// Nothing is stored or sent.
import { useState } from "react";

import { BumpField } from "@/components/app/ui";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { estimate } from "@/lib/onerm";
import { liftStanding } from "@/lib/strength";
import type { Unit } from "@/lib/types";
import { fmtNum, fromKg, toKg } from "@/lib/units";

import { chip } from "./chip";
import { WARMUP_LIFTS } from "./WarmupCalculator";

export function StrengthStandards() {
  const [unit, setUnit] = useState<Unit>("kg");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [lift, setLift] = useState("bench-press");
  const [bw, setBw] = useState("80");
  const [age, setAge] = useState("30");
  const [weight, setWeight] = useState("80");
  const [reps, setReps] = useState("5");
  const switchUnit = (u: Unit) => {
    setUnit(u);
    setBw(u === "kg" ? "80" : "175");
    setWeight(u === "kg" ? "80" : "185");
  };
  const ex = EXERCISE_BY_ID.get(lift)!;
  const e1rm = estimate(toKg(Number(weight) || 0, unit), Math.max(1, Math.round(Number(reps) || 1)));
  const s = liftStanding(ex, e1rm, toKg(Number(bw) || 0, unit), Number(age) || null, sex);
  const show = (kg: number) => `${fmtNum(Math.round(fromKg(kg, unit)))} ${unit}`;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 [&>*]:min-w-0">
      <div className="card space-y-5 p-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Units and sex">
          {(["kg", "lb"] as const).map((u) => (
            <button key={u} type="button" aria-pressed={unit === u} className={chip(unit === u)} onClick={() => switchUnit(u)}>
              {u}
            </button>
          ))}
          {(["male", "female"] as const).map((x) => (
            <button key={x} type="button" aria-pressed={sex === x} className={chip(sex === x)} onClick={() => setSex(x)}>
              {x === "male" ? "Man" : "Woman"}
            </button>
          ))}
        </div>
        <div>
          <span className="font-semibold" id="lift-l">
            Lift
          </span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="lift-l">
            {WARMUP_LIFTS.map(([id, label]) => (
              <button key={id} type="button" aria-pressed={lift === id} className={chip(lift === id)} onClick={() => setLift(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bw" className="font-semibold">
              Body weight ({unit})
            </label>
            <BumpField
              id="bw"
              label="body weight"
              className="mt-2"
              value={bw}
              onChange={setBw}
              step={unit === "kg" ? 0.5 : 1}
              start={unit === "kg" ? 80 : 175}
              min={0}
              max={unit === "kg" ? 250 : 550}
            />
          </div>
          <div>
            <label htmlFor="age" className="font-semibold">
              Age
            </label>
            <BumpField id="age" label="age" className="mt-2" value={age} onChange={setAge} step={1} start={30} min={14} max={90} />
          </div>
          <div>
            <label htmlFor="weight" className="font-semibold">
              Weight lifted ({unit})
            </label>
            <BumpField
              id="weight"
              label="weight lifted"
              className="mt-2"
              value={weight}
              onChange={setWeight}
              step={unit === "kg" ? 2.5 : 5}
              start={unit === "kg" ? 80 : 185}
              min={0}
              max={unit === "kg" ? 500 : 1100}
            />
          </div>
          <div>
            <label htmlFor="reps" className="font-semibold">
              Reps (to failure)
            </label>
            <BumpField id="reps" label="reps" className="mt-2" value={reps} onChange={setReps} step={1} start={5} min={1} max={20} />
          </div>
        </div>
      </div>
      <div className="card p-5" aria-live="polite">
        <p className="text-sm text-muted">Estimated one-rep max {e1rm > 0 ? show(e1rm) : "–"}</p>
        <p className="display mt-1 text-5xl font-extrabold">{e1rm > 0 ? `${s.percentile}%` : "–"}</p>
        <p className="mt-1 font-semibold">
          {e1rm > 0 ? `Stronger than about ${s.percentile}% of trained lifters like you` : "Enter a set to see where you stand"}
        </p>
        <table className="mt-5 w-full text-left tabular-nums">
          <caption className="pb-2 text-left text-sm text-muted">
            Estimated one-rep max at each percentile, for your body weight, age and sex
          </caption>
          <tbody>
            {s.steps.map((x) => (
              <tr key={x.pct} className="border-t border-line">
                <th scope="row" className="py-2 font-normal text-muted">
                  {x.pct === 50 ? "50th (typical intermediate)" : `${x.pct}th`}
                </th>
                <td className="py-2 text-right font-semibold">{show(x.e1rm)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-sm text-muted">
          An estimate from typical standards, not a ranking of real people. It compares like with like: the same body weight, and adjusted
          for age and sex.
        </p>
      </div>
    </div>
  );
}
