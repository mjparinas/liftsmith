"use client";

// PR replay on the summary: after a new best, the lift plays back with the lifter's own numbers, rep by
// rep: the 3D figure (LiftDemo) performs the lift that many times, with their bar and plates from their
// gym shown underneath. Respects reduced motion: the figure holds a still pose and the counter shows the end.
import { useEffect, useState } from "react";

import { bodyFor, LiftDemo } from "@/components/demo/LiftDemo";
import type { Pr } from "@/lib/derive";
import { exercise } from "@/lib/exercises";
import { t as tr } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { barFor } from "@/lib/loads";
import { loadBar } from "@/lib/plates";
import { useApp } from "@/lib/store";
import { fmtNum, fromKg } from "@/lib/units";

import { useMyShape } from "./myShape";
import { PlateBar } from "./Plates";
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
            {tr("pr.replay", { name: exercise(p.exerciseId).name })}
          </button>
        ))}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={tr("pr.replayTitle")}>
        {open && <Replay pr={open} />}
      </Sheet>
    </>
  );
}

function Replay({ pr }: { pr: Pr }) {
  const { gyms, profile } = useApp();
  const shape = useMyShape();
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const ex = exercise(pr.exerciseId);
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Remount on "Again" so rep state resets without a sync setState in an effect (keeps the 3D figure
  // from flickering, and satisfies react-hooks/set-state-in-effect).
  const [run, setRun] = useState(0);
  const unit = profile.unit;
  const bar = ex.load === "barbell" && gym ? barFor(ex, gym) : null;
  const loading = bar && gym ? loadBar(fromKg(pr.weight, gym.unit), bar.weight, gym.plates, ex.oneEnd) : null;
  return (
    <div className="text-center">
      <p className="text-sm uppercase tracking-wider text-gold">{tr("pr.newBest")}</p>
      <h3 className="text-2xl font-bold">{ex.name}</h3>
      <p className="num mt-1 text-4xl font-bold">
        {fmtNum(fromKg(pr.weight, unit))} {unit} × {pr.reps}
      </p>
      <div className="mx-auto mt-4 w-full max-w-sm overflow-hidden rounded-2xl bg-raised" aria-hidden>
        <LiftDemo
          key={run}
          exerciseId={pr.exerciseId}
          body={bodyFor(profile.sex)}
          shape={shape}
          reps={pr.reps}
          still={reduced}
          label={tr("pr.demoLabel", { weight: `${fmtNum(fromKg(pr.weight, unit))} ${unit}`, reps: pr.reps })}
          className="h-56"
        />
        {loading && bar && (
          <div className="px-4 pb-3">
            <PlateBar loading={loading} bar={bar.weight} unit={gym!.unit} compact />
          </div>
        )}
      </div>
      <ReplayCount key={run} pr={pr} reduced={reduced} onAgain={() => setRun((r) => r + 1)} />
      <p className="num text-sm text-muted">{tr("pr.estMax", { weight: `${fmtNum(Math.round(fromKg(pr.e1rm, unit)))} ${unit}` })}</p>
    </div>
  );
}

/** Rep counter and Again control. Keyed by `run` so a replay remounts with fresh state. */
function ReplayCount({ pr, reduced, onAgain }: { pr: Pr; reduced: boolean; onAgain: () => void }) {
  // Only the rep counter and "done" flip re-render: a setState every animation frame was remounting work
  // on the 3D figure and made the replay flicker (the figure already advances on its own RAF).
  const [rep, setRep] = useState(reduced ? pr.reps : 1);
  const [done, setDone] = useState(reduced);
  useEffect(() => {
    if (reduced) return;
    const t0 = performance.now();
    const total = pr.reps * REP_MS;
    let raf = 0;
    let shown = 1;
    const tick = (now: number) => {
      const el = now - t0;
      if (el >= total) {
        setRep(pr.reps);
        setDone(true);
        haptic("success");
        return;
      }
      const next = Math.min(pr.reps, Math.floor(el / REP_MS) + 1);
      if (next !== shown) {
        shown = next;
        setRep(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pr.reps, reduced]);
  return (
    <>
      <p className="num mt-3 text-lg font-semibold" aria-live="polite">
        {done ? tr("pr.allReps", { count: pr.reps }) : tr("pr.rep", { n: rep })}
      </p>
      {done && !reduced && (
        <button type="button" onClick={onAgain} className="press mt-3 min-h-11 rounded-full border border-line px-4 text-sm text-muted">
          {tr("pr.again")}
        </button>
      )}
    </>
  );
}
