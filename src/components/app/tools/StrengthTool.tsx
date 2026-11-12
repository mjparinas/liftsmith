"use client";

// Tools › Strength score: the squat, bench and deadlift total from the lifter's estimated maxes (onerm.ts)
// scored three ways (DOTS, Wilks, IPF GL), with what it takes to reach the next DOTS level and the lift that's
// furthest behind lifters of the same size, which is usually the cheapest place to find it.
import { useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { ipfGl, nextDotsLevel, totalFor, wilks } from "@/lib/calculators";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { list as listOf, num, t } from "@/lib/i18n";
import { dots, DOTS_LIFTS, dotsBand, dotsFromData, type DotsLift } from "@/lib/onerm";
import { useApp } from "@/lib/store";
import { liftStanding } from "@/lib/strength";
import { fmtNum, fromKg, toKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { ageOf, StatsNeeded } from "../BodyStats";
import { StepValue, weightStep } from "../OneRepMax";
import { Section } from "../ui";
import { Advice, Figure, ToolScreen } from "./shared";

const LIFTS = Object.keys(DOTS_LIFTS) as DotsLift[];
const liftName = (k: DotsLift) => t(`dots.lift.${k}`);

export function StrengthTool() {
  const { events, profile } = useApp();
  const now = useNow(3600_000);
  const unit = profile.unit;
  const sex = profile.sex ?? "male";
  const rep = useMemo(() => dotsFromData(events, profile, now, sex), [events, profile, now, sex]);
  const [edit, setEdit] = useState<Partial<Record<DotsLift | "bw", number>>>({});
  useEffect(() => track("feature", { name: "tool_strength" }), []);

  const step = weightStep(unit);
  const kgOf = (k: DotsLift) => (edit[k] !== undefined ? toKg(edit[k]!, unit) : (rep.lifts[k]?.e1rm ?? 0));
  const bw = edit.bw !== undefined ? toKg(edit.bw, unit) : rep.bodyweight;
  const total = LIFTS.reduce((s, k) => s + kgOf(k), 0);
  const complete = LIFTS.every((k) => kgOf(k) > 0) && bw > 0 && !!profile.sex;
  const missing = LIFTS.filter((k) => !(kgOf(k) > 0)).map(liftName);
  const field = (k: DotsLift | "bw") =>
    edit[k] ??
    (k === "bw" ? Math.round(fromKg(rep.bodyweight, unit) * 2) / 2 : Math.round(fromKg(rep.lifts[k]?.e1rm ?? 0, unit) / step) * step);
  const w = (kg: number) => `${fmtNum(Math.round(fromKg(kg, unit)))} ${unit}`;

  const d = complete ? dots(total, bw, sex) : 0;
  const next = complete ? nextDotsLevel(d) : null;
  const gap = next !== null ? Math.max(step, totalFor(next, bw, (tot, b) => dots(tot, b, sex)) - total) : 0;
  // The lift furthest behind lifters of the same size, age and sex: the same standards as Progress.
  const age = ageOf(profile, now) ?? null;
  const weakest = complete
    ? LIFTS.map((k) => ({ k, pct: liftStanding(EXERCISE_BY_ID.get(DOTS_LIFTS[k])!, kgOf(k), bw, age, sex).percentile })).sort(
        (a, b) => a.pct - b.pct,
      )[0]
    : undefined;

  return (
    <ToolScreen title={t("calc.str.title")} blurb={t("calc.str.blurb")}>
      <StatsNeeded need={["sex"]} />
      <Section title={t("calc.str.scores")} icon="trophy" info="liftScores">
        <div className="card p-4">
          {complete ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Figure value={fmtNum(Math.round(d * 10) / 10)} label={t("calc.str.dots")} testId="strength-dots" />
                <Figure value={fmtNum(Math.round(wilks(total, bw, sex) * 10) / 10)} label={t("calc.str.wilks")} />
                <Figure value={fmtNum(Math.round(ipfGl(total, bw, sex) * 10) / 10)} label={t("calc.str.gl")} />
              </div>
              <p className="mt-3 font-semibold">{dotsBand(d)}</p>
              <p className="num text-sm text-muted">
                {t("calc.str.total", { total: w(total), bw: `${fmtNum(Math.round(fromKg(bw, unit) * 10) / 10)} ${unit}` })}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">{missing.length ? t("dots.missing", { names: listOf(missing) }) : t("calc.str.needSex")}</p>
          )}
        </div>
        {complete && weakest && (
          <Advice>
            {next !== null ? t("calc.str.next", { weight: w(gap), band: dotsBand(next), score: num(next) }) : t("calc.str.top")}{" "}
            {t("calc.str.weakest", { lift: liftName(weakest.k), pct: num(weakest.pct) })}
          </Advice>
        )}
      </Section>

      <Section title={t("calc.str.inputs")}>
        <div className="card p-4">
          <div className="grid grid-cols-2 gap-3">
            {LIFTS.map((k) => (
              <StepValue
                key={k}
                label={liftName(k)}
                value={field(k)}
                onChange={(v) => setEdit({ ...edit, [k]: v })}
                step={step}
                suffix={unit}
              />
            ))}
            <StepValue
              label={t("dots.bw")}
              value={field("bw")}
              onChange={(v) => setEdit({ ...edit, bw: v })}
              step={unit === "lb" ? 1 : 0.5}
              min={30}
              suffix={unit}
            />
          </div>
          {Object.keys(edit).length > 0 && (
            <button type="button" onClick={() => setEdit({})} className="press mt-2 min-h-11 text-sm text-accent">
              {t("dots.reset")}
            </button>
          )}
          <p className="mt-2 text-xs text-faint">{t("calc.str.note")}</p>
        </div>
      </Section>
    </ToolScreen>
  );
}
