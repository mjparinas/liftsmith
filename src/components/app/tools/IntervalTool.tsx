"use client";

// Tools › Interval timer: EMOM, Tabata or custom work and rest rounds (intervals.ts). The state is worked out
// from the start time on every tick, so a locked phone or a background tab never drifts. It ticks only while
// running, keeps the screen awake while it runs, and uses the app's own sounds and haptics (juice.ts): three
// soft counts before each change, the rest-over chime when work starts, a log pair when rest starts, and the
// fanfare at the end. A polite live region says each change for screen readers.
import { useEffect, useRef, useState } from "react";

import { track } from "@/lib/analytics";
import { num, t } from "@/lib/i18n";
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
import { haptic, keepAwake, sound } from "@/lib/juice";

import { BumpField, Button, Chip, Ring, Section } from "../ui";
import { FieldRow, ToolScreen } from "./shared";

const KEY = "liftsmith.intervals";

function loadSaved(): { mode: IntervalMode; plans: Record<IntervalMode, IntervalPlan> } {
  const fallback = { mode: "emom" as IntervalMode, plans: { ...PRESETS } };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const v = JSON.parse(raw) as { mode?: IntervalMode; plans?: Partial<Record<IntervalMode, IntervalPlan>> };
    const plans = { ...PRESETS };
    for (const m of INTERVAL_MODES) if (v.plans?.[m]) plans[m] = clampPlan(v.plans[m]!);
    return { mode: v.mode && INTERVAL_MODES.includes(v.mode) ? v.mode : "emom", plans };
  } catch {
    return fallback;
  }
}

const clock = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

type Run = { startedAt: number; pausedAt?: number } | null;

/** The sound, buzz and screen-reader line for a change of phase or round, or a count in the last 3 seconds. */
function cue(a: IntervalState, b: IntervalState, plan: IntervalPlan, lastCount: { current: number | null }): string | null {
  if (changed(a, b)) {
    lastCount.current = null;
    if (b.phase === "work") {
      sound.restEnd();
      haptic("thud");
      return t("calc.itv.say.work", { round: num(b.round), rounds: num(plan.rounds) });
    }
    if (b.phase === "rest") {
      sound.log();
      haptic("tap");
      return t("calc.itv.say.rest");
    }
    if (b.phase === "done") {
      sound.fanfare();
      haptic("celebrate");
      return t("calc.itv.say.done");
    }
    return null;
  }
  if (b.left > 0 && b.left <= 3000) {
    const sec = Math.ceil(b.left / 1000);
    if (lastCount.current !== sec) {
      lastCount.current = sec;
      sound.countdown();
      haptic("select");
    }
  }
  return null;
}

export function IntervalTool() {
  const [saved] = useState(loadSaved);
  const [mode, setMode] = useState<IntervalMode>(saved.mode);
  const [plans, setPlans] = useState(saved.plans);
  const [run, setRun] = useState<Run>(null);
  const [now, setNow] = useState(() => Date.now());
  const plan = plans[mode];
  const elapsed = run ? (run.pausedAt ?? now) - run.startedAt : 0;
  const st = stateAt(plan, elapsed);
  const prev = useRef<IntervalState>(stateAt(plan, 0));
  const lastCount = useRef<number | null>(null);
  const [said, setSaid] = useState("");
  const running = !!run && run.pausedAt === undefined && st.phase !== "done";

  useEffect(() => track("feature", { name: "tool_intervals" }), []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ mode, plans }));
    } catch {
      // Storage can be off (private window): the timer still works with what's on screen.
    }
  }, [mode, plans]);

  // Tick only while running. Each tick works out where the plan is from the start time and plays the cue for a
  // new phase or the count before one.
  useEffect(() => {
    if (!running || !run) return;
    const id = setInterval(() => {
      const at = Date.now();
      const next = stateAt(plan, at - run.startedAt);
      const said = cue(prev.current, next, plan, lastCount);
      if (said) setSaid(said);
      if (next.phase === "done") track("feature", { name: "tool_intervals_done", detail: mode });
      prev.current = next;
      setNow(at);
    }, 200);
    return () => clearInterval(id);
  }, [running, run, plan, mode]);
  useEffect(() => {
    void keepAwake(running);
    return () => void keepAwake(false);
  }, [running]);

  const setPlan = (patch: Partial<IntervalPlan>) => setPlans({ ...plans, [mode]: clampPlan({ ...plan, ...patch }) });
  const start = () => {
    const at = Date.now();
    prev.current = stateAt(plan, 0);
    lastCount.current = null;
    setNow(at);
    setRun({ startedAt: at });
    sound.start();
  };
  const pause = () => setRun(run && { ...run, pausedAt: Date.now() });
  const resume = () => {
    if (!run?.pausedAt) return;
    const at = Date.now();
    setNow(at);
    setRun({ startedAt: run.startedAt + (at - run.pausedAt) });
  };
  const reset = () => {
    setRun(null);
    setSaid("");
  };

  const phaseColour = st.phase === "rest" ? "var(--color-cyan)" : st.phase === "ready" ? "var(--color-violet)" : undefined;
  const editing = !run;

  return (
    <ToolScreen title={t("calc.itv.title")} blurb={t("calc.itv.blurb")}>
      <Section title={t("calc.itv.kind")}>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("calc.itv.kind")}>
          {INTERVAL_MODES.map((m) => (
            <Chip key={m} active={mode === m} onClick={() => editing && setMode(m)}>
              {t(`calc.itv.mode.${m}`)}
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">{t(`calc.itv.about.${mode}`)}</p>
      </Section>

      {editing && (
        <Section title={t("calc.itv.plan")}>
          <div className="card space-y-4 p-4">
            <FieldRow id="itv-work" label={t(mode === "emom" ? "calc.itv.every" : "calc.itv.work")}>
              <PlanField
                key={`${mode}-work`}
                id="itv-work"
                label={t(mode === "emom" ? "calc.itv.every" : "calc.itv.work")}
                value={plan.work}
                onSet={(n) => setPlan({ work: n })}
                step={5}
                min={5}
                max={600}
              />
            </FieldRow>
            {mode !== "emom" && (
              <FieldRow id="itv-rest" label={t("calc.itv.rest")}>
                <PlanField
                  key={`${mode}-rest`}
                  id="itv-rest"
                  label={t("calc.itv.rest")}
                  value={plan.rest}
                  onSet={(n) => setPlan({ rest: n })}
                  step={5}
                  min={0}
                  max={600}
                />
              </FieldRow>
            )}
            <FieldRow id="itv-rounds" label={t("calc.itv.rounds")}>
              <PlanField
                key={`${mode}-rounds`}
                id="itv-rounds"
                label={t("calc.itv.rounds")}
                value={plan.rounds}
                onSet={(n) => setPlan({ rounds: n })}
                step={1}
                min={1}
                max={99}
              />
            </FieldRow>
            <p className="text-sm text-muted">{t("calc.itv.total", { time: clock(totalSeconds(plan) * 1000) })}</p>
          </div>
        </Section>
      )}

      <div className="mt-7 flex flex-col items-center">
        <Ring value={run ? (st.length ? 1 - st.left / st.length : 1) : 0} colour={phaseColour} size={240}>
          <div className="text-center" role="timer" aria-label={t("calc.itv.title")}>
            <div className="text-sm font-semibold text-muted">{!run ? t("calc.itv.idle") : t(`calc.itv.phase.${st.phase}`)}</div>
            <div className="display num text-6xl" data-testid="interval-clock">
              {clock(run ? st.left : plan.work * 1000)}
            </div>
            <div className="num text-sm text-muted">
              {t("calc.itv.round", { round: num(Math.max(1, st.round)), rounds: num(plan.rounds) })}
            </div>
          </div>
        </Ring>
        <p className="sr-only" aria-live="polite">
          {said}
        </p>
        <div className="mt-5 grid w-full grid-cols-2 gap-3">
          {!run ? (
            <Button className="col-span-2" icon="play" onClick={start}>
              {t("calc.itv.start")}
            </Button>
          ) : st.phase === "done" ? (
            <Button className="col-span-2" onClick={reset}>
              {t("calc.itv.again")}
            </Button>
          ) : (
            <>
              <Button onClick={run.pausedAt ? resume : pause}>{run.pausedAt ? t("calc.itv.resume") : t("calc.itv.pause")}</Button>
              <Button kind="ghost" onClick={reset}>
                {t("calc.itv.reset")}
              </Button>
            </>
          )}
        </div>
      </div>
    </ToolScreen>
  );
}

/** A − / + box for one number of the plan: typing stays as typed until it's a number in range. */
function PlanField(p: { id: string; label: string; value: number; onSet: (n: number) => void; step: number; min: number; max: number }) {
  const [text, setText] = useState(String(p.value));
  return (
    <BumpField
      id={p.id}
      label={p.label}
      value={text}
      onChange={(v) => {
        setText(v);
        const n = Number(v);
        if (Number.isFinite(n) && n >= p.min && n <= p.max) p.onSet(n);
      }}
      step={p.step}
      start={p.value}
      min={p.min}
      max={p.max}
    />
  );
}
