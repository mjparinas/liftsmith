"use client";

import { useState } from "react";

import { pastWorkoutEvents } from "@/lib/dashboard";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { exerciseName } from "@/lib/game";
import { clockTime, relative, t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { toast } from "@/lib/toast";
import { fromKg, toKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { ExerciseBrowser } from "./ExerciseBrowser";
import { Icon } from "./icons";
import { goBack } from "./router";
import { Bump, BumpField, Button, Chip, ScreenHeader, Sheet } from "./ui";

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

const pad = (n: number) => String(n).padStart(2, "0");
/** A local day as the date input's value ("2026-11-12"). */
function dayInput(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Local midnight of `ms`, `back` days earlier. */
function dayStart(ms: number, back = 0): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - back);
  return d.getTime();
}
const TIME_STEP = 15;

function weightLabel(exerciseId: string, unit: string): string {
  const load = EXERCISE_BY_ID.get(exerciseId)?.load;
  if (load === "bodyweight") return t("past.added", { unit });
  if (load === "dumbbell" || load === "kettlebell") return t("past.each", { unit });
  return t("past.weight", { unit });
}

const cap = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

let n = 0;
const key = () => `row-${++n}`;

export function LogPast() {
  const now = useNow(60_000);
  const { profile, gyms, importWorkouts } = useApp();
  const unit = profile.unit;
  const gym = gyms.find((g) => g.id === profile.activeGymId);
  // The day is a chip (today, yesterday, two days ago) or, under Earlier, the phone's date picker; the time is a
  // − / + stepper in quarter hours. No typing (polish pass, 2026-11-12).
  const [day, setDay] = useState(() => dayStart(now - 3600_000));
  const [earlier, setEarlier] = useState(false);
  const [time, setTime] = useState(() => {
    const d = new Date(now - 3600_000);
    return Math.floor((d.getHours() * 60 + d.getMinutes()) / TIME_STEP) * TIME_STEP;
  });
  const start = day + time * 60_000;
  const recent = [0, 1, 2].map((back) => dayStart(now, back));
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
        start,
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
          <div>
            <span className="text-sm text-muted" id="past-day">
              {t("past.day")}
            </span>
            <div className="mt-1 flex flex-wrap gap-2" role="group" aria-labelledby="past-day">
              {recent.map((d, i) => (
                <Chip
                  key={d}
                  active={!earlier && day === d}
                  onClick={() => {
                    setEarlier(false);
                    setDay(d);
                  }}
                >
                  {cap(relative(-i, "day"))}
                </Chip>
              ))}
              <Chip active={earlier} onClick={() => setEarlier(true)}>
                {t("past.earlier")}
              </Chip>
            </div>
            {earlier && (
              <input
                type="date"
                aria-label={t("past.day")}
                value={dayInput(day)}
                max={dayInput(now)}
                onChange={(e) => {
                  const [y, m, d] = e.target.value.split("-").map(Number);
                  if (y && m && d) setDay(new Date(y, m - 1, d).getTime());
                }}
                className="card num mt-2 w-full px-3 py-3"
              />
            )}
            <span className="mt-4 block text-sm text-muted">{t("past.at")}</span>
            <div className="mt-1 flex items-center gap-3">
              <Bump
                dir={-1}
                size="sm"
                aria={t("past.earlierTime")}
                onStep={() => {
                  if (time < TIME_STEP) return false;
                  setTime((v) => Math.max(0, v - TIME_STEP));
                  return true;
                }}
              />
              <output className="num card flex-1 px-3 py-2.5 text-center font-semibold" aria-live="polite">
                {clockTime(Math.floor(time / 60), time % 60)}
              </output>
              <Bump
                dir={1}
                size="sm"
                aria={t("past.laterTime")}
                onStep={() => {
                  if (time + TIME_STEP >= 24 * 60) return false;
                  setTime((v) => Math.min(24 * 60 - TIME_STEP, v + TIME_STEP));
                  return true;
                }}
              />
            </div>
          </div>
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
