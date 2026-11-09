"use client";
import { track } from "@/lib/analytics";
import { EXERCISES } from "@/lib/exercises";
import { defaultMapping, importEvents, readImport, type ImportFile, type Mapping } from "@/lib/importCsv";
import { haptic } from "@/lib/juice";
import { useApp } from "@/lib/store";
import type { Unit } from "@/lib/types";
import { useMemo, useRef, useState } from "react";
import { Button, Chip, Sheet } from "./ui";

// Settings › Data › Import workouts: a CSV from Strong, Hevy or Liftsmith's own export. The file is
// read on the device; nothing is uploaded.

const FORMAT_NAME = { strong: "Strong", hevy: "Hevy", liftsmith: "Liftsmith" } as const;

export function ImportWorkouts() {
  const { profile, events, importWorkouts } = useApp();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<ImportFile | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [unit, setUnit] = useState<Unit>(profile.unit);
  const [note, setNote] = useState<string | null>(null);
  const names = useMemo(() => Object.keys(mapping).sort((a, b) => a.localeCompare(b)), [mapping]);
  const library = useMemo(() => [...EXERCISES].sort((a, b) => a.name.localeCompare(b.name)), []);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setNote(null);
    if (f.size > 20_000_000) return setNote("That file is too big to import (over 20 MB).");
    const read = readImport(await f.text());
    if (!read || !read.workouts.length) return setNote("That file doesn't look like a workout export from Strong, Hevy or Liftsmith.");
    setFile(read);
    setMapping(defaultMapping(read));
    setUnit(read.unit ?? profile.unit);
  };

  const run = () => {
    if (!file) return;
    const now = Date.now();
    const out = importEvents(file, mapping, unit, profile.activeGymId, now, new Set(events.map((e) => e.id)));
    const added = importWorkouts(out.events);
    haptic("success");
    track("feature", { name: "import", detail: file.format });
    setNote(added ? `Imported ${out.workouts} workout${out.workouts === 1 ? "" : "s"} with ${out.sets} sets.` : "Those workouts are already here.");
    setFile(null);
  };

  const totalSets = file?.workouts.reduce((n, w) => n + w.sets.length, 0) ?? 0;
  return (
    <div className="mt-3">
      <input ref={input} type="file" accept=".csv,text/csv,text/comma-separated-values" className="sr-only" aria-label="CSV file to import" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
      <Button kind="ghost" icon="plus" className="w-full" onClick={() => input.current?.click()}>Import workouts (CSV)</Button>
      <p className="mt-2 text-xs text-faint">From Strong, Hevy, or a Liftsmith export. The file is read on this device and never uploaded.</p>
      {note && <p className="mt-2 text-sm text-muted" role="status">{note}</p>}
      <Sheet open={!!file} onClose={() => setFile(null)} title={`Import from ${file ? FORMAT_NAME[file.format] : ""}`}>
        {file && (
          <div>
            <p className="text-sm text-muted">
              {file.workouts.length} workout{file.workouts.length === 1 ? "" : "s"}, {totalSets} sets
              {file.skipped ? `. ${file.skipped} row${file.skipped === 1 ? "" : "s"} left out (cardio, rest timers or empty sets)` : ""}. Workouts you&apos;ve imported before are skipped.
            </p>
            {file.unit === null && (
              <div className="mt-4">
                <p className="text-sm font-medium">Weights in this file are in</p>
                <div className="mt-2 flex gap-2">
                  <Chip active={unit === "kg"} onClick={() => setUnit("kg")}>kg</Chip>
                  <Chip active={unit === "lb"} onClick={() => setUnit("lb")}>lb</Chip>
                </div>
              </div>
            )}
            <h3 className="mt-5 text-sm font-semibold">Exercises</h3>
            <p className="text-xs text-faint">Check each one. &ldquo;Add as my own&rdquo; creates a custom exercise with that name.</p>
            <ul className="mt-2 divide-y divide-line/70">
              {names.map((n, i) => (
                <li key={n} className="py-2">
                  <label htmlFor={`map-${i}`} className="block truncate text-sm font-medium">{n}</label>
                  <select
                    id={`map-${i}`}
                    value={mapping[n]}
                    onChange={(e) => setMapping({ ...mapping, [n]: e.target.value })}
                    className={`mt-1 min-h-11 w-full rounded-xl border bg-raised px-3 text-sm ${mapping[n] === "custom" ? "border-warn/50" : "border-line"}`}
                  >
                    <option value="custom">Add as my own exercise</option>
                    {library.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-2">
              <Button icon="check" className="w-full" onClick={run}>Import</Button>
              <Button kind="quiet" className="w-full" onClick={() => setFile(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
