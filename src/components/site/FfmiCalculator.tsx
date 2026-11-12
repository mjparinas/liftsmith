"use client";

// The public FFMI calculator (/tools/ffmi-calculator/): fat-free mass index and its height-normalized form
// (calculators.ts ffmi), with the same bands as the app. Nothing is stored or sent.
import { useState } from "react";

import { ffmi, FFMI_BANDS, FFMI_CUTS, ffmiBand, leanToNextBand, type FfmiBand, type Sex } from "@/lib/calculators";
import { fmtNum, LB } from "@/lib/units";

import { Choice, NumBox } from "./NumBox";

export const FFMI_LABEL: Record<FfmiBand, string> = {
  below: "Below average",
  average: "Average",
  above: "Above average",
  excellent: "Excellent",
  superior: "Superior",
  rare: "Rare without drugs",
};

export function FfmiCalculator() {
  const [metric, setMetric] = useState(true);
  const [sex, setSex] = useState<Sex>("male");
  const [kg, setKg] = useState(80);
  const [cm, setCm] = useState(178);
  const [fat, setFat] = useState(15);
  const f = ffmi(kg, cm, fat);
  const band = f ? ffmiBand(f.normalized, sex) : null;
  const next = f ? leanToNextBand(f, cm, sex) : null;
  const w = (x: number) => (metric ? `${fmtNum(Math.round(x * 10) / 10)} kg` : `${fmtNum(Math.round(x / LB))} lb`);
  const cuts = FFMI_CUTS[sex];
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
          label="Sex"
          value={sex}
          options={[
            ["female", "Female"],
            ["male", "Male"],
          ]}
          onChange={setSex}
        />
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
        <NumBox id="fat" label="Body fat (%)" value={fat} onChange={setFat} step={0.5} min={3} max={60} />
      </div>
      <div className="card p-5" aria-live="polite">
        <p className="display text-5xl font-extrabold">{f ? fmtNum(Math.round(f.normalized * 10) / 10) : "–"}</p>
        <p className="font-semibold">FFMI{band ? ` · ${FFMI_LABEL[band]}` : ""}</p>
        {f && (
          <p className="mt-1 text-sm text-muted">
            Lean mass {w(f.leanKg)}. Before the height adjustment: {fmtNum(Math.round(f.ffmi * 10) / 10)}.
          </p>
        )}
        {next && (
          <p className="mt-3 text-sm">
            About {w(next.kg)} more lean mass reaches {FFMI_LABEL[next.band].toLowerCase()}.
          </p>
        )}
        <table className="num mt-4 w-full text-sm">
          <caption className="sr-only">FFMI bands for {sex === "female" ? "women" : "men"}</caption>
          <tbody className="divide-y divide-line">
            {FFMI_BANDS.map((b, i) => (
              <tr key={b} className={b === band ? "font-semibold text-ink" : "text-muted"}>
                <th scope="row" className="py-1.5 text-left font-medium">
                  {FFMI_LABEL[b]}
                </th>
                <td className="py-1.5 text-right">
                  {i === 0 ? `under ${cuts[0]}` : cuts[i] !== undefined ? `${cuts[i - 1]}–${cuts[i]}` : `${cuts[i - 1]} and up`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
