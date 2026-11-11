"use client";

// The public body fat calculator (/tools/body-fat-calculator/): the US Navy tape-measure method
// (calculators.ts navyBodyFat), the same one the app's Tools › Body fat uses. Nothing is stored or sent.
import { useState } from "react";

import { FAT_CATEGORIES, fatCategory, navyBodyFat, type FatCategory, type Sex } from "@/lib/calculators";
import { fmtNum } from "@/lib/units";

import { Choice, NumBox } from "./NumBox";

export const FAT_LABEL: Record<FatCategory, string> = {
  essential: "Essential fat",
  athletic: "Athletic",
  fit: "Fit",
  average: "Average",
  high: "High",
};

const IN = 2.54;

export function BodyFatCalculator() {
  const [metric, setMetric] = useState(true);
  const [sex, setSex] = useState<Sex>("male");
  const [cm, setCm] = useState({ height: 178, waist: 85, neck: 38, hips: 100 });
  const pct = navyBodyFat(sex, cm.height, cm.waist, cm.neck, sex === "female" ? cm.hips : undefined);
  const box = (k: keyof typeof cm, label: string) =>
    metric ? (
      <NumBox
        key={`${k}-cm`}
        id={k}
        label={`${label} (cm)`}
        value={cm[k]}
        onChange={(v) => setCm((c) => ({ ...c, [k]: v }))}
        step={0.5}
        min={10}
        max={250}
      />
    ) : (
      <NumBox
        key={`${k}-in`}
        id={k}
        label={`${label} (inches)`}
        value={Math.round((cm[k] / IN) * 4) / 4}
        onChange={(v) => setCm((c) => ({ ...c, [k]: v * IN }))}
        step={0.25}
        min={4}
        max={100}
      />
    );
  const cat = pct !== null ? fatCategory(pct, sex) : null;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 [&>*]:min-w-0">
      <div className="card space-y-5 p-5">
        <Choice
          label="Units"
          value={metric ? "m" : "i"}
          options={[
            ["m", "Centimetres"],
            ["i", "Inches"],
          ]}
          onChange={(v) => setMetric(v === "m")}
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
        {box("height", "Height")}
        {box("waist", "Waist, at the belly button")}
        {box("neck", "Neck, below the Adam's apple")}
        {sex === "female" && box("hips", "Hips, at the widest point")}
      </div>
      <div className="card p-5" aria-live="polite">
        <p className="display text-5xl font-extrabold">{pct !== null ? `${fmtNum(pct)}%` : "–"}</p>
        <p className="font-semibold">{cat ? FAT_LABEL[cat] : "Check the measurements"}</p>
        <table className="num mt-4 w-full text-sm">
          <caption className="sr-only">Body fat categories for {sex === "female" ? "women" : "men"}</caption>
          <tbody className="divide-y divide-line">
            {FAT_CATEGORIES[sex].map(([c, from], i, all) => (
              <tr key={c} className={c === cat ? "font-semibold text-ink" : "text-muted"}>
                <th scope="row" className="py-1.5 text-left font-medium">
                  {FAT_LABEL[c]}
                </th>
                <td className="py-1.5 text-right">{all[i + 1] ? `${from}–${all[i + 1]![1] - 1}%` : `${from}% and up`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-sm text-muted">
          Categories from the American Council on Exercise. The tape method is usually within 3 to 4 points of a DEXA scan; it reads very
          muscular lifters a little high.
        </p>
      </div>
    </div>
  );
}
