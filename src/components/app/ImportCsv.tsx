"use client";
import { track } from "@/lib/analytics";
import { EXERCISES } from "@/lib/exercises";
import { defaultMapping, importEvents, readImport, type ImportFile, type Mapping } from "@/lib/importCsv";
import { haptic } from "@/lib/juice";
import { useApp } from "@/lib/store";
import type { Unit } from "@/lib/types";
import { t } from "@/lib/i18n";
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
    if (f.size > 20_000_000) return setNote(t("imp.tooBig"));
    const read = readImport(await f.text());
    if (!read || !read.workouts.length) return setNote(t("imp.notExport"));
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
    setNote(added ? t("imp.done", { count: out.workouts, sets: out.sets }) : t("imp.already"));
    setFile(null);
  };

  const totalSets = file?.workouts.reduce((n, w) => n + w.sets.length, 0) ?? 0;
  return (
    <div className="mt-3">
      <input ref={input} type="file" accept=".csv,text/csv,text/comma-separated-values" className="sr-only" aria-label={t("imp.fileLabel")} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
      <Button kind="ghost" icon="plus" className="w-full" onClick={() => input.current?.click()}>{t("imp.button")}</Button>
      <p className="mt-2 text-xs text-faint">{t("imp.note")}</p>
      {note && <p className="mt-2 text-sm text-muted" role="status">{note}</p>}
      <Sheet open={!!file} onClose={() => setFile(null)} title={t("imp.title", { source: file ? FORMAT_NAME[file.format] : "" })}>
        {file && (
          <div>
            <p className="text-sm text-muted">
              {t("imp.summary", { count: file.workouts.length, sets: totalSets })}
              {file.skipped ? `. ${t("imp.skipped", { count: file.skipped })}` : ""}. {t("imp.again")}
            </p>
            {file.unit === null && (
              <div className="mt-4">
                <p className="text-sm font-medium">{t("imp.unit")}</p>
                <div className="mt-2 flex gap-2">
                  <Chip active={unit === "kg"} onClick={() => setUnit("kg")}>kg</Chip>
                  <Chip active={unit === "lb"} onClick={() => setUnit("lb")}>lb</Chip>
                </div>
              </div>
            )}
            <h3 className="mt-5 text-sm font-semibold">{t("imp.exercises")}</h3>
            <p className="text-xs text-faint">{t("imp.check")}</p>
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
                    <option value="custom">{t("imp.custom")}</option>
                    {library.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-2">
              <Button icon="check" className="w-full" onClick={run}>{t("imp.import")}</Button>
              <Button kind="quiet" className="w-full" onClick={() => setFile(null)}>{t("imp.cancel")}</Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
