"use client";

// The public TDEE calculator (/tools/tdee-calculator/). Same engine and results as the app, with
// bump buttons and chips instead of typing. Nothing is stored or sent.
import { useState, type ReactNode } from "react";

import { BumpField } from "@/components/app/ui";
import { TdeeResults } from "@/components/Tdee";
import { ACTIVITIES, ACTIVITY, calcTdee, type Activity, type Sex } from "@/lib/tdee";
import { LB } from "@/lib/units";

const chip = (on: boolean) =>
  `press min-h-11 rounded-full border px-4 text-sm ${on ? "border-accent/70 bg-accent/15 font-medium text-ink" : "border-line bg-surface text-muted"}`;

export function TdeeCalculator() {
  const [metric, setMetric] = useState(true);
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(30);
  const [kg, setKg] = useState(80);
  const [cm, setCm] = useState(178);
  const [fat, setFat] = useState<number | undefined>(undefined);
  const [activity, setActivity] = useState<Activity>("moderate");
  // What's in each box. A value only counts once it's in range, so typing "1" on the way to "18" doesn't
  // jump anywhere; the result keeps the last valid number meanwhile.
  const [draft, setDraft] = useState<Record<string, string>>({});
  const box = (key: string, shown: number, lo: number, hi: number, set: (n: number) => void) => ({
    value: draft[key] ?? String(shown),
    onChange: (v: string) => {
      setDraft((d) => ({ ...d, [key]: v }));
      const n = Number(v);
      if (v && n >= lo && n <= hi) set(n);
    },
  });
  const r = calcTdee({ sex, age, kg, cm, activity, bodyFat: fat });
  const inches = Math.round(cm / 2.54);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card space-y-4 p-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Units">
          <button
            type="button"
            aria-pressed={metric}
            className={chip(metric)}
            onClick={() => {
              setMetric(true);
              setDraft({});
            }}
          >
            Metric
          </button>
          <button
            type="button"
            aria-pressed={!metric}
            className={chip(!metric)}
            onClick={() => {
              setMetric(false);
              setDraft({});
            }}
          >
            Imperial
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold" id="sex-l">
            Sex
          </span>
          <div className="flex gap-2" role="group" aria-labelledby="sex-l">
            {(["female", "male"] as const).map((s) => (
              <button key={s} type="button" aria-pressed={sex === s} className={chip(sex === s)} onClick={() => setSex(s)}>
                {s === "female" ? "Female" : "Male"}
              </button>
            ))}
          </div>
        </div>
        <Row id="age" label="Age">
          <BumpField id="age" label="age" {...box("age", age, 13, 100, setAge)} step={1} start={30} min={13} max={100} />
        </Row>
        <Row id="weight" label={metric ? "Weight (kg)" : "Weight (lb)"}>
          <BumpField
            id="weight"
            label="weight"
            {...box("w", metric ? Math.round(kg * 10) / 10 : Math.round(kg / LB), metric ? 25 : 55, metric ? 350 : 770, (n) =>
              setKg(metric ? n : n * LB),
            )}
            step={metric ? 0.5 : 1}
            start={metric ? 80 : 175}
            min={metric ? 25 : 55}
            max={metric ? 350 : 770}
          />
        </Row>
        <Row id="height" label={metric ? "Height (cm)" : "Height (in)"}>
          <BumpField
            id="height"
            label="height"
            {...box("h", metric ? Math.round(cm) : inches, metric ? 100 : 40, metric ? 250 : 98, (n) => setCm(metric ? n : n * 2.54))}
            step={1}
            start={metric ? 178 : 70}
            min={metric ? 100 : 40}
            max={metric ? 250 : 98}
          />
        </Row>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold" id="fat-l">
            Body fat (optional)
          </span>
          <div className="flex gap-2" role="group" aria-labelledby="fat-l">
            <button type="button" aria-pressed={fat === undefined} className={chip(fat === undefined)} onClick={() => setFat(undefined)}>
              Skip
            </button>
            <button
              type="button"
              aria-pressed={fat !== undefined}
              className={chip(fat !== undefined)}
              onClick={() => setFat((f) => f ?? (sex === "female" ? 25 : 18))}
            >
              Add
            </button>
          </div>
        </div>
        {fat !== undefined && (
          <Row id="fat" label="Body fat (%)">
            <BumpField id="fat" label="body fat" {...box("fat", fat ?? 20, 3, 60, setFat)} step={0.5} start={20} min={3} max={60} />
          </Row>
        )}
        <div>
          <span className="font-semibold" id="act-l">
            Activity
          </span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="act-l">
            {ACTIVITIES.map((a) => (
              <button key={a} type="button" aria-pressed={activity === a} className={chip(activity === a)} onClick={() => setActivity(a)}>
                {ACTIVITY[a].label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">{ACTIVITY[activity].detail}</p>
        </div>
      </div>
      <TdeeResults r={r} activity={activity} />
    </div>
  );
}

function Row({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="shrink-0 font-semibold">
        {label}
      </label>
      <div className="w-48 max-w-[60%]">{children}</div>
    </div>
  );
}
