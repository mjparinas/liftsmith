"use client";

// The public Wilks and IPF GL calculator (/tools/wilks-calculator/): the app's own formulas (calculators.ts,
// DOTS from onerm.ts) for a squat, bench and deadlift total at a body weight. Nothing is stored or sent.
import { useState } from "react";

import { ipfGl, nextDotsLevel, totalFor, wilks, type GlEvent, type Sex } from "@/lib/calculators";
import { dots } from "@/lib/onerm";
import { fill } from "@/lib/siteLang";
import type { Unit } from "@/lib/types";
import { fmtNum, fromKg, toKg } from "@/lib/units";
import type { WilksUi } from "@/locales/site/tools/types";

import { DOTS_LEVELS_EN, dotsBand } from "./DotsCalculator";
import { Choice, NumBox } from "./NumBox";

/** The calculator's words in English; translated pages pass their own (src/locales/site/tools/). */
export const WILKS_EN: WilksUi = {
  units: "Units",
  formula: "Formula",
  men: "Men's formula",
  women: "Women's formula",
  gear: "Gear",
  classic: "Classic (raw)",
  equipped: "Equipped",
  bw: "Body weight ({unit})",
  squat: "Squat",
  bench: "Bench press",
  deadlift: "Deadlift",
  liftLabel: "{lift} ({unit})",
  total: "Total {total} {unit}",
  level: "DOTS level: {level}.",
  next: "Add about {weight} {unit} to your total to reach {level} (DOTS {score}).",
  elite: "That's an elite total.",
  note: "Wilks and DOTS don't change with gear. IPF GL has separate formulas for classic and equipped lifting, so pick the one you lift in.",
  levels: DOTS_LEVELS_EN,
};

const KG = { bw: 80, lifts: [140, 100, 180] };
const LB = { bw: 175, lifts: [315, 225, 405] };

export function WilksCalculator({ t = WILKS_EN }: { t?: WilksUi }) {
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
  const aria = (label: string) => (t === WILKS_EN ? undefined : label);
  const round = (kg: number) => Math.max(step, Math.ceil(fromKg(kg, unit) / step) * step);
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 [&>*]:min-w-0">
      <div className="card space-y-5 p-5">
        <Choice
          label={t.units}
          value={unit}
          options={[
            ["kg", "kg"],
            ["lb", "lb"],
          ]}
          onChange={switchUnit}
        />
        <Choice
          label={t.formula}
          value={sex}
          options={[
            ["male", t.men],
            ["female", t.women],
          ]}
          onChange={setSex}
        />
        <Choice
          label={t.gear}
          value={gear}
          options={[
            ["classic", t.classic],
            ["equipped", t.equipped],
          ]}
          onChange={setGear}
        />
        <NumBox
          key={`bw-${unit}`}
          id="bw"
          label={fill(t.bw, { unit })}
          aria={aria(fill(t.bw, { unit }))}
          value={bw}
          onChange={setBw}
          step={unit === "kg" ? 0.5 : 1}
          min={30}
          max={unit === "kg" ? 250 : 550}
        />
        {[t.squat, t.bench, t.deadlift].map((name, i) => (
          <NumBox
            key={`${i}-${unit}`}
            id={`lift-${i}`}
            label={fill(t.liftLabel, { lift: name, unit })}
            aria={aria(name)}
            value={lifts[i] ?? 0}
            onChange={(v) => setLifts((l) => l.map((x, j) => (j === i ? v : x)))}
            step={step}
            min={0}
            max={unit === "kg" ? 500 : 1100}
          />
        ))}
      </div>
      <div className="card p-5" aria-live="polite">
        <p className="text-sm text-muted">{fill(t.total, { total: fmtNum(lifts.reduce((s, x) => s + x, 0)), unit })}</p>
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
            {fill(t.level, { level: t.levels[dotsBand(d)] })}{" "}
            {next !== null ? fill(t.next, { weight: fmtNum(round(gap)), unit, level: t.levels[dotsBand(next)], score: next }) : t.elite}
          </p>
        )}
        <p className="mt-4 text-sm text-muted">{t.note}</p>
      </div>
    </div>
  );
}
