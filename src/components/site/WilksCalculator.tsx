"use client";

// The public Wilks and IPF GL calculator (/tools/wilks-calculator/): the app's own formulas (calculators.ts,
// DOTS from onerm.ts) for a squat, bench and deadlift total at a body weight. Nothing is stored or sent.
import { useState } from "react";

import { ipfGl, nextDotsLevel, totalFor, wilks, type GlEvent, type Sex } from "@/lib/calculators";
import { dots } from "@/lib/onerm";
import type { Unit } from "@/lib/types";
import { fmtNum, fromKg, toKg } from "@/lib/units";

import { dotsLevel } from "./DotsCalculator";
import { Choice, NumBox } from "./NumBox";

const KG = { bw: 80, lifts: [140, 100, 180] };
const LB = { bw: 175, lifts: [315, 225, 405] };

export function WilksCalculator() {
  const [unit, setUnit] = useState<Unit>("kg");
  const [sex, setSex] = useState<Sex>("male");
  const [gear, setGear] = useState<"classic" | "equipped">("classic");
  const [bw, setBw] = useState(KG.bw);
  const [lifts, setLifts] = useState(KG.lifts);
  const switchUnit = (u: Unit) => {
    setUnit(u);
    const d = u === "kg" ? KG : LB;
    setBw(d.bw);
    setLifts(d.lifts);
  };
  const totalKg = toKg(
    lifts.reduce((s, x) => s + x, 0),
    unit,
  );
  const bwKg = toKg(bw, unit);
  const w = wilks(totalKg, bwKg, sex);
  const gl = ipfGl(totalKg, bwKg, sex, gear as GlEvent);
  const d = dots(totalKg, bwKg, sex);
  const next = nextDotsLevel(d);
  const gap = next !== null ? totalFor(next, bwKg, (t, b) => dots(t, b, sex)) - totalKg : 0;
  const step = unit === "kg" ? 2.5 : 5;
  const round = (kg: number) => Math.max(step, Math.ceil(fromKg(kg, unit) / step) * step);
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 [&>*]:min-w-0">
      <div className="card space-y-5 p-5">
        <Choice
          label="Units"
          value={unit}
          options={[
            ["kg", "kg"],
            ["lb", "lb"],
          ]}
          onChange={switchUnit}
        />
        <Choice
          label="Formula"
          value={sex}
          options={[
            ["male", "Men's formula"],
            ["female", "Women's formula"],
          ]}
          onChange={setSex}
        />
        <Choice
          label="Gear"
          value={gear}
          options={[
            ["classic", "Classic (raw)"],
            ["equipped", "Equipped"],
          ]}
          onChange={setGear}
        />
        <NumBox
          key={`bw-${unit}`}
          id="bw"
          label={`Body weight (${unit})`}
          value={bw}
          onChange={setBw}
          step={unit === "kg" ? 0.5 : 1}
          min={30}
          max={unit === "kg" ? 250 : 550}
        />
        {(["Squat", "Bench press", "Deadlift"] as const).map((name, i) => (
          <NumBox
            key={`${name}-${unit}`}
            id={`lift-${i}`}
            label={`${name} (${unit})`}
            value={lifts[i] ?? 0}
            onChange={(v) => setLifts((l) => l.map((x, j) => (j === i ? v : x)))}
            step={step}
            min={0}
            max={unit === "kg" ? 500 : 1100}
          />
        ))}
      </div>
      <div className="card p-5" aria-live="polite">
        <p className="text-sm text-muted">
          Total {fmtNum(lifts.reduce((s, x) => s + x, 0))} {unit}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {[
            ["Wilks", w],
            ["IPF GL", gl],
            ["DOTS", d],
          ].map(([name, v]) => (
            <div key={name as string}>
              <p className="display text-3xl font-extrabold md:text-4xl">{(v as number) > 0 ? (v as number).toFixed(1) : "–"}</p>
              <p className="font-semibold">{name}</p>
            </div>
          ))}
        </div>
        {d > 0 && (
          <p className="mt-4 text-sm">
            DOTS level: <span className="font-semibold">{dotsLevel(d)}</span>.{" "}
            {next !== null
              ? `Add about ${fmtNum(round(gap))} ${unit} to your total to reach ${dotsLevel(next)} (DOTS ${next}).`
              : "That's an elite total."}
          </p>
        )}
        <p className="mt-4 text-sm text-muted">
          Wilks and DOTS don&apos;t change with gear. IPF GL has separate formulas for classic and equipped lifting, so pick the one you
          lift in.
        </p>
      </div>
    </div>
  );
}
