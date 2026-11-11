"use client";

// A labelled − / + box for the public calculators: what's typed stays as typed, and the number only counts
// once it's in range, so typing "1" on the way to "18" doesn't jump anywhere. Nothing is stored or sent.
import { useState } from "react";

import { BumpField } from "@/components/app/ui";

import { chip } from "./chip";

export function NumBox({
  id,
  label,
  value,
  onChange,
  step,
  min,
  max,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
  min: number;
  max: number;
}) {
  const [text, setText] = useState(String(value));
  return (
    <div>
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <BumpField
        id={id}
        label={label.toLowerCase()}
        className="mt-2"
        value={text}
        onChange={(v) => {
          setText(v);
          const n = Number(v);
          if (v.trim() !== "" && Number.isFinite(n) && n >= min && n <= max) onChange(n);
        }}
        step={step}
        start={value}
        min={min}
        max={max}
      />
    </div>
  );
}

/** A row of chip buttons for one choice. */
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={value === v} className={chip(value === v)} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}
