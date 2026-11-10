"use client";

// PR replay on the summary: after a new best, the lift plays back with the lifter's own numbers, rep by
// rep: the 3D figure (LiftDemo) performs the lift that many times, with their bar and plates from their
// gym shown underneath. Respects reduced motion: the figure holds a still pose and the counter shows the end.
import { useEffect, useState } from "react";

import { bodyFor, LiftDemo } from "@/components/demo/LiftDemo";
import { PlateBar } from "@/components/PlateBar";
import type { Pr } from "@/lib/derive";
import { exercise } from "@/lib/exercises";
import { haptic } from "@/lib/juice";
import { barFor } from "@/lib/loads";
import { loadBar } from "@/lib/plates";
import { useApp } from "@/lib/store";
import { fmtNum, fromKg } from "@/lib/units";

import { Sheet } from "./ui";

const REP_MS = 1400;

export function PrReplayButton({ prs }: { prs: Pr[] }) {
  const [open, setOpen] = useState<Pr | null>(null);
  if (!prs.length) return null;
  return (
    <>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {prs.map((p) => (
          <button
            key={p.exerciseId}
            type="button"
            onClick={() => {
              haptic("tap");
              setOpen(p);
            }}
            className="press min-h-11 rounded-full border border-gold/40 bg-gold/10 px-4 text-sm font-semibold text-gold"
          >
            ▶ Replay {exercise(p.exerciseId).name}
          </button>
        ))}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title="PR replay">
        {open && <Replay pr={open} />}
      </Sheet>
    </>
  );
}

function Replay({ pr }: { pr: Pr }) {
  const { gyms, profile } = useApp();
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const ex = exercise(pr.exerciseId);
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [t, setT] = useState(reduced ? pr.reps * REP_MS : 0);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const el = now - t0;
      setT(Math.min(el, pr.reps * REP_MS));
      if (el < pr.reps * REP_MS) raf = requestAnimationFrame(tick);
      else haptic("success");
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, pr.reps, reduced]);
  const rep = Math.min(pr.reps, Math.floor(t / REP_MS) + (t >= pr.reps * REP_MS ? 0 : 1));
  const done = t >= pr.reps * REP_MS;
  const unit = profile.unit;
  const bar = ex.load === "barbell" && gym ? barFor(ex, gym) : null;
  const loading = bar && gym ? loadBar(fromKg(pr.weight, gym.unit), bar.weight, gym.plates) : null;
  return (
    <div className="text-center">
      <p className="text-sm uppercase tracking-wider text-gold">New personal best</p>
      <h3 className="text-2xl font-bold">{ex.name}</h3>
      <p className="num mt-1 text-4xl font-bold">
        {fmtNum(fromKg(pr.weight, unit))} {unit} × {pr.reps}
      </p>
      <div className="mx-auto mt-4 w-full max-w-sm overflow-hidden rounded-2xl bg-raised" aria-hidden>
        <LiftDemo
          key={run}
          exerciseId={pr.exerciseId}
          body={bodyFor(profile.sex)}
          reps={pr.reps}
          still={reduced}
          label={`New best: ${fmtNum(fromKg(pr.weight, unit))} ${unit} × ${pr.reps}`}
          className="h-56"
        />
        {loading && bar && (
          <div className="px-4 pb-3">
            <PlateBar loading={loading} bar={bar.weight} unit={gym!.unit} compact />
          </div>
        )}
      </div>
      <p className="num mt-3 text-lg font-semibold" aria-live="polite">
        {done ? `${pr.reps} reps. Every one of them yours.` : `Rep ${rep}`}
      </p>
      <p className="num text-sm text-muted">
        Estimated max now {fmtNum(Math.round(fromKg(pr.e1rm, unit)))} {unit}
      </p>
      {done && !reduced && (
        <button
          type="button"
          onClick={() => {
            setT(0);
            setRun((r) => r + 1);
          }}
          className="press mt-3 min-h-11 rounded-full border border-line px-4 text-sm text-muted"
        >
          Play again
        </button>
      )}
    </div>
  );
}
