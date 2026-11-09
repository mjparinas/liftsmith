"use client";
import { available, EXERCISE_BY_ID, EXERCISES, exercise } from "@/lib/exercises";
import { restFor } from "@/lib/generator";
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
import { MUSCLE_LABEL, MUSCLES, type Muscle, type RestAlert, type TrainingPrefs } from "@/lib/types";
import { useMemo, useState } from "react";
import { go } from "./router";
import { Chip, Section } from "./ui";

// Settings › Workout preferences (Melvin, 2026-11-09): rest times, rep ranges and set counts, RIR or
// RPE, the rest timer, favourite exercises, muscle priorities, the default workout length and the
// first day of the week. Everything is chips and taps, no typing, so it works one-handed. "Auto" always means the app's own choice, so nothing changes until the
// lifter picks something. UI text for this screen lives in this file.

const T = {
  title: "Workout preferences",
  back: "‹ Settings",
  intro: "Auto means the app picks for you from your goal and training block. Changes apply to the next plan.",
  rest: "Rest between sets",
  restCompound: "Big lifts (squats, presses, rows)",
  restIsolation: "Smaller lifts (curls, raises, extensions)",
  reps: "Rep ranges",
  repsNote: "Weights go up when you reach the top of the range on every set, then reps start again from the bottom. Bodyweight exercises keep adding reps.",
  sets: "Sets per exercise",
  setsNote: "Auto plans 3, or 4 on the first big lifts, and adds a set when there's time. Deload weeks and easy days still use fewer.",
  effort: "Effort scale",
  effortNote: "RPE 8 is the same as 2 reps in reserve. The plan works the same either way.",
  timer: "Rest timer",
  autoRest: "Start the rest timer by itself after Log set",
  alert: "When rest ends",
  alertNote: "On iPhone the lock-screen alert can't vibrate without its sound, so Vibration only shows a silent banner there and buzzes when the app is open.",
  awake: "Keep the screen on during a workout",
  length: "Default workout length",
  lengthNote: "The slider on Today goes back to this each day. Last used keeps it wherever you left it.",
  week: "Week starts on",
  weekNote: "For streaks, weekly quests, recaps and weekly stats.",
  priorities: "Muscle priorities",
  prioritiesNote: `Up to ${MAX_PRIORITIES}. They get about a third more sets each week and are planned first when they're recovered.`,
  favourites: "Favourite exercises",
  favouritesNote: "Picked first when they suit the day and your gym has what they need.",
  overrides: "Rest, reps and sets for one exercise",
  overridesNote: "These win over everything above. You can also set them from the exercise's How to sheet during a workout.",
  find: "Add an exercise: pick a muscle",
  findFav: "Add a favourite: pick a muscle",
  none: "None yet.",
};

function ChipRow<V extends string | number>({ label, value, options, onPick }: { label?: string; value: V; options: [V, string][]; onPick: (v: V) => void }) {
  return (
    <div className="mt-2">
      {label && <p className="mb-1.5 px-1 text-sm text-muted">{label}</p>}
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map(([v, l]) => <Chip key={String(v)} active={v === value} onClick={() => onPick(v)}>{l}</Chip>)}
      </div>
    </div>
  );
}

const rangeKey = (r?: [number, number]) => (r ? `${r[0]}-${r[1]}` : "auto");
const parseRange = (k: string): [number, number] | undefined => (k === "auto" ? undefined : (k.split("-").map(Number) as [number, number]));
const onOff = (v: boolean) => (v ? "on" : "off");

export function TrainingSettings() {
  const { profile, setProfile } = useApp();
  const t = profile.training ?? {};
  const put = (patch: Partial<TrainingPrefs>) => setProfile({ training: { ...profile.training, ...patch } });
  const overrides = Object.keys(t.exercises ?? {}).filter((id) => EXERCISE_BY_ID.has(id));
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="pb-24">
      <button type="button" onClick={() => go("settings")} className="press -ml-2 min-h-11 pt-2 text-muted">{T.back}</button>
      <h1 className="text-[28px] font-extrabold tracking-tight">{T.title}</h1>
      <p className="mt-1 text-sm text-muted">{T.intro}</p>

      <Section title={T.rest}>
        <ChipRow<number> label={T.restCompound} value={t.rest?.compound ?? 0} onPick={(v) => put({ rest: { ...t.rest, compound: v || undefined } })} options={[[0, "Auto"], ...REST_OPTIONS.filter((x) => x >= 60).map((x) => [x, restLabel(x)] as [number, string])]} />
        <ChipRow<number> label={T.restIsolation} value={t.rest?.isolation ?? 0} onPick={(v) => put({ rest: { ...t.rest, isolation: v || undefined } })} options={[[0, "Auto"], ...REST_OPTIONS.filter((x) => x <= 150).map((x) => [x, restLabel(x)] as [number, string])]} />
      </Section>

      <Section title={T.reps}>
        <ChipRow<string> label={T.restCompound} value={rangeKey(t.reps?.compound)} onPick={(v) => put({ reps: { ...t.reps, compound: parseRange(v) } })} options={[["auto", "Auto"], ...REP_RANGES.slice(0, 6).map((r) => [rangeKey(r), `${r[0]}–${r[1]}`] as [string, string])]} />
        <ChipRow<string> label={T.restIsolation} value={rangeKey(t.reps?.isolation)} onPick={(v) => put({ reps: { ...t.reps, isolation: parseRange(v) } })} options={[["auto", "Auto"], ...REP_RANGES.slice(2).map((r) => [rangeKey(r), `${r[0]}–${r[1]}`] as [string, string])]} />
        <p className="mt-2 px-1 text-xs text-faint">{T.repsNote}</p>
      </Section>

      <Section title={T.sets}>
        <ChipRow<number> value={t.sets ?? 0} onPick={(v) => put({ sets: v || undefined })} options={[[0, "Auto"], ...SET_OPTIONS.map((n) => [n, String(n)] as [number, string])]} />
        <p className="mt-2 px-1 text-xs text-faint">{T.setsNote}</p>
      </Section>

      <Section title={T.effort} info={t.effort === "rpe" ? "rpe" : "rir"}>
        <ChipRow<string> value={t.effort ?? "rir"} onPick={(v) => put({ effort: v === "rpe" ? "rpe" : undefined })} options={[["rir", "RIR: reps in reserve"], ["rpe", "RPE: 1 to 10"]]} />
        <p className="mt-2 px-1 text-xs text-faint">{T.effortNote}</p>
      </Section>

      <Section title={T.timer}>
        <ChipRow<string> label={T.autoRest} value={onOff(t.autoRest !== false)} onPick={(v) => put({ autoRest: v === "on" ? undefined : false })} options={[["on", "On"], ["off", "Off: I'll tap Start rest"]]} />
        <ChipRow<RestAlert | "app"> label={T.alert} value={t.restAlert ?? "app"} onPick={(v) => put({ restAlert: v === "app" ? undefined : v })} options={[["app", "Follow Sounds and Vibration"], ["both", "Sound and vibration"], ["sound", "Sound only"], ["vibrate", "Vibration only"], ["silent", "Silent"]]} />
        <ChipRow<string> label={T.awake} value={onOff(t.keepAwake !== false)} onPick={(v) => put({ keepAwake: v === "on" ? undefined : false })} options={[["on", "On"], ["off", "Off"]]} />
        <p className="mt-2 px-1 text-xs text-faint">{T.alertNote}</p>
      </Section>

      <Section title={T.length}>
        <ChipRow<number>
          value={t.minutes ?? 0}
          onPick={(v) => {
            put({ minutes: v || undefined });
            if (v) setProfile({ minutes: v });
          }}
          options={[[0, "Last used"], ...LENGTH_OPTIONS.map((m) => [m, `${m} min`] as [number, string])]}
        />
        <p className="mt-2 px-1 text-xs text-faint">{T.lengthNote}</p>
      </Section>

      <Section title={T.week}>
        <ChipRow<number> value={t.weekStart ?? 1} onPick={(v) => put({ weekStart: v === 0 ? 0 : undefined })} options={[[1, "Monday"], [0, "Sunday"]]} />
        <p className="mt-2 px-1 text-xs text-faint">{T.weekNote}</p>
      </Section>

      <Section title={T.priorities}>
        <div className="flex flex-wrap gap-2" role="group" aria-label={T.priorities}>
          {MUSCLES.map((m) => <Chip key={m} active={!!t.priorities?.includes(m)} onClick={() => setProfile({ training: togglePriority(profile.training, m) })}>{MUSCLE_LABEL[m]}</Chip>)}
        </div>
        <p className="mt-2 px-1 text-xs text-faint">{T.prioritiesNote}</p>
      </Section>

      <Section title={T.favourites}>
        <ul className="card divide-y divide-line/70">
          {(t.favourites ?? []).filter((id) => EXERCISE_BY_ID.has(id)).map((id) => (
            <li key={id} className="flex items-center justify-between gap-3 px-4 py-2">
              <span className="min-w-0 truncate">{exercise(id).name}</span>
              <button type="button" onClick={() => setProfile({ training: toggleFavourite(profile.training, id) })} className="press min-h-11 shrink-0 px-2 text-sm text-muted" aria-label={`Remove ${exercise(id).name} from favourites`}>Remove</button>
            </li>
          ))}
          {!t.favourites?.length && <li className="px-4 py-3 text-sm text-muted">{T.none}</li>}
        </ul>
        <ExercisePicker label={T.findFav} skip={t.favourites ?? []} onPick={(id) => setProfile({ training: toggleFavourite(profile.training, id) })} />
        <p className="mt-2 px-1 text-xs text-faint">{T.favouritesNote}</p>
      </Section>

      <Section title={T.overrides}>
        <ul className="card divide-y divide-line/70">
          {overrides.map((id) => (
            <li key={id} className="px-4 py-2">
              <button type="button" onClick={() => setOpen(open === id ? null : id)} className="press flex min-h-11 w-full items-center justify-between gap-3 text-left" aria-expanded={open === id}>
                <span className="min-w-0 truncate">{exercise(id).name}</span>
                <span className="shrink-0 text-sm text-muted">{summary(prefsFor(profile, id))}</span>
              </button>
              {open === id && <ExercisePrefsEditor exerciseId={id} />}
            </li>
          ))}
          {!overrides.length && <li className="px-4 py-3 text-sm text-muted">{T.none}</li>}
        </ul>
        <ExercisePicker label={T.find} skip={overrides} onPick={(id) => setOpen(id)} />
        {open && !overrides.includes(open) && (
          <div className="card mt-2 px-4 py-2">
            <p className="pt-1 font-medium">{exercise(open).name}</p>
            <ExercisePrefsEditor exerciseId={open} />
          </div>
        )}
        <p className="mt-2 px-1 text-xs text-faint">{T.overridesNote}</p>
      </Section>
    </div>
  );
}

function summary(p: { rest?: number; reps?: [number, number]; sets?: number }): string {
  return [p.sets ? `${p.sets} sets` : "", p.reps ? `${p.reps[0]}–${p.reps[1]} reps` : "", p.rest ? `${restLabel(p.rest)} rest` : ""].filter(Boolean).join(" · ");
}

/**
 * Pick an exercise with taps, no typing (Melvin, 2026-11-09: minimal typing, one hand): a muscle
 * chip, then the exercises for it, ones this gym can do first.
 */
function ExercisePicker({ label, skip, onPick }: { label: string; skip: readonly string[]; onPick: (id: string) => void }) {
  const { gyms, profile } = useApp();
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const hits = useMemo(() => {
    if (!muscle) return [];
    const here = new Set(gym ? available(gym.equipment).map((e) => e.id) : []);
    return EXERCISES.filter((e) => !skip.includes(e.id) && e.primary.includes(muscle)).sort((a, b) => Number(here.has(b.id)) - Number(here.has(a.id)) || a.name.localeCompare(b.name));
  }, [muscle, skip, gym]);
  return (
    <div className="mt-3">
      <p className="mb-1.5 px-1 text-sm text-muted">{label}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {MUSCLES.map((m) => <Chip key={m} active={muscle === m} onClick={() => setMuscle(muscle === m ? null : m)}>{MUSCLE_LABEL[m]}</Chip>)}
      </div>
      {hits.length > 0 && (
        <ul className="card mt-2 max-h-80 divide-y divide-line/70 overflow-y-auto">
          {hits.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => { onPick(e.id); setMuscle(null); }} className="press min-h-12 w-full px-4 py-2 text-left">{e.name}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One exercise's rest, rep range and sets. Used in Workout preferences and in the workout's How to sheet. */
export function ExercisePrefsEditor({ exerciseId, note }: { exerciseId: string; note?: string }) {
  const { profile, setProfile } = useApp();
  const ex = exercise(exerciseId);
  const own = prefsFor(profile, exerciseId);
  const put = (patch: Parameters<typeof withExercisePrefs>[2]) => setProfile({ training: withExercisePrefs(profile.training, exerciseId, patch) });
  // What "Default" means for this exercise right now, from the lifter's general choices or the app's.
  const general = { ...profile.training, exercises: undefined };
  const defRest = restFor(ex, profile.goal, general);
  const defReps = repRange(ex, profile.goal, general);
  return (
    <div className="pb-2">
      <ChipRow<number> label="Rest" value={own.rest ?? 0} onPick={(v) => put({ rest: v || undefined })} options={[[0, `Default (${restLabel(defRest)})`], ...REST_OPTIONS.map((x) => [x, restLabel(x)] as [number, string])]} />
      {!TIMED.has(exerciseId) && (
        <ChipRow<string> label="Rep range" value={rangeKey(own.reps)} onPick={(v) => put({ reps: parseRange(v) })} options={[["auto", `Default (${defReps[0]}–${defReps[1]})`], ...REP_RANGES.map((r) => [rangeKey(r), `${r[0]}–${r[1]}`] as [string, string])]} />
      )}
      <ChipRow<number> label="Working sets" value={own.sets ?? 0} onPick={(v) => put({ sets: v || undefined })} options={[[0, profile.training?.sets ? `Default (${profile.training.sets})` : "Default (auto)"], ...SET_OPTIONS.map((n) => [n, String(n)] as [number, string])]} />
      {note && <p className="mt-2 text-xs text-faint">{note}</p>}
    </div>
  );
}

/** A star to add or remove an exercise from favourites. */
export function FavouriteButton({ exerciseId }: { exerciseId: string }) {
  const { profile, setProfile } = useApp();
  const on = isFavourite(profile, exerciseId);
  return (
    <button type="button" aria-pressed={on} onClick={() => setProfile({ training: toggleFavourite(profile.training, exerciseId) })} className={`press inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm ${on ? "border-accent/60 bg-accent/15 text-ink" : "border-line bg-surface text-muted"}`}>
      <span aria-hidden className={on ? "text-accent" : ""}>{on ? "★" : "☆"}</span>
      {on ? "Favourite: planned first when it fits" : "Add to favourites"}
    </button>
  );
}
