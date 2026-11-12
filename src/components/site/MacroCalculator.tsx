"use client";

// The public macro calculator (/tools/macro-calculator/): TDEE from the app's engine (tdee.ts), then calories
// for the goal and protein, fat and carbs (calculators.ts), each with its reason. Nothing is stored or sent.
import { useState } from "react";

import { goalCalories, macros, PROTEIN_PER_KG, type MacroGoal } from "@/lib/calculators";
import { ACTIVITIES, ACTIVITY, calcTdee, type Activity, type Sex } from "@/lib/tdee";
import { fmtNum, LB } from "@/lib/units";

import { Choice, NumBox } from "./NumBox";

const WHY: Record<MacroGoal, string> = {
  cut: "the top of the range, to keep muscle while you lose fat",
  maintain: "the middle of the range lifters need",
  bulk: "enough to build muscle, with the extra calories going to carbs",
};

export function MacroCalculator() {
  const [metric, setMetric] = useState(true);
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(30);
  const [kg, setKg] = useState(80);
  const [cm, setCm] = useState(178);
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<MacroGoal>("maintain");
  const r = calcTdee({ sex, age, kg, cm, activity });
  const kcal = goalCalories(r.tdee, r.bmr, goal);
  const m = macros(kcal, kg, goal);
  const rows = [
    ["Protein", m.protein, m.split.protein, `${fmtNum(PROTEIN_PER_KG[goal])} g per kg of body weight: ${WHY[goal]}.`],
    ["Fat", m.fat, m.split.fat, "A quarter of your calories, and never under 0.6 g per kg, for hormones."],
    ["Carbs", m.carbs, m.split.carbs, "The rest of your calories, to fuel hard sets."],
  ] as const;
  const kcalWhy =
    goal === "cut"
      ? kcal === r.bmr
        ? `Your BMR of ${fmtNum(r.bmr)}: a bigger cut would go under it, which costs muscle.`
        : `500 under your TDEE of ${fmtNum(r.tdee)}: about ${metric ? "0.5 kg" : "1 lb"} a week down.`
      : goal === "bulk"
        ? `250 over your TDEE of ${fmtNum(r.tdee)}: about ${metric ? "0.25 kg" : "0.5 lb"} a week up, mostly muscle.`
        : `Your TDEE: what you burn on an average day.`;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 [&>*]:min-w-0">
      <div className="card space-y-5 p-5">
        <Choice
          label="Units"
          value={metric ? "m" : "i"}
          options={[
            ["m", "Metric"],
            ["i", "Imperial"],
          ]}
          onChange={(v) => setMetric(v === "m")}
        />
        <Choice
          label="Goal"
          value={goal}
          options={[
            ["cut", "Lose fat"],
            ["maintain", "Maintain"],
            ["bulk", "Build muscle"],
          ]}
          onChange={setGoal}
        />
        <Choice
          label="Sex"
          value={sex}
          options={[
            ["female", "Female"],
            ["male", "Male"],
          ]}
          onChange={setSex}
        />
        <NumBox id="age" label="Age" value={age} onChange={setAge} step={1} min={13} max={100} />
        {metric ? (
          <>
            <NumBox key="kg" id="weight" label="Weight (kg)" value={kg} onChange={setKg} step={0.5} min={25} max={350} />
            <NumBox key="cm" id="height" label="Height (cm)" value={cm} onChange={setCm} step={1} min={100} max={250} />
          </>
        ) : (
          <>
            <NumBox
              key="lb"
              id="weight"
              label="Weight (lb)"
              value={Math.round(kg / LB)}
              onChange={(v) => setKg(v * LB)}
              step={1}
              min={55}
              max={770}
            />
            <NumBox
              key="in"
              id="height"
              label="Height (inches)"
              value={Math.round(cm / 2.54)}
              onChange={(v) => setCm(v * 2.54)}
              step={1}
              min={40}
              max={98}
            />
          </>
        )}
        <div>
          <p className="font-semibold">Activity</p>
          <div className="mt-2">
            <Choice
              label="Activity"
              value={activity}
              options={ACTIVITIES.map((a) => [a, ACTIVITY[a].label] as const)}
              onChange={setActivity}
            />
          </div>
          <p className="mt-1 text-sm text-muted">{ACTIVITY[activity].detail}</p>
        </div>
      </div>
      <div className="card p-5" aria-live="polite">
        <p className="display text-5xl font-extrabold">{fmtNum(m.kcal)}</p>
        <p className="font-semibold">calories a day</p>
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
        <p className="mt-2 text-sm text-muted">
          Spread the protein over {fmtNum(Math.max(3, Math.round(m.protein / 40)))} meals; it&apos;s used best in portions of 30 to 40 g.
        </p>
      </div>
    </div>
  );
}
