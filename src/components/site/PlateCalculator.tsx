"use client";
// The public plate calculator (/tools/plate-calculator/): the app's own plate solver (plates.ts) and bar
// drawing, with chips and bump buttons instead of typing. Nothing is stored or sent.
import { useState } from "react";
import { PlateBar } from "@/components/PlateBar";
import { BumpField } from "@/components/app/ui";
import { loadBar, nearestLoads } from "@/lib/plates";
import type { Unit } from "@/lib/types";
import { fmtNum } from "@/lib/units";

const chip = (on: boolean) => `press min-h-11 rounded-full border px-4 text-sm ${on ? "border-accent/70 bg-accent/15 font-medium text-ink" : "border-line bg-surface text-muted"}`;
const BARS: Record<Unit, number[]> = { kg: [20, 15, 10], lb: [45, 35, 25] };
/** Plates a typical gym has, in pairs per size; the lifter can switch sizes off. */
const SIZES: Record<Unit, number[]> = { kg: [25, 20, 15, 10, 5, 2.5, 1.25], lb: [45, 35, 25, 10, 5, 2.5] };

export function PlateCalculator() {
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
        <div className="flex flex-wrap gap-2" role="group" aria-label="Units">
          {(["kg", "lb"] as const).map((u) => <button key={u} type="button" aria-pressed={unit === u} className={chip(unit === u)} onClick={() => switchUnit(u)}>{u}</button>)}
        </div>
        <div>
          <label htmlFor="target" className="font-semibold">Weight on the bar ({unit})</label>
          <BumpField id="target" label="weight" className="mt-2" size="lg" value={target} onChange={setTarget} step={unit === "kg" ? 2.5 : 5} start={unit === "kg" ? 100 : 225} min={0} max={unit === "kg" ? 500 : 1100} />
        </div>
        <div>
          <span className="font-semibold" id="bar-l">Bar</span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="bar-l">
            {BARS[unit].map((b) => <button key={b} type="button" aria-pressed={bar === b} className={chip(bar === b)} onClick={() => setBar(b)}>{fmtNum(b)} {unit}</button>)}
          </div>
        </div>
        <div>
          <span className="font-semibold" id="plates-l">Plates you have</span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="plates-l">
            {SIZES[unit].map((w) => {
              const on = !off.includes(w);
              return <button key={w} type="button" aria-pressed={on} className={chip(on)} onClick={() => setOff((o) => (on ? [...o, w] : o.filter((x) => x !== w)))}>{on ? "✓ " : ""}{fmtNum(w)}</button>;
            })}
          </div>
        </div>
      </div>
      <div className="card p-5" aria-live="polite">
        <p className="text-sm text-muted">{loading.exact ? "Load this" : `${fmtNum(want)} ${unit} can't be made with these plates. Nearest:`}</p>
        <p className="display mt-1 text-5xl font-extrabold">{fmtNum(loading.total)} <span className="text-2xl text-muted">{unit}</span></p>
        <div className="mt-4"><PlateBar loading={loading} bar={bar} unit={unit} /></div>
        <p className="mt-4 font-semibold">{`Each side: ${loading.perSide.length ? loading.perSide.map((w) => fmtNum(w)).join(" + ") : "nothing, just the bar"}`}</p>
        {!loading.exact && (
          <p className="mt-2 text-sm text-muted">Closest you can make: {fmtNum(near.below)} {unit}{near.above != null ? ` or ${fmtNum(near.above)} ${unit}` : ""}. Going lighter is the safer miss.</p>
        )}
      </div>
    </div>
  );
}
