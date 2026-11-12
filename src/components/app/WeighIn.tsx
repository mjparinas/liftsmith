"use client";

// The weigh-in form (body weight, with optional body fat under it): one component for every place a lifter
// logs one, so Progress and the health twin's Weight and Body fat sheets can't drift apart. Body fat on its
// own is logged with the last weight, so the trend lines stay whole. With the Bluetooth scale lab on, a
// button above fills both in from the scale (scale.ts); the lifter still taps Log.
import { useState } from "react";

import { t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { labOn } from "@/lib/labs";
import { ScaleError, scaleMessage, scaleSupported, weighOnScale } from "@/lib/scale";
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
  const [scale, setScale] = useState<{ busy: boolean; note: string | null }>({ busy: false, note: null });
  const weigh = async () => {
    setScale({ busy: true, note: t("lab.scale.connecting") });
    try {
      const r = await weighOnScale((name) => setScale({ busy: true, note: t("lab.scale.waiting", { name }) }));
      if (r.kg !== undefined) setValue(String(Math.round(fromKg(r.kg, unit) * 10) / 10));
      if (r.bodyFat !== undefined) setFat(String(r.bodyFat));
      haptic("success");
      setScale({ busy: false, note: t("lab.scale.got", { name: r.name, log: t("progress.bw.log") }) });
    } catch (e) {
      const msg = e instanceof ScaleError ? scaleMessage(e.problem, e.device) : scaleMessage("failed");
      if (msg) oops();
      setScale({ busy: false, note: msg });
    }
  };
  const submit = () => {
    const n = Number(value);
    const pct = parseBodyFat(fat);
    setFatError(fat.trim() !== "" && pct === undefined);
    if (fat.trim() !== "" && pct === undefined) return;
    if (!(n > 0) && pct === undefined) return;
    logBodyweight(n > 0 ? toKg(n, unit) : (lastKg ?? profile.bodyweight), pct);
    setValue("");
    setFat("");
    setScale({ busy: false, note: null });
  };
  return (
    <form
      className={`space-y-2 ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {labOn("labScale") && scaleSupported() && (
        <div>
          <Button kind="ghost" className="w-full" disabled={scale.busy} onClick={() => void weigh()}>
            {t("lab.scale.button")}
          </Button>
          {scale.note && (
            <p className="mt-1 text-sm text-muted" role="status">
              {scale.note}
            </p>
          )}
        </div>
      )}
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
