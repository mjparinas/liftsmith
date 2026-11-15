"use client";

// The public macro calculator (/tools/macro-calculator/ and /<lang>/tools/macro-calculator/): TDEE from the app's
// engine (tdee.ts), then calories for the goal and protein, fat and carbs (calculators.ts), each with its reason.
// Nothing is stored or sent.
import { useState } from "react";

import { goalCalories, macros, PROTEIN_PER_KG, type MacroGoal } from "@/lib/calculators";
import { fill } from "@/lib/siteLang";
import { ACTIVITIES, ACTIVITY, calcTdee, type Activity, type Sex } from "@/lib/tdee";
import { fmtNum, LB } from "@/lib/units";
import type { MacroUi } from "@/locales/site/tools/types";

import { Choice, NumBox } from "./NumBox";

/** The calculator's words in English; translated pages pass their own (src/locales/site/tools/). */
export const MACRO_EN: MacroUi = {
  units: "Units",
  metric: "Metric",
  imperial: "Imperial",
  goal: "Goal",
  cut: "Lose fat",
  maintain: "Maintain",
  bulk: "Build muscle",
  sex: "Sex",
  female: "Female",
  male: "Male",
  age: "Age",
  weightKg: "Weight (kg)",
  weightLb: "Weight (lb)",
  heightCm: "Height (cm)",
  heightIn: "Height (inches)",
  activity: "Activity",
  kcalDay: "calories a day",
  protein: "Protein",
  fat: "Fat",
  carbs: "Carbs",
  proteinCut: "{perKg} g per kg of body weight: the top of the range, to keep muscle while you lose fat.",
  proteinMaintain: "{perKg} g per kg of body weight: the middle of the range lifters need.",
  proteinBulk: "{perKg} g per kg of body weight: enough to build muscle, with the extra calories going to carbs.",
  fatWhy: "A quarter of your calories, and never under 0.6 g per kg, for hormones.",
  carbsWhy: "The rest of your calories, to fuel hard sets.",
  kcalFloor: "Your BMR of {bmr}: a bigger cut would go under it, which costs muscle.",
  kcalCut: "500 under your TDEE of {tdee}: about {pace} a week down.",
  kcalMaintain: "Your TDEE: what you burn on an average day.",
  kcalBulk: "250 over your TDEE of {tdee}: about {pace} a week up, mostly muscle.",
  meals: "Spread the protein over {meals} meals; it's used best in portions of 30 to 40 g.",
};

export function MacroCalculator({
  t = MACRO_EN,
  levels = ACTIVITY,
}: {
  t?: MacroUi;
  /** The activity levels in the page's language (activityWords in fromApp.ts). */
  levels?: Record<Activity, { label: string; detail: string }>;
}) {
  const [metric, setMetric] = useState(true);
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(30);
  const [kg, setKg] = useState(80);
  const [cm, setCm] = useState(178);
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<MacroGoal>("maintain");
  const aria = (label: string) => (t === MACRO_EN ? undefined : label);
  const r = calcTdee({ sex, age, kg, cm, activity });
  const kcal = goalCalories(r.tdee, r.bmr, goal);
  const m = macros(kcal, kg, goal);
  const proteinWhy = { cut: t.proteinCut, maintain: t.proteinMaintain, bulk: t.proteinBulk }[goal];
  const rows = [
    [t.protein, m.protein, m.split.protein, fill(proteinWhy, { perKg: fmtNum(PROTEIN_PER_KG[goal]) })],
    [t.fat, m.fat, m.split.fat, t.fatWhy],
    [t.carbs, m.carbs, m.split.carbs, t.carbsWhy],
  ] as const;
  const kcalWhy =
    goal === "cut"
      ? kcal === r.bmr
        ? fill(t.kcalFloor, { bmr: fmtNum(r.bmr) })
        : fill(t.kcalCut, { tdee: fmtNum(r.tdee), pace: metric ? `${fmtNum(0.5)} kg` : "1 lb" })
      : goal === "bulk"
        ? fill(t.kcalBulk, { tdee: fmtNum(r.tdee), pace: metric ? `${fmtNum(0.25)} kg` : `${fmtNum(0.5)} lb` })
        : t.kcalMaintain;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 [&>*]:min-w-0">
      <div className="card space-y-5 p-5">
        <Choice
          label={t.units}
          value={metric ? "m" : "i"}
          options={[
            ["m", t.metric],
            ["i", t.imperial],
          ]}
          onChange={(v) => setMetric(v === "m")}
        />
        <Choice
          label={t.goal}
          value={goal}
          options={[
            ["cut", t.cut],
            ["maintain", t.maintain],
            ["bulk", t.bulk],
          ]}
          onChange={setGoal}
        />
        <Choice
          label={t.sex}
          value={sex}
          options={[
            ["female", t.female],
            ["male", t.male],
          ]}
          onChange={setSex}
        />
        <NumBox id="age" label={t.age} aria={aria(t.age)} value={age} onChange={setAge} step={1} min={13} max={100} />
        {metric ? (
          <>
            <NumBox
              key="kg"
              id="weight"
              label={t.weightKg}
              aria={aria(t.weightKg)}
              value={kg}
              onChange={setKg}
              step={0.5}
              min={25}
              max={350}
            />
            <NumBox
              key="cm"
              id="height"
              label={t.heightCm}
              aria={aria(t.heightCm)}
              value={cm}
              onChange={setCm}
              step={1}
              min={100}
              max={250}
            />
          </>
        ) : (
          <>
            <NumBox
              key="lb"
              id="weight"
              label={t.weightLb}
              aria={aria(t.weightLb)}
              value={Math.round(kg / LB)}
              onChange={(v) => setKg(v * LB)}
              step={1}
              min={55}
              max={770}
            />
            <NumBox
              key="in"
              id="height"
              label={t.heightIn}
              aria={aria(t.heightIn)}
              value={Math.round(cm / 2.54)}
              onChange={(v) => setCm(v * 2.54)}
              step={1}
              min={40}
              max={98}
            />
          </>
        )}
        <div>
          <p className="font-semibold">{t.activity}</p>
          <div className="mt-2">
            <Choice
              label={t.activity}
              value={activity}
              options={ACTIVITIES.map((a) => [a, levels[a].label] as const)}
              onChange={setActivity}
            />
          </div>
          <p className="mt-1 text-sm text-muted">{levels[activity].detail}</p>
        </div>
      </div>
      <div className="card p-5" aria-live="polite">
        <p className="display text-5xl font-extrabold">{fmtNum(m.kcal)}</p>
        <p className="font-semibold">{t.kcalDay}</p>
        <p className="mt-1 text-sm text-muted">{kcalWhy}</p>
        <ul className="mt-4 divide-y divide-line">
          {rows.map(([name, g, share, why]) => (
            <li key={name} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{name}</span>
                <span className="num">
                  <span className="text-lg font-bold">{fmtNum(g)} g</span>{" "}
                  <span className="text-sm text-muted">{Math.round(share * 100)}%</span>
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted">{why}</p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-muted">{fill(t.meals, { meals: fmtNum(Math.max(3, Math.round(m.protein / 40))) })}</p>
      </div>
    </div>
  );
}
