"use client";

// Tools › Macros: calories for the lifter's goal from their TDEE (tdee.ts, kept current from weigh-ins and
// training), then protein, fat and carbs (calculators.ts), each with the reason for its number.
import { useEffect, useMemo } from "react";

import { track } from "@/lib/analytics";
import { goalCalories, MACRO_GOALS, macros, PROTEIN_PER_KG, type MacroGoal } from "@/lib/calculators";
import { list, num, t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { currentKg, currentTdee } from "@/lib/tdee";
import { fmtNum } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { StatsNeeded } from "../BodyStats";
import { go } from "../router";
import { Chip, Section } from "../ui";
import { Advice, ToolScreen } from "./shared";

const COLOUR = { protein: "var(--color-accent)", fat: "var(--color-ember)", carbs: "var(--color-mint)" } as const;

export function MacrosTool() {
  const { events, stats, profile, setProfile } = useApp();
  const now = useNow(60_000);
  const cur = useMemo(() => currentTdee(events, stats.sessions, profile, now), [events, stats.sessions, profile, now]);
  const goal: MacroGoal = profile.tdee?.goal ?? "maintain";
  const kg = currentKg(events, profile);
  useEffect(() => track("feature", { name: "tool_macros" }), []);
  const r = cur.result;
  const kcal = r ? goalCalories(r.tdee, r.bmr, goal) : 0;
  const m = macros(kcal, kg, goal);
  const lb = profile.unit === "lb";
  const pace = (kgPerWeek: number) => (lb ? `${fmtNum(kgPerWeek * 2)} lb` : `${fmtNum(kgPerWeek)} kg`);

  const kcalWhy = !r
    ? ""
    : goal === "cut"
      ? kcal === r.bmr && r.tdee - 500 < r.bmr
        ? t("calc.mac.why.cutFloor", { bmr: num(r.bmr) })
        : t("calc.mac.why.cut", { tdee: num(r.tdee), pace: pace(0.5) })
      : goal === "bulk"
        ? t("calc.mac.why.bulk", { tdee: num(r.tdee), pace: pace(0.25) })
        : t("calc.mac.why.maintain", { tdee: num(r.tdee) });

  const rows = [
    {
      key: "protein",
      g: m.protein,
      share: m.split.protein,
      why: t(`calc.mac.why.protein.${goal}`, { perKg: fmtNum(PROTEIN_PER_KG[goal]) }),
    },
    { key: "fat", g: m.fat, share: m.split.fat, why: t("calc.mac.why.fat") },
    { key: "carbs", g: m.carbs, share: m.split.carbs, why: t("calc.mac.why.carbs") },
  ] as const;

  return (
    <ToolScreen title={t("calc.mac.title")} blurb={t("calc.mac.blurb")}>
      <Section title={t("calc.mac.goal")}>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("calc.mac.goal")}>
          {MACRO_GOALS.map((g) => (
            <Chip key={g} active={goal === g} onClick={() => setProfile({ tdee: { ...profile.tdee, goal: g } })}>
              {t(`calc.mac.goal.${g}`)}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={t("calc.mac.day")} icon="flame">
        <StatsNeeded need={["sex", "age", "height"]} />
        {r ? (
          <div className="card p-4" aria-live="polite">
            <div className="num text-4xl font-extrabold" data-testid="macros-kcal">
              {num(m.kcal)} <span className="text-lg font-semibold text-muted">{t("calc.mac.kcal")}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{kcalWhy}</p>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-raised" aria-hidden>
              {rows.map((x) => (
                <span key={x.key} style={{ width: `${x.share * 100}%`, background: COLOUR[x.key] }} />
              ))}
            </div>
            <ul className="mt-3 divide-y divide-line">
              {rows.map((x) => (
                <li key={x.key} className="py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLOUR[x.key] }} aria-hidden />
                      {t(`calc.mac.${x.key}`)}
                    </span>
                    <span className="num">
                      <span className="text-lg font-bold" data-testid={`macros-${x.key}`}>
                        {t("calc.mac.grams", { g: num(x.g) })}
                      </span>{" "}
                      <span className="text-sm text-muted">{Math.round(x.share * 100)}%</span>
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{x.why}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="card p-4 text-muted">{t("tdee.missing", { items: list(cur.missing.map((x) => t(`tdee.missing.${x}`))) })}</p>
        )}
        {r && (
          <>
            <Advice>{t("calc.mac.advice", { g: num(m.protein), meals: num(Math.max(3, Math.round(m.protein / 40))) })}</Advice>
            <button type="button" onClick={() => go("tools", "tdee")} className="press mt-1 min-h-11 text-sm font-semibold text-accent">
              {t("calc.mac.tdeeLink")} ›
            </button>
          </>
        )}
      </Section>
    </ToolScreen>
  );
}
