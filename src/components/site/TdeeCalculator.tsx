"use client";

// The public TDEE calculator (/tools/tdee-calculator/). Same engine and results as the app, with
// bump buttons and chips instead of typing. Nothing is stored or sent.
import { useState, type ReactNode } from "react";

import { BumpField } from "@/components/app/ui";
import { TdeeResults, type Say } from "@/components/Tdee";
import { fill } from "@/lib/siteLang";
import { ACTIVITIES, ACTIVITY, calcTdee, type Activity, type Sex } from "@/lib/tdee";
import { LB } from "@/lib/units";
import type { TdeeUi } from "@/locales/site/tools/types";

const chip = (on: boolean) =>
  `press min-h-11 rounded-full border px-4 text-sm ${on ? "border-accent/70 bg-accent/15 font-medium text-ink" : "border-line bg-surface text-muted"}`;

/** The calculator's words in English; translated pages pass their own (src/locales/site/tools/). */
export const TDEE_EN: TdeeUi = {
  units: "Units",
  metric: "Metric",
  imperial: "Imperial",
  sex: "Sex",
  female: "Female",
  male: "Male",
  age: "Age",
  weightKg: "Weight (kg)",
  weightLb: "Weight (lb)",
  heightCm: "Height (cm)",
  heightIn: "Height (in)",
  fat: "Body fat (optional)",
  skip: "Skip",
  add: "Add",
  fatPct: "Body fat (%)",
  activity: "Activity",
};

export function TdeeCalculator({
  t = TDEE_EN,
  words,
  levels = ACTIVITY,
  lang,
}: {
  t?: TdeeUi;
  /** The results' lines in the page's language (tdeeWords in fromApp.ts); the English page uses the app's own. */
  words?: Record<string, string>;
  levels?: Record<Activity, { label: string; detail: string }>;
  lang?: string;
}) {
  const say: Say | undefined = words ? (key, vars) => fill(words[key] ?? key, vars ?? {}) : undefined;
  const fmt = lang ? (n: number) => new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(n) : undefined;
  // Aria labels: English lowercases its label inside the sentence a screen reader hears; other languages keep theirs.
  const aria = (label: string) => (t === TDEE_EN ? label.toLowerCase() : label);
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
        <div className="flex flex-wrap gap-2" role="group" aria-label={t.units}>
          <button
            type="button"
            aria-pressed={metric}
            className={chip(metric)}
            onClick={() => {
              setMetric(true);
              setDraft({});
            }}
          >
            {t.metric}
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
            {t.imperial}
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold" id="sex-l">
            {t.sex}
          </span>
          <div className="flex gap-2" role="group" aria-labelledby="sex-l">
            {(["female", "male"] as const).map((s) => (
              <button key={s} type="button" aria-pressed={sex === s} className={chip(sex === s)} onClick={() => setSex(s)}>
                {s === "female" ? t.female : t.male}
              </button>
            ))}
          </div>
        </div>
        <Row id="age" label={t.age}>
          <BumpField id="age" label={aria(t.age)} {...box("age", age, 13, 100, setAge)} step={1} start={30} min={13} max={100} />
        </Row>
        <Row id="weight" label={metric ? t.weightKg : t.weightLb}>
          <BumpField
            id="weight"
            label={aria(metric ? t.weightKg : t.weightLb)}
            {...box("w", metric ? Math.round(kg * 10) / 10 : Math.round(kg / LB), metric ? 25 : 55, metric ? 350 : 770, (n) =>
              setKg(metric ? n : n * LB),
            )}
            step={metric ? 0.5 : 1}
            start={metric ? 80 : 175}
            min={metric ? 25 : 55}
            max={metric ? 350 : 770}
          />
        </Row>
        <Row id="height" label={metric ? t.heightCm : t.heightIn}>
          <BumpField
            id="height"
            label={aria(metric ? t.heightCm : t.heightIn)}
            {...box("h", metric ? Math.round(cm) : inches, metric ? 100 : 40, metric ? 250 : 98, (n) => setCm(metric ? n : n * 2.54))}
            step={1}
            start={metric ? 178 : 70}
            min={metric ? 100 : 40}
            max={metric ? 250 : 98}
          />
        </Row>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold" id="fat-l">
            {t.fat}
          </span>
          <div className="flex gap-2" role="group" aria-labelledby="fat-l">
            <button type="button" aria-pressed={fat === undefined} className={chip(fat === undefined)} onClick={() => setFat(undefined)}>
              {t.skip}
            </button>
            <button
              type="button"
              aria-pressed={fat !== undefined}
              className={chip(fat !== undefined)}
              onClick={() => setFat((f) => f ?? (sex === "female" ? 25 : 18))}
            >
              {t.add}
            </button>
          </div>
        </div>
        {fat !== undefined && (
          <Row id="fat" label={t.fatPct}>
            <BumpField id="fat" label={aria(t.fatPct)} {...box("fat", fat ?? 20, 3, 60, setFat)} step={0.5} start={20} min={3} max={60} />
          </Row>
        )}
        <div>
          <span className="font-semibold" id="act-l">
            {t.activity}
          </span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="act-l">
            {ACTIVITIES.map((a) => (
              <button key={a} type="button" aria-pressed={activity === a} className={chip(activity === a)} onClick={() => setActivity(a)}>
                {levels[a].label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">{levels[activity].detail}</p>
        </div>
      </div>
      <TdeeResults r={r} activity={activity} say={say} fmt={fmt} levels={levels} />
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
