"use client";

// Fitness tests on Body › Health (Melvin asked, 2026-11-11; docs/decisions/fitness-tests.md): the dead hang,
// the one-leg stand and the 30-second chair stand. Each row is the one button to its sheet, which has the
// steps, a timer (a 5-second get-ready, then counting up, or down from 30), a − / + box the timer fills (so a
// friend's stopwatch works too), what the result means against a published reference where one exists, what
// helps, the next goal and the lifter's own history. General wellness only, like fitness age.
import { useEffect, useEffectEvent, useMemo, useState } from "react";

import {
  ageOf,
  BALANCE_CAP,
  CHAIR_SECONDS,
  FIT_RANGE,
  FIT_START,
  FIT_TESTS,
  reference,
  resultsOf,
  summarize,
  type FitReference,
  type FitSummary,
  type FitVerdict,
} from "@/lib/fitTests";
import { date, parseNum, t } from "@/lib/i18n";
import { haptic, keepAwake, oops, sound } from "@/lib/juice";
import { useApp } from "@/lib/store";
import type { FitTest } from "@/lib/types";
import { useNow } from "@/lib/useNow";

import { openStats } from "./BodyStats";
import { Icon } from "./icons";
import { BumpField, Button, Chip, Section, Sheet } from "./ui";

const GET_READY = 5;

const TONE: Record<FitVerdict, string> = {
  above: "border-good/50 bg-good/10 text-good",
  topped: "border-good/50 bg-good/10 text-good",
  typical: "border-cyan/45 bg-cyan/10 text-cyan",
  below: "border-line text-muted",
};

/** A result in its unit: "52 s", "14 stands". */
export function fmtResult(test: FitTest, value: number): string {
  return test === "chair" ? t("ft.reps", { count: value }) : t("ft.sec", { n: value });
}

export function FitTestsCard() {
  const { events, profile } = useApp();
  const now = useNow(60_000);
  const [open, setOpen] = useState<FitTest | null>(null);
  const rows = useMemo(() => FIT_TESTS.map((test) => ({ test, s: summarize(events, test, profile, now) })), [events, profile, now]);
  return (
    <Section title={t("ft.title")} icon="bolt">
      <div className="card p-4" data-testid="fit-tests">
        <p className="text-sm text-muted">{t("ft.intro")}</p>
        <ul className="mt-2 divide-y divide-line/70">
          {rows.map(({ test, s }) => (
            <li key={test}>
              <button
                type="button"
                data-testid={`ft-${test}`}
                onClick={() => {
                  haptic("tick");
                  setOpen(test);
                }}
                className="press flex min-h-14 w-full items-center gap-3 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{t(`ft.${test}.name`)}</span>
                  <span className="block text-sm text-muted">{t(`ft.${test}.what`)}</span>
                </span>
                <span className="num text-right text-sm">
                  {s ? (
                    <>
                      <span className="block font-semibold">
                        {fmtResult(test, s.last.value)}
                        {s.eyes === "closed" && <span className="font-normal text-muted"> · {t("ft.eyes.closed")}</span>}
                      </span>
                      <span className={`block ${s.dueIn <= 0 ? "text-accent" : "text-muted"}`}>
                        {s.dueIn <= 0 ? t("ft.due") : t("ft.dueIn", { count: s.dueIn })}
                      </span>
                    </>
                  ) : (
                    <span className="font-semibold text-accent">{t("ft.take")}</span>
                  )}
                </span>
                <Icon name="chevronRight" size={18} className="shrink-0 text-faint" />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-faint">{t("ft.disclaimer")}</p>
      </div>
      <Sheet open={open !== null} onClose={() => setOpen(null)} title={open ? t(`ft.${open}.name`) : ""}>
        {open && <FitTestSheet test={open} />}
      </Sheet>
    </Section>
  );
}

type Phase = "idle" | "ready" | "run";

function FitTestSheet({ test }: { test: FitTest }) {
  const { events, profile, logFitTest } = useApp();
  const latestEyes = useMemo(() => {
    const at = (e: "open" | "closed") => resultsOf(events, "balance", e).at(-1)?.at ?? 0;
    return at("closed") > at("open") ? ("closed" as const) : ("open" as const);
  }, [events]);
  const [eyes, setEyes] = useState<"open" | "closed">(test === "balance" ? latestEyes : "open");
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [tries, setTries] = useState<number[]>([]);
  const [live, setLive] = useState("");
  const now = useNow(60_000);
  const s = useMemo(() => summarize(events, test, profile, now, test === "balance" ? eyes : undefined), [events, test, profile, now, eyes]);
  const ref = useMemo(() => reference(test, ageOf(profile, now), profile.sex, eyes), [test, profile, now, eyes]);
  const [lo, hi] = FIT_RANGE[test];

  const finish = (seconds: number, ended: boolean) => {
    if (test === "chair") {
      setLive(t("ft.live.end"));
      return;
    }
    const v = Math.min(hi, Math.max(lo, Math.round(seconds)));
    setLive(ended ? t("ft.live.end") : t("ft.live.stop", { n: v }));
    if (test === "balance") {
      const all = [...tries, v];
      setTries(all);
      setValue(String(Math.max(...all)));
    } else setValue(String(v));
  };

  const save = () => {
    const n = parseNum(value);
    if (!logFitTest(test, n, test === "balance" ? eyes : undefined)) {
      oops();
      setError(true);
      return;
    }
    setError(false);
    haptic("success");
    sound.done();
    setValue("");
    setTries([]);
  };

  return (
    <div data-testid={`ft-sheet-${test}`}>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm">
        {([1, 2, 3] as const).map((i) => (
          <li key={i}>{t(`ft.${test}.how.${i}`)}</li>
        ))}
      </ol>
      {test === "balance" && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t("ft.eyes")}>
          {(["open", "closed"] as const).map((e) => (
            <Chip
              key={e}
              active={eyes === e}
              onClick={() => {
                setEyes(e);
                setTries([]);
                setValue("");
              }}
            >
              {t(`ft.eyes.${e}`)}
            </Chip>
          ))}
        </div>
      )}

      <Timer test={test} onDone={finish} again={value !== ""} />
      {test === "balance" && tries.length > 0 && (
        <p className="mt-2 text-center text-sm text-muted">{t("ft.tries", { n: Math.min(3, tries.length), best: Math.max(...tries) })}</p>
      )}
      <p className="sr-only" aria-live="polite">
        {live}
      </p>

      <p className="mt-4 text-sm font-semibold">{t(`ft.field.${test}`)}</p>
      <div className="mt-1 flex flex-wrap items-end gap-2">
        <BumpField
          className="min-w-0 flex-1"
          label={t(`ft.field.${test}`)}
          placeholder={String(s?.last.value ?? FIT_START[test])}
          value={value}
          onChange={setValue}
          step={1}
          start={s?.last.value ?? FIT_START[test]}
          min={lo}
          max={hi}
        />
        <Button kind={value === "" ? "ghost" : "primary"} onClick={save} disabled={value.trim() === ""}>
          {t("ft.save")}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-bad">
          {t("ft.range", { min: lo, max: hi })}
        </p>
      )}

      {s && <Result s={s} />}
      {ref ? <p className="mt-3 text-sm text-muted">{refLine(test, ref, eyes)}</p> : <RefMissing test={test} now={now} />}

      <p className="mt-4 text-sm text-muted">{t(`ft.${test}.why`)}</p>
      <History test={test} eyes={test === "balance" ? eyes : undefined} />
      <p className="mt-4 text-xs text-faint">{t("ft.disclaimer")}</p>
    </div>
  );
}

/** What the latest result means, what helps, and the goal for next time. */
function Result({ s }: { s: FitSummary }) {
  const { test } = s;
  const todo = test === "balance" && s.verdict === "topped" ? "ft.todo.topped" : (`ft.todo.${test}` as const);
  return (
    <div className="mt-4 rounded-2xl border border-line/70 p-3" data-testid="ft-result">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="num display text-2xl">{fmtResult(test, s.last.value)}</span>
        {s.verdict && (
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE[s.verdict]}`}>{t(`ft.v.${s.verdict}`)}</span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">
        {t("ft.last", { value: fmtResult(test, s.last.value), date: date(s.last.at, { month: "short", day: "numeric" }) })}
        {s.count > 1 && <> · {t("ft.best", { value: fmtResult(test, s.best) })}</>}
        {s.change !== undefined && s.change !== 0 && (
          <> · {t("ft.change", { change: `${s.change > 0 ? "+" : "−"}${fmtResult(test, Math.abs(s.change))}` })}</>
        )}
      </p>
      <p className="mt-2 text-sm text-ink">{t(todo)}</p>
      {s.goal !== null && <p className="mt-1 text-sm font-semibold">{t("ft.goal", { value: fmtResult(test, s.goal) })}</p>}
    </div>
  );
}

function refLine(test: FitTest, ref: FitReference, eyes: "open" | "closed" = "open"): string {
  const who = t(`ft.who.${ref.sex ?? "all"}`);
  const r = (n: number) => Math.round(n);
  const vars = { who, from: ref.ages[0], to: ref.ages[1], low: r(ref.low), high: r(ref.high) };
  if (ref.source === "stepan") return t("ft.ref.stepan", { who, mean: r(ref.mean ?? 0) });
  if (ref.source === "springer") return t(eyes === "closed" ? "ft.ref.springer.closed" : "ft.ref.springer.open", vars);
  if (ref.source === "lein") return t("ft.ref.lein", vars);
  return t("ft.ref.rikli", vars);
}

/** No reference: ask for age and sex when that's what's missing, otherwise say it compares with yourself. */
function RefMissing({ test, now }: { test: FitTest; now: number }) {
  const { profile } = useApp();
  const age = ageOf(profile, now);
  const needProfile = test !== "hang" && (age === null || (test === "chair" && age >= 60 && !profile.sex));
  return needProfile ? (
    <div className="mt-3">
      <p className="text-sm text-muted">{t("ft.ref.profile")}</p>
      <Button kind="ghost" className="mt-2" onClick={openStats}>
        {t("ft.addProfile")}
      </Button>
    </div>
  ) : (
    <p className="mt-3 text-sm text-muted">{t("ft.ref.self")}</p>
  );
}

function History({ test, eyes }: { test: FitTest; eyes?: "open" | "closed" }) {
  const { events } = useApp();
  const list = useMemo(() => resultsOf(events, test, eyes).slice(-6).reverse(), [events, test, eyes]);
  if (list.length < 2) return null;
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold">{t("ft.history")}</h3>
      <ul className="mt-1 divide-y divide-line/70">
        {list.map((e) => (
          <li key={e.id} className="num flex min-h-10 items-center justify-between text-sm">
            <span className="text-muted">{date(e.at, { year: "numeric", month: "short", day: "numeric" })}</span>
            <span className="font-semibold">{fmtResult(test, e.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The test timer: a 5-second get-ready, then the hang and the one-leg stand count up until Stop (the
 * one-leg stand stops itself at 45 s) and the chair stand counts down from 30. Ticks during the get-ready,
 * the rest-over chime at the end, and the screen stays on while it runs.
 */
function Timer({ test, onDone, again }: { test: FitTest; onDone: (seconds: number, ended: boolean) => void; again: boolean }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [from, setFrom] = useState(0);
  const [now, setNow] = useState(0);
  const [beeped, setBeeped] = useState(-1);
  const limit = test === "chair" ? CHAIR_SECONDS : test === "balance" ? BALANCE_CAP : Infinity;
  const elapsed = phase === "idle" ? 0 : Math.max(0, (now - from) / 1000);
  const readyLeft = Math.ceil(GET_READY - elapsed);
  const runFor = phase === "run" ? Math.max(0, elapsed - GET_READY) : 0;

  // Every tick reads the clock, moves the phase on and plays its sounds.
  const step = useEffectEvent(() => {
    const at = Date.now();
    setNow(at);
    const secs = (at - from) / 1000;
    if (phase === "ready") {
      if (secs >= GET_READY) {
        setPhase("run");
        sound.start();
        haptic("tap");
      } else if (Math.ceil(GET_READY - secs) !== beeped) {
        setBeeped(Math.ceil(GET_READY - secs));
        sound.countdown();
        haptic("select");
      }
    } else if (phase === "run" && secs - GET_READY >= limit) {
      setPhase("idle");
      sound.restEnd();
      haptic("thud");
      onDone(limit, true);
    }
  });

  useEffect(() => {
    if (phase === "idle") return;
    void keepAwake(true);
    const id = setInterval(step, 100);
    return () => {
      clearInterval(id);
      void keepAwake(false);
    };
  }, [phase]);

  const start = () => {
    const t0 = Date.now();
    setFrom(t0);
    setNow(t0);
    setBeeped(-1);
    setPhase("ready");
  };
  const stop = () => {
    const was = phase;
    setPhase("idle");
    if (was === "run" && test !== "chair") onDone(runFor, false);
  };

  const shown =
    phase === "ready"
      ? t("ft.ready", { count: readyLeft })
      : test === "chair"
        ? phase === "run"
          ? Math.ceil(limit - runFor)
          : CHAIR_SECONDS
        : Math.floor(runFor);
  return (
    <div className="mt-4 flex flex-col items-center">
      <div
        role="timer"
        aria-label={t("ft.timer")}
        className={`display num leading-none ${phase === "ready" ? "text-2xl" : "text-[3.5rem]"}`}
      >
        {shown}
      </div>
      {phase === "idle" ? (
        <Button kind={again ? "ghost" : "primary"} className="mt-3 w-full" icon="play" onClick={start}>
          {again ? t("ft.again") : t("ft.start")}
        </Button>
      ) : phase === "run" && test !== "chair" ? (
        <Button className="mt-3 min-h-16 w-full text-lg" onClick={stop}>
          {t("ft.stop")}
        </Button>
      ) : (
        <Button kind="ghost" className="mt-3 w-full" onClick={stop}>
          {t("ft.cancel")}
        </Button>
      )}
    </div>
  );
}
