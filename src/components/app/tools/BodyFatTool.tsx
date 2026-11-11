"use client";

// Tools › Body fat: the US Navy tape-measure estimate (calculators.ts navyBodyFat) from the waist and neck
// (and hips for women) logged on Body and photos, and height from Your stats. One tap saves the result as
// today's body fat on a weigh-in, and any changed measurement as a new tape measurement, so TDEE, FFMI, the
// health twin and coach's notes all pick it up.
import { useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { navyBodyFat } from "@/lib/calculators";
import { inSentence, num, parseNum, t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { fromCm, lengthUnit, MEASURE_START, measuresOf, toCm } from "@/lib/measure";
import { useApp } from "@/lib/store";
import { currentBodyFat, currentKg } from "@/lib/tdee";
import { fmtNum } from "@/lib/units";

import { StatsNeeded } from "../BodyStats";
import { BumpField, Button, Section } from "../ui";
import { Advice, FieldRow, ToolScreen } from "./shared";

export function BodyFatTool() {
  const { events, profile, logBodyweight, logMeasure } = useApp();
  const unit = profile.unit;
  const len = lengthUnit(unit);
  const sex = profile.sex;
  const sites: ("waist" | "hips" | "neck")[] = sex === "female" ? ["waist", "hips", "neck"] : ["waist", "neck"];
  const latest = useMemo(
    () =>
      Object.fromEntries((["waist", "hips", "neck"] as const).map((s) => [s, measuresOf(events, s).at(-1)?.cm])) as Record<
        string,
        number | undefined
      >,
    [events],
  );
  const show = (cm: number | undefined) => (cm === undefined ? "" : fmtNum(Math.round(fromCm(cm, unit) * 10) / 10));
  const [text, setText] = useState<Record<string, string>>(() => ({
    waist: show(latest.waist),
    hips: show(latest.hips),
    neck: show(latest.neck),
  }));
  const [saved, setSaved] = useState<number | null>(null);
  useEffect(() => track("feature", { name: "tool_bodyfat" }), []);

  const cm = (s: string) => {
    const n = parseNum(text[s] ?? "");
    return Number.isFinite(n) && n > 0 ? toCm(n, unit) : undefined;
  };
  const pct = sex && profile.heightCm ? navyBodyFat(sex, profile.heightCm, cm("waist") ?? 0, cm("neck") ?? 0, cm("hips")) : null;
  const last = currentBodyFat(events, profile);

  const save = () => {
    if (pct === null) return;
    for (const s of sites) {
      const v = cm(s);
      if (v !== undefined && (latest[s] === undefined || Math.abs(v - latest[s]!) >= 0.1)) logMeasure(s, v);
    }
    logBodyweight(currentKg(events, profile), pct);
    setSaved(pct);
    sound.done();
    haptic("success");
  };

  return (
    <ToolScreen title={t("calc.bf.title")} blurb={t("calc.bf.blurb")}>
      <StatsNeeded need={["sex", "height"]} />
      {sex && (
        <Section title={t("calc.bf.tape")} icon="target">
          <div className="card space-y-4 p-4">
            {sites.map((s) => (
              <div key={s}>
                <FieldRow id={`bf-${s}`} label={`${t(`body.meas.site.${s}`)} (${len})`}>
                  <BumpField
                    min={10}
                    max={250}
                    id={`bf-${s}`}
                    label={inSentence(t(`body.meas.site.${s}`), true)}
                    value={text[s] ?? ""}
                    onChange={(v) => {
                      setText({ ...text, [s]: v });
                      setSaved(null);
                    }}
                    start={Math.round(fromCm(MEASURE_START[s], unit))}
                    step={len === "in" ? 0.25 : 0.5}
                  />
                </FieldRow>
                <p className="mt-1 text-xs text-faint">{t(`calc.bf.how.${s}`)}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {sex && (
        <Section title={t("calc.bf.result")}>
          <div className="card p-4" aria-live="polite">
            <div className="num text-4xl font-extrabold" data-testid="bodyfat-result">
              {pct !== null ? `${fmtNum(pct)}%` : "–"}
            </div>
            <p className="mt-1 text-sm text-muted">
              {pct === null ? t("calc.bf.needs") : last !== undefined ? t("calc.bf.last", { pct: fmtNum(last) }) : t("calc.bf.first")}
            </p>
            {pct !== null && (
              <Button className="mt-4 w-full" onClick={save} disabled={saved === pct}>
                {saved === pct ? t("calc.bf.saved") : t("calc.bf.save", { pct: fmtNum(pct) })}
              </Button>
            )}
          </div>
          <Advice>{t("calc.bf.advice", { n: num(3) })}</Advice>
        </Section>
      )}
    </ToolScreen>
  );
}
