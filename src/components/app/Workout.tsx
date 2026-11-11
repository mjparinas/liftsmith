"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { bodyFor, LiftDemo } from "@/components/demo/LiftDemo";
import { SCREEN_TITLE } from "@/components/titles";
import { cleanA11y } from "@/lib/a11y";
import { track } from "@/lib/analytics";
import { beatStyle } from "@/lib/beat";
import { bumpDistance, distUnit, fromMetres } from "@/lib/cardio";
import { queueStrava, stravaWorkout } from "@/lib/connections";
import { can } from "@/lib/entitlements";
import { exercise } from "@/lib/exercises";
import { COSMETICS } from "@/lib/game";
import { alternatives } from "@/lib/generator";
import { saveWorkout } from "@/lib/health";
import { hrSupported } from "@/lib/heartRate";
import { hrLink } from "@/lib/hrLink";
import { currentTag, t } from "@/lib/i18n";
import { activeInjuries, effectFor, type Injury } from "@/lib/injury";
import { haptic, isNative, keepAwake, oops, sound } from "@/lib/juice";
import { labOn } from "@/lib/labs";
import { barFor, stepLoad } from "@/lib/loads";
import { loadBar } from "@/lib/plates";
import { epley, TIMED } from "@/lib/progression";
import { fastestMetres } from "@/lib/reps/speedMax";
import { watchCountable } from "@/lib/reps/watchMotion";
import { hrRestCut } from "@/lib/restReady";
import { chipText, notifyPermission, onWatchHeartRate, restOverAlert, stopSession, updateSession } from "@/lib/sessionNotify";
import { implementsFor, perSide } from "@/lib/sides";
import { useApp, warmingUp } from "@/lib/store";
import { afterSet, groupRange, supersetLabel } from "@/lib/superset";
import { restAlertOf } from "@/lib/training";
import { MUSCLE_LABEL, MUSCLES, type LoadKind, type Muscle } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";
import { useNow } from "@/lib/useNow";
import { isVisible, useVisible } from "@/lib/visibility";
import { prCue, say } from "@/lib/voice";
import { pickBpm, type WatchReading } from "@/lib/watchHr";

import { AutoCount, AutoCountButton, countable, loadCountPrefs, saveCountPrefs, type CountPrefs } from "./AutoCount";
import { burst } from "./burst";
import { MachineSettings, ReplanSheet, WhySheet } from "./CoachExtras";
import { ExerciseBrowser } from "./ExerciseBrowser";
import { clock, loadText, plateText, repsText, setText } from "./format";
import { Icon } from "./icons";
import { type PlateFinish } from "./Plates";
import { go } from "./router";
import { muscleHue } from "./theme";
import { ExercisePrefsEditor, FavouriteButton } from "./TrainingSettings";
import { Button, EmptyState, ProTag, Sheet, Stepper } from "./ui";
import { AddExercise } from "./workout/AddExercise";
import { ComingUp } from "./workout/ComingUp";
import { countdownTick, UndoChip } from "./workout/Polish";
import { Feedback, RestCard } from "./workout/RestCard";
import { SetCard } from "./workout/SetCard";
import { recordWarmupSpeed, SpeedNudge, trimWarmupSpeeds } from "./workout/SpeedNudge";
import { useWatchReps } from "./workout/useWatchReps";
import { VoiceLog } from "./workout/VoiceLog";
import { restEndCue, useGhost, useVoiceCoach, type VoiceState } from "./WorkoutExtras";
import { PrMoment } from "./WorkoutJuice";

// However a workout ends (End, Discard, the automatic end of a forgotten one), the heart rate monitor
// is released fully, so the next workout can reach it again.
if (typeof window !== "undefined") {
  useApp.subscribe((st, prev) => {
    if (prev.active && !st.active) void hrLink.stop();
  });
}

/** How often a heart-rate-only change reaches the live notification (iOS's Live Activity has its own 15 s budget). */
export const HR_NOTIFY_MS = 5_000;

export function Workout() {
  const s = useApp();
  const { active, gyms, profile, events } = s;
  const gym = gyms.find((g) => g.id === active?.plan.gymId) ?? gyms[0];
  // While hidden the clock stops (the native notification counts the rest down itself); the web has no
  // native alert, so it asks for one tick when rest ends, for its rest-over notification.
  const restAt = useApp((st) => st.active?.restUntil);
  const now = useNow(250, !isNative() && restAt ? restAt : undefined);
  const visible = useVisible();
  const [swapOpen, setSwapOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [lastBpm, setBpm] = useState<number | null>(null);
  const hr = useSyncExternalStore(hrLink.subscribe, hrLink.get, hrLink.get);
  const hrBusy = hr.status === "connecting";
  const hrError = hr.error;
  // Heart rate from our own watch app (Wear OS, Apple Watch), used when no Bluetooth monitor is live (watchHr.ts).
  const [watchHr, setWatchHr] = useState<WatchReading | null>(null);
  // A reading only counts while the monitor is connected, or while the watch's is fresh.
  const bpm = pickBpm(hr.status === "live" ? lastBpm : null, watchHr, now);
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
    void notifyPermission();
    sound.enabled = profile.restSounds;
  }, [profile.restSounds]);
  // The screen stays on while this screen is in front. The phone drops the lock when the app is hidden,
  // so it's asked for again on return, and let go when the lifter leaves the screen.
  useEffect(() => {
    void keepAwake(awake && visible);
    return () => void keepAwake(false);
  }, [awake, visible]);

  // Heart rate: readings go to this screen and the workout's HR log; a monitor that connected before
  // connects by itself when the workout starts (once, quietly; the Connect button stays as the fallback).
  const sessionId = active?.sessionId;
  useEffect(() => {
    hrLink.onBpm((b) => {
      setBpm(b);
      useApp.getState().pushHr(b);
    });
    if (sessionId && hrSupported()) hrLink.auto(sessionId);
    // The watch's readings go into the workout's log only while no monitor is, so one stream never mixes with another.
    const offWatch = sessionId
      ? onWatchHeartRate((b) => {
          setWatchHr({ bpm: b, at: Date.now() });
          if (hrLink.get().status !== "live") useApp.getState().pushHr(b);
        })
      : () => {};
    return () => {
      hrLink.onBpm(() => {});
      offWatch();
    };
  }, [sessionId]);

  const item = active?.plan.items[active.index];
  const ex = item ? exercise(item.exerciseId) : null;
  const doneSets =
    active && item
      ? events.filter((e) => e.type === "set" && e.sessionId === active.sessionId && e.exerciseId === item.exerciseId && !e.tag).length
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
      events.filter((e) => e.type === "set" && e.sessionId === active.sessionId && e.exerciseId === items[i].exerciseId && !e.tag).length +
      (i === active.index ? 1 : 0);
    const step = afterSet(items, active.index, done);
    const [s0, e0] = groupRange(items, active.index);
    return step.index !== active.index && step.index >= s0 && step.index <= e0 ? exercise(items[step.index].exerciseId).name : null;
  })();
  const setLabel = active?.tag
    ? t(active.tag === "drop" ? "wk.dropSet" : "wk.restPause")
    : warming
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
      countdownTick(alert.vibrate);
    }
    if (left <= 0) {
      lastBeep.current = 0;
      // Rest that ran out while the app was away already got its alert (the native notification, or the
      // web's one tick at restUntil); coming back doesn't chime again.
      const late = left < -2;
      // The rest-over alert follows its own setting (Workout preferences), not only Sounds and Vibration.
      if (!late) sound.restEnd(alert.sound);
      if (alert.vibrate && !late) haptic("thud", true);
      if (!late || !isVisible())
        void restOverAlert(
          ex ? `${ex.name}, ${setText(ex, active.weight, active.reps, profile.unit, active.distanceM)}` : t("wk.nextSet"),
          alert,
        );
      s.skipRest();
    }
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  // Watch rep counting (Labs): the watch streams its motion during a set, unless the camera is already counting.
  const cameraCounting = !!ex && countPrefs.on && labOn("labRepCount") && countable(ex.id, ex.pattern, countPrefs.source);
  const watchCountOn = !!ex && !!active && labOn("labWatchReps") && !resting && !finished && !cameraCounting;
  const watchReps = useWatchReps({
    on: watchCountOn,
    exerciseId: ex?.id,
    pattern: ex?.pattern,
    setKey: `${active?.index}:${doneSets}:${warmDone}:${active?.tag ?? ""}`,
    onCount: (n) => {
      const a = useApp.getState().active;
      if (a) s.adjust(a.weight, n);
    },
  });
  const watchMotion = watchCountOn && !!ex && watchCountable(ex.id, ex.pattern);

  // Heart-rate rest timer (Labs, restReady.ts): once the heart rate is back down, the rest is cut to a few
  // seconds left (never under its floor), once per rest; the countdown above then ends it as usual.
  const hrRest = labOn("labHrRest");
  const lastStart = lastEv?.type === "set" ? lastEv.startedAt : undefined;
  useEffect(() => {
    if (!hrRest || !active || !resting || warming || active.tag || !lastStart) return;
    if (active.hrCut?.restStart === active.restStart) return;
    const cut = hrRestCut(active, lastStart, now);
    if (!cut) return;
    s.cutRest(cut.until, cut);
  }, [now, bpm]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the live notification in step. A new heart rate reading alone (about one a second) updates it at
  // most every HR_NOTIFY_MS, so a locked phone isn't redrawing its notification every second.
  const notified = useRef({ key: "", at: 0 });
  useEffect(() => {
    if (!active || !ex || !gym) return;
    const key = `${active.index}:${active.restUntil}:${active.weight}:${active.reps}:${doneSets}:${warmDone}:${watchMotion}`;
    const t0 = Date.now();
    if (key === notified.current.key && t0 - notified.current.at < HR_NOTIFY_MS) return;
    notified.current = { key, at: t0 };
    void updateSession({
      title: resting ? t("workout.restTitle", { name: ex.name }) : ex.name,
      setLabel,
      next: setText(ex, active.weight, active.reps, profile.unit, active.distanceM),
      plates: plateText(ex, active.weight, gym),
      restUntil: resting ? active.restUntil : null,
      restTotal: resting ? active.restTotal : undefined,
      hr: bpm ?? undefined,
      sound: alert.sound,
      vibrate: alert.vibrate,
      // The voice coach's rest-over cue, said by the native service so it's heard with the screen locked.
      speak: voiceOn && resting && voiceState ? restEndCue(voiceState) : undefined,
      speakLang: currentTag(),
      // Android 16 Live Updates (status bar chip, Samsung's Now Bar) and the iOS Live Activity.
      chip: warming ? chipText(true, warmDone + 1, warmTotal) : chipText(false, Math.min(doneSets + 1, item?.sets ?? 1), item?.sets ?? 1),
      done: events.filter((e) => e.type === "set" && e.sessionId === active.sessionId && !e.tag).length,
      total: active.plan.items.reduce((n, i) => n + i.sets, 0),
      sessionId: active.sessionId,
      motion: watchMotion || undefined,
    });
  }, [active?.index, active?.restUntil, active?.weight, active?.reps, doneSets, warmDone, bpm, watchMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Today's max from warm-ups (its lab): each warm-up's fastest rep while the camera counts it, kept by its
  // place in the ramp. Recorded when the warm-up is logged, whichever way (here, the dock or the notification).
  const speedMaxOn = labOn("labSpeedMax");
  const warmSpeed = useRef<{ key: string; index: number; kg: number; speed: number } | null>(null);
  const exId = item?.exerciseId;
  useEffect(() => {
    if (!sessionId || !exId) return;
    const w = warmSpeed.current;
    if (w && w.key === `${sessionId}:${exId}` && w.index === warmDone - 1)
      recordWarmupSpeed(sessionId, exId, w.index, { kg: w.kg, speed: w.speed });
    trimWarmupSpeeds(sessionId, exId, warmDone);
    warmSpeed.current = null;
  }, [sessionId, exId, warmDone]);

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
  const setsLogged = events.filter((e) => e.type === "set" && e.sessionId === active.sessionId && !e.tag).length;
  // The final working set of the whole workout gets its own label and a bigger burst.
  const lastOfAll = !warming && !finished && setsLogged + 1 >= totalSets;
  // Undo sits above the big button, so the page leaves room for it while it's there.
  const undoShown = !!s.undoable && now <= s.undoable.until;
  // Voice set logging is a lab (Settings › Labs, Pro): a microphone above Log set while it's on.
  const voiceLog = !finished && !!ex && !ex.cardio && labOn("labVoiceLog");

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
    if (r)
      burst(
        { x: r.left + r.width / 2, y: r.top },
        lastOfAll ? { check: true, count: 24, reach: 130 } : { check: true, count: 12, reach: 80 },
      );
    s.logSet();
  };

  const end = () => {
    const startedAt = active.startedAt;
    const ev = s.finish();
    if (ev?.type === "sessionEnd") {
      // The same title and sets Strava gets, as the workout's title and notes in Health Connect or Apple Health.
      const summary = stravaWorkout(useApp.getState().events, ev.sessionId, profile.unit);
      void saveWorkout({
        id: ev.sessionId,
        start: startedAt,
        end: ev.at,
        bodyweightKg: profile.bodyweight,
        avgHr: ev.avgHr,
        title: summary?.name,
        notes: summary?.description,
      });
      queueStrava(ev.sessionId);
    }
    void stopSession();
    go("done");
  };

  const connectHr = async () => {
    await hrLink.tap();
    const st = hrLink.get();
    if (st.error) oops();
    else if (st.status === "live") track("feature", { name: "heart_rate", detail: "workout" });
  };

  const unit = gym.unit;
  // Camera rep counting is a lab (Settings › Labs, Pro): offered only while that lab is on.
  const canCount = !!ex && labOn("labRepCount") && countable(ex.id, ex.pattern, countPrefs.source);
  const counting = canCount && countPrefs.on;
  // The working set the plan wrote, when every set has the same weight (a program's ramp has its own logic).
  const plannedWork =
    item && (!item.setTargets || item.setTargets.every((x) => x.weight === item.setTargets![0]!.weight))
      ? { weight: (item.setTargets?.[0] ?? item.target).weight, reps: (item.setTargets?.[0] ?? item.target).reps, rir: item.target.rir }
      : null;
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
  const cardio = ex?.cardio;
  const dist = distUnit(profile.unit);
  const repStep =
    ex && active && cardio
      ? {
          label: t("workout.time"),
          suffix: t("workout.minSec"),
          value: clock(active.reps),
          onDown: () => s.adjust(active.weight, Math.max(60, active.reps - 60)),
          onUp: () => s.adjust(active.weight, active.reps + 60),
        }
      : ex && active
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
    ex && active && cardio === "distance"
      ? {
          label: t("workout.distance"),
          suffix: dist,
          value: fmtNum(fromMetres(active.distanceM ?? 0, dist)),
          onDown: () => s.adjustDistance(bumpDistance(active.distanceM ?? 0, -1, ex, dist)),
          onUp: () => s.adjustDistance(bumpDistance(active.distanceM ?? 0, 1, ex, dist)),
        }
      : ex && active && sidesSplit
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
  const finish = (COSMETICS.find((c) => c.id === profile.cosmetics?.plates)?.value ?? "classic") as PlateFinish;

  return (
    <div className={docked ? (undoShown || voiceLog ? "pb-[17.5rem]" : "pb-56") : undoShown || voiceLog ? "pb-[14.5rem]" : "pb-44"}>
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
            <span className="num flex min-h-9 items-center gap-1 rounded-full border border-heart/40 bg-surface px-2.5 text-sm font-bold text-heart">
              <span className="animate-beat inline-flex" style={beatStyle(bpm)}>
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
              <Icon name="heart" size={14} className="text-heart" />
              {hr.status === "connecting" ? t("hr.connecting") : hr.status === "reconnecting" ? t("hr.reconnecting") : t("hr.connect")}
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
            onClick={() => hrLink.dismiss()}
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
                <h1 className={`mt-0.5 ${SCREEN_TITLE}`}>{ex.name}</h1>
                {note && (
                  <p className="mt-1 text-sm text-muted">
                    <span className="font-semibold text-ink">{t("wk.yourNote")}</span> {note}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                {/* Changing the plan is Pro: free lifters see the button with a Pro tag, and it opens the paywall. */}
                <button
                  type="button"
                  onClick={() => (can("replan") ? setPlanOpen(true) : go("pro", "replan"))}
                  className="press relative grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-muted hover:text-ink"
                  aria-label={can("replan") ? t("coach.changePlan") : t("pro.locked", { what: t("coach.changePlan") })}
                >
                  <Icon name="clock" size={20} />
                  {!can("replan") && <ProTag className="absolute -right-2 -top-1.5 text-[0.625rem]" />}
                </button>
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
              {/* The camera and pose model shut off while the app is in the background, and start fresh on return. */}
              {visible && (
                <AutoCount
                  key={`${ex.id}:${countPrefs.facing}:${countPrefs.source}`}
                  exerciseId={ex.id}
                  pattern={ex.pattern}
                  body={bodyFor(profile.sex)}
                  heightCm={profile.heightCm}
                  bpm={bpm}
                  hrTrend={active.hr}
                  prefs={countPrefs}
                  onPrefs={changeCount}
                  counting={!resting}
                  setKey={`${active.index}:${doneSets}:${warmDone}`}
                  onCount={(n) => {
                    const a = useApp.getState().active;
                    if (a) s.adjust(a.weight, n);
                  }}
                  onSummary={
                    speedMaxOn
                      ? (sum) => {
                          const a = useApp.getState().active;
                          const v = fastestMetres(sum);
                          if (!a || !warmingUp(a) || v === undefined) return;
                          warmSpeed.current = { key: `${a.sessionId}:${ex.id}`, index: a.warm ?? 0, kg: a.weight, speed: v };
                        }
                      : undefined
                  }
                  onClose={() => changeCount({ ...countPrefs, on: false })}
                  paused={infoOpen || swapOpen || endOpen}
                />
              )}
            </div>
          ) : (
            <div className="relative mt-4 h-52">
              <LiftDemo
                exerciseId={ex.id}
                body={bodyFor(profile.sex)}
                bpm={bpm}
                hrTrend={active.hr}
                paused={infoOpen || swapOpen || endOpen}
                className="h-full"
              />
              {/* One way into the how-to sheet: the whole demo card is the button (AGENTS.md "One control, one destination"). */}
              <button type="button" onClick={() => setInfoOpen(true)} className="press absolute inset-0 rounded-2xl">
                <span className="absolute bottom-2 right-2 inline-flex min-h-11 items-center rounded-full border border-line bg-bg/70 px-3 text-sm text-muted">
                  {t("workout.howTo")}
                </span>
              </button>
              {watchReps !== null && (
                <span
                  className="absolute left-2 top-2 inline-flex min-h-8 items-center gap-1 rounded-full border border-line bg-bg/80 px-3 text-sm font-semibold tabular-nums"
                  data-testid="watch-reps"
                >
                  <Icon name="watch" size={16} className="text-accent" />
                  {t("count.watch", { count: watchReps })}
                </span>
              )}
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
          {speedMaxOn && resting && !warming && warmTotal > 0 && doneSets === 0 && !active.tag && plannedWork && (
            <SpeedNudge
              sessionId={active.sessionId}
              ex={ex}
              gym={gym}
              planned={plannedWork}
              weight={active.weight}
              reps={active.reps}
              onUse={(kg, reps) => s.adjust(kg, reps)}
            />
          )}
          {resting ? (
            <RestCard
              active={active}
              ex={ex}
              gym={gym}
              left={left}
              ghost={ghost}
              doneSets={doneSets}
              lastSet={lastSet}
              rated={rated}
              scale={scale}
              loading={loading}
              bar={bar}
              finish={finish}
              now={now}
              setsLogged={setsLogged}
              lastSetStart={lastEv?.type === "set" ? lastEv.startedAt : undefined}
            />
          ) : (
            <SetCard
              key={popKey}
              active={active}
              item={item}
              ex={ex}
              gym={gym}
              doneSets={doneSets}
              warming={warming}
              docked={docked}
              weightStep={weightStep}
              repStep={repStep}
              rightStep={rightStep}
              sidesSplit={sidesSplit}
              scale={scale}
              ghost={ghost}
              loading={loading}
              bar={bar}
              finish={finish}
              onWhy={() => setWhyOpen(true)}
            />
          )}
        </>
      ) : null}

      {!finished && active.plan.items.length > active.index + 1 && <ComingUp />}
      <AddExercise />

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-bg via-bg to-transparent px-5 pt-8">
        <div className="mx-auto max-w-lg">
          {(undoShown || voiceLog) && (
            <div className="mb-2 flex flex-wrap items-start justify-center gap-2">
              <UndoChip now={now} warmup={!!s.undoable && s.undoable.prev.warm !== undefined && warmingUp(s.undoable.prev)} />
              {voiceLog && <VoiceLog unit={unit} onLog={log} paused={!visible || infoOpen || swapOpen || endOpen || whyOpen || planOpen} />}
            </div>
          )}
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
                  {lastOfAll && (
                    <span
                      className="rounded-full bg-(--btn-ink)/15 px-2.5 py-0.5 text-sm font-bold uppercase tracking-wider"
                      data-testid="last-set"
                    >
                      {t("pol.lastSet")}
                    </span>
                  )}
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
  const [browsing, setBrowsing] = useState(false);
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
      {/* Anything else in the library, searchable and filtered (the best matches stay above). */}
      {browsing ? (
        <div className="mt-3 border-t border-line pt-3">
          <ExerciseBrowser
            id="swap"
            gym={gymEquipment}
            skip={[fromId, ...skip]}
            startGroup={exercise(fromId).cardio ? "cardio" : (exercise(fromId).primary[0] ?? null)}
            onPick={(id) => onPick(id, avoid)}
            action={<Icon name="swap" size={16} />}
          />
        </div>
      ) : (
        <Button kind="quiet" className="mt-2 w-full" onClick={() => setBrowsing(true)}>
          {t("wk.find.all")}
        </Button>
      )}
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
