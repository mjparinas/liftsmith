"use client";

// Tools › Heart rate zones: maximum heart rate from age (Tanaka) unless the lifter knows their own (saved as
// profile.hrMax), and resting heart rate from Health Connect or Apple Health, which switches the zones to heart
// rate reserve (Karvonen). Each zone says what it's for; the advice line turns zone 2 into a rest cue.
import { useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { hrZones, tanakaMax } from "@/lib/calculators";
import { num, t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { readings } from "@/lib/twin";
import { fmtNum } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { ageOf, StatsNeeded } from "../BodyStats";
import { BumpField, Chip, Section } from "../ui";
import { Advice, FieldRow, ToolScreen } from "./shared";

export function HrZonesTool() {
  const { events, profile, setProfile } = useApp();
  const now = useNow(3600_000);
  const age = ageOf(profile, now);
  const resting = useMemo(() => readings(events, "restingHr").at(-1)?.value, [events]);
  const estimate = age !== undefined ? tanakaMax(age) : undefined;
  const max = profile.hrMax ?? estimate;
  const [maxText, setMaxText] = useState(max ? String(max) : "");
  const [reserve, setReserve] = useState(resting !== undefined);
  useEffect(() => track("feature", { name: "tool_hrzones" }), []);

  const onMax = (v: string) => {
    setMaxText(v);
    const n = Math.round(Number(v));
    if (n >= 120 && n <= 230) setProfile({ hrMax: n });
  };
  const useRest = reserve && resting !== undefined;
  const zones = max ? hrZones(max, useRest ? resting : undefined) : [];

  return (
    <ToolScreen title={t("calc.hr.title")} blurb={t("calc.hr.blurb")}>
      {profile.hrMax === undefined && <StatsNeeded need={["age"]} />}
      <Section title={t("calc.hr.you")}>
        <div className="card space-y-3 p-4">
          <FieldRow id="hr-max" label={t("calc.hr.max")}>
            <BumpField
              id="hr-max"
              label={t("calc.hr.max")}
              value={maxText}
              onChange={onMax}
              step={1}
              start={estimate ?? 185}
              min={120}
              max={230}
            />
          </FieldRow>
          <p className="text-xs text-faint">
            {profile.hrMax !== undefined
              ? t("calc.hr.maxOwn")
              : estimate !== undefined
                ? t("calc.hr.maxEstimate", { age: num(age ?? 0), bpm: num(estimate) })
                : t("calc.hr.maxNone")}
          </p>
          {profile.hrMax !== undefined && estimate !== undefined && (
            <button
              type="button"
              className="press min-h-11 text-sm text-accent"
              onClick={() => {
                setProfile({ hrMax: undefined });
                setMaxText(String(estimate));
              }}
            >
              {t("calc.hr.useEstimate", { bpm: num(estimate) })}
            </button>
          )}
          <p className="text-sm text-muted">
            {resting !== undefined ? t("calc.hr.resting", { bpm: num(Math.round(resting)) }) : t("calc.hr.noResting")}
          </p>
          {resting !== undefined && (
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("calc.hr.method")}>
              <Chip active={!useRest} onClick={() => setReserve(false)}>
                {t("calc.hr.pctMax")}
              </Chip>
              <Chip active={useRest} onClick={() => setReserve(true)}>
                {t("calc.hr.reserve")}
              </Chip>
            </div>
          )}
        </div>
      </Section>

      {zones.length > 0 && (
        <Section title={t("calc.hr.zones")} icon="heart" info="hrZones">
          <ul className="card divide-y divide-line" data-testid="hr-zones">
            {[...zones].reverse().map((z) => (
              <li key={z.zone} className="flex items-start gap-3 px-4 py-3">
                <span
                  className="keep-colours mt-1.5 h-3 w-3 shrink-0 rounded-full"
                  style={{ background: `var(--hr-${z.zone})` }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="font-semibold">{t("calc.hr.zone", { n: z.zone, name: t(`calc.hr.name.${z.zone}`) })}</span>
                    <span className="num font-semibold">{t("calc.hr.range", { low: num(z.low), high: num(z.high) })}</span>
                  </div>
                  <p className="text-sm text-muted">{t(`calc.hr.use.${z.zone}`)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Advice>{t("calc.hr.advice", { bpm: num(zones[1]!.high) })}</Advice>
          <p className="mt-2 text-xs text-faint">{t("calc.hr.note", { max: fmtNum(max ?? 0) })}</p>
        </Section>
      )}
    </ToolScreen>
  );
}
