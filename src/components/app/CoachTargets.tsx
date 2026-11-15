"use client";

// Daily nutrition targets from a coach (2026-11-13; Melvin: "nutrition targets for clients"). The coach sets calories
// and grams of protein for a client on their report, and since 2026-11-15 carbs, fat and a rest-day calorie number
// too, with one tap to fill them in from the client's own numbers. The client sees them under Coaching with how their
// week compares, and their coach's notes judge their food week against them (insights.ts). A client under 18 gets
// protein only. Liftsmith logs no food: when the client shares body data, the coach also sees what their food app
// wrote to Health Connect or Apple Health (docs/decisions/trainer-mode.md).
import { useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { macros } from "@/lib/calculators";
import { proteinFor } from "@/lib/foodTargets";
import { parseNum, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { measuredTdee, type Intake } from "@/lib/nutrition";
import { foodWeek, saveTargets, trainerError, type BodyShare, type Targets, type TargetValues } from "@/lib/trainer";
import type { AppEvent } from "@/lib/types";
import { fmtNum } from "@/lib/units";

import { BumpField, Button, InlineSwitch, Section } from "./ui";

const KCAL = { start: 2200, step: 50, min: 800, max: 6000 };
const PROTEIN = { start: 140, step: 5, min: 30, max: 400 };
const CARBS = { start: 250, step: 5, min: 20, max: 900 };
const FAT = { start: 70, step: 5, min: 15, max: 300 };

const num = (s: string, lo: number, hi: number) => {
  const n = parseNum(s);
  return Number.isFinite(n) && n >= lo && n <= hi ? Math.round(n) : null;
};
const str = (n: number | null | undefined) => (n ? String(n) : "");

/**
 * Targets from what a client shares: protein at 1.8 g per kg of their newest weight, calories at their measured
 * maintenance (food and weigh-ins, nutrition.ts measuredTdee) or else last week's average, and carbs and fat split
 * from those the way Tools › Macros does. Null when there's nothing to go on. Exported for tests.
 */
export function suggestTargets(body: BodyShare | null, now: number): (TargetValues & { from: "measured" | "week" | "weight" }) | null {
  const kg = body?.weights.at(-1)?.kg;
  if (!body || !kg) return null;
  const events: AppEvent[] = [
    ...body.weights.map((w, i): AppEvent => ({ type: "bodyweight", id: `w${i}`, at: w.at, kg: w.kg })),
    ...(body.food ?? []).flatMap((d, i): AppEvent[] =>
      d.kcal === undefined ? [] : [{ type: "health", id: `k${i}`, at: dayEnd(d.day), metric: "kcalIn", day: d.day, value: d.kcal }],
    ),
  ];
  const measured = measuredTdee(events, now)?.kcal;
  const week = foodWeek({ body }, now)?.kcal ?? null;
  const kcal = measured ?? week;
  const protein = proteinFor(kg, "maintain");
  const m = kcal ? macros(kcal, kg, "maintain") : null;
  return {
    kcal: kcal ? Math.round(kcal / 50) * 50 : null,
    protein: Math.round(protein / 5) * 5,
    carbs: m ? Math.round(m.carbs / 5) * 5 : null,
    fat: m ? Math.round(m.fat / 5) * 5 : null,
    kcalRest: null,
    from: measured ? "measured" : week ? "week" : "weight",
  };
}
const dayEnd = (day: string) => {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d + 1).getTime() - 1;
};

/** The coach's side, on a client's report. */
export function ClientTargets({
  clientId,
  saved,
  body,
  teen,
  name,
  now,
  onChange,
}: {
  clientId: string;
  saved: Targets | null;
  body: BodyShare | null;
  /** The client is under 18: protein only. */
  teen: boolean;
  name: string;
  now: number;
  onChange: () => void;
}) {
  const [kcal, setKcal] = useState(str(saved?.kcal));
  const [protein, setProtein] = useState(str(saved?.protein));
  const [carbs, setCarbs] = useState(str(saved?.carbs));
  const [fat, setFat] = useState(str(saved?.fat));
  const [rest, setRest] = useState(str(saved?.kcalRest));
  const [restOn, setRestOn] = useState(!!saved?.kcalRest);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const v: TargetValues = {
    kcal: teen ? null : num(kcal, KCAL.min, KCAL.max),
    protein: num(protein, PROTEIN.min, PROTEIN.max),
    carbs: teen ? null : num(carbs, CARBS.min, CARBS.max),
    fat: teen ? null : num(fat, FAT.min, FAT.max),
    kcalRest: teen || !restOn ? null : num(rest, KCAL.min, KCAL.max),
  };
  const changed = (Object.keys(v) as (keyof TargetValues)[]).some((k) => v[k] !== (saved?.[k] ?? null));
  const empty = Object.values(v).every((x) => x === null);
  const week = body ? foodWeek({ body }, now) : null;
  const suggestion = useMemo(() => suggestTargets(body, now), [body, now]);

  const fill = () => {
    if (!suggestion) return;
    haptic("select");
    setProtein(str(suggestion.protein));
    if (!teen) {
      setKcal(str(suggestion.kcal));
      setCarbs(str(suggestion.carbs));
      setFat(str(suggestion.fat));
    }
    setNote(t(`trn.targetsFilled.${teen ? "weight" : suggestion.from}`, { name: name || t("trn.noName") }));
  };

  const save = async (clear: boolean) => {
    setBusy(true);
    try {
      const r = await saveTargets(clientId, clear ? { kcal: null, protein: null, carbs: null, fat: null, kcalRest: null } : v);
      if (!r) {
        for (const set of [setKcal, setProtein, setCarbs, setFat, setRest]) set("");
        setRestOn(false);
      }
      haptic("success");
      track("feature", { name: "trainer", detail: r ? "targets" : "untargets" });
      setNote(r ? t("trn.targetsSaved") : t("trn.targetsCleared"));
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    } finally {
      setBusy(false);
    }
  };

  const field = (id: string, label: string, value: string, set: (s: string) => void, range: typeof KCAL) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <BumpField id={id} label={label} value={value} onChange={set} {...range} />
    </div>
  );

  return (
    <Section title={t("trn.targets")} icon="leaf">
      <div className="card p-4">
        <p className="text-sm text-muted">{teen ? t("trn.targetsTeen") : t("trn.targetsHint")}</p>
        {suggestion && (
          <Button kind="ghost" className="mt-2" disabled={busy} onClick={fill}>
            {t("trn.targetsFill")}
          </Button>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {!teen && field("trn-kcal", restOn ? t("trn.targetsKcalTraining") : t("trn.targetsKcal"), kcal, setKcal, KCAL)}
          {field("trn-protein", t("trn.targetsProtein"), protein, setProtein, PROTEIN)}
          {!teen && field("trn-carbs", t("trn.targetsCarbs"), carbs, setCarbs, CARBS)}
          {!teen && field("trn-fat", t("trn.targetsFat"), fat, setFat, FAT)}
        </div>
        {!teen && (
          <>
            <InlineSwitch
              className="mt-3"
              label={t("trn.targetsRestOn")}
              hint={t("trn.targetsRestHint")}
              on={restOn}
              onChange={setRestOn}
            />
            {restOn && <div className="mt-2">{field("trn-kcal-rest", t("trn.targetsKcalRest"), rest, setRest, KCAL)}</div>}
          </>
        )}
        {week ? (
          <p className="mt-3 text-sm">
            {week.kcal !== null && !teen && t("trn.targetsWeek", { count: week.days, kcal: fmtNum(week.kcal) })}
            {week.protein !== null && ` ${t("trn.targetsWeekProtein", { protein: week.protein })}`}
            {!teen && week.carbs !== null && week.fat !== null && ` ${t("trn.targetsWeekMacros", { carbs: week.carbs, fat: week.fat })}`}
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted">{body ? t("trn.targetsNoFood") : t("trn.targetsAskShare")}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button className="flex-1" disabled={busy || !changed || empty} onClick={() => void save(false)}>
            {t("trn.targetsSave")}
          </Button>
          {saved && (
            <Button kind="ghost" disabled={busy} onClick={() => void save(true)}>
              {t("trn.targetsClear")}
            </Button>
          )}
        </div>
        {note && (
          <p className="mt-2 text-sm text-muted" role="status">
            {note}
          </p>
        )}
      </div>
    </Section>
  );
}

/**
 * The client's side, under Your coach: what their coach asked them to eat each day, and how the last week of their
 * food app compares (nutrition.ts, from this phone's own readings).
 */
export function TargetsCard({
  targets,
  coach,
  week,
}: {
  targets: Targets;
  coach: string;
  week?: { intake: Intake | null; protein: number | null } | null;
}) {
  const parts = [
    targets.kcal ? t("trn.targetsKcalValue", { kcal: fmtNum(targets.kcal) }) : null,
    targets.kcalRest ? t("trn.targetsKcalRestValue", { kcal: fmtNum(targets.kcalRest) }) : null,
    targets.protein ? t("trn.targetsProteinValue", { protein: targets.protein }) : null,
    targets.carbs ? t("trn.targetsCarbsValue", { carbs: targets.carbs }) : null,
    targets.fat ? t("trn.targetsFatValue", { fat: targets.fat }) : null,
  ].filter(Boolean);
  const youAte = [
    week?.intake && targets.kcal ? t("trn.targetsYouKcal", { kcal: fmtNum(week.intake.avg) }) : null,
    week?.protein != null && targets.protein ? t("trn.targetsYouProtein", { protein: week.protein }) : null,
  ].filter(Boolean);
  return (
    <div className="card mt-3 p-4">
      <p className="text-xs text-muted">{t("trn.targetsFrom", { name: coach || t("trn.noName") })}</p>
      <p className="num mt-1 text-lg font-semibold">{parts.join(" · ")}</p>
      {youAte.length > 0 && <p className="num mt-1 text-sm">{t("trn.targetsYouWeek", { what: youAte.join(" · ") })}</p>}
      <p className="mt-1 text-sm text-muted">{t("trn.targetsClientHint")}</p>
    </div>
  );
}
