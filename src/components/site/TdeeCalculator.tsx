"use client";
// The public TDEE calculator (/tools/tdee-calculator/). Same engine and results as the app, with
// bump buttons and chips instead of typing. Nothing is stored or sent.
import { Bump, TdeeResults } from "@/components/Tdee";
import { ACTIVITIES, ACTIVITY, calcTdee, type Activity, type Sex } from "@/lib/tdee";
import { LB } from "@/lib/units";
import { useState } from "react";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const chip = (on: boolean) => `press min-h-11 rounded-full border px-4 text-sm ${on ? "border-accent/70 bg-accent/15 font-medium text-ink" : "border-line bg-surface text-muted"}`;

export function TdeeCalculator() {
  const [metric, setMetric] = useState(true);
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(30);
  const [kg, setKg] = useState(80);
  const [cm, setCm] = useState(178);
  const [fat, setFat] = useState<number | undefined>(undefined);
  const [activity, setActivity] = useState<Activity>("moderate");
  const r = calcTdee({ sex, age, kg, cm, activity, bodyFat: fat });
  const inches = Math.round(cm / 2.54);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card space-y-4 p-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Units">
          <button type="button" aria-pressed={metric} className={chip(metric)} onClick={() => setMetric(true)}>Metric</button>
          <button type="button" aria-pressed={!metric} className={chip(!metric)} onClick={() => setMetric(false)}>Imperial</button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold" id="sex-l">Sex</span>
          <div className="flex gap-2" role="group" aria-labelledby="sex-l">
            {(["female", "male"] as const).map((s) => <button key={s} type="button" aria-pressed={sex === s} className={chip(sex === s)} onClick={() => setSex(s)}>{s === "female" ? "Female" : "Male"}</button>)}
          </div>
        </div>
        <Bump id="age" label="Age" value={String(age)} onStep={(d, big) => setAge((a) => clamp(a + d * (big ? 5 : 1), 13, 100))} />
        <Bump id="weight" label="Weight" value={metric ? `${Math.round(kg * 10) / 10} kg` : `${Math.round(kg / LB)} lb`} onStep={(d, big) => setKg((k) => Math.round(clamp(k + d * (metric ? (big ? 2 : 0.5) : (big ? 5 : 1) * LB), 25, 350) * 100) / 100)} />
        <Bump id="height" label="Height" value={metric ? `${Math.round(cm)} cm` : `${Math.floor(inches / 12)}′ ${inches % 12}″`} onStep={(d, big) => setCm((c) => clamp(c + d * (metric ? 1 : 2.54) * (big ? 5 : 1), 100, 250))} />
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold" id="fat-l">Body fat (optional)</span>
          <div className="flex gap-2" role="group" aria-labelledby="fat-l">
            <button type="button" aria-pressed={fat === undefined} className={chip(fat === undefined)} onClick={() => setFat(undefined)}>Skip</button>
            <button type="button" aria-pressed={fat !== undefined} className={chip(fat !== undefined)} onClick={() => setFat((f) => f ?? (sex === "female" ? 25 : 18))}>Add</button>
          </div>
        </div>
        {fat !== undefined && <Bump id="fat" label="Body fat" value={`${fat}%`} onStep={(d, big) => setFat((f) => clamp((f ?? 20) + d * (big ? 2 : 0.5), 3, 60))} />}
        <div>
          <span className="font-semibold" id="act-l">Activity</span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="act-l">
            {ACTIVITIES.map((a) => <button key={a} type="button" aria-pressed={activity === a} className={chip(activity === a)} onClick={() => setActivity(a)}>{ACTIVITY[a].label}</button>)}
          </div>
          <p className="mt-2 text-sm text-muted">{ACTIVITY[activity].detail}</p>
        </div>
      </div>
      <TdeeResults r={r} activity={activity} />
    </div>
  );
}
