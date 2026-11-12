"use client";

import { useState } from "react";

import { pastWorkoutEvents } from "@/lib/dashboard";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { exerciseName } from "@/lib/game";
import { t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { toast } from "@/lib/toast";
import { fromKg, toKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { ExerciseBrowser } from "./ExerciseBrowser";
import { Icon } from "./icons";
import { goBack } from "./router";
import { BumpField, Button, ScreenHeader, Sheet } from "./ui";

// Log a workout after the fact (docs/decisions/desktop-layout.md, stage 2: it moved here from the /me/ dashboard,
// so it's in the app on every platform). Pick the day, add exercises and sets, save. It writes the same events a
// live workout does (pastWorkoutEvents, source "manual"), through the store, so stats, PRs, recovery and
// progression pick it up at once and sync sends it to the lifter's other devices. Numbers are bump fields (the
// less typing the better); the exercise comes from the one exercise browser.

interface Row {
  key: string;
  exerciseId: string;
  sets: { weight: string; reps: string }[];
}

function localInput(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function weightLabel(exerciseId: string, unit: string): string {
  const load = EXERCISE_BY_ID.get(exerciseId)?.load;
  if (load === "bodyweight") return t("past.added", { unit });
  if (load === "dumbbell" || load === "kettlebell") return t("past.each", { unit });
  return t("past.weight", { unit });
}

let n = 0;
const key = () => `row-${++n}`;

export function LogPast() {
  const now = useNow(60_000);
  const { profile, gyms, importWorkouts } = useApp();
  const unit = profile.unit;
  const gym = gyms.find((g) => g.id === profile.activeGymId);
  const [start, setStart] = useState(() => localInput(now - 3600_000));
  const [minutes, setMinutes] = useState("60");
  const [rows, setRows] = useState<Row[]>([]);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");
  const step = unit === "lb" ? 5 : 2.5;
  const barStart = unit === "lb" ? 45 : 20;

  const add = (exerciseId: string) => {
    setRows((r) => [...r, { key: key(), exerciseId, sets: [{ weight: "", reps: "" }] }]);
    setPicking(false);
  };
  const edit = (ri: number, si: number, field: "weight" | "reps", v: string) =>
    setRows((r) => r.map((row, i) => (i !== ri ? row : { ...row, sets: row.sets.map((s, j) => (j === si ? { ...s, [field]: v } : s)) })));
  const addSet = (ri: number) =>
    setRows((r) => r.map((row, i) => (i !== ri ? row : { ...row, sets: [...row.sets, { ...row.sets.at(-1)! }] })));
  const dropSet = (ri: number, si: number) =>
    setRows((r) =>
      r.flatMap((row, i) => (i !== ri ? [row] : row.sets.length > 1 ? [{ ...row, sets: row.sets.filter((_, j) => j !== si) }] : [])),
    );
  const dropRow = (ri: number) => setRows((r) => r.filter((_, i) => i !== ri));

  const save = () => {
    setError("");
    const result = pastWorkoutEvents(
      {
        start: new Date(start).getTime(),
        minutes: Number(minutes),
        gymId: profile.activeGymId,
        exercises: rows.map((r) => ({
          exerciseId: r.exerciseId,
          sets: r.sets.map((s) => ({ weight: toKg(Number(s.weight || 0), unit), reps: Number(s.reps) })),
        })),
      },
      Date.now(),
    );
    if (!result.ok) {
      haptic("error");
      return setError(result.error);
    }
    importWorkouts(result.events);
    haptic("success");
    toast(t("past.saved"));
    setRows([]);
    goBack();
  };

  return (
    <div>
      <ScreenHeader title={t("past.title")} back={{ label: t("progress.title"), onClick: goBack }} />
      <p className="text-muted">{t("past.intro")}</p>
      <form
        className="mt-5 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-muted">{t("past.started")}</span>
            <input
              type="datetime-local"
              required
              value={start}
              max={localInput(now)}
              onChange={(e) => setStart(e.target.value)}
              className="card num mt-1 w-full px-3 py-3"
            />
          </label>
          <div>
            <span className="text-sm text-muted">{t("past.length")}</span>
            <BumpField
              className="mt-1"
              value={minutes}
              onChange={setMinutes}
              step={5}
              start={60}
              min={1}
              max={600}
              label={t("past.length")}
            />
          </div>
        </div>

        <ol className="space-y-4">
          {rows.map((row, ri) => {
            const name = exerciseName(row.exerciseId);
            return (
              <li key={row.key} className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold">{name}</h2>
                  <button type="button" onClick={() => dropRow(ri)} className="press min-h-11 rounded-xl px-3 text-sm text-muted">
                    {t("past.remove")}
                  </button>
                </div>
                <ol className="mt-2 space-y-3">
                  {row.sets.map((s, si) => (
                    <li key={si} className="rounded-2xl border border-line/70 p-3">
                      <div className="flex items-center justify-between">
                        <span className="num text-sm font-medium text-muted">
                          {t("past.set")} {si + 1}
                        </span>
                        <button
                          type="button"
                          aria-label={t("past.removeSet", { name, n: si + 1 })}
                          onClick={() => dropSet(ri, si)}
                          className="press grid h-11 w-11 place-items-center rounded-xl text-muted"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <span className="text-xs text-faint">{weightLabel(row.exerciseId, unit)}</span>
                          <BumpField
                            value={s.weight}
                            onChange={(v) => edit(ri, si, "weight", v)}
                            step={step}
                            start={EXERCISE_BY_ID.get(row.exerciseId)?.load === "barbell" ? barStart : Math.round(fromKg(10, unit))}
                            max={unit === "lb" ? 2200 : 1000}
                            placeholder="0"
                            label={t("past.setWeight", { name, n: si + 1 })}
                          />
                        </div>
                        <div>
                          <span className="text-xs text-faint">{t("past.reps")}</span>
                          <BumpField
                            value={s.reps}
                            onChange={(v) => edit(ri, si, "reps", v)}
                            step={1}
                            start={8}
                            min={1}
                            max={1000}
                            label={t("past.setReps", { name, n: si + 1 })}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
                <Button kind="ghost" className="mt-3" icon="plus" onClick={() => addSet(ri)}>
                  {t("past.addSet")}
                </Button>
              </li>
            );
          })}
        </ol>

        <Button kind="ghost" className="w-full" icon="plus" onClick={() => setPicking(true)}>
          {t("past.addExercise")}
        </Button>

        {error && (
          <p role="alert" className="text-bad">
            {error}
          </p>
        )}
        <Button submit className="w-full py-4" disabled={!rows.length}>
          {t("past.save")}
        </Button>
      </form>

      <Sheet open={picking} onClose={() => setPicking(false)} title={t("past.addExercise")}>
        <ExerciseBrowser id="past" gym={gym} onPick={add} action={<Icon name="plus" size={18} />} />
      </Sheet>
    </div>
  );
}
