"use client";

import { useState } from "react";

import { t } from "@/lib/i18n";
import type { Gym } from "@/lib/types";
import { fmtNum } from "@/lib/units";
import { cleanWeights, stepRange, toggleWeight, usualStep, weightPresets, type WeightKind } from "@/lib/weightSets";

import { BumpField, Button, Chip, Section, Sheet } from "./ui";

const TEXT = {
  dumbbells: { title: "gym.dumbbells", range: "gym.dumbbells.range", sheet: "gym.dumbbells.sheet" },
  kettlebells: { title: "gym.kettlebells", range: "gym.kettlebells.range", sheet: "gym.kettlebells.sheet" },
} as const;

/**
 * The dumbbells or kettlebells a gym owns: a card with the range that opens one sheet to change them
 * (a preset, a filled range, or one weight at a time). Workouts round to the weights kept here.
 */
export function GymWeights({ gym, kind, onChange }: { gym: Gym; kind: WeightKind; onChange: (weights: number[]) => void }) {
  const [open, setOpen] = useState(false);
  const list = gym[kind];
  const text = TEXT[kind];
  return (
    <Section title={t(text.title, { unit: gym.unit })}>
      <button
        type="button"
        className="press card flex w-full items-center justify-between gap-3 p-4 text-left text-sm"
        onClick={() => setOpen(true)}
      >
        <span className="text-muted">
          {list.length
            ? t(text.range, { from: fmtNum(list[0]), to: fmtNum(list.at(-1)!), unit: gym.unit, count: list.length })
            : t("gym.dumbbells.none")}
        </span>
        <span className="shrink-0 font-medium text-accent">{t("gym.weights.edit")} ›</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t(text.sheet)}>
        <WeightEditor gym={gym} kind={kind} onChange={onChange} />
      </Sheet>
    </Section>
  );
}

function WeightEditor({ gym, kind, onChange }: { gym: Gym; kind: WeightKind; onChange: (weights: number[]) => void }) {
  const list = gym[kind];
  const unit = gym.unit;
  const small = unit === "kg" ? 0.5 : 1;
  // Weights switched off stay on screen while the sheet is open, so a wrong tap is one tap to undo.
  const [seen, setSeen] = useState<number[]>(list);
  const shown = cleanWeights([...seen, ...list]);
  const [from, setFrom] = useState(String(list[0] ?? (unit === "kg" ? 2 : 5)));
  const [to, setTo] = useState(String(list.at(-1) ?? (unit === "kg" ? 30 : 60)));
  const [step, setStep] = useState(String(usualStep(list, unit)));
  const [one, setOne] = useState("");
  const replace = (weights: number[]) => {
    setSeen(weights);
    onChange(weights);
    // The range boxes follow, so "Fill a range" starts from what was just picked.
    if (weights.length) {
      setFrom(String(weights[0]));
      setTo(String(weights.at(-1)));
      setStep(String(usualStep(weights, unit)));
    }
  };
  const filled = stepRange(Number(from), Number(to), Number(step));
  const same = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-faint">{t("gym.weights.presets")}</p>
        <div className="flex flex-wrap gap-2">
          {weightPresets(kind, unit).map((p) => (
            <Chip key={p.id} active={same(list, p.weights)} onClick={() => replace(p.weights)}>
              {t(`gym.preset.${p.id}` as "gym.preset.rack")}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-faint">{t("gym.weights.owned", { unit })}</p>
        {shown.length ? (
          <div className="flex flex-wrap gap-2">
            {shown.map((w) => (
              <Chip key={w} active={list.includes(w)} onClick={() => onChange(toggleWeight(list, w))}>
                <span className="num">{fmtNum(w)}</span>
              </Chip>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">{t("gym.dumbbells.none")}</p>
        )}
        <p className="mt-2 text-xs text-faint">{t("gym.weights.note")}</p>
      </div>

      <div className="card space-y-3 p-4">
        <p className="text-sm font-semibold">{t("gym.weights.fill")}</p>
        {(
          [
            ["gym.weights.from", from, setFrom],
            ["gym.weights.to", to, setTo],
            ["gym.weights.step", step, setStep],
          ] as const
        ).map(([key, value, set]) => (
          <div key={key} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-sm">
            <span className="text-muted">{t(key)}</span>
            <BumpField
              label={t(key)}
              value={value}
              onChange={set}
              step={key === "gym.weights.step" ? small : unit === "kg" ? 1 : 2.5}
              start={Number(value) || 1}
              min={small}
              max={unit === "kg" ? 200 : 400}
              className="w-44 max-w-full"
            />
          </div>
        ))}
        <Button kind="ghost" className="w-full" disabled={!filled.length} onClick={() => replace(filled)}>
          {t("gym.weights.fillGo", { count: filled.length })}
        </Button>
      </div>

      <div className="card space-y-3 p-4">
        <p className="text-sm font-semibold">{t("gym.weights.add")}</p>
        <BumpField
          label={t("gym.weights.addLabel")}
          value={one}
          onChange={setOne}
          step={small}
          start={list.at(-1) ?? (unit === "kg" ? 10 : 20)}
          min={small}
          max={unit === "kg" ? 200 : 400}
        />
        <Button
          kind="ghost"
          className="w-full"
          disabled={!(Number(one) > 0) || list.includes(Number(one))}
          onClick={() => {
            const w = Number(one);
            setSeen((s) => [...s, w]);
            onChange(cleanWeights([...list, w]));
            setOne("");
          }}
        >
          {t("gym.weights.addGo")}
        </Button>
      </div>
    </div>
  );
}
