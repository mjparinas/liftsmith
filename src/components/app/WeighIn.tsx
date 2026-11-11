"use client";

// The weigh-in form (body weight, with optional body fat under it): one component for every place a lifter
// logs one, so Progress and the health twin's Weight and Body fat sheets can't drift apart. Body fat on its
// own is logged with the last weight, so the trend lines stay whole.
import { useState } from "react";

import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { parseBodyFat } from "@/lib/tdee";
import { fromKg, toKg } from "@/lib/units";

import { BodyFatField } from "./BodyFatField";
import { BumpField, Button } from "./ui";

export function WeighInForm({ id, className = "" }: { id: string; className?: string }) {
  const { events, profile, logBodyweight } = useApp();
  const unit = profile.unit;
  const last = events
    .filter((e) => e.type === "bodyweight")
    .sort((a, b) => a.at - b.at)
    .at(-1);
  const lastKg = last?.type === "bodyweight" ? last.kg : undefined;
  const [value, setValue] = useState("");
  const [fat, setFat] = useState("");
  const [fatError, setFatError] = useState(false);
  const submit = () => {
    const n = Number(value);
    const pct = parseBodyFat(fat);
    setFatError(fat.trim() !== "" && pct === undefined);
    if (fat.trim() !== "" && pct === undefined) return;
    if (!(n > 0) && pct === undefined) return;
    logBodyweight(n > 0 ? toKg(n, unit) : (lastKg ?? profile.bodyweight), pct);
    setValue("");
    setFat("");
  };
  return (
    <form
      className={`space-y-2 ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <BumpField
        label={t("progress.bw.label", { unit })}
        placeholder={t("progress.bw.placeholder", { unit })}
        value={value}
        onChange={setValue}
        step={unit === "lb" ? 0.2 : 0.1}
        start={Math.round(fromKg(lastKg ?? profile.bodyweight, unit) * 10) / 10}
        min={1}
      />
      <div className="flex flex-wrap items-end gap-2">
        <BodyFatField id={`${id}-bf`} value={fat} onChange={setFat} />
        <Button kind="ghost" label={t("progress.bw.logLabel")} onClick={submit}>
          {t("progress.bw.log")}
        </Button>
      </div>
      {fatError && (
        <p role="alert" className="text-sm text-bad">
          {t("body.fat.range")}
        </p>
      )}
    </form>
  );
}
