"use client";
import { pastWorkoutEvents } from "@/lib/dashboard";
import { EXERCISES, EXERCISE_BY_ID } from "@/lib/exercises";
import { appendEvents } from "@/lib/localdb";
import type { Profile } from "@/lib/types";
import { toKg } from "@/lib/units";
import { useState } from "react";

// Log a workout after the fact, on a big screen: pick the day, add exercises and sets, save. It writes
// the same events a live workout does, so stats, PRs, recovery and progression all pick it up.

interface Row {
  key: string;
  exerciseId: string;
  sets: { weight: string; reps: string }[];
}

const SORTED = [...EXERCISES].sort((a, b) => a.name.localeCompare(b.name));

function localInput(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function weightLabel(exerciseId: string): string {
  const load = EXERCISE_BY_ID.get(exerciseId)?.load;
  if (load === "bodyweight") return "Added weight";
  if (load === "dumbbell" || load === "kettlebell") return "Weight each";
  return "Weight";
}

let n = 0;
const key = () => `row-${++n}`;

export function LogPast({ profile, now, onSaved }: { profile: Profile; now: number; onSaved: (sessionId: string) => void }) {
  const unit = profile.unit;
  const [start, setStart] = useState(() => localInput(now - 3600_000));
  const [minutes, setMinutes] = useState("60");
  const [rows, setRows] = useState<Row[]>([]);
  const [pick, setPick] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const add = () => {
    if (!pick) return;
    setRows((r) => [...r, { key: key(), exerciseId: pick, sets: [{ weight: "", reps: "" }] }]);
    setPick("");
  };
  const edit = (ri: number, si: number, field: "weight" | "reps", v: string) =>
    setRows((r) => r.map((row, i) => (i !== ri ? row : { ...row, sets: row.sets.map((s, j) => (j === si ? { ...s, [field]: v } : s)) })));
  const addSet = (ri: number) => setRows((r) => r.map((row, i) => (i !== ri ? row : { ...row, sets: [...row.sets, { ...row.sets.at(-1)! }] })));
  const dropSet = (ri: number, si: number) =>
    setRows((r) => r.flatMap((row, i) => (i !== ri ? [row] : row.sets.length > 1 ? [{ ...row, sets: row.sets.filter((_, j) => j !== si) }] : [])));
  const dropRow = (ri: number) => setRows((r) => r.filter((_, i) => i !== ri));

  const save = async () => {
    setError("");
    const result = pastWorkoutEvents(
      {
        start: new Date(start).getTime(),
        minutes: Number(minutes),
        gymId: profile.activeGymId,
        exercises: rows.map((r) => ({ exerciseId: r.exerciseId, sets: r.sets.map((s) => ({ weight: toKg(Number(s.weight || 0), unit), reps: Number(s.reps) })) })),
      },
      Date.now(),
    );
    if (!result.ok) return setError(result.error);
    setSaving(true);
    await appendEvents(result.events);
    setSaving(false);
    setRows([]);
    const sid = result.events[0].type === "sessionStart" ? result.events[0].sessionId : "";
    onSaved(sid);
  };

  const input = "card num w-full px-3 py-2";
  return (
    <form
      className="max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <p className="text-muted">Forgot to track a workout, or trained without your phone? Add it here and it counts towards your stats, PRs, streak and next workouts.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-muted">Started</span>
          <input type="datetime-local" required value={start} max={localInput(now)} onChange={(e) => setStart(e.target.value)} className={`${input} mt-1`} />
        </label>
        <label className="block">
          <span className="text-sm text-muted">Length (minutes)</span>
          <input type="number" inputMode="numeric" min={1} max={600} required value={minutes} onChange={(e) => setMinutes(e.target.value)} className={`${input} mt-1`} />
        </label>
      </div>

      <ol className="mt-5 space-y-4">
        {rows.map((row, ri) => (
          <li key={row.key} className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{EXERCISE_BY_ID.get(row.exerciseId)?.name}</h3>
              <button type="button" onClick={() => dropRow(ri)} className="press rounded-xl px-3 py-2 text-sm text-muted">Remove</button>
            </div>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="text-left text-faint">
                  <th scope="col" className="w-10 font-medium">Set</th>
                  <th scope="col" className="font-medium">{weightLabel(row.exerciseId)} ({unit})</th>
                  <th scope="col" className="font-medium">Reps</th>
                  <th scope="col" className="w-12"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {row.sets.map((s, si) => {
                  const name = EXERCISE_BY_ID.get(row.exerciseId)?.name ?? "";
                  return (
                    <tr key={si}>
                      <td className="num py-1 text-muted">{si + 1}</td>
                      <td className="py-1 pr-2">
                        <input inputMode="decimal" type="number" min={0} step="any" value={s.weight} placeholder="0" aria-label={`${name} set ${si + 1} weight`} onChange={(e) => edit(ri, si, "weight", e.target.value)} className={input} />
                      </td>
                      <td className="py-1 pr-2">
                        <input inputMode="numeric" type="number" min={1} step={1} required value={s.reps} aria-label={`${name} set ${si + 1} reps`} onChange={(e) => edit(ri, si, "reps", e.target.value)} className={input} />
                      </td>
                      <td className="py-1 text-right">
                        <button type="button" aria-label={`Remove ${name} set ${si + 1}`} onClick={() => dropSet(ri, si)} className="press h-11 w-11 rounded-xl text-muted">×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button type="button" onClick={() => addSet(ri)} className="press mt-2 rounded-xl border border-line bg-raised px-4 py-2 text-sm">Add set</button>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="block min-w-0 flex-1">
          <span className="text-sm text-muted">Exercise</span>
          <select value={pick} onChange={(e) => setPick(e.target.value)} className={`${input} mt-1`}>
            <option value="">Choose an exercise…</option>
            {SORTED.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </label>
        <button type="button" onClick={add} disabled={!pick} className="press rounded-2xl border border-line bg-raised px-5 py-3 disabled:opacity-40">Add exercise</button>
      </div>

      {error && <p role="alert" className="mt-4 text-bad">{error}</p>}
      <button type="submit" disabled={!rows.length || saving} className="press mt-6 rounded-2xl bg-accent px-6 py-3 font-semibold text-accent-ink disabled:opacity-40">{saving ? "Saving…" : "Save workout"}</button>
    </form>
  );
}
