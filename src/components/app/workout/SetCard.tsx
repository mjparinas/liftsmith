"use client";

import { Info } from "@/components/Info";
import type { PlanItem } from "@/lib/generator";
import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { barFor } from "@/lib/loads";
import { loadBar } from "@/lib/plates";
import { TIMED } from "@/lib/progression";
import { implementsFor, perSide } from "@/lib/sides";
import { useApp, type Active } from "@/lib/store";
import { effortAim, restLabel } from "@/lib/training";
import type { EffortScale, Exercise, Gym } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";
import { workoutWhy } from "@/lib/why";

import { loadText } from "../format";
import { Icon } from "../icons";
import { PlateBar, type PlateFinish } from "../Plates";
import { Button, Stepper } from "../ui";
import { PlateChange, SameAsLastChip, useGhost } from "../WorkoutExtras";

type Ghost = ReturnType<typeof useGhost>;
type Loading = ReturnType<typeof loadBar>;
type Bar = ReturnType<typeof barFor>;

/** One − / + stepper's settings (the number, its label and the bumps). */
export type Step = Omit<Parameters<typeof Stepper>[0], "compact" | "display">;

/**
 * The set card on the workout screen: the weight and rep steppers (only the numbers when the
 * one-handed dock holds the buttons), the warm-up, AMRAP, program, challenge or effort line with its
 * reason, "Same as last time" and the plates.
 */
export function SetCard({
  active,
  item,
  ex,
  gym,
  doneSets,
  warming,
  docked,
  weightStep,
  repStep,
  rightStep,
  sidesSplit,
  scale,
  ghost,
  loading,
  bar,
  finish,
  onWhy,
}: {
  active: Active;
  item: PlanItem;
  ex: Exercise;
  gym: Gym;
  doneSets: number;
  warming: boolean;
  /** One-handed controls are on: the steppers show the numbers only. */
  docked: boolean;
  weightStep: Step | null;
  repStep: Step | null;
  rightStep: Step | null;
  sidesSplit: boolean;
  scale: EffortScale | undefined;
  ghost: Ghost;
  loading: Loading | null;
  bar: Bar | null;
  finish: PlateFinish;
  /** Opens the "Why?" sheet. */
  onWhy: () => void;
}) {
  const s = useApp();
  const { profile } = s;
  const unit = gym.unit;
  return (
    <section className="card animate-rise mt-5 p-5">
      {active.restReady ? (
        <Button
          kind="ghost"
          icon="clock"
          className="mb-4 w-full"
          onClick={() => {
            haptic("tick");
            s.startRest();
          }}
        >
          {t("workout.startRest", { time: restLabel(active.restReady) })}
        </Button>
      ) : null}
      <div className="flex flex-col items-center gap-5">
        {ex.load !== "bodyweight" && weightStep && <Stepper display={docked} {...weightStep} />}
        {ex.load !== "bodyweight" && unit !== profile.unit && active.weight > 0 && (
          // This gym's plates are in the other unit: show the weight in the lifter's unit too.
          <p className="num -mt-3 text-sm text-muted">
            ≈ {fmtNum(Math.round(fromKg(active.weight, profile.unit) * 10) / 10)} {profile.unit}
            {ex.load === "dumbbell" && implementsFor(ex) === 2 ? " each" : ""}
          </p>
        )}
        {repStep && <Stepper display={docked} {...repStep} />}
        {rightStep && <Stepper display={docked} {...rightStep} />}
        {!warming && perSide(ex.id) && !TIMED.has(ex.id) && (
          <button
            type="button"
            onClick={() => {
              haptic("tick");
              s.adjustRight(sidesSplit ? undefined : active.reps);
            }}
            className="press -mt-2 min-h-11 px-3 text-sm font-semibold text-accent"
          >
            {sidesSplit ? t("workout.sidesSame") : t("workout.sidesDiffer")}
          </button>
        )}
      </div>
      {active.tag ? (
        <div className="mt-4 rounded-xl bg-accent/10 px-3 py-2 text-center text-sm">
          <p className="font-semibold text-accent">{t(active.tag === "drop" ? "wk.dropLine" : "wk.restPauseLine")}</p>
          <button
            type="button"
            onClick={() => {
              haptic("tick");
              s.extraSet(undefined);
            }}
            className="press min-h-11 px-3 font-semibold text-accent underline underline-offset-2"
          >
            {t("wk.extraCancel")}
          </button>
        </div>
      ) : warming ? (
        <div className="mt-4 text-center text-sm text-muted">
          <p>
            {/* The "i" goes after the whole sentence, so it never splits it ("reps (i) . Working weight"). */}
            {t("wk.warmLine")}
            {t("wk.working", { load: loadText(ex, item.target.weight, profile.unit) })}
            <Info term="warmup" className="-my-3 -ml-1" />
          </p>
          <button
            type="button"
            onClick={() => {
              haptic("tick");
              s.skipWarmup();
            }}
            className="press mt-1 min-h-11 px-3 font-semibold text-accent"
          >
            {t("workout.skipWarmup")}
          </button>
        </div>
      ) : item.setTargets?.[doneSets]?.amrap ? (
        <p className="mt-3 rounded-xl bg-accent/10 px-3 py-2 text-center text-sm font-semibold text-accent">
          {t("wk.amrap", { n: item.setTargets[doneSets].reps })}
        </p>
      ) : item.slot ? (
        <p className="mt-3 text-center text-sm text-muted">
          {item.label ? `${item.label} · ` : ""}
          {item.target.note}
        </p>
      ) : item.challenge && doneSets + 1 === item.sets ? (
        <p className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-ember/40 bg-ember/12 px-3 py-2 text-center text-sm font-semibold text-ember">
          <Icon name="bolt" size={16} strokeWidth={2.4} />
          {t("wk.challenge")}
        </p>
      ) : (
        <p className="mt-4 text-center text-sm text-muted">
          {effortAim(item.target.rir, scale)}
          <Info term={scale === "rpe" ? "rpe" : "rir"} /> · {workoutWhy(item, active.plan)}{" "}
          <button
            type="button"
            onClick={onWhy}
            className="press inline-flex min-h-11 items-center px-1 text-accent underline underline-offset-2"
          >
            {t("coach.why")}
          </button>
        </p>
      )}
      <SameAsLastChip
        ghost={ghost}
        setIndex={doneSets}
        ex={ex}
        unit={profile.unit}
        weight={active.weight}
        reps={active.reps}
        onUse={(w, r) => s.adjust(w, r)}
      />
      {loading && bar && (
        <div className="mt-4 border-t border-line pt-4">
          <PlateBar loading={loading} bar={bar.weight} unit={unit} finish={finish} />
          <PlateChange ex={ex} gym={gym} kg={active.weight} sessionId={active.sessionId} />
        </div>
      )}
    </section>
  );
}
