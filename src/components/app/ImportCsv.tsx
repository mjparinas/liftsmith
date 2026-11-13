"use client";

import { useMemo, useRef, useState } from "react";

import { track } from "@/lib/analytics";
import { EXERCISES } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { bodyCounts, bodyEvents, readBody, type BodyFile } from "@/lib/importBody";
import { defaultMapping, importEvents, importRoutines, readImport, repeatedTitles, type ImportFile, type Mapping } from "@/lib/importCsv";
import { haptic } from "@/lib/juice";
import { useApp } from "@/lib/store";
import type { Unit } from "@/lib/types";

import { Button, Chip, InlineSwitch, Sheet } from "./ui";

// Settings › Data › Import from another app: a CSV from Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes or
// Liftsmith's own export (workouts, cardio, and routines rebuilt from named workouts), or a body measurements
// file (Hevy's, FitNotes', or any weigh-in log). The file is read on the device; nothing is uploaded.

const FORMAT_NAME = {
  strong: "Strong",
  hevy: "Hevy",
  fitbod: "Fitbod",
  stronglifts: "StrongLifts",
  jefit: "JEFIT",
  fitnotes: "FitNotes",
  liftsmith: "Liftsmith",
} as const;

function UnitPick({ unit, setUnit }: { unit: Unit; setUnit: (u: Unit) => void }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-medium">{t("imp.unit")}</p>
      <div className="mt-2 flex gap-2">
        <Chip active={unit === "kg"} onClick={() => setUnit("kg")}>
          kg
        </Chip>
        <Chip active={unit === "lb"} onClick={() => setUnit("lb")}>
          lb
        </Chip>
      </div>
    </div>
  );
}

export function ImportWorkouts() {
  const { profile, events, importWorkouts, saveRoutine } = useApp();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<ImportFile | null>(null);
  const [body, setBody] = useState<BodyFile | null>(null);
  const [withRoutines, setWithRoutines] = useState(true);
  const [mapping, setMapping] = useState<Mapping>({});
  const [unit, setUnit] = useState<Unit>(profile.unit);
  const [note, setNote] = useState<string | null>(null);
  const names = useMemo(() => Object.keys(mapping).sort((a, b) => a.localeCompare(b)), [mapping]);
  const library = useMemo(() => [...EXERCISES].sort((a, b) => a.name.localeCompare(b.name)), []);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setNote(null);
    if (f.size > 20_000_000) return setNote(t("imp.tooBig"));
    const text = await f.text();
    const read = readImport(text);
    if (!read || !read.workouts.length) {
      const b = readBody(text);
      if (!b) return setNote(t("imp.notExport"));
      setBody(b);
      setUnit(b.unit ?? profile.unit);
      return;
    }
    setFile(read);
    setMapping(defaultMapping(read));
    setUnit(read.unit ?? profile.unit);
  };

  const run = () => {
    if (!file) return;
    const now = Date.now();
    const out = importEvents(file, mapping, unit, profile.activeGymId, now, new Set(events.map((e) => e.id)));
    const added = importWorkouts(out.events);
    // After the commit, so the file's own exercises are known to the routines.
    const routines = withRoutines ? importRoutines(file, out.events, profile.routines ?? [], now) : [];
    for (const r of [...routines].reverse()) saveRoutine(r);
    haptic("success");
    track("feature", { name: "import", detail: file.format });
    const done = added ? t("imp.done", { count: out.workouts, sets: out.sets }) : t("imp.already");
    setNote(routines.length ? `${done} ${t("imp.routinesDone", { count: routines.length })}` : done);
    setFile(null);
  };

  const runBody = () => {
    if (!body) return;
    const out = bodyEvents(body, unit, events, Date.now());
    const added = out.events.length ? importWorkouts(out.events) : 0;
    haptic("success");
    track("feature", { name: "import", detail: `body-${body.format}` });
    setNote(added ? t("imp.bodyDone", { count: out.weighIns, measures: out.measures }) : t("imp.bodyAlready"));
    setBody(null);
  };

  // Named workouts done twice or more become routines; named on the switch before importing.
  const routineNames = useMemo(
    () => (file ? [...repeatedTitles(file, Number.MAX_SAFE_INTEGER).values()].map((l) => l[0]!.title.trim()) : []),
    [file],
  );

  const totalSets = file?.workouts.reduce((n, w) => n + w.sets.length, 0) ?? 0;
  return (
    <div className="mt-3">
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv,text/comma-separated-values"
        className="sr-only"
        aria-label={t("imp.fileLabel")}
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button kind="ghost" icon="plus" className="w-full" onClick={() => input.current?.click()}>
        {t("imp.button")}
      </Button>
      <p className="mt-2 text-xs text-faint">{t("imp.note")}</p>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
      <Sheet open={!!file} onClose={() => setFile(null)} title={t("imp.title", { source: file ? FORMAT_NAME[file.format] : "" })}>
        {file && (
          <div>
            <p className="text-sm text-muted">
              {t("imp.summary", { count: file.workouts.length, sets: totalSets })}
              {file.skipped ? `. ${t("imp.skipped", { count: file.skipped })}` : ""}. {t("imp.again")}
            </p>
            {file.unit === null && <UnitPick unit={unit} setUnit={setUnit} />}
            {routineNames.length > 0 && (
              <InlineSwitch
                className="mt-4"
                label={t("imp.routines")}
                hint={t("imp.routinesHint", { names: routineNames.slice(0, 4).join(", ") })}
                on={withRoutines}
                onChange={setWithRoutines}
              />
            )}
            <h3 className="mt-5 text-sm font-semibold">{t("imp.exercises")}</h3>
            <p className="text-xs text-faint">{t("imp.check")}</p>
            <ul className="mt-2 divide-y divide-line/70">
              {names.map((n, i) => (
                <li key={n} className="py-2">
                  <label htmlFor={`map-${i}`} className="block truncate text-sm font-medium">
                    {n}
                  </label>
                  <select
                    id={`map-${i}`}
                    value={mapping[n]}
                    onChange={(e) => setMapping({ ...mapping, [n]: e.target.value })}
                    className={`mt-1 min-h-11 w-full rounded-xl border bg-raised px-3 text-sm ${mapping[n] === "custom" ? "border-warn/50" : "border-line"}`}
                  >
                    <option value="custom">{t("imp.custom")}</option>
                    {library.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid gap-2">
              <Button icon="check" className="w-full" onClick={run}>
                {t("imp.import")}
              </Button>
              <Button kind="quiet" className="w-full" onClick={() => setFile(null)}>
                {t("imp.cancel")}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
      <Sheet open={!!body} onClose={() => setBody(null)} title={t("imp.bodyTitle")}>
        {body && (
          <div>
            <p className="text-sm text-muted">
              {t("imp.bodySummary", { count: bodyCounts(body).weighIns, measures: bodyCounts(body).measures })}. {t("imp.bodyAgain")}
            </p>
            {body.unit === null && bodyCounts(body).weighIns > 0 && <UnitPick unit={unit} setUnit={setUnit} />}
            <div className="mt-5 grid gap-2">
              <Button icon="check" className="w-full" onClick={runBody}>
                {t("imp.import")}
              </Button>
              <Button kind="quiet" className="w-full" onClick={() => setBody(null)}>
                {t("imp.cancel")}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
