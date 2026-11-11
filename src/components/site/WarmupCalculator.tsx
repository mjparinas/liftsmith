"use client";

// The public warm-up calculator (/tools/warm-up-calculator/): the app's own warm-up ramp (warmup.ts) for a
// barbell lift, with the plates for each side of every set. Nothing is stored or sent.
import { useState } from "react";

import { BumpField } from "@/components/app/ui";
import { makeGym } from "@/lib/defaults";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { loadBar } from "@/lib/plates";
import type { Unit } from "@/lib/types";
import { fmtNum, fromKg, toKg } from "@/lib/units";
import { WARMUP_REST, warmupFor } from "@/lib/warmup";

import { chip } from "./chip";

/** The barbell lifts the calculator offers, by exercise id. */
export const WARMUP_LIFTS: [id: string, label: string][] = [
  ["back-squat", "Squat"],
  ["bench-press", "Bench press"],
  ["deadlift", "Deadlift"],
  ["overhead-press", "Overhead press"],
  ["barbell-row", "Barbell row"],
];

export function WarmupCalculator() {
  const [unit, setUnit] = useState<Unit>("kg");
  const [lift, setLift] = useState("back-squat");
  const [weight, setWeight] = useState("100");
  const gym = makeGym("commercial", unit, "tool");
  const ex = EXERCISE_BY_ID.get(lift)!;
  const work = Math.max(0, Number(weight) || 0);
  const kg = toKg(work, unit);
  const bar = gym.bars.find((b) => b.id === "olympic")?.weight ?? (unit === "kg" ? 20 : 45);
  const sets = warmupFor(ex, kg, gym, new Set());
  const rows = [...sets.map((s) => ({ ...s, warm: true })), { weight: kg, reps: 0, warm: false }];
  const switchUnit = (u: Unit) => {
    setUnit(u);
    setWeight(u === "kg" ? "100" : "225");
  };
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 [&>*]:min-w-0">
      <div className="card space-y-5 p-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Units">
          {(["kg", "lb"] as const).map((u) => (
            <button key={u} type="button" aria-pressed={unit === u} className={chip(unit === u)} onClick={() => switchUnit(u)}>
              {u}
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
        <div>
          <label htmlFor="work" className="font-semibold">
            Working weight ({unit})
          </label>
          <BumpField
            id="work"
            label="working weight"
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
      </div>
      <div className="card p-5" aria-live="polite">
        <p className="text-sm text-muted">
          {sets.length
            ? `${sets.length} warm-up set${sets.length === 1 ? "" : "s"}, ${WARMUP_REST} s rest after each`
            : "No warm-up sets needed at this weight"}
        </p>
        <ol className="mt-3 divide-y divide-line">
          {rows.map((r, i) => {
            const w = Math.round(fromKg(r.weight, unit) * 100) / 100;
            const side = loadBar(Math.max(w, bar), bar, gym.plates).perSide;
            return (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                <span className={r.warm ? "font-semibold" : "font-bold text-accent"}>
                  {r.warm ? `${fmtNum(w)} ${unit} × ${r.reps}` : `${fmtNum(w)} ${unit}: your working sets`}
                </span>
                <span className="text-sm text-muted">
                  {side.length ? `Each side: ${side.map((p) => fmtNum(p)).join(" + ")}` : "Empty bar"}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
