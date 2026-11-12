"use client";

// The public heart rate zone calculator (/tools/heart-rate-zone-calculator/): maximum heart rate from age
// (Tanaka) or the lifter's own, and zones as a share of max or of heart rate reserve (calculators.ts hrZones).
import { useState } from "react";

import { hrZones, tanakaMax } from "@/lib/calculators";

import { Choice, NumBox } from "./NumBox";

const ZONES = [
  ["Recovery", "Warm-ups, cool-downs and walking between sets."],
  ["Endurance", "Easy cardio you could talk through, which builds the base for recovering between sets."],
  ["Tempo", "Steady cardio that feels like work."],
  ["Threshold", "Hard intervals and circuits."],
  ["Maximum", "All-out efforts, a minute or two at most."],
] as const;

export function HeartRateZoneCalculator() {
  const [age, setAge] = useState(35);
  const [ownMax, setOwnMax] = useState<number | null>(null);
  const [resting, setResting] = useState(60);
  const [method, setMethod] = useState<"max" | "reserve">("max");
  const max = ownMax ?? tanakaMax(age);
  const zones = hrZones(max, method === "reserve" ? resting : undefined);
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 [&>*]:min-w-0">
      <div className="card space-y-5 p-5">
        <NumBox id="age" label="Age" value={age} onChange={setAge} step={1} min={10} max={100} />
        <div>
          <NumBox
            key={ownMax === null ? `est-${age}` : "own"}
            id="max"
            label="Maximum heart rate (bpm)"
            value={max}
            onChange={setOwnMax}
            step={1}
            min={120}
            max={230}
          />
          <p className="mt-1 text-sm text-muted">
            {ownMax === null ? `Estimated from age: 208 − 0.7 × ${age} = ${max}.` : "Your own number."}{" "}
            {ownMax !== null && (
              <button type="button" className="press min-h-11 text-accent underline underline-offset-2" onClick={() => setOwnMax(null)}>
                Use the estimate
              </button>
            )}
          </p>
        </div>
        <Choice
          label="Method"
          value={method}
          options={[
            ["max", "% of max"],
            ["reserve", "Heart rate reserve"],
          ]}
          onChange={setMethod}
        />
        {method === "reserve" && (
          <NumBox id="rest" label="Resting heart rate (bpm)" value={resting} onChange={setResting} step={1} min={30} max={110} />
        )}
      </div>
      <div className="card p-5" aria-live="polite">
        <ul className="divide-y divide-line">
          {[...zones].reverse().map((z) => (
            <li key={z.zone} className="flex items-start gap-3 py-3">
              <span
                className="keep-colours mt-1.5 h-3 w-3 shrink-0 rounded-full"
                style={{ background: `var(--hr-${z.zone})` }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-semibold">
                    Zone {z.zone} · {ZONES[z.zone - 1][0]}
                  </span>
                  <span className="num font-semibold">
                    {z.low}–{z.high} bpm
                  </span>
                </div>
                <p className="text-sm text-muted">{ZONES[z.zone - 1][1]}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          Between heavy sets, start the next one once you&apos;re back under about {zones[1]!.high} bpm, the top of zone 2.
        </p>
      </div>
    </div>
  );
}
