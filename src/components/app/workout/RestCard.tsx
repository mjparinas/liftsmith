"use client";

import { type CSSProperties } from "react";

import { Info } from "@/components/Info";
import { exercise } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { activeInjuries, effectFor, PART_LABEL } from "@/lib/injury";
import { haptic, sound } from "@/lib/juice";
import { barFor } from "@/lib/loads";
import { loadBar } from "@/lib/plates";
import { TIMED } from "@/lib/progression";
import { useApp, type Active } from "@/lib/store";
import { effortChoices } from "@/lib/training";
import type { EffortScale, Exercise, Gym, SetEvent, SetTag } from "@/lib/types";

import { clock, loadText, repsText } from "../format";
import { PainSelect } from "../Injuries";
import { PlateBar, type PlateFinish } from "../Plates";
import { HUE } from "../theme";
import { Button, Ring } from "../ui";
import { GhostLine, PlateChange, RestExtra, useGhost } from "../WorkoutExtras";
import { AlmostThere } from "../WorkoutJuice";
import { HrReadyLine, TipCard } from "./Polish";

type Ghost = ReturnType<typeof useGhost>;
type Loading = ReturnType<typeof loadBar>;
type Bar = ReturnType<typeof barFor>;

/**
 * The rest card on the workout screen: the countdown with +30 s and Skip, ghost mode, the optional
 * set-effort, feedback and pain checks, and what's next with its plates so the lifter can load while resting.
 */
export function RestCard({
  active,
  ex,
  gym,
  left,
  ghost,
  doneSets,
  lastSet,
  rated,
  scale,
  loading,
  bar,
  finish,
  now,
  setsLogged,
  lastSetStart,
}: {
  active: Active;
  ex: Exercise;
  gym: Gym;
  /** Seconds of rest left. */
  left: number;
  ghost: Ghost;
  /** Working sets of this exercise logged so far. */
  doneSets: number;
  /** The set just logged, for the optional reps-left question. */
  lastSet: SetEvent | undefined;
  rated: boolean;
  scale: EffortScale | undefined;
  loading: Loading | null;
  bar: Bar | null;
  finish: PlateFinish;
  now: number;
  /** Working sets logged in this workout, for the tip (one per workout, never on the first rest). */
  setsLogged: number;
  /** When the set just finished started, for the heart-rate-ready line. */
  lastSetStart: number | undefined;
}) {
  const s = useApp();
  const { events, profile } = s;
  const unit = gym.unit;
  return (
    <section className="card-tint animate-pop mt-5 flex flex-col items-center p-5" style={{ "--tint": HUE.cyan } as CSSProperties}>
      <Ring value={left / Math.max(1, active.restTotal)} from={HUE.cyan} to={HUE.accent} stroke={14}>
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan">{t("workout.rest")}</div>
          <div
            role="timer"
            aria-label={t("workout.restLeft", { time: clock(left) })}
            className={`display mt-1 text-[4rem] ${left <= 3.5 ? "animate-pulse text-cyan" : ""}`}
          >
            {clock(left)}
          </div>
        </div>
      </Ring>
      <div className="mt-4 flex gap-3">
        <Button kind="ghost" icon="plus" onClick={() => s.addRest(30)} label={t("workout.add30")}>
          30 s
        </Button>
        <Button kind="ghost" icon="chevronRight" onClick={() => s.skipRest()}>
          {t("workout.skipRest")}
        </Button>
      </div>
      <HrReadyLine active={active} setStart={lastSetStart} now={now} />
      <GhostLine
        ghost={ghost}
        logged={events.filter((e) => e.type === "set" && e.sessionId === active.sessionId && e.exerciseId === ex.id)}
        nextIndex={doneSets}
        unit={profile.unit}
      />
      {lastSet && !rated && (
        <Effort
          target={lastSet.rir}
          scale={scale}
          onPick={(r) => {
            haptic("tick");
            s.rateEffort(lastSet.id, r);
          }}
        />
      )}
      {lastSet && !active.tag && !TIMED.has(lastSet.exerciseId) && <ExtraSet lastSet={lastSet} onPick={s.extraSet} />}
      {active.askFeedback && <Feedback name={exercise(active.askFeedback).name} onPick={s.feedback} />}
      {lastSet && <PainCheck sessionId={active.sessionId} exerciseId={lastSet.exerciseId} />}
      <div className="mt-5 w-full border-t border-line/70 pt-4">
        <p className="text-center text-sm text-muted">
          {t("workout.nextUp")}{" "}
          <span className="font-semibold text-ink">
            {loadText(ex, active.weight, profile.unit)} × {repsText(ex, active.reps)}
          </span>
        </p>
        {loading && bar && (
          <div className="mt-2">
            <PlateBar loading={loading} bar={bar.weight} unit={unit} compact finish={finish} />
          </div>
        )}
        <AlmostThere exerciseId={ex.id} weight={active.weight} reps={active.reps} />
        <PlateChange ex={ex} gym={gym} kg={active.weight} sessionId={active.sessionId} />
      </div>
      <RestExtra left={left} gym={gym} />
      <TipCard active={active} setsLogged={setsLogged} />
    </section>
  );
}

/**
 * Optional, during rest: add a bonus set of the exercise just done, a drop set (lighter, straight away)
 * or a rest-pause set (same weight after a short pause). Never shown during a set.
 */
function ExtraSet({ lastSet, onPick }: { lastSet: SetEvent; onPick: (kind: SetTag) => void }) {
  const ex = exercise(lastSet.exerciseId);
  const kinds: SetTag[] = ex.load === "bodyweight" || lastSet.weight <= 0 ? ["restPause"] : ["drop", "restPause"];
  return (
    <div className="animate-rise mt-4 w-full text-center">
      <p className="text-sm text-muted">
        {t("wk.extraAsk")}
        <Info term="setTypes" />
      </p>
      <div className={`mt-1 grid gap-2 ${kinds.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {kinds.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              haptic("select");
              sound.tick();
              onPick(k);
            }}
            className="press min-h-11 rounded-xl border border-line bg-surface px-2 py-2 text-sm font-semibold"
          >
            {t(k === "drop" ? "wk.dropSet" : "wk.restPause")}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Feedback({ name, onPick }: { name: string; onPick: (r: -1 | 0 | 1) => void }) {
  return (
    <div className="animate-rise mt-4 w-full rounded-2xl border border-line bg-raised/70 p-3 text-center">
      <p className="text-sm text-muted">{t("workout.howWas", { name })}</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {(
          [
            [1, t("workout.tooEasy")],
            [0, t("workout.aboutRight")],
            [-1, t("workout.tooHard")],
          ] as const
        ).map(([r, l]) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              haptic("select");
              sound.tick();
              onPick(r);
            }}
            className="press min-h-11 rounded-xl border border-line bg-surface py-2 text-sm font-medium hover:border-accent/50"
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Optional, during rest: how many more reps the lifter could have done on the set just logged. */
function Effort({ target, scale, onPick }: { target: number; scale?: "rir" | "rpe"; onPick: (rir: number) => void }) {
  const rpe = scale === "rpe";
  const aim = effortChoices(scale).find((c) => c.rir === Math.min(4, target))?.label ?? String(target);
  return (
    <div className="animate-rise mt-4 w-full text-center">
      <p className="text-sm text-muted">
        {rpe ? t("wk.rpeAsk", { aim }) : t("wk.rirAsk", { aim: target })}
        <Info term={rpe ? "rpe" : "rir"} />
      </p>
      <p className="text-xs text-muted">{t(rpe ? "wk.failureRpe" : "wk.failureRir")}</p>
      <div className="mt-1 grid grid-cols-5 gap-2" role="group" aria-label={rpe ? t("wk.rpeGroup") : t("wk.rirGroup")}>
        {effortChoices(scale).map((c) => (
          <button
            key={c.rir}
            type="button"
            onClick={() => onPick(c.rir)}
            className="press num min-h-11 rounded-xl border border-line bg-surface text-sm font-semibold"
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Between sets, one optional pain check for an exercise trained despite an injury (lighter, marked
 * fine, or in a graded return): once per exercise per workout, never during a set.
 */
function PainCheck({ sessionId, exerciseId }: { sessionId: string; exerciseId: string }) {
  const { events, ratePain } = useApp();
  const ex = exercise(exerciseId);
  const hurt = activeInjuries(events).filter((i) => effectFor(ex, [i]) && effectFor(ex, [i])!.action !== "skip");
  const asked = (id: string) =>
    events.some((e) => e.type === "pain" && e.injuryId === id && e.sessionId === sessionId && e.exerciseId === exerciseId);
  const todo = hurt.filter((i) => !asked(i.id));
  if (!todo.length) return null;
  return (
    <div className="mt-3 w-full space-y-2">
      {todo.map((i) => (
        <PainSelect
          key={i.id}
          label={t("inj.pain.afterSet", { part: PART_LABEL[i.part] })}
          onRate={(n) => ratePain(i.id, n, { sessionId, exerciseId })}
        />
      ))}
    </div>
  );
}
