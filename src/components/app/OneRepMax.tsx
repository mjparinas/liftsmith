"use client";
// The one-rep max calculator and the DOTS score on the Progress screen (Melvin, 2026-11-09). The maths is in
// src/lib/onerm.ts; this file only shows it. All text is in T, so it can move to a message file.
import { exercise } from "@/lib/exercises";
import { allFormulas, allOneRms, dots, dotsBand, dotsFromData, DOTS_LIFTS, estimate, MAX_RTF, oneRm, repTable, type DotsLift, type OneRm, type RirSource } from "@/lib/onerm";
import { useApp } from "@/lib/store";
import type { Unit } from "@/lib/types";
import { fmtNum, fromKg, toKg } from "@/lib/units";
import { haptic } from "@/lib/juice";
import { useNow } from "@/lib/useNow";
import { useMemo, useState } from "react";
import { ago } from "./format";
import { HUE } from "./theme";
import { Chip, EmptyState, Section, Sheet } from "./ui";

const T = {
  title: "Estimated one-rep max",
  showAll: (n: number) => `Show all ${n}`,
  showFewer: "Show fewer",
  emptyTitle: "Trends appear here",
  emptyBody: "Log a few weighted sets and your estimated maxes will chart themselves.",
  needsTwo: "Needs two sessions",
  range: (lo: string, hi: string, unit: string) => `Likely ${lo} to ${hi} ${unit}`,
  confidence: { high: "High confidence", medium: "Medium confidence", low: "Low confidence" },
  fromSetup: "From the max you entered at setup. Log a few sets and it switches to your real lifting.",
  basis: (w: string, unit: string, reps: number, rir: number, when: string) => `Mostly from ${w} ${unit} × ${reps}${rir ? ` with ${rir} in reserve` : " to failure"}, ${when}`,
  rirWhy: {
    reported: "the reserve you reported",
    failure: "an all-out or missed set",
    planned: "the plan's reserve",
    assumed: "an assumed 2 in reserve (logged without one)",
  } satisfies Record<RirSource, string>,
  sessions: (n: number) => `${n} session${n === 1 ? "" : "s"} in the last 6 months`,
  table: "What you could lift",
  tableHead: ["Reps", "% of max", "Weight"],
  tableNote: "To failure. For 2 in reserve, use the row two reps higher.",
  calc: "Try a set",
  calcBody: "Enter any set to see the max it points to.",
  weight: "Weight",
  reps: "Reps",
  rir: "Reps left in the tank",
  less: (what: string) => `Less ${what.toLowerCase()}`,
  more: (what: string) => `More ${what.toLowerCase()}`,
  calcResult: "Estimated max",
  tooMany: `Past ${MAX_RTF} reps to failure no formula is reliable. Try a heavier set.`,
  formulas: "How each formula sees it",
  formulasNote: "Up to 10 reps to failure the estimate averages Brzycki, Epley and the 2026 weight-based equation; above that, Mayhew, Wathan and the 2026 equation. Highlighted ones are in use.",
  method: "Each session's best set counts, with reps in reserve added. Recent, heavy, close-to-failure sets count most, and sets past 20 reps are ignored.",
  pickExercise: "Exercise",
  // DOTS
  dotsTitle: "DOTS score",
  dotsBody: "Your squat, bench and deadlift total scaled for body weight, so lifters of any size compare. Worked out from your estimated maxes.",
  dotsMissing: (names: string) => `Needs an estimated max for ${names}. Log a heavy set of each, or enter them below.`,
  dotsTotal: "Total",
  dotsBw: "Body weight",
  dotsSex: "Formula",
  male: "Men's",
  female: "Women's",
  dotsCalc: "Change the numbers",
  dotsReset: "Use my data",
  dotsNote: "Estimated maxes, not meet lifts. Bands are a rough guide: under 200 beginner, 300 intermediate, 400 advanced, 500 elite.",
  liftName: { squat: "Squat", bench: "Bench", deadlift: "Deadlift" } satisfies Record<DotsLift, string>,
};

const kgTo = (kg: number, unit: Unit) => fmtNum(Math.round(fromKg(kg, unit)));
const kgTo1 = (kg: number, unit: Unit) => fmtNum(Math.round(fromKg(kg, unit) * 10) / 10);

function Trend({ points }: { points: number[] }) {
  if (points.length < 2) return <div className="h-10 text-xs text-faint">{T.needsTwo}</div>;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const w = 120;
  const h = 36;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * w},${h - ((p - min) / Math.max(1, max - min)) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} aria-hidden className="shrink-0">
      <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The Progress screen's list of estimated maxes; tapping one opens its calculator. */
export function OneRmSection() {
  const { events, profile } = useApp();
  const now = useNow(3600_000);
  const unit = profile.unit;
  const list = useMemo(() => allOneRms(events, now, profile), [events, now, profile]);
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const shown = all ? list : list.slice(0, 6);
  return (
    <Section title={T.title} icon="progress" info="e1rm" right={list.length > 6 ? <button type="button" onClick={() => setAll(!all)} className="press min-h-11 text-sm text-accent">{all ? T.showFewer : T.showAll(list.length)}</button> : undefined}>
      <ul className="card divide-y divide-line">
        {shown.map((r) => (
          <li key={r.exerciseId}>
            <button type="button" onClick={() => setOpen(r.exerciseId)} aria-haspopup="dialog" className="press flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
              <div className="min-w-0">
                <div className="truncate font-medium">{exercise(r.exerciseId).name}</div>
                <div className="num text-sm text-muted">{kgTo(r.e1rm, unit)} {unit} <span className="text-faint">· ±{kgTo((r.high - r.low) / 2, unit)}</span></div>
              </div>
              <Trend points={r.trend.map((p) => p.e1rm)} />
            </button>
          </li>
        ))}
        {!list.length && <li><EmptyState icon="progress" tint={HUE.cyan} title={T.emptyTitle} body={T.emptyBody} /></li>}
      </ul>
      {open && <OneRmSheet exerciseId={open} choices={list.map((l) => l.exerciseId)} onPick={setOpen} onClose={() => setOpen(null)} />}
    </Section>
  );
}

function OneRmSheet({ exerciseId, choices, onPick, onClose }: { exerciseId: string; choices: string[]; onPick: (id: string) => void; onClose: () => void }) {
  const { events, profile } = useApp();
  const now = useNow(3600_000);
  const unit = profile.unit;
  const r = useMemo(() => oneRm(events, exerciseId, now, profile), [events, exerciseId, now, profile]);
  return (
    <Sheet open onClose={onClose} title={exercise(exerciseId).name}>
      <label className="block text-sm text-muted">
        {T.pickExercise}
        <select value={exerciseId} onChange={(e) => onPick(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink">
          {choices.map((id) => <option key={id} value={id}>{exercise(id).name}</option>)}
        </select>
      </label>
      {r && <Estimate r={r} unit={unit} now={now} />}
      {r && <RepTable e1rm={r.e1rm} unit={unit} />}
      <SetCalculator unit={unit} seed={r?.basis ? { weight: r.basis.weight, reps: r.basis.reps, rir: r.basis.rir } : undefined} />
      <p className="mt-4 text-xs text-faint">{T.method}</p>
    </Sheet>
  );
}

function Estimate({ r, unit, now }: { r: OneRm; unit: Unit; now: number }) {
  const b = r.basis;
  return (
    <div className="mt-4 rounded-2xl bg-raised p-4" data-testid="onerm-estimate">
      <div className="num text-4xl font-extrabold">{kgTo(r.e1rm, unit)} <span className="text-lg font-semibold text-muted">{unit}</span></div>
      <div className="num mt-1 text-sm text-muted">{T.range(kgTo(r.low, unit), kgTo(r.high, unit), unit)} · {T.confidence[r.confidence]}</div>
      {r.source === "setup" ? (
        <p className="mt-2 text-sm text-muted">{T.fromSetup}</p>
      ) : (
        b && (
          <p className="mt-2 text-sm text-muted">
            {T.basis(kgTo1(b.weight, unit), unit, b.reps, b.rir, ago(b.at, now))} ({T.rirWhy[b.rirSource]}). {T.sessions(r.sessions)}.
          </p>
        )
      )}
    </div>
  );
}

function RepTable({ e1rm, unit }: { e1rm: number; unit: Unit }) {
  const rows = repTable(e1rm, 12);
  return (
    <div className="mt-4">
      <h3 className="font-semibold">{T.table}</h3>
      <table className="num mt-2 w-full text-sm">
        <thead className="text-left text-faint">
          <tr>{T.tableHead.map((h, i) => <th key={h} scope="col" className={`py-1 font-medium ${i ? "text-right" : ""}`}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((x) => (
            <tr key={x.reps}>
              <th scope="row" className="py-1.5 text-left font-medium">{x.reps}</th>
              <td className="py-1.5 text-right text-muted">{x.pct}%</td>
              <td className="py-1.5 text-right">{kgTo1(x.weight, unit)} {unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-xs text-faint">{T.tableNote}</p>
    </div>
  );
}

/** A compact stepper for the calculators: big − and + buttons, no typing (Melvin, 2026-11-09). */
function Bump({ label, value, onChange, step, min = 0, max = 9999, suffix }: { label: string; value: number; onChange: (v: number) => void; step: number; min?: number; max?: number; suffix?: string }) {
  const bump = (d: 1 | -1) => {
    haptic("select");
    onChange(Math.min(max, Math.max(min, Math.round((value + d * step) / step) * step)));
  };
  const btn = "press grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line bg-raised text-xl text-ink active:border-accent/60 active:bg-accent/15";
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-1">
        <button type="button" className={btn} aria-label={T.less(label)} onClick={() => bump(-1)}>−</button>
        <span className="num min-w-0 truncate text-center text-lg font-bold" aria-live="polite">{fmtNum(Math.round(value * 10) / 10)}{suffix ? <span className="text-xs font-normal text-muted"> {suffix}</span> : null}</span>
        <button type="button" className={btn} aria-label={T.more(label)} onClick={() => bump(1)}>+</button>
      </div>
    </div>
  );
}

const weightStep = (unit: Unit) => (unit === "lb" ? 5 : 2.5);

function SetCalculator({ unit, seed }: { unit: Unit; seed?: { weight: number; reps: number; rir: number } }) {
  const [w, setW] = useState(() => (seed ? Math.round(fromKg(seed.weight, unit) / weightStep(unit)) * weightStep(unit) : unit === "lb" ? 135 : 60));
  const [reps, setReps] = useState(seed?.reps ?? 5);
  const [rir, setRir] = useState(Math.min(4, seed?.rir ?? 0));
  const kg = toKg(w, unit);
  const rtf = reps + rir;
  const ok = kg > 0 && rtf >= 1 && rtf <= MAX_RTF;
  const best = ok ? estimate(kg, rtf) : 0;
  const rows = ok ? allFormulas(kg, rtf) : [];
  return (
    <div className="mt-5">
      <h3 className="font-semibold">{T.calc}</h3>
      <p className="text-sm text-muted">{T.calcBody}</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <Bump label={T.weight} value={w} onChange={setW} step={weightStep(unit)} suffix={unit} />
        <Bump label={T.reps} value={reps} onChange={setReps} step={1} min={1} max={30} />
      </div>
      <div className="mt-3 text-xs text-muted">{T.rir}</div>
      <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={T.rir}>
        {[0, 1, 2, 3, 4].map((v) => <Chip key={v} active={rir === v} onClick={() => setRir(v)}>{v === 4 ? "4+" : v}</Chip>)}
      </div>
      {rtf > MAX_RTF && <p className="mt-2 text-sm text-warn">{T.tooMany}</p>}
      {ok && (
        <>
          <p className="mt-3 text-sm text-muted" aria-live="polite">
            {T.calcResult} <span className="num text-xl font-bold text-ink" data-testid="onerm-calc">{kgTo1(best, unit)} {unit}</span>
          </p>
          <details className="mt-2">
            <summary className="press min-h-11 cursor-pointer py-2 text-sm font-semibold text-accent">{T.formulas}</summary>
            <ul className="num divide-y divide-line text-sm">
              {rows.map((f) => (
                <li key={f.id} className={`flex justify-between py-1.5 ${f.used ? "font-semibold text-ink" : "text-muted"}`}>
                  <span>{f.name} ({f.year})</span>
                  <span>{kgTo1(f.e1rm, unit)} {unit}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-faint">{T.formulasNote}</p>
          </details>
        </>
      )}
    </div>
  );
}

/** DOTS from the lifter's own squat, bench and deadlift estimates, with numbers they can change. */
export function DotsCard() {
  const { events, profile } = useApp();
  const now = useNow(3600_000);
  const unit = profile.unit;
  const [sex, setSex] = useState<"male" | "female">(profile.sex ?? "male");
  const rep = useMemo(() => dotsFromData(events, profile, now, sex), [events, profile, now, sex]);
  // Overrides in the lifter's unit, adjusted with steppers.
  const [edit, setEdit] = useState<Partial<Record<DotsLift | "bw", number>>>({});
  const lifts = Object.keys(DOTS_LIFTS) as DotsLift[];
  const kgOf = (k: DotsLift) => (edit[k] !== undefined ? toKg(edit[k]!, unit) : rep.lifts[k]?.e1rm ?? 0);
  const bw = edit.bw !== undefined ? toKg(edit.bw, unit) : rep.bodyweight;
  const total = lifts.reduce((s, k) => s + kgOf(k), 0);
  const complete = lifts.every((k) => kgOf(k) > 0) && bw > 0;
  const score = complete ? dots(total, bw, sex) : null;
  const missing = lifts.filter((k) => !(kgOf(k) > 0)).map((k) => T.liftName[k]);
  const edited = Object.keys(edit).length > 0;
  const step = weightStep(unit);
  const field = (k: DotsLift | "bw") => edit[k] ?? (k === "bw" ? Math.round(fromKg(rep.bodyweight, unit) * 2) / 2 : Math.round(fromKg(rep.lifts[k]?.e1rm ?? 0, unit) / step) * step);
  return (
    <Section title={T.dotsTitle} icon="trophy">
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-accent">
            <span className="num text-2xl font-bold" data-testid="dots-score">{score !== null ? fmtNum(Math.round(score * 10) / 10) : "–"}</span>
          </div>
          <div>
            {score !== null && <p className="font-semibold">{dotsBand(score)}</p>}
            <p className="text-sm text-muted">{score !== null ? T.dotsBody : T.dotsMissing(missing.join(", "))}</p>
          </div>
        </div>
        <div className="num mt-3 flex justify-between text-sm">
          <span className="text-muted">{T.dotsTotal}</span>
          <span>{kgTo(total, unit)} {unit} · {T.dotsBw} {kgTo1(bw, unit)} {unit}</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm" role="group" aria-label={T.dotsSex}>
          <span className="text-muted">{T.dotsSex}</span>
          <Chip active={sex === "male"} onClick={() => setSex("male")}>{T.male}</Chip>
          <Chip active={sex === "female"} onClick={() => setSex("female")}>{T.female}</Chip>
        </div>
        <details className="mt-2">
          <summary className="press min-h-11 cursor-pointer py-2 text-sm font-semibold text-accent">{T.dotsCalc}</summary>
          <div className="mt-1 grid grid-cols-2 gap-3">
            {lifts.map((k) => <Bump key={k} label={T.liftName[k]} value={field(k)} onChange={(v) => setEdit({ ...edit, [k]: v })} step={step} suffix={unit} />)}
            <Bump label={T.dotsBw} value={field("bw")} onChange={(v) => setEdit({ ...edit, bw: v })} step={unit === "lb" ? 1 : 0.5} min={30} suffix={unit} />
          </div>
          {edited && <button type="button" onClick={() => setEdit({})} className="press mt-2 min-h-11 text-sm text-accent">{T.dotsReset}</button>}
        </details>
        <p className="mt-2 text-xs text-faint">{T.dotsNote}</p>
      </div>
    </Section>
  );
}
