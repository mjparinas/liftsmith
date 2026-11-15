"use client";

// The public DOTS calculator (/tools/dots-calculator/ and /<lang>/tools/dots-calculator/): the app's own DOTS score
// (onerm.ts) for a squat, bench and deadlift total at a body weight. Nothing is stored or sent.
import { useState } from "react";

import { BumpField } from "@/components/app/ui";
import { dots } from "@/lib/onerm";
import { fill } from "@/lib/siteLang";
import type { Unit } from "@/lib/types";
import { fmtNum, toKg } from "@/lib/units";
import type { DotsLevels, DotsUi } from "@/locales/site/tools/types";

import { chip } from "./chip";

/** Rough levels lifters and coaches use for DOTS (not an official scale), the same cut-offs as the app. */
export function dotsBand(score: number): keyof DotsLevels {
  if (score >= 500) return "elite";
  if (score >= 400) return "advanced";
  if (score >= 300) return "intermediate";
  if (score >= 200) return "novice";
  return "beginner";
}

export const DOTS_LEVELS_EN: DotsLevels = {
  beginner: "Beginner",
  novice: "Novice",
  intermediate: "Intermediate",
  advanced: "Advanced",
  elite: "Elite",
};

/** The level's English name. */
export const dotsLevel = (score: number): string => DOTS_LEVELS_EN[dotsBand(score)];

/** The calculator's words in English; translated pages pass their own (src/locales/site/tools/). */
export const DOTS_EN: DotsUi = {
  unitsSex: "Units and sex",
  men: "Men's formula",
  women: "Women's formula",
  bw: "Body weight ({unit})",
  squat: "Squat",
  bench: "Bench press",
  deadlift: "Deadlift",
  liftLabel: "{lift} ({unit})",
  total: "Total {total} {unit}",
  note: "About 200 is a novice total, 300 intermediate, 400 advanced and 500 or more elite. These are rough levels lifters use, not an official scale.",
  levels: DOTS_LEVELS_EN,
};

export function DotsCalculator({ t = DOTS_EN }: { t?: DotsUi }) {
  const [unit, setUnit] = useState<Unit>("kg");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [bw, setBw] = useState("80");
  const [lifts, setLifts] = useState(["140", "100", "180"]);
  const switchUnit = (u: Unit) => {
    setUnit(u);
    setBw(u === "kg" ? "80" : "175");
    setLifts(u === "kg" ? ["140", "100", "180"] : ["315", "225", "405"]);
  };
  const en = t === DOTS_EN;
  const total = lifts.reduce((s, x) => s + Math.max(0, Number(x) || 0), 0);
  const score = dots(toKg(total, unit), toKg(Number(bw) || 0, unit), sex);
  const step = unit === "kg" ? 2.5 : 5;
  const bwLabel = fill(t.bw, { unit });
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 [&>*]:min-w-0">
      <div className="card space-y-5 p-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t.unitsSex}>
          {(["kg", "lb"] as const).map((u) => (
            <button key={u} type="button" aria-pressed={unit === u} className={chip(unit === u)} onClick={() => switchUnit(u)}>
              {u}
            </button>
          ))}
          {(["male", "female"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={sex === s} className={chip(sex === s)} onClick={() => setSex(s)}>
              {s === "male" ? t.men : t.women}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="bw" className="font-semibold">
            {bwLabel}
          </label>
          <BumpField
            id="bw"
            label={en ? "body weight" : bwLabel}
            className="mt-2"
            value={bw}
            onChange={setBw}
            step={unit === "kg" ? 0.5 : 1}
            start={unit === "kg" ? 80 : 175}
            min={0}
            max={unit === "kg" ? 250 : 550}
          />
        </div>
        {[t.squat, t.bench, t.deadlift].map((name, i) => (
          <div key={i}>
            <label htmlFor={`lift-${i}`} className="font-semibold">
              {fill(t.liftLabel, { lift: name, unit })}
            </label>
            <BumpField
              id={`lift-${i}`}
              label={en ? name.toLowerCase() : name}
              className="mt-2"
              value={lifts[i] ?? ""}
              onChange={(v) => setLifts((l) => l.map((x, j) => (j === i ? v : x)))}
              step={step}
              start={unit === "kg" ? 100 : 225}
              min={0}
              max={unit === "kg" ? 500 : 1100}
            />
          </div>
        ))}
      </div>
      <div className="card p-5" aria-live="polite">
        <p className="text-sm text-muted">{fill(t.total, { total: fmtNum(total), unit })}</p>
        <p className="display mt-1 text-5xl font-extrabold">{score > 0 ? score.toFixed(1) : "–"}</p>
        <p className="mt-1 font-semibold">DOTS{score > 0 ? ` · ${t.levels[dotsBand(score)]}` : ""}</p>
        <p className="mt-4 text-sm text-muted">{t.note}</p>
      </div>
    </div>
  );
}
