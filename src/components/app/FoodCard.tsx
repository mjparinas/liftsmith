"use client";

// Food on Body › Health (Melvin picked it, 2026-11-15): one short line on how the last week of the lifter's food app
// compares with their targets (foodTargets.ts, the same numbers the coach's notes use), with what the targets are
// for, and one button to Tools › Macros. With nothing from a food app yet, on a phone already connected to Health, it
// offers to let food in (lifters who connected before food was read were never asked) and says what that brings.
// Liftsmith logs no food itself (docs/decisions/food-from-health.md).
import { useMemo, useState } from "react";

import { foodTargets } from "@/lib/foodTargets";
import { askHealth } from "@/lib/health";
import { inSentence, t } from "@/lib/i18n";
import { foodDays, weekIntake, weekProtein } from "@/lib/nutrition";
import { useApp } from "@/lib/store";
import { useCoachNotes } from "@/lib/trainer";
import { fmtNum } from "@/lib/units";

import { go } from "./router";
import { Button, Section } from "./ui";

const HIDE = "liftsmith.foodNudge.hidden";
const hidden = () => {
  try {
    return localStorage.getItem(HIDE) === "1";
  } catch {
    return false;
  }
};

export function FoodCard({ native, store, now }: { native: boolean; store: string; now: number }) {
  const { events, stats, profile } = useApp();
  const coach = useCoachNotes((s) => s.targets);
  const days = useMemo(() => foodDays(events, now, 21), [events, now]);
  const ft = useMemo(
    () => (days.length ? foodTargets(events, stats.sessions, profile, now, coach) : null),
    [days.length, events, stats.sessions, profile, now, coach],
  );
  const connected = events.some((e) => e.type === "health");
  const [gone, setGone] = useState(hidden);
  const [asked, setAsked] = useState<"idle" | "busy" | "done">("idle");

  if (!ft) {
    if (!native || !connected || gone) return null;
    const ask = async () => {
      setAsked("busy");
      await askHealth(["dietaryEnergyConsumed"]).catch(() => undefined);
      await useApp
        .getState()
        .importHealthDaily()
        .catch(() => undefined);
      setAsked("done");
    };
    const hide = () => {
      try {
        localStorage.setItem(HIDE, "1");
      } catch {
        /* private window */
      }
      setGone(true);
    };
    return (
      <Section title={t("food.title")} icon="leaf">
        <div className="card p-4" data-testid="food-connect">
          <p className="text-sm text-muted">
            {asked === "done" ? t("food.connect.done", { source: store }) : t("food.connect.body", { source: store })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {asked !== "done" && (
              <Button kind="ghost" icon="leaf" disabled={asked === "busy"} onClick={() => void ask()}>
                {t("food.connect", { source: store })}
              </Button>
            )}
            <Button kind="ghost" onClick={hide}>
              {t("food.connect.hide")}
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  const intake = ft.teen ? null : weekIntake(days, now);
  const protein = weekProtein(days, now);
  const parts = [
    intake && ft.kcal ? t("food.kcal", { avg: fmtNum(Math.round(intake.avg / 10) * 10), target: fmtNum(ft.kcal) }) : null,
    protein ? t("food.protein", { avg: protein.avg, target: ft.protein }) : null,
    intake?.carbs !== undefined && ft.carbs ? t("food.carbs", { avg: intake.carbs, target: ft.carbs }) : null,
    intake?.fat !== undefined && ft.fat ? t("food.fat", { avg: intake.fat, target: ft.fat }) : null,
  ].filter((x): x is string => !!x);
  const why = ft.coach
    ? t("food.why.coach", { name: ft.coach.name || t("ins.yourCoach") })
    : ft.measured
      ? t("food.why.measured", { goal: inSentence(t(`calc.mac.goal.${ft.goal}`)), days: ft.measured.days })
      : t("food.why.goal", { goal: inSentence(t(`calc.mac.goal.${ft.goal}`)) });

  return (
    <Section title={t("food.title")} icon="leaf">
      <div className="card p-4" data-testid="food-week">
        <p className="num font-semibold">{parts.length ? parts.join(" · ") : t("food.notEnough")}</p>
        <p className="mt-1 text-sm text-muted">{why}</p>
        <Button kind="ghost" className="mt-3" onClick={() => go("tools", "macros")}>
          {t("food.open")}
        </Button>
      </div>
    </Section>
  );
}
