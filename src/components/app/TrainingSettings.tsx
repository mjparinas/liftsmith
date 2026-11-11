"use client";

import { useState } from "react";

import { exercise, EXERCISE_BY_ID } from "@/lib/exercises";
import { restFor } from "@/lib/generator";
import { t, weekday } from "@/lib/i18n";
import { repRange, TIMED } from "@/lib/progression";
import { useApp } from "@/lib/store";
import {
  isFavourite,
  LENGTH_OPTIONS,
  MAX_PRIORITIES,
  prefsFor,
  REP_RANGES,
  REST_OPTIONS,
  restLabel,
  SET_OPTIONS,
  toggleFavourite,
  togglePriority,
  withExercisePrefs,
} from "@/lib/training";
import { MUSCLE_LABEL, MUSCLES, type RestAlert, type TrainingPrefs } from "@/lib/types";

import { ExerciseBrowser } from "./ExerciseBrowser";
import { Icon } from "./icons";
import { go } from "./router";
import { Chip, ScreenHeader, Section, SwitchRow } from "./ui";

// Settings › Workout › Plan details (Melvin, 2026-11-09): rest times, rep ranges and set counts, RIR or
// RPE, favourite exercises, muscle priorities, the default workout length and the
// first day of the week. Everything is chips and taps, no typing, so it works one-handed. "Auto" always means the app's own choice, so nothing changes until the
// lifter picks something. Text lives in the catalogues (train.*).

function ChipRow<V extends string | number>({
  label,
  value,
  options,
  onPick,
}: {
  label?: string;
  value: V;
  options: [V, string][];
  onPick: (v: V) => void;
}) {
  return (
    <div className="mt-2">
      {label && <p className="mb-1.5 px-1 text-sm text-muted">{label}</p>}
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map(([v, l]) => (
          <Chip key={String(v)} active={v === value} onClick={() => onPick(v)}>
            {l}
          </Chip>
        ))}
      </div>
    </div>
  );
}

const rangeKey = (r?: [number, number]) => (r ? `${r[0]}-${r[1]}` : "auto");
const parseRange = (k: string): [number, number] | undefined => (k === "auto" ? undefined : (k.split("-").map(Number) as [number, number]));

/**
 * The rest timer: start it by itself, what happens when rest ends, and keeping the screen on. Shown in
 * Settings › Workout, next to Sounds and Vibration, which "When rest ends" follows by default.
 */
export function RestTimerSettings() {
  const { profile, setProfile } = useApp();
  const tp = profile.training ?? {};
  const put = (patch: Partial<TrainingPrefs>) => setProfile({ training: { ...profile.training, ...patch } });
  return (
    <>
      <SwitchRow label={t("train.autoRest")} on={tp.autoRest !== false} onChange={(v) => put({ autoRest: v ? undefined : false })} />
      <SwitchRow label={t("train.awake")} on={tp.keepAwake !== false} onChange={(v) => put({ keepAwake: v ? undefined : false })} />
      <Section title={t("train.timer")}>
        <ChipRow<RestAlert | "app">
          label={t("train.alert")}
          value={tp.restAlert ?? "app"}
          onPick={(v) => put({ restAlert: v === "app" ? undefined : v })}
          options={[
            ["app", t("train.alert.app")],
            ["both", t("train.alert.both")],
            ["sound", t("train.alert.sound")],
            ["vibrate", t("train.alert.vibrate")],
            ["silent", t("train.alert.silent")],
          ]}
        />
        <p className="mt-2 px-1 text-xs text-faint">{t("train.alertNote")}</p>
      </Section>
    </>
  );
}

export function TrainingSettings() {
  const { profile, setProfile } = useApp();
  const tp = profile.training ?? {};
  const put = (patch: Partial<TrainingPrefs>) => setProfile({ training: { ...profile.training, ...patch } });
  const overrides = Object.keys(tp.exercises ?? {}).filter((id) => EXERCISE_BY_ID.has(id));
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="pb-2">
      <ScreenHeader back={{ label: t("settings.back.workout"), onClick: () => go("settings", "workout") }} title={t("train.title")} />
      <p className="mt-1 text-sm text-muted">{t("train.intro")}</p>

      <Section title={t("train.rest")}>
        <ChipRow<number>
          label={t("train.compound")}
          value={tp.rest?.compound ?? 0}
          onPick={(v) => put({ rest: { ...tp.rest, compound: v || undefined } })}
          options={[[0, t("train.auto")], ...REST_OPTIONS.filter((x) => x >= 60).map((x) => [x, restLabel(x)] as [number, string])]}
        />
        <ChipRow<number>
          label={t("train.isolation")}
          value={tp.rest?.isolation ?? 0}
          onPick={(v) => put({ rest: { ...tp.rest, isolation: v || undefined } })}
          options={[[0, t("train.auto")], ...REST_OPTIONS.filter((x) => x <= 150).map((x) => [x, restLabel(x)] as [number, string])]}
        />
      </Section>

      <Section title={t("train.reps")}>
        <ChipRow<string>
          label={t("train.compound")}
          value={rangeKey(tp.reps?.compound)}
          onPick={(v) => put({ reps: { ...tp.reps, compound: parseRange(v) } })}
          options={[["auto", t("train.auto")], ...REP_RANGES.slice(0, 6).map((r) => [rangeKey(r), `${r[0]}–${r[1]}`] as [string, string])]}
        />
        <ChipRow<string>
          label={t("train.isolation")}
          value={rangeKey(tp.reps?.isolation)}
          onPick={(v) => put({ reps: { ...tp.reps, isolation: parseRange(v) } })}
          options={[["auto", t("train.auto")], ...REP_RANGES.slice(2).map((r) => [rangeKey(r), `${r[0]}–${r[1]}`] as [string, string])]}
        />
        <p className="mt-2 px-1 text-xs text-faint">{t("train.repsNote")}</p>
      </Section>

      <Section title={t("train.sets")}>
        <ChipRow<number>
          value={tp.sets ?? 0}
          onPick={(v) => put({ sets: v || undefined })}
          options={[[0, t("train.auto")], ...SET_OPTIONS.map((n) => [n, String(n)] as [number, string])]}
        />
        <p className="mt-2 px-1 text-xs text-faint">{t("train.setsNote")}</p>
      </Section>

      <Section title={t("train.effort")} info={tp.effort === "rpe" ? "rpe" : "rir"}>
        <ChipRow<string>
          value={tp.effort ?? "rir"}
          onPick={(v) => put({ effort: v === "rpe" ? "rpe" : undefined })}
          options={[
            ["rir", t("train.effort.rir")],
            ["rpe", t("train.effort.rpe")],
          ]}
        />
        <p className="mt-2 px-1 text-xs text-faint">{t("train.effortNote")}</p>
      </Section>

      <Section title={t("train.length")}>
        <ChipRow<number>
          value={tp.minutes ?? 0}
          onPick={(v) => {
            put({ minutes: v || undefined });
            if (v) setProfile({ minutes: v });
          }}
          options={[[0, t("train.lastUsed")], ...LENGTH_OPTIONS.map((m) => [m, t("train.minutes", { n: m })] as [number, string])]}
        />
        <p className="mt-2 px-1 text-xs text-faint">{t("train.lengthNote")}</p>
      </Section>

      <Section title={t("train.week")}>
        <ChipRow<number>
          value={tp.weekStart ?? 1}
          onPick={(v) => put({ weekStart: v === 0 ? 0 : undefined })}
          options={[
            [1, weekday(1, "long")],
            [0, weekday(0, "long")],
          ]}
        />
        <p className="mt-2 px-1 text-xs text-faint">{t("train.weekNote")}</p>
      </Section>

      <Section title={t("train.priorities")}>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("train.priorities")}>
          {MUSCLES.map((m) => (
            <Chip
              key={m}
              active={!!tp.priorities?.includes(m)}
              onClick={() => setProfile({ training: togglePriority(profile.training, m) })}
            >
              {MUSCLE_LABEL[m]}
            </Chip>
          ))}
        </div>
        <p className="mt-2 px-1 text-xs text-faint">{t("train.prioritiesNote", { max: MAX_PRIORITIES })}</p>
      </Section>

      <Section title={t("train.favourites")}>
        <ul className="card divide-y divide-line/70">
          {(tp.favourites ?? [])
            .filter((id) => EXERCISE_BY_ID.has(id))
            .map((id) => (
              <li key={id} className="flex items-center justify-between gap-3 px-4 py-2">
                <span className="min-w-0 truncate">{exercise(id).name}</span>
                <button
                  type="button"
                  onClick={() => setProfile({ training: toggleFavourite(profile.training, id) })}
                  className="press min-h-11 shrink-0 px-2 text-sm text-muted"
                  aria-label={t("train.removeFav", { name: exercise(id).name })}
                >
                  {t("train.remove")}
                </button>
              </li>
            ))}
          {!tp.favourites?.length && <li className="px-4 py-3 text-sm text-muted">{t("train.none")}</li>}
        </ul>
        <ExercisePicker
          id="fav"
          label={t("train.findFav")}
          skip={tp.favourites ?? []}
          onPick={(id) => setProfile({ training: toggleFavourite(profile.training, id) })}
        />
        <p className="mt-2 px-1 text-xs text-faint">{t("train.favouritesNote")}</p>
      </Section>

      <Section title={t("train.overrides")}>
        <ul className="card divide-y divide-line/70">
          {overrides.map((id) => (
            <li key={id} className="px-4 py-2">
              <button
                type="button"
                onClick={() => setOpen(open === id ? null : id)}
                className="press flex min-h-11 w-full items-center justify-between gap-3 text-left"
                aria-expanded={open === id}
              >
                <span className="min-w-0 truncate">{exercise(id).name}</span>
                <span className="shrink-0 text-sm text-muted">{summary(prefsFor(profile, id))}</span>
              </button>
              {open === id && <ExercisePrefsEditor exerciseId={id} />}
            </li>
          ))}
          {!overrides.length && <li className="px-4 py-3 text-sm text-muted">{t("train.none")}</li>}
        </ul>
        <ExercisePicker id="prefs" label={t("train.find")} skip={overrides} onPick={(id) => setOpen(id)} />
        {open && !overrides.includes(open) && (
          <div className="card mt-2 px-4 py-2">
            <p className="pt-1 font-medium">{exercise(open).name}</p>
            <ExercisePrefsEditor exerciseId={open} />
          </div>
        )}
        <p className="mt-2 px-1 text-xs text-faint">{t("train.overridesNote")}</p>
      </Section>
    </div>
  );
}

function summary(p: { rest?: number; reps?: [number, number]; sets?: number }): string {
  return [
    p.sets ? t("train.sum.sets", { count: p.sets }) : "",
    p.reps ? t("train.sum.reps", { lo: p.reps[0], hi: p.reps[1] }) : "",
    p.rest ? t("train.sum.rest", { rest: restLabel(p.rest) }) : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Pick an exercise: the shared browser (a muscle chip or a few letters), ones this gym can do first. */
function ExercisePicker({ id, label, skip, onPick }: { id: string; label: string; skip: readonly string[]; onPick: (id: string) => void }) {
  const { gyms, profile } = useApp();
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  return (
    <div className="mt-3">
      <p className="mb-1.5 px-1 text-sm text-muted">{label}</p>
      <ExerciseBrowser
        id={id}
        gym={gym}
        skip={skip}
        onPick={onPick}
        action={<Icon name="plus" size={18} />}
        waitForFilter
        groupLabel={label}
      />
    </div>
  );
}

/** One exercise's rest, rep range and sets. Used in Workout preferences and in the workout's How to sheet. */
export function ExercisePrefsEditor({ exerciseId, note }: { exerciseId: string; note?: string }) {
  const { profile, setProfile } = useApp();
  const ex = exercise(exerciseId);
  const own = prefsFor(profile, exerciseId);
  const put = (patch: Parameters<typeof withExercisePrefs>[2]) =>
    setProfile({ training: withExercisePrefs(profile.training, exerciseId, patch) });
  // What "Default" means for this exercise right now, from the lifter's general choices or the app's.
  const general = { ...profile.training, exercises: undefined };
  const defRest = restFor(ex, profile.goal, general);
  const defReps = repRange(ex, profile.goal, general);
  return (
    <div className="pb-2">
      <ChipRow<number>
        label={t("train.ex.rest")}
        value={own.rest ?? 0}
        onPick={(v) => put({ rest: v || undefined })}
        options={[
          [0, t("train.ex.default", { value: restLabel(defRest) })],
          ...REST_OPTIONS.map((x) => [x, restLabel(x)] as [number, string]),
        ]}
      />
      {!TIMED.has(exerciseId) && (
        <ChipRow<string>
          label={t("train.ex.reps")}
          value={rangeKey(own.reps)}
          onPick={(v) => put({ reps: parseRange(v) })}
          options={[
            ["auto", t("train.ex.default", { value: `${defReps[0]}–${defReps[1]}` })],
            ...REP_RANGES.map((r) => [rangeKey(r), `${r[0]}–${r[1]}`] as [string, string]),
          ]}
        />
      )}
      <ChipRow<number>
        label={t("train.ex.sets")}
        value={own.sets ?? 0}
        onPick={(v) => put({ sets: v || undefined })}
        options={[
          [0, profile.training?.sets ? t("train.ex.default", { value: profile.training.sets }) : t("train.ex.defaultAuto")],
          ...SET_OPTIONS.map((n) => [n, String(n)] as [number, string]),
        ]}
      />
      {note && <p className="mt-2 text-xs text-faint">{note}</p>}
    </div>
  );
}

/** A star to add or remove an exercise from favourites. */
export function FavouriteButton({ exerciseId }: { exerciseId: string }) {
  const { profile, setProfile } = useApp();
  const on = isFavourite(profile, exerciseId);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setProfile({ training: toggleFavourite(profile.training, exerciseId) })}
      className={`press inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm ${on ? "border-accent/60 bg-accent/15 text-ink" : "border-line bg-surface text-muted"}`}
    >
      <span aria-hidden className={on ? "text-accent" : ""}>
        {on ? "★" : "☆"}
      </span>
      {on ? t("train.fav.on") : t("train.fav.off")}
    </button>
  );
}
