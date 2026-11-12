"use client";

// The public warm-up calculator (/tools/warm-up-calculator/): the app's own warm-up ramp (warmup.ts) for a
// barbell lift, with the plates for each side of every set. Nothing is stored or sent.
import { useState } from "react";

import { BumpField } from "@/components/app/ui";
import { makeGym } from "@/lib/defaults";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { loadBar } from "@/lib/plates";
import { fill } from "@/lib/siteLang";
import type { Unit } from "@/lib/types";
import { fmtNum, fromKg, toKg } from "@/lib/units";
import { WARMUP_REST, warmupFor } from "@/lib/warmup";
import type { WarmupUi } from "@/locales/site/tools/types";

import { chip } from "./chip";

/** The barbell lifts the calculator offers, by exercise id. */
export const WARMUP_LIFTS: [id: string, label: string][] = [
  ["back-squat", "Squat"],
  ["bench-press", "Bench press"],
  ["deadlift", "Deadlift"],
  ["overhead-press", "Overhead press"],
  ["barbell-row", "Barbell row"],
];

/** The calculator's words in English; translated pages pass their own (src/locales/site/tools/). */
export const WARMUP_EN: WarmupUi = {
  units: "Units",
  lift: "Lift",
  lifts: Object.fromEntries(WARMUP_LIFTS),
  work: "Working weight ({unit})",
  workAria: "working weight",
  setsOne: "{n} warm-up set, {rest} s rest after each",
  setsMany: "{n} warm-up sets, {rest} s rest after each",
  none: "No warm-up sets needed at this weight",
  working: "{weight}: your working sets",
  eachSide: "Each side: {plates}",
  empty: "Empty bar",
};

export function WarmupCalculator({ t = WARMUP_EN }: { t?: WarmupUi }) {
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
        <div className="flex flex-wrap gap-2" role="group" aria-label={t.units}>
          {(["kg", "lb"] as const).map((u) => (
            <button key={u} type="button" aria-pressed={unit === u} className={chip(unit === u)} onClick={() => switchUnit(u)}>
              {u}
            </button>
          ))}
        </div>
        <div>
          <span className="font-semibold" id="lift-l">
            {t.lift}
          </span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="lift-l">
            {WARMUP_LIFTS.map(([id]) => (
              <button key={id} type="button" aria-pressed={lift === id} className={chip(lift === id)} onClick={() => setLift(id)}>
                {t.lifts[id]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="work" className="font-semibold">
            {fill(t.work, { unit })}
          </label>
          <BumpField
            id="work"
            label={t.workAria}
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
          {sets.length ? fill(sets.length === 1 ? t.setsOne : t.setsMany, { n: sets.length, rest: WARMUP_REST }) : t.none}
        </p>
        <ol className="mt-3 divide-y divide-line">
          {rows.map((r, i) => {
            const w = Math.round(fromKg(r.weight, unit) * 100) / 100;
            const side = loadBar(Math.max(w, bar), bar, gym.plates).perSide;
            return (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                <span className={r.warm ? "font-semibold" : "font-bold text-accent"}>
                  {r.warm ? `${fmtNum(w)} ${unit} × ${r.reps}` : fill(t.working, { weight: `${fmtNum(w)} ${unit}` })}
                </span>
                <span className="text-sm text-muted">
                  {side.length ? fill(t.eachSide, { plates: side.map((p) => fmtNum(p)).join(" + ") }) : t.empty}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
