"use client";

import { useMemo, useState } from "react";

import { date, inSentence, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { fromCm, lengthUnit, MEASURE_RANGE, MEASURE_START, measureSummary, toCm } from "@/lib/measure";
import { useApp } from "@/lib/store";
import { MEASURE_SITES, type MeasureSite } from "@/lib/types";
import { fmtNum, plainNum } from "@/lib/units";

import { BumpField, Button, Chip, Section } from "./ui";

// Body measurements on Body and photos (competitor gaps, Melvin 2026-11-11): pick a site, bump or type the
// number, log it. Each site's latest number and its change since the first show underneath. A growing or
// shrinking waist becomes a coach's note when there are no body fat readings (insights.ts).

export function Measurements() {
  const { events, profile, logMeasure } = useApp();
  const unit = profile.unit;
  const len = lengthUnit(unit);
  const summary = useMemo(() => measureSummary(events), [events]);
  const [site, setSite] = useState<MeasureSite>("waist");
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const last = summary.find((s) => s.site === site)?.last;
  const round = (cm: number) => Math.round(fromCm(cm, unit) * 10) / 10;
  const start = round(last?.cm ?? MEASURE_START[site]);
  const [min, max] = MEASURE_RANGE.map(round) as [number, number];

  const save = () => {
    const n = Number(value.replace(",", "."));
    const cm = toCm(n, unit);
    if (!(cm >= MEASURE_RANGE[0] && cm <= MEASURE_RANGE[1])) {
      oops();
      setError(true);
      return;
    }
    setError(false);
    haptic("success");
    logMeasure(site, cm);
    setValue("");
  };

  return (
    <Section title={t("body.meas.title")}>
      <div className="card p-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("body.meas.sites")}>
          {MEASURE_SITES.map((s) => (
            <Chip
              key={s}
              active={site === s}
              onClick={() => {
                setSite(s);
                setValue("");
                setError(false);
              }}
            >
              {t(`body.meas.site.${s}`)}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <BumpField
            id="measure-value"
            className="min-w-0 flex-1"
            label={t("body.meas.field", { site: t(`body.meas.site.${site}`), unit: len })}
            placeholder={plainNum(start)}
            value={value}
            onChange={setValue}
            step={len === "in" ? 0.25 : 0.5}
            start={start}
            min={min}
            max={max}
          />
          <Button onClick={save} disabled={value.trim() === ""}>
            {t("body.meas.log", { site: inSentence(t(`body.meas.site.${site}`)) })}
          </Button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm text-bad">
            {t("body.meas.range", { min: fmtNum(min), max: fmtNum(max), unit: len })}
          </p>
        )}
        {summary.length ? (
          <ul className="mt-4 divide-y divide-line/70 border-t border-line/70">
            {summary.map(({ site: s, last: l, change }) => (
              <li key={s} className="flex min-h-11 items-center justify-between gap-3 py-2">
                <span className="font-medium">{t(`body.meas.site.${s}`)}</span>
                <span className="num text-right text-sm">
                  <span className="font-semibold">
                    {fmtNum(round(l.cm))} {len}
                  </span>
                  <span className="block text-muted">
                    {change === undefined
                      ? date(l.at, { month: "short", day: "numeric" })
                      : t("body.meas.change", {
                          change: `${change >= 0 ? "+" : "−"}${fmtNum(Math.abs(round(change)))}`,
                          unit: len,
                        })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">{t("body.meas.none")}</p>
        )}
      </div>
    </Section>
  );
}
