"use client";

// The public plate calculator (/tools/plate-calculator/): the app's own plate solver (plates.ts) and bar
// drawing, with chips and bump buttons instead of typing. Nothing is stored or sent.
import { useState } from "react";

import { BumpField } from "@/components/app/ui";
import { PlateBar } from "@/components/PlateBar";
import { loadBar, nearestLoads } from "@/lib/plates";
import { fill } from "@/lib/siteLang";
import type { Unit } from "@/lib/types";
import { fmtNum } from "@/lib/units";
import type { PlateUi } from "@/locales/site/tools/types";

const chip = (on: boolean) =>
  `press min-h-11 rounded-full border px-4 text-sm ${on ? "border-accent/70 bg-accent/15 font-medium text-ink" : "border-line bg-surface text-muted"}`;
const BARS: Record<Unit, number[]> = { kg: [20, 15, 10], lb: [45, 35, 25] };
/** Plates a typical gym has, in pairs per size; the lifter can switch sizes off. */
const SIZES: Record<Unit, number[]> = { kg: [25, 20, 15, 10, 5, 2.5, 1.25], lb: [45, 35, 25, 10, 5, 2.5] };

/** The calculator's words in English; translated pages pass their own (src/locales/site/tools/). */
export const PLATE_EN: PlateUi = {
  units: "Units",
  weight: "Weight on the bar ({unit})",
  weightAria: "weight",
  bar: "Bar",
  plates: "Plates you have",
  loadThis: "Load this",
  cantMake: "{want} can't be made with these plates. Nearest:",
  eachSide: "Each side: {plates}",
  justBar: "nothing, just the bar",
  closestOne: "Closest you can make: {below}. Going lighter is the safer miss.",
  closestTwo: "Closest you can make: {below} or {above}. Going lighter is the safer miss.",
};

export function PlateCalculator({ t = PLATE_EN }: { t?: PlateUi }) {
  const [unit, setUnit] = useState<Unit>("kg");
  const [bar, setBar] = useState(20);
  const [target, setTarget] = useState("100");
  const [off, setOff] = useState<number[]>([]);
  const switchUnit = (u: Unit) => {
    setUnit(u);
    setBar(BARS[u][0]);
    setTarget(u === "kg" ? "100" : "225");
    setOff([]);
  };
  const plates = SIZES[unit].filter((w) => !off.includes(w)).map((weight) => ({ weight, count: 20 }));
  const want = Number(target) || bar;
  const loading = loadBar(want, bar, plates);
  const near = nearestLoads(want, bar, plates);
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
          <label htmlFor="target" className="font-semibold">
            {fill(t.weight, { unit })}
          </label>
          <BumpField
            id="target"
            label={t.weightAria}
            className="mt-2"
            size="lg"
            value={target}
            onChange={setTarget}
            step={unit === "kg" ? 2.5 : 5}
            start={unit === "kg" ? 100 : 225}
            min={0}
            max={unit === "kg" ? 500 : 1100}
          />
        </div>
        <div>
          <span className="font-semibold" id="bar-l">
            {t.bar}
          </span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="bar-l">
            {BARS[unit].map((b) => (
              <button key={b} type="button" aria-pressed={bar === b} className={chip(bar === b)} onClick={() => setBar(b)}>
                {fmtNum(b)} {unit}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="font-semibold" id="plates-l">
            {t.plates}
          </span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="plates-l">
            {SIZES[unit].map((w) => {
              const on = !off.includes(w);
              return (
                <button
                  key={w}
                  type="button"
                  aria-pressed={on}
                  className={chip(on)}
                  onClick={() => setOff((o) => (on ? [...o, w] : o.filter((x) => x !== w)))}
                >
                  {on ? "✓ " : ""}
                  {fmtNum(w)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="card p-5" aria-live="polite">
        <p className="text-sm text-muted">{loading.exact ? t.loadThis : fill(t.cantMake, { want: `${fmtNum(want)} ${unit}` })}</p>
        <p className="display mt-1 text-5xl font-extrabold">
          {fmtNum(loading.total)} <span className="text-2xl text-muted">{unit}</span>
        </p>
        <div className="mt-4">
          <PlateBar loading={loading} bar={bar} unit={unit} />
        </div>
        <p className="mt-4 font-semibold">
          {fill(t.eachSide, { plates: loading.perSide.length ? loading.perSide.map((w) => fmtNum(w)).join(" + ") : t.justBar })}
        </p>
        {!loading.exact && (
          <p className="mt-2 text-sm text-muted">
            {near.above != null
              ? fill(t.closestTwo, { below: `${fmtNum(near.below)} ${unit}`, above: `${fmtNum(near.above)} ${unit}` })
              : fill(t.closestOne, { below: `${fmtNum(near.below)} ${unit}` })}
          </p>
        )}
      </div>
    </div>
  );
}
