"use client";

// The public interval timer (/tools/interval-timer/): EMOM, Tabata or custom rounds from the app's own engine
// (intervals.ts), worked out from the start time on every tick so a background tab never drifts. Soft counts
// before each change and a chime when work starts, from the app's sound set (juice.ts). Nothing is stored or sent.
import { useEffect, useRef, useState } from "react";

import {
  changed,
  clampPlan,
  INTERVAL_MODES,
  PRESETS,
  stateAt,
  totalSeconds,
  type IntervalMode,
  type IntervalPlan,
  type IntervalState,
} from "@/lib/intervals";
import { sound } from "@/lib/juice";

import { Choice, NumBox } from "./NumBox";

const NAME: Record<IntervalMode, string> = { emom: "EMOM", tabata: "Tabata", custom: "Your own" };
const PHASE = { ready: "Get ready", work: "Work", rest: "Rest", done: "Done" } as const;

const clock = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function IntervalTimer() {
  const [mode, setMode] = useState<IntervalMode>("emom");
  const [plans, setPlans] = useState(PRESETS);
  const [run, setRun] = useState<{ startedAt: number; pausedAt?: number } | null>(null);
  const [now, setNow] = useState(0);
  const [said, setSaid] = useState("");
  const plan = plans[mode];
  const st = run ? stateAt(plan, (run.pausedAt ?? now) - run.startedAt) : null;
  const running = !!run && run.pausedAt === undefined && st?.phase !== "done";
  const prev = useRef<IntervalState>(stateAt(plan, 0));
  const count = useRef<number | null>(null);

  useEffect(() => {
    if (!running || !run) return;
    const id = setInterval(() => {
      const at = Date.now();
      const next = stateAt(plan, at - run.startedAt);
      if (changed(prev.current, next)) {
        count.current = null;
        if (next.phase === "work") sound.restEnd();
        else if (next.phase === "rest") sound.log();
        else if (next.phase === "done") sound.fanfare();
        setSaid(next.phase === "work" ? `Work, round ${next.round} of ${plan.rounds}` : PHASE[next.phase]);
      } else if (next.left > 0 && next.left <= 3000 && count.current !== Math.ceil(next.left / 1000)) {
        count.current = Math.ceil(next.left / 1000);
        sound.countdown();
      }
      prev.current = next;
      setNow(at);
    }, 200);
    return () => clearInterval(id);
  }, [running, run, plan]);

  const set = (patch: Partial<IntervalPlan>) => setPlans((p) => ({ ...p, [mode]: clampPlan({ ...p[mode], ...patch }) }));
  const start = () => {
    const at = Date.now();
    prev.current = stateAt(plan, 0);
    setNow(at);
    setRun({ startedAt: at });
    sound.start();
  };
  const toggle = () => {
    if (!run) return;
    const at = Date.now();
    if (run.pausedAt === undefined) setRun({ ...run, pausedAt: at });
    else {
      setNow(at);
      setRun({ startedAt: run.startedAt + (at - run.pausedAt) });
    }
  };
  const btn = "btn-primary press min-h-12 rounded-2xl px-5 font-semibold";
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 [&>*]:min-w-0">
      <div className="card space-y-5 p-5">
        <Choice label="Kind" value={mode} options={INTERVAL_MODES.map((m) => [m, NAME[m]] as const)} onChange={(m) => !run && setMode(m)} />
        <NumBox
          key={`${mode}-w`}
          id="work"
          label={mode === "emom" ? "Every (seconds)" : "Work (seconds)"}
          value={plan.work}
          onChange={(n) => set({ work: n })}
          step={5}
          min={5}
          max={600}
        />
        {mode !== "emom" && (
          <NumBox
            key={`${mode}-r`}
            id="rest"
            label="Rest (seconds)"
            value={plan.rest}
            onChange={(n) => set({ rest: n })}
            step={5}
            min={0}
            max={600}
          />
        )}
        <NumBox
          key={`${mode}-n`}
          id="rounds"
          label="Rounds"
          value={plan.rounds}
          onChange={(n) => set({ rounds: n })}
          step={1}
          min={1}
          max={99}
        />
        <p className="text-sm text-muted">Total {clock(totalSeconds(plan) * 1000)}, with a 5-second count-in.</p>
      </div>
      <div className="card flex flex-col items-center justify-center p-5 text-center">
        <div role="timer" aria-label="Interval timer">
          <p className="font-semibold text-muted">{st ? PHASE[st.phase] : "Ready when you are"}</p>
          <p className="display text-7xl font-extrabold">{clock(st ? st.left : plan.work * 1000)}</p>
          <p className="num text-muted">
            Round {Math.max(1, st?.round ?? 1)} of {plan.rounds}
          </p>
        </div>
        <p className="sr-only" aria-live="polite">
          {said}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {!run ? (
            <button type="button" className={btn} onClick={start}>
              Start
            </button>
          ) : (
            <>
              {st?.phase !== "done" && (
                <button type="button" className={btn} onClick={toggle}>
                  {run.pausedAt === undefined ? "Pause" : "Resume"}
                </button>
              )}
              <button
                type="button"
                className="press min-h-12 rounded-2xl border border-line px-5 font-semibold"
                onClick={() => setRun(null)}
              >
                {st?.phase === "done" ? "Start again" : "Reset"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
