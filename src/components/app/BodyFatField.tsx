import { Info } from "@/components/Info";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { currentBodyFat } from "@/lib/tdee";

import { BumpField } from "./ui";

/**
 * The optional body fat box that sits under a weigh-in (Progress and Body and photos). − / + start from the
 * last reading (or 20%) in 0.1 steps, so a scale's number is a few taps away; typing still works.
 */
export function BodyFatField({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  const { events, profile } = useApp();
  const last = currentBodyFat(events, profile);
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1">
        <label htmlFor={id} className="text-sm text-muted">
          {t("body.fat.label")}
        </label>
        <Info term="bodyFat" />
      </div>
      <BumpField
        id={id}
        label={t("body.fat.field")}
        placeholder={t("body.fat.placeholder")}
        value={value}
        onChange={onChange}
        step={0.1}
        start={last ?? 20}
        min={3}
        max={60}
      />
    </div>
  );
}
