"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { bodyFor, LiftDemo } from "@/components/demo/LiftDemo";
import { Info } from "@/components/Info";
import { PlateBar, type PlateFinish } from "@/components/PlateBar";
import { cleanA11y } from "@/lib/a11y";
import { track } from "@/lib/analytics";
import { can } from "@/lib/entitlements";
import { exercise } from "@/lib/exercises";
import { COSMETICS } from "@/lib/game";
import { alternatives } from "@/lib/generator";
import { saveWorkout } from "@/lib/health";
import { connectHeartRate, HrError, hrMessage, hrSupported, hrZone, type HrConnection } from "@/lib/heartRate";
import { t } from "@/lib/i18n";
import { activeInjuries, effectFor, PART_LABEL, type Injury } from "@/lib/injury";
import { haptic, keepAwake, oops, sound } from "@/lib/juice";
import { barFor, stepLoad } from "@/lib/loads";
import { loadBar } from "@/lib/plates";
import { epley, TIMED } from "@/lib/progression";
import { notifyPermission, restOverAlert, stopSession, updateSession } from "@/lib/sessionNotify";
import { implementsFor, perSide } from "@/lib/sides";
import { useApp, warmingUp } from "@/lib/store";
import { afterSet, groupRange, linkedToNext, supersetLabel } from "@/lib/superset";
import { effortAim, effortChoices, restAlertOf, restLabel } from "@/lib/training";
import { MUSCLE_LABEL, MUSCLES, type LoadKind, type Muscle } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";
import { prCue, say } from "@/lib/voice";
import { workoutWhy } from "@/lib/why";

import { AutoCount, AutoCountButton, countable, loadCountPrefs, saveCountPrefs, type CountPrefs } from "./AutoCount";
import { burst } from "./burst";
import { MachineSettings, ReplanSheet, WhySheet } from "./CoachExtras";
import { clock, loadText, plateText, repsText } from "./format";
import { Icon } from "./icons";
import { PainSelect } from "./Injuries";
import { go } from "./router";
import { HUE, muscleHue } from "./theme";
import { ExercisePrefsEditor, FavouriteButton } from "./TrainingSettings";
import { Button, EmptyState, LinkToggle, Ring, Sheet, Stepper } from "./ui";
import { GhostLine, PlateChange, restEndCue, RestExtra, SameAsLastChip, useGhost, useVoiceCoach, type VoiceState } from "./WorkoutExtras";
import { AlmostThere, PrMoment } from "./WorkoutJuice";

let hrConn: HrConnection | null = null;

export function Workout() {
  const s = useApp();
  const { active, gyms, profile, events } = s;
  const gym = gyms.find((g) => g.id === active?.plan.gymId) ?? gyms[0];
  const now = useNow(250);
  const [swapOpen, setSwapOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [hrBusy, setHrBusy] = useState(false);
  const [hrError, setHrError] = useState<string | null>(null);
  const [popKey, setPopKey] = useState(0);
  // Camera rep counting (AutoCount.tsx): remembered on this device, front camera by default.
  const [countPrefs, setCountPrefs] = useState<CountPrefs>(loadCountPrefs);
  const changeCount = (p: CountPrefs) => {
    setCountPrefs(p);
    saveCountPrefs(p);
  };
  const logRef = useRef<HTMLDivElement>(null);
  const restRef = useRef<number | null>(null);
  const lastBeep = useRef(0);

  const awake = profile.training?.keepAwake !== false;
  const alert = restAlertOf(profile);
  const scale = profile.training?.effort;
  useEffect(() => {
    void keepAwake(awake);
    void notifyPermission();
    sound.enabled = profile.restSounds;
    return () => void keepAwake(false);
  }, [profile.restSounds, awake]);

  const item = active?.plan.items[active.index];
  const ex = item ? exercise(item.exerciseId) : null;
  const doneSets =
    active && item
      ? events.filter((e) => e.type === "set" && e.sessionId === active.sessionId && e.exerciseId === item.exerciseId).length
      : 0;
  const resting = !!active?.restUntil && active.restUntil > now;
  const left = active?.restUntil ? (active.restUntil - now) / 1000 : 0;
  const finished = !!active && active.index >= active.plan.items.length;
  // The latest note on this exercise (from any workout), and the set just logged, for the optional
  // reps-left rating during rest.
  const noteEv = ex ? [...events].reverse().find((e) => e.type === "note" && e.exerciseId === ex.id) : undefined;
  const note = noteEv?.type === "note" ? noteEv.text : "";
  const lastEv = active ? [...events].reverse().find((e) => e.type === "set" && e.sessionId === active.sessionId) : undefined;
  const lastSet = lastEv?.type === "set" && active && active.lastAt - lastEv.at < 5000 ? lastEv : undefined;
  const rated = !!lastSet && events.some((e) => e.type === "effort" && e.setId === lastSet.id);
  const warming = !!active && warmingUp(active);
  const warmTotal = item?.warmup?.length ?? 0;
  const warmDone = Math.min(active?.warm ?? 0, warmTotal);
  const ssLabel = active && item ? supersetLabel(active.plan.items, active.index) : null;
  // In a superset, which exercise comes after this set (the next one of the round, or back to the first).
  const ssNext = (() => {
    if (!ssLabel || !active || !item) return null;
    const items = active.plan.items;
    const done = (i: number) =>
      events.filter((e) => e.type === "set" && e.sessionId === active.sessionId && e.exerciseId === items[i].exerciseId).length +
      (i === active.index ? 1 : 0);
    const step = afterSet(items, active.index, done);
    const [s0, e0] = groupRange(items, active.index);
    return step.index !== active.index && step.index >= s0 && step.index <= e0 ? exercise(items[step.index].exerciseId).name : null;
  })();
  const setLabel = warming
    ? t("workout.warmupOf", { n: warmDone + 1, total: warmTotal })
    : t("workout.setOf", { n: Math.min(doneSets + 1, item?.sets ?? 1), total: item?.sets ?? 1 });
  // Delightful extras: ghost mode, "same as last time" and the voice coach (WorkoutExtras.tsx).
  const ghost = useGhost(events, item?.exerciseId, active?.sessionId);
  const voiceOn = !!profile.delight?.voice;
  const voiceState: VoiceState | null =
    active && ex && item
      ? {
          exName: ex.name,
          exerciseId: ex.id,
          setNo: Math.min(doneSets + 1, item.sets),
          sets: item.sets,
          kg: active.weight,
          reps: active.reps,
          rir: item.target.rir,
          unit: profile.unit,
          load: ex.load,
          challenge: item.challenge,
          resting,
          left,
          index: active.index,
          warmup: warming,
        }
      : null;
  useVoiceCoach(voiceState, voiceOn);

  // Rest countdown: beeps in the last 3 seconds, then the alert.
  useEffect(() => {
    if (!active?.restUntil) {
      restRef.current = null;
      return;
    }
    restRef.current = active.restUntil;
    const secs = Math.ceil(left);
    if (secs <= 3 && secs > 0 && lastBeep.current !== secs) {
      lastBeep.current = secs;
      sound.countdown(alert.sound);
    }
    if (left <= 0) {
      lastBeep.current = 0;
      // The rest-over alert follows its own setting (Workout preferences), not only Sounds and Vibration.
      sound.restEnd(alert.sound);
      if (alert.vibrate) haptic("thud", true);
      void restOverAlert(ex ? `${ex.name}, ${loadText(ex, active.weight, profile.unit)} × ${active.reps}` : t("wk.nextSet"), alert);
      s.skipRest();
    }
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the live notification in step.
  useEffect(() => {
    if (!active || !ex || !gym) return;
    void updateSession({
      title: resting ? `Rest · ${ex.name}` : ex.name,
      setLabel,
      next: `${loadText(ex, active.weight, profile.unit)} × ${repsText(ex, active.reps)}`,
      plates: plateText(ex, active.weight, gym),
      restUntil: resting ? active.restUntil : null,
      hr: bpm ?? undefined,
      sound: alert.sound,
      vibrate: alert.vibrate,
      // The voice coach's rest-over cue, said by the native service so it's heard with the screen locked.
      speak: voiceOn && resting && voiceState ? restEndCue(voiceState) : undefined,
    });
  }, [active?.index, active?.restUntil, active?.weight, active?.reps, doneSets, warmDone, bpm]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active || !gym) {
    return (
      <div className="card mt-10">
        <EmptyState
          icon="dumbbell"
          mascot="curious"
          title={t("wk.none")}
          body={t("wk.noneBody")}
          action={<Button onClick={() => go("today")}>{t("wk.back")}</Button>}
        />
      </div>
    );
  }

  const elapsed = Math.floor((now - active.startedAt) / 1000);
  const totalSets = active.plan.items.reduce((n, i) => n + i.sets, 0);
  const setsLogged = events.filter((e) => e.type === "set" && e.sessionId === active.sessionId).length;

  const log = () => {
    haptic("tap");
    sound.log();
    if (voiceOn && ex && active.weight > 0) {
      const best = Math.max(0, ...(s.stats.e1rmSeries.get(ex.id) ?? []).map((p) => p.e1rm));
      if (best > 0 && epley(active.weight, active.reps) > best + 0.01) say(prCue(ex.name));
    }
    setPopKey((k) => k + 1);
    // From the top edge of Log set, so the check rises clear of the button's label.
    const r = logRef.current?.getBoundingClientRect();
    if (r) burst({ x: r.left + r.width / 2, y: r.top }, { check: true, count: 12, reach: 80 });
    s.logSet();
  };

  const end = () => {
    const startedAt = active.startedAt;
    const ev = s.finish();
    if (ev?.type === "sessionEnd") void saveWorkout({ start: startedAt, end: ev.at, bodyweightKg: profile.bodyweight, avgHr: ev.avgHr });
    void stopSession();
    hrConn?.disconnect();
    hrConn = null;
    go("done");
  };

  const connectHr = async () => {
    if (hrBusy) return;
    setHrBusy(true);
    setHrError(null);
    try {
      hrConn = await connectHeartRate(
        (b) => {
          setBpm(b);
          s.pushHr(b);
        },
        () => setBpm(null),
      );
      track("feature", { name: "heart_rate", detail: "workout" });
    } catch (e) {
      const msg = e instanceof HrError ? hrMessage(e.problem, e.device) : hrMessage("failed");
      if (msg) {
        setHrError(msg);
        oops();
      }
    } finally {
      setHrBusy(false);
    }
  };

  const unit = gym.unit;
  const canCount = !!ex && countable(ex.id, ex.pattern, countPrefs.source);
  const counting = canCount && countPrefs.on;
  // One-handed controls (Settings › Accessibility): the bump buttons dock beside Log set.
  const hand = cleanA11y(profile.a11y).hand;
  // Per-side exercises (one-arm rows, split squats): both sides the same is the one-tap default;
  // "Sides differ" adds a stepper for the right side.
  const sidesSplit = !!ex && !!active && perSide(ex.id) && active.repsR !== undefined;
  const docked = hand !== "off";
  const weightStep =
    ex && gym && active
      ? {
          label: t("workout.weight"),
          suffix: ex.load === "dumbbell" && implementsFor(ex) === 2 ? t("workout.each", { unit }) : unit,
          value: fmtNum(fromKg(active.weight, unit)),
          onDown: () => s.adjust(stepLoad(active.weight, -1, ex, gym), active.reps),
          onUp: () => s.adjust(stepLoad(active.weight, 1, ex, gym), active.reps),
        }
      : null;
  const repStep =
    ex && active
      ? {
          label: sidesSplit ? t("workout.left") : t("workout.reps"),
          suffix: TIMED.has(ex.id)
            ? t("workout.seconds")
            : sidesSplit
              ? t("workout.leftReps")
              : perSide(ex.id)
                ? t("workout.repsEachSide")
                : t("workout.reps"),
          value: String(active.reps),
          onDown: () => s.adjust(active.weight, active.reps - (TIMED.has(ex.id) ? 5 : 1)),
          onUp: () => s.adjust(active.weight, active.reps + (TIMED.has(ex.id) ? 5 : 1)),
        }
      : null;
  const rightStep =
    ex && active && sidesSplit
      ? {
          label: t("workout.right"),
          suffix: t("workout.rightReps"),
          value: String(active.repsR),
          onDown: () => s.adjustRight(Math.max(0, (active.repsR ?? active.reps) - 1)),
          onUp: () => s.adjustRight((active.repsR ?? active.reps) + 1),
        }
      : null;
  const barbell = ex?.load === "barbell";
  const bar = ex && barbell ? barFor(ex, gym) : null;
  const loading = ex && bar ? loadBar(fromKg(active.weight, unit), bar.weight, gym.plates) : null;
  const zone = bpm ? hrZone(bpm) : null;
  const finish = (COSMETICS.find((c) => c.id === profile.cosmetics?.plates)?.value ?? "classic") as PlateFinish;

  return (
    <div className={docked ? "pb-56" : "pb-44"}>
      <PrMoment />
      <header className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => go("today")}
          className="press -ml-2 inline-flex min-h-11 items-center gap-0.5 rounded-full pl-1 pr-2 text-muted hover:text-ink"
        >
          <Icon name="chevronLeft" size={20} />
          {t("nav.back.today")}
        </button>
        <div className="flex flex-col items-center leading-tight">
          <span className="display text-lg">{clock(elapsed)}</span>
          <span className="num text-[0.6875rem] font-medium text-muted">
            {t("workout.setsDone", { done: setsLogged, total: totalSets })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {bpm ? (
            <span
              className="num flex min-h-9 items-center gap-1 rounded-full border border-line bg-surface px-2.5 text-sm font-bold"
              style={{ color: zone!.colour }}
            >
              <span className="animate-beat inline-flex">
                <Icon name="heart" size={14} filled strokeWidth={1.5} />
              </span>{" "}
              {bpm}
            </span>
          ) : hrSupported() ? (
            <button
              type="button"
              onClick={connectHr}
              disabled={hrBusy}
              aria-busy={hrBusy}
              className="press inline-flex min-h-11 items-center gap-1 rounded-full border border-line px-3 text-sm text-muted"
            >
              <Icon name="heart" size={14} className="text-bad" />
              {hrBusy ? t("hr.connecting") : t("hr.connect")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setEndOpen(true)}
            className="press min-h-11 min-w-11 rounded-full border border-line bg-surface px-4 text-sm font-semibold"
          >
            {t("workout.end")}
          </button>
        </div>
      </header>
      {hrError && !bpm && (
        <div role="alert" className="card mt-2 flex items-start gap-2 p-3 text-sm">
          <Icon name="heart" size={16} className="mt-0.5 shrink-0 text-bad" />
          <p className="flex-1 text-muted">{hrError}</p>
          <button
            type="button"
            onClick={() => setHrError(null)}
            className="press -m-2 min-h-11 min-w-11 rounded-full px-2 text-muted hover:text-ink"
          >
            {t("hr.dismiss")}
          </button>
        </div>
      )}

      <div className="mt-3 flex gap-1" aria-label={t("wk.progress")}>
        {active.plan.items.map((it, i) => (
          <button
            key={i}
            type="button"
            aria-label={exercise(it.exerciseId).name}
            onClick={() => s.goTo(i)}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < active.index ? "bg-mint" : i === active.index ? "bg-gradient-to-r from-accent to-accent-2 shadow-[0_0_10px_rgb(76_141_255/0.6)]" : "bg-line"}`}
          />
        ))}
      </div>

      {finished ? (
        <div className="card animate-pop mt-6 p-6 text-center">
          <div className="text-4xl">🏁</div>
          <h2 className="mt-2 text-2xl font-bold">{t("wk.allDone")}</h2>
          <p className="mt-1 text-muted">{t("wk.allDoneBody")}</p>
          {active.askFeedback && <Feedback name={exercise(active.askFeedback).name} onPick={s.feedback} />}
        </div>
      ) : ex && item ? (
        <>
          <section className="mt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {ssLabel && (
                  <p className="mb-1 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-accent">
                    <Icon name="link" size={13} />
                    {ssLabel}
                  </p>
                )}
                {ssNext && (
                  <p
                    className="mb-1 ml-1.5 inline-flex max-w-full items-center truncate text-xs font-medium text-muted"
                    data-testid="superset-next"
                  >
                    {t("workout.ssThen", { name: ssNext })}
                  </p>
                )}
                <p className="text-sm font-semibold" style={{ color: item.focus ? muscleHue(item.focus) : undefined }}>
                  {item.focus && MUSCLE_LABEL[item.focus]} · {setLabel}
                </p>
                <h1 className="mt-0.5 text-[1.75rem] font-extrabold leading-tight tracking-tight">{ex.name}</h1>
                {note && (
                  <p className="mt-1 text-sm text-muted">
                    <span className="font-semibold text-ink">{t("wk.yourNote")}</span> {note}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {can("replan") && (
                  <button
                    type="button"
                    onClick={() => setPlanOpen(true)}
                    className="press grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-muted hover:text-ink"
                    aria-label={t("coach.changePlan")}
                  >
                    <Icon name="clock" size={20} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSwapOpen(true)}
                  className="press grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-muted hover:text-ink"
                  aria-label={t("workout.swap")}
                >
                  <Icon name="swap" size={20} />
                </button>
              </div>
            </div>
            <MachineSettings exerciseId={ex.id} gym={gym} />
            <div className="mt-2.5 flex items-center gap-1.5" aria-hidden>
              {Array.from({ length: warmTotal }, (_, i) => (
                <span
                  key={`w${i}`}
                  className={`h-1.5 w-4 rounded-full transition-all duration-300 ${i < warmDone ? "bg-mint/60" : warming && i === warmDone ? "bg-accent/70" : "bg-line"}`}
                />
              ))}
              {Array.from({ length: item.sets }, (_, i) => (
                <span
                  key={i}
                  className={`h-2 w-8 rounded-full transition-all duration-300 ${i < doneSets ? "bg-mint" : !warming && i === doneSets ? "w-10 bg-gradient-to-r from-accent to-accent-2" : "bg-line"}`}
                />
              ))}
            </div>
          </section>

          {counting ? (
            <div className="relative mt-4 h-72">
              <AutoCount
                key={`${ex.id}:${countPrefs.facing}:${countPrefs.source}`}
                exerciseId={ex.id}
                pattern={ex.pattern}
                body={bodyFor(profile.sex)}
                bpm={bpm}
                prefs={countPrefs}
                onPrefs={changeCount}
                counting={!resting}
                setKey={`${active.index}:${doneSets}:${warmDone}`}
                onCount={(n) => {
                  const a = useApp.getState().active;
                  if (a) s.adjust(a.weight, n);
                }}
                onClose={() => changeCount({ ...countPrefs, on: false })}
                paused={infoOpen || swapOpen || endOpen}
              />
            </div>
          ) : (
            <div className="relative mt-4 h-52">
              <LiftDemo
                exerciseId={ex.id}
                body={bodyFor(profile.sex)}
                bpm={bpm}
                paused={infoOpen || swapOpen || endOpen}
                className="h-full"
              />
              {/* One way into the how-to sheet: the whole demo card is the button (AGENTS.md "One control, one destination"). */}
              <button type="button" onClick={() => setInfoOpen(true)} className="press absolute inset-0 rounded-2xl">
                <span className="absolute bottom-2 right-2 inline-flex min-h-11 items-center rounded-full border border-line bg-bg/70 px-3 text-sm text-muted">
                  {t("workout.howTo")}
                </span>
              </button>
              {canCount && (
                <AutoCountButton
                  on={false}
                  onToggle={() => changeCount({ ...countPrefs, on: true })}
                  className="absolute bottom-2 left-2"
                />
              )}
            </div>
          )}

          {/* Screen readers hear the rest start, ten seconds left and rest over, not every second. */}
          <p className="sr-only" aria-live="polite">
            {resting
              ? left <= 10
                ? t("workout.sr.tenLeft")
                : t("workout.sr.rest", { time: clock(active.restTotal) })
              : events.some((e) => e.type === "set" && e.sessionId === active.sessionId)
                ? t("workout.sr.over", { load: loadText(ex, active.weight, profile.unit), reps: repsText(ex, active.reps) })
                : ""}
          </p>
          {resting ? (
            <section className="card-tint animate-pop mt-5 flex flex-col items-center p-5" style={{ "--tint": HUE.cyan } as CSSProperties}>
              <Ring value={left / Math.max(1, active.restTotal)} from={HUE.cyan} to={HUE.accent} stroke={14}>
                <div className="text-center">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan">{t("workout.rest")}</div>
                  <div
                    role="timer"
                    aria-label={t("workout.restLeft", { time: clock(left) })}
                    className={`display mt-1 text-[4rem] ${left <= 3.5 ? "animate-pulse text-cyan" : ""}`}
                  >
                    {clock(left)}
                  </div>
                </div>
              </Ring>
              <div className="mt-4 flex gap-3">
                <Button kind="ghost" icon="plus" onClick={() => s.addRest(30)} label={t("workout.add30")}>
                  30 s
                </Button>
                <Button kind="ghost" icon="chevronRight" onClick={() => s.skipRest()}>
                  {t("workout.skipRest")}
                </Button>
              </div>
              <GhostLine
                ghost={ghost}
                logged={events.filter((e) => e.type === "set" && e.sessionId === active.sessionId && e.exerciseId === ex.id)}
                nextIndex={doneSets}
                unit={profile.unit}
              />
              {lastSet && !rated && (
                <Effort
                  target={lastSet.rir}
                  scale={scale}
                  onPick={(r) => {
                    haptic("tick");
                    s.rateEffort(lastSet.id, r);
                  }}
                />
              )}
              {active.askFeedback && <Feedback name={exercise(active.askFeedback).name} onPick={s.feedback} />}
              {lastSet && <PainCheck sessionId={active.sessionId} exerciseId={lastSet.exerciseId} />}
              <div className="mt-5 w-full border-t border-line/70 pt-4">
                <p className="text-center text-sm text-muted">
                  {t("workout.nextUp")}{" "}
                  <span className="font-semibold text-ink">
                    {loadText(ex, active.weight, profile.unit)} × {repsText(ex, active.reps)}
                  </span>
                </p>
                {loading && bar && (
                  <div className="mt-2">
                    <PlateBar loading={loading} bar={bar.weight} unit={unit} compact finish={finish} />
                  </div>
                )}
                <AlmostThere exerciseId={ex.id} weight={active.weight} reps={active.reps} />
                <PlateChange ex={ex} gym={gym} kg={active.weight} sessionId={active.sessionId} />
              </div>
              <RestExtra left={left} gym={gym} />
            </section>
          ) : (
            <section key={popKey} className="card animate-rise mt-5 p-5">
              {active.restReady ? (
                <Button
                  kind="ghost"
                  icon="clock"
                  className="mb-4 w-full"
                  onClick={() => {
                    haptic("tick");
                    s.startRest();
                  }}
                >
                  {t("workout.startRest", { time: restLabel(active.restReady) })}
                </Button>
              ) : null}
              <div className="flex flex-col items-center gap-5">
                {ex.load !== "bodyweight" && weightStep && <Stepper display={docked} {...weightStep} />}
                {ex.load !== "bodyweight" && unit !== profile.unit && active.weight > 0 && (
                  // This gym's plates are in the other unit: show the weight in the lifter's unit too.
                  <p className="num -mt-3 text-sm text-muted">
                    ≈ {fmtNum(Math.round(fromKg(active.weight, profile.unit) * 10) / 10)} {profile.unit}
                    {ex.load === "dumbbell" && implementsFor(ex) === 2 ? " each" : ""}
                  </p>
                )}
                {repStep && <Stepper display={docked} {...repStep} />}
                {rightStep && <Stepper display={docked} {...rightStep} />}
                {!warming && perSide(ex.id) && !TIMED.has(ex.id) && (
                  <button
                    type="button"
                    onClick={() => {
                      haptic("tick");
                      s.adjustRight(sidesSplit ? undefined : active.reps);
                    }}
                    className="press -mt-2 min-h-11 px-3 text-sm font-semibold text-accent"
                  >
                    {sidesSplit ? t("workout.sidesSame") : t("workout.sidesDiffer")}
                  </button>
                )}
              </div>
              {warming ? (
                <div className="mt-4 text-center text-sm text-muted">
                  <p>
                    {t("wk.warmLine")}
                    <Info term="warmup" />
                    {t("wk.working", { load: loadText(ex, item.target.weight, profile.unit) })}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      haptic("tick");
                      s.skipWarmup();
                    }}
                    className="press mt-1 min-h-11 px-3 font-semibold text-accent"
                  >
                    {t("workout.skipWarmup")}
                  </button>
                </div>
              ) : item.setTargets?.[doneSets]?.amrap ? (
                <p className="mt-3 rounded-xl bg-accent/10 px-3 py-2 text-center text-sm font-semibold text-accent">
                  {t("wk.amrap", { n: item.setTargets[doneSets].reps })}
                </p>
              ) : item.slot ? (
                <p className="mt-3 text-center text-sm text-muted">
                  {item.label ? `${item.label} · ` : ""}
                  {item.target.note}
                </p>
              ) : item.challenge && doneSets + 1 === item.sets ? (
                <p className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-ember/40 bg-ember/12 px-3 py-2 text-center text-sm font-semibold text-ember">
                  <Icon name="bolt" size={16} strokeWidth={2.4} />
                  {t("wk.challenge")}
                </p>
              ) : (
                <p className="mt-4 text-center text-sm text-muted">
                  {effortAim(item.target.rir, scale)}
                  <Info term={scale === "rpe" ? "rpe" : "rir"} /> · {workoutWhy(item, active.plan)}{" "}
                  <button
                    type="button"
                    onClick={() => setWhyOpen(true)}
                    className="press inline-flex min-h-11 items-center px-1 text-accent underline underline-offset-2"
                  >
                    {t("coach.why")}
                  </button>
                </p>
              )}
              <SameAsLastChip
                ghost={ghost}
                setIndex={doneSets}
                ex={ex}
                unit={profile.unit}
                weight={active.weight}
                reps={active.reps}
                onUse={(w, r) => s.adjust(w, r)}
              />
              {loading && bar && (
                <div className="mt-4 border-t border-line pt-4">
                  <PlateBar loading={loading} bar={bar.weight} unit={unit} finish={finish} />
                  <PlateChange ex={ex} gym={gym} kg={active.weight} sessionId={active.sessionId} />
                </div>
              )}
            </section>
          )}
        </>
      ) : null}

      {!finished && active.plan.items.length > active.index + 1 && (
        <section className="mt-6">
          <h2 className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{t("workout.comingUp")}</h2>
          <ol className="card divide-y divide-line/70 overflow-hidden">
            {active.plan.items.slice(active.index + 1).map((it, i) => {
              const e = exercise(it.exerciseId);
              const at = active.index + 1 + i;
              const ss = supersetLabel(active.plan.items, at);
              return (
                <li key={it.exerciseId} className={`flex items-center gap-1 pr-2 ${ss ? "bg-accent/5" : ""}`}>
                  <button
                    type="button"
                    onClick={() => s.goTo(at)}
                    className="press flex min-w-0 flex-1 items-center justify-between gap-3 py-3 pl-4 text-left"
                  >
                    <span className="flex min-w-0 flex-col">
                      {ss && <span className="truncate text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-accent">{ss}</span>}
                      <span className="flex min-w-0 items-center gap-2.5 font-medium">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: muscleHue(it.focus) }} aria-hidden />
                        <span className="truncate">{e.name}</span>
                      </span>
                    </span>
                    <span className="num shrink-0 text-sm text-muted">
                      {it.scheme ?? `${it.sets} × ${repsText(e, it.target.reps)}`} · {loadText(e, it.target.weight, profile.unit)}
                    </span>
                  </button>
                  <LinkToggle
                    on={linkedToNext(active.plan.items, at - 1)}
                    first={exercise(active.plan.items[at - 1].exerciseId).name}
                    second={e.name}
                    onToggle={() => s.toggleSuperset(at - 1)}
                  />
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-bg via-bg to-transparent px-5 pt-8">
        <div className="mx-auto max-w-lg">
          {finished ? (
            <Button icon="flag" className="w-full py-5 text-xl" onClick={end}>
              {t("workout.finish")}
            </Button>
          ) : resting ? (
            <Button
              kind="ghost"
              className="w-full py-5 text-xl"
              onClick={() => {
                s.skipRest();
                log();
              }}
            >
              {t("workout.logNow")}
            </Button>
          ) : (
            <div className={docked ? `flex items-stretch gap-3 ${hand === "left" ? "flex-row-reverse" : ""}` : ""}>
              {docked && repStep && (
                <div
                  className="card flex min-w-0 flex-1 flex-col justify-center gap-2 px-2 py-2"
                  role="group"
                  aria-label={t("workout.adjust")}
                >
                  {ex?.load !== "bodyweight" && weightStep && <Stepper compact {...weightStep} />}
                  <Stepper compact {...repStep} />
                  {rightStep && <Stepper compact {...rightStep} />}
                </div>
              )}
              <div ref={logRef} className={`relative ${docked ? "w-[42%] shrink-0" : ""}`}>
                {popKey > 0 && (
                  <span
                    key={popKey}
                    className="animate-burst pointer-events-none absolute inset-0 rounded-2xl border-2 border-accent"
                    aria-hidden
                  />
                )}
                <Button className={`relative w-full text-xl ${docked ? "h-full min-h-28 flex-col" : "py-5"}`} onClick={log}>
                  {warming ? t("workout.logWarmup") : t("workout.logSet")} <Icon name="check" size={24} strokeWidth={2.8} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Sheet open={swapOpen} onClose={() => setSwapOpen(false)} title={t("wk.swapTitle", { name: ex?.name ?? "" })}>
        {ex && (
          <SwapList
            fromId={ex.id}
            gymEquipment={gym}
            skip={active.plan.items.map((i) => i.exerciseId)}
            hurt={activeInjuries(events)}
            onPick={(id, avoid) => {
              s.swap(id, avoid);
              setSwapOpen(false);
              haptic("tap");
              sound.swap();
            }}
          />
        )}
        {ex && (
          <CustomExercise
            muscle={ex.primary[0]}
            onCreate={(c) => {
              const id = s.addCustomExercise(c);
              s.swap(id, false);
              setSwapOpen(false);
              haptic("tap");
              sound.swap();
            }}
          />
        )}
      </Sheet>
      <Sheet open={infoOpen} onClose={() => setInfoOpen(false)} title={ex?.name ?? ""}>
        {ex && (
          <div className="space-y-4">
            <LiftDemo exerciseId={ex.id} body={bodyFor(profile.sex)} bpm={bpm} controls />
            <FavouriteButton exerciseId={ex.id} />
            <p className="text-muted">{ex.setup}</p>
            <ol className="space-y-2">
              {ex.cues.map((c, i) => (
                <li key={c} className="flex gap-3">
                  <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                    {i + 1}
                  </span>
                  {c}
                </li>
              ))}
            </ol>
            <NoteEditor
              key={ex.id + note}
              initial={note}
              onSave={(t) => {
                s.addNote(ex.id, t);
                setInfoOpen(false);
              }}
            />
            <ExercisePrefsEditor exerciseId={ex.id} note={t("train.ex.nextWorkout")} />
          </div>
        )}
      </Sheet>
      <WhySheet open={whyOpen} onClose={() => setWhyOpen(false)} item={item} gym={gym} />
      <ReplanSheet open={planOpen} onClose={() => setPlanOpen(false)} gym={gym} doneOnCurrent={doneSets} />
      <Sheet open={endOpen} onClose={() => setEndOpen(false)} title={t("wk.endTitle")}>
        <div className="space-y-3">
          <Button icon="check" className="w-full" onClick={end}>
            {t("wk.finishSave")}
          </Button>
          <Button
            kind="danger"
            className="w-full"
            onClick={() => {
              haptic("warning");
              sound.back();
              s.discard();
              void stopSession();
              go("today");
            }}
          >
            {t("wk.discard")}
          </Button>
          <Button kind="quiet" className="w-full" onClick={() => setEndOpen(false)}>
            {t("wk.keepGoing")}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function Feedback({ name, onPick }: { name: string; onPick: (r: -1 | 0 | 1) => void }) {
  return (
    <div className="animate-rise mt-4 w-full rounded-2xl border border-line bg-raised/70 p-3 text-center">
      <p className="text-sm text-muted">{t("workout.howWas", { name })}</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {(
          [
            [1, t("workout.tooEasy")],
            [0, t("workout.aboutRight")],
            [-1, t("workout.tooHard")],
          ] as const
        ).map(([r, l]) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              haptic("select");
              sound.tick();
              onPick(r);
            }}
            className="press min-h-11 rounded-xl border border-line bg-surface py-2 text-sm font-medium hover:border-accent/50"
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function SwapList({
  fromId,
  gymEquipment,
  skip,
  hurt,
  onPick,
}: {
  fromId: string;
  gymEquipment: Parameters<typeof alternatives>[1];
  skip: string[];
  hurt: Injury[];
  onPick: (id: string, avoid: boolean) => void;
}) {
  const [avoid, setAvoid] = useState(false);
  const list = alternatives(fromId, gymEquipment, skip, hurt).slice(0, 12);
  return (
    <div>
      <label className="mb-3 flex items-center gap-3 rounded-xl bg-raised p-3 text-sm">
        <input
          type="checkbox"
          checked={avoid}
          onChange={(e) => setAvoid(e.target.checked)}
          className="h-5 w-5 accent-[var(--color-accent)]"
        />
        {t("wk.notHere")}
      </label>
      <ul className="divide-y divide-line">
        {list.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => onPick(e.id, avoid)}
              className="press flex w-full items-center justify-between py-3 text-left"
            >
              <span>
                <span className="block font-medium">{e.name}</span>
                <span className="text-sm text-muted">
                  {e.primary.map((m) => MUSCLE_LABEL[m]).join(", ")}
                  {hurt.length
                    ? effectFor(e, hurt)
                      ? effectFor(e, hurt)!.action === "light"
                        ? t("wk.injuryLoad", { n: effectFor(e, hurt)!.pct ?? 0 })
                        : t("wk.markedFine")
                      : t("wk.avoids")
                    : ""}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
                <Icon name="swap" size={16} />
                {t("wk.swap")}
              </span>
            </button>
          </li>
        ))}
        {!list.length && <li className="py-3 text-muted">{t("wk.noAlt")}</li>}
      </ul>
      <button
        type="button"
        onClick={() => go("injuries")}
        className="press mt-3 w-full rounded-xl border border-line bg-raised px-3 py-3 text-left text-sm"
      >
        {t("wk.hurts")}
        <span className="font-semibold text-accent">{t("wk.logInjury")}</span>
        {t("wk.hurtsAfter")}
      </button>
    </div>
  );
}

/** Optional, during rest: how many more reps the lifter could have done on the set just logged. */
function Effort({ target, scale, onPick }: { target: number; scale?: "rir" | "rpe"; onPick: (rir: number) => void }) {
  const rpe = scale === "rpe";
  const aim = effortChoices(scale).find((c) => c.rir === Math.min(4, target))?.label ?? String(target);
  return (
    <div className="animate-rise mt-4 w-full text-center">
      <p className="text-sm text-muted">
        {rpe ? t("wk.rpeAsk", { aim }) : t("wk.rirAsk", { aim: target })}
        <Info term={rpe ? "rpe" : "rir"} />
      </p>
      <div className="mt-1 grid grid-cols-5 gap-2" role="group" aria-label={rpe ? t("wk.rpeGroup") : t("wk.rirGroup")}>
        {effortChoices(scale).map((c) => (
          <button
            key={c.rir}
            type="button"
            onClick={() => onPick(c.rir)}
            className="press num min-h-11 rounded-xl border border-line bg-surface text-sm font-semibold"
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function NoteEditor({ initial, onSave }: { initial: string; onSave: (text: string) => void }) {
  const [text, setText] = useState(initial);
  return (
    <div className="border-t border-line pt-4">
      <label htmlFor="ex-note" className="text-sm font-semibold">
        {t("wk.noteLabel")}
      </label>
      <textarea
        id="ex-note"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder={t("wk.notePlaceholder")}
        className="mt-1 w-full rounded-xl border border-line bg-raised p-3 text-sm"
      />
      <p className="text-xs text-faint">{t("wk.noteHint")}</p>
      <Button kind="ghost" className="mt-2 w-full" onClick={() => onSave(text)}>
        {t("wk.saveNote")}
      </Button>
    </div>
  );
}

const LOADS: LoadKind[] = ["barbell", "dumbbell", "machine", "kettlebell", "bodyweight"];

/** "Add your own exercise", at the bottom of the swap sheet. */
function CustomExercise({
  muscle,
  onCreate,
}: {
  muscle: Muscle;
  onCreate: (c: { name: string; primary: Muscle; load: LoadKind; compound: boolean }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState<Muscle>(muscle);
  const [load, setLoad] = useState<LoadKind>("machine");
  const [compound, setCompound] = useState(false);
  if (!open)
    return (
      <Button kind="quiet" className="mt-3 w-full" onClick={() => setOpen(true)}>
        {t("wk.addOwn")}
      </Button>
    );
  return (
    <form
      className="mt-4 space-y-3 border-t border-line pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onCreate({ name, primary, load, compound });
      }}
    >
      <h3 className="font-semibold">{t("wk.own")}</h3>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        placeholder={t("wk.ownName")}
        aria-label={t("wk.ownNameLabel")}
        className="w-full rounded-xl border border-line bg-raised px-3 py-3"
      />
      <label className="block text-sm">
        {t("wk.mainMuscle")}
        <select
          value={primary}
          onChange={(e) => setPrimary(e.target.value as Muscle)}
          className="mt-1 w-full rounded-xl border border-line bg-raised px-3 py-3"
        >
          {MUSCLES.map((m) => (
            <option key={m} value={m}>
              {MUSCLE_LABEL[m]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        {t("wk.equipment")}
        <select
          value={load}
          onChange={(e) => setLoad(e.target.value as LoadKind)}
          className="mt-1 w-full rounded-xl border border-line bg-raised px-3 py-3"
        >
          {LOADS.map((v) => (
            <option key={v} value={v}>
              {t(`wk.load.${v}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={compound}
          onChange={(e) => setCompound(e.target.checked)}
          className="h-5 w-5 accent-[var(--color-accent)]"
        />
        {t("wk.compound")}
      </label>
      <button
        type="submit"
        disabled={!name.trim()}
        className="press min-h-11 w-full rounded-2xl bg-accent px-5 py-3 font-semibold text-accent-ink disabled:opacity-40"
      >
        {t("wk.addUse")}
      </button>
    </form>
  );
}

/**
 * Between sets, one optional pain check for an exercise trained despite an injury (lighter, marked
 * fine, or in a graded return): once per exercise per workout, never during a set.
 */
function PainCheck({ sessionId, exerciseId }: { sessionId: string; exerciseId: string }) {
  const { events, ratePain } = useApp();
  const ex = exercise(exerciseId);
  const hurt = activeInjuries(events).filter((i) => effectFor(ex, [i]) && effectFor(ex, [i])!.action !== "skip");
  const asked = (id: string) =>
    events.some((e) => e.type === "pain" && e.injuryId === id && e.sessionId === sessionId && e.exerciseId === exerciseId);
  const todo = hurt.filter((i) => !asked(i.id));
  if (!todo.length) return null;
  return (
    <div className="mt-3 w-full space-y-2">
      {todo.map((i) => (
        <PainSelect
          key={i.id}
          label={t("inj.pain.afterSet", { part: PART_LABEL[i.part] })}
          onRate={(n) => ratePain(i.id, n, { sessionId, exerciseId })}
        />
      ))}
    </div>
  );
}
